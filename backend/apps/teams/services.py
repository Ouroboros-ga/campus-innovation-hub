"""组队帖子和申请的行锁事务。"""

from collections.abc import Mapping, Sequence

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.competitions.models import Competition
from apps.domain_errors import CannotApplyOwn, CapacityFull, DuplicateApplication, InvalidState, NotFound, PermissionDenied, TimeWindowClosed
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.teams.models import TeamApplication, TeamPost, TeamRole


def _published_competition(competition_id: object) -> Competition:
    competition = Competition.objects.filter(
        id=competition_id,
        publication_state=Competition.PublicationState.PUBLISHED,
    ).first()
    if competition is None:
        raise NotFound("竞赛不存在或当前不可用。")
    return competition


def _replace_roles(*, post: TeamPost, roles: Sequence[Mapping[str, object]]) -> None:
    """以岗位名稳定匹配全量输入，避免静默删除已有申请引用的岗位。"""

    requested = {str(item["name"]): item for item in roles}
    existing_roles = list(TeamRole.objects.select_for_update().filter(team_post=post))
    for role in existing_roles:
        payload = requested.pop(role.name, None)
        if payload is None:
            if TeamApplication.objects.filter(desired_role=role).exists():
                raise InvalidState("已有申请引用的岗位不能删除。")
            role.delete()
            continue
        role.headcount = int(payload["headcount"])
        role.requirements = payload.get("requirements") or None
        role.skills = payload.get("skills") or None
        role.sort_order = int(payload["sort_order"])
        role.save(update_fields=["headcount", "requirements", "skills", "sort_order", "updated_at"])

    TeamRole.objects.bulk_create(
        [
            TeamRole(
                team_post=post,
                name=name,
                headcount=int(payload["headcount"]),
                requirements=payload.get("requirements") or None,
                skills=payload.get("skills") or None,
                sort_order=int(payload["sort_order"]),
            )
            for name, payload in requested.items()
        ]
    )


def _sync_post_capacity_status(post: TeamPost) -> None:
    accepted_count = TeamApplication.objects.filter(team_post=post, status=TeamApplication.Status.ACCEPTED).count()
    current_count = post.base_member_count + accepted_count
    if current_count > post.target_member_count:
        raise InvalidState("目标人数不能小于当前已接受成员数。")
    if post.status == TeamPost.Status.FULL and current_count < post.target_member_count:
        post.status = TeamPost.Status.RECRUITING
    elif post.status == TeamPost.Status.RECRUITING and current_count >= post.target_member_count:
        post.status = TeamPost.Status.FULL


@transaction.atomic
def create_team_post(*, actor: User, payload: Mapping[str, object]) -> TeamPost:
    """创建帖子与岗位；状态、作者和审计字段均不来自客户端。"""

    values = dict(payload)
    competition = _published_competition(values.pop("competition_id"))
    roles = values.pop("roles")
    assert isinstance(roles, Sequence)
    post = TeamPost.objects.create(competition=competition, author=actor, **values)
    _replace_roles(post=post, roles=roles)
    _sync_post_capacity_status(post)
    post.save(update_fields=["status", "updated_at"])
    record_audit(actor=actor, action="TEAM_POST_CREATED", target=post, changes={"competition_id": str(competition.id)})
    return post


@transaction.atomic
def update_team_post(*, actor: User, team: TeamPost, payload: Mapping[str, object]) -> TeamPost:
    """锁住帖子和申请，再校验容量并处理可选的全量岗位替换。"""

    post = TeamPost.objects.select_for_update().get(pk=team.pk)
    if post.author_id != actor.id and not actor.is_superuser:
        raise PermissionDenied
    if post.status == TeamPost.Status.CLOSED:
        raise InvalidState("已关闭的组队帖子不能编辑。")
    list(TeamApplication.objects.select_for_update().filter(team_post=post).only("id"))

    values = dict(payload)
    roles = values.pop("roles", None)
    if "competition_id" in values:
        post.competition = _published_competition(values.pop("competition_id"))
    changed_fields: list[str] = []
    for field, value in values.items():
        setattr(post, field, value)
        changed_fields.append(field)
    if roles is not None:
        assert isinstance(roles, Sequence)
        _replace_roles(post=post, roles=roles)
    _sync_post_capacity_status(post)
    changed_fields.extend(["competition", "status", "updated_at"])
    post.save(update_fields=sorted(set(changed_fields)))
    record_audit(actor=actor, action="TEAM_POST_UPDATED", target=post, changes={"fields": sorted(payload)})
    return post


@transaction.atomic
def close_team_post(*, actor: User, team: TeamPost) -> None:
    post = TeamPost.objects.select_for_update().get(pk=team.pk)
    if post.author_id != actor.id and not actor.is_superuser:
        raise PermissionDenied
    if post.status == TeamPost.Status.CLOSED:
        raise InvalidState
    previous_status = post.status
    post.status = TeamPost.Status.CLOSED
    post.closed_at = timezone.now()
    post.save(update_fields=["status", "closed_at", "updated_at"])
    record_audit(
        actor=actor,
        action="TEAM_POST_CLOSED",
        target=post,
        changes={"status": {"from": previous_status, "to": TeamPost.Status.CLOSED}},
    )


@transaction.atomic
def create_team_application(
    *, actor: User, team: TeamPost, payload: Mapping[str, object], desired_role: TeamRole | None
) -> TeamApplication:
    """提交申请时锁住帖子与岗位，防止关闭、满员或岗位变更的竞态。"""

    post = TeamPost.objects.select_for_update().select_related("author").get(pk=team.pk)
    if post.author_id == actor.id:
        raise CannotApplyOwn
    if post.status != TeamPost.Status.RECRUITING:
        raise TimeWindowClosed("当前组队帖子不可申请。")
    accepted_count = TeamApplication.objects.filter(team_post=post, status=TeamApplication.Status.ACCEPTED).count()
    if post.base_member_count + accepted_count >= post.target_member_count:
        raise CapacityFull
    locked_role = None
    if desired_role is not None:
        locked_role = TeamRole.objects.select_for_update().filter(pk=desired_role.pk, team_post=post).first()
        if locked_role is None:
            raise NotFound("申请岗位不存在。")
        role_accepted_count = TeamApplication.objects.filter(
            desired_role=locked_role,
            status=TeamApplication.Status.ACCEPTED,
        ).count()
        if role_accepted_count >= locked_role.headcount:
            raise CapacityFull
    if TeamApplication.objects.filter(
        team_post=post,
        applicant=actor,
        status__in=[TeamApplication.Status.PENDING, TeamApplication.Status.ACCEPTED],
    ).exists():
        raise DuplicateApplication

    values = dict(payload)
    try:
        with transaction.atomic():
            application = TeamApplication.objects.create(
                team_post=post,
                desired_role=locked_role,
                applicant=actor,
                **values,
            )
    except IntegrityError as error:
        raise DuplicateApplication from error
    create_notification(
        recipient=post.author,
        notification_type=Notification.NotificationType.TEAM,
        title="收到新的组队申请",
        body=f"有人申请加入“{post.title}”。",
        action_path=f"/teams/{post.id}",
        dedupe_key=f"team-application:{application.id}:submitted",
    )
    record_audit(actor=actor, action="TEAM_APPLICATION_CREATED", target=application, changes={"team_post_id": str(post.id)})
    return application


@transaction.atomic
def withdraw_team_application(*, actor: User, application: TeamApplication) -> None:
    """按帖子、申请的锁顺序读取，避免和提交/处理申请互相等待。"""

    basis = TeamApplication.objects.only("id", "team_post_id").filter(pk=application.pk).first()
    if basis is None:
        raise NotFound
    TeamPost.objects.select_for_update().get(pk=basis.team_post_id)
    locked_application = TeamApplication.objects.select_for_update().get(pk=basis.pk)
    if locked_application.applicant_id != actor.id:
        raise PermissionDenied
    if locked_application.status != TeamApplication.Status.PENDING:
        raise InvalidState
    locked_application.status = TeamApplication.Status.WITHDRAWN
    locked_application.save(update_fields=["status", "updated_at"])
    record_audit(
        actor=actor,
        action="TEAM_APPLICATION_WITHDRAWN",
        target=locked_application,
        changes={"status": {"from": TeamApplication.Status.PENDING, "to": TeamApplication.Status.WITHDRAWN}},
    )


@transaction.atomic
def accept_team_application(*, actor: User, application: TeamApplication) -> TeamApplication:
    """锁定帖子和申请后再统计名额，避免并发接受导致超额。"""

    basis = TeamApplication.objects.only("id", "team_post_id").get(pk=application.pk)
    post = TeamPost.objects.select_for_update().get(pk=basis.team_post_id)
    locked_application = TeamApplication.objects.select_for_update().get(pk=basis.pk)
    if actor.id != post.author_id and not actor.is_superuser:
        raise PermissionDenied
    if locked_application.applicant_id == post.author_id:
        raise InvalidState("不能接受作者自己的组队申请。")
    if locked_application.status != TeamApplication.Status.PENDING:
        raise InvalidState
    if post.status != TeamPost.Status.RECRUITING:
        raise InvalidState
    accepted_count = TeamApplication.objects.filter(
        team_post=post,
        status=TeamApplication.Status.ACCEPTED,
    ).count()
    if post.base_member_count + accepted_count >= post.target_member_count:
        raise CapacityFull

    desired_role = None
    if locked_application.desired_role_id is not None:
        desired_role = TeamRole.objects.select_for_update().get(pk=locked_application.desired_role_id)
        if desired_role.team_post_id != post.id:
            raise InvalidState("申请岗位不属于当前组队帖子。")
        role_accepted_count = TeamApplication.objects.filter(
            desired_role=desired_role,
            status=TeamApplication.Status.ACCEPTED,
        ).count()
        if role_accepted_count >= desired_role.headcount:
            raise CapacityFull

    locked_application.status = TeamApplication.Status.ACCEPTED
    locked_application.processed_at = timezone.now()
    locked_application.save(update_fields=["status", "processed_at", "updated_at"])
    if post.base_member_count + accepted_count + 1 >= post.target_member_count:
        post.status = TeamPost.Status.FULL
        post.save(update_fields=["status", "updated_at"])

    author_profile = getattr(post.author, "profile", None)
    author_name = author_profile.nickname if author_profile and author_profile.nickname else post.author.real_name
    create_notification(
        recipient=locked_application.applicant,
        notification_type=Notification.NotificationType.TEAM,
        title="组队申请已通过",
        body=f"你的组队申请已被{author_name}接受。",
        action_path=f"/teams/{post.id}",
        dedupe_key=f"team-application:{locked_application.id}:accepted",
    )
    record_audit(
        actor=actor,
        action="TEAM_APPLICATION_ACCEPTED",
        target=locked_application,
        changes={"status": {"from": TeamApplication.Status.PENDING, "to": TeamApplication.Status.ACCEPTED}},
    )
    return locked_application
