import json
import uuid

from django.apps import apps
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import Client, SimpleTestCase, TestCase, override_settings


class CsrfInitializationTests(SimpleTestCase):
    def test_csrf_endpoint_issues_readable_cookie(self) -> None:
        client = Client(enforce_csrf_checks=True)

        response = client.get("/api/auth/csrf")

        self.assertEqual(response.status_code, 204)
        self.assertIn("csrftoken", client.cookies)
        self.assertFalse(client.cookies["csrftoken"]["httponly"])


class SessionAuthTests(TestCase):
    password = "CorrectHorseBatteryStaple9!"

    def csrf_client(self) -> tuple[Client, str]:
        client = Client(enforce_csrf_checks=True)
        response = client.get("/api/auth/csrf")
        self.assertEqual(response.status_code, 204)
        return client, client.cookies["csrftoken"].value

    def register(self, client: Client, csrf_token: str, student_no: str = "20240001"):
        return client.post(
            "/api/auth/register",
            data={"student_no": student_no, "real_name": "张三", "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

    def test_register_requires_csrf(self) -> None:
        client = Client(enforce_csrf_checks=True)

        response = self.register(client, "missing-token")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "PERMISSION_DENIED")

    @override_settings(STUDENT_REGISTRATION_AUTO_ACTIVATE=True)
    def test_register_auto_activates_student_and_allows_login_without_creating_session_first(self) -> None:
        client, csrf_token = self.csrf_client()

        response = self.register(client, csrf_token)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {"status": "active", "message": "注册成功，现在可以登录。"},
        )
        user = get_user_model().objects.get(student_no="20240001")
        profile_model = apps.get_model("accounts", "UserProfile")
        self.assertEqual(user.username, "20240001")
        self.assertEqual(user.platform_role, "USER")
        self.assertTrue(user.is_active)
        self.assertTrue(profile_model.objects.filter(user=user).exists())
        self.assertNotIn(settings.SESSION_COOKIE_NAME, client.cookies)

        login_response = client.post(
            "/api/auth/login",
            data={"username": "20240001", "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertIn(settings.SESSION_COOKIE_NAME, client.cookies)

    @override_settings(STUDENT_REGISTRATION_AUTO_ACTIVATE=False)
    def test_register_can_keep_pending_approval_mode_without_session(self) -> None:
        client, csrf_token = self.csrf_client()

        response = self.register(client, csrf_token)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {"status": "pending_approval", "message": "注册已提交，请等待管理员审核。"},
        )
        user = get_user_model().objects.get(student_no="20240001")
        profile_model = apps.get_model("accounts", "UserProfile")
        self.assertEqual(user.username, "20240001")
        self.assertEqual(user.platform_role, "USER")
        self.assertFalse(user.is_active)
        self.assertTrue(profile_model.objects.filter(user=user).exists())
        self.assertNotIn(settings.SESSION_COOKIE_NAME, client.cookies)

    def test_duplicate_register_does_not_disclose_account_profile(self) -> None:
        client, csrf_token = self.csrf_client()
        self.assertEqual(self.register(client, csrf_token).status_code, 201)

        response = self.register(client, csrf_token)

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "ACCOUNT_EXISTS")
        self.assertNotIn("张三", json.dumps(response.json(), ensure_ascii=False))
        self.assertNotIn("student_no", response.json())

    def test_inactive_account_cannot_create_session(self) -> None:
        user_model = get_user_model()
        user_model.objects.create_user(
            username="20240002",
            student_no="20240002",
            real_name="李四",
            password=self.password,
            is_active=False,
        )
        client, csrf_token = self.csrf_client()

        response = client.post(
            "/api/auth/login",
            data={"username": "20240002", "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "ACCOUNT_UNAVAILABLE")
        self.assertNotIn(settings.SESSION_COOKIE_NAME, client.cookies)

    def test_active_login_current_user_and_logout_enforce_privacy_and_csrf(self) -> None:
        user_model = get_user_model()
        profile_model = apps.get_model("accounts", "UserProfile")
        user = user_model.objects.create_user(
            username="20240003",
            student_no="20240003",
            real_name="王五",
            email="private@example.edu",
            password=self.password,
            is_active=True,
        )
        profile_model.objects.create(
            user=user,
            nickname="小王",
            major="人工智能",
            grade=2,
            class_name="AI-2024-1",
            bio="测试资料",
            skills_json=["Python"],
        )
        client, csrf_token = self.csrf_client()

        login_response = client.post(
            "/api/auth/login",
            data={"username": "20240003", "password": self.password},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn(settings.SESSION_COOKIE_NAME, client.cookies)
        self.assertEqual(login_response.json()["permissions"]["platform_role"], "USER")
        self.assertEqual(login_response.json()["permissions"]["organization_memberships"], [])
        self.assertIsNone(login_response.json()["user"]["profile"]["avatar"])

        current_user_response = client.get("/api/auth/me")
        self.assertEqual(current_user_response.status_code, 200)
        current_user_json = current_user_response.json()
        self.assertEqual(current_user_json["user"]["student_no"], "20240003")
        self.assertEqual(current_user_json["user"]["real_name"], "王五")
        self.assertNotIn("email", json.dumps(current_user_json, ensure_ascii=False))
        self.assertNotIn("class_name", json.dumps(current_user_json, ensure_ascii=False))
        self.assertNotIn("password", json.dumps(current_user_json, ensure_ascii=False))

        csrf_token = client.cookies["csrftoken"].value
        csrf_failure = client.post("/api/auth/logout", data={}, content_type="application/json")
        self.assertEqual(csrf_failure.status_code, 403)
        self.assertEqual(csrf_failure.json()["code"], "PERMISSION_DENIED")

        logout_response = client.post(
            "/api/auth/logout",
            data={},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(client.get("/api/auth/me").status_code, 401)

    def test_current_user_exposes_only_active_organization_permission_context(self) -> None:
        user_model = get_user_model()
        organization_model = apps.get_model("organizations", "Organization")
        membership_model = apps.get_model("organizations", "OrganizationMembership")
        user = user_model.objects.create_user(
            username="20240012",
            student_no="20240012",
            real_name="组织负责人",
            password=self.password,
            is_active=True,
        )
        active_organization = organization_model.objects.create(name="人工智能协会", organization_type="STUDENT_CLUB")
        inactive_organization = organization_model.objects.create(name="机器人协会", organization_type="STUDENT_CLUB")
        membership_model.objects.create(
            organization=active_organization,
            user=user,
            role="LEADER",
            title="技术部部长",
        )
        membership_model.objects.create(organization=inactive_organization, user=user, is_active=False)
        client = Client()
        self.assertTrue(client.login(username=user.username, password=self.password))

        response = client.get("/api/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["permissions"]["organization_memberships"],
            [{"organization_id": str(active_organization.id), "role": "LEADER", "title": "技术部部长"}],
        )


class AccountModelTests(TestCase):
    password = "CorrectHorseBatteryStaple9!"

    def test_custom_user_uses_uuid_partial_unique_student_number_and_admin_registration(self) -> None:
        user_model = get_user_model()
        first_user = user_model.objects.create_user(
            username="20240004",
            student_no="20240004",
            real_name="赵六",
            password=self.password,
        )
        user_model.objects.create_user(username="system-a", real_name="系统甲", password=self.password)
        user_model.objects.create_user(username="system-b", real_name="系统乙", password=self.password)

        self.assertIsInstance(first_user.pk, uuid.UUID)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                user_model.objects.create_user(
                    username="another-user",
                    student_no="20240004",
                    real_name="重复学号",
                    password=self.password,
                )
        self.assertIn(user_model, admin.site._registry)
