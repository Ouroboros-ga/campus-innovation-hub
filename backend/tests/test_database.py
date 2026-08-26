from django.db import connection
from django.test import TestCase


class PostgreSQLFoundationTests(TestCase):
    def test_test_runner_uses_postgresql(self) -> None:
        self.assertEqual(connection.vendor, "postgresql")

        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            self.assertEqual(cursor.fetchone(), (1,))
