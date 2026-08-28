"""首页精选聚合运营视图：固定模板 + 内容槽位批量维护。"""

from rest_framework.request import Request
from rest_framework.response import Response

from apps.content.services import get_homepage_curation, update_homepage_curation
from apps.ops_api.base import OperatorAPIView
from apps.ops_api.serializers import HomepageCurationSerializer


class HomepageCurationView(OperatorAPIView):
    """GET 返回当前精选配置，PATCH 批量覆盖四类精选排序。"""

    agent_access = True
    agent_scopes = {"GET": {"homepage:read"}, "PATCH": {"homepage:write"}}

    def get(self, request: Request) -> Response:
        return Response(get_homepage_curation())

    def patch(self, request: Request) -> Response:
        serializer = HomepageCurationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # 转为字符串 UUID 列表，服务层按字符串处理并校验
        payload = {
            "featured_competitions": [str(v) for v in serializer.validated_data.get("featured_competitions", [])],
            "featured_announcements": [str(v) for v in serializer.validated_data.get("featured_announcements", [])],
            "featured_guides": [str(v) for v in serializer.validated_data.get("featured_guides", [])],
            "featured_faqs": [str(v) for v in serializer.validated_data.get("featured_faqs", [])],
        }
        result = update_homepage_curation(actor=request.user, **payload)
        return Response(result)
