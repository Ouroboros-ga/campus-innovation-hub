from django.contrib import admin

from apps.core.admin import AuditedAdminMixin
from apps.media.models import MediaAsset


@admin.register(MediaAsset)
class MediaAssetAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["original_name", "kind", "status", "size_bytes", "created_by", "created_at"]
    list_filter = ["kind", "status"]
    search_fields = ["original_name", "object_key", "sha256"]
    raw_id_fields = ["created_by"]
    readonly_fields = ["object_key", "sha256", "size_bytes", "created_at", "deleted_at"]

    def has_add_permission(self, request):
        return False
