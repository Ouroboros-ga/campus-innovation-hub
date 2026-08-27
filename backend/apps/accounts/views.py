import json
from functools import wraps
from typing import Callable

from django.contrib.auth import authenticate, login, logout
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from apps.accounts.models import User
from apps.accounts.serializers import LoginSerializer, RegisterSerializer, current_user_payload
from apps.accounts.services import AccountAlreadyExists, register_pending_user
from apps.accounts.throttling import (
    clear_login_throttle,
    enforce_auth_throttles,
    normalise_client_ip,
    record_auth_failure,
    record_registration_attempt,
)
from apps.domain_errors import RateLimitExceeded


def api_error(
    *,
    code: str,
    message: str,
    status: int,
    field_errors: dict[str, list[str]] | None = None,
    retry_after_seconds: int | None = None,
) -> JsonResponse:
    payload: dict[str, object] = {"code": code, "message": message}
    if field_errors:
        payload["fieldErrors"] = field_errors
    response = JsonResponse(payload, status=status, json_dumps_params={"ensure_ascii": False})
    if retry_after_seconds is not None:
        response["Retry-After"] = str(max(1, retry_after_seconds))
    return response


def client_ip(request: HttpRequest) -> str:
    """仅在 Nginx 的 loopback upstream 链路内信任其写入的 X-Real-IP。"""

    peer = request.META.get("REMOTE_ADDR", "")
    if peer in {"127.0.0.1", "::1"}:
        forwarded = request.META.get("HTTP_X_REAL_IP", "")
        if forwarded:
            return normalise_client_ip(forwarded)
    return normalise_client_ip(peer)


def rate_limited(error: RateLimitExceeded) -> JsonResponse:
    return api_error(
        code=error.code,
        message=str(error),
        status=error.status,
        retry_after_seconds=error.retry_after_seconds,
    )


def json_payload(request: HttpRequest) -> dict[str, object] | None:
    try:
        data = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def validation_error(errors: dict[str, object]) -> JsonResponse:
    field_errors = {key: [str(message) for message in messages] for key, messages in errors.items()}
    return api_error(
        code="VALIDATION_ERROR",
        message="请求参数不合法",
        status=400,
        field_errors=field_errors,
    )


def api_login_required(view: Callable[..., HttpResponse]) -> Callable[..., HttpResponse]:
    @wraps(view)
    def wrapped(request: HttpRequest, *args: object, **kwargs: object) -> HttpResponse:
        if not request.user.is_authenticated:
            return api_error(code="AUTH_REQUIRED", message="需要登录", status=401)
        return view(request, *args, **kwargs)

    return wrapped


@require_GET
@ensure_csrf_cookie
def csrf(request: HttpRequest) -> HttpResponse:
    return HttpResponse(status=204)


@require_POST
@csrf_protect
def register(request: HttpRequest) -> JsonResponse:
    origin_ip = client_ip(request)
    try:
        enforce_auth_throttles(client_ip=origin_ip, username=None, scope="REGISTER")
    except RateLimitExceeded as error:
        return rate_limited(error)
    payload = json_payload(request)
    serializer = RegisterSerializer(data=payload)
    if not serializer.is_valid():
        return validation_error(serializer.errors)

    try:
        register_pending_user(**serializer.validated_data)
    except AccountAlreadyExists:
        record_registration_attempt(client_ip=origin_ip)
        return api_error(
            code="ACCOUNT_EXISTS",
            message="该学号已注册，请联系管理员。",
            status=409,
        )
    record_registration_attempt(client_ip=origin_ip)
    return JsonResponse(
        {"status": "pending_approval", "message": "注册已提交，请等待管理员审核。"},
        status=201,
        json_dumps_params={"ensure_ascii": False},
    )


@require_POST
@csrf_protect
def sign_in(request: HttpRequest) -> JsonResponse:
    payload = json_payload(request)
    serializer = LoginSerializer(data=payload)
    if not serializer.is_valid():
        return validation_error(serializer.errors)

    raw_username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]
    origin_ip = client_ip(request)
    try:
        enforce_auth_throttles(client_ip=origin_ip, username=raw_username, scope="LOGIN")
    except RateLimitExceeded as error:
        return rate_limited(error)
    # 支持学号/工号/username 登录（identity_type 分区后 username 仍为真实登录名）
    from django.db.models import Q

    resolved_username = raw_username
    matched = (
        User.objects.filter(Q(username=raw_username) | Q(student_no=raw_username) | Q(employee_no=raw_username))
        .values_list("username", flat=True)
        .first()
    )
    if matched:
        resolved_username = str(matched)
        # 节流仍以归一化后的真实 username 为 key，避免学号/工号绕过限制
        candidate = User.objects.filter(username=resolved_username).first()
    else:
        candidate = User.objects.filter(username=raw_username).first()
    if candidate and candidate.check_password(password) and not candidate.is_active:
        return api_error(
            code="ACCOUNT_UNAVAILABLE",
            message="账号尚未启用，请联系管理员。",
            status=403,
        )

    user = authenticate(request, username=resolved_username, password=password)
    if user is None:
        record_auth_failure(client_ip=origin_ip, username=raw_username)
        return api_error(code="AUTH_REQUIRED", message="用户名或密码错误", status=401)

    login(request, user)
    clear_login_throttle(client_ip=origin_ip, username=raw_username)
    return JsonResponse(current_user_payload(user), json_dumps_params={"ensure_ascii": False})


@require_POST
@api_login_required
@csrf_protect
def sign_out(request: HttpRequest) -> HttpResponse:
    logout(request)
    return HttpResponse(status=204)


@require_GET
@api_login_required
def me(request: HttpRequest) -> JsonResponse:
    return JsonResponse(current_user_payload(request.user), json_dumps_params={"ensure_ascii": False})
