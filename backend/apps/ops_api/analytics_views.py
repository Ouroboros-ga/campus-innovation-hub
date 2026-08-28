"""运营 7 日/day 趋势聚合 — TruncDate + 零填充 + 短缓存。"""

from __future__ import annotations

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.cache import cache
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.activities.models import Activity
from apps.competitions.models import Competition
from apps.consultations.models import Consultation
from apps.content.models import Announcement
from apps.ops_api.base import OperatorAPIView
from apps.organizations.models import Recruitment
from apps.public_api.query import validate_query_keys
from apps.teams.models import TeamPost


def _parse_days(request: Request) -> int:
    raw = request.query_params.get("days")
    if raw is None or raw == "":
        return 7
    try:
        value = int(raw)
    except ValueError:
        from rest_framework.exceptions import ValidationError

        raise ValidationError({"days": ["必须是整数。"]})
    if not 1 <= value <= 30:
        from rest_framework.exceptions import ValidationError

        raise ValidationError({"days": ["范围 1-30。"]})
    return value


def _daily_counts(model, start_date, end_date):  # noqa: ANN001
    """返回 {date_str: count} ，按 Asia/Shanghai 口径 TruncDate（PostgreSQL 专用，SQLite 不用于生产验证）。"""
    tz = ZoneInfo("Asia/Shanghai")
    # 以 Asia/Shanghai 午夜为边界，避免 __date 在 UTC 口径下跨天
    start_dt = timezone.make_aware(datetime.combine(start_date, time.min), tz)
    end_dt = timezone.make_aware(datetime.combine(end_date, time.max), tz)
    rows = (
        model.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)
        .annotate(day=TruncDate("created_at", tzinfo=tz))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    mapping = {str(row["day"]): row["count"] for row in rows if row["day"] is not None}
    return mapping


class AnalyticsTrendsView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"days"})
        days = _parse_days(request)
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)
        end_date = today

        cache_key = f"ops:analytics:trends:{days}:{start_date}:{end_date}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        date_list = [start_date + timedelta(days=i) for i in range(days)]
        date_strs = [str(d) for d in date_list]

        models_map = {
            "competitions": Competition,
            "activities": Activity,
            "announcements": Announcement,
            "team_posts": TeamPost,
            "recruitments": Recruitment,
            "consultations": Consultation,
            "users": User,
        }

        series: dict[str, list[dict[str, object]]] = {}
        totals: dict[str, int] = {}
        for key, model in models_map.items():
            if key == "users":
                # User 用 date_joined 而非 created_at
                tz = ZoneInfo("Asia/Shanghai")
                start_dt = timezone.make_aware(datetime.combine(start_date, time.min), tz)
                end_dt = timezone.make_aware(datetime.combine(end_date, time.max), tz)
                rows = (
                    model.objects.filter(date_joined__gte=start_dt, date_joined__lte=end_dt)
                    .annotate(day=TruncDate("date_joined", tzinfo=tz))
                    .values("day")
                    .annotate(count=Count("id"))
                    .order_by("day")
                )
                mapping = {str(r["day"]): r["count"] for r in rows if r["day"] is not None}
            else:
                mapping = _daily_counts(model, start_date, end_date)
            points = [{"date": d, "count": int(mapping.get(d, 0))} for d in date_strs]
            series[key] = points
            totals[key] = sum(p["count"] for p in points)  # type: ignore[arg-type]

        payload = {
            "days": days,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "series": series,
            "totals": totals,
        }
        cache.set(cache_key, payload, timeout=300)
        return Response(payload)
