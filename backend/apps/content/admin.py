from django.contrib import admin

from apps.content.models import Announcement, FaqItem, GuideArticle, GuideCompetition, HomepageBanner
from apps.core.admin import AuditedAdminMixin


@admin.register(HomepageBanner)
class HomepageBannerAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["title", "link_type", "is_active", "sort_order", "start_at", "end_at"]
    list_filter = ["link_type", "is_active"]
    raw_id_fields = ["image_asset", "created_by", "updated_by"]


@admin.register(Announcement)
class AnnouncementAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["title", "publisher_scope", "publication_state", "is_pinned", "published_at"]
    list_filter = ["publisher_scope", "publication_state", "is_pinned"]
    search_fields = ["title", "summary"]
    raw_id_fields = ["competition", "activity", "organization", "recruitment", "created_by", "updated_by"]
    readonly_fields = ["publication_state", "published_at"]


@admin.register(GuideArticle)
class GuideArticleAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["title", "category", "publication_state", "is_featured", "published_at"]
    list_filter = ["category", "publication_state", "is_featured"]
    search_fields = ["title", "summary"]
    raw_id_fields = ["created_by", "updated_by"]
    readonly_fields = ["publication_state", "published_at"]


@admin.register(GuideCompetition)
class GuideCompetitionAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["guide", "competition", "sort_order"]
    raw_id_fields = ["guide", "competition"]


@admin.register(FaqItem)
class FaqItemAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["question", "category", "publication_state", "is_featured", "sort_order"]
    list_filter = ["category", "publication_state", "is_featured"]
    search_fields = ["question"]
    raw_id_fields = ["created_by", "updated_by"]
    readonly_fields = ["publication_state"]
