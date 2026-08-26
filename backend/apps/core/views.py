"""Infrastructure endpoints that do not expose any business domain."""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    authentication_classes: list[type[object]] = []
    permission_classes = [AllowAny]

    def get(self, request: object) -> Response:
        return Response({"status": "ok"})
