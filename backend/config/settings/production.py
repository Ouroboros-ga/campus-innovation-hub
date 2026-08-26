"""Production-only settings; deployment must supply every environment-specific value."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import DEBUG, ALLOWED_HOSTS, env_bool, required_env


def _exact_csv_env(name: str, *, require_https_origin: bool = False) -> list[str]:
    values = [value.strip() for value in required_env(name).split(",") if value.strip()]
    if not values or "*" in values:
        raise ImproperlyConfigured(f"{name} 必须是非通配的精确列表")
    if require_https_origin:
        for value in values:
            parsed = urlparse(value)
            if parsed.scheme != "https" or not parsed.netloc or parsed.path not in {"", "/"}:
                raise ImproperlyConfigured(f"{name} 只接受精确 HTTPS origin")
    return values


if DEBUG or env_bool("DJANGO_DEBUG"):
    raise ImproperlyConfigured("production settings 必须设置 DJANGO_DEBUG=false")
if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS 必须是非通配的精确主机列表")

AUTH_THROTTLE_HMAC_KEY = required_env("AUTH_THROTTLE_HMAC_KEY")
CSRF_TRUSTED_ORIGINS = _exact_csv_env("DJANGO_CSRF_TRUSTED_ORIGINS", require_https_origin=True)
STATIC_ROOT = Path(required_env("DJANGO_STATIC_ROOT"))

try:
    SECURE_HSTS_SECONDS = int(required_env("DJANGO_SECURE_HSTS_SECONDS"))
except ValueError as error:
    raise ImproperlyConfigured("DJANGO_SECURE_HSTS_SECONDS 必须是整数") from error
if SECURE_HSTS_SECONDS not in {0, 300}:
    raise ImproperlyConfigured("HSTS 只允许关闭或使用已评审的 300 秒预发布阶段")

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 12 * 60 * 60
SESSION_SAVE_EVERY_REQUEST = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "redacted": {
            "()": "apps.core.logging.RedactingFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "redacted"}},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO"},
        "django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
