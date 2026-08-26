"""BE-020：已登录学生 API 的 HTTP 契约测试。"""

from __future__ import annotations

from io import BytesIO
import tempfile
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.utils import timezone
from PIL import Image

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition, Follow
from apps.consultations.models import Consultation, Reply
from apps.media.models import MediaAsset
from apps.media.storage import get_object_storage
from apps.notifications.models import Notification
from apps.organizations.models import Organization, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.teams.models import TeamApplication, TeamPost, TeamRole


class AuthenticatedStudentApiTests(TestCase):
    """先从 Follow 路由验证 Session、CSRF 与冲突的统一边界。"""

    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="20260001",
            student_no="20260001",
            real_name="学生用户",
            password="SafePassword123!",
        )
        self.operator = User.objects.create_user(
            username="20260002",
            student_no="20260002",
            real_name="运营用户",
            password="SafePassword123!",
            platform_role=User.PlatformRole.OPERATOR,
        )
        UserProfile.objects.create(user=self.user, nickname="学生", grade=2, major="人工智能")
        self.competition = Competition.objects.create(
            name="学生 API 测试竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="用于验证已登录学生 API 的公开竞赛。",
            publication_state=Competition.PublicationState.PUBLISHED,
            created_by=self.operator,
            updated_by=self.operator,
        )
        self.author = User.objects.create_user(
            username="20260003",
            student_no="20260003",
            real_name="组队作者",
            password="SafePassword123!",
        )
        UserProfile.objects.create(user=self.author, nickname="作者", grade=3, major="人工智能")
        self.other = User.objects.create_user(
            username="20260004",
            student_no="20260004",
            real_name="其他学生",
            password="SafePassword123!",
        )
        UserProfile.objects.create(user=self.other, nickname="其他", grade=2, major="人工智能")
        self.team = TeamPost.objects.create(
            competition=self.competition,
            author=self.author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找算法方向队友",
            direction="多模态算法",
            base_member_count=1,
            target_member_count=3,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="author@example.edu",
        )
        self.team_role = TeamRole.objects.create(team_post=self.team, name="算法", headcount=2, sort_order=0)
        self.organization = Organization.objects.create(
            name="学生 API 招新组织",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            is_active=True,
            created_by=self.operator,
            updated_by=self.operator,
        )
        now = timezone.now()
        self.recruitment = Recruitment.objects.create(
            organization=self.organization,
            title="学生 API 招新",
            intro_md="欢迎加入学生 API 招新组织。",
            apply_start_at=now - timedelta(days=1),
            apply_end_at=now + timedelta(days=1),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=self.operator,
            updated_by=self.operator,
        )
        self.position = RecruitmentPosition.objects.create(
            recruitment=self.recruitment,
            name="开发",
            headcount=2,
            sort_order=0,
        )
        self.activity = Activity.objects.create(
            title="学生 API 活动",
            activity_type=Activity.ActivityType.TECH_SHARING,
            description_md="用于验证活动报名与取消的公开活动。",
            location="学院报告厅",
            start_at=now + timedelta(days=2),
            registration_required=True,
            registration_start_at=now - timedelta(days=1),
            registration_end_at=now + timedelta(days=1),
            capacity=2,
            publication_state=Activity.PublicationState.PUBLISHED,
            created_by=self.operator,
            updated_by=self.operator,
        )

    def csrf_client(self, user: User) -> tuple[Client, str]:
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.get("/api/auth/csrf").status_code, 204)
        client.force_login(user)
        return client, client.cookies["csrftoken"].value

    def test_follow_requires_session_and_csrf_and_rejects_duplicates(self) -> None:
        path = f"/api/competitions/{self.competition.id}/follow"

        anonymous = Client(enforce_csrf_checks=True)
        response = anonymous.post(path)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["code"], "AUTH_REQUIRED")

        client, csrf_token = self.csrf_client(self.user)
        response = client.post(path)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "PERMISSION_DENIED")

        response = client.post(path, HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 204)
        self.assertTrue(Follow.objects.filter(competition=self.competition, user=self.user).exists())

        response = client.post(path, HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "ALREADY_FOLLOWED")

        response = client.delete(path, HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Follow.objects.filter(competition=self.competition, user=self.user).exists())

        response = client.delete(path, HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 404)

    def test_team_post_write_close_and_application_withdrawal(self) -> None:
        author_client, author_csrf = self.csrf_client(self.author)
        team_payload = {
            "competition_id": str(self.competition.id),
            "post_type": "TEAM_RECRUITING",
            "title": "创建一个组队帖子",
            "team_name": "创新小队",
            "direction": "多模态算法",
            "base_member_count": 1,
            "target_member_count": 3,
            "contact_method": "EMAIL",
            "contact_value": "owner@example.edu",
            "roles": [{"name": "算法", "headcount": 2, "requirements": "Python"}],
        }
        response = author_client.post("/api/teams", data=team_payload, content_type="application/json", HTTP_X_CSRFTOKEN=author_csrf)
        self.assertEqual(response.status_code, 201)
        created_team_id = response.json()["id"]
        self.assertEqual(response.json()["contact_value"], "owner@example.edu")

        response = author_client.patch(
            f"/api/teams/{created_team_id}",
            data={"target_member_count": 4, "roles": [{"name": "算法", "headcount": 3, "sort_order": 0}]},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=author_csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["target_member_count"], 4)

        applicant_client, applicant_csrf = self.csrf_client(self.user)
        response = applicant_client.post(
            f"/api/teams/{self.team.id}/applications",
            data={
                "desired_role_id": str(self.team_role.id),
                "self_intro": "我有扎实的算法基础和竞赛经验。",
                "motivation": "希望与大家一起完成比赛项目。",
                "contact_method": "EMAIL",
                "contact_value": "student@example.edu",
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=applicant_csrf,
        )
        self.assertEqual(response.status_code, 201)
        application_id = response.json()["id"]
        self.assertNotIn("contact_value", response.json())

        response = applicant_client.post(
            f"/api/teams/{self.team.id}/applications",
            data={
                "desired_role_id": str(self.team_role.id),
                "self_intro": "我有扎实的算法基础和竞赛经验。",
                "motivation": "希望与大家一起完成比赛项目。",
                "contact_method": "EMAIL",
                "contact_value": "student@example.edu",
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=applicant_csrf,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "DUPLICATE_APPLICATION")

        other_client, other_csrf = self.csrf_client(self.other)
        response = other_client.post(f"/api/team-applications/{application_id}/withdraw", HTTP_X_CSRFTOKEN=other_csrf)
        self.assertEqual(response.status_code, 403)

        response = applicant_client.post(f"/api/team-applications/{application_id}/withdraw", HTTP_X_CSRFTOKEN=applicant_csrf)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(TeamApplication.objects.get(id=application_id).status, TeamApplication.Status.WITHDRAWN)

        response = author_client.post(f"/api/teams/{created_team_id}/close", HTTP_X_CSRFTOKEN=author_csrf)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(TeamPost.objects.get(id=created_team_id).status, TeamPost.Status.CLOSED)

    def test_recruitment_activity_and_consultation_boundaries(self) -> None:
        client, csrf_token = self.csrf_client(self.user)
        response = client.post(
            f"/api/recruitments/{self.recruitment.id}/applications",
            data={
                "position_id": str(self.position.id),
                "self_intro": "我有组织活动和开发项目的经验。",
                "motivation": "希望贡献自己的开发能力。",
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 201)
        recruitment_application_id = response.json()["id"]

        response = client.post(
            f"/api/recruitments/{self.recruitment.id}/applications",
            data={
                "position_id": str(self.position.id),
                "self_intro": "我有组织活动和开发项目的经验。",
                "motivation": "希望贡献自己的开发能力。",
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 409)

        response = client.post(
            f"/api/recruitment-applications/{recruitment_application_id}/withdraw",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(
            RecruitmentApplication.objects.get(id=recruitment_application_id).status,
            RecruitmentApplication.Status.WITHDRAWN,
        )

        response = client.post(f"/api/activities/{self.activity.id}/register", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 201)
        registration_id = response.json()["id"]
        self.assertEqual(response.json()["activity_id"], str(self.activity.id))

        response = client.post(f"/api/activities/{self.activity.id}/register", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 409)
        response = client.post(f"/api/activities/{self.activity.id}/cancel-registration", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Registration.objects.get(id=registration_id).status, Registration.Status.CANCELLED)

        response = client.post(
            "/api/consultations",
            data={
                "category": "COMPETITION",
                "competition_id": str(self.competition.id),
                "title": "如何准备人工智能竞赛？",
                "body_md": "请问在赛前应该如何安排人工智能竞赛的学习计划？",
                "visibility": "PRIVATE",
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 201)
        consultation_id = response.json()["id"]
        self.assertEqual(client.get(f"/api/consultations/{consultation_id}").status_code, 200)

        other_client, _other_csrf = self.csrf_client(self.other)
        self.assertEqual(other_client.get(f"/api/consultations/{consultation_id}").status_code, 404)

        public_consultation = Consultation.objects.create(
            author=self.author,
            category=Consultation.Category.OTHER,
            title="公开咨询是否可见？",
            body_md="这是已经得到答复的公开咨询正文，用于验证匿名可读边界。",
            visibility=Consultation.Visibility.PUBLIC,
            status=Consultation.Status.ANSWERED,
        )
        Reply.objects.create(
            consultation=public_consultation,
            author=self.operator,
            body_md="这是运营人员提供的正式答复。",
        )
        response = Client().get(f"/api/consultations/{public_consultation.id}")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("author", response.json())

    def test_notifications_are_scoped_and_media_never_exposes_object_key(self) -> None:
        Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.NotificationType.TEAM,
            title="你的组队申请有新进展",
            action_path=f"/teams/{self.team.id}",
        )
        other_notification = Notification.objects.create(
            recipient=self.other,
            notification_type=Notification.NotificationType.SYSTEM,
            title="其他用户的消息",
        )
        client, csrf_token = self.csrf_client(self.user)

        response = client.get("/api/notifications?unread=true&type=TEAM")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        notification_id = response.json()["results"][0]["id"]
        self.assertEqual(client.get("/api/notifications/unread-count").json(), {"count": 1})

        response = client.post(f"/api/notifications/{notification_id}/read", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(client.get("/api/notifications/unread-count").json(), {"count": 0})
        self.assertEqual(client.post("/api/notifications/read-all", HTTP_X_CSRFTOKEN=csrf_token).status_code, 204)
        response = client.post(f"/api/notifications/{other_notification.id}/read", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 404)

        image_buffer = BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_buffer, format="PNG")
        png = image_buffer.getvalue()
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root, MEDIA_PUBLIC_BASE_URL="/media/"):
            get_object_storage.cache_clear()
            response = client.post(
                "/api/media/upload",
                data={"kind": "IMAGE", "file": SimpleUploadedFile("pixel.png", png, content_type="image/png")},
                HTTP_X_CSRFTOKEN=csrf_token,
            )
            avif_buffer = BytesIO()
            Image.new("RGB", (1, 1), color="white").save(avif_buffer, format="AVIF")
            avif_response = client.post(
                "/api/media/upload",
                data={"kind": "IMAGE", "file": SimpleUploadedFile("pixel.avif", avif_buffer.getvalue(), content_type="image/avif")},
                HTTP_X_CSRFTOKEN=csrf_token,
            )
            get_object_storage.cache_clear()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["mime_type"], "image/png")
        self.assertEqual(response.json()["width"], 1)
        self.assertNotIn("object_key", response.json())
        self.assertNotIn("sha256", response.json())
        self.assertEqual(avif_response.status_code, 201)
        self.assertEqual(avif_response.json()["mime_type"], "image/avif")

        before_invalid_uploads = MediaAsset.objects.count()
        response = client.post(
            "/api/media/upload",
            data={"kind": "IMAGE", "file": SimpleUploadedFile("fake.png", b"not-an-image", content_type="image/png")},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "UNSUPPORTED_MEDIA")
        response = client.post(
            "/api/media/upload",
            data={"kind": "IMAGE", "file": SimpleUploadedFile("large.png", b"x" * (5 * 1024 * 1024 + 1), content_type="image/png")},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "UNSUPPORTED_MEDIA")
        self.assertEqual(MediaAsset.objects.count(), before_invalid_uploads)

        response = client.post(
            "/api/media/upload",
            data={"kind": "DOCUMENT", "file": SimpleUploadedFile("file.txt", b"not enabled", content_type="text/plain")},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "UNSUPPORTED_MEDIA")

    def test_shared_write_authentication_and_invalid_uuid_boundaries(self) -> None:
        anonymous = Client(enforce_csrf_checks=True)
        self.assertEqual(anonymous.post("/api/teams", data={}, content_type="application/json").status_code, 401)

        client, csrf_token = self.csrf_client(self.user)
        self.assertEqual(client.post("/api/teams", data={}, content_type="application/json").status_code, 403)

        invalid_paths = (
            "/api/competitions/not-a-uuid/follow",
            "/api/teams/not-a-uuid/close",
            "/api/teams/not-a-uuid/applications",
            "/api/team-applications/not-a-uuid/withdraw",
            "/api/recruitments/not-a-uuid/applications",
            "/api/recruitment-applications/not-a-uuid/withdraw",
            "/api/activities/not-a-uuid/register",
            "/api/activities/not-a-uuid/cancel-registration",
            "/api/notifications/not-a-uuid/read",
        )
        for path in invalid_paths:
            with self.subTest(path=path):
                response = client.post(path, HTTP_X_CSRFTOKEN=csrf_token)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
        response = Client().get("/api/consultations/not-a-uuid")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")

    def test_team_contact_is_visible_only_to_author_or_accepted_applicant(self) -> None:
        guest_response = Client().get(f"/api/teams/{self.team.id}")
        self.assertNotIn("contact_method", guest_response.json())
        self.assertNotIn("contact_value", guest_response.json())

        author_client = Client()
        author_client.force_login(self.author)
        author_response = author_client.get(f"/api/teams/{self.team.id}")
        self.assertEqual(author_response.json()["contact_value"], "author@example.edu")

        TeamApplication.objects.create(
            team_post=self.team,
            desired_role=self.team_role,
            applicant=self.user,
            self_intro="我有扎实的算法基础和竞赛经验。",
            motivation="希望与大家一起完成比赛项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="student@example.edu",
            status=TeamApplication.Status.ACCEPTED,
        )
        accepted_client = Client()
        accepted_client.force_login(self.user)
        accepted_response = accepted_client.get(f"/api/teams/{self.team.id}")
        self.assertEqual(accepted_response.json()["contact_value"], "author@example.edu")

        other_client = Client()
        other_client.force_login(self.other)
        other_response = other_client.get(f"/api/teams/{self.team.id}")
        self.assertNotIn("contact_method", other_response.json())
        self.assertNotIn("contact_value", other_response.json())
