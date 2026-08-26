"""不依赖 HTTP 的领域异常；未来 DRF 层按 code/status 映射统一错误响应。"""


class DomainError(Exception):
    code = "INVALID_STATE"
    status = 409
    default_message = "当前状态不允许此操作。"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.default_message)


class PermissionDenied(DomainError):
    code = "PERMISSION_DENIED"
    status = 403
    default_message = "无权限执行此操作。"


class NotFound(DomainError):
    code = "NOT_FOUND"
    status = 404
    default_message = "资源不存在或当前不可见。"


class DuplicateApplication(DomainError):
    code = "DUPLICATE_APPLICATION"
    status = 409
    default_message = "已存在有效申请。"


class AlreadyFollowed(DomainError):
    code = "ALREADY_FOLLOWED"
    status = 409
    default_message = "你已关注该竞赛。"


class CannotApplyOwn(DomainError):
    code = "CANNOT_APPLY_OWN"
    status = 422
    default_message = "不能申请自己的组队。"


class CapacityFull(DomainError):
    code = "CAPACITY_FULL"
    status = 422
    default_message = "容量已满。"


class TimeWindowClosed(DomainError):
    code = "TIME_WINDOW_CLOSED"
    status = 422
    default_message = "不在可报名或申请的时间窗内。"


class PublicationIncomplete(DomainError):
    """资源可保存为草稿，但尚未满足公开发布的业务完整性。"""

    code = "INVALID_STATE"
    status = 422
    default_message = "发布资料尚不完整。"


class InvalidState(DomainError):
    code = "INVALID_STATE"
    status = 409
    default_message = "当前状态不允许此操作。"


class SensitiveAuditData(DomainError):
    code = "VALIDATION_ERROR"
    status = 400
    default_message = "审计记录不能包含敏感信息。"
