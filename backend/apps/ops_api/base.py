"""运营 HTTP 端点共用的认证、权限与请求边界。"""

from __future__ import annotations

from rest_framework.exceptions import PermissionDenied as RestPermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.permissions import is_operator


class OperatorAPIView(APIView):
    """仅平台 OPERATOR/SUPERADMIN 可进入；组织负责人权限不在此复用。"""

    permission_classes = [IsAuthenticated]

    def initial(self, request: Request, *args: object, **kwargs: object) -> None:
        super().initial(request, *args, **kwargs)
        if not is_operator(request.user):
            raise RestPermissionDenied("需要运营权限。")


def require_empty_body(request: Request) -> None:
    if request.data:
        raise ValidationError({"non_field_errors": ["该操作不接受请求体。"]})
