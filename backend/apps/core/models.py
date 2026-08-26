"""跨领域、不建表的基础 Model。"""

import uuid

from django.db import models


class UUIDTimestampedModel(models.Model):
    """业务实体共用 UUID 主键和不可由客户端写入的审计时间。"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDCreatedModel(models.Model):
    """仅需创建时间的 append-only 或关联实体基类。"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
