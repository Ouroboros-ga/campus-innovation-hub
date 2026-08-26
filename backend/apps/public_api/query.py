"""公共读取端点共用的严格参数与分页规则。"""

from __future__ import annotations

import math
import uuid
from collections.abc import Callable, Iterable, Sequence
from typing import Any, TypeVar

from django.db.models import Q, QuerySet
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response


T = TypeVar("T")


def validate_query_keys(request: Request, allowed: set[str]) -> None:
    unexpected = sorted(set(request.query_params) - allowed)
    if unexpected:
        raise ValidationError({"query": [f"不支持查询参数：{', '.join(unexpected)}"]})


def parse_uuid(value: str, *, field: str = "id") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (AttributeError, TypeError, ValueError) as error:
        raise ValidationError({field: ["必须是 UUID。"]}) from error


def parse_optional_enum(request: Request, name: str, allowed: Iterable[str]) -> str | None:
    value = request.query_params.get(name)
    if value is None:
        return None
    allowed_values = set(allowed)
    if value not in allowed_values:
        raise ValidationError({name: ["筛选值不合法。"]})
    return value


def parse_optional_bool(request: Request, name: str) -> bool | None:
    value = request.query_params.get(name)
    if value is None:
        return None
    if value == "true":
        return True
    if value == "false":
        return False
    raise ValidationError({name: ["必须是 true 或 false。"]})


def parse_optional_uuid(request: Request, name: str) -> uuid.UUID | None:
    value = request.query_params.get(name)
    return parse_uuid(value, field=name) if value is not None else None


def parse_optional_text(request: Request, name: str, *, max_length: int = 100, required: bool = False) -> str | None:
    value = request.query_params.get(name)
    if value is None:
        if required:
            raise ValidationError({name: ["不能为空。"]})
        return None
    value = value.strip()
    if not value:
        raise ValidationError({name: ["不能为空。"]})
    if len(value) > max_length:
        raise ValidationError({name: [f"不能超过 {max_length} 个字符。"]})
    return value


def parse_ordering(request: Request, allowed: set[str]) -> str | None:
    value = request.query_params.get("ordering")
    if value is None:
        return None
    if value not in allowed:
        raise ValidationError({"ordering": ["排序字段不合法。"]})
    return value


def filter_text(queryset: QuerySet[T], value: str | None, fields: Sequence[str]) -> QuerySet[T]:
    if not value:
        return queryset
    condition = Q()
    for field in fields:
        condition |= Q(**{f"{field}__icontains": value})
    return queryset.filter(condition)


def _parse_positive_int(request: Request, name: str, default: int, maximum: int | None = None) -> int:
    raw_value = request.query_params.get(name)
    if raw_value is None:
        return default
    try:
        value = int(raw_value)
    except (TypeError, ValueError) as error:
        raise ValidationError({name: ["必须是正整数。"]}) from error
    if value < 1 or (maximum is not None and value > maximum):
        message = f"必须在 1 到 {maximum} 之间。" if maximum else "必须是正整数。"
        raise ValidationError({name: [message]})
    return value


def pagination_params(request: Request, *, default_page_size: int = 20) -> tuple[int, int]:
    return _parse_positive_int(request, "page", 1), _parse_positive_int(
        request, "page_size", default_page_size, maximum=100
    )


def page_url(request: Request, page: int) -> str:
    parameters = request.query_params.copy()
    parameters["page"] = str(page)
    return f"{request.path}?{parameters.urlencode()}"


def paginated_response(
    request: Request,
    items: QuerySet[T] | Sequence[T],
    serializer: Callable[[T], dict[str, Any]],
    *,
    default_page_size: int = 20,
) -> Response:
    page, page_size = pagination_params(request, default_page_size=default_page_size)
    count = items.count() if isinstance(items, QuerySet) else len(items)
    pages = math.ceil(count / page_size) if count else 0
    start = (page - 1) * page_size
    result_items = items[start : start + page_size]
    return Response(
        {
            "count": count,
            "next": page_url(request, page + 1) if page < pages else None,
            "previous": page_url(request, page - 1) if page > 1 and count else None,
            "results": [serializer(item) for item in result_items],
        }
    )
