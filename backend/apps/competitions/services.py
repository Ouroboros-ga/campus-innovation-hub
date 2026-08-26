"""竞赛状态转换 Service。"""

from django.db import transaction

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.competitions.models import Competition
from apps.domain_errors import InvalidState, PermissionDenied
from apps.permissions import is_operator


@transaction.atomic
def publish_competition(*, actor: User, competition: Competition) -> Competition:
    if not is_operator(actor):
        raise PermissionDenied
    locked_competition = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked_competition.publication_state != Competition.PublicationState.DRAFT:
        raise InvalidState
    locked_competition.publication_state = Competition.PublicationState.PUBLISHED
    locked_competition.updated_by = actor
    locked_competition.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="COMPETITION_PUBLISHED",
        target=locked_competition,
        changes={"publication_state": {"from": Competition.PublicationState.DRAFT, "to": Competition.PublicationState.PUBLISHED}},
    )
    return locked_competition
