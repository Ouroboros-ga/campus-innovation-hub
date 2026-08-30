"""BE-040：运营 API 的 HTTP 合同测试。"""

from __future__ import annotations

from datetime import timedelta
import json
from unittest import mock

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DataError
from django.test import Client, TestCase
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.activities.services import create_activity_with_announcement
from apps.audit.models import AuditLog
from apps.competitions.models import Competition
from apps.competitions.services import competition_allowed_actions
from apps.consultations.models import Consultation
from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner, SiteDocument
from apps.media.models import MediaAsset
from apps.notifications.models import Notification


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

    def guide_payload(self, *, title: str = "BE-040 指南") -> dict[str, object]:
        return {
            "title": title,
            "category": GuideArticle.Category.COMPETITION,
            "body_md": "该指南用于验证创建即发布的原子性。",
            "competition_ids": [],
            "is_featured": False,
            "featured_order": 0,
        }

    def faq_payload(self, *, question: str = "如何报名竞赛？") -> dict[str, object]:
        return {
            "category": FaqItem.Category.COMPETITION,
            "question": question,
            "answer_md": "请在竞赛详情页提交报名。",
            "sort_order": 0,
            "is_featured": False,
        }

    def site_document_payload(self, *, slug: str = "task2-help") -> dict[str, object]:
        return {
            "slug": slug,
            "title": "Task2 使用帮助",
            "category": SiteDocument.Category.HELP,
            "body_md": "该文档用于验证创建即发布的原子性。",
        }

    def publication_cases(self) -> tuple[tuple[str, dict[str, object], type], ...]:
        """发布型内容的六个 collection：路径、最小合法载荷、模型类。"""

        return (
            ("/api/ops/competitions", self.competition_payload(name="原子发布竞赛"), Competition),
            ("/api/ops/activities", self.activity_payload(title="原子发布活动"), Activity),
            ("/api/ops/announcements", self.announcement_payload(title="原子发布公告"), Announcement),
            ("/api/ops/guides", self.guide_payload(title="原子发布指南"), GuideArticle),
            ("/api/ops/faq", self.faq_payload(question="原子发布 FAQ？"), FaqItem),
            ("/api/ops/documents", self.site_document_payload(slug="task2-published"), SiteDocument),
        )

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
                self.assertEqual(response.json()["code"], "PUBLICATION_INCOMPLETE")

    def test_create_intent_publishes_in_one_transaction(self) -> None:
        """`publish: true` 必须在同一事务内创建并发布，响应直接是已发布的管理详情。"""

        client, csrf = self.csrf_client(self.operator)
        for path, payload, model in self.publication_cases():
            with self.subTest(path=path):
                before = model.objects.count()
                response = client.post(
                    path, data={**payload, "publish": True}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf
                )
                self.assertEqual(response.status_code, 201)
                body = response.json()
                self.assertEqual(body["publication_state"], "PUBLISHED")
                self.assertIsNotNone(body["published_at"], f"{path} 未回填 published_at")
                self.assertIn("EDIT", body["allowed_actions"])
                self.assertNotIn("PUBLISH", body["allowed_actions"])
                self.assertEqual(model.objects.count(), before + 1)

                draft_payload = dict(payload)
                if "slug" in draft_payload:
                    draft_payload["slug"] = f"{draft_payload['slug']}-draft"
                if path == "/api/ops/competitions":
                    draft_payload["name"] = f"{draft_payload['name']}（草稿）"
                response = client.post(path, data=draft_payload, content_type="application/json", HTTP_X_CSRFTOKEN=csrf)
                self.assertEqual(response.status_code, 201)
                self.assertEqual(response.json()["publication_state"], "DRAFT")
                self.assertIsNone(response.json()["published_at"])

    def test_failed_publish_intent_rolls_back_the_whole_creation(self) -> None:
        """发布完整性校验失败时整体回滚，绝不留“已创建但未发布”的半成品。"""

        client, csrf = self.csrf_client(self.operator)
        for path, payload, model in self.publication_cases():
            with self.subTest(path=path):
                before = model.objects.count()
                publish_error = DjangoValidationError({"title": ["发布前内容不完整。"]})
                # 内容类草稿创建会先执行一次模型校验；第二次才是发布完整性校验。
                side_effect = (
                    [None, publish_error]
                    if model in {Announcement, GuideArticle, FaqItem, SiteDocument}
                    else publish_error
                )
                with mock.patch.object(
                    model, "full_clean", side_effect=side_effect
                ):
                    response = client.post(
                        path, data={**payload, "publish": True}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf
                    )
                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.json()["code"], "PUBLICATION_INCOMPLETE")
                self.assertEqual(response.json()["fieldErrors"], {"title": ["发布前内容不完整。"]})
                self.assertEqual(model.objects.count(), before)

    def test_published_content_accepts_patch_and_records_published_edit(self) -> None:
        """已发布内容可直接改，保存后即时对学生生效，但必须留下审计痕迹。"""

        client, csrf = self.csrf_client(self.operator)
        cases = (
            ("/api/ops/competitions", self.competition_payload(name="已发布可改竞赛"), {"summary": "发布后修正摘要。"}, "COMPETITION_UPDATED"),
            ("/api/ops/activities", self.activity_payload(title="已发布可改活动"), {"speaker": "李老师"}, "ACTIVITY_UPDATED"),
            ("/api/ops/announcements", self.announcement_payload(title="已发布可改公告"), {"summary": "发布后修正摘要。"}, "ANNOUNCEMENT_UPDATED"),
            ("/api/ops/guides", self.guide_payload(title="已发布可改指南"), {"summary": "发布后修正摘要。"}, "GUIDE_UPDATED"),
            ("/api/ops/faq", self.faq_payload(question="已发布可改 FAQ？"), {"answer_md": "发布后修正答案。"}, "FAQ_UPDATED"),
            ("/api/ops/documents", self.site_document_payload(slug="task2-published-edit"), {"summary": "发布后修正摘要。"}, "SITE_DOCUMENT_UPDATED"),
        )
        for path, payload, patch_payload, audit_action in cases:
            with self.subTest(path=path):
                response = client.post(
                    path, data={**payload, "publish": True}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf
                )
                self.assertEqual(response.status_code, 201)
                object_id = response.json()["id"]
                response = client.patch(
                    f"{path}/{object_id}", data=patch_payload, content_type="application/json", HTTP_X_CSRFTOKEN=csrf
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["publication_state"], "PUBLISHED")
                audit = AuditLog.objects.filter(action=audit_action, target_id=object_id).order_by("-created_at").first()
                self.assertIsNotNone(audit)
                self.assertTrue(audit.changes_json.get("published_edit"))

    def test_published_site_document_rejects_slug_change_but_keeps_other_updates_editable(self) -> None:
        """公开 URL 是稳定契约；已发布文档只能更新内容，不能改 slug。"""

        client, csrf = self.csrf_client(self.operator)
        created = client.post(
            "/api/ops/documents",
            data={**self.site_document_payload(slug="stable-help"), "publish": True},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(created.status_code, 201)
        document_id = created.json()["id"]

        rejected = client.patch(
            f"/api/ops/documents/{document_id}",
            data={"slug": "moved-help"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(rejected.json()["code"], "VALIDATION_ERROR")
        self.assertEqual(rejected.json()["fieldErrors"], {"slug": ["已发布文档的标识不可修改。"]})

        updated = client.patch(
            f"/api/ops/documents/{document_id}",
            data={"body_md": "已发布文档允许修订正文。"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["slug"], "stable-help")
        self.assertEqual(updated.json()["body_md"], "已发布文档允许修订正文。")

    def test_cancelled_and_archived_content_reject_patch(self) -> None:
        """CANCELLED / ARCHIVED 只读；PATCH 返回 409 而不是静默保存。"""

        client, csrf = self.csrf_client(self.operator)
        response = client.post(
            "/api/ops/competitions",
            data={**self.competition_payload(name="只读竞赛"), "publish": True},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        competition_id = response.json()["id"]
        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/cancel", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        for state in ("CANCELLED", "ARCHIVED"):
            with self.subTest(state=state):
                if state == "ARCHIVED":
                    self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
                response = client.patch(
                    f"/api/ops/competitions/{competition_id}",
                    data={"summary": f"{state} 后仍尝试修改。"},
                    content_type="application/json",
                    HTTP_X_CSRFTOKEN=csrf,
                )
                self.assertEqual(response.status_code, 409)
                self.assertEqual(response.json()["code"], "INVALID_STATE")

        # 内容型没有取消态，归档后同样只读。
        response = client.post(
            "/api/ops/announcements",
            data={**self.announcement_payload(title="只读公告"), "publish": True},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        announcement_id = response.json()["id"]
        self.assertEqual(client.post(f"/api/ops/announcements/{announcement_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        response = client.patch(
            f"/api/ops/announcements/{announcement_id}",
            data={"summary": "归档后仍尝试修改。"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")

    def test_allowed_actions_follow_state_and_actor(self) -> None:
        """allowed_actions 是后端按状态与数据约束算出来的，前端不得自行推断。"""

        client, csrf = self.csrf_client(self.operator)
        response = client.post(
            "/api/ops/competitions", data=self.competition_payload(name="动作矩阵竞赛"), content_type="application/json", HTTP_X_CSRFTOKEN=csrf
        )
        self.assertEqual(response.status_code, 201)
        competition_id = response.json()["id"]
        self.assertEqual(response.json()["allowed_actions"], ["EDIT", "PUBLISH", "DELETE_DRAFT"])

        superadmin_client, superadmin_csrf = self.csrf_client(self.superadmin)
        response = superadmin_client.get(f"/api/ops/competitions/{competition_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["allowed_actions"], ["EDIT", "PUBLISH", "DELETE_DRAFT"])

        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/publish", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(
            client.get(f"/api/ops/competitions/{competition_id}").json()["allowed_actions"],
            ["EDIT", "FEATURE", "CANCEL", "ARCHIVE"],
        )
        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/cancel", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.get(f"/api/ops/competitions/{competition_id}").json()["allowed_actions"], ["ARCHIVE"])
        self.assertEqual(client.post(f"/api/ops/competitions/{competition_id}/archive", HTTP_X_CSRFTOKEN=csrf).status_code, 204)
        self.assertEqual(client.get(f"/api/ops/competitions/{competition_id}").json()["allowed_actions"], [])

        # 列表同样携带 allowed_actions，避免前端在列表页自己猜。
        self.assertEqual(client.get("/api/ops/competitions?status=ARCHIVED").json()["results"][0]["allowed_actions"], [])

        # FAQ 没有取消态：已发布只给 EDIT / FEATURE / ARCHIVE。
        response = client.post(
            "/api/ops/faq",
            data={**self.faq_payload(question="动作矩阵 FAQ？"), "publish": True},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["allowed_actions"], ["EDIT", "FEATURE", "ARCHIVE"])

        # 同一状态下，无运营身份的调用者拿不到任何动作。
        competition = Competition.objects.get(pk=competition_id)
        self.assertEqual(competition_allowed_actions(actor=self.student, competition=competition), [])

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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], Consultation.Status.ANSWERED)
        self.assertEqual(response.json()["allowed_actions"], ["REPLY", "CLOSE"])
        self.assertEqual(len(response.json()["replies"]), 1)
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

    def test_operator_can_close_open_or_answered_consultation_but_not_close_twice(self) -> None:
        consultation = Consultation.objects.create(
            author=self.author,
            category=Consultation.Category.OTHER,
            title="如何补充咨询材料？",
            body_md="我想知道提交咨询后是否还可以补充更多背景材料。",
            visibility=Consultation.Visibility.PRIVATE,
        )
        client, csrf = self.csrf_client(self.operator)

        detail = client.get(f"/api/ops/consultations/{consultation.id}")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["allowed_actions"], ["REPLY", "CLOSE"])
        self.assertEqual(detail.json()["visibility"], Consultation.Visibility.PRIVATE)
        self.assertEqual(detail.json()["replies"], [])

        response = client.post(
            f"/api/ops/consultations/{consultation.id}/close",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], Consultation.Status.CLOSED)
        self.assertEqual(response.json()["allowed_actions"], [])
        consultation.refresh_from_db()
        self.assertEqual(consultation.status, Consultation.Status.CLOSED)
        self.assertTrue(AuditLog.objects.filter(action="CONSULTATION_CLOSED", target_id=consultation.id).exists())
        self.assertTrue(Notification.objects.filter(recipient=self.author, title="你的咨询已关闭").exists())

        response = client.post(
            f"/api/ops/consultations/{consultation.id}/close",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")
