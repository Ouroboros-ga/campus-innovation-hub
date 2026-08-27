from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User, UserProfile
from apps.accounts.services import anonymize_deactivated_user, activate_pending_user, set_platform_role, set_user_active
from apps.core.admin import AuditedAdminMixin


@admin.register(User)
class AccountsUserAdmin(AuditedAdminMixin, UserAdmin):
    list_display = ["username", "identity_type", "student_no", "employee_no", "real_name", "platform_role", "is_active", "is_staff"]
    list_filter = ["is_active", "identity_type", "platform_role", "is_staff", "is_superuser"]
    actions = [
        "activate_pending_accounts",
        "deactivate_accounts",
        "anonymize_deactivated_accounts",
        "grant_operator",
        "revoke_operator",
    ]
    readonly_fields = ["is_active", "platform_role", "is_staff", "is_superuser", "identity_type", "student_no", "employee_no"]
    fieldsets = UserAdmin.fieldsets + (
        ("平台信息", {"fields": ("identity_type", "student_no", "employee_no", "real_name", "platform_role")}),
    )
    add_fieldsets = (
        (
            "账号信息",
            {"fields": ("username", "password1", "password2", "identity_type", "student_no", "employee_no", "real_name")},
        ),
        ("平台信息", {"fields": ("platform_role", "is_active")}),
    )

    def has_add_permission(self, request):
        # 正式账号只经待审核注册创建；初始超级管理员使用 createsuperuser。
        return False

    @admin.action(description="启用待审核账号")
    def activate_pending_accounts(self, request, queryset):
        for user in queryset.filter(is_active=False):
            activate_pending_user(actor=request.user, user=user)

    @admin.action(description="停用所选账号")
    def deactivate_accounts(self, request, queryset):
        for user in queryset.filter(is_active=True):
            set_user_active(actor=request.user, user=user, is_active=False)

    @admin.action(description="匿名化已停用且已确认注销的账号")
    def anonymize_deactivated_accounts(self, request, queryset):
        for user in queryset.filter(is_active=False, is_superuser=False):
            anonymize_deactivated_user(actor=request.user, user=user)

    @admin.action(description="授予平台运营角色")
    def grant_operator(self, request, queryset):
        for user in queryset:
            set_platform_role(actor=request.user, user=user, platform_role=User.PlatformRole.OPERATOR)

    @admin.action(description="撤销平台运营角色")
    def revoke_operator(self, request, queryset):
        for user in queryset:
            set_platform_role(actor=request.user, user=user, platform_role=User.PlatformRole.USER)


@admin.register(UserProfile)
class UserProfileAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ["user", "nickname", "public_name", "major", "grade", "department", "academic_title", "updated_at"]
    search_fields = ["user__username", "nickname", "public_name", "major", "department"]
    raw_id_fields = ["user"]
    readonly_fields = ["avatar_asset"]

    def has_add_permission(self, request):
        return False
