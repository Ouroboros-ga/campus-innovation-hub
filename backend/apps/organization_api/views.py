"""组织负责人管理 API；所有资源必须先通过 orgId 作用域校验。"""

from __future__ import annotations

from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.domain_errors import NotFound
from apps.organizations.models import Recruitment, RecruitmentApplication
from apps.organizations.services import (
    accept_recruitment_application,
    archive_recruitment,
    cancel_recruitment,
    complete_recruitment,
    create_recruitment,
    get_manageable_organization,
    publish_recruitment,
    reject_recruitment_application,
    update_organization_profile,
    update_recruitment,
)
from apps.organization_api.serializers import (
    OrganizationProfilePatchSerializer,
    RecruitmentCreateSerializer,
    RecruitmentPatchSerializer,
    management_recruitments,
    serialize_organization_management_profile,
    serialize_recruitment_application_management,
    serialize_recruitment_management,
)
from apps.public_api.query import (
    paginated_response,
    parse_optional_enum,
    parse_optional_uuid,
    parse_uuid,
    validate_query_keys,
)


def _empty_body(request: Request) -> None:
    if request.data:
        raise ValidationError({"non_field_errors": ["该操作不接受请求体。"]})


class OrganizationManagementAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_organization(self, request: Request, organization_id: str):
        return get_manageable_organization(actor=request.user, organization_id=parse_uuid(organization_id, field="orgId"))

    def get_recruitment(self, organization_id: object, recruitment_id: str) -> Recruitment:
        recruitment = (
            Recruitment.objects.select_related("organization")
            .prefetch_related("positions")
            .filter(id=parse_uuid(recruitment_id, field="rid"), organization_id=organization_id)
            .first()
        )
        if recruitment is None:
            raise NotFound("招新不存在。")
        return recruitment


class OrganizationProfileView(OrganizationManagementAPIView):
    def get(self, request: Request, organization_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        return Response(serialize_organization_management_profile(organization, request))

    def patch(self, request: Request, organization_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        serializer = OrganizationProfilePatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = update_organization_profile(actor=request.user, organization=organization, payload=serializer.validated_data)
        updated = updated.__class__.objects.select_related("logo_asset", "banner_asset").get(pk=updated.pk)
        return Response(serialize_organization_management_profile(updated, request))


class RecruitmentCollectionView(OrganizationManagementAPIView):
    def get(self, request: Request, organization_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        validate_query_keys(request, {"status", "page", "page_size"})
        status = parse_optional_enum(
            request,
            "status",
            {"DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED", "COMPLETED"},
        )
        queryset = Recruitment.objects.filter(organization=organization).select_related("organization").prefetch_related("positions")
        if status == "COMPLETED":
            queryset = queryset.filter(publication_state=Recruitment.PublicationState.PUBLISHED, completed_at__isnull=False)
        elif status == "PUBLISHED":
            queryset = queryset.filter(publication_state=Recruitment.PublicationState.PUBLISHED, completed_at__isnull=True)
        elif status is not None:
            queryset = queryset.filter(publication_state=status)
        queryset = management_recruitments(queryset).order_by("-created_at")
        return paginated_response(request, queryset, lambda item: serialize_recruitment_management(item, request))

    def post(self, request: Request, organization_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        serializer = RecruitmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data)
        publish = bool(payload.pop("publish", False))
        recruitment = create_recruitment(actor=request.user, organization=organization, payload=payload, publish=publish)
        recruitment = management_recruitments(
            Recruitment.objects.select_related("organization").prefetch_related("positions").filter(pk=recruitment.pk)
        ).get()
        return Response(serialize_recruitment_management(recruitment, request), status=201)


class RecruitmentDetailView(OrganizationManagementAPIView):
    def get(self, request: Request, organization_id: str, recruitment_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        recruitment = management_recruitments(
            Recruitment.objects.select_related("organization").prefetch_related("positions").filter(
                id=parse_uuid(recruitment_id, field="rid"), organization=organization
            )
        ).first()
        if recruitment is None:
            raise NotFound("招新不存在。")
        return Response(serialize_recruitment_management(recruitment, request))

    def patch(self, request: Request, organization_id: str, recruitment_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        recruitment = self.get_recruitment(organization.id, recruitment_id)
        serializer = RecruitmentPatchSerializer(data=request.data, context={"recruitment": recruitment})
        serializer.is_valid(raise_exception=True)
        updated = update_recruitment(actor=request.user, organization=organization, recruitment=recruitment, payload=serializer.validated_data)
        updated = management_recruitments(
            Recruitment.objects.select_related("organization").prefetch_related("positions").filter(pk=updated.pk)
        ).get()
        return Response(serialize_recruitment_management(updated, request))


class _RecruitmentActionView(OrganizationManagementAPIView):
    service = None

    def post(self, request: Request, organization_id: str, recruitment_id: str) -> Response:
        _empty_body(request)
        organization = self.get_organization(request, organization_id)
        recruitment = self.get_recruitment(organization.id, recruitment_id)
        assert self.service is not None
        self.service(actor=request.user, organization=organization, recruitment=recruitment)
        return Response(status=204)


class RecruitmentPublishView(_RecruitmentActionView):
    service = staticmethod(publish_recruitment)


class RecruitmentCancelView(_RecruitmentActionView):
    service = staticmethod(cancel_recruitment)


class RecruitmentCompleteView(_RecruitmentActionView):
    service = staticmethod(complete_recruitment)


class RecruitmentArchiveView(_RecruitmentActionView):
    service = staticmethod(archive_recruitment)


class RecruitmentApplicationCollectionView(OrganizationManagementAPIView):
    def get(self, request: Request, organization_id: str) -> Response:
        organization = self.get_organization(request, organization_id)
        validate_query_keys(request, {"recruitment_id", "position_id", "status", "page", "page_size"})
        recruitment_id = parse_optional_uuid(request, "recruitment_id")
        position_id = parse_optional_uuid(request, "position_id")
        status = parse_optional_enum(request, "status", RecruitmentApplication.Status.values)
        queryset = RecruitmentApplication.objects.select_related(
            "recruitment", "position", "applicant", "applicant__profile", "applicant__profile__avatar_asset", "processed_by"
        ).filter(recruitment__organization=organization)
        if recruitment_id is not None:
            queryset = queryset.filter(recruitment_id=recruitment_id)
        if position_id is not None:
            queryset = queryset.filter(position_id=position_id)
        if status is not None:
            queryset = queryset.filter(status=status)
        return paginated_response(
            request,
            queryset.order_by("-created_at"),
            lambda item: serialize_recruitment_application_management(item, request),
        )


class _RecruitmentApplicationActionView(OrganizationManagementAPIView):
    service = None

    def post(self, request: Request, organization_id: str, application_id: str) -> Response:
        _empty_body(request)
        organization = self.get_organization(request, organization_id)
        application = RecruitmentApplication.objects.filter(
            id=parse_uuid(application_id, field="aid"), recruitment__organization=organization
        ).first()
        if application is None:
            raise NotFound("招新申请不存在。")
        assert self.service is not None
        self.service(actor=request.user, application=application)
        return Response(status=204)


class RecruitmentApplicationAcceptView(_RecruitmentApplicationActionView):
    service = staticmethod(accept_recruitment_application)


class RecruitmentApplicationRejectView(_RecruitmentApplicationActionView):
    service = staticmethod(reject_recruitment_application)
