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
    delete_competition,
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
    parse_optional_bool,
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
    agent_access = True
    agent_scopes = {"GET": {"competition:read"}, "POST": {"competition:write"}}

    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "category", "level", "is_featured", "ordering", "page", "page_size"})
        status = parse_optional_enum(request, "status", Competition.PublicationState.values)
        category = parse_optional_enum(request, "category", Competition.Category.values)
        level = parse_optional_enum(request, "level", Competition.Level.values)
        ordering = parse_ordering(request, {"created_at", "-created_at", "registration_end_at", "-registration_end_at"})
        is_featured = parse_optional_bool(request, "is_featured")
        queryset = Competition.objects.select_related("cover_asset").prefetch_related("timeline_events")
        queryset = filter_text(queryset, request.query_params.get("q"), ("name", "edition", "summary", "direction"))
        if status is not None:
            queryset = queryset.filter(publication_state=status)
        if category is not None:
            queryset = queryset.filter(category=category)
        if level is not None:
            queryset = queryset.filter(level=level)
        if is_featured is not None:
            queryset = queryset.filter(is_featured=is_featured)
        queryset = queryset.order_by(ordering or "-created_at")
        return paginated_response(request, queryset, lambda item: serialize_competition_management(item, request), default_page_size=30)

    def post(self, request: Request) -> Response:
        serializer = CompetitionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        competition = create_competition(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_competition_management(_competition_or_404(str(competition.id)), request), status=201)


class CompetitionDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"GET": {"competition:read"}, "PATCH": {"competition:write"}, "DELETE": {"competition:write"}}

    def get(self, request: Request, object_id: str) -> Response:
        return Response(serialize_competition_management(_competition_or_404(object_id), request))

    def patch(self, request: Request, object_id: str) -> Response:
        competition = _competition_or_404(object_id)
        serializer = CompetitionPatchSerializer(data=request.data, context={"competition": competition})
        serializer.is_valid(raise_exception=True)
        updated = update_competition(actor=request.user, competition=competition, payload=serializer.validated_data)
        return Response(serialize_competition_management(_competition_or_404(str(updated.id)), request))

    def delete(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        delete_competition(actor=request.user, competition=_competition_or_404(object_id))
        return Response(status=204)


class _CompetitionActionView(OperatorAPIView):
    service = None

    def post(self, request: Request, object_id: str) -> Response:
        require_empty_body(request)
        competition = _competition_or_404(object_id)
        assert self.service is not None
        self.service(actor=request.user, competition=competition)
        return Response(status=204)


class CompetitionPublishView(_CompetitionActionView):
    agent_access = True
    agent_scopes = {"POST": {"competition:publish"}}
    service = staticmethod(publish_competition)


class CompetitionCancelView(_CompetitionActionView):
    agent_access = True
    agent_scopes = {"POST": {"competition:publish"}}
    service = staticmethod(cancel_competition)


class CompetitionArchiveView(_CompetitionActionView):
    agent_access = True
    agent_scopes = {"POST": {"competition:publish"}}
    service = staticmethod(archive_competition)


class CompetitionFeaturedView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"PATCH": {"competition:write"}}

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
    agent_access = True
    agent_scopes = {"POST": {"competition:write"}}

    def post(self, request: Request, object_id: str) -> Response:
        serializer = TimelineEventCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = create_timeline_event(
            actor=request.user, competition=_competition_or_404(object_id), payload=serializer.validated_data
        )
        return Response(serialize_timeline_event_management(event), status=201)


class CompetitionTimelineDetailView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"PATCH": {"competition:write"}, "DELETE": {"competition:write"}}

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


class CompetitionImportView(OperatorAPIView):
    def post(self, request: Request) -> Response:
        file = request.FILES.get("file")
        if file is None:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": ["请上传 .xlsx 文件。"]})
        name = getattr(file, "name", "") or ""
        if not name.lower().endswith(".xlsx"):
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": ["仅支持 .xlsx 文件。"]})
        if file.size and file.size > 5 * 1024 * 1024:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": ["文件大小不能超过 5MB。"]})
        try:
            import openpyxl  # type: ignore
        except ImportError as exc:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": ["服务器未安装 openpyxl，无法解析 Excel。"]}) from exc
        try:
            wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
            ws = wb.active
            if ws is None:
                raise ValueError("工作表为空。")
            rows = list(ws.iter_rows(values_only=True))
        except Exception as exc:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": [f"解析 Excel 失败：{exc}"]}) from exc
        if not rows:
            return Response({"success": 0, "failed": 0, "errors": []})
        header = [str(c or "").strip().lower() for c in rows[0]]
        # 期望表头：name, edition, category, level 等（大小写不敏感）
        required = {"name", "edition"}
        missing = required - set(header)
        if missing:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": [f"表头缺少必填列：{', '.join(sorted(missing))}"]})
        idx = {h: i for i, h in enumerate(header)}
        success = 0
        failed = 0
        errors: list[dict] = []
        from django.db import transaction

        for row_num, row in enumerate(rows[1:], start=2):
            if row is None or all(c is None or str(c).strip() == "" for c in row):
                continue
            try:
                payload = {
                    "name": str(row[idx["name"]] or "").strip(),
                    "edition": str(row[idx["edition"]] or "").strip(),
                    "category": str(row[idx.get("category", -1)] or "OTHER").strip().upper() if "category" in idx else "OTHER",
                    "level": str(row[idx.get("level", -1)] or "SCHOOL").strip().upper() if "level" in idx else "SCHOOL",
                    "participation_mode": str(row[idx.get("participation_mode", -1)] or "TEAM").strip().upper() if "participation_mode" in idx else "TEAM",
                    "registration_start_at": None,
                    "registration_end_at": None,
                    "official_url": str(row[idx.get("official_url", -1)] or "").strip() or None,
                    "description_md": str(row[idx.get("description_md", -1)] or "").strip() or "批量导入",
                }
                # 尝试解析可选日期/链接等
                if "registration_end_at" in idx and row[idx["registration_end_at"]]:
                    payload["registration_end_at"] = str(row[idx["registration_end_at"]]).strip()
                serializer = CompetitionCreateSerializer(data=payload)
                serializer.is_valid(raise_exception=True)
                with transaction.atomic():
                    create_competition(actor=request.user, payload=serializer.validated_data)
                success += 1
            except Exception as exc:
                failed += 1
                msg = getattr(exc, "detail", None) or str(exc)
                if isinstance(msg, dict):
                    msg = "; ".join(f"{k}: {v}" for k, v in msg.items())
                errors.append({"row": row_num, "message": str(msg)[:500]})
                if len(errors) >= 50:
                    break
        return Response({"success": success, "failed": failed, "errors": errors})
