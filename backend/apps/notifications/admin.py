from django.contrib import admin

from apps.core.admin import AuditedAdminMixin
from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["recipient", "notification_type", "title", "read_at", "created_at"]
    list_filter = ["notification_type", "read_at"]
    search_fields = ["recipient__username", "title"]
    raw_id_fields = ["recipient"]
    readonly_fields = ["notification_type", "title", "body", "action_path", "dedupe_key", "created_at"]

    def has_add_permission(self, request):
        return False
