"""创建 campus-auto-ops Agent PAT，仅展示一次明文。"""

from __future__ import annotations

import hashlib
import secrets
import string
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.accounts.models import AgentCredential, User


def _random_token_id(length: int = 12) -> str:
    alphabet = string.ascii_uppercase + string.ascii_letters + string.digits
    # 首位字母避免纯数字混淆
    first = secrets.choice(string.ascii_uppercase + string.ascii_letters)
    rest = "".join(secrets.choice(alphabet) for _ in range(length - 1))
    return first + rest


class Command(BaseCommand):
    help = "为指定运营用户创建 Agent PAT（campus_ops_pat_<token_id>.<secret>），明文仅展示一次。"

    def add_arguments(self, parser):  # type: ignore[no-untyped-def]
        parser.add_argument("--user", required=True, help="绑定的用户名（必须为 OPERATOR 或 SUPERADMIN）")
        parser.add_argument("--name", required=True, help="凭证名称，便于 Admin 识别")
        parser.add_argument("--scopes", default="homepage:read,homepage:write,banner:read,banner:write,content:read", help="逗号分隔的 scopes")
        parser.add_argument("--expires-days", type=int, default=90, help="有效天数，0 表示永不过期")
        parser.add_argument("--cidrs", default="", help="可选 CIDR 白名单，逗号分隔，空表示不限 IP")

    def handle(self, *args, **options):  # type: ignore[no-untyped-def]
        username: str = options["user"]
        name: str = options["name"]
        scopes_raw: str = options["scopes"]
        expires_days: int = options["expires_days"]
        cidrs_raw: str = options["cidrs"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"用户 {username} 不存在。")

        if not (user.is_superuser or user.platform_role == User.PlatformRole.OPERATOR):
            raise CommandError("绑定的用户必须为 OPERATOR 或 SUPERADMIN。")
        if not user.is_active:
            raise CommandError("绑定的用户已停用。")

        scopes = [s.strip() for s in scopes_raw.split(",") if s.strip()]
        if not scopes:
            raise CommandError("至少需要一个 scope。")
        invalid = [s for s in scopes if s not in AgentCredential.VALID_SCOPES]
        if invalid:
            raise CommandError(f"非法 scopes: {invalid}，允许 {sorted(AgentCredential.VALID_SCOPES)}")

        allowed_cidrs: list[str] = []
        if cidrs_raw.strip():
            import ipaddress

            for cidr in [c.strip() for c in cidrs_raw.split(",") if c.strip()]:
                try:
                    ipaddress.ip_network(cidr, strict=False)
                except ValueError:
                    raise CommandError(f"非法 CIDR: {cidr}")
                allowed_cidrs.append(cidr)

        # 生成唯一 token_id
        for _ in range(5):
            token_id = _random_token_id(12)
            if not AgentCredential.objects.filter(token_id=token_id).exists():
                break
        else:
            raise CommandError("生成 token_id 失败，请重试。")

        secret = secrets.token_urlsafe(32)
        secret_hash = hashlib.sha256(secret.encode()).hexdigest()
        token = f"campus_ops_pat_{token_id}.{secret}"

        expires_at = None
        if expires_days > 0:
            expires_at = timezone.now() + timedelta(days=expires_days)

        credential = AgentCredential(
            name=name,
            token_id=token_id,
            secret_hash=secret_hash,
            user=user,
            scopes=scopes,
            allowed_cidrs=allowed_cidrs,
            is_active=True,
            expires_at=expires_at,
            created_by=user,
        )
        credential.full_clean()
        credential.save()

        self.stdout.write(self.style.SUCCESS("Agent 令牌已创建（明文仅展示一次，请妥善保存）："))
        self.stdout.write(token)
        self.stdout.write(f"token_id: {token_id}")
        self.stdout.write(f"scopes: {scopes}")
        if allowed_cidrs:
            self.stdout.write(f"allowed_cidrs: {allowed_cidrs}")
        if expires_at:
            self.stdout.write(f"expires_at: {expires_at.isoformat()}")
        self.stdout.write(self.style.WARNING("该明文不会再次展示，DB 仅存 secret_hash。"))
