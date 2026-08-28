from django.contrib import admin

from apps.audit.services import record_audit
from apps.core.admin import AuditedAdminMixin, NoDeleteAdminMixin
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.organizations.services import (
    accept_recruitment_application,
    grant_organization_advisor,
    grant_organization_leader,
    reject_recruitment_application,
    set_membership_active,
    set_organization_active,
)


@admin.register(Organization)
class OrganizationAdmin(NoDeleteAdminMixin, admin.ModelAdmin):
    list_display = ["name", "organization_type", "qq_group_number", "allow_online_application", "is_active", "updated_at"]
    list_filter = ["organization_type", "allow_online_application", "is_active"]
    search_fields = ["name", "short_intro", "qq_group_number"]
    raw_id_fields = ["logo_asset", "banner_asset", "qq_group_qr_asset"]
    exclude = ["is_active", "created_by", "updated_by"]
    actions = ["activate_organizations", "deactivate_organizations"]

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        if not change and obj.created_by_id is None:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
        if not change:
            record_audit(actor=request.user, action="ORGANIZATION_CREATED", target=obj, changes={})
        elif form.changed_data:
            record_audit(
                actor=request.user,
                action="ORGANIZATION_UPDATED",
                target=obj,
                changes={"fields": sorted(form.changed_data)},
            )

    @admin.action(description="启用所选组织")
    def activate_organizations(self, request, queryset):
        for organization in queryset.filter(is_active=False):
            set_organization_active(actor=request.user, organization=organization, is_active=True)

    @admin.action(description="停用所选组织")
    def deactivate_organizations(self, request, queryset):
        for organization in queryset.filter(is_active=True):
            set_organization_active(actor=request.user, organization=organization, is_active=False)


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["organization", "user", "role", "title", "is_active", "joined_at"]
    list_filter = ["role", "is_active"]
    search_fields = ["organization__name", "user__username", "user__employee_no", "title"]
    raw_id_fields = ["organization", "user"]
    readonly_fields = ["role", "is_active", "joined_at", "left_at"]
    actions = [
        "grant_leader",
        "revoke_leader",
        "grant_advisor",
        "revoke_advisor",
        "activate_memberships",
        "deactivate_memberships",
    ]

    @admin.action(description="授予组织负责人")
    def grant_leader(self, request, queryset):
        for membership in queryset:
            grant_organization_leader(actor=request.user, membership=membership, grant=True)

    @admin.action(description="撤销组织负责人")
    def revoke_leader(self, request, queryset):
        for membership in queryset:
            grant_organization_leader(actor=request.user, membership=membership, grant=False)

    @admin.action(description="授予指导老师（需教师账号）")
    def grant_advisor(self, request, queryset):
        for membership in queryset:
            grant_organization_advisor(actor=request.user, membership=membership, grant=True)

    @admin.action(description="撤销指导老师")
    def revoke_advisor(self, request, queryset):
        for membership in queryset:
            grant_organization_advisor(actor=request.user, membership=membership, grant=False)

    @admin.action(description="恢复所选成员关系")
    def activate_memberships(self, request, queryset):
        for membership in queryset.filter(is_active=False):
            set_membership_active(actor=request.user, membership=membership, is_active=True)

    @admin.action(description="结束所选成员关系")
    def deactivate_memberships(self, request, queryset):
        for membership in queryset.filter(is_active=True):
            set_membership_active(actor=request.user, membership=membership, is_active=False)


@admin.register(Recruitment)
class RecruitmentAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["title", "organization", "publication_state", "qq_group_number", "enable_online_application", "apply_end_at", "completed_at"]
    list_filter = ["publication_state", "enable_online_application"]
    search_fields = ["title", "organization__name", "qq_group_number"]
    raw_id_fields = ["organization", "qq_group_qr_asset", "created_by", "updated_by"]
    readonly_fields = ["publication_state", "completed_at"]


@admin.register(RecruitmentPosition)
class RecruitmentPositionAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["name", "recruitment", "headcount", "sort_order"]
    raw_id_fields = ["recruitment"]


@admin.register(RecruitmentApplication)
class RecruitmentApplicationAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["recruitment", "position", "applicant", "status", "processed_at"]
    list_filter = ["status"]
    search_fields = ["recruitment__title", "applicant__username"]
    raw_id_fields = ["recruitment", "position", "applicant", "processed_by"]
    readonly_fields = ["status", "processed_by", "processed_at"]
    exclude = ["self_intro", "skills", "experience", "motivation"]
    actions = ["accept_applications", "reject_applications"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="接受所选招新申请")
    def accept_applications(self, request, queryset):
        for application in queryset.filter(status=RecruitmentApplication.Status.PENDING):
            accept_recruitment_application(actor=request.user, application=application)

    @admin.action(description="拒绝所选招新申请")
    def reject_applications(self, request, queryset):
        for application in queryset.filter(status=RecruitmentApplication.Status.PENDING):
            reject_recruitment_application(actor=request.user, application=application)
