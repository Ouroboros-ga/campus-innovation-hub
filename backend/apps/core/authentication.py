"""API 的 Session 认证细节。"""

from rest_framework.authentication import SessionAuthentication
from rest_framework.request import Request


class ApiSessionAuthentication(SessionAuthentication):
    """让缺 Session 的 API 请求以 401 而不是 DRF 默认的 403 返回。"""

    def authenticate_header(self, request: Request) -> str:
        return "Session"
