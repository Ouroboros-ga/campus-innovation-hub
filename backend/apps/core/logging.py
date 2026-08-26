"""生产日志的最小脱敏层；不把请求 body 或领域敏感字段写入日志。"""

from __future__ import annotations

import logging
import re


_KEY_VALUE = re.compile(
    r"(?ix)(password|cookie|session|csrf|authorization|database_url|secret|access_key|student_no|contact_value)"
    r"\s*([=:])\s*([^\s,;]+)"
)
_DATABASE_URL = re.compile(r"(?i)(postgres(?:ql)?://)([^\s/@]+(?::[^\s/@]+)?@)")


def redact_log_text(value: str) -> str:
    value = _DATABASE_URL.sub(r"\1[REDACTED]@", value)
    return _KEY_VALUE.sub(lambda match: f"{match.group(1)}{match.group(2)}[REDACTED]", value)


class RedactingFormatter(logging.Formatter):
    """最后一道文本输出门禁；调用者仍不得主动记录敏感数据。"""

    def format(self, record: logging.LogRecord) -> str:
        return redact_log_text(super().format(record))
