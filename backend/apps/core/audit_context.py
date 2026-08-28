"""请求级审计上下文，通过 ContextVar 透传至 Service 层，避免污染已有 record_audit 签名。"""

from __future__ import annotations

import contextvars
import uuid
from dataclasses import dataclass, field

_audit_context_var: contextvars.ContextVar["AuditContext | None"] = contextvars.ContextVar(
    "audit_context", default=None
)


@dataclass
class AuditContext:
    agent_credential_id: uuid.UUID | None = None
    agent_id: str | None = None
    source_ip: str | None = None
    request_id: str | None = None


def set_audit_context(
    *,
    agent_credential_id: uuid.UUID | None = None,
    agent_id: str | None = None,
    source_ip: str | None = None,
    request_id: str | None = None,
) -> None:
    _audit_context_var.set(
        AuditContext(
            agent_credential_id=agent_credential_id,
            agent_id=agent_id,
            source_ip=source_ip,
            request_id=request_id,
        )
    )


def get_audit_context() -> AuditContext | None:
    return _audit_context_var.get()


def clear_audit_context() -> None:
    _audit_context_var.set(None)
