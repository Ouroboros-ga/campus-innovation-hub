"""竞赛运营 API。"""

from __future__ import annotations

from rest_framework.request import Request
from rest_framework.response import Response

from apps.competitions.models import Competition, TimelineEvent
from apps.competitions.services import (
    archive_competition,
    cancel_competition,
    create_competition,
    create_timeline_event,
    delete_timeline_event,
    publish_competition,
    set_competition_featured,
    update_competition,
    update_timeline_event,
)
from apps.domain_errors import NotFound
from apps.ops_api.base import OperatorAPIView, require_empty_body
from apps.ops_api.serializers import (
    CompetitionCreateSerializer,
    CompetitionPatchSerializer,
    FeaturedSerializer,
    TimelineEventCreateSerializer,
    TimelineEventPatchSerializer,
    serialize_competition_management,
    serialize_timeline_event_management,
)
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_enum,
    parse_ordering,
    parse_uuid,
    validate_query_keys,
)


def _competition_or_404(object_id: str) -> Competition:
    competition = Competition.objects.select_related("cover_asset").prefetch_related("timeline_events").filter(
        id=parse_uuid(object_id)
    ).first()
    if competition is None:
        raise NotFound("竞赛不存在。")
    return competition


def _timeline_or_404(competition: Competition, event_id: str) -> TimelineEvent:
    event = TimelineEvent.objects.filter(id=parse_uuid(event_id, field="eid"), competition=competition).first()
    if event is None:
        raise NotFound("时间线节点不存在。")
    return event


class CompetitionCollectionView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "category", "level", "ordering", "page", "page_size"})
        status = parse_optional_enum(request, "status", Competition.PublicationState.values)
        category = parse_optional_enum(request, "category", Competition.Category.values)
        level = parse_optional_enum(request, "level", Competition.Level.values)
        ordering = parse_ordering(request, {"created_at", "-created_at", "registration_end_at", "-registration_end_at"})
        queryset = Competition.objects.select_related("cover_asset").prefetch_related("timeline_events")
        queryset = filter_text(queryset, request.query_params.get("q"), ("name", "edition", "summary", "direction"))
        if status is not None:
            queryset = queryset.filter(publication_state=status)
        if category is not None:
            queryset = queryset.filter(category=category)
        if level is not None:
            queryset = queryset.filter(level=level)
        queryset = queryset.order_by(ordering or "-created_at")
        return paginated_response(request, queryset, lambda item: serialize_competition_management(item, request), default_page_size=30)

    def post(self, request: Request) -> Response:
        serializer = CompetitionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        competition = create_competition(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_competition_management(_competition_or_404(str(competition.id)), request), status=201)


class CompetitionDetailView(OperatorAPIView):
    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_competition_management(_competition_or_404(object_id), request))

    def patch(self, request: Request, object_id: str) -> Response:
        competition = _competition_or_404(object_id)
        serializer = CompetitionPatchSerializer(data=request.data, context={"competition": competition})
        serializer.is_valid(raise_exception=True)
        updated = update_competition(actor=request.user, competition=competition, payload=serializer.validated_data)
        return Response(serialize_competition_management(_competition_or_404(str(updated.id)), request))


class _CompetitionActionView(OperatorAPIView):
    service = None

    def post(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        competition = _competition_or_404(object_id)
        assert self.service is not None
        self.service(actor=request.user, competition=competition)
        return Response(status=204)


class CompetitionPublishView(_CompetitionActionView):
    service = staticmethod(publish_competition)


class CompetitionCancelView(_CompetitionActionView):
    service = staticmethod(cancel_competition)


class CompetitionArchiveView(_CompetitionActionView):
    service = staticmethod(archive_competition)


class CompetitionFeaturedView(OperatorAPIView):
    def patch(self, request: Request, object_id: str) -> Response:
        serializer = FeaturedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        competition = set_competition_featured(
            actor=request.user, competition=_competition_or_404(object_id), payload=serializer.validated_data
        )
        return Response(
            {
                "id": str(competition.id),
                "is_featured": competition.is_featured,
                "featured_order": competition.featured_order,
            }
        )


class CompetitionTimelineCollectionView(OperatorAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        serializer = TimelineEventCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = create_timeline_event(
            actor=request.user, competition=_competition_or_404(object_id), payload=serializer.validated_data
        )
        return Response(serialize_timeline_event_management(event), status=201)


class CompetitionTimelineDetailView(OperatorAPIView):
    def patch(self, request: Request, object_id: str, event_id: str) -> Response:
        competition = _competition_or_404(object_id)
        event = _timeline_or_404(competition, event_id)
        serializer = TimelineEventPatchSerializer(data=request.data, context={"event": event})
        serializer.is_valid(raise_exception=True)
        updated = update_timeline_event(actor=request.user, competition=competition, event=event, payload=serializer.validated_data)
        return Response(serialize_timeline_event_management(updated))

    def delete(self, request: Request, object_id: str, event_id: str) -> Response:
        require_empty_body(request)
        competition = _competition_or_404(object_id)
        delete_timeline_event(actor=request.user, competition=competition, event=_timeline_or_404(competition, event_id))
        return Response(status=204)
