"""运营侧招新申请全平台只读视图 — 仅聚合查看，不直接审。"""

from __future__ import annotations

from rest_framework.request import Request
from rest_framework.response import Response

from apps.ops_api.base import OperatorAPIView
from apps.organizations.models import RecruitmentApplication
from apps.public_api.query import filter_text, paginated_response, parse_optional_enum, parse_optional_uuid, validate_query_keys


def _serialize_ops_application(app: RecruitmentApplication, request: Request) -> dict:
    rec = app.recruitment
    org = rec.organization
    pos = app.position
    applicant = app.applicant
    profile = getattr(applicant, "profile", None)
    return {
        "id": str(app.id),
        "status": app.status,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "organization": {"id": str(org.id), "name": org.name},
        "recruitment": {"id": str(rec.id), "title": rec.title},
        "position": {"id": str(pos.id), "name": pos.name} if pos else None,
        "applicant": {
            "id": str(applicant.id),
            "username": applicant.username,
            "display_name": getattr(profile, "public_name", None) or applicant.username,
        },
        "manage_path": f"/manage/organizations/{org.id}/applications",
    }


class OpsRecruitmentApplicationCollectionView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "organization_id", "recruitment_id", "page", "page_size"})
        status = parse_optional_enum(request, "status", RecruitmentApplication.Status.values)
        org_id = parse_optional_uuid(request, "organization_id")
        rec_id = parse_optional_uuid(request, "recruitment_id")
        qs = RecruitmentApplication.objects.select_related(
            "recruitment", "recruitment__organization", "position", "applicant", "applicant__profile"
        ).order_by("-created_at")
        if status is not None:
            qs = qs.filter(status=status)
        if org_id is not None:
            qs = qs.filter(recruitment__organization_id=org_id)
        if rec_id is not None:
            qs = qs.filter(recruitment_id=rec_id)
        q = request.query_params.get("q")
        if q:
            from django.db.models import Q

            qs = qs.filter(
                Q(applicant__username__icontains=q)
                | Q(applicant__profile__public_name__icontains=q)
                | Q(recruitment__title__icontains=q)
                | Q(recruitment__organization__name__icontains=q)
            ).distinct()
        return paginated_response(request, qs, lambda item: _serialize_ops_application(item, request), default_page_size=20)
