"""仅供 SSH 隧道和本机开发使用的 Django settings。"""

from __future__ import annotations

import os
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403


def parse_development_csrf_origins(value: str) -> list[str]:
    """仅接受 Vite 本机 origin，防止开发配置意外信任公网 HTTP 站点。"""

    origins: list[str] = []
    for raw_origin in (item.strip() for item in value.split(",")):
        if not raw_origin:
            continue
        parsed = urlparse(raw_origin)
        try:
            port = parsed.port
        except ValueError as error:
            raise ImproperlyConfigured("DJANGO_CSRF_TRUSTED_ORIGINS 包含无效端口") from error
        if (
            parsed.scheme != "http"
            or parsed.hostname not in {"localhost", "127.0.0.1"}
            or port is None
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.params
            or parsed.query
            or parsed.fragment
        ):
            raise ImproperlyConfigured("development settings 只允许带端口的本机 HTTP CSRF origin")
        origin = f"http://{parsed.hostname}:{port}"
        if origin not in origins:
            origins.append(origin)
    return origins


CSRF_TRUSTED_ORIGINS = parse_development_csrf_origins(os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", ""))
