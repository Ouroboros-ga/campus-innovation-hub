"""活动运营、敏感报名导出与校园动态组合发布 HTTP 层。"""

from __future__ import annotations

import csv
from io import StringIO

from django.http import HttpResponse
from rest_framework.request import Request
from rest_framework.response import Response

from apps.activities.models import Activity, Registration
from apps.activities.services import (
    archive_activity,
    cancel_activity,
    close_activity_registration,
    create_activity,
    create_activity_with_announcement,
    export_activity_registrations,
    publish_activity,
    set_activity_featured,
    update_activity,
)
from apps.domain_errors import NotFound
from apps.ops_api.base import OperatorAPIView, require_empty_body
from apps.ops_api.serializers import (
    ActivityCreateSerializer,
    ActivityPatchSerializer,
    DynamicActivityAnnouncementSerializer,
    FeaturedSerializer,
    serialize_activity_management,
    serialize_announcement_management,
    serialize_registration_management,
)
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_enum,
    parse_uuid,
    validate_query_keys,
)


def _activity_or_404(object_id: str) -> Activity:
    activity = Activity.objects.select_related("organizer_organization", "cover_asset").filter(id=parse_uuid(object_id)).first()
    if activity is None:
        raise NotFound("活动不存在。")
    return activity


class ActivityCollectionView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"activity:read"}, "POST": {"activity:write"}}

    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "activity_type", "page", "page_size"})
        status = parse_optional_enum(request, "status", Activity.PublicationState.values)
        activity_type = parse_optional_enum(request, "activity_type", Activity.ActivityType.values)
        queryset = Activity.objects.select_related("organizer_organization", "cover_asset")
        queryset = filter_text(queryset, request.query_params.get("q"), ("title", "summary", "location", "organizer_name"))
        if status is not None:
            queryset = queryset.filter(publication_state=status)
        if activity_type is not None:
            queryset = queryset.filter(activity_type=activity_type)
        return paginated_response(
            request, queryset.order_by("start_at"), lambda item: serialize_activity_management(item, request), default_page_size=30
        )

    def post(self, request: Request) -> Response:
        serializer = ActivityCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = create_activity(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_activity_management(_activity_or_404(str(activity.id)), request), status=201)


class ActivityDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"activity:read"}, "PATCH": {"activity:write"}}

    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_activity_management(_activity_or_404(object_id), request))

    def patch(self, request: Request, object_id: str) -> Response:
        activity = _activity_or_404(object_id)
        serializer = ActivityPatchSerializer(data=request.data, context={"activity": activity})
        serializer.is_valid(raise_exception=True)
        updated = update_activity(actor=request.user, activity=activity, payload=serializer.validated_data)
        return Response(serialize_activity_management(_activity_or_404(str(updated.id)), request))


class _ActivityActionView(OperatorAPIView):
    service = None

    def post(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        assert self.service is not None
        self.service(actor=request.user, activity=_activity_or_404(object_id))
        return Response(status=204)


class ActivityPublishView(_ActivityActionView):
    agent_access = True
    agent_scopes = {"POST": {"activity:publish"}}
    service = staticmethod(publish_activity)


class ActivityCancelView(_ActivityActionView):
    agent_access = True
    agent_scopes = {"POST": {"activity:publish"}}
    service = staticmethod(cancel_activity)


class ActivityArchiveView(_ActivityActionView):
    agent_access = True
    agent_scopes = {"POST": {"activity:publish"}}
    service = staticmethod(archive_activity)


class ActivityCloseRegistrationView(_ActivityActionView):
    agent_access = True
    agent_scopes = {"POST": {"activity:publish"}}
    service = staticmethod(close_activity_registration)


class ActivityFeaturedView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"PATCH": {"activity:write"}}

    def patch(self, request: Request, object_id: str) -> Response:
        serializer = FeaturedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = set_activity_featured(
            actor=request.user, activity=_activity_or_404(object_id), payload=serializer.validated_data
        )
        return Response(
            {"id": str(activity.id), "is_featured": activity.is_featured, "featured_order": activity.featured_order}
        )


class ActivityRegistrationCollectionView(OperatorAPIView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, {"status", "page", "page_size"})
        status = parse_optional_enum(request, "status", Registration.Status.values)
        queryset = Registration.objects.filter(activity=_activity_or_404(object_id)).select_related("user").order_by("registered_at", "id")
        if status is not None:
            queryset = queryset.filter(status=status)
        return paginated_response(request, queryset, serialize_registration_management, default_page_size=30)


class ActivityRegistrationExportView(OperatorAPIView):
    def post(self, request: Request, object_id: str) -> HttpResponse:
        require_empty_body(request)
        validate_query_keys(request, {"status"})
        status = parse_optional_enum(request, "status", Registration.Status.values)
        registrations = export_activity_registrations(actor=request.user, activity=_activity_or_404(object_id), status=status)
        output = StringIO(newline="")
        writer = csv.writer(output)
        writer.writerow(
            [
                "id", "user_id", "name_snapshot", "student_no_snapshot", "class_name_snapshot", "major_snapshot",
                "grade_snapshot", "status", "registered_at", "cancelled_at",
            ]
        )
        for registration in registrations:
            item = serialize_registration_management(registration)
            writer.writerow([item[key] for key in item])
        response = HttpResponse("\ufeff" + output.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="activity-registrations.csv"'
        return response


class DynamicActivityAnnouncementView(OperatorAPIView):
    def post(self, request: Request) -> Response:
        serializer = DynamicActivityAnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity, announcement = create_activity_with_announcement(
            actor=request.user,
            activity_payload=serializer.validated_data["activity"],
            announcement_payload=serializer.validated_data["announcement"],
            publish=serializer.validated_data["publish"],
        )
        return Response(
            {
                "activity": serialize_activity_management(_activity_or_404(str(activity.id)), request),
                "announcement": serialize_announcement_management(announcement, request),
            },
            status=201,
        )
