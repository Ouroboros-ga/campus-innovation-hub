"""组队广场运营 API — 只读列表与下架。"""

from __future__ import annotations

from rest_framework.request import Request
from rest_framework.response import Response

from django.db import transaction
from django.utils import timezone

from apps.audit.services import record_audit
from apps.ops_api.base import OperatorAPIView, require_empty_body
from apps.public_api.query import filter_text, paginated_response, parse_optional_enum, parse_optional_uuid, validate_query_keys
from apps.public_api.serializers import serialize_team_post
from apps.teams.models import TeamPost


class TeamCollectionView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "competition_id", "post_type", "status", "page", "page_size"})
        competition_id = parse_optional_uuid(request, "competition_id")
        post_type = parse_optional_enum(request, "post_type", TeamPost.PostType.values)
        status = parse_optional_enum(request, "status", TeamPost.Status.values)

        queryset = TeamPost.objects.select_related(
            "competition", "author", "author__profile", "author__profile__avatar_asset"
        ).prefetch_related("roles", "applications")

        queryset = filter_text(queryset, request.query_params.get("q"), ("title", "direction", "team_name"))
        if competition_id is not None:
            queryset = queryset.filter(competition_id=competition_id)
        if post_type is not None:
            queryset = queryset.filter(post_type=post_type)
        if status is not None:
            queryset = queryset.filter(status=status)

        return paginated_response(request, queryset.order_by("-created_at"), lambda item: serialize_team_post(item, request), default_page_size=30)


class TeamDetailView(OperatorAPIView):
    def get(self, request: Request, object_id: str) -> Response:
        from apps.public_api.query import parse_uuid
        from apps.domain_errors import NotFound

        team = TeamPost.objects.select_related(
            "competition", "author", "author__profile", "author__profile__avatar_asset"
        ).prefetch_related("roles", "applications").filter(id=parse_uuid(object_id)).first()
        if team is None:
            raise NotFound("组队不存在。")
        return Response(serialize_team_post(team, request))


class TeamCloseView(OperatorAPIView):
    @transaction.atomic
    def post(self, request: Request, object_id: str) -> Response:
        from apps.public_api.query import parse_uuid
        from apps.domain_errors import InvalidState, NotFound

        require_empty_body(request)
        team = TeamPost.objects.select_for_update().filter(id=parse_uuid(object_id)).first()
        if team is None:
            raise NotFound("组队不存在。")
        if team.status == TeamPost.Status.CLOSED:
            raise InvalidState("组队已关闭。")
        previous_status = team.status
        team.status = TeamPost.Status.CLOSED
        team.closed_at = timezone.now()
        team.save(update_fields=["status", "closed_at", "updated_at"])
        record_audit(
            actor=request.user,
            action="TEAM_POST_CLOSED_BY_OPERATOR",
            target=team,
            changes={"status": {"from": previous_status, "to": TeamPost.Status.CLOSED}},
        )
        return Response(status=204)
