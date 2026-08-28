"""组织作用域下的权限授予和招新申请事务。"""

from collections.abc import Mapping, Sequence

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.domain_errors import (
    CapacityFull,
    DuplicateApplication,
    InvalidState,
    NotFound,
    PermissionDenied,
    PublicationIncomplete,
    TimeWindowClosed,
)
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.permissions import can_manage_organization, is_operator


def get_manageable_organization(*, actor: User, organization_id: object) -> Organization:
    """读取活跃组织后再确认当前用户拥有该组织的负责人作用域。"""

    organization = (
        Organization.objects.select_related("logo_asset", "banner_asset")
        .filter(pk=organization_id, is_active=True)
        .first()
    )
    if organization is None:
        raise NotFound("组织不存在或已停用。")
    if not can_manage_organization(actor, organization.id):
        raise PermissionDenied
    return organization


def _locked_manageable_organization(*, actor: User, organization_id: object) -> Organization:
    organization = Organization.objects.select_for_update().filter(pk=organization_id, is_active=True).first()
    if organization is None:
        raise NotFound("组织不存在或已停用。")
    if not can_manage_organization(actor, organization.id):
        raise PermissionDenied
    return organization


@transaction.atomic
def update_organization_profile(*, actor: User, organization: Organization, payload: Mapping[str, object]) -> Organization:
    """负责人只能写冻结白名单中的公开组织资料。"""

    locked = _locked_manageable_organization(actor=actor, organization_id=organization.id)
    changed_fields: list[str] = []
    for field, value in payload.items():
        setattr(locked, field, value)
        changed_fields.append(field)
    locked.updated_by = actor
    locked.save(update_fields=sorted({*changed_fields, "updated_by", "updated_at"}))
    record_audit(
        actor=actor,
        action="ORGANIZATION_PROFILE_UPDATED",
        target=locked,
        changes={"fields": sorted(changed_fields)},
    )
    return locked


def _replace_recruitment_positions(*, recruitment: Recruitment, positions: Sequence[Mapping[str, object]]) -> None:
    """按稳定 UUID 同步岗位，保护任何已留下申请历史的岗位。"""

    existing_positions = list(RecruitmentPosition.objects.select_for_update().filter(recruitment=recruitment))
    existing_by_id = {position.id: position for position in existing_positions}
    requested_ids = {item.get("id") for item in positions if item.get("id") is not None}
    unknown_ids = requested_ids - set(existing_by_id)
    if unknown_ids:
        raise NotFound("招新岗位不存在。")

    removed_ids = set(existing_by_id) - requested_ids
    if removed_ids:
        # Position 的外键为 PROTECT；即使申请已撤回也必须保留其历史岗位，不能让
        # 运行时 IntegrityError 泄漏到 HTTP 层。
        if RecruitmentApplication.objects.filter(position_id__in=removed_ids).exists():
            raise InvalidState("已有申请引用的岗位不能删除。")
        RecruitmentPosition.objects.filter(id__in=removed_ids).delete()

    # PostgreSQL 的唯一键是 (recruitment, name)。先暂存改名的行，支持岗位之间交换名称。
    for item in positions:
        position_id = item.get("id")
        if position_id is None:
            continue
        position = existing_by_id[position_id]
        if position.name != item["name"]:
            position.name = f"__updating__{position.id}"
            position.save(update_fields=["name", "updated_at"])

    for index, item in enumerate(positions):
        position_id = item.get("id")
        if position_id is None:
            RecruitmentPosition.objects.create(
                recruitment=recruitment,
                name=str(item["name"]),
                headcount=int(item["headcount"]),
                description_md=item.get("description_md") or None,
                requirements_md=item.get("requirements_md") or None,
                sort_order=int(item.get("sort_order", index)),
            )
            continue

        position = existing_by_id[position_id]
        accepted_count = RecruitmentApplication.objects.filter(
            position=position,
            status=RecruitmentApplication.Status.ACCEPTED,
        ).count()
        headcount = int(item["headcount"])
        if headcount < accepted_count:
            raise CapacityFull("岗位人数不能小于已接受申请数。")
        position.name = str(item["name"])
        position.headcount = headcount
        position.description_md = item.get("description_md") or None
        position.requirements_md = item.get("requirements_md") or None
        position.sort_order = int(item.get("sort_order", index))
        position.save(
            update_fields=["name", "headcount", "description_md", "requirements_md", "sort_order", "updated_at"]
        )


@transaction.atomic
def create_recruitment(*, actor: User, organization: Organization, payload: Mapping[str, object]) -> Recruitment:
    """负责人创建 DRAFT 招新；发布状态和审计字段不接收客户端输入。"""

    locked_organization = _locked_manageable_organization(actor=actor, organization_id=organization.id)
    values = dict(payload)
    positions = values.pop("positions")
    assert isinstance(positions, Sequence)
    recruitment = Recruitment.objects.create(
        organization=locked_organization,
        created_by=actor,
        updated_by=actor,
        publication_state=Recruitment.PublicationState.DRAFT,
        **values,
    )
    _replace_recruitment_positions(recruitment=recruitment, positions=positions)
    record_audit(
        actor=actor,
        action="RECRUITMENT_CREATED",
        target=recruitment,
        changes={"organization_id": str(locked_organization.id), "position_count": len(positions)},
    )
    return recruitment


@transaction.atomic
def update_recruitment(*, actor: User, organization: Organization, recruitment: Recruitment, payload: Mapping[str, object]) -> Recruitment:
    """以同一把招新行锁串行化岗位调整与申请接受，避免容量竞态。"""

    # 接受申请的锁顺序是 Recruitment -> Application -> Position -> Organization。
    # 这里先做无锁作用域确认，再锁 Recruitment，避免反向先锁 Organization 造成死锁。
    get_manageable_organization(actor=actor, organization_id=organization.id)
    locked = Recruitment.objects.select_for_update().filter(pk=recruitment.id, organization_id=organization.id).first()
    if locked is None:
        raise NotFound("招新不存在。")
    if locked.publication_state != Recruitment.PublicationState.DRAFT:
        raise InvalidState("已发布内容不可直接修改，请通过草稿编辑后发布。")

    values = dict(payload)
    positions = values.pop("positions", None)
    changed_fields: list[str] = []
    for field, value in values.items():
        setattr(locked, field, value)
        changed_fields.append(field)
    audit_fields = list(changed_fields)
    if positions is not None:
        assert isinstance(positions, Sequence)
        _replace_recruitment_positions(recruitment=locked, positions=positions)
        audit_fields.append("positions")
    locked.updated_by = actor
    locked.save(update_fields=sorted({*changed_fields, "updated_by", "updated_at"}))
    record_audit(
        actor=actor,
        action="RECRUITMENT_UPDATED",
        target=locked,
        changes={"fields": sorted(audit_fields)},
    )
    return locked


@transaction.atomic
def publish_recruitment(*, actor: User, organization: Organization, recruitment: Recruitment) -> Recruitment:
    get_manageable_organization(actor=actor, organization_id=organization.id)
    locked = Recruitment.objects.select_for_update().filter(pk=recruitment.id, organization_id=organization.id).first()
    if locked is None:
        raise NotFound("招新不存在。")
    if locked.publication_state != Recruitment.PublicationState.DRAFT:
        raise InvalidState
    if not RecruitmentPosition.objects.filter(recruitment=locked).exists():
        raise PublicationIncomplete("发布招新前至少需要一个岗位。")
    locked.publication_state = Recruitment.PublicationState.PUBLISHED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="RECRUITMENT_PUBLISHED",
        target=locked,
        changes={"publication_state": {"from": Recruitment.PublicationState.DRAFT, "to": Recruitment.PublicationState.PUBLISHED}},
    )
    return locked


@transaction.atomic
def cancel_recruitment(*, actor: User, organization: Organization, recruitment: Recruitment) -> Recruitment:
    get_manageable_organization(actor=actor, organization_id=organization.id)
    locked = Recruitment.objects.select_for_update().filter(pk=recruitment.id, organization_id=organization.id).first()
    if locked is None:
        raise NotFound("招新不存在。")
    if locked.publication_state != Recruitment.PublicationState.PUBLISHED or locked.completed_at is not None:
        raise InvalidState
    locked.publication_state = Recruitment.PublicationState.CANCELLED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="RECRUITMENT_CANCELLED",
        target=locked,
        changes={"publication_state": {"from": Recruitment.PublicationState.PUBLISHED, "to": Recruitment.PublicationState.CANCELLED}},
    )
    return locked


@transaction.atomic
def complete_recruitment(*, actor: User, organization: Organization, recruitment: Recruitment) -> Recruitment:
    get_manageable_organization(actor=actor, organization_id=organization.id)
    locked = Recruitment.objects.select_for_update().filter(pk=recruitment.id, organization_id=organization.id).first()
    if locked is None:
        raise NotFound("招新不存在。")
    if locked.publication_state != Recruitment.PublicationState.PUBLISHED or locked.completed_at is not None:
        raise InvalidState
    if timezone.now() <= locked.apply_end_at:
        raise TimeWindowClosed("申请截止后才能结束招新。")
    locked.completed_at = timezone.now()
    locked.updated_by = actor
    locked.save(update_fields=["completed_at", "updated_by", "updated_at"])
    record_audit(actor=actor, action="RECRUITMENT_COMPLETED", target=locked, changes={"completed_at": True})
    return locked


@transaction.atomic
def archive_recruitment(*, actor: User, organization: Organization, recruitment: Recruitment) -> Recruitment:
    get_manageable_organization(actor=actor, organization_id=organization.id)
    locked = Recruitment.objects.select_for_update().filter(pk=recruitment.id, organization_id=organization.id).first()
    if locked is None:
        raise NotFound("招新不存在。")
    if locked.publication_state not in {Recruitment.PublicationState.PUBLISHED, Recruitment.PublicationState.CANCELLED}:
        raise InvalidState
    previous_state = locked.publication_state
    locked.publication_state = Recruitment.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="RECRUITMENT_ARCHIVED",
        target=locked,
        changes={"publication_state": {"from": previous_state, "to": Recruitment.PublicationState.ARCHIVED}},
    )
    return locked


@transaction.atomic
def create_recruitment_application(
    *, actor: User, recruitment: Recruitment, position: RecruitmentPosition, payload: Mapping[str, object]
) -> RecruitmentApplication:
    """锁住招新和岗位，验证窗口/年级后写入有效申请。"""

    locked_recruitment = Recruitment.objects.select_for_update().select_related("organization").get(pk=recruitment.pk)
    locked_position = RecruitmentPosition.objects.select_for_update().filter(pk=position.pk, recruitment=locked_recruitment).first()
    if locked_position is None:
        raise NotFound("招新岗位不存在。")
    now = timezone.now()
    if (
        locked_recruitment.publication_state != Recruitment.PublicationState.PUBLISHED
        or locked_recruitment.completed_at is not None
        or (locked_recruitment.apply_start_at is not None and now < locked_recruitment.apply_start_at)
        or now > locked_recruitment.apply_end_at
    ):
        raise TimeWindowClosed("当前招新不在申请时间内。")
    profile = getattr(actor, "profile", None)
    grade = profile.grade if profile else None
    if (
        (locked_recruitment.target_grade_min is not None and (grade is None or grade < locked_recruitment.target_grade_min))
        or (locked_recruitment.target_grade_max is not None and (grade is None or grade > locked_recruitment.target_grade_max))
    ):
        raise TimeWindowClosed("当前年级不符合招新要求。")
    if RecruitmentApplication.objects.filter(
        recruitment=locked_recruitment,
        applicant=actor,
        status__in=[RecruitmentApplication.Status.PENDING, RecruitmentApplication.Status.ACCEPTED],
    ).exists():
        raise DuplicateApplication
    try:
        with transaction.atomic():
            application = RecruitmentApplication.objects.create(
                recruitment=locked_recruitment,
                position=locked_position,
                applicant=actor,
                **dict(payload),
            )
    except IntegrityError as error:
        raise DuplicateApplication from error

    leaders = OrganizationMembership.objects.filter(
        organization=locked_recruitment.organization,
        role=OrganizationMembership.Role.LEADER,
        is_active=True,
    ).select_related("user")
    for membership in leaders:
        create_notification(
            recipient=membership.user,
            notification_type=Notification.NotificationType.ORGANIZATION,
            title="收到新的招新申请",
            body=f"{locked_recruitment.title} 收到新的申请。",
            action_path=f"/organizations/{locked_recruitment.organization_id}/recruitments/{locked_recruitment.id}",
            dedupe_key=f"recruitment-application:{application.id}:submitted",
        )
    record_audit(
        actor=actor,
        action="RECRUITMENT_APPLICATION_CREATED",
        target=application,
        changes={"recruitment_id": str(locked_recruitment.id), "position_id": str(locked_position.id)},
    )
    return application


@transaction.atomic
def withdraw_recruitment_application(*, actor: User, application: RecruitmentApplication) -> None:
    basis = RecruitmentApplication.objects.only("id", "recruitment_id").filter(pk=application.pk).first()
    if basis is None:
        raise NotFound
    Recruitment.objects.select_for_update().get(pk=basis.recruitment_id)
    locked_application = RecruitmentApplication.objects.select_for_update().get(pk=basis.pk)
    if locked_application.applicant_id != actor.id:
        raise PermissionDenied
    if locked_application.status != RecruitmentApplication.Status.PENDING:
        raise InvalidState
    locked_application.status = RecruitmentApplication.Status.WITHDRAWN
    locked_application.save(update_fields=["status", "updated_at"])
    record_audit(
        actor=actor,
        action="RECRUITMENT_APPLICATION_WITHDRAWN",
        target=locked_application,
        changes={"status": {"from": RecruitmentApplication.Status.PENDING, "to": RecruitmentApplication.Status.WITHDRAWN}},
    )


@transaction.atomic
def grant_organization_leader(*, actor: User, membership: OrganizationMembership, grant: bool = True) -> OrganizationMembership:
    """LEADER 是组织作用域权限，只允许 SUPERADMIN 显式授予或撤销。"""

    if not actor.is_superuser:
        raise PermissionDenied
    locked_membership = OrganizationMembership.objects.select_for_update().get(pk=membership.pk)
    previous_role = locked_membership.role
    desired_role = OrganizationMembership.Role.LEADER if grant else OrganizationMembership.Role.MEMBER
    if previous_role == desired_role:
        return locked_membership
    locked_membership.role = desired_role
    locked_membership.save(update_fields=["role", "updated_at"])
    record_audit(
        actor=actor,
        action="ORGANIZATION_LEADER_GRANTED" if grant else "ORGANIZATION_LEADER_REVOKED",
        target=locked_membership,
        changes={"role": {"from": previous_role, "to": desired_role}},
    )
    return locked_membership


@transaction.atomic
def grant_organization_advisor(*, actor: User, membership: OrganizationMembership, grant: bool = True) -> OrganizationMembership:
    """ADVISOR 必须对应 TEACHER 且 public_name 非空，仅 SUPERADMIN 可授予/撤销。"""

    if not actor.is_superuser:
        raise PermissionDenied
    locked_membership = OrganizationMembership.objects.select_for_update().select_related("user", "user__profile").get(pk=membership.pk)
    previous_role = locked_membership.role
    desired_role = OrganizationMembership.Role.ADVISOR if grant else OrganizationMembership.Role.MEMBER
    if previous_role == desired_role:
        return locked_membership
    if grant:
        user = locked_membership.user
        if getattr(user, "identity_type", None) != User.IdentityType.TEACHER:
            raise InvalidState("只有教师账号可以被授予指导老师。")
        profile = getattr(user, "profile", None)
        if profile is None or not getattr(profile, "public_name", None):
            raise InvalidState("教师的公开姓名必填后才能担任指导老师。")
    locked_membership.role = desired_role
    locked_membership.save(update_fields=["role", "updated_at"])
    record_audit(
        actor=actor,
        action="ORGANIZATION_ADVISOR_GRANTED" if grant else "ORGANIZATION_ADVISOR_REVOKED",
        target=locked_membership,
        changes={"role": {"from": previous_role, "to": desired_role}},
    )
    return locked_membership


@transaction.atomic
def set_organization_active(*, actor: User, organization: Organization, is_active: bool) -> Organization:
    if not actor.is_superuser:
        raise PermissionDenied
    locked_organization = Organization.objects.select_for_update().get(pk=organization.pk)
    if locked_organization.is_active == is_active:
        return locked_organization
    previous_value = locked_organization.is_active
    locked_organization.is_active = is_active
    locked_organization.updated_by = actor
    locked_organization.save(update_fields=["is_active", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="ORGANIZATION_ACTIVATED" if is_active else "ORGANIZATION_DEACTIVATED",
        target=locked_organization,
        changes={"is_active": {"from": previous_value, "to": is_active}},
    )
    return locked_organization


@transaction.atomic
def set_membership_active(*, actor: User, membership: OrganizationMembership, is_active: bool) -> OrganizationMembership:
    """成员离开/恢复必须走受审计 Service，不能在 Admin 表单直接改状态。"""

    if not actor.is_superuser:
        raise PermissionDenied
    locked_membership = OrganizationMembership.objects.select_for_update().get(pk=membership.pk)
    if locked_membership.is_active == is_active:
        return locked_membership
    previous_value = locked_membership.is_active
    locked_membership.is_active = is_active
    locked_membership.left_at = None if is_active else timezone.now()
    locked_membership.save(update_fields=["is_active", "left_at", "updated_at"])
    record_audit(
        actor=actor,
        action="ORGANIZATION_MEMBERSHIP_ACTIVATED" if is_active else "ORGANIZATION_MEMBERSHIP_DEACTIVATED",
        target=locked_membership,
        changes={"is_active": {"from": previous_value, "to": is_active}},
    )
    return locked_membership


@transaction.atomic
def create_organization(*, actor: User, payload: Mapping[str, object]) -> Organization:
    """运营创建组织；仅 OPERATOR/SUPERADMIN，名称唯一由数据库约束保证。"""

    if not is_operator(actor):
        raise PermissionDenied
    values = dict(payload)
    try:
        organization = Organization.objects.create(
            created_by=actor,
            updated_by=actor,
            **values,
        )
    except IntegrityError as error:
        raise InvalidState("组织名称已存在。") from error
    record_audit(
        actor=actor,
        action="ORGANIZATION_CREATED",
        target=organization,
        changes={"name": organization.name, "organization_type": organization.organization_type},
    )
    return organization


@transaction.atomic
def accept_recruitment_application(*, actor: User, application: RecruitmentApplication) -> RecruitmentApplication:
    """接受招新申请、占用岗位名额并创建或重新激活 MEMBER 身份。"""

    basis = RecruitmentApplication.objects.only("id", "recruitment_id").get(pk=application.pk)
    recruitment = Recruitment.objects.select_for_update().get(pk=basis.recruitment_id)
    locked_application = RecruitmentApplication.objects.select_for_update().get(pk=basis.pk)
    if not can_manage_organization(actor, recruitment.organization_id):
        raise PermissionDenied
    position = RecruitmentPosition.objects.select_for_update().get(pk=locked_application.position_id)
    if position.recruitment_id != recruitment.id:
        raise InvalidState("申请岗位不属于当前招新。")
    if locked_application.status != RecruitmentApplication.Status.PENDING:
        raise InvalidState
    if recruitment.publication_state != Recruitment.PublicationState.PUBLISHED:
        raise InvalidState("当前招新不可处理申请。")
    accepted_count = RecruitmentApplication.objects.filter(
        position=position,
        status=RecruitmentApplication.Status.ACCEPTED,
    ).count()
    if accepted_count >= position.headcount:
        raise CapacityFull

    # Membership 的唯一键是 (organization, user)。两个不同 Recruitment 的
    # 申请不会互相锁定，故在查询不存在的 Membership 前锁住共同的 Organization。
    # 这让创建和重新激活路径在同一组织内串行化，避免不存在的行无法被锁住时的竞态。
    organization = Organization.objects.select_for_update().get(pk=recruitment.organization_id)

    locked_application.status = RecruitmentApplication.Status.ACCEPTED
    locked_application.processed_by = actor
    locked_application.processed_at = timezone.now()
    locked_application.save(update_fields=["status", "processed_by", "processed_at", "updated_at"])

    membership = OrganizationMembership.objects.select_for_update().filter(
        organization_id=organization.id,
        user_id=locked_application.applicant_id,
    ).first()
    if membership is None:
        membership = OrganizationMembership.objects.create(
            organization=organization,
            user_id=locked_application.applicant_id,
            role=OrganizationMembership.Role.MEMBER,
            title=position.name,
        )
    else:
        membership.role = OrganizationMembership.Role.MEMBER
        membership.title = position.name
        membership.is_active = True
        membership.left_at = None
        membership.joined_at = timezone.now()
        membership.save(update_fields=["role", "title", "is_active", "left_at", "joined_at", "updated_at"])

    create_notification(
        recipient=locked_application.applicant,
        notification_type=Notification.NotificationType.ORGANIZATION,
        title="招新申请已通过",
        body=f"你已加入{organization.name}。",
        action_path=f"/organizations/{organization.id}/recruitments/{recruitment.id}",
        dedupe_key=f"recruitment-application:{locked_application.id}:accepted",
    )
    record_audit(
        actor=actor,
        action="RECRUITMENT_APPLICATION_ACCEPTED",
        target=locked_application,
        changes={"status": {"from": RecruitmentApplication.Status.PENDING, "to": RecruitmentApplication.Status.ACCEPTED}},
    )
    return locked_application


@transaction.atomic
def reject_recruitment_application(*, actor: User, application: RecruitmentApplication) -> RecruitmentApplication:
    """拒绝申请同样必须经过组织作用域与审计检查。"""

    basis = RecruitmentApplication.objects.only("id", "recruitment_id").get(pk=application.pk)
    recruitment = Recruitment.objects.select_for_update().get(pk=basis.recruitment_id)
    locked_application = RecruitmentApplication.objects.select_for_update().get(pk=basis.pk)
    if not can_manage_organization(actor, recruitment.organization_id):
        raise PermissionDenied
    if locked_application.status != RecruitmentApplication.Status.PENDING:
        raise InvalidState

    locked_application.status = RecruitmentApplication.Status.REJECTED
    locked_application.processed_by = actor
    locked_application.processed_at = timezone.now()
    locked_application.save(update_fields=["status", "processed_by", "processed_at", "updated_at"])
    create_notification(
        recipient=locked_application.applicant,
        notification_type=Notification.NotificationType.ORGANIZATION,
        title="招新申请未通过",
        body=f"{recruitment.title} 的申请未通过。",
        action_path=f"/organizations/{recruitment.organization_id}/recruitments/{recruitment.id}",
        dedupe_key=f"recruitment-application:{locked_application.id}:rejected",
    )
    record_audit(
        actor=actor,
        action="RECRUITMENT_APPLICATION_REJECTED",
        target=locked_application,
        changes={"status": {"from": RecruitmentApplication.Status.PENDING, "to": RecruitmentApplication.Status.REJECTED}},
    )
    return locked_application
