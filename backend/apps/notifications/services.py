"""个人定向消息写入。"""

from apps.accounts.models import User
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
