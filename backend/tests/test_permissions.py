"""BE-005：平台角色、orgId 作用域与隐私 QuerySet 测试。"""

from django.test import TestCase

from apps.accounts.models import User
from apps.consultations.models import Consultation
from apps.organizations.models import Organization, OrganizationMembership
from apps.permissions import (
    can_manage_organization,
    effective_platform_role,
    visible_consultations_for,
)


class PermissionBoundaryTests(TestCase):
    def create_user(self, student_no: str, *, operator: bool = False, superuser: bool = False) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="测试用户",
            password="SafePassword123!",
            platform_role=User.PlatformRole.OPERATOR if operator else User.PlatformRole.USER,
            is_superuser=superuser,
            is_staff=superuser,
        )

    def create_consultation(self, author: User, visibility: str) -> Consultation:
        return Consultation.objects.create(
            author=author,
            category=Consultation.Category.OTHER,
            title="请问如何准备竞赛？",
            body_md="我希望了解准备节奏和资料。",
            visibility=visibility,
        )

    def test_leader_is_scoped_to_own_organization_and_title_is_not_permission(self) -> None:
        leader = self.create_user("20241001")
        titled_member = self.create_user("20241002")
        first_org = Organization.objects.create(name="人工智能协会", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        second_org = Organization.objects.create(name="机器人协会", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        OrganizationMembership.objects.create(
            organization=first_org,
            user=leader,
            role=OrganizationMembership.Role.LEADER,
        )
        OrganizationMembership.objects.create(
            organization=first_org,
            user=titled_member,
            role=OrganizationMembership.Role.MEMBER,
            title="会长",
        )

        self.assertTrue(can_manage_organization(leader, first_org.id))
        self.assertFalse(can_manage_organization(leader, second_org.id))
        self.assertFalse(can_manage_organization(titled_member, first_org.id))

    def test_operator_does_not_gain_organization_leader_scope_but_superadmin_does(self) -> None:
        operator = self.create_user("20241003", operator=True)
        superadmin = self.create_user("20241004", superuser=True)
        organization = Organization.objects.create(name="创新实验室", organization_type=Organization.OrganizationType.LABORATORY)

        self.assertEqual(effective_platform_role(operator), User.PlatformRole.OPERATOR)
        self.assertFalse(can_manage_organization(operator, organization.id))
        self.assertEqual(effective_platform_role(superadmin), "SUPERADMIN")
        self.assertTrue(can_manage_organization(superadmin, organization.id))

    def test_private_consultation_is_filtered_for_unrelated_student(self) -> None:
        author = self.create_user("20241005")
        other_student = self.create_user("20241006")
        operator = self.create_user("20241007", operator=True)
        public = self.create_consultation(author, Consultation.Visibility.PUBLIC)
        private = self.create_consultation(author, Consultation.Visibility.PRIVATE)

        self.assertSetEqual(set(visible_consultations_for(None).values_list("id", flat=True)), {public.id})
        self.assertSetEqual(set(visible_consultations_for(other_student).values_list("id", flat=True)), {public.id})
        self.assertSetEqual(set(visible_consultations_for(author).values_list("id", flat=True)), {public.id, private.id})
        self.assertSetEqual(set(visible_consultations_for(operator).values_list("id", flat=True)), {public.id, private.id})
