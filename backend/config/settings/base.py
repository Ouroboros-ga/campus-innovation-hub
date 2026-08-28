"""Shared Django settings and PostgreSQL-only configuration parsing."""

import os
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parents[2]


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ImproperlyConfigured(f"缺少环境变量 {name}")
    return value


def env_bool(name: str) -> bool:
    value = required_env(name).lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    raise ImproperlyConfigured(f"环境变量 {name} 必须是布尔值")


def database_config_from_url(value: str) -> dict[str, Any]:
    parsed = urlparse(value)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL 必须使用 PostgreSQL URL")

    database_name = unquote(parsed.path.lstrip("/"))
    if not database_name:
        raise ImproperlyConfigured("DATABASE_URL 必须包含数据库名")

    try:
        port = str(parsed.port or 5432)
    except ValueError as error:
        raise ImproperlyConfigured("DATABASE_URL 的端口无效") from error

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": database_name,
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": port,
        "OPTIONS": dict(parse_qsl(parsed.query, keep_blank_values=True)),
    }


SECRET_KEY = required_env("DJANGO_SECRET_KEY")
DEBUG = env_bool("DJANGO_DEBUG")
ALLOWED_HOSTS = [host.strip() for host in required_env("DJANGO_ALLOWED_HOSTS").split(",") if host.strip()]
# development/CI 可复用 Django SECRET_KEY；production.py 强制要求独立 HMAC key。
AUTH_THROTTLE_HMAC_KEY = os.environ.get("AUTH_THROTTLE_HMAC_KEY", SECRET_KEY)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "apps.accounts",
    "apps.media",
    "apps.organizations",
    "apps.competitions",
    "apps.teams",
    "apps.activities",
    "apps.content",
    "apps.consultations",
    "apps.notifications",
    "apps.audit",
    "apps.core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {"default": database_config_from_url(required_env("DATABASE_URL"))}

LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True
APPEND_SLASH = False
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

STATIC_URL = "/static/"
MEDIA_URL = os.environ.get("MEDIA_URL", "/media/")
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", BASE_DIR / "media"))
MEDIA_STORAGE_BACKEND = os.environ.get("MEDIA_STORAGE_BACKEND", "local").strip().lower()
MEDIA_PUBLIC_BASE_URL = os.environ.get("MEDIA_PUBLIC_BASE_URL", "").strip()
MEDIA_S3_ENDPOINT_URL = os.environ.get("MEDIA_S3_ENDPOINT_URL", "").strip()
MEDIA_S3_REGION = os.environ.get("MEDIA_S3_REGION", "").strip()
MEDIA_S3_BUCKET = os.environ.get("MEDIA_S3_BUCKET", "").strip()
MEDIA_S3_ACCESS_KEY_ID = os.environ.get("MEDIA_S3_ACCESS_KEY_ID", "").strip()
MEDIA_S3_SECRET_ACCESS_KEY = os.environ.get("MEDIA_S3_SECRET_ACCESS_KEY", "").strip()
MEDIA_S3_OBJECT_PREFIX = os.environ.get("MEDIA_S3_OBJECT_PREFIX", "").strip()

DATA_UPLOAD_MAX_MEMORY_SIZE = 1 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False

CSRF_FAILURE_VIEW = "apps.core.errors.csrf_failure"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "ops-analytics",
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.core.authentication.ApiSessionAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "UNAUTHENTICATED_USER": None,
    "EXCEPTION_HANDLER": "apps.core.errors.api_exception_handler",
}
