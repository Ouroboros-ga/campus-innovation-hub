"""运营侧媒体上传（复用学生侧校验与存储，仅路径与 scope 不同）。"""

from rest_framework.request import Request
from rest_framework.response import Response

from apps.media.models import MediaAsset
from apps.media.services import UnsupportedMedia, create_image_asset
from apps.ops_api.base import OperatorAPIView
from apps.student_api.serializers import MediaUploadSerializer, serialize_media_upload


class OpsMediaUploadView(OperatorAPIView):
    agent_access = True
    agent_scopes = {"POST": {"media:upload"}}

    def post(self, request: Request) -> Response:
        serializer = MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["kind"] != MediaAsset.Kind.IMAGE:
            raise UnsupportedMedia("V0.1 暂不支持文档上传。")
        uploaded = serializer.validated_data["file"]
        asset, url = create_image_asset(
            actor=request.user,
            file=uploaded,
            original_name=uploaded.name,
            content_type=uploaded.content_type,
        )
        return Response(serialize_media_upload(asset, url, request), status=201)
