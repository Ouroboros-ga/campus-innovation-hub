"""撤销 Agent PAT。"""

from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import AgentCredential


class Command(BaseCommand):
    help = "撤销指定的 Agent 凭证（按 token_id）。"

    def add_arguments(self, parser):  # type: ignore[no-untyped-def]
        parser.add_argument("--token-id", required=True, help="要撤销的 token_id")

    def handle(self, *args, **options):  # type: ignore[no-untyped-def]
        token_id: str = options["token_id"]
        try:
            credential = AgentCredential.objects.get(token_id=token_id)
        except AgentCredential.DoesNotExist:
            raise CommandError(f"token_id {token_id} 不存在。")
        if not credential.is_active:
            self.stdout.write(f"token_id {token_id} 已处于停用状态。")
            return
        credential.is_active = False
        credential.save(update_fields=["is_active", "updated_at"])
        self.stdout.write(self.style.SUCCESS(f"已撤销 token_id {token_id}（{credential.name}）。"))
