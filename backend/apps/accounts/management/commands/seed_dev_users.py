"""开发用 seed：创建超管与平台运营账号（幂等，仅用于本地/联调联调）。"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User

# 固定开发凭据（仅用于本地联调；生产不依赖本命令）。
SUPERADMIN_USERNAME = "superadmin"
SUPERADMIN_PASSWORD = "Admin@2026Hub"
OPERATOR_USERNAME = "operator"
OPERATOR_PASSWORD = "Operator@2026Hub"


class Command(BaseCommand):
    help = "创建开发用超管（is_superuser）与平台运营（platform_role=OPERATOR）账号，已存在则重置密码/角色。"

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        user_model = get_user_model()

        # 超管：is_superuser + is_staff（Admin 唯一来源）
        superadmin = user_model.objects.filter(username=SUPERADMIN_USERNAME).first()
        if superadmin is None:
            superadmin = user_model.objects.create_superuser(
                username=SUPERADMIN_USERNAME,
                real_name="超级管理员",
                password=SUPERADMIN_PASSWORD,
            )
            self.stdout.write(f"已创建超管 {SUPERADMIN_USERNAME}")
        else:
            superadmin.is_superuser = True
            superadmin.is_staff = True
            superadmin.is_active = True
            superadmin.set_password(SUPERADMIN_PASSWORD)
            superadmin.save(update_fields=["is_superuser", "is_staff", "is_active", "password", "updated_at"])
            self.stdout.write(f"超管 {SUPERADMIN_USERNAME} 已存在，已重置密码并确保管理员位")

        # 运营：platform_role=OPERATOR，可访问运营 API（非 /admin）
        operator = user_model.objects.filter(username=OPERATOR_USERNAME).first()
        if operator is None:
            operator = user_model.objects.create_user(
                username=OPERATOR_USERNAME,
                real_name="平台运营",
                password=OPERATOR_PASSWORD,
                is_active=True,
            )
            self.stdout.write(f"已创建运营 {OPERATOR_USERNAME}")
        else:
            operator.is_active = True
            operator.set_password(OPERATOR_PASSWORD)
            operator.save(update_fields=["is_active", "password", "updated_at"])
        operator.platform_role = User.PlatformRole.OPERATOR
        operator.save(update_fields=["platform_role", "updated_at"])

        self.stdout.write(self.style.SUCCESS("开发账号已就绪："))
        self.stdout.write(f"  超管  用户名 {SUPERADMIN_USERNAME}  密码 {SUPERADMIN_PASSWORD}")
        self.stdout.write(f"  运营  用户名 {OPERATOR_USERNAME}  密码 {OPERATOR_PASSWORD}")
