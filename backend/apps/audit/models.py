"""重要行为的 append-only 审计记录。"""

from django.conf import settings
from django.db import models

from apps.core.models import UUIDCreatedModel


class AuditLog(UUIDCreatedModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs"
    )
    action = models.CharField(max_length=80)
    target_type = models.CharField(max_length=80)
    target_id = models.UUIDField(null=True, blank=True)
    target_repr = models.CharField(max_length=200, null=True, blank=True)
    changes_json = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=["actor", "created_at"], name="audit_actor_created_idx"),
            models.Index(fields=["target_type", "target_id", "created_at"], name="audit_target_created_idx"),
        ]
