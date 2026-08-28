"""公告、指南、FAQ 与首页 Banner 的运营 HTTP 层。"""

from __future__ import annotations

from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response

from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner
from apps.content.services import (
    archive_announcement,
    archive_faq,
    archive_guide,
    create_announcement,
    create_banner,
    create_faq,
    create_guide,
    publish_announcement,
    publish_faq,
    publish_guide,
    set_faq_featured,
    set_guide_featured,
    update_announcement,
    update_banner,
    update_faq,
    update_guide,
)
from apps.domain_errors import NotFound
from apps.ops_api.base import OperatorAPIView, require_empty_body
from apps.ops_api.serializers import (
    AnnouncementCreateSerializer,
    AnnouncementPatchSerializer,
    BannerCreateSerializer,
    BannerPatchSerializer,
    FaqCreateSerializer,
    FaqPatchSerializer,
    FeaturedSerializer,
    GuideCreateSerializer,
    GuidePatchSerializer,
    serialize_announcement_management,
    serialize_banner_management,
    serialize_faq_management,
    serialize_guide_management,
)
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_bool,
    parse_optional_enum,
    parse_uuid,
    validate_query_keys,
)


def _get_or_404(model: Any, object_id: str, label: str, *, queryset: Any = None) -> Any:
    source = queryset if queryset is not None else model.objects
    instance = source.filter(id=parse_uuid(object_id)).first()
    if instance is None:
        raise NotFound(f"{label}不存在。")
    return instance


class AnnouncementCollectionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"content:read"}, "POST": {"content:write"}}

    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "publisher_scope", "page", "page_size"})
        queryset = Announcement.objects.select_related("competition", "activity", "organization", "recruitment__organization")
        queryset = filter_text(queryset, request.query_params.get("q"), ("title", "summary", "body_md"))
        status = parse_optional_enum(request, "status", Announcement.PublicationState.values)
        scope = parse_optional_enum(request, "publisher_scope", Announcement.PublisherScope.values)
        if status is not None:
            queryset = queryset.filter(publication_state=status)
        if scope is not None:
            queryset = queryset.filter(publisher_scope=scope)
        return paginated_response(
            request, queryset.order_by("-created_at"), lambda item: serialize_announcement_management(item, request), default_page_size=30
        )

    def post(self, request: Request) -> Response:
        serializer = AnnouncementCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        announcement = create_announcement(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_announcement_management(announcement, request), status=201)


class AnnouncementDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"content:read"}, "PATCH": {"content:write"}}

    def get(self, request: Request, object_id: str) -> Response:
        announcement = _get_or_404(
            Announcement, object_id, "公告", queryset=Announcement.objects.select_related("competition", "activity", "organization", "recruitment__organization")
        )
        return Response(serialize_announcement_management(announcement, request))

    def patch(self, request: Request, object_id: str) -> Response:
        announcement = _get_or_404(Announcement, object_id, "公告")
        serializer = AnnouncementPatchSerializer(data=request.data, context={"announcement": announcement})
        serializer.is_valid(raise_exception=True)
        updated = update_announcement(actor=request.user, announcement=announcement, payload=serializer.validated_data)
        return Response(serialize_announcement_management(updated, request))


class _AnnouncementActionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"POST": {"content:publish"}}
    service = None

    def post(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        assert self.service is not None
        self.service(actor=request.user, announcement=_get_or_404(Announcement, object_id, "公告"))
        return Response(status=204)


class AnnouncementPublishView(_AnnouncementActionView):
    service = staticmethod(publish_announcement)


class AnnouncementArchiveView(_AnnouncementActionView):
    service = staticmethod(archive_announcement)


class GuideCollectionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"content:read"}, "POST": {"content:write"}}

    def _queryset(self) -> Any:
        return GuideArticle.objects.prefetch_related("competition_links__competition")

    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "category", "page", "page_size"})
        queryset = filter_text(self._queryset(), request.query_params.get("q"), ("title", "summary", "body_md"))
        status = parse_optional_enum(request, "status", GuideArticle.PublicationState.values)
        category = parse_optional_enum(request, "category", GuideArticle.Category.values)
        if status is not None:
            queryset = queryset.filter(publication_state=status)
        if category is not None:
            queryset = queryset.filter(category=category)
        return paginated_response(
            request, queryset.order_by("-created_at"), lambda item: serialize_guide_management(item, request), default_page_size=30
        )

    def post(self, request: Request) -> Response:
        serializer = GuideCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guide = create_guide(actor=request.user, payload=serializer.validated_data)
        guide = self._queryset().get(pk=guide.pk)
        return Response(serialize_guide_management(guide, request), status=201)


class GuideDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"content:read"}, "PATCH": {"content:write"}}

    def _get(self, object_id: str) -> GuideArticle:
        return _get_or_404(GuideArticle, object_id, "指南", queryset=GuideArticle.objects.prefetch_related("competition_links__competition"))

    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_guide_management(self._get(object_id), request))

    def patch(self, request: Request, object_id: str) -> Response:
        guide = self._get(object_id)
        serializer = GuidePatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = update_guide(actor=request.user, guide=guide, payload=serializer.validated_data)
        return Response(serialize_guide_management(self._get(str(updated.id)), request))


class _GuideActionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"POST": {"content:publish"}}
    service = None

    def post(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        assert self.service is not None
        self.service(actor=request.user, guide=_get_or_404(GuideArticle, object_id, "指南"))
        return Response(status=204)


class GuidePublishView(_GuideActionView):
    service = staticmethod(publish_guide)


class GuideArchiveView(_GuideActionView):
    service = staticmethod(archive_guide)


class GuideFeaturedView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"PATCH": {"content:write"}}

    def patch(self, request: Request, object_id: str) -> Response:
        serializer = FeaturedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guide = set_guide_featured(
            actor=request.user, guide=_get_or_404(GuideArticle, object_id, "指南"), payload=serializer.validated_data
        )
        return Response({"id": str(guide.id), "is_featured": guide.is_featured, "featured_order": guide.featured_order})


class FaqCollectionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"content:read"}, "POST": {"content:write"}}

    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "category", "page", "page_size"})
        queryset = filter_text(FaqItem.objects.all(), request.query_params.get("q"), ("question", "answer_md"))
        status = parse_optional_enum(request, "status", FaqItem.PublicationState.values)
        category = parse_optional_enum(request, "category", FaqItem.Category.values)
        if status is not None:
            queryset = queryset.filter(publication_state=status)
        if category is not None:
            queryset = queryset.filter(category=category)
        return paginated_response(
            request, queryset.order_by("sort_order", "created_at"), lambda item: serialize_faq_management(item, request), default_page_size=30
        )

    def post(self, request: Request) -> Response:
        serializer = FaqCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faq = create_faq(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_faq_management(faq, request), status=201)


class FaqDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"content:read"}, "PATCH": {"content:write"}}

    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_faq_management(_get_or_404(FaqItem, object_id, "FAQ"), request))

    def patch(self, request: Request, object_id: str) -> Response:
        faq = _get_or_404(FaqItem, object_id, "FAQ")
        serializer = FaqPatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = update_faq(actor=request.user, faq=faq, payload=serializer.validated_data)
        return Response(serialize_faq_management(updated, request))


class _FaqActionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"POST": {"content:publish"}}
    service = None

    def post(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        assert self.service is not None
        self.service(actor=request.user, faq=_get_or_404(FaqItem, object_id, "FAQ"))
        return Response(status=204)


class FaqPublishView(_FaqActionView):
    service = staticmethod(publish_faq)


class FaqArchiveView(_FaqActionView):
    service = staticmethod(archive_faq)


class FaqFeaturedView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"PATCH": {"content:write"}}

    def patch(self, request: Request, object_id: str) -> Response:
        serializer = FeaturedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        faq = set_faq_featured(actor=request.user, faq=_get_or_404(FaqItem, object_id, "FAQ"), payload=serializer.validated_data)
        return Response({"id": str(faq.id), "is_featured": faq.is_featured})


class BannerCollectionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"banner:read"}, "POST": {"banner:write"}}

    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"active", "page", "page_size"})
        active = parse_optional_bool(request, "active")
        queryset = HomepageBanner.objects.select_related("image_asset").order_by("sort_order", "created_at")
        if active is not None:
            queryset = queryset.filter(is_active=active)
        return paginated_response(request, queryset, lambda item: serialize_banner_management(item, request), default_page_size=30)

    def post(self, request: Request) -> Response:
        serializer = BannerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        banner = create_banner(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_banner_management(banner, request), status=201)


class BannerDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"banner:read"}, "PATCH": {"banner:write"}}

    def _get(self, object_id: str) -> HomepageBanner:
        return _get_or_404(HomepageBanner, object_id, "Banner", queryset=HomepageBanner.objects.select_related("image_asset"))

    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_banner_management(self._get(object_id), request))

    def patch(self, request: Request, object_id: str) -> Response:
        banner = self._get(object_id)
        serializer = BannerPatchSerializer(data=request.data, context={"banner": banner})
        serializer.is_valid(raise_exception=True)
        updated = update_banner(actor=request.user, banner=banner, payload=serializer.validated_data)
        return Response(serialize_banner_management(self._get(str(updated.id)), request))
