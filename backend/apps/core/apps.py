from django.apps import AppConfig
from django.contrib import admin


def superadmin_admin_permission(request) -> bool:
    """Django Admin 仅作为 SUPERADMIN 的受信任内部工具。"""

    user = request.user
    return bool(user.is_authenticated and user.is_active and user.is_staff and user.is_superuser)


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"

    def ready(self) -> None:
        # 统一替换默认的 ``is_staff`` 判定，避免普通 staff 获得任一
        # ModelAdmin 的入口。OPERATOR 的业务工作台会在后续 API 中按角色授权。
        admin.site.has_permission = superadmin_admin_permission
