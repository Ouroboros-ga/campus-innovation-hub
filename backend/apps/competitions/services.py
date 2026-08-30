"""竞赛发布状态与学生关注的事务边界。"""

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit

from apps.competitions.models import Competition, Follow, TimelineEvent
from apps.core.validation import validation_field_errors
from apps.domain_errors import AlreadyFollowed, InvalidState, NotFound, PermissionDenied, PublicationIncomplete
from apps.permissions import is_operator

EDITABLE_PUBLICATION_STATES = frozenset({Competition.PublicationState.DRAFT, Competition.PublicationState.PUBLISHED})


def _require_operator(actor: User) -> None:
    if not is_operator(actor):
        raise PermissionDenied


def _publish_competition_locked(*, actor: User, competition: Competition) -> Competition:
    """推进发布状态并写审计；调用方必须已持行锁且保证当前状态为 DRAFT。"""

    try:
        competition.full_clean()
    except DjangoValidationError as error:
        raise PublicationIncomplete(field_errors=validation_field_errors(error)) from error
    competition.publication_state = Competition.PublicationState.PUBLISHED
    competition.published_at = competition.published_at or timezone.now()
    competition.updated_by = actor
    competition.save(update_fields=["publication_state", "published_at", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="COMPETITION_PUBLISHED",
        target=competition,
        changes={"publication_state": {"from": Competition.PublicationState.DRAFT, "to": Competition.PublicationState.PUBLISHED}},
    )
    return competition


@transaction.atomic
def publish_competition(*, actor: User, competition: Competition) -> Competition:
    """保留 BE-005 的运营发布状态机与审计行为。"""

    if not is_operator(actor):
        raise PermissionDenied
    locked_competition = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked_competition.publication_state != Competition.PublicationState.DRAFT:
        raise InvalidState
    return _publish_competition_locked(actor=actor, competition=locked_competition)


@transaction.atomic
def create_competition(*, actor: User, payload: dict[str, Any], publish: bool = False) -> Competition:
    """创建与可选发布在同一事务内完成；发布校验失败整体回滚，不留半成品。"""

    _require_operator(actor)
    values = dict(payload)
    if "cover_asset_id" in values:
        values["cover_asset_id"] = values.pop("cover_asset_id")
    try:
        competition = Competition.objects.create(
            **values,
            publication_state=Competition.PublicationState.DRAFT,
            created_by=actor,
            updated_by=actor,
        )
    except IntegrityError as error:
        raise InvalidState("同一届次的竞赛名称不能重复。") from error
    record_audit(actor=actor, action="COMPETITION_CREATED", target=competition, changes={"publication_state": "DRAFT"})
    if publish:
        competition = _publish_competition_locked(actor=actor, competition=competition)
    return competition


def competition_allowed_actions(*, actor: User, competition: Competition) -> list[str]:
    """管理面可执行动作；是“当前用户 + 状态 + 数据约束”的结果，不是状态常量映射。"""

    if not is_operator(actor):
        return []
    state = competition.publication_state
    if state == Competition.PublicationState.DRAFT:
        return ["EDIT", "PUBLISH", "DELETE_DRAFT"]
    if state == Competition.PublicationState.PUBLISHED:
        return ["EDIT", "FEATURE", "CANCEL", "ARCHIVE"]
    if state == Competition.PublicationState.CANCELLED:
        return ["ARCHIVE"]
    return []


@transaction.atomic
def update_competition(*, actor: User, competition: Competition, payload: dict[str, Any]) -> Competition:
    _require_operator(actor)
    locked = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked.publication_state not in EDITABLE_PUBLICATION_STATES:
        raise InvalidState("仅草稿与已发布可直接编辑，已归档/已取消需重新创建。")
    values = dict(payload)
    if "cover_asset_id" in values:
        values["cover_asset_id"] = values.pop("cover_asset_id")
    changed_fields = sorted(values)
    for field, value in values.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    try:
        locked.full_clean()
        locked.save(update_fields=[*changed_fields, "updated_by", "updated_at"])
    except (DjangoValidationError, IntegrityError) as error:
        raise InvalidState("同一届次的竞赛名称不能重复。") from error
    record_audit(
        actor=actor,
        action="COMPETITION_UPDATED",
        target=locked,
        changes={
            "fields": changed_fields,
            "published_edit": locked.publication_state == Competition.PublicationState.PUBLISHED,
        },
    )
    return locked


@transaction.atomic
def cancel_competition(*, actor: User, competition: Competition) -> Competition:
    _require_operator(actor)
    locked = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked.publication_state != Competition.PublicationState.PUBLISHED:
        raise InvalidState
    locked.publication_state = Competition.PublicationState.CANCELLED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="COMPETITION_CANCELLED", target=locked, changes={"publication_state": "CANCELLED"})
    return locked


@transaction.atomic
def archive_competition(*, actor: User, competition: Competition) -> Competition:
    _require_operator(actor)
    locked = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked.publication_state not in {Competition.PublicationState.PUBLISHED, Competition.PublicationState.CANCELLED}:
        raise InvalidState
    locked.publication_state = Competition.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="COMPETITION_ARCHIVED", target=locked, changes={"publication_state": "ARCHIVED"})
    return locked


@transaction.atomic
def delete_competition(*, actor: User, competition: Competition) -> None:
    """仅草稿可物理删除，避免误删已发布历史。"""

    _require_operator(actor)
    locked = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked.publication_state != Competition.PublicationState.DRAFT:
        raise InvalidState("仅草稿可删除，已发布请归档。")
    record_audit(actor=actor, action="COMPETITION_DELETED", target=locked, changes={"name": locked.name})
    locked.delete()


@transaction.atomic
def set_competition_featured(*, actor: User, competition: Competition, payload: dict[str, Any]) -> Competition:
    _require_operator(actor)
    locked = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked.publication_state in {Competition.PublicationState.DRAFT, Competition.PublicationState.ARCHIVED}:
        raise InvalidState
    locked.is_featured = payload["is_featured"]
    if "featured_order" in payload:
        locked.featured_order = payload["featured_order"]
    locked.updated_by = actor
    locked.save(update_fields=["is_featured", "featured_order", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="COMPETITION_FEATURED_UPDATED",
        target=locked,
        changes={"is_featured": locked.is_featured, "featured_order": locked.featured_order},
    )
    return locked


@transaction.atomic
def create_timeline_event(*, actor: User, competition: Competition, payload: dict[str, Any]) -> TimelineEvent:
    _require_operator(actor)
    locked = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked.publication_state not in EDITABLE_PUBLICATION_STATES:
        raise InvalidState("仅草稿与已发布竞赛可修改时间线。")
    event = TimelineEvent.objects.create(competition=locked, **payload)
    record_audit(actor=actor, action="COMPETITION_TIMELINE_CREATED", target=event, changes={"competition_id": str(locked.id)})
    return event


@transaction.atomic
def update_timeline_event(*, actor: User, competition: Competition, event: TimelineEvent, payload: dict[str, Any]) -> TimelineEvent:
    _require_operator(actor)
    locked_competition = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked_competition.publication_state not in EDITABLE_PUBLICATION_STATES:
        raise InvalidState("仅草稿与已发布竞赛可修改时间线。")
    locked = TimelineEvent.objects.select_for_update().filter(pk=event.pk, competition_id=competition.id).first()
    if locked is None:
        raise NotFound("时间线节点不存在。")
    for field, value in payload.items():
        setattr(locked, field, value)
    locked.full_clean()
    locked.save(update_fields=[*payload.keys(), "updated_at"])
    record_audit(actor=actor, action="COMPETITION_TIMELINE_UPDATED", target=locked, changes={"fields": sorted(payload)})
    return locked


@transaction.atomic
def delete_timeline_event(*, actor: User, competition: Competition, event: TimelineEvent) -> None:
    _require_operator(actor)
    locked_competition = Competition.objects.select_for_update().get(pk=competition.pk)
    if locked_competition.publication_state not in EDITABLE_PUBLICATION_STATES:
        raise InvalidState("仅草稿与已发布竞赛可修改时间线。")
    locked = TimelineEvent.objects.select_for_update().filter(pk=event.pk, competition_id=competition.id).first()
    if locked is None:
        raise NotFound("时间线节点不存在。")
    record_audit(actor=actor, action="COMPETITION_TIMELINE_DELETED", target=locked, changes={"competition_id": str(competition.id)})
    locked.delete()


def follow_competition(*, actor: User, competition: Competition) -> None:
    """创建关注行，并把并发唯一冲突映射为冻结的领域错误。"""

    try:
        with transaction.atomic():
            Follow.objects.create(user=actor, competition=competition)
    except IntegrityError as error:
        raise AlreadyFollowed from error


@transaction.atomic
def unfollow_competition(*, actor: User, competition: Competition) -> None:
    """关注是纯关联数据，取消时物理删除该关联行。"""

    deleted, _details = Follow.objects.filter(user=actor, competition=competition).delete()
    if deleted == 0:
        raise NotFound("尚未关注该竞赛。")
