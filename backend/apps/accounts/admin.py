from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class AccountsUserAdmin(UserAdmin):
    list_display = ["username", "student_no", "real_name", "platform_role", "is_active", "is_staff"]
    list_filter = ["is_active", "platform_role", "is_staff", "is_superuser"]
    actions = ["activate_pending_accounts"]
    fieldsets = UserAdmin.fieldsets + (
        ("平台信息", {"fields": ("student_no", "real_name", "platform_role")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("平台信息", {"fields": ("student_no", "real_name", "platform_role")}),
    )

    @admin.action(description="启用待审核账号")
    def activate_pending_accounts(self, request, queryset):
        queryset.filter(is_active=False).update(is_active=True)
