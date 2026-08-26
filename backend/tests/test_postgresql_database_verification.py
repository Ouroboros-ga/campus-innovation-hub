"""BE-006：PostgreSQL Migration、索引与 partial unique 验收。"""

from datetime import timedelta

from django.db import IntegrityError, connection, transaction
from django.db.migrations.recorder import MigrationRecorder
from django.test import TransactionTestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.activities.models import Activity, Registration
from apps.audit.models import AuditLog
from apps.competitions.models import Competition, TimelineEvent
from apps.consultations.models import Consultation
from apps.content.models import Announcement, FaqItem, GuideArticle
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.teams.models import TeamApplication, TeamPost


class PostgreSQLVerificationTestCase(TransactionTestCase):
    """本模块的每项断言都必须直接针对 PostgreSQL schema。"""

    reset_sequences = True

    def assert_postgresql(self) -> None:
        self.assertEqual(connection.vendor, "postgresql")


class PostgreSQLMigrationVerificationTests(PostgreSQLVerificationTestCase):
    def test_all_frozen_app_leaf_migrations_are_applied(self) -> None:
        self.assert_postgresql()
        expected_leaves = {
            ("accounts", "0002_userprofile_avatar_asset"),
            ("media", "0001_initial"),
            ("organizations", "0001_initial"),
            ("competitions", "0001_initial"),
            ("teams", "0001_initial"),
            ("activities", "0001_initial"),
            ("content", "0001_initial"),
            ("consultations", "0001_initial"),
            ("notifications", "0001_initial"),
            ("audit", "0001_initial"),
        }
        applied_migrations = set(MigrationRecorder.Migration.objects.values_list("app", "name"))
        self.assertTrue(expected_leaves.issubset(applied_migrations))


class PostgreSQLSchemaVerificationTests(PostgreSQLVerificationTestCase):
    def _index_definitions(self, *index_names: str) -> dict[str, str]:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE schemaname = ANY(current_schemas(false))
                  AND indexname = ANY(%s)
                """,
                [list(index_names)],
            )
            definitions = dict(cursor.fetchall())
        self.assertEqual(set(definitions), set(index_names))
        return definitions

    def test_documented_high_frequency_indexes_exist_in_postgresql_catalog(self) -> None:
        self.assert_postgresql()
        expected_indexes = {
            User: {"accounts_user_role_active_idx"},
            MediaAsset: {"media_asset_sha256_idx", "media_asset_status_created_idx"},
            Organization: {"organization_type_active_idx"},
            OrganizationMembership: {"membership_user_active_idx", "membership_org_role_active_idx"},
            Recruitment: {"recruitment_org_state_idx", "recruitment_state_end_idx"},
            RecruitmentApplication: {
                "recruit_app_state_created_idx",
                "recruit_app_position_state_idx",
                "recruit_applicant_created_idx",
            },
            Competition: {
                "competition_state_reg_end_idx",
                "competition_category_state_idx",
                "competition_level_state_idx",
                "competition_mode_state_idx",
                "competition_featured_order_idx",
                "competition_event_start_idx",
            },
            TimelineEvent: {"timeline_competition_event_idx"},
            TeamPost: {"team_post_comp_state_idx", "team_post_author_created_idx", "team_post_type_state_idx"},
            TeamApplication: {"team_app_post_state_idx", "team_app_applicant_created_idx"},
            Activity: {
                "activity_state_start_idx",
                "activity_type_state_idx",
                "activity_registration_end_idx",
                "activity_featured_order_idx",
            },
            Registration: {"activity_reg_state_idx", "activity_reg_user_state_idx"},
            Announcement: {"announcement_state_pub_idx", "announcement_pinned_pub_idx"},
            GuideArticle: {"guide_category_state_pub_idx", "guide_featured_order_idx"},
            FaqItem: {"faq_state_sort_idx"},
            Consultation: {"consult_author_created_idx", "consult_state_visibility_idx"},
            Notification: {"notif_recipient_created_idx", "notification_read_created_idx"},
            AuditLog: {"audit_actor_created_idx", "audit_target_created_idx"},
        }
        with connection.cursor() as cursor:
            for model, names in expected_indexes.items():
                constraints = connection.introspection.get_constraints(cursor, model._meta.db_table)
                actual_indexes = {name for name, details in constraints.items() if details["index"]}
                self.assertTrue(names.issubset(actual_indexes), model._meta.label)

    def test_partial_unique_predicates_are_real_postgresql_predicates(self) -> None:
        self.assert_postgresql()
        definitions = self._index_definitions(
            "accounts_user_student_no_unique",
            "team_application_active_unique",
            "recruitment_application_active_unique",
            "notification_dedupe_unique",
        )
        student_no_definition = definitions["accounts_user_student_no_unique"].lower()
        team_definition = definitions["team_application_active_unique"].lower()
        recruitment_definition = definitions["recruitment_application_active_unique"].lower()
        notification_definition = definitions["notification_dedupe_unique"].lower()

        self.assertIn("where", student_no_definition)
        self.assertIn("student_no", student_no_definition)
        self.assertIn("where", team_definition)
        self.assertIn("pending", team_definition)
        self.assertIn("accepted", team_definition)
        self.assertIn("where", recruitment_definition)
        self.assertIn("pending", recruitment_definition)
        self.assertIn("accepted", recruitment_definition)
        self.assertIn("where", notification_definition)
        self.assertIn("dedupe_key", notification_definition)


class PostgreSQLPartialUniqueBehaviorTests(PostgreSQLVerificationTestCase):
    def create_user(self, student_no: str, *, username: str | None = None) -> User:
        return User.objects.create_user(
            username=username or student_no,
            student_no=student_no,
            real_name="数据库验证用户",
            password="SafePassword123!",
        )

    def create_team_post(self, *, author: User) -> TeamPost:
        competition = Competition.objects.create(
            name="partial unique 组队竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="用于验证组队申请 partial unique。",
            created_by=author,
            updated_by=author,
        )
        return TeamPost.objects.create(
            competition=competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="验证组队申请唯一性",
            direction="PostgreSQL 约束验证",
            base_member_count=1,
            target_member_count=3,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="author@example.edu",
        )

    def create_team_application(self, *, post: TeamPost, applicant: User, contact_value: str) -> TeamApplication:
        return TeamApplication.objects.create(
            team_post=post,
            applicant=applicant,
            self_intro="我有足够的数据库工程经验。",
            motivation="希望共同完成高质量项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value=contact_value,
        )

    def create_recruitment_application(self, *, applicant: User) -> RecruitmentApplication:
        leader = self.create_user("20244521")
        organization = Organization.objects.create(
            name="partial unique 招新协会",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
        )
        recruitment = Recruitment.objects.create(
            organization=organization,
            title="数据库验证招新",
            intro_md="用于验证招新申请 partial unique。",
            apply_end_at=timezone.now() + timedelta(days=7),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=leader,
            updated_by=leader,
        )
        position = RecruitmentPosition.objects.create(recruitment=recruitment, name="技术干事", headcount=2)
        return RecruitmentApplication.objects.create(
            recruitment=recruitment,
            position=position,
            applicant=applicant,
            self_intro="我有组织服务经验。",
            motivation="希望服务学院同学。",
        )

    def test_student_no_partial_unique_rejects_duplicate_and_allows_null(self) -> None:
        self.assert_postgresql()
        self.create_user("20244501", username="student-number-primary")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    username="student-number-duplicate",
                    student_no="20244501",
                    real_name="重复学号用户",
                    password="SafePassword123!",
                )

        User.objects.create_user(username="system-account-one", student_no=None, real_name="系统账号一", password="SafePassword123!")
        User.objects.create_user(username="system-account-two", student_no=None, real_name="系统账号二", password="SafePassword123!")
        self.assertEqual(User.objects.filter(student_no__isnull=True).count(), 2)

    def test_team_application_partial_unique_allows_resubmission_after_withdrawal(self) -> None:
        self.assert_postgresql()
        author = self.create_user("20244502")
        applicant = self.create_user("20244503")
        post = self.create_team_post(author=author)
        first = self.create_team_application(post=post, applicant=applicant, contact_value="first@example.edu")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.create_team_application(post=post, applicant=applicant, contact_value="duplicate@example.edu")

        first.status = TeamApplication.Status.WITHDRAWN
        first.save(update_fields=["status", "updated_at"])
        replacement = self.create_team_application(post=post, applicant=applicant, contact_value="replacement@example.edu")
        self.assertEqual(replacement.status, TeamApplication.Status.PENDING)

    def test_recruitment_application_partial_unique_allows_resubmission_after_withdrawal(self) -> None:
        self.assert_postgresql()
        applicant = self.create_user("20244504")
        first = self.create_recruitment_application(applicant=applicant)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecruitmentApplication.objects.create(
                    recruitment=first.recruitment,
                    position=first.position,
                    applicant=applicant,
                    self_intro="第二次有效申请应被数据库拒绝。",
                    motivation="验证 partial unique 的写入语义。",
                )

        first.status = RecruitmentApplication.Status.WITHDRAWN
        first.save(update_fields=["status", "updated_at"])
        replacement = RecruitmentApplication.objects.create(
            recruitment=first.recruitment,
            position=first.position,
            applicant=applicant,
            self_intro="撤回后的再次申请。",
            motivation="确认有效申请仅保留一条。",
        )
        self.assertEqual(replacement.status, RecruitmentApplication.Status.PENDING)

    def test_notification_dedupe_partial_unique_allows_null_and_rejects_duplicate_key(self) -> None:
        self.assert_postgresql()
        recipient = self.create_user("20244505")
        Notification.objects.create(
            recipient=recipient,
            notification_type=Notification.NotificationType.SYSTEM,
            title="带去重键的通知",
            dedupe_key="database-verification:one",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Notification.objects.create(
                    recipient=recipient,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="重复去重键通知",
                    dedupe_key="database-verification:one",
                )

        Notification.objects.create(
            recipient=recipient,
            notification_type=Notification.NotificationType.SYSTEM,
            title="无去重键通知一",
        )
        Notification.objects.create(
            recipient=recipient,
            notification_type=Notification.NotificationType.SYSTEM,
            title="无去重键通知二",
        )
        self.assertEqual(Notification.objects.filter(recipient=recipient, dedupe_key__isnull=True).count(), 2)
