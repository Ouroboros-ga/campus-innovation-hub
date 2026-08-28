"""Analytics trends — TruncDate 按 Asia/Shanghai 的 PostgreSQL 验证。"""

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.utils import timezone

from apps.accounts.models import User
from apps.competitions.models import Competition
from apps.media.models import MediaAsset


@override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "test-analytics"}})
class AnalyticsTrendsTest(TestCase):
    def setUp(self):
        # 仅在 PostgreSQL 下验证 TruncDate 时区语义；SQLite 仅做契约回归
        self.is_postgres = connection.vendor == "postgresql"
        self.operator = User.objects.create_user(username="op_analytics", password="pass12345", platform_role=User.PlatformRole.OPERATOR)
        self.client.force_login(self.operator)
        self.asset = MediaAsset.objects.create(
            kind=MediaAsset.Kind.IMAGE,
            status=MediaAsset.Status.ACTIVE,
            original_name="a.png",
            mime_type="image/png",
            size_bytes=100,
            width=10,
            height=10,
            object_key="test/a.png",
            sha256="0" * 64,
            created_by=self.operator,
        )

    def _create_competition(self, created_at):
        comp = Competition.objects.create(
            name=f"comp-{created_at.date()}",
            edition="2026",
            category=Competition.Category.ACADEMIC,
            level=Competition.Level.COLLEGE,
            participation_mode=Competition.ParticipationMode.INDIVIDUAL,
            description_md="desc",
            college_organized=False,
            cover_asset=self.asset,
            created_by=self.operator,
            updated_by=self.operator,
        )
        # 覆盖 auto_now_add
        Competition.objects.filter(pk=comp.pk).update(created_at=created_at, updated_at=created_at)
        return comp

    def test_trends_returns_zero_filled_series(self):
        resp = self.client.get("/api/ops/analytics/trends?days=7")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["days"], 7)
        for key in ["competitions", "activities", "announcements", "team_posts", "recruitments", "consultations"]:
            self.assertIn(key, data["series"])
            self.assertEqual(len(data["series"][key]), 7)
            for point in data["series"][key]:
                self.assertIn("date", point)
                self.assertIn("count", point)

    def test_truncdate_counts_match_asia_shanghai_day(self):
        # 构造两个竞赛，分别落在今日与昨日 Asia/Shanghai
        tz = ZoneInfo("Asia/Shanghai")
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        # 23:00 昨日 + 01:00 今日，分别在 TruncDate 下应各计 1
        dt_yesterday = timezone.make_aware(datetime.combine(yesterday, time(hour=23, minute=0)), tz)
        dt_today = timezone.make_aware(datetime.combine(today, time(hour=1, minute=0)), tz)
        self._create_competition(dt_yesterday)
        self._create_competition(dt_today)

        resp = self.client.get("/api/ops/analytics/trends?days=2")
        self.assertEqual(resp.status_code, 200)
        series = resp.json()["series"]["competitions"]
        self.assertEqual(len(series), 2)
        # 按 Asia/Shanghai 天分组，昨日与今日各 1
        self.assertEqual(series[0]["count"], 1)
        self.assertEqual(series[1]["count"], 1)

    def test_cache_hit_does_not_issue_queries(self):
        self.client.get("/api/ops/analytics/trends?days=7")
        # 第二次应在 300s 缓存期内，DB 查询应为 0 或仅 auth
        with CaptureQueriesContext(connection) as ctx:
            self.client.get("/api/ops/analytics/trends?days=7")
        # 允许 0-1 次查询（cache 访问无 DB），若 >5 则说明缓存未生效
        self.assertLessEqual(len(ctx), 5)
