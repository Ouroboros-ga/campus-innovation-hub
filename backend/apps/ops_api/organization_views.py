"""社团组织运营 API（供运营工作台/社团组织管理页）。"""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response

from apps.ops_api.base import OperatorAPIView
from apps.organizations.models import Organization, OrganizationMembership, Recruitment
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_enum,
    validate_query_keys,
)
from apps.public_api.serializers import media_ref, recruitment_open_filter


def _serialize_organization_management(organization: Organization, request: Request) -> dict:
    # 取首个 LEADER / ADVISOR
    leader_membership = None
    advisor_membership = None
    # memberships 已 prefetch 时可走内存，否则单独查
    memberships = list(getattr(organization, "_prefetched_memberships", []) or [])
    if not memberships:
        memberships = list(
            OrganizationMembership.objects.filter(organization=organization, is_active=True).select_related(
                "user", "user__profile", "user__profile__avatar_asset"
            )
        )
    for m in memberships:
        if m.role == OrganizationMembership.Role.LEADER and leader_membership is None:
            leader_membership = m
        if m.role == OrganizationMembership.Role.ADVISOR and advisor_membership is None:
            advisor_membership = m

    def _user_brief(membership):
        if membership is None:
            return None
        user = membership.user
        profile = getattr(user, "profile", None)
        return {
            "membership_id": str(membership.id),
            "user_id": str(user.id),
            "display_name": (getattr(profile, "public_name", None) or getattr(profile, "nickname", None) if profile else None) or user.real_name,
            "avatar": media_ref(getattr(profile, "avatar_asset", None) if profile else None, request),
            "title": membership.title,
            "role": membership.role,
        }

    # 招新状态：是否有 OPEN 招新
    is_recruiting = False
    recruitment_end = None
    # 用 annotated 或查询
    open_exists = getattr(organization, "is_recruiting_value", None)
    if open_exists is not None:
        is_recruiting = bool(open_exists)
    else:
        open_rec = organization.recruitments.filter(recruitment_open_filter()).order_by("apply_end_at").first()
        if open_rec:
            is_recruiting = True
            recruitment_end = open_rec.apply_end_at

    # 成员数（活跃）
    member_count = getattr(organization, "member_count_value", None)
    if member_count is None:
        member_count = OrganizationMembership.objects.filter(organization=organization, is_active=True).count()

    return {
        "id": str(organization.id),
        "name": organization.name,
        "organization_type": organization.organization_type,
        "short_intro": organization.short_intro,
        "logo": media_ref(organization.logo_asset, request),
        "banner": media_ref(organization.banner_asset, request),
        "public_contact": organization.public_contact,
        "is_active": organization.is_active,
        "leader": _user_brief(leader_membership),
        "advisor": _user_brief(advisor_membership),
        "member_count": member_count,
        "is_recruiting": is_recruiting,
        "recruitment_end_at": recruitment_end,
        "updated_at": organization.updated_at,
        "created_at": organization.created_at,
    }


class OrganizationCollectionView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "organization_type", "is_recruiting", "is_active", "ordering", "page", "page_size"})
        org_type = parse_optional_enum(request, "organization_type", Organization.OrganizationType.values)
        is_recruiting = request.query_params.get("is_recruiting")
        is_active = request.query_params.get("is_active")
        ordering = request.query_params.get("ordering")

        queryset = Organization.objects.select_related("logo_asset", "banner_asset").prefetch_related(
            "memberships__user__profile__avatar_asset", "recruitments"
        )

        # 文本搜索
        queryset = filter_text(queryset, request.query_params.get("q"), ("name", "short_intro", "public_contact"))

        if org_type is not None:
            queryset = queryset.filter(organization_type=org_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        if is_recruiting is not None:
            want = is_recruiting.lower() == "true"
            # 用子查询过滤是否存在 OPEN 招新
            open_ids = Organization.objects.filter(recruitments__in=Recruitment.objects.filter(recruitment_open_filter())).values_list("id", flat=True)
            if want:
                queryset = queryset.filter(id__in=open_ids)
            else:
                queryset = queryset.exclude(id__in=open_ids)

        if ordering in {"updated_at", "-updated_at", "created_at", "-created_at", "name", "-name"}:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by("-updated_at")

        return paginated_response(request, queryset, lambda item: _serialize_organization_management(item, request), default_page_size=30)


class OrganizationStatsView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        total = Organization.objects.count()
        # 招新中：存在 OPEN 招新的组织数
        open_org_ids = set(
            Organization.objects.filter(recruitments__in=Recruitment.objects.filter(recruitment_open_filter())).values_list("id", flat=True)
        )
        recruiting = len(open_org_ids)
        not_recruiting = total - recruiting
        new_this_month = Organization.objects.filter(created_at__gte=month_start).count()
        # 优化：member_count 前 1 的组织作为人气（按成员数）
        top = (
            Organization.objects.annotate(member_cnt=Count("memberships", filter=Q(memberships__is_active=True)))
            .order_by("-member_cnt")
            .first()
        )
        top_payload = None
        if top:
            top_payload = {"id": str(top.id), "name": top.name, "member_count": getattr(top, "member_cnt", 0)}
        return Response(
            {
                "total": total,
                "recruiting": recruiting,
                "not_recruiting": not_recruiting,
                "new_this_month": new_this_month,
                "top_organization": top_payload,
            }
        )
