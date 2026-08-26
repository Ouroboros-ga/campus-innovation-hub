"""清理超出最短必要保留期的认证节流记录。"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from apps.accounts.models import AuthThrottle


class Command(BaseCommand):
    help = "删除超过 30 天且已不在阻断期的认证节流记录。"

    def handle(self, *args: object, **options: object) -> None:
        cutoff = timezone.now() - timedelta(days=30)
        deleted, _ = AuthThrottle.objects.filter(updated_at__lt=cutoff).filter(
            Q(blocked_until__isnull=True) | Q(blocked_until__lt=cutoff)
        ).delete()
        self.stdout.write(self.style.SUCCESS(f"已删除 {deleted} 条过期认证节流记录。"))
