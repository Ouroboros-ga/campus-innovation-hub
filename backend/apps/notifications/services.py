"""个人定向消息写入。"""

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.models import Notification


def create_notification(
    *,
    recipient: User,
    notification_type: str,
    title: str,
    body: str | None = None,
    action_path: str | None = None,
    dedupe_key: str | None = None,
) -> Notification:
    """带 dedupe_key 的通知复用同一行；无 key 的消息完整保留。"""

    if dedupe_key is None:
        return Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            body=body,
            action_path=action_path,
        )
    notification, _created = Notification.objects.get_or_create(
        recipient=recipient,
        dedupe_key=dedupe_key,
        defaults={
            "notification_type": notification_type,
            "title": title,
            "body": body,
            "action_path": action_path,
        },
    )
    return notification


@transaction.atomic
def mark_notification_read(*, actor: User, notification: Notification) -> None:
    """只更新当前收件人的单条消息；重复调用保持幂等。"""

    from apps.domain_errors import NotFound

    locked = Notification.objects.select_for_update().filter(pk=notification.pk, recipient=actor).first()
    if locked is None:
        raise NotFound("消息不存在。")
    if locked.read_at is None:
        locked.read_at = timezone.now()
        locked.save(update_fields=["read_at"])


@transaction.atomic
def mark_all_notifications_read(*, actor: User) -> None:
    """批量更新仍限定 recipient，绝不影响其他用户的未读状态。"""

    Notification.objects.filter(recipient=actor, read_at__isnull=True).update(read_at=timezone.now())
