"""运营咨询读取与正式回复 HTTP 层。"""

from __future__ import annotations

from rest_framework.request import Request
from rest_framework.response import Response

from apps.consultations.models import Consultation
from apps.consultations.services import reply_to_consultation
from apps.domain_errors import NotFound
from apps.ops_api.base import OperatorAPIView
from apps.ops_api.serializers import ConsultationReplySerializer, serialize_consultation_management, serialize_reply_management
from apps.public_api.query import filter_text, paginated_response, parse_optional_enum, parse_uuid, validate_query_keys


def _consultation_or_404(object_id: str) -> Consultation:
    consultation = Consultation.objects.select_related("author", "author__profile", "author__profile__avatar_asset", "competition").prefetch_related(
        "replies__author", "replies__author__profile", "replies__author__profile__avatar_asset"
    ).filter(id=parse_uuid(object_id)).first()
    if consultation is None:
        raise NotFound("咨询不存在。")
    return consultation


class ConsultationCollectionView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "visibility", "category", "page", "page_size"})
        queryset = Consultation.objects.select_related("author", "author__profile", "author__profile__avatar_asset", "competition").prefetch_related(
            "replies__author", "replies__author__profile", "replies__author__profile__avatar_asset"
        )
        queryset = filter_text(queryset, request.query_params.get("q"), ("title", "body_md"))
        status = parse_optional_enum(request, "status", Consultation.Status.values)
        visibility = parse_optional_enum(request, "visibility", Consultation.Visibility.values)
        category = parse_optional_enum(request, "category", Consultation.Category.values)
        if status is not None:
            queryset = queryset.filter(status=status)
        if visibility is not None:
            queryset = queryset.filter(visibility=visibility)
        if category is not None:
            queryset = queryset.filter(category=category)
        return paginated_response(
            request, queryset.order_by("-created_at"), lambda item: serialize_consultation_management(item, request), default_page_size=30
        )


class ConsultationDetailView(OperatorAPIView):
    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_consultation_management(_consultation_or_404(object_id), request))


class ConsultationReplyView(OperatorAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        serializer = ConsultationReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = reply_to_consultation(
            actor=request.user, consultation=_consultation_or_404(object_id), body_md=serializer.validated_data["body_md"]
        )
        reply = reply.__class__.objects.select_related("author", "author__profile", "author__profile__avatar_asset").get(pk=reply.pk)
        return Response(serialize_reply_management(reply, request), status=201)
