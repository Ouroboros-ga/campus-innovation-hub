"""账户认证的 PostgreSQL 节流；只持久化 HMAC 摘要化主体。"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
from datetime import datetime, timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import AuthThrottle
from apps.domain_errors import RateLimitExceeded


LOGIN_FAILURE_LIMIT = 5
REGISTER_ATTEMPT_LIMIT = 10
WINDOW = timedelta(minutes=30)
INITIAL_BLOCK = timedelta(seconds=30)
MAX_BLOCK = timedelta(minutes=15)


def _normalise_username(value: str) -> str:
    return value.strip().casefold()


def normalise_client_ip(value: str) -> str:
    """只接受标准 IP；代理配置异常时归入一个无身份的保守桶。"""

    try:
        return str(ipaddress.ip_address(value.strip()))
    except ValueError:
        return "0.0.0.0"


def subject_digest(value: str) -> str:
    key = settings.AUTH_THROTTLE_HMAC_KEY.encode("utf-8")
    return hmac.new(key, value.encode("utf-8"), hashlib.sha256).hexdigest()


def _locked_record(*, scope: str, subject: str, now: datetime) -> AuthThrottle:
    digest = subject_digest(subject)
    try:
        return AuthThrottle.objects.select_for_update().get(scope=scope, subject_digest=digest)
    except AuthThrottle.DoesNotExist:
        try:
            with transaction.atomic():
                return AuthThrottle.objects.create(
                    scope=scope,
                    subject_digest=digest,
                    window_started_at=now,
                )
        except IntegrityError:
            return AuthThrottle.objects.select_for_update().get(scope=scope, subject_digest=digest)


def _active_record(record: AuthThrottle, *, now: datetime) -> AuthThrottle:
    if now - record.window_started_at >= WINDOW:
        record.failure_count = 0
        record.window_started_at = now
        record.blocked_until = None
    return record


def _enforce(*, scope: str, subject: str, now: datetime) -> None:
    record = _active_record(_locked_record(scope=scope, subject=subject, now=now), now=now)
    if record.blocked_until is not None and record.blocked_until > now:
        retry_after = max(1, int((record.blocked_until - now).total_seconds()))
        raise RateLimitExceeded(retry_after_seconds=retry_after)


def enforce_auth_throttles(*, client_ip: str, username: str | None, scope: str) -> None:
    """在认证前检查相应 scope；调用者只接受 LOGIN 或 REGISTER。"""

    now = timezone.now()
    normalised_ip = normalise_client_ip(client_ip)
    with transaction.atomic():
        if scope == "LOGIN":
            _enforce(scope=AuthThrottle.Scope.LOGIN_IP, subject=normalised_ip, now=now)
            if username:
                _enforce(
                    scope=AuthThrottle.Scope.LOGIN_USERNAME,
                    subject=_normalise_username(username),
                    now=now,
                )
            return
        if scope == "REGISTER":
            _enforce(scope=AuthThrottle.Scope.REGISTER_IP, subject=normalised_ip, now=now)
            return
    raise ValueError("不支持的认证节流 scope")


def _record_failure(*, scope: str, subject: str, limit: int, now: datetime) -> None:
    record = _active_record(_locked_record(scope=scope, subject=subject, now=now), now=now)
    record.failure_count += 1
    if record.failure_count >= limit:
        exponent = record.failure_count - limit
        blocked_seconds = min(
            int(INITIAL_BLOCK.total_seconds()) * (2**exponent),
            int(MAX_BLOCK.total_seconds()),
        )
        record.blocked_until = now + timedelta(seconds=blocked_seconds)
    record.save(update_fields=["failure_count", "window_started_at", "blocked_until", "updated_at"])


def record_auth_failure(*, client_ip: str, username: str) -> None:
    """仅在凭据错误后增加 IP、用户名两个计数，避免存储密码或错误详情。"""

    now = timezone.now()
    with transaction.atomic():
        _record_failure(
            scope=AuthThrottle.Scope.LOGIN_IP,
            subject=normalise_client_ip(client_ip),
            limit=LOGIN_FAILURE_LIMIT,
            now=now,
        )
        _record_failure(
            scope=AuthThrottle.Scope.LOGIN_USERNAME,
            subject=_normalise_username(username),
            limit=LOGIN_FAILURE_LIMIT,
            now=now,
        )


def record_registration_attempt(*, client_ip: str) -> None:
    """注册成功或已占用账号均计入同一来源的低频保护。"""

    with transaction.atomic():
        _record_failure(
            scope=AuthThrottle.Scope.REGISTER_IP,
            subject=normalise_client_ip(client_ip),
            limit=REGISTER_ATTEMPT_LIMIT,
            now=timezone.now(),
        )


def clear_login_throttle(*, client_ip: str, username: str) -> None:
    """成功登录仅清除用户名记录，不解除同来源对其他账号的限制。"""

    del client_ip
    with transaction.atomic():
        now = timezone.now()
        record = _locked_record(
            scope=AuthThrottle.Scope.LOGIN_USERNAME,
            subject=_normalise_username(username),
            now=now,
        )
        record.failure_count = 0
        record.window_started_at = now
        record.blocked_until = None
        record.save(update_fields=["failure_count", "window_started_at", "blocked_until", "updated_at"])
