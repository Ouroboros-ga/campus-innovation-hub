"""对象存储文件的元数据，不保存二进制内容。"""

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.core.models import UUIDCreatedModel


class MediaAsset(UUIDCreatedModel):
    class Kind(models.TextChoices):
        IMAGE = "IMAGE", "图片"
        DOCUMENT = "DOCUMENT", "文档"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "可用"
        PENDING_DELETE = "PENDING_DELETE", "待删除"
        DELETED = "DELETED", "已删除"

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_media_assets",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    object_key = models.CharField(max_length=500, unique=True)
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.BigIntegerField()
    sha256 = models.CharField(max_length=64)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["sha256"], name="media_asset_sha256_idx"),
            models.Index(fields=["status", "created_at"], name="media_asset_status_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(size_bytes__gt=0), name="media_asset_size_positive"),
            models.CheckConstraint(
                condition=Q(kind="IMAGE") | (Q(width__isnull=True) & Q(height__isnull=True)),
                name="media_asset_dimensions_image_only",
            ),
        ]

    def __str__(self) -> str:
        return self.original_name
