"""BE-005：关键状态机、审计和事务 Service 测试。"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.activities.services import cancel_activity_registration, register_activity
from apps.audit.models import AuditLog
from apps.audit.services import record_audit
from apps.competitions.models import Competition
from apps.competitions.services import publish_competition
from apps.domain_errors import CapacityFull, InvalidState, PermissionDenied, SensitiveAuditData
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.organizations.services import accept_recruitment_application, grant_organization_leader
from apps.teams.models import TeamApplication, TeamPost, TeamRole
from apps.teams.services import accept_team_application


class DomainServiceTests(TestCase):
    def create_user(self, student_no: str, *, operator: bool = False, superuser: bool = False) -> User:
        user = User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="测试用户",
            password="SafePassword123!",
            platform_role=User.PlatformRole.OPERATOR if operator else User.PlatformRole.STUDENT,
            is_superuser=superuser,
            is_staff=superuser,
        )
        UserProfile.objects.create(user=user, nickname=f"用户{student_no[-2:]}", major="人工智能", grade=2)
        return user

    def create_competition(self, actor: User) -> Competition:
        return Competition.objects.create(
            name="全国大学生人工智能创新大赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.NATIONAL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="竞赛介绍",
            college_organized=True,
            created_by=actor,
            updated_by=actor,
        )

    def test_grant_leader_requires_superadmin_and_records_safe_audit(self) -> None:
        superadmin = self.create_user("20242001", superuser=True)
        student = self.create_user("20242002")
        organization = Organization.objects.create(name="人工智能协会", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        membership = OrganizationMembership.objects.create(organization=organization, user=student, title="部长")

        with self.assertRaises(PermissionDenied):
            grant_organization_leader(actor=student, membership=membership)

        updated = grant_organization_leader(actor=superadmin, membership=membership)
        self.assertEqual(updated.role, OrganizationMembership.Role.LEADER)
        audit = AuditLog.objects.get(action="ORGANIZATION_LEADER_GRANTED")
        self.assertEqual(audit.changes_json["role"]["to"], OrganizationMembership.Role.LEADER)
        self.assertNotIn("student_no", audit.changes_json)

    def test_publish_competition_requires_operator_and_only_accepts_draft(self) -> None:
        student = self.create_user("20242003")
        operator = self.create_user("20242004", operator=True)
        competition = self.create_competition(operator)

        with self.assertRaises(PermissionDenied):
            publish_competition(actor=student, competition=competition)

        published = publish_competition(actor=operator, competition=competition)
        self.assertEqual(published.publication_state, Competition.PublicationState.PUBLISHED)
        with self.assertRaises(InvalidState):
            publish_competition(actor=operator, competition=published)
        self.assertTrue(AuditLog.objects.filter(action="COMPETITION_PUBLISHED", target_id=competition.id).exists())

    def test_accept_team_application_fills_post_notifies_and_audits(self) -> None:
        author = self.create_user("20242005")
        applicant = self.create_user("20242006")
        competition = self.create_competition(author)
        post = TeamPost.objects.create(
            competition=competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找视觉算法队友",
            direction="视觉算法与部署",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="author@example.edu",
        )
        role = TeamRole.objects.create(team_post=post, name="算法", headcount=1)
        application = TeamApplication.objects.create(
            team_post=post,
            desired_role=role,
            applicant=applicant,
            self_intro="有目标检测和部署经验。",
            motivation="希望共同完成竞赛项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="applicant@example.edu",
        )

        accepted = accept_team_application(actor=author, application=application)
        post.refresh_from_db()
        self.assertEqual(accepted.status, TeamApplication.Status.ACCEPTED)
        self.assertEqual(post.status, TeamPost.Status.FULL)
        self.assertTrue(Notification.objects.filter(recipient=applicant, notification_type=Notification.NotificationType.TEAM).exists())
        self.assertTrue(AuditLog.objects.filter(action="TEAM_APPLICATION_ACCEPTED", target_id=application.id).exists())
        with self.assertRaises(InvalidState):
            accept_team_application(actor=author, application=application)

    def test_team_acceptance_rejects_non_author_and_capacity_conflict(self) -> None:
        author = self.create_user("20242007")
        applicant = self.create_user("20242008")
        other = self.create_user("20242009")
        competition = self.create_competition(author)
        post = TeamPost.objects.create(
            competition=competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找后端队友",
            direction="Django 服务端",
            base_member_count=2,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="author@example.edu",
        )
        application = TeamApplication.objects.create(
            team_post=post,
            applicant=applicant,
            self_intro="有服务端经验。",
            motivation="希望共同完成项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="applicant@example.edu",
        )

        with self.assertRaises(PermissionDenied):
            accept_team_application(actor=other, application=application)
        with self.assertRaises(CapacityFull):
            accept_team_application(actor=author, application=application)

    def test_accept_recruitment_creates_member_not_leader_and_notifies(self) -> None:
        leader = self.create_user("20242010")
        applicant = self.create_user("20242011")
        organization = Organization.objects.create(name="智能车协会", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        OrganizationMembership.objects.create(organization=organization, user=leader, role=OrganizationMembership.Role.LEADER)
        recruitment = Recruitment.objects.create(
            organization=organization,
            title="秋季技术部招新",
            intro_md="欢迎加入技术部。",
            apply_end_at=timezone.now() + timedelta(days=7),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=leader,
            updated_by=leader,
        )
        position = RecruitmentPosition.objects.create(recruitment=recruitment, name="技术部干事", headcount=1)
        application = RecruitmentApplication.objects.create(
            recruitment=recruitment,
            position=position,
            applicant=applicant,
            self_intro="有 Python 与 Vue 项目经验。",
            motivation="希望参与学院科创服务。",
        )

        accepted = accept_recruitment_application(actor=leader, application=application)
        membership = OrganizationMembership.objects.get(organization=organization, user=applicant)
        self.assertEqual(accepted.status, RecruitmentApplication.Status.ACCEPTED)
        self.assertEqual(membership.role, OrganizationMembership.Role.MEMBER)
        self.assertEqual(membership.title, "技术部干事")
        self.assertTrue(Notification.objects.filter(recipient=applicant, notification_type=Notification.NotificationType.ORGANIZATION).exists())
        self.assertTrue(AuditLog.objects.filter(action="RECRUITMENT_APPLICATION_ACCEPTED", target_id=application.id).exists())

    def test_recruitment_acceptance_respects_org_scope_and_position_capacity(self) -> None:
        leader = self.create_user("20242012")
        outsider_leader = self.create_user("20242013")
        applicant = self.create_user("20242014")
        organization = Organization.objects.create(name="开源社", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        other_organization = Organization.objects.create(name="机器人社", organization_type=Organization.OrganizationType.STUDENT_CLUB)
        OrganizationMembership.objects.create(organization=other_organization, user=outsider_leader, role=OrganizationMembership.Role.LEADER)
        OrganizationMembership.objects.create(organization=organization, user=leader, role=OrganizationMembership.Role.LEADER)
        recruitment = Recruitment.objects.create(
            organization=organization,
            title="招募开发成员",
            intro_md="欢迎报名。",
            apply_end_at=timezone.now() + timedelta(days=7),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=leader,
            updated_by=leader,
        )
        position = RecruitmentPosition.objects.create(recruitment=recruitment, name="开发", headcount=1)
        application = RecruitmentApplication.objects.create(
            recruitment=recruitment,
            position=position,
            applicant=applicant,
            self_intro="有开发经验。",
            motivation="希望贡献开源项目。",
        )
        with self.assertRaises(PermissionDenied):
            accept_recruitment_application(actor=outsider_leader, application=application)
        application.status = RecruitmentApplication.Status.ACCEPTED
        application.save(update_fields=["status", "updated_at"])
        another = self.create_user("20242015")
        pending = RecruitmentApplication.objects.create(
            recruitment=recruitment,
            position=position,
            applicant=another,
            self_intro="有新的开发经验。",
            motivation="希望参与开源项目。",
        )
        with self.assertRaises(CapacityFull):
            accept_recruitment_application(actor=leader, application=pending)

    def test_activity_registration_reuses_row_captures_snapshot_and_respects_capacity(self) -> None:
        operator = self.create_user("20242016", operator=True)
        student = self.create_user("20242017")
        activity = Activity.objects.create(
            title="竞赛报名说明会",
            activity_type=Activity.ActivityType.COMPETITION_BRIEFING,
            description_md="说明会内容。",
            location="学院报告厅",
            start_at=timezone.now() + timedelta(days=3),
            registration_required=True,
            registration_start_at=timezone.now() - timedelta(hours=1),
            registration_end_at=timezone.now() + timedelta(days=1),
            capacity=1,
            publication_state=Activity.PublicationState.PUBLISHED,
            created_by=operator,
            updated_by=operator,
        )
        registration = register_activity(actor=student, activity=activity)
        self.assertEqual(registration.status, Registration.Status.REGISTERED)
        self.assertEqual(registration.student_no_snapshot, student.student_no)
        cancelled = cancel_activity_registration(actor=student, registration=registration)
        recreated = register_activity(actor=student, activity=activity)
        self.assertEqual(cancelled.id, recreated.id)
        self.assertEqual(Registration.objects.filter(activity=activity, user=student).count(), 1)

    def test_activity_registration_rejects_full_or_outside_window(self) -> None:
        operator = self.create_user("20242018", operator=True)
        first = self.create_user("20242019")
        second = self.create_user("20242020")
        activity = Activity.objects.create(
            title="容量受限活动",
            activity_type=Activity.ActivityType.TRAINING,
            description_md="培训内容。",
            location="实验室",
            start_at=timezone.now() + timedelta(days=2),
            registration_required=True,
            registration_start_at=timezone.now() - timedelta(hours=1),
            registration_end_at=timezone.now() + timedelta(days=1),
            capacity=1,
            publication_state=Activity.PublicationState.PUBLISHED,
            created_by=operator,
            updated_by=operator,
        )
        register_activity(actor=first, activity=activity)
        with self.assertRaises(CapacityFull):
            register_activity(actor=second, activity=activity)

    def test_audit_rejects_sensitive_changes_json(self) -> None:
        actor = self.create_user("20242021", superuser=True)
        with self.assertRaises(SensitiveAuditData):
            record_audit(actor=actor, action="INVALID", target=None, changes={"contact_value": "secret"})
