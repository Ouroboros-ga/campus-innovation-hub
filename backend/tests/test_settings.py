from django.core.exceptions import ImproperlyConfigured
from django.conf import settings
from django.db.migrations.loader import MigrationLoader
from django.test import SimpleTestCase


class DatabaseUrlTests(SimpleTestCase):
    def test_postgresql_url_builds_django_database_config(self) -> None:
        from config.settings.base import database_config_from_url

        config = database_config_from_url(
            "postgresql://campus:secret@db.example.edu:5544/campus_hub?sslmode=require"
        )

        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["NAME"], "campus_hub")
        self.assertEqual(config["USER"], "campus")
        self.assertEqual(config["PASSWORD"], "secret")
        self.assertEqual(config["HOST"], "db.example.edu")
        self.assertEqual(config["PORT"], "5544")
        self.assertEqual(config["OPTIONS"], {"sslmode": "require"})

    def test_non_postgresql_url_is_rejected(self) -> None:
        from config.settings.base import database_config_from_url

        with self.assertRaises(ImproperlyConfigured):
            database_config_from_url("sqlite:///tmp/campus.db")


class SecuritySettingsTests(SimpleTestCase):
    def test_non_debug_environment_uses_secure_cookie_defaults(self) -> None:
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.CSRF_COOKIE_SECURE)
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, "Lax")
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, "Lax")


class DevelopmentSettingsTests(SimpleTestCase):
    def test_local_csrf_origins_are_parsed_and_non_local_origins_are_rejected(self) -> None:
        from config.settings.development import parse_development_csrf_origins

        self.assertEqual(
            parse_development_csrf_origins("http://localhost:5173,http://127.0.0.1:4173"),
            ["http://localhost:5173", "http://127.0.0.1:4173"],
        )
        with self.assertRaises(ImproperlyConfigured):
            parse_development_csrf_origins("https://example.edu")

    def test_accounts_migrations_have_one_linear_leaf(self) -> None:
        loader = MigrationLoader(None, ignore_no_migrations=True)

        self.assertEqual(loader.graph.leaf_nodes("accounts"), [("accounts", "0003_auth_throttle")])

    def test_auth_throttle_index_name_is_portable(self) -> None:
        from apps.accounts.models import AuthThrottle

        self.assertLessEqual(len(AuthThrottle._meta.indexes[0].name), 30)
