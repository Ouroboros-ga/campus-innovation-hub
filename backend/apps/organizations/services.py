"""组织作用域下的权限授予和招新申请事务。"""

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.domain_errors import CapacityFull, InvalidState, PermissionDenied
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.permissions import can_manage_organization


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
def accept_recruitment_application(*, actor: User, application: RecruitmentApplication) -> RecruitmentApplication:
    """接受招新申请、占用岗位名额并创建或重新激活 MEMBER 身份。"""

    locked_application = RecruitmentApplication.objects.select_for_update().select_related("recruitment").get(pk=application.pk)
    recruitment = Recruitment.objects.select_for_update().get(pk=locked_application.recruitment_id)
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

    locked_application.status = RecruitmentApplication.Status.ACCEPTED
    locked_application.processed_by = actor
    locked_application.processed_at = timezone.now()
    locked_application.save(update_fields=["status", "processed_by", "processed_at", "updated_at"])

    membership = OrganizationMembership.objects.select_for_update().filter(
        organization_id=recruitment.organization_id,
        user_id=locked_application.applicant_id,
    ).first()
    if membership is None:
        membership = OrganizationMembership.objects.create(
            organization_id=recruitment.organization_id,
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
        body=f"你已加入{recruitment.organization.name}。",
        action_path=f"/organizations/{recruitment.organization_id}/recruitments/{recruitment.id}",
        dedupe_key=f"recruitment-application:{locked_application.id}:accepted",
    )
    record_audit(
        actor=actor,
        action="RECRUITMENT_APPLICATION_ACCEPTED",
        target=locked_application,
        changes={"status": {"from": RecruitmentApplication.Status.PENDING, "to": RecruitmentApplication.Status.ACCEPTED}},
    )
    return locked_application
