"""请求审计上下文中间件。"""

from __future__ import annotations

import uuid

from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin

from apps.core.audit_context import clear_audit_context, set_audit_context


def _client_ip(request: HttpRequest) -> str:
    peer = request.META.get("REMOTE_ADDR", "")
    if peer in {"127.0.0.1", "::1"}:
        forwarded = request.META.get("HTTP_X_REAL_IP", "")
        if forwarded:
            return forwarded.strip()
    return peer


class AuditContextMiddleware(MiddlewareMixin):
    """为每个请求初始化/清理 AuditContext；Agent 认证会覆盖其中的 agent 字段。"""

    def process_request(self, request: HttpRequest) -> None:
        request_id = request.META.get("HTTP_X_REQUEST_ID", "")[:64] or str(uuid.uuid4())
        # 保证响应也能回显 request_id
        request.META["HTTP_X_REQUEST_ID"] = request_id
        set_audit_context(
            agent_credential_id=None,
            agent_id=request.META.get("HTTP_X_AGENT_ID", "")[:80] or None,
            source_ip=_client_ip(request),
            request_id=request_id,
        )

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        try:
            # 回显 request_id 便于链路追踪
            request_id = request.META.get("HTTP_X_REQUEST_ID")
            if request_id:
                response["X-Request-Id"] = request_id
        finally:
            clear_audit_context()
        return response

    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        clear_audit_context()
