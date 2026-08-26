from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "actor", "action", "target_type", "target_id", "target_repr"]
    list_filter = ["action", "target_type"]
    search_fields = ["target_repr"]
    raw_id_fields = ["actor"]
    readonly_fields = ["actor", "action", "target_type", "target_id", "target_repr", "changes_json", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
