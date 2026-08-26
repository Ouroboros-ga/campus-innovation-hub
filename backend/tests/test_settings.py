from django.core.exceptions import ImproperlyConfigured
from django.conf import settings
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
