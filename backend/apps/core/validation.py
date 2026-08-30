"""领域模型在 Admin 写入时共用的轻量规格校验。"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError

NON_FIELD_ERRORS = "non_field_errors"


def validation_field_errors(error: DjangoValidationError) -> dict[str, list[str]]:
    """把模型 full_clean 的 ValidationError 压成契约约定的 fieldErrors 形状。

    `__all__` 与 `non_field_errors` 合并到 `non_field_errors`，便于前端把缺失项
    直接映射到表单字段上，而不是只看到一句 422 文案。
    """

    raw: Mapping[str, Any]
    if hasattr(error, "error_dict"):
        raw = {str(field): list(messages) for field, messages in error.message_dict.items()}
    else:
        raw = {NON_FIELD_ERRORS: list(error.messages)}
    field_errors: dict[str, list[str]] = {}
    for field, messages in raw.items():
        key = NON_FIELD_ERRORS if field in {"__all__", NON_FIELD_ERRORS} else field
        field_errors.setdefault(key, []).extend(str(message) for message in messages)
    return field_errors


def add_min_length_error(
    errors: dict[str, str],
    *,
    field: str,
    value: str | None,
    minimum: int,
    label: str,
) -> None:
    """忽略首尾空白后，保证字段满足冻结契约的最小字符数。"""

    if len((value or "").strip()) < minimum:
        errors[field] = f"{label}至少 {minimum} 个字符。"
