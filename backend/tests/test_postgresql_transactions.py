"""只能在 PostgreSQL 判定的并发锁、partial unique 和 Schema 约束测试。"""

from datetime import timedelta
from threading import Barrier, Lock, Thread

from django.db import connection, close_old_connections
from django.test import TransactionTestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.activities.models import Activity, Registration
from apps.activities.services import register_activity
from apps.competitions.models import Competition, Follow
from apps.domain_errors import CapacityFull, InvalidState
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.organizations.services import accept_recruitment_application
from apps.teams.models import TeamApplication, TeamPost
from apps.teams.services import accept_team_application


class PostgreSQLSchemaTests(TransactionTestCase):
    reset_sequences = True

    def test_partial_unique_constraints_and_high_frequency_indexes_exist(self) -> None:
        self.assertEqual(connection.vendor, "postgresql")
        expected_constraints = {
            User: {"accounts_user_student_no_unique"},
            TeamApplication: {"team_application_active_unique"},
            RecruitmentApplication: {"recruitment_application_active_unique"},
            Notification: {"notification_dedupe_unique"},
            Follow: {"competition_follow_unique"},
            Registration: {"activity_registration_unique"},
        }
        expected_indexes = {
            Activity: {"activity_state_start_idx", "activity_registration_end_idx"},
            TeamApplication: {"team_app_post_state_idx", "team_app_applicant_created_idx"},
            RecruitmentApplication: {"recruit_app_state_created_idx", "recruit_applicant_created_idx"},
        }
        with connection.cursor() as cursor:
            for model, names in expected_constraints.items():
                constraints = connection.introspection.get_constraints(cursor, model._meta.db_table)
                self.assertTrue(names.issubset(constraints), model._meta.label)
            for model, names in expected_indexes.items():
                constraints = connection.introspection.get_constraints(cursor, model._meta.db_table)
                actual_indexes = {name for name, details in constraints.items() if details["index"]}
                self.assertTrue(names.issubset(actual_indexes), model._meta.label)


class ActivityRegistrationConcurrencyTests(TransactionTestCase):
    """两个独立连接争抢最后一个名额时，Activity 行锁必须令其串行化。"""

    reset_sequences = True

    def create_user(self, student_no: str) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="并发测试用户",
            password="SafePassword123!",
        )

    def test_concurrent_registration_cannot_oversell_capacity(self) -> None:
        operator = self.create_user("20244001")
        first_student = self.create_user("20244002")
        second_student = self.create_user("20244003")
        activity = Activity.objects.create(
            title="并发报名测试活动",
            activity_type=Activity.ActivityType.TRAINING,
            description_md="用于验证 PostgreSQL 行锁。",
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
        barrier = Barrier(2)
        result_lock = Lock()
        outcomes: list[str] = []

        def attempt_registration(user_id: object) -> None:
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                register_activity(
                    actor=User.objects.get(pk=user_id),
                    activity=Activity.objects.get(pk=activity.pk),
                )
                outcome = "REGISTERED"
            except CapacityFull:
                outcome = "CAPACITY_FULL"
            finally:
                close_old_connections()
            with result_lock:
                outcomes.append(outcome)

        threads = [
            Thread(target=attempt_registration, args=(first_student.id,)),
            Thread(target=attempt_registration, args=(second_student.id,)),
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)

        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertCountEqual(outcomes, ["REGISTERED", "CAPACITY_FULL"])
        self.assertEqual(
            Registration.objects.filter(activity=activity, status=Registration.Status.REGISTERED).count(),
            1,
        )


class TeamApplicationConcurrencyTests(TransactionTestCase):
    """同一 TeamPost 的接受操作必须由帖子行锁串行化。"""

    reset_sequences = True

    def create_user(self, student_no: str) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="并发测试用户",
            password="SafePassword123!",
        )

    def test_concurrent_accept_cannot_overfill_team(self) -> None:
        author = self.create_user("20244101")
        first_student = self.create_user("20244102")
        second_student = self.create_user("20244103")
        competition = Competition.objects.create(
            name="并发组队竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="用于 PostgreSQL 行锁测试。",
            publication_state=Competition.PublicationState.PUBLISHED,
            created_by=author,
            updated_by=author,
        )
        post = TeamPost.objects.create(
            competition=competition,
            author=author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="并发招募算法队友",
            direction="多模态算法",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="team@example.edu",
        )
        first_application = TeamApplication.objects.create(
            team_post=post,
            applicant=first_student,
            self_intro="我有足够的竞赛经验。",
            motivation="希望共同完成高质量项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="first@example.edu",
        )
        second_application = TeamApplication.objects.create(
            team_post=post,
            applicant=second_student,
            self_intro="我有足够的竞赛经验。",
            motivation="希望共同完成高质量项目。",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="second@example.edu",
        )
        barrier = Barrier(2)
        result_lock = Lock()
        outcomes: list[str] = []

        def attempt_accept(application_id: object) -> None:
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                accept_team_application(
                    actor=User.objects.get(pk=author.id),
                    application=TeamApplication.objects.get(pk=application_id),
                )
                outcome = "ACCEPTED"
            except CapacityFull:
                outcome = "CAPACITY_FULL"
            except InvalidState:
                # 首个事务已将帖子置为 FULL 时，第二个事务命中状态机冲突。
                outcome = "POST_FULL"
            finally:
                close_old_connections()
            with result_lock:
                outcomes.append(outcome)

        threads = [
            Thread(target=attempt_accept, args=(first_application.id,)),
            Thread(target=attempt_accept, args=(second_application.id,)),
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)

        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertCountEqual(outcomes, ["ACCEPTED", "POST_FULL"])
        self.assertEqual(
            TeamApplication.objects.filter(team_post=post, status=TeamApplication.Status.ACCEPTED).count(),
            1,
        )


class RecruitmentMembershipConcurrencyTests(TransactionTestCase):
    """不同招新轮次接受同一人时，Organization 锁保护 Membership 唯一键。"""

    reset_sequences = True

    def create_user(self, student_no: str) -> User:
        return User.objects.create_user(
            username=student_no,
            student_no=student_no,
            real_name="并发测试用户",
            password="SafePassword123!",
        )

    def test_concurrent_accept_in_same_organization_creates_one_membership(self) -> None:
        leader = self.create_user("20244201")
        applicant = self.create_user("20244202")
        organization = Organization.objects.create(
            name="并发招新协会",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
        )
        OrganizationMembership.objects.create(
            organization=organization,
            user=leader,
            role=OrganizationMembership.Role.LEADER,
        )
        recruitments = [
            Recruitment.objects.create(
                organization=organization,
                title=title,
                intro_md="用于 PostgreSQL Membership 并发测试。",
                apply_end_at=timezone.now() + timedelta(days=7),
                publication_state=Recruitment.PublicationState.PUBLISHED,
                created_by=leader,
                updated_by=leader,
            )
            for title in ("技术部招新", "运营部招新")
        ]
        applications = []
        for recruitment, position_name in zip(recruitments, ("技术干事", "运营干事"), strict=True):
            position = RecruitmentPosition.objects.create(recruitment=recruitment, name=position_name, headcount=1)
            applications.append(
                RecruitmentApplication.objects.create(
                    recruitment=recruitment,
                    position=position,
                    applicant=applicant,
                    self_intro="我有足够的组织服务经验。",
                    motivation="希望服务学院同学。",
                )
            )

        barrier = Barrier(2)
        result_lock = Lock()
        outcomes: list[str] = []

        def attempt_accept(application_id: object) -> None:
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                accept_recruitment_application(
                    actor=User.objects.get(pk=leader.id),
                    application=RecruitmentApplication.objects.get(pk=application_id),
                )
                outcome = "ACCEPTED"
            finally:
                close_old_connections()
            with result_lock:
                outcomes.append(outcome)

        threads = [Thread(target=attempt_accept, args=(application.id,)) for application in applications]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)

        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertEqual(outcomes, ["ACCEPTED", "ACCEPTED"])
        self.assertEqual(
            OrganizationMembership.objects.filter(organization=organization, user=applicant, is_active=True).count(),
            1,
        )
        self.assertEqual(
            RecruitmentApplication.objects.filter(status=RecruitmentApplication.Status.ACCEPTED).count(),
            2,
        )

    def test_concurrent_accept_cannot_overfill_recruitment_position(self) -> None:
        leader = self.create_user("20244301")
        first_applicant = self.create_user("20244302")
        second_applicant = self.create_user("20244303")
        organization = Organization.objects.create(
            name="岗位名额并发测试协会",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
        )
        OrganizationMembership.objects.create(
            organization=organization,
            user=leader,
            role=OrganizationMembership.Role.LEADER,
        )
        recruitment = Recruitment.objects.create(
            organization=organization,
            title="岗位名额并发招新",
            intro_md="验证 PostgreSQL 岗位行锁。",
            apply_end_at=timezone.now() + timedelta(days=7),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=leader,
            updated_by=leader,
        )
        position = RecruitmentPosition.objects.create(
            recruitment=recruitment,
            name="唯一名额岗位",
            headcount=1,
        )
        applications = [
            RecruitmentApplication.objects.create(
                recruitment=recruitment,
                position=position,
                applicant=applicant,
                self_intro="我有足够的组织服务经验。",
                motivation="希望服务学院同学。",
            )
            for applicant in (first_applicant, second_applicant)
        ]
        barrier = Barrier(2)
        result_lock = Lock()
        outcomes: list[str] = []

        def attempt_accept(application_id: object) -> None:
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                accept_recruitment_application(
                    actor=User.objects.get(pk=leader.id),
                    application=RecruitmentApplication.objects.get(pk=application_id),
                )
                outcome = "ACCEPTED"
            except CapacityFull:
                outcome = "CAPACITY_FULL"
            finally:
                close_old_connections()
            with result_lock:
                outcomes.append(outcome)

        threads = [Thread(target=attempt_accept, args=(application.id,)) for application in applications]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)

        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertCountEqual(outcomes, ["ACCEPTED", "CAPACITY_FULL"])
        self.assertEqual(
            RecruitmentApplication.objects.filter(
                position=position,
                status=RecruitmentApplication.Status.ACCEPTED,
            ).count(),
            1,
        )
        self.assertEqual(
            OrganizationMembership.objects.filter(organization=organization, is_active=True).count(),
            2,
        )
