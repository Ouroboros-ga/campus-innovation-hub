"""跨 API 层复用的请求 DTO 原语。"""

from __future__ import annotations

from rest_framework import serializers


class CreateIntentMixin(serializers.Serializer):
    """发布型内容的创建意图：缺省只建草稿，`publish=true` 时在同一事务内发布。

    只挂到 create serializer 上；`publication_state` 仍然禁止客户端直接写入，
    状态只走 action endpoint 或创建意图。视图负责把 `publish` 从 payload 中取出并
    下传给领域 service，不让它混进模型字段。
    """

    publish = serializers.BooleanField(required=False, default=False)
