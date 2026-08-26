"""BE-004：Django Admin 访问边界和只读审计。"""

from django.contrib import admin
from django.test import Client, RequestFactory, TestCase

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.organizations.models import Organization, OrganizationMembership


class DjangoAdminTests(TestCase):
    def create_user(
        self,
        student_no: str,
        *,
        superuser: bool = False,
        operator: bool = False,
        staff: bool = False,
    ) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="测试用户",
            password="SafePassword123!",
            is_active=True,
            is_staff=superuser or staff,
            is_superuser=superuser,
            platform_role=User.PlatformRole.OPERATOR if operator else User.PlatformRole.STUDENT,
        )

    def test_all_system_models_are_registered_and_audit_log_is_read_only(self) -> None:
        expected_model_labels = {
            "accounts.User",
            "accounts.UserProfile",
            "media.MediaAsset",
            "organizations.Organization",
            "organizations.OrganizationMembership",
            "organizations.Recruitment",
            "organizations.RecruitmentPosition",
            "organizations.RecruitmentApplication",
            "competitions.Competition",
            "competitions.TimelineEvent",
            "competitions.Follow",
            "teams.TeamPost",
            "teams.TeamRole",
            "teams.TeamApplication",
            "activities.Activity",
            "activities.Registration",
            "content.HomepageBanner",
            "content.Announcement",
            "content.GuideArticle",
            "content.GuideCompetition",
            "content.FaqItem",
            "consultations.Consultation",
            "consultations.Reply",
            "notifications.Notification",
            "audit.AuditLog",
        }
        registered_labels = {model._meta.label for model in admin.site._registry}
        self.assertTrue(expected_model_labels.issubset(registered_labels))

        audit_admin = admin.site._registry[AuditLog]
        request = RequestFactory().get("/admin/")
        self.assertFalse(audit_admin.has_add_permission(request))
        self.assertFalse(audit_admin.has_change_permission(request))
        self.assertFalse(audit_admin.has_delete_permission(request))
        self.assertTrue(all(not registered_admin.has_delete_permission(request) for registered_admin in admin.site._registry.values()))

    def test_only_active_staff_superadmin_can_enter_admin(self) -> None:
        operator = self.create_user("20243001", operator=True)
        superadmin = self.create_user("20243002", superuser=True)
        staff_non_superuser = self.create_user("20243005", staff=True)
        client = Client()

        client.force_login(operator)
        operator_response = client.get("/admin/", follow=False)
        self.assertEqual(operator_response.status_code, 302)
        self.assertIn("/admin/login/", operator_response["Location"])

        client.force_login(staff_non_superuser)
        staff_response = client.get("/admin/", follow=False)
        self.assertEqual(staff_response.status_code, 302)
        self.assertIn("/admin/login/", staff_response["Location"])

        client.force_login(superadmin)
        self.assertEqual(client.get("/admin/").status_code, 200)

    def test_pending_activation_and_leader_grant_actions_write_audit_log(self) -> None:
        superadmin = self.create_user("20243003", superuser=True)
        pending = User.objects.create_user(
            username="20243004",
            student_no="20243004",
            real_name="待审核用户",
            password="SafePassword123!",
            is_active=False,
        )
        user_admin = admin.site._registry[User]
        request = RequestFactory().post("/admin/accounts/user/")
        request.user = superadmin
        user_admin.activate_pending_accounts(request, User.objects.filter(pk=pending.pk))
        pending.refresh_from_db()
        self.assertTrue(pending.is_active)
        self.assertTrue(AuditLog.objects.filter(action="USER_ACTIVATED", target_id=pending.id).exists())

        organization = Organization.objects.create(name="人工智能协会", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        membership = OrganizationMembership.objects.create(organization=organization, user=pending)
        membership_admin = admin.site._registry[OrganizationMembership]
        membership_admin.grant_leader(request, OrganizationMembership.objects.filter(pk=membership.pk))
        membership.refresh_from_db()
        self.assertEqual(membership.role, OrganizationMembership.Role.LEADER)
        self.assertTrue(AuditLog.objects.filter(action="ORGANIZATION_LEADER_GRANTED", target_id=membership.id).exists())
