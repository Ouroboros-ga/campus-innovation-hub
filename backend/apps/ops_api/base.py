"""运营 HTTP 端点共用的认证、权限与请求边界。"""

from __future__ import annotations

from rest_framework.exceptions import PermissionDenied as RestPermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.permissions import is_operator


class OperatorAPIView(APIView):
    """仅平台 OPERATOR/SUPERADMIN 可进入；组织负责人权限不在此复用。

    Agent 受控：默认 `agent_access=False`，机器身份即使为 OPERATOR 也 403，
    需在子类显式声明 `agent_access=True` 与 `agent_scopes` 白名单。
    """

    permission_classes = [IsAuthenticated]
    # Agent 默认禁止；需逐端点显式开放（campus-auto-ops 默认禁止逐端点开放）
    agent_access: bool = False
    # 方法到所需 scope 集合的映射，例如 {"GET": {"homepage:read"}, "PATCH": {"homepage:write"}}
    agent_scopes: dict[str, set[str]] = {}

    def initial(self, request: Request, *args: object, **kwargs: object) -> None:
        super().initial(request, *args, **kwargs)
        if not is_operator(request.user):
            raise RestPermissionDenied("需要运营权限。")
        # Agent 白名单 + Scope 校验（仅对 Bearer PAT 认证生效）
        from apps.accounts.models import AgentCredential

        credential = request.auth
        if isinstance(credential, AgentCredential):
            if not self.agent_access:
                raise RestPermissionDenied("该端点未对 Agent 开放。")
            required = self.agent_scopes.get(request.method, None)
            if required is None:
                raise RestPermissionDenied("该方法未对 Agent 开放。")
            if required and not required.issubset(set(credential.scopes or [])):
                raise RestPermissionDenied("缺少所需的 Agent 权限。")


def require_empty_body(request: Request) -> None:
    if request.data:
        raise ValidationError({"non_field_errors": ["该操作不接受请求体。"]})
