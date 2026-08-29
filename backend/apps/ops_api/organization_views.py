"""社团组织运营 API（供运营工作台/社团组织管理页）。"""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response

from apps.ops_api.base import OperatorAPIView
from apps.ops_api.serializers import OrganizationCreateSerializer, OrganizationUpdateSerializer
from apps.organizations.models import Organization, OrganizationMembership, Recruitment
from apps.organizations.services import create_organization, update_organization
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_enum,
    parse_uuid,
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
        "description_md": organization.description_md,
        "logo": media_ref(organization.logo_asset, request),
        "banner": media_ref(organization.banner_asset, request),
        "public_contact": organization.public_contact,
        "qq_group_number": organization.qq_group_number,
        "qq_group_join_url": organization.qq_group_join_url,
        "qq_group_qr": media_ref(organization.qq_group_qr_asset, request) if hasattr(organization, "qq_group_qr_asset") else None,
        "allow_online_application": organization.allow_online_application,
        "related_links_json": organization.related_links_json or [],
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
    def post(self, request: Request) -> Response:
        serializer = OrganizationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        organization = create_organization(actor=request.user, payload=serializer.validated_data)
        # 重新查询以走统一序列化（含 memberships 预取）
        organization = Organization.objects.select_related("logo_asset", "banner_asset").get(pk=organization.pk)
        return Response(_serialize_organization_management(organization, request), status=201)

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


class OrganizationDetailView(OperatorAPIView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        organization = Organization.objects.select_related("logo_asset", "banner_asset").filter(id=parse_uuid(object_id)).first()
        if organization is None:
            from apps.domain_errors import NotFound

            raise NotFound("组织不存在。")
        return Response(_serialize_organization_management(organization, request))

    def patch(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        organization = Organization.objects.filter(id=parse_uuid(object_id)).first()
        if organization is None:
            from apps.domain_errors import NotFound

            raise NotFound("组织不存在。")
        # 允许超级管理员/运营直接更新（不要求 is_active）
        serializer = OrganizationUpdateSerializer(data=request.data, context={"organization": organization})
        serializer.is_valid(raise_exception=True)
        updated = update_organization(actor=request.user, organization=organization, payload=serializer.validated_data)
        updated = Organization.objects.select_related("logo_asset", "banner_asset").get(pk=updated.pk)
        return Response(_serialize_organization_management(updated, request))


class OpsUserSearchView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        from django.db.models import Q

        from apps.accounts.models import User

        validate_query_keys(request, {"q", "identity_type", "page", "page_size"})
        q = (request.query_params.get("q") or "").strip()
        identity_type = request.query_params.get("identity_type")
        queryset = User.objects.filter(is_active=True).select_related("profile").order_by("username")
        if q:
            queryset = queryset.filter(
                Q(username__icontains=q)
                | Q(real_name__icontains=q)
                | Q(student_no__icontains=q)
                | Q(employee_no__icontains=q)
                | Q(profile__nickname__icontains=q)
                | Q(profile__public_name__icontains=q)
            )
        else:
            # 未输入关键词时返回空，避免全表扫描
            queryset = queryset.none()
        if identity_type in {"STUDENT", "TEACHER"}:
            queryset = queryset.filter(identity_type=identity_type)

        def _serialize_user(user: User) -> dict:
            profile = getattr(user, "profile", None)
            return {
                "id": str(user.id),
                "username": user.username,
                "real_name": user.real_name,
                "identity_type": user.identity_type,
                "student_no": user.student_no,
                "employee_no": user.employee_no,
                "display_name": (getattr(profile, "public_name", None) or getattr(profile, "nickname", None) if profile else None) or user.real_name,
                "avatar": media_ref(getattr(profile, "avatar_asset", None) if profile else None, request),
                "department": getattr(profile, "department", None) if profile else None,
                "major": getattr(profile, "major", None) if profile else None,
                "grade": getattr(profile, "grade", None) if profile else None,
            }

        return paginated_response(request, queryset, _serialize_user, default_page_size=20)


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
