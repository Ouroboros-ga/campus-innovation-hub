"""组队申请的行锁事务。"""

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.domain_errors import CapacityFull, InvalidState, PermissionDenied
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.teams.models import TeamApplication, TeamPost, TeamRole


@transaction.atomic
def accept_team_application(*, actor: User, application: TeamApplication) -> TeamApplication:
    """锁定帖子和申请后再统计名额，避免并发接受导致超额。"""

    locked_application = TeamApplication.objects.select_for_update().select_related("team_post").get(pk=application.pk)
    post = TeamPost.objects.select_for_update().get(pk=locked_application.team_post_id)
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
