"""API 的 Session 与 Agent 认证细节。"""

import hashlib
import hmac
import ipaddress
import re
from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request


class ApiSessionAuthentication(SessionAuthentication):
    """让缺 Session 的 API 请求以 401 而不是 DRF 默认的 403 返回。"""

    def authenticate_header(self, request: Request) -> str:
        return "Session"


_AGENT_TOKEN_RE = re.compile(r"^campus_ops_pat_([A-Za-z0-9]{8,20})\.([A-Za-z0-9_-]{20,})$")
_AGENT_TOKEN_PREFIX = "campus_ops_pat_"


class AgentTokenAuthentication(BaseAuthentication):
    """机器身份 Bearer PAT 认证（campus-auto-ops）。

    Token 形态：campus_ops_pat_<token_id>.<secret>
    DB 仅存 token_id + secret_hash(SHA256)，secret 本身不落库。
    认证路径独立于 Session/CSRF，不触发 Session 的 CSRF 校验。
    """

    def authenticate(self, request: Request):  # type: ignore[override]
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        raw_token = auth_header[7:].strip()
        if not raw_token.startswith(_AGENT_TOKEN_PREFIX):
            return None
        match = _AGENT_TOKEN_RE.match(raw_token)
        if not match:
            raise AuthenticationFailed("无效的 Agent 令牌格式。")
        token_id, secret = match.groups()

        # 延迟导入避免循环
        from apps.accounts.models import AgentCredential

        try:
            credential = AgentCredential.objects.select_related("user").get(token_id=token_id)
        except AgentCredential.DoesNotExist:
            raise AuthenticationFailed("Agent 令牌不存在或已撤销。")

        # is_active / 过期 / 绑定用户可用性
        if not credential.is_active:
            raise AuthenticationFailed("Agent 令牌已停用。")
        if credential.expires_at and credential.expires_at < timezone.now():
            raise AuthenticationFailed("Agent 令牌已过期。")
        user = credential.user
        if not user.is_active:
            raise AuthenticationFailed("绑定的运营账号已停用。")
        if not (user.is_superuser or user.platform_role == "OPERATOR"):
            raise AuthenticationFailed("绑定的账号缺少运营权限。")

        # secret 常时比较
        secret_hash = hashlib.sha256(secret.encode()).hexdigest()
        if not hmac.compare_digest(secret_hash, credential.secret_hash):
            raise AuthenticationFailed("Agent 令牌校验失败。")

        # 可选 CIDR 白名单
        if credential.allowed_cidrs:
            source_ip = _client_ip(request)
            if not _ip_in_cidrs(source_ip, credential.allowed_cidrs):
                raise AuthenticationFailed("来源 IP 不在白名单内。")

        # 节流式更新 last_used_at（10 分钟窗口，避免每请求写库）
        if credential.last_used_at is None or credential.last_used_at < timezone.now() - timedelta(minutes=10):
            AgentCredential.objects.filter(pk=credential.pk).update(last_used_at=timezone.now())

        # 将凭证与 agent_id 写入审计上下文
        from apps.core.audit_context import set_audit_context

        set_audit_context(
            agent_credential_id=credential.id,
            agent_id=request.META.get("HTTP_X_AGENT_ID", "")[:80] or None,
            source_ip=_client_ip(request),
            request_id=request.META.get("HTTP_X_REQUEST_ID", "")[:64] or None,
        )

        return (user, credential)

    def authenticate_header(self, request: Request) -> str:
        return "Bearer"


def _client_ip(request: Request) -> str:
    """复用 accounts.views.client_ip 的信任链路逻辑：仅在 loopback 时信任 X-Real-IP。"""
    peer = request.META.get("REMOTE_ADDR", "")
    if peer in {"127.0.0.1", "::1"}:
        forwarded = request.META.get("HTTP_X_REAL_IP", "")
        if forwarded:
            return forwarded.strip()
    return peer


def _ip_in_cidrs(ip_str: str, cidrs: list[str]) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    for cidr in cidrs:
        try:
            net = ipaddress.ip_network(cidr, strict=False)
            if ip in net:
                return True
        except ValueError:
            continue
    return False
