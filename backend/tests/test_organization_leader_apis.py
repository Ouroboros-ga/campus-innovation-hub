"""BE-030：组织负责人工作台 API 的端到端契约测试。"""

from __future__ import annotations

from datetime import timedelta

from django.test import Client, TestCase
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.audit.models import AuditLog
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition


class OrganizationLeaderApiTests(TestCase):
    """验证管理权严格来自同一组织的有效 LEADER 身份。"""

    def setUp(self) -> None:
        self.leader = self.create_user("20263001", "负责人", 3)
        self.other_leader = self.create_user("20263002", "另一负责人", 3)
        self.member = self.create_user("20263003", "普通成员", 2)
        self.student = self.create_user("20263004", "普通学生", 2)
        self.applicant = self.create_user("20263005", "申请同学", 2)
        self.rejected_applicant = self.create_user("20263006", "另一申请人", 1)
        self.operator = self.create_user("20263007", "运营人员", 4, platform_role=User.PlatformRole.OPERATOR)
        self.superadmin = self.create_user("20263008", "超级管理员", 4, is_superuser=True, is_staff=True)

        self.organization = Organization.objects.create(
            name="BE-030 主组织",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            short_intro="主组织简介",
            created_by=self.operator,
            updated_by=self.operator,
        )
        self.other_organization = Organization.objects.create(
            name="BE-030 另一组织",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            created_by=self.operator,
            updated_by=self.operator,
        )
        OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.leader,
            role=OrganizationMembership.Role.LEADER,
            title="会长",
        )
        OrganizationMembership.objects.create(
            organization=self.other_organization,
            user=self.other_leader,
            role=OrganizationMembership.Role.LEADER,
            title="另一会长",
        )
        OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.member,
            role=OrganizationMembership.Role.MEMBER,
            title="干事",
        )
        self.logo_asset = MediaAsset.objects.create(
            created_by=self.leader,
            kind=MediaAsset.Kind.IMAGE,
            object_key="be030-tests/organization-logo.png",
            original_name="organization-logo.png",
            mime_type="image/png",
            size_bytes=4,
            sha256="a" * 64,
            width=1,
            height=1,
            status=MediaAsset.Status.ACTIVE,
        )

        now = timezone.now()
        self.recruitment = Recruitment.objects.create(
            organization=self.organization,
            title="主组织秋季招新",
            intro_md="欢迎希望参与科创实践的同学加入。",
            apply_start_at=now - timedelta(days=1),
            apply_end_at=now + timedelta(days=7),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=self.leader,
            updated_by=self.leader,
        )
        self.position = RecruitmentPosition.objects.create(
            recruitment=self.recruitment,
            name="开发干事",
            headcount=2,
            description_md="负责平台功能开发。",
            requirements_md="熟悉 Python 或 Vue。",
            sort_order=0,
        )
        self.application = RecruitmentApplication.objects.create(
            recruitment=self.recruitment,
            position=self.position,
            applicant=self.applicant,
            self_intro="我有多个完整项目的开发经验。",
            skills="Python、Vue",
            motivation="希望参与组织建设并贡献工程能力。",
        )
        self.rejected_application = RecruitmentApplication.objects.create(
            recruitment=self.recruitment,
            position=self.position,
            applicant=self.rejected_applicant,
            self_intro="我愿意投入时间参与组织活动。",
            motivation="希望学习并参与校园科创活动。",
        )

    def create_user(self, username: str, real_name: str, grade: int, **extra: object) -> User:
        user = User.objects.create_user(
            username=username,
            student_no=username,
            real_name=real_name,
            password="SafePassword123!",
            **extra,
        )
        UserProfile.objects.create(user=user, nickname=real_name, major="人工智能", grade=grade)
        return user

    def csrf_client(self, user: User) -> tuple[Client, str]:
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.get("/api/auth/csrf").status_code, 204)
        client.force_login(user)
        return client, client.cookies["csrftoken"].value

    def recruitment_payload(self, *, title: str = "春季技术部招新", apply_end_at: object | None = None) -> dict[str, object]:
        end_at = apply_end_at or (timezone.now() + timedelta(days=5))
        return {
            "title": title,
            "intro_md": "面向希望参与研发和技术交流的同学。",
            "apply_start_at": (timezone.now() - timedelta(hours=1)).isoformat(),
            "apply_end_at": end_at.isoformat(),
            "target_grade_min": 1,
            "target_grade_max": 4,
            "notes_md": "请认真填写申请材料。",
            "positions": [
                {
                    "name": "后端开发",
                    "headcount": 2,
                    "description_md": "参与 Django 服务开发。",
                    "requirements_md": "了解 Python。",
                    "sort_order": 0,
                }
            ],
        }

    def test_scoped_leader_can_read_only_own_organization_profile(self) -> None:
        """若路由缺失或未按 orgId 过滤，负责人会看不到本组织或越权看到其他组织。"""

        leader_client, _ = self.csrf_client(self.leader)
        response = leader_client.get(f"/api/manage/organizations/{self.organization.id}/profile")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(self.organization.id))
        self.assertEqual(response.json()["name"], "BE-030 主组织")
        self.assertTrue(response.json()["is_active"])

        response = leader_client.get(f"/api/manage/organizations/{self.other_organization.id}/profile")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "PERMISSION_DENIED")

    def test_member_student_and_operator_cannot_enter_organization_workbench(self) -> None:
        path = f"/api/manage/organizations/{self.organization.id}/profile"
        for user in (self.member, self.student, self.operator):
            with self.subTest(username=user.username):
                client, _ = self.csrf_client(user)
                response = client.get(path)
                self.assertEqual(response.status_code, 403)
                self.assertEqual(response.json()["code"], "PERMISSION_DENIED")

        superadmin_client, _ = self.csrf_client(self.superadmin)
        self.assertEqual(superadmin_client.get(path).status_code, 200)

    def test_profile_update_enforces_csrf_field_allowlist_and_media_privacy(self) -> None:
        path = f"/api/manage/organizations/{self.organization.id}/profile"
        anonymous = Client(enforce_csrf_checks=True)
        self.assertEqual(anonymous.patch(path, data="{}", content_type="application/json").status_code, 401)

        client, csrf_token = self.csrf_client(self.leader)
        self.assertEqual(
            client.patch(path, data={"short_intro": "更新后的组织简介"}, content_type="application/json").status_code,
            403,
        )
        response = client.patch(
            path,
            data={
                "short_intro": "更新后的组织简介",
                "public_contact": "club@example.edu",
                "logo_asset_id": str(self.logo_asset.id),
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["short_intro"], "更新后的组织简介")
        self.assertEqual(response.json()["logo"]["id"], str(self.logo_asset.id))
        self.assertNotIn("object_key", response.json()["logo"])
        self.assertTrue(AuditLog.objects.filter(target_id=self.organization.id).exists())

        response = client.patch(
            path,
            data={"name": "非法改名"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)
        self.organization.refresh_from_db()
        self.assertEqual(self.organization.name, "BE-030 主组织")

    def test_recruitment_create_edit_lifecycle_and_position_deletion_guard(self) -> None:
        client, csrf_token = self.csrf_client(self.leader)
        collection = f"/api/manage/organizations/{self.organization.id}/recruitments"
        response = client.post(collection, data=self.recruitment_payload(), content_type="application/json", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 201)
        recruitment_id = response.json()["id"]
        self.assertEqual(response.json()["publication_state"], Recruitment.PublicationState.DRAFT)
        self.assertEqual(response.json()["application_counts"]["pending_count"], 0)
        response = client.get(f"{collection}?status=DRAFT")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], recruitment_id)

        response = client.patch(
            f"{collection}/{recruitment_id}",
            data={"title": "春季技术部正式招新", "positions": []},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "春季技术部正式招新")
        self.assertEqual(response.json()["positions"], [])

        response = client.post(f"{collection}/{recruitment_id}/publish", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 422)

        response = client.patch(
            f"{collection}/{recruitment_id}",
            data={"positions": self.recruitment_payload()["positions"]},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(client.post(f"{collection}/{recruitment_id}/publish", HTTP_X_CSRFTOKEN=csrf_token).status_code, 204)
        self.assertEqual(client.post(f"{collection}/{recruitment_id}/cancel", HTTP_X_CSRFTOKEN=csrf_token).status_code, 204)
        self.assertEqual(client.post(f"{collection}/{recruitment_id}/archive", HTTP_X_CSRFTOKEN=csrf_token).status_code, 204)

        response = client.patch(
            f"{collection}/{self.recruitment.id}",
            data={"positions": []},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "INVALID_STATE")

    def test_complete_requires_closed_window_and_writes_completed_at(self) -> None:
        client, csrf_token = self.csrf_client(self.leader)
        collection = f"/api/manage/organizations/{self.organization.id}/recruitments"
        payload = self.recruitment_payload(title="已截止招新", apply_end_at=timezone.now() - timedelta(minutes=1))
        response = client.post(collection, data=payload, content_type="application/json", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 201)
        recruitment_id = response.json()["id"]
        self.assertEqual(client.post(f"{collection}/{recruitment_id}/publish", HTTP_X_CSRFTOKEN=csrf_token).status_code, 204)
        self.assertEqual(client.post(f"{collection}/{recruitment_id}/complete", HTTP_X_CSRFTOKEN=csrf_token).status_code, 204)
        response = client.get(f"{collection}/{recruitment_id}")
        self.assertIsNotNone(response.json()["completed_at"])

    def test_application_management_is_scoped_private_and_reuses_accept_service(self) -> None:
        client, csrf_token = self.csrf_client(self.leader)
        collection = f"/api/manage/organizations/{self.organization.id}/applications"
        response = client.get(f"{collection}?status=PENDING&recruitment_id={self.recruitment.id}&position_id={self.position.id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        item = response.json()["results"][0]
        self.assertNotIn("student_no", item["applicant"])
        self.assertNotIn("contact", str(item))

        response = client.post(f"{collection}/{self.application.id}/accept", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 204)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, RecruitmentApplication.Status.ACCEPTED)
        membership = OrganizationMembership.objects.get(organization=self.organization, user=self.applicant)
        self.assertEqual(membership.role, OrganizationMembership.Role.MEMBER)
        self.assertEqual(membership.title, "开发干事")
        self.assertTrue(Notification.objects.filter(recipient=self.applicant, title="招新申请已通过").exists())
        self.assertTrue(AuditLog.objects.filter(target_id=self.application.id, action="RECRUITMENT_APPLICATION_ACCEPTED").exists())

        response = client.post(f"{collection}/{self.rejected_application.id}/reject", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(response.status_code, 204)
        self.rejected_application.refresh_from_db()
        self.assertEqual(self.rejected_application.status, RecruitmentApplication.Status.REJECTED)

        other_client, other_csrf = self.csrf_client(self.other_leader)
        response = other_client.post(f"{collection}/{self.rejected_application.id}/accept", HTTP_X_CSRFTOKEN=other_csrf)
        self.assertEqual(response.status_code, 403)

    def test_management_ids_require_uuid_and_direct_organization_application_does_not_exist(self) -> None:
        client, csrf_token = self.csrf_client(self.leader)
        response = client.get("/api/manage/organizations/not-a-uuid/profile")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")

        recruitment_collection = f"/api/manage/organizations/{self.organization.id}/recruitments"
        response = client.get(f"{recruitment_collection}/not-a-uuid")
        self.assertEqual(response.status_code, 400)
        response = client.get(f"/api/manage/organizations/{self.organization.id}/applications?recruitment_id=not-a-uuid")
        self.assertEqual(response.status_code, 400)
        response = client.post(
            f"/api/manage/organizations/{self.organization.id}/applications/not-a-uuid/accept",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 400)

        self.other_organization.is_active = False
        self.other_organization.save(update_fields=["is_active", "updated_at"])
        superadmin_client, _ = self.csrf_client(self.superadmin)
        self.assertEqual(
            superadmin_client.get(f"/api/manage/organizations/{self.other_organization.id}/profile").status_code,
            404,
        )

        response = client.post(
            f"/api/organizations/{self.organization.id}/applications",
            data={"position_id": str(self.position.id)},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(RecruitmentApplication.objects.filter(recruitment=self.recruitment).count(), 2)
