"""BE-003：领域模型的 PostgreSQL 约束和关系基线。"""

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition, Follow
from apps.content.models import Announcement
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.teams.models import TeamApplication, TeamPost, TeamRole


class DomainModelConstraintTests(TestCase):
    def create_user(self, student_no: str) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="测试用户",
            password="SafePassword123!",
        )

    def create_organization(self, name: str = "人工智能协会") -> Organization:
        return Organization.objects.create(
            name=name,
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
        )

    def create_competition(self) -> Competition:
        return Competition.objects.create(
            name="人工智能创新大赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.NATIONAL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="比赛介绍",
            college_organized=False,
            created_by=self.create_user("20240001"),
            updated_by=self.create_user("20240002"),
        )

    def test_media_object_key_and_positive_size_are_database_constraints(self) -> None:
        user = self.create_user("20240003")
        MediaAsset.objects.create(
            created_by=user,
            kind=MediaAsset.Kind.IMAGE,
            object_key="profiles/one.webp",
            original_name="one.webp",
            mime_type="image/webp",
            size_bytes=1,
            sha256="a" * 64,
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            MediaAsset.objects.create(
                created_by=user,
                kind=MediaAsset.Kind.IMAGE,
                object_key="profiles/one.webp",
                original_name="duplicate.webp",
                mime_type="image/webp",
                size_bytes=1,
                sha256="b" * 64,
            )
        with self.assertRaises(IntegrityError), transaction.atomic():
            MediaAsset.objects.create(
                created_by=user,
                kind=MediaAsset.Kind.DOCUMENT,
                object_key="documents/invalid.pdf",
                original_name="invalid.pdf",
                mime_type="application/pdf",
                size_bytes=0,
                sha256="c" * 64,
            )

    def test_membership_follow_and_registration_are_unique(self) -> None:
        user = self.create_user("20240004")
        organization = self.create_organization()
        OrganizationMembership.objects.create(organization=organization, user=user)
        with self.assertRaises(IntegrityError), transaction.atomic():
            OrganizationMembership.objects.create(organization=organization, user=user)

        competition = self.create_competition()
        Follow.objects.create(competition=competition, user=user)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Follow.objects.create(competition=competition, user=user)

        activity = Activity.objects.create(
            title="科创说明会",
            activity_type=Activity.ActivityType.COMPETITION_BRIEFING,
            description_md="活动介绍",
            location="报告厅",
            start_at="2026-10-01T09:00:00+08:00",
            registration_required=False,
            created_by=user,
            updated_by=user,
        )
        Registration.objects.create(activity=activity, user=user, name_snapshot="测试用户", student_no_snapshot="20240004")
        with self.assertRaises(IntegrityError), transaction.atomic():
            Registration.objects.create(activity=activity, user=user, name_snapshot="测试用户", student_no_snapshot="20240004")

    def test_effective_application_constraints_allow_resubmission_after_terminal_state(self) -> None:
        applicant = self.create_user("20240005")
        organization = self.create_organization("创新实验室")
        leader = self.create_user("20240006")
        recruitment = Recruitment.objects.create(
            organization=organization,
            title="秋季招新",
            intro_md="欢迎加入",
            apply_end_at="2026-10-01T09:00:00+08:00",
            created_by=leader,
            updated_by=leader,
        )
        position = RecruitmentPosition.objects.create(recruitment=recruitment, name="技术部", headcount=2)
        first = RecruitmentApplication.objects.create(
            recruitment=recruitment,
            position=position,
            applicant=applicant,
            self_intro="自我介绍",
            motivation="加入动机",
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            RecruitmentApplication.objects.create(
                recruitment=recruitment,
                position=position,
                applicant=applicant,
                self_intro="重复申请",
                motivation="重复动机",
            )
        first.status = RecruitmentApplication.Status.WITHDRAWN
        first.save(update_fields=["status", "updated_at"])
        self.assertEqual(RecruitmentApplication.objects.filter(recruitment=recruitment, applicant=applicant).count(), 1)
        RecruitmentApplication.objects.create(
            recruitment=recruitment,
            position=position,
            applicant=applicant,
            self_intro="再次申请",
            motivation="再次动机",
        )

    def test_announcement_accepts_no_related_object_and_rejects_multiple_related_objects(self) -> None:
        actor = self.create_user("20240007")
        announcement = Announcement(
            title="学院通用公告",
            body_md="请关注学院官网。",
            publisher_scope=Announcement.PublisherScope.ACADEMY,
            created_by=actor,
            updated_by=actor,
        )
        announcement.full_clean()
        announcement.save()

        competition = self.create_competition()
        invalid = Announcement(
            title="错误关联",
            body_md="不允许多关联。",
            publisher_scope=Announcement.PublisherScope.PLATFORM,
            competition=competition,
            organization=self.create_organization("机器人协会"),
            created_by=actor,
            updated_by=actor,
        )
        with self.assertRaises(ValidationError):
            invalid.full_clean()

    def test_notification_dedupe_key_is_partial_unique(self) -> None:
        user = self.create_user("20240008")
        Notification.objects.create(
            recipient=user,
            notification_type=Notification.NotificationType.TEAM,
            title="有新的组队申请",
            dedupe_key="team-application:test:submitted",
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            Notification.objects.create(
                recipient=user,
                notification_type=Notification.NotificationType.TEAM,
                title="重复消息",
                dedupe_key="team-application:test:submitted",
            )

    def test_team_application_uses_partial_unique_constraint(self) -> None:
        author = self.create_user("20240009")
        applicant = self.create_user("20240010")
        competition = self.create_competition()
        post = TeamPost.objects.create(
            competition=competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找算法队友",
            direction="多模态算法",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="team@example.edu",
        )
        TeamApplication.objects.create(
            team_post=post,
            applicant=applicant,
            self_intro="我有竞赛经验",
            motivation="希望共同完成比赛",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="applicant@example.edu",
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            TeamApplication.objects.create(
                team_post=post,
                applicant=applicant,
                self_intro="第二次申请",
                motivation="重复动机",
                contact_method=TeamPost.ContactMethod.EMAIL,
                contact_value="applicant@example.edu",
            )

    def test_model_clean_rejects_cross_parent_applications_and_invalid_profile_skills(self) -> None:
        author = self.create_user("20240011")
        applicant = self.create_user("20240012")
        competition = self.create_competition()
        first_post = TeamPost.objects.create(
            competition=competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找算法队友",
            direction="多模态算法",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="team@example.edu",
        )
        second_post = TeamPost.objects.create(
            competition=competition,
            author=applicant,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找工程队友",
            direction="工程落地",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="other@example.edu",
        )
        foreign_role = TeamRole.objects.create(team_post=second_post, name="后端", headcount=1)
        invalid_team_application = TeamApplication(
            team_post=first_post,
            desired_role=foreign_role,
            applicant=applicant,
            self_intro="我有足够的竞赛经验。",
            motivation="希望共同完成高质量项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="applicant@example.edu",
        )
        with self.assertRaises(ValidationError):
            invalid_team_application.full_clean()

        self_application = TeamApplication(
            team_post=first_post,
            applicant=author,
            self_intro="我有足够的竞赛经验。",
            motivation="希望共同完成高质量项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="author@example.edu",
        )
        with self.assertRaises(ValidationError):
            self_application.full_clean()

        organization = self.create_organization("人工智能实验室")
        leader = self.create_user("20240013")
        recruitment = Recruitment.objects.create(
            organization=organization,
            title="秋季招新",
            intro_md="欢迎加入。",
            apply_end_at="2026-10-01T09:00:00+08:00",
            created_by=leader,
            updated_by=leader,
        )
        other_recruitment = Recruitment.objects.create(
            organization=organization,
            title="春季招新",
            intro_md="欢迎加入。",
            apply_end_at="2026-11-01T09:00:00+08:00",
            created_by=leader,
            updated_by=leader,
        )
        foreign_position = RecruitmentPosition.objects.create(recruitment=other_recruitment, name="开发", headcount=1)
        invalid_recruitment_application = RecruitmentApplication(
            recruitment=recruitment,
            position=foreign_position,
            applicant=applicant,
            self_intro="我有足够的开发经验。",
            motivation="希望服务学院同学。",
        )
        with self.assertRaises(ValidationError):
            invalid_recruitment_application.full_clean()

        invalid_profile = UserProfile(user=applicant, skills_json=["Python", "Python"])
        with self.assertRaises(ValidationError):
            invalid_profile.full_clean()
