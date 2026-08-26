"""领域模型在 Admin 写入时共用的轻量规格校验。"""


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
