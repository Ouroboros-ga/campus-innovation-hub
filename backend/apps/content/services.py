"""公告、指南、FAQ 与 Banner 的运营事务 Service。"""

from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.competitions.models import Competition
from apps.content.models import Announcement, FaqItem, GuideArticle, GuideCompetition, HomepageBanner
from apps.domain_errors import InvalidState, NotFound, PermissionDenied
from apps.permissions import is_operator


def _require_operator(actor: User) -> None:
    if not is_operator(actor):
        raise PermissionDenied


def _announcement_values(payload: dict[str, Any]) -> dict[str, Any]:
    values = dict(payload)
    for key in ("competition_id", "activity_id", "organization_id", "recruitment_id"):
        if key in values:
            values[key] = values.pop(key)
    return values


@transaction.atomic
def create_announcement(*, actor: User, payload: dict[str, Any]) -> Announcement:
    _require_operator(actor)
    announcement = Announcement.objects.create(
        **_announcement_values(payload),
        publication_state=Announcement.PublicationState.DRAFT,
        created_by=actor,
        updated_by=actor,
    )
    announcement.full_clean()
    record_audit(actor=actor, action="ANNOUNCEMENT_CREATED", target=announcement, changes={"publication_state": "DRAFT"})
    return announcement


@transaction.atomic
def update_announcement(*, actor: User, announcement: Announcement, payload: dict[str, Any]) -> Announcement:
    _require_operator(actor)
    locked = Announcement.objects.select_for_update().get(pk=announcement.pk)
    if locked.publication_state != Announcement.PublicationState.DRAFT:
        raise InvalidState("已发布内容不可直接修改，请通过草稿编辑后发布。")
    values = _announcement_values(payload)
    for field, value in values.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    locked.full_clean()
    locked.save(update_fields=[*values.keys(), "updated_by", "updated_at"])
    record_audit(actor=actor, action="ANNOUNCEMENT_UPDATED", target=locked, changes={"fields": sorted(values)})
    return locked


@transaction.atomic
def publish_announcement(*, actor: User, announcement: Announcement) -> Announcement:
    _require_operator(actor)
    locked = Announcement.objects.select_for_update().get(pk=announcement.pk)
    if locked.publication_state != Announcement.PublicationState.DRAFT:
        raise InvalidState
    locked.full_clean()
    locked.publication_state = Announcement.PublicationState.PUBLISHED
    locked.published_at = locked.published_at or timezone.now()
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "published_at", "updated_by", "updated_at"])
    record_audit(actor=actor, action="ANNOUNCEMENT_PUBLISHED", target=locked, changes={"publication_state": "PUBLISHED"})
    return locked


@transaction.atomic
def archive_announcement(*, actor: User, announcement: Announcement) -> Announcement:
    _require_operator(actor)
    locked = Announcement.objects.select_for_update().get(pk=announcement.pk)
    if locked.publication_state != Announcement.PublicationState.PUBLISHED:
        raise InvalidState
    locked.publication_state = Announcement.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="ANNOUNCEMENT_ARCHIVED", target=locked, changes={"publication_state": "ARCHIVED"})
    return locked


def _guide_values(payload: dict[str, Any]) -> tuple[dict[str, Any], list[object] | None]:
    values = dict(payload)
    competition_ids = values.pop("competition_ids", None)
    return values, competition_ids


def _replace_guide_competitions(*, guide: GuideArticle, competition_ids: list[object]) -> None:
    competitions = list(Competition.objects.filter(id__in=competition_ids))
    if len(competitions) != len(competition_ids):
        raise NotFound("关联竞赛不存在。")
    GuideCompetition.objects.filter(guide=guide).delete()
    GuideCompetition.objects.bulk_create(
        [GuideCompetition(guide=guide, competition_id=competition_id, sort_order=index) for index, competition_id in enumerate(competition_ids)]
    )


@transaction.atomic
def create_guide(*, actor: User, payload: dict[str, Any]) -> GuideArticle:
    _require_operator(actor)
    values, competition_ids = _guide_values(payload)
    guide = GuideArticle.objects.create(
        **values, publication_state=GuideArticle.PublicationState.DRAFT, created_by=actor, updated_by=actor
    )
    guide.full_clean()
    if competition_ids is not None:
        _replace_guide_competitions(guide=guide, competition_ids=competition_ids)
    record_audit(actor=actor, action="GUIDE_CREATED", target=guide, changes={"publication_state": "DRAFT"})
    return guide


@transaction.atomic
def update_guide(*, actor: User, guide: GuideArticle, payload: dict[str, Any]) -> GuideArticle:
    _require_operator(actor)
    locked = GuideArticle.objects.select_for_update().get(pk=guide.pk)
    if locked.publication_state != GuideArticle.PublicationState.DRAFT:
        raise InvalidState("已发布内容不可直接修改，请通过草稿编辑后发布。")
    values, competition_ids = _guide_values(payload)
    for field, value in values.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    locked.full_clean()
    locked.save(update_fields=[*values.keys(), "updated_by", "updated_at"])
    if competition_ids is not None:
        _replace_guide_competitions(guide=locked, competition_ids=competition_ids)
    record_audit(actor=actor, action="GUIDE_UPDATED", target=locked, changes={"fields": sorted(payload)})
    return locked


@transaction.atomic
def publish_guide(*, actor: User, guide: GuideArticle) -> GuideArticle:
    _require_operator(actor)
    locked = GuideArticle.objects.select_for_update().get(pk=guide.pk)
    if locked.publication_state != GuideArticle.PublicationState.DRAFT:
        raise InvalidState
    locked.publication_state = GuideArticle.PublicationState.PUBLISHED
    locked.published_at = locked.published_at or timezone.now()
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "published_at", "updated_by", "updated_at"])
    record_audit(actor=actor, action="GUIDE_PUBLISHED", target=locked, changes={"publication_state": "PUBLISHED"})
    return locked


@transaction.atomic
def archive_guide(*, actor: User, guide: GuideArticle) -> GuideArticle:
    _require_operator(actor)
    locked = GuideArticle.objects.select_for_update().get(pk=guide.pk)
    if locked.publication_state != GuideArticle.PublicationState.PUBLISHED:
        raise InvalidState
    locked.publication_state = GuideArticle.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="GUIDE_ARCHIVED", target=locked, changes={"publication_state": "ARCHIVED"})
    return locked


@transaction.atomic
def set_guide_featured(*, actor: User, guide: GuideArticle, payload: dict[str, Any]) -> GuideArticle:
    _require_operator(actor)
    locked = GuideArticle.objects.select_for_update().get(pk=guide.pk)
    if locked.publication_state != GuideArticle.PublicationState.PUBLISHED:
        raise InvalidState
    locked.is_featured = payload["is_featured"]
    if "featured_order" in payload:
        locked.featured_order = payload["featured_order"]
    locked.updated_by = actor
    locked.save(update_fields=["is_featured", "featured_order", "updated_by", "updated_at"])
    record_audit(actor=actor, action="GUIDE_FEATURED_UPDATED", target=locked, changes={"is_featured": locked.is_featured})
    return locked


@transaction.atomic
def create_faq(*, actor: User, payload: dict[str, Any]) -> FaqItem:
    _require_operator(actor)
    faq = FaqItem.objects.create(**payload, publication_state=FaqItem.PublicationState.DRAFT, created_by=actor, updated_by=actor)
    faq.full_clean()
    record_audit(actor=actor, action="FAQ_CREATED", target=faq, changes={"publication_state": "DRAFT"})
    return faq


@transaction.atomic
def update_faq(*, actor: User, faq: FaqItem, payload: dict[str, Any]) -> FaqItem:
    _require_operator(actor)
    locked = FaqItem.objects.select_for_update().get(pk=faq.pk)
    if locked.publication_state != FaqItem.PublicationState.DRAFT:
        raise InvalidState("已发布内容不可直接修改，请通过草稿编辑后发布。")
    for field, value in payload.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    locked.full_clean()
    locked.save(update_fields=[*payload.keys(), "updated_by", "updated_at"])
    record_audit(actor=actor, action="FAQ_UPDATED", target=locked, changes={"fields": sorted(payload)})
    return locked


@transaction.atomic
def publish_faq(*, actor: User, faq: FaqItem) -> FaqItem:
    _require_operator(actor)
    locked = FaqItem.objects.select_for_update().get(pk=faq.pk)
    if locked.publication_state != FaqItem.PublicationState.DRAFT:
        raise InvalidState
    locked.publication_state = FaqItem.PublicationState.PUBLISHED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="FAQ_PUBLISHED", target=locked, changes={"publication_state": "PUBLISHED"})
    return locked


@transaction.atomic
def archive_faq(*, actor: User, faq: FaqItem) -> FaqItem:
    _require_operator(actor)
    locked = FaqItem.objects.select_for_update().get(pk=faq.pk)
    if locked.publication_state != FaqItem.PublicationState.PUBLISHED:
        raise InvalidState
    locked.publication_state = FaqItem.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="FAQ_ARCHIVED", target=locked, changes={"publication_state": "ARCHIVED"})
    return locked


@transaction.atomic
def set_faq_featured(*, actor: User, faq: FaqItem, payload: dict[str, Any]) -> FaqItem:
    _require_operator(actor)
    locked = FaqItem.objects.select_for_update().get(pk=faq.pk)
    if locked.publication_state != FaqItem.PublicationState.PUBLISHED:
        raise InvalidState
    locked.is_featured = payload["is_featured"]
    locked.updated_by = actor
    locked.save(update_fields=["is_featured", "updated_by", "updated_at"])
    record_audit(actor=actor, action="FAQ_FEATURED_UPDATED", target=locked, changes={"is_featured": locked.is_featured})
    return locked


@transaction.atomic
def create_banner(*, actor: User, payload: dict[str, Any]) -> HomepageBanner:
    _require_operator(actor)
    values = dict(payload)
    values["image_asset_id"] = values.pop("image_asset_id")
    banner = HomepageBanner.objects.create(**values, created_by=actor, updated_by=actor)
    banner.full_clean()
    record_audit(actor=actor, action="BANNER_CREATED", target=banner, changes={"is_active": banner.is_active})
    return banner


@transaction.atomic
def update_banner(*, actor: User, banner: HomepageBanner, payload: dict[str, Any]) -> HomepageBanner:
    _require_operator(actor)
    locked = HomepageBanner.objects.select_for_update().get(pk=banner.pk)
    values = dict(payload)
    if "image_asset_id" in values:
        values["image_asset_id"] = values.pop("image_asset_id")
    for field, value in values.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    locked.full_clean()
    locked.save(update_fields=[*values.keys(), "updated_by", "updated_at"])
    record_audit(actor=actor, action="BANNER_UPDATED", target=locked, changes={"fields": sorted(values)})
    return locked
