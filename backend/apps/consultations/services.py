"""学生咨询的创建事务。"""

from collections.abc import Mapping

from django.db import transaction

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.competitions.models import Competition
from django.utils import timezone

from apps.consultations.models import Consultation, Reply
from apps.domain_errors import InvalidState, NotFound, PermissionDenied
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.permissions import is_operator


@transaction.atomic
def create_consultation(*, actor: User, payload: Mapping[str, object]) -> Consultation:
    """只接受公开可用的关联竞赛，正文不写入审计 JSON。"""

    values = dict(payload)
    competition_id = values.pop("competition_id", None)
    competition = None
    if competition_id is not None:
        competition = Competition.objects.filter(
            id=competition_id,
            publication_state=Competition.PublicationState.PUBLISHED,
        ).first()
        if competition is None:
            raise NotFound("竞赛不存在或当前不可用。")
    consultation = Consultation.objects.create(author=actor, competition=competition, **values)
    record_audit(
        actor=actor,
        action="CONSULTATION_CREATED",
        target=consultation,
        changes={"category": consultation.category, "visibility": consultation.visibility},
    )
    return consultation


@transaction.atomic
def reply_to_consultation(*, actor: User, consultation: Consultation, body_md: str) -> Reply:
    """运营回复在同一事务内更新咨询状态、定向通知和审计。"""

    if not is_operator(actor):
        raise PermissionDenied
    locked = Consultation.objects.select_for_update().select_related("author").get(pk=consultation.pk)
    if locked.status == Consultation.Status.CLOSED:
        raise InvalidState
    reply = Reply.objects.create(consultation=locked, author=actor, body_md=body_md)
    locked.status = Consultation.Status.ANSWERED
    locked.answered_at = timezone.now()
    locked.save(update_fields=["status", "answered_at", "updated_at"])
    create_notification(
        recipient=locked.author,
        notification_type=Notification.NotificationType.CONSULTATION,
        title="你的咨询收到回复",
        body=f"“{locked.title}”已有新的运营回复。",
        action_path=f"/consultations/{locked.id}",
        dedupe_key=f"consultation:{locked.id}:reply:{reply.id}",
    )
    record_audit(
        actor=actor,
        action="CONSULTATION_REPLIED",
        target=reply,
        changes={"consultation_id": str(locked.id), "status": Consultation.Status.ANSWERED},
    )
    return reply


def consultation_allowed_actions(*, actor: User, consultation: Consultation) -> list[str]:
    """运营任务页只把服务端判定后的当前动作用于 UX，不让前端推断状态机。"""

    if not is_operator(actor) or consultation.status == Consultation.Status.CLOSED:
        return []
    return ["REPLY", "CLOSE"]


@transaction.atomic
def close_consultation(*, actor: User, consultation: Consultation) -> Consultation:
    """关闭正式答疑记录；关闭后不允许继续追加回复。"""

    if not is_operator(actor):
        raise PermissionDenied
    locked = Consultation.objects.select_for_update().get(pk=consultation.pk)
    if locked.status == Consultation.Status.CLOSED:
        raise InvalidState
    previous_status = locked.status
    locked.status = Consultation.Status.CLOSED
    locked.save(update_fields=["status", "updated_at"])
    record_audit(
        actor=actor,
        action="CONSULTATION_CLOSED",
        target=locked,
        changes={"status": {"from": previous_status, "to": Consultation.Status.CLOSED}},
    )
    return locked
