"""BE-040：运营 API 的 HTTP 合同测试。"""

from __future__ import annotations

from datetime import timedelta
import json

from django.db import DataError
from django.test import Client, TestCase
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.audit.models import AuditLog
from apps.competitions.models import Competition
from apps.consultations.models import Consultation
from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.activities.services import create_activity_with_announcement


class OperatorApiTests(TestCase):
    """运营端点只能由平台 OPERATOR 或 SUPERADMIN 使用。"""

    def setUp(self) -> None:
        self.operator = self.create_user(
            "20264001", "运营人员", platform_role=User.PlatformRole.OPERATOR
        )
        self.student = self.create_user("20264002", "普通学生")
        self.author = self.create_user("20264003", "咨询学生")
        self.superadmin = self.create_user("20264004", "系统管理员", is_superuser=True, is_staff=True)
        self.image_asset = MediaAsset.objects.create(
            created_by=self.operator,
            kind=MediaAsset.Kind.IMAGE,
            object_key="be040-tests/banner.png",
            original_name="banner.png",
            mime_type="image/png",
            size_bytes=4,
            sha256="b" * 64,
            width=1,
            height=1,
            status=MediaAsset.Status.ACTIVE,
        )

    def create_user(self, username: str, real_name: str, **extra: object) -> User:
        user = User.objects.create_user(
            username=username,
            student_no=username,
            real_name=real_name,
            password="SafePassword123!",
            **extra,
        )
        UserProfile.objects.create(user=user, nickname=real_name, major="人工智能", grade=2)
        return user

    def csrf_client(self, user: User) -> tuple[Client, str]:
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.get("/api/auth/csrf").status_code, 204)
        client.force_login(user)
        return client, client.cookies["csrftoken"].value

    def test_operator_can_read_empty_competition_management_collection(self) -> None:
        """运营员最小读入口存在，且空列表使用统一分页形状。"""

        operator_client, _ = self.csrf_client(self.operator)
        response = operator_client.get("/api/ops/competitions")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_operator_lists_default_to_contractual_page_size_thirty(self) -> None:
        Competition.objects.bulk_create(
            [
                Competition(
                    name=f"分页竞赛 {index}",
                    edition="2026",
                    category=Competition.Category.AI,
                    level=Competition.Level.SCHOOL,
                    participation_mode=Competition.ParticipationMode.TEAM,
                    description_md="用于验证运营列表的默认分页大小。",
                    created_by=self.operator,
                    updated_by=self.operator,
                )
                for index in range(31)
            ]
        )
        client, _ = self.csrf_client(self.operator)
        response = client.get("/api/ops/competitions")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 31)
        self.assertEqual(len(response.json()["results"]), 30)
        self.assertIsNotNone(response.json()["next"])

    def competition_payload(self, *, name: str = "BE-040 竞赛") -> dict[str, object]:
        now = timezone.now()
        return {
            "name": name,
            "edition": "2026",
            "category": Competition.Category.AI,
            "level": Competition.Level.SCHOOL,
            "participation_mode": Competition.ParticipationMode.TEAM,
            "suitable_grade_min": 1,
            "suitable_grade_max": 4,
            "summary": "运营接口合同测试使用的竞赛。",
            "description_md": "该竞赛用于验证运营人员的发布和时间线管理。",
            "registration_start_at": now.isoformat(),
            "registration_end_at": (now + timedelta(days=7)).isoformat(),
            "college_organized": True,
            "cover_asset_id": str(self.image_asset.id),
        }

    def activity_payload(self, *, title: str = "BE-040 活动") -> dict[str, object]:
        now = timezone.now()
        return {
            "title": title,
            "activity_type": Activity.ActivityType.TECH_SHARING,
            "summary": "运营接口合同测试使用的活动。",
            "description_md": "该活动用于验证报名、取消和导出管理。",
            "organizer_name": "人工智能学院",
            "location": "信息楼 A101",
            "start_at": (now + timedelta(days=2)).isoformat(),
            "end_at": (now + timedelta(days=2, hours=2)).isoformat(),
            "registration_required": True,
            "registration_start_at": (now - timedelta(hours=1)).isoformat(),
            "registration_end_at": (now + timedelta(days=1)).isoformat(),
            "capacity": 10,
            "cover_asset_id": str(self.image_asset.id),
        }

    def announcement_payload(self, *, title: str = "BE-040 公告") -> dict[str, object]:
        return {
            "title": title,
            "summary": "运营接口合同测试使用的公告。",
            "body_md": "该公告用于验证通用公告不会产生个人通知。",
            "publisher_scope": Announcement.PublisherScope.ACADEMY,
            "is_pinned": False,
        }

    def test_permission_csrf_and_invalid_uuid_boundaries(self) -> None:
        anonymous = Client(enforce_csrf_checks=True)
        self.assertEqual(anonymous.post("/api/ops/competitions", data="{}", content_type="application/json").status_code, 401)

        student_client, _ = self.csrf_client(self.student)
        response = student_client.get("/api/ops/competitions")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "PERMISSION_DENIED")

        superadmin_client, _ = self.csrf_client(self.superadmin)
        self.assertEqual(superadmin_client.get("/api/ops/competitions").status_code, 200)

        operator_client, csrf = self.csrf_client(self.operator)
        self.assertEqual(
            operator_client.post("/api/ops/competitions", data=self.competition_payload(), content_type="application/json").status_code,
            403,
        )
        response = operator_client.get("/api/ops/competitions/not-a-uuid")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
        response = operator_client.post(
            "/api/ops/competitions",
            data={**self.competition_payload(name="非法外链竞赛"), "official_url": "ftp://example.edu/rule"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")

    def test_competition_crud_lifecycle_feature_and_timeline_are_audited(self) -> None:
        client, csrf = self.csrf_client(self.operator)
        response = client.post(
            "/api/ops/competitions", data=self.competition_payload(), content_type="application/json", HTTP_X_CSRFTOKEN=csrf
        )
        self.assertEqual(response.status_code, 201)
        competition_id = response.json()["id"]
        self.assertEqual(response.json()["publication_state"], Competition.PublicationState.DRAFT)
        self.assertNotIn("object_key", response.json()["cover"])
        self.assertEqual(client.get(f"/api/ops/competitions/{competition_id}").status_code, 200)

        response = client.post(
            "/api/ops/competitions",
            data=self.competition_payload(name="同届名称冲突竞赛"),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        response = client.patch(
            f"/api/ops/competitions/{competition_id}",
            data={"name": "同届名称冲突竞赛"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")

        self.assertEqual(client.get("/api/ops/competitions?status=DRAFT&ordering=created_at").status_code, 200)
        response = client.patch(
            f"/api/ops/competitions/{competition_id}",
            data={"summary": "已更新的竞赛摘要。"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["summary"], "已更新的竞赛摘要。")
        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        response = client.patch(
            f"/api/ops/competitions/{competition_id}/featured",
            data={"is_featured": True, "featured_order": 2},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_featured"])

        response = client.post(
            f"/api/ops/competitions/{competition_id}/timeline-events",
            data={"title": "报名截止", "event_at": timezone.now().isoformat(), "sort_order": 0},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        event_id = response.json()["id"]
        self.assertEqual(
            client.patch(
                f"/api/ops/competitions/{competition_id}/timeline-events/{event_id}",
                data={"description": "请在截止前完成报名。"},
                content_type="application/json",
                HTTP_X_CSRFTOKEN=csrf,
            ).status_code,
            200,
        )
        self.assertEqual(
            client.delete(f"/api/ops/competitions/{competition_id}/timeline-events/{event_id}", HTTP_X_CSRFTOKEN=csrf).status_code,
            204,
        )
        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/cancel", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        response = client.post(f"/api/ops/competitions/{competition_id}/publish", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")
        self.assertGreaterEqual(AuditLog.objects.filter(target_id=competition_id).count(), 6)

    def test_incomplete_drafts_return_422_when_published(self) -> None:
        incomplete_competition = Competition.objects.create(
            name="",
            edition="",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="",
            created_by=self.operator,
            updated_by=self.operator,
        )
        incomplete_activity = Activity.objects.create(
            title="",
            activity_type=Activity.ActivityType.TECH_SHARING,
            description_md="",
            location="",
            start_at=timezone.now(),
            created_by=self.operator,
            updated_by=self.operator,
        )
        client, csrf = self.csrf_client(self.operator)
        for path in (
            f"/api/ops/competitions/{incomplete_competition.id}/publish",
            f"/api/ops/activities/{incomplete_activity.id}/publish",
        ):
            with self.subTest(path=path):
                response = client.post(path, HTTP_X_CSRFTOKEN=csrf)
                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.json()["code"], "INVALID_STATE")

    def test_activity_registration_export_cancel_notification_and_lifecycle(self) -> None:
        client, csrf = self.csrf_client(self.operator)
        response = client.post(
            "/api/ops/activities", data=self.activity_payload(), content_type="application/json", HTTP_X_CSRFTOKEN=csrf
        )
        self.assertEqual(response.status_code, 201)
        activity_id = response.json()["id"]
        self.assertEqual(client.get(f"/api/ops/activities/{activity_id}").status_code, 200)
        self.assertEqual(
            client.patch(
                f"/api/ops/activities/{activity_id}",
                data={"speaker": "李老师"},
                content_type="application/json",
                HTTP_X_CSRFTOKEN=csrf,
            ).status_code,
            200,
        )
        self.assertEqual(client.post(f"/api/ops/activities/{activity_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(
            client.patch(
                f"/api/ops/activities/{activity_id}/featured",
                data={"is_featured": True, "featured_order": 1},
                content_type="application/json",
                HTTP_X_CSRFTOKEN=csrf,
            ).status_code,
            200,
        )
        activity = Activity.objects.get(pk=activity_id)
        Registration.objects.create(
            activity=activity,
            user=self.student,
            name_snapshot="普通学生",
            student_no_snapshot=self.student.student_no,
            major_snapshot="人工智能",
            grade_snapshot=2,
        )
        anonymous = Client(enforce_csrf_checks=True)
        self.assertEqual(anonymous.get(f"/api/ops/activities/{activity_id}/registrations").status_code, 401)
        student_client, student_csrf = self.csrf_client(self.student)
        self.assertEqual(student_client.get(f"/api/ops/activities/{activity_id}/registrations").status_code, 403)
        self.assertEqual(
            student_client.post(f"/api/ops/activities/{activity_id}/export-registrations", HTTP_X_CSRFTOKEN=student_csrf).status_code,
            403,
        )
        response = client.get(f"/api/ops/activities/{activity_id}/registrations?status=REGISTERED")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["student_no_snapshot"], self.student.student_no)
        response = client.post(f"/api/ops/activities/{activity_id}/export-registrations", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        self.assertTrue(bytes(response.content).startswith(b"\xef\xbb\xbf"))
        self.assertIn(self.student.student_no.encode(), bytes(response.content))
        self.assertEqual(client.post(f"/api/ops/activities/{activity_id}/cancel", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertTrue(
            Notification.objects.filter(recipient=self.student, notification_type=Notification.NotificationType.ACTIVITY).exists()
        )
        self.assertEqual(client.post(f"/api/ops/activities/{activity_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)

        response = client.post(
            "/api/ops/activities", data=self.activity_payload(title="关闭报名活动"), content_type="application/json", HTTP_X_CSRFTOKEN=csrf
        )
        close_id = response.json()["id"]
        self.assertEqual(client.post(f"/api/ops/activities/{close_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.post(f"/api/ops/activities/{close_id}/close-registration", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.get("/api/ops/activities?status=PUBLISHED").status_code, 200)
        audit_json = json.dumps(list(AuditLog.objects.filter(actor=self.operator).values_list("changes_json", flat=True)), ensure_ascii=False)
        for sensitive_key in ("student_no_snapshot", "contact_value", "body_md"):
            self.assertNotIn(sensitive_key, audit_json)

    def test_dynamic_combined_creation_is_atomic_and_does_not_broadcast(self) -> None:
        client, csrf = self.csrf_client(self.operator)
        initial_activity_count = Activity.objects.count()
        initial_announcement_count = Announcement.objects.count()
        response = client.post(
            "/api/ops/dynamics/activity-with-announcement",
            data={
                "activity": self.activity_payload(title="会回滚的活动"),
                "announcement": {**self.announcement_payload(title="非法关联公告"), "activity_id": "not-allowed"},
                "publish": True,
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Activity.objects.count(), initial_activity_count)
        self.assertEqual(Announcement.objects.count(), initial_announcement_count)

        response = client.post(
            "/api/ops/dynamics/activity-with-announcement",
            data={
                "activity": self.activity_payload(title="组合发布活动"),
                "announcement": self.announcement_payload(title="组合发布公告"),
                "publish": True,
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["activity"]["publication_state"], Activity.PublicationState.PUBLISHED)
        self.assertEqual(response.json()["announcement"]["publication_state"], Announcement.PublicationState.PUBLISHED)
        self.assertEqual(response.json()["announcement"]["activity_id"], response.json()["activity"]["id"])
        self.assertEqual(Notification.objects.count(), 0)

    def test_combined_service_database_error_rolls_back_both_entities(self) -> None:
        """在 Activity 已插入后触发 PostgreSQL varchar 错误，证明 atomic 不是仅校验层承诺。"""

        initial_activity_count = Activity.objects.count()
        initial_announcement_count = Announcement.objects.count()
        with self.assertRaises(DataError):
            create_activity_with_announcement(
                actor=self.operator,
                activity_payload=self.activity_payload(title="服务层回滚活动"),
                announcement_payload={**self.announcement_payload(), "title": "超长公告" * 41},
                publish=False,
            )
        self.assertEqual(Activity.objects.count(), initial_activity_count)
        self.assertEqual(Announcement.objects.count(), initial_announcement_count)

    def test_content_and_banner_management_lifecycles_are_complete_and_audited(self) -> None:
        client, csrf = self.csrf_client(self.operator)
        response = client.post(
            "/api/ops/announcements", data=self.announcement_payload(), content_type="application/json", HTTP_X_CSRFTOKEN=csrf
        )
        self.assertEqual(response.status_code, 201)
        announcement_id = response.json()["id"]
        self.assertEqual(client.get("/api/ops/announcements?status=DRAFT").status_code, 200)
        self.assertEqual(client.get(f"/api/ops/announcements/{announcement_id}").status_code, 200)
        self.assertEqual(
            client.patch(
                f"/api/ops/announcements/{announcement_id}", data={"is_pinned": True}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf
            ).status_code,
            200,
        )
        self.assertEqual(client.post(f"/api/ops/announcements/{announcement_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.post(f"/api/ops/announcements/{announcement_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(Notification.objects.count(), 0)

        guide_payload = {
            "title": "运营指南", "category": GuideArticle.Category.COMPETITION, "body_md": "请按指南完成报名。", "competition_ids": [], "is_featured": False, "featured_order": 0
        }
        response = client.post("/api/ops/guides", data=guide_payload, content_type="application/json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 201)
        guide_id = response.json()["id"]
        self.assertEqual(client.get("/api/ops/guides?category=COMPETITION").status_code, 200)
        self.assertEqual(client.get(f"/api/ops/guides/{guide_id}").status_code, 200)
        self.assertEqual(client.patch(f"/api/ops/guides/{guide_id}", data={"summary": "更新摘要"}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertEqual(client.post(f"/api/ops/guides/{guide_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.patch(f"/api/ops/guides/{guide_id}/featured", data={"is_featured": True, "featured_order": 3}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertEqual(client.post(f"/api/ops/guides/{guide_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)

        faq_payload = {"category": FaqItem.Category.COMPETITION, "question": "如何报名？", "answer_md": "请在活动页面提交报名。", "sort_order": 0, "is_featured": False}
        response = client.post("/api/ops/faq", data=faq_payload, content_type="application/json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 201)
        faq_id = response.json()["id"]
        self.assertEqual(client.get("/api/ops/faq?status=DRAFT").status_code, 200)
        self.assertEqual(client.get(f"/api/ops/faq/{faq_id}").status_code, 200)
        self.assertEqual(client.patch(f"/api/ops/faq/{faq_id}", data={"sort_order": 2}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertEqual(client.post(f"/api/ops/faq/{faq_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.patch(f"/api/ops/faq/{faq_id}/featured", data={"is_featured": True}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertEqual(client.post(f"/api/ops/faq/{faq_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)

        banner_payload = {"title": "首页 Banner", "image_asset_id": str(self.image_asset.id), "link_type": HomepageBanner.LinkType.INTERNAL, "internal_path": "/activities", "is_active": True, "sort_order": 0}
        self.assertEqual(client.get("/api/ops/banners?active=true").status_code, 200)
        response = client.post(
            "/api/ops/banners",
            data={**banner_payload, "title": "非法站内跳转", "internal_path": "//evil.example"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        response = client.post(
            "/api/ops/banners",
            data={**banner_payload, "title": "畸形站内跳转", "internal_path": "//["},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        response = client.post("/api/ops/banners", data=banner_payload, content_type="application/json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 201)
        banner_id = response.json()["id"]
        self.assertEqual(client.get(f"/api/ops/banners/{banner_id}").status_code, 200)
        response = client.patch(
            f"/api/ops/banners/{banner_id}",
            data={"internal_path": "/%2f%2fevil.example"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(client.patch(f"/api/ops/banners/{banner_id}", data={"is_active": False}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertGreaterEqual(AuditLog.objects.filter(actor=self.operator).count(), 12)

    def test_operator_can_read_private_consultations_and_reply_with_notification(self) -> None:
        consultation = Consultation.objects.create(
            author=self.author,
            category=Consultation.Category.ACTIVITY,
            title="活动报名后如何查看状态？",
            body_md="我已经报名活动，但不知道在哪里查看自己的报名状态。",
            visibility=Consultation.Visibility.PRIVATE,
        )
        client, csrf = self.csrf_client(self.operator)
        self.assertEqual(client.get("/api/ops/consultations?visibility=PRIVATE").status_code, 200)
        self.assertEqual(client.get(f"/api/ops/consultations/{consultation.id}").status_code, 200)
        response = client.post(
            f"/api/ops/consultations/{consultation.id}/replies",
            data={"body_md": "可在个人中心的活动报名记录中查看当前状态。"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        consultation.refresh_from_db()
        self.assertEqual(consultation.status, Consultation.Status.ANSWERED)
        self.assertTrue(Notification.objects.filter(recipient=self.author, notification_type=Notification.NotificationType.CONSULTATION).exists())
        reply_audit = AuditLog.objects.get(action="CONSULTATION_REPLIED")
        self.assertNotIn("body_md", json.dumps(reply_audit.changes_json, ensure_ascii=False))
        self.assertNotIn("student_no", json.dumps(reply_audit.changes_json, ensure_ascii=False))
        consultation.status = Consultation.Status.CLOSED
        consultation.save(update_fields=["status"])
        response = client.post(
            f"/api/ops/consultations/{consultation.id}/replies",
            data={"body_md": "已关闭咨询不能继续回复。"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")
