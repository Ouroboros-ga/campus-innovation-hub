from django.contrib import admin

from apps.activities.models import Activity, Registration


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title", "activity_type", "publication_state", "start_at", "registration_required"]
    list_filter = ["publication_state", "activity_type", "registration_required"]
    search_fields = ["title", "summary", "location"]
    raw_id_fields = ["organizer_organization", "cover_asset", "created_by", "updated_by"]
    readonly_fields = ["publication_state"]


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ["activity", "user", "status", "registered_at", "cancelled_at"]
    list_filter = ["status"]
    raw_id_fields = ["activity", "user"]
    readonly_fields = [
        "status",
        "name_snapshot",
        "student_no_snapshot",
        "class_name_snapshot",
        "major_snapshot",
        "grade_snapshot",
        "registered_at",
        "cancelled_at",
    ]
