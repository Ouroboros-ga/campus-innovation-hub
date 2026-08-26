"""BE-050：组队作者处理申请 API 的契约测试。"""

from __future__ import annotations

from django.test import Client, TestCase

from apps.accounts.models import User, UserProfile
from apps.audit.models import AuditLog
from apps.competitions.models import Competition
from apps.notifications.models import Notification
from apps.teams.models import TeamApplication, TeamPost, TeamRole


class TeamApplicationOwnerApiTests(TestCase):
    def setUp(self) -> None:
        self.author = self.create_user("20265001", "帖子作者")
        self.applicant = self.create_user("20265002", "申请同学")
        self.other = self.create_user("20265003", "无关同学")
        self.other_author = self.create_user("20265004", "其他作者")
        self.competition = Competition.objects.create(
            name="BE050 组队申请竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="用于验证组队作者处理申请的公开竞赛。",
            publication_state=Competition.PublicationState.PUBLISHED,
            created_by=self.author,
            updated_by=self.author,
        )
        self.team = self.create_team(author=self.author, title="寻找算法方向队友")
        self.role = TeamRole.objects.create(team_post=self.team, name="算法", headcount=2, sort_order=0)
        self.application = self.create_application(team=self.team, role=self.role, applicant=self.applicant)

    @staticmethod
    def create_user(student_no: str, real_name: str) -> User:
        user = User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name=real_name,
            password="SafePassword123!",
        )
        UserProfile.objects.create(user=user, nickname=real_name, major="人工智能", grade=2)
        return user

    def create_team(self, *, author: User, title: str) -> TeamPost:
        return TeamPost.objects.create(
            competition=self.competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title=title,
            direction="多模态算法",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="author@example.edu",
        )

    @staticmethod
    def create_application(*, team: TeamPost, role: TeamRole | None, applicant: User) -> TeamApplication:
        return TeamApplication.objects.create(
            team_post=team,
            desired_role=role,
            applicant=applicant,
            self_intro="我有较扎实的算法和工程实践基础。",
            skills="Python、PyTorch",
            experience="参加过校级人工智能创新项目。",
            motivation="希望和团队一起完成有挑战的竞赛项目。",
            weekly_commitment="每周八小时",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="applicant@example.edu",
        )

    def csrf_client(self, user: User) -> tuple[Client, str]:
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.get("/api/auth/csrf").status_code, 204)
        client.force_login(user)
        return client, client.cookies["csrftoken"].value

    def test_author_lists_pending_application_and_accepts_it(self) -> None:
        anonymous = Client()
        self.assertEqual(anonymous.get(f"/api/teams/{self.team.id}/applications").status_code, 401)

        other_client, _ = self.csrf_client(self.other)
        self.assertEqual(other_client.get(f"/api/teams/{self.team.id}/applications").status_code, 403)

        author_client, csrf_token = self.csrf_client(self.author)
        response = author_client.get(f"/api/teams/{self.team.id}/applications?status=PENDING")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        item = response.json()["results"][0]
        self.assertEqual(item["id"], str(self.application.id))
        self.assertEqual(
            set(item),
            {
                "id",
                "team_post_id",
                "desired_role",
                "applicant",
                "self_intro",
                "skills",
                "experience",
                "motivation",
                "weekly_commitment",
                "contact_method",
                "contact_value",
                "status",
                "processed_at",
                "created_at",
                "updated_at",
            },
        )
        self.assertEqual(item["team_post_id"], str(self.team.id))
        self.assertEqual(item["desired_role"], {"id": str(self.role.id), "name": "算法"})
        self.assertEqual(item["applicant"]["id"], str(self.applicant.id))
        self.assertEqual(item["contact_value"], "applicant@example.edu")
        self.assertNotIn("real_name", item["applicant"])

        self.assertEqual(
            author_client.post(f"/api/team-applications/{self.application.id}/accept").status_code,
            403,
        )
        response = author_client.post(
            f"/api/team-applications/{self.application.id}/accept",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 204)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, TeamApplication.Status.ACCEPTED)
        self.assertIsNotNone(self.application.processed_at)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.applicant,
                notification_type=Notification.NotificationType.TEAM,
                title="组队申请已通过",
            ).exists()
        )
        self.assertTrue(AuditLog.objects.filter(action="TEAM_APPLICATION_ACCEPTED", target_id=self.application.id).exists())

        second_applicant = self.create_user("20265005", "第二申请同学")
        second_application = self.create_application(team=self.team, role=self.role, applicant=second_applicant)
        response = author_client.post(
            f"/api/team-applications/{second_application.id}/accept",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")

        response = author_client.post(
            f"/api/team-applications/{self.application.id}/accept",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")

    def test_author_can_reject_only_own_pending_application(self) -> None:
        author_client, csrf_token = self.csrf_client(self.author)
        response = author_client.post(
            f"/api/team-applications/{self.application.id}/reject",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 204)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, TeamApplication.Status.REJECTED)
        self.assertIsNotNone(self.application.processed_at)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.applicant,
                notification_type=Notification.NotificationType.TEAM,
                title="组队申请未通过",
            ).exists()
        )

        other_team = self.create_team(author=self.other_author, title="其他组队帖子")
        other_role = TeamRole.objects.create(team_post=other_team, name="前端", headcount=1, sort_order=0)
        other_application = self.create_application(team=other_team, role=other_role, applicant=self.other)
        response = author_client.post(
            f"/api/team-applications/{other_application.id}/reject",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 403)
        other_application.refresh_from_db()
        self.assertEqual(other_application.status, TeamApplication.Status.PENDING)

        response = author_client.get(f"/api/teams/{self.team.id}/applications?status=INVALID")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
        self.assertEqual(author_client.get("/api/teams/00000000-0000-0000-0000-000000000000/applications").status_code, 404)
        response = author_client.post(
            "/api/team-applications/not-a-uuid/reject",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
        self.assertTrue(AuditLog.objects.filter(action="TEAM_APPLICATION_REJECTED", target_id=self.application.id).exists())
