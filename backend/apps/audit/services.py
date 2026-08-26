"""审计日志写入及敏感信息门禁。"""

from collections.abc import Mapping
from typing import Any

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.domain_errors import SensitiveAuditData


_FORBIDDEN_CHANGE_KEYS = {
    "password",
    "cookie",
    "session",
    "csrf",
    "authorization",
    "database_url",
    "access_key",
    "secret_access_key",
    "contact_value",
    "student_no",
    "real_name",
    "class_name",
    "student_no_snapshot",
    "self_intro",
    "motivation",
    "experience",
    "body_md",
}


def _assert_changes_are_safe(value: Any) -> None:
    if isinstance(value, Mapping):
        for key, nested_value in value.items():
            if str(key).lower() in _FORBIDDEN_CHANGE_KEYS:
                raise SensitiveAuditData
            _assert_changes_are_safe(nested_value)
    elif isinstance(value, list):
        for item in value:
            _assert_changes_are_safe(item)


def record_audit(
    *,
    actor: User | None,
    action: str,
    target: object | None,
    changes: dict[str, Any],
) -> AuditLog:
    """记录最小必要变化；target 无 FK 保证历史证据独立保存。"""

    _assert_changes_are_safe(changes)
    target_id = getattr(target, "id", None)
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target.__class__.__name__ if target is not None else "SYSTEM",
        target_id=target_id,
        target_repr=str(target)[:200] if target is not None else None,
        changes_json=changes,
    )
