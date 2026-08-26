from django.contrib import admin

from apps.competitions.models import Competition, Follow, TimelineEvent


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ["name", "edition", "category", "level", "publication_state", "is_featured"]
    list_filter = ["publication_state", "category", "level", "participation_mode"]
    search_fields = ["name", "edition", "direction"]
    raw_id_fields = ["cover_asset", "created_by", "updated_by"]
    readonly_fields = ["publication_state"]


@admin.register(TimelineEvent)
class TimelineEventAdmin(admin.ModelAdmin):
    list_display = ["title", "competition", "event_at", "sort_order"]
    raw_id_fields = ["competition"]


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["competition", "user", "created_at"]
    raw_id_fields = ["competition", "user"]
    readonly_fields = ["created_at"]
