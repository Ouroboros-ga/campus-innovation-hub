from django.contrib import admin

from apps.teams.models import TeamApplication, TeamPost, TeamRole


@admin.register(TeamPost)
class TeamPostAdmin(admin.ModelAdmin):
    list_display = ["title", "competition", "author", "post_type", "status", "created_at"]
    list_filter = ["post_type", "status"]
    search_fields = ["title", "direction", "competition__name"]
    raw_id_fields = ["competition", "author"]
    readonly_fields = ["status", "closed_at"]
    exclude = ["contact_value"]


@admin.register(TeamRole)
class TeamRoleAdmin(admin.ModelAdmin):
    list_display = ["name", "team_post", "headcount", "sort_order"]
    raw_id_fields = ["team_post"]


@admin.register(TeamApplication)
class TeamApplicationAdmin(admin.ModelAdmin):
    list_display = ["team_post", "desired_role", "applicant", "status", "processed_at"]
    list_filter = ["status"]
    raw_id_fields = ["team_post", "desired_role", "applicant"]
    readonly_fields = ["status", "processed_at"]
    exclude = ["self_intro", "skills", "experience", "motivation", "contact_value"]
