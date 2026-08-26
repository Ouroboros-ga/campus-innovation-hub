"""只能在 PostgreSQL 判定的并发锁、partial unique 和 Schema 约束测试。"""

from datetime import timedelta
from threading import Barrier, Lock, Thread

from django.db import connection, close_old_connections
from django.test import TransactionTestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.activities.models import Activity, Registration
from apps.activities.services import register_activity
from apps.competitions.models import Follow
from apps.domain_errors import CapacityFull
from apps.notifications.models import Notification
from apps.organizations.models import RecruitmentApplication
from apps.teams.models import TeamApplication


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
