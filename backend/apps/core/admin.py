"""Django Admin 共用安全边界。"""

from apps.audit.services import record_audit


class NoDeleteAdminMixin:
    """历史业务通过状态流转结束，Admin 不提供物理删除逃生通道。"""

    def has_delete_permission(self, request, obj=None):
        return False


class AuditedAdminMixin(NoDeleteAdminMixin):
    """为受限的内部表单写入保留不含业务敏感值的审计线索。"""

    def save_model(self, request, obj, form, change) -> None:
        super().save_model(request, obj, form, change)
        record_audit(
            actor=request.user,
            action="ADMIN_MODEL_UPDATED" if change else "ADMIN_MODEL_CREATED",
            target=obj,
            # 仅记录模型和发生变化的字段名，不把联系方式、正文或密码写入审计。
            changes={"model": obj._meta.label, "fields": sorted(form.changed_data) if change else []},
        )
