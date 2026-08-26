"""按用户定向的个人消息模型。"""

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.core.models import UUIDCreatedModel


class Notification(UUIDCreatedModel):
    class NotificationType(models.TextChoices):
        SYSTEM = "SYSTEM", "系统"
        COMPETITION = "COMPETITION", "竞赛"
        TEAM = "TEAM", "组队"
        ACTIVITY = "ACTIVITY", "活动"
        ORGANIZATION = "ORGANIZATION", "组织"
        CONSULTATION = "CONSULTATION", "咨询"

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=160)
    body = models.CharField(max_length=500, null=True, blank=True)
    action_path = models.CharField(max_length=500, null=True, blank=True)
    dedupe_key = models.CharField(max_length=200, null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["recipient", "dedupe_key"],
                condition=Q(dedupe_key__isnull=False),
                name="notification_dedupe_unique",
            ),
        ]
        indexes = [
            models.Index(fields=["recipient", "created_at"], name="notif_recipient_created_idx"),
            models.Index(fields=["recipient", "read_at", "created_at"], name="notification_read_created_idx"),
        ]
