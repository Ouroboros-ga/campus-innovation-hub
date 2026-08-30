"""HTTP error responses shared by current and future /api endpoints."""

from collections.abc import Mapping
from typing import Any

from django.http import HttpRequest, JsonResponse
from django.views.defaults import bad_request, page_not_found, server_error
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.domain_errors import DomainError


def _is_api_request(request: HttpRequest) -> bool:
    return request.path.startswith("/api/")


def _api_error(
    *,
    code: str,
    message: str,
    status: int,
    field_errors: Mapping[str, list[str]] | None = None,
) -> JsonResponse:
    payload: dict[str, Any] = {"code": code, "message": message}
    if field_errors:
        payload["fieldErrors"] = field_errors
    return JsonResponse(payload, status=status, json_dumps_params={"ensure_ascii": False})


def api_bad_request(request: HttpRequest, exception: Exception | None = None) -> JsonResponse:
    if _is_api_request(request):
        return _api_error(code="VALIDATION_ERROR", message="请求参数不合法", status=400)
    return bad_request(request, exception)


def api_permission_denied(request: HttpRequest, exception: Exception | None = None) -> JsonResponse:
    if _is_api_request(request):
        return _api_error(code="PERMISSION_DENIED", message="没有权限执行该操作", status=403)
    return _api_error(code="PERMISSION_DENIED", message="没有权限执行该操作", status=403)


def api_not_found(request: HttpRequest, exception: Exception | None = None) -> JsonResponse:
    if _is_api_request(request):
        return _api_error(code="NOT_FOUND", message="请求的接口不存在", status=404)
    return page_not_found(request, exception)


def api_server_error(request: HttpRequest) -> JsonResponse:
    if _is_api_request(request):
        return _api_error(code="INTERNAL_ERROR", message="服务器暂时无法处理请求", status=500)
    return server_error(request)


def csrf_failure(request: HttpRequest, reason: str = "") -> JsonResponse:
    if _is_api_request(request):
        return _api_error(code="PERMISSION_DENIED", message="CSRF 校验失败，请刷新页面后重试", status=403)
    return _api_error(code="PERMISSION_DENIED", message="CSRF 校验失败，请刷新页面后重试", status=403)


def _field_errors(data: Any) -> Mapping[str, list[str]] | None:
    if not isinstance(data, Mapping):
        return None

    values: dict[str, list[str]] = {}
    for field, messages in data.items():
        if field == "detail":
            continue
        if isinstance(messages, list):
            values[str(field)] = [str(message) for message in messages]
        else:
            values[str(field)] = [str(messages)]
    return values or None


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, DomainError):
        headers = None
        if exc.code == "RATE_LIMITED":
            headers = {"Retry-After": str(getattr(exc, "retry_after_seconds", 1))}
        payload: dict[str, Any] = {"code": exc.code, "message": str(exc)}
        field_errors = getattr(exc, "field_errors", None)
        if field_errors:
            payload["fieldErrors"] = {str(field): [str(item) for item in messages] for field, messages in field_errors.items()}
        return Response(payload, status=exc.status, headers=headers)

    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, exceptions.ValidationError):
        code, message = "VALIDATION_ERROR", "请求参数不合法"
    elif isinstance(exc, exceptions.NotAuthenticated | exceptions.AuthenticationFailed):
        code, message = "AUTH_REQUIRED", "需要登录"
    elif isinstance(exc, exceptions.PermissionDenied):
        code, message = "PERMISSION_DENIED", "没有权限执行该操作"
    elif isinstance(exc, exceptions.NotFound):
        code, message = "NOT_FOUND", "请求的接口不存在"
    elif isinstance(exc, exceptions.MethodNotAllowed):
        code, message = "METHOD_NOT_ALLOWED", "不支持该请求方法"
    else:
        code, message = "VALIDATION_ERROR", "请求参数不合法"

    payload: dict[str, Any] = {"code": code, "message": message}
    field_errors = _field_errors(response.data)
    if field_errors:
        payload["fieldErrors"] = field_errors
    response.data = payload
    return response
