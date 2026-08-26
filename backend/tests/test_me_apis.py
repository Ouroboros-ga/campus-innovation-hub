"""BE-050：个人中心聚合和只属于当前用户的列表契约测试。"""

from __future__ import annotations

from datetime import timedelta

from django.test import Client, TestCase
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition, Follow
from apps.consultations.models import Consultation
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.teams.models import TeamApplication, TeamPost, TeamRole


class MeApiTests(TestCase):
    def setUp(self) -> None:
        self.user = self.create_user("20265101", "个人中心同学")
        self.other = self.create_user("20265102", "其他同学")
        self.empty_user = self.create_user("20265104", "空数据同学")
        self.operator = self.create_user("20265103", "运营同学", platform_role=User.PlatformRole.OPERATOR)
        self.profile = UserProfile.objects.create(
            user=self.user,
            nickname="小智",
            class_name="人工智能 2301",
            major="人工智能",
            grade=3,
            bio="希望在真实项目中持续学习。",
            skills_json=["Python", "Vue"],
        )
        UserProfile.objects.create(user=self.other, nickname="其他", major="人工智能", grade=2)
        UserProfile.objects.create(user=self.empty_user, nickname="空数据", major="人工智能", grade=1)
        self.own_avatar = MediaAsset.objects.create(
            created_by=self.user,
            kind=MediaAsset.Kind.IMAGE,
            object_key="uploads/images/be050-own-avatar.png",
            original_name="own-avatar.png",
            mime_type="image/png",
            size_bytes=1,
            sha256="a" * 64,
            width=1,
            height=1,
        )
        self.other_avatar = MediaAsset.objects.create(
            created_by=self.other,
            kind=MediaAsset.Kind.IMAGE,
            object_key="uploads/images/be050-other-avatar.png",
            original_name="other-avatar.png",
            mime_type="image/png",
            size_bytes=1,
            sha256="b" * 64,
            width=1,
            height=1,
        )
        now = timezone.now()
        self.competition = Competition.objects.create(
            name="BE050 个人中心竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="用于验证个人中心关注和组队列表的公开竞赛。",
            publication_state=Competition.PublicationState.PUBLISHED,
            created_by=self.operator,
            updated_by=self.operator,
        )
        Follow.objects.create(user=self.user, competition=self.competition)
        self.authored_team = self.create_team(author=self.user, title="我发布的算法组队")
        self.joined_team = self.create_team(author=self.other, title="我加入的工程组队")
        self.joined_role = TeamRole.objects.create(team_post=self.joined_team, name="后端", headcount=2, sort_order=0)
        self.team_application = TeamApplication.objects.create(
            team_post=self.joined_team,
            desired_role=self.joined_role,
            applicant=self.user,
            self_intro="我有后端工程和团队协作的实践经验。",
            motivation="希望参与有完整交付目标的竞赛项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="student@example.edu",
            status=TeamApplication.Status.ACCEPTED,
            processed_at=now,
        )
        self.organization = Organization.objects.create(
            name="BE050 人工智能协会",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            is_active=True,
            created_by=self.operator,
            updated_by=self.operator,
        )
        OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.user,
            role=OrganizationMembership.Role.LEADER,
            title="技术部部长",
        )
        inactive_organization = Organization.objects.create(
            name="BE050 已退出组织",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            is_active=True,
            created_by=self.operator,
            updated_by=self.operator,
        )
        OrganizationMembership.objects.create(
            organization=inactive_organization,
            user=self.user,
            is_active=False,
            title="已退出成员",
        )
        self.recruitment = Recruitment.objects.create(
            organization=self.organization,
            title="BE050 组织招新",
            intro_md="欢迎有工程实践兴趣的同学加入。",
            apply_start_at=now - timedelta(days=1),
            apply_end_at=now + timedelta(days=1),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=self.operator,
            updated_by=self.operator,
        )
        position = RecruitmentPosition.objects.create(
            recruitment=self.recruitment,
            name="开发部干事",
            headcount=2,
            sort_order=0,
        )
        self.recruitment_application = RecruitmentApplication.objects.create(
            recruitment=self.recruitment,
            position=position,
            applicant=self.user,
            self_intro="我有持续参与社团项目的意愿。",
            motivation="希望用工程能力服务组织同学。",
        )
        self.activity = Activity.objects.create(
            title="BE050 技术分享",
            activity_type=Activity.ActivityType.TECH_SHARING,
            description_md="用于验证个人活动列表的公开活动。",
            location="学院报告厅",
            start_at=now + timedelta(days=2),
            registration_required=True,
            registration_start_at=now - timedelta(days=1),
            registration_end_at=now + timedelta(days=1),
            capacity=30,
            publication_state=Activity.PublicationState.PUBLISHED,
            created_by=self.operator,
            updated_by=self.operator,
        )
        self.registration = Registration.objects.create(
            activity=self.activity,
            user=self.user,
            name_snapshot=self.user.real_name,
            student_no_snapshot=self.user.student_no,
            class_name_snapshot=self.profile.class_name,
            major_snapshot=self.profile.major,
            grade_snapshot=self.profile.grade,
        )
        self.consultation = Consultation.objects.create(
            author=self.user,
            category=Consultation.Category.COMPETITION,
            competition=self.competition,
            title="如何准备这个竞赛？",
            body_md="想了解赛前准备和组队协作的合理安排。",
            visibility=Consultation.Visibility.PRIVATE,
            status=Consultation.Status.OPEN,
        )
        Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.NotificationType.SYSTEM,
            title="个人中心测试通知",
        )

    @staticmethod
    def create_user(student_no: str, real_name: str, **extra: object) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name=real_name,
            password="SafePassword123!",
            **extra,
        )

    def create_team(self, *, author: User, title: str) -> TeamPost:
        return TeamPost.objects.create(
            competition=self.competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title=title,
            direction="面向实际问题的人工智能工程实现",
            base_member_count=1,
            target_member_count=3,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="team@example.edu",
        )

    def csrf_client(self, user: User | None = None) -> tuple[Client, str]:
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.get("/api/auth/csrf").status_code, 204)
        client.force_login(user or self.user)
        return client, client.cookies["csrftoken"].value

    def test_me_overview_profile_and_collections_are_private_to_current_user(self) -> None:
        for path in (
            "/api/me",
            "/api/me/profile",
            "/api/me/follows",
            "/api/me/teams",
            "/api/me/applications",
            "/api/me/activities",
            "/api/me/questions",
            "/api/me/organizations",
        ):
            with self.subTest(path=path):
                self.assertEqual(Client().get(path).status_code, 401)
        client, csrf_token = self.csrf_client()

        response = client.get("/api/me")
        self.assertEqual(response.status_code, 200)
        overview = response.json()
        self.assertEqual(overview["profile"]["real_name"], self.user.real_name)
        self.assertEqual(overview["profile"]["student_no"], self.user.student_no)
        self.assertEqual(overview["profile"]["class_name"], "人工智能 2301")
        self.assertEqual(overview["unread_notification_count"], 1)
        self.assertEqual(overview["organization_memberships"], [
            {
                "organization_id": str(self.organization.id),
                "organization_name": self.organization.name,
                "organization_type": self.organization.organization_type,
                "role": "LEADER",
                "title": "技术部部长",
                "is_active": True,
            }
        ])
        self.assertNotIn("platform_role", overview)

        response = client.get("/api/me/profile")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["skills"], ["Python", "Vue"])
        self.assertEqual(client.patch("/api/me/profile", data="{}", content_type="application/json").status_code, 403)
        response = client.patch(
            "/api/me/profile",
            data={"nickname": "新昵称", "bio": "更新后的公开简介。", "skills": ["Django", "Vue"]},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["nickname"], "新昵称")
        self.assertEqual(response.json()["real_name"], self.user.real_name)
        self.assertEqual(response.json()["skills"], ["Django", "Vue"])
        response = client.patch(
            "/api/me/profile",
            data={"avatar_asset_id": str(self.own_avatar.id)},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["avatar"]["id"], str(self.own_avatar.id))
        response = client.patch(
            "/api/me/profile",
            data={"avatar_asset_id": str(self.other_avatar.id)},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        response = client.patch(
            "/api/me/profile",
            data={"avatar_asset_id": "00000000-0000-0000-0000-000000000000"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        response = client.patch(
            "/api/me/profile",
            data={"skills": ["Python", "Python"]},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        response = client.patch(
            "/api/me/profile",
            data={"real_name": "不允许修改"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.real_name, "个人中心同学")

        response = client.get("/api/me/follows")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], str(self.competition.id))

        response = client.get("/api/me/teams?scope=created")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["id"], str(self.authored_team.id))
        self.assertEqual(response.json()["results"][0]["relationship"], "AUTHOR")
        self.assertNotIn("contact_value", response.json()["results"][0])
        response = client.get("/api/me/teams?scope=joined")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["id"], str(self.joined_team.id))
        self.assertEqual(response.json()["results"][0]["relationship"], "ACCEPTED_MEMBER")
        self.assertNotIn("contact_value", response.json()["results"][0])

        response = client.get("/api/me/applications")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        application_kinds = {item["kind"] for item in response.json()["results"]}
        self.assertEqual(application_kinds, {"TEAM_APPLICATION", "RECRUITMENT_APPLICATION"})
        self.assertTrue(all("self_intro" not in item for item in response.json()["results"]))
        response = client.get("/api/me/applications?kind=recruitment")
        self.assertEqual(response.status_code, 200)
        item = response.json()["results"][0]
        self.assertEqual(item["id"], str(self.recruitment_application.id))
        self.assertEqual(item["target_organization_name"], self.organization.name)
        self.assertEqual(item["target_position_name"], "开发部干事")

        response = client.get("/api/me/activities")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["id"], str(self.registration.id))
        self.assertEqual(response.json()["results"][0]["registration_status"], "REGISTERED")
        self.assertNotIn("student_no_snapshot", response.json()["results"][0])
        response = client.get("/api/me/questions")
        self.assertEqual(response.status_code, 200)
        item = response.json()["results"][0]
        self.assertEqual(item["id"], str(self.consultation.id))
        self.assertEqual(item["action_path"], f"/qa/questions/{self.consultation.id}")
        self.assertNotIn("body_md", item)

        response = client.get("/api/me/organizations")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), overview["organization_memberships"])

    def test_me_collections_return_empty_without_cross_user_leakage(self) -> None:
        client, _csrf_token = self.csrf_client(self.empty_user)
        overview = client.get("/api/me")
        self.assertEqual(overview.status_code, 200)
        self.assertEqual(overview.json()["organization_memberships"], [])
        self.assertEqual(overview.json()["unread_notification_count"], 0)
        self.assertNotIn(self.user.student_no, str(overview.json()))
        for path in (
            "/api/me/follows",
            "/api/me/teams?scope=created",
            "/api/me/teams?scope=joined",
            "/api/me/applications",
            "/api/me/activities",
            "/api/me/questions",
        ):
            with self.subTest(path=path):
                response = client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["count"], 0)
                self.assertEqual(response.json()["results"], [])
        self.assertEqual(client.get("/api/me/organizations").json(), [])

    def test_me_collection_query_validation(self) -> None:
        client, _csrf_token = self.csrf_client()
        for path in (
            "/api/me/teams?scope=unknown",
            "/api/me/applications?kind=unknown",
            "/api/me/follows?unexpected=true",
            "/api/me/activities?page=0",
            "/api/me/questions?page_size=101",
        ):
            with self.subTest(path=path):
                response = client.get(path)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
