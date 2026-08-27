"""与 HTTP 无关的跨领域权限和隐私过滤规则。"""

from django.db.models import Q, QuerySet

from apps.accounts.models import User
from apps.consultations.models import Consultation
from apps.organizations.models import OrganizationMembership, RecruitmentApplication
from apps.teams.models import TeamApplication


def effective_platform_role(user: User | None) -> str | None:
    """`is_superuser` 是唯一的 SUPERADMIN 来源。"""

    if user is None or not user.is_authenticated:
        return None
    if user.is_superuser:
        return "SUPERADMIN"
    return user.platform_role


def is_operator(user: User | None) -> bool:
    return effective_platform_role(user) in {User.PlatformRole.OPERATOR, "SUPERADMIN"}


def is_org_manager(user: User | None, organization_id: object) -> bool:
    """ORG_MANAGER(org) = active membership + role IN (LEADER, ADVISOR) + orgId 严格匹配."""
    if user is None or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    membership = OrganizationMembership.objects.filter(
        organization_id=organization_id,
        user=user,
        role__in=[OrganizationMembership.Role.LEADER, OrganizationMembership.Role.ADVISOR],
        is_active=True,
    ).first()
    if membership is None:
        return False
    if membership.role == OrganizationMembership.Role.ADVISOR:
        # ADVISOR 必须对应 TEACHER 且 public_name 非空（database-design.md §10.2）
        if getattr(user, "identity_type", None) != User.IdentityType.TEACHER:
            return False
        profile = getattr(user, "profile", None)
        if profile is None or not getattr(profile, "public_name", None):
            return False
    return True


def can_manage_organization(user: User | None, organization_id: object) -> bool:
    # 兼容旧调用，转发至 ORG_MANAGER
    return is_org_manager(user, organization_id)


def consultation_visibility_filter(user: User | None) -> Q:
    """私有咨询仅对作者、运营人员和超级管理员可见。"""

    public_filter = Q(visibility=Consultation.Visibility.PUBLIC)
    if user is None or not user.is_authenticated:
        return public_filter
    if is_operator(user):
        return Q()
    return public_filter | Q(author=user)


def visible_consultations_for(user: User | None) -> QuerySet[Consultation]:
    return Consultation.objects.filter(consultation_visibility_filter(user))


def can_view_recruitment_application(user: User | None, application: RecruitmentApplication) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (application.applicant_id == user.id or can_manage_organization(user, application.recruitment.organization_id))
    )


def can_view_team_application(user: User | None, application: TeamApplication) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (application.applicant_id == user.id or application.team_post.author_id == user.id or user.is_superuser)
    )
