"""Temporary public HTTP deployment settings (无域名 / 无 TLS，仅供临时展示)。

这是临时的非生产配置：允许服务器公网 IP 以纯 HTTP 访问，禁用 SSL 重定向与
Secure cookie，以便在没有域名与 TLS 证书的窗口期对外评审。使用前必须知晓：
- 明文 HTTP，无 TLS；任何交互、Cookie、Session 可被中间人读取；
- 仅用于短暂展示/联调，生产上线仍需域名 + TLS + production settings；
- 前端 API 以同源 `/api` 访问，CORS 无关。
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import ALLOWED_HOSTS, DEBUG, env_bool, required_env


def _exact_http_https_origins(name: str) -> list[str]:
    values = [value.strip() for value in required_env(name).split(",") if value.strip()]
    if not values or "*" in values:
        raise ImproperlyConfigured(f"{name} 必须是非通配的精确 origin 列表")
    results: list[str] = []
    for value in values:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password:
            raise ImproperlyConfigured(f"{name} 只接受无凭据的精确 http/https origin")
        if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
            raise ImproperlyConfigured(f"{name} 只接受无路径的 origin")
        results.append(value.rstrip("/"))
    return results


if DEBUG or env_bool("DJANGO_DEBUG"):
    raise ImproperlyConfigured("temporary settings 必须设置 DJANGO_DEBUG=false")
if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS 必须是非通配的精确主机列表")

AUTH_THROTTLE_HMAC_KEY = required_env("AUTH_THROTTLE_HMAC_KEY")
CSRF_TRUSTED_ORIGINS = _exact_http_https_origins("DJANGO_CSRF_TRUSTED_ORIGINS")
STATIC_ROOT = Path(required_env("DJANGO_STATIC_ROOT"))

# 无 TLS 的临时 HTTP 部署：关闭 SSL 重定向与 Secure cookie，仅用于临时展示。
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 12 * 60 * 60
SESSION_SAVE_EVERY_REQUEST = True
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
