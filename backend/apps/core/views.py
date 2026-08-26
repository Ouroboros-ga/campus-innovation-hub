"""Infrastructure endpoints that do not expose any business domain."""

from django.db import DatabaseError, connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    authentication_classes: list[type[object]] = []
    permission_classes = [AllowAny]

    def get(self, request: object) -> Response:
        return Response({"status": "ok"})


class ReadinessCheckView(APIView):
    """仅提供给反向代理本机探针；响应不携带连接或版本细节。"""

    authentication_classes: list[type[object]] = []
    permission_classes = [AllowAny]

    def get(self, request: object) -> Response:
        try:
            connection.ensure_connection()
        except DatabaseError:
            return Response({"status": "unavailable"}, status=503)
        return Response({"status": "ready"})
