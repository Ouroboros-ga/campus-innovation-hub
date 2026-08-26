from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User, UserProfile
from apps.accounts.services import activate_pending_user, set_platform_role, set_user_active


@admin.register(User)
class AccountsUserAdmin(UserAdmin):
    list_display = ["username", "student_no", "real_name", "platform_role", "is_active", "is_staff"]
    list_filter = ["is_active", "platform_role", "is_staff", "is_superuser"]
    actions = ["activate_pending_accounts", "deactivate_accounts", "grant_operator", "revoke_operator"]
    readonly_fields = ["is_active", "platform_role"]
    fieldsets = UserAdmin.fieldsets + (
        ("平台信息", {"fields": ("student_no", "real_name", "platform_role")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("平台信息", {"fields": ("student_no", "real_name", "platform_role")}),
    )

    @admin.action(description="启用待审核账号")
    def activate_pending_accounts(self, request, queryset):
        for user in queryset.filter(is_active=False):
            activate_pending_user(actor=request.user, user=user)

    @admin.action(description="停用所选账号")
    def deactivate_accounts(self, request, queryset):
        for user in queryset.filter(is_active=True):
            set_user_active(actor=request.user, user=user, is_active=False)

    @admin.action(description="授予平台运营角色")
    def grant_operator(self, request, queryset):
        for user in queryset:
            set_platform_role(actor=request.user, user=user, platform_role=User.PlatformRole.OPERATOR)

    @admin.action(description="撤销平台运营角色")
    def revoke_operator(self, request, queryset):
        for user in queryset:
            set_platform_role(actor=request.user, user=user, platform_role=User.PlatformRole.STUDENT)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "nickname", "major", "grade", "updated_at"]
    search_fields = ["user__username", "nickname", "major"]
    raw_id_fields = ["user", "avatar_asset"]
