"""Agent 探针：供 campus-auto-ops 启动时确认身份、权限与过期时间。"""

from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import AgentCredential
from apps.ops_api.base import OperatorAPIView


class AgentContextView(OperatorAPIView):
    """GET /api/ops/agent/context — 仅对已开放的 Agent 凭证有效。

    人类 Session 也可访问（用于调试），但 Agent 若未开放则 403 由基类拦截。
    """

    agent_access = True
    agent_scopes = {"GET": set()}

    def get(self, request: Request) -> Response:
        credential = request.auth if isinstance(request.auth, AgentCredential) else None
        user = request.user
        # 若为 Session，credential 为 None，仍返回 actor 信息
        profile = getattr(user, "profile", None)
        display_name = None
        if profile is not None:
            display_name = getattr(profile, "public_name", None) or getattr(profile, "nickname", None) or user.real_name
        else:
            display_name = getattr(user, "real_name", "") or user.username

        return Response(
            {
                "credential": (
                    {
                        "id": str(credential.id),
                        "name": credential.name,
                        "token_id": credential.token_id,
                        "scopes": credential.scopes,
                        "expires_at": credential.expires_at.isoformat() if credential.expires_at else None,
                        "is_active": credential.is_active,
                    }
                    if credential
                    else None
                ),
                "actor": {
                    "id": str(user.id),
                    "username": user.username,
                    "display_name": display_name,
                    "platform_role": "SUPERADMIN" if user.is_superuser else user.platform_role,
                    "is_superuser": user.is_superuser,
                },
                "scopes": credential.scopes if credential else [],
                "server_time": timezone.now().isoformat(),
            }
        )
