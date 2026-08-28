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
    """记录最小必要变化；target 无 FK 保证历史证据独立保存。

    若当前请求处于 Agent 上下文，自动从 ContextVar 填充 agent_credential/request_id/source_ip/agent_id，
    无需调用方显式传递，实现对现有几十处调用的零侵入。
    """

    _assert_changes_are_safe(changes)
    target_id = getattr(target, "id", None)
    # 自动注入审计上下文
    agent_credential_id = None
    request_id = None
    source_ip = None
    agent_id = None
    try:
        from apps.core.audit_context import get_audit_context

        ctx = get_audit_context()
        if ctx is not None:
            agent_credential_id = ctx.agent_credential_id
            request_id = ctx.request_id
            source_ip = ctx.source_ip
            agent_id = ctx.agent_id
    except Exception:
        # 审计上下文获取失败不阻塞主业务
        pass
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target.__class__.__name__ if target is not None else "SYSTEM",
        target_id=target_id,
        target_repr=str(target)[:200] if target is not None else None,
        changes_json=changes,
        agent_credential_id=agent_credential_id,
        request_id=request_id,
        source_ip=source_ip,
        agent_id=agent_id,
    )
