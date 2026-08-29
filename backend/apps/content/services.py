"""公告、指南、FAQ 与 Banner 的运营事务 Service。"""

from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.services import record_audit
from apps.competitions.models import Competition
from apps.content.models import Announcement, FaqItem, GuideArticle, GuideCompetition, HomepageBanner, SiteDocument
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
    if "featured_order" in payload:
        locked.featured_order = payload["featured_order"]
    locked.updated_by = actor
    update_fields = ["is_featured", "updated_by", "updated_at"]
    if "featured_order" in payload:
        update_fields.insert(1, "featured_order")
    locked.save(update_fields=update_fields)
    record_audit(actor=actor, action="FAQ_FEATURED_UPDATED", target=locked, changes={"is_featured": locked.is_featured})
    return locked


@transaction.atomic
def update_homepage_curation(
    *,
    actor: User,
    featured_competitions: list[Any],
    featured_announcements: list[Any],
    featured_guides: list[Any],
    featured_faqs: list[Any],
) -> dict[str, Any]:
    """批量精选：一次性设置首页四类精选排序，禁止单条连发。"""

    _require_operator(actor)

    # 长度上限与去重由 Serializer 保证，这里做存在性与状态校验

    # 锁顺序固定：Competition -> Announcement -> Guide -> Faq，按 ID 排序锁行避免死锁
    from apps.competitions.models import Competition

    competition_ids = list(featured_competitions)
    announcement_ids = list(featured_announcements)
    guide_ids = list(featured_guides)
    faq_ids = list(featured_faqs)

    # 校验存在且已发布
    if competition_ids:
        qs = Competition.objects.select_for_update().filter(id__in=competition_ids)
        found = {str(row.id): row for row in qs}
        if len(found) != len(competition_ids):
            raise NotFound("精选竞赛中存在不存在的记录。")
        for cid in competition_ids:
            row = found[cid]
            if row.publication_state != Competition.PublicationState.PUBLISHED:
                raise InvalidState("仅已发布竞赛可设为首页精选。")

    if announcement_ids:
        qs = Announcement.objects.select_for_update().filter(id__in=announcement_ids)
        found = {str(row.id): row for row in qs}
        if len(found) != len(announcement_ids):
            raise NotFound("精选公告中存在不存在的记录。")
        for aid in announcement_ids:
            row = found[aid]
            if row.publication_state != Announcement.PublicationState.PUBLISHED:
                raise InvalidState("仅已发布公告可设为首页精选。")

    if guide_ids:
        qs = GuideArticle.objects.select_for_update().filter(id__in=guide_ids)
        found = {str(row.id): row for row in qs}
        if len(found) != len(guide_ids):
            raise NotFound("精选指南中存在不存在的记录。")
        for gid in guide_ids:
            row = found[gid]
            if row.publication_state != GuideArticle.PublicationState.PUBLISHED:
                raise InvalidState("仅已发布指南可设为首页精选。")

    if faq_ids:
        qs = FaqItem.objects.select_for_update().filter(id__in=faq_ids)
        found = {str(row.id): row for row in qs}
        if len(found) != len(faq_ids):
            raise NotFound("精选 FAQ 中存在不存在的记录。")
        for fid in faq_ids:
            row = found[fid]
            if row.publication_state != FaqItem.PublicationState.PUBLISHED:
                raise InvalidState("仅已发布 FAQ 可设为首页精选。")

    # 清除旧精选（仅对当前 PUBLISHED 且 is_featured/is_home_featured 的行）
    # 竞赛
    Competition.objects.filter(is_featured=True).update(is_featured=False, featured_order=0)
    for order, cid in enumerate(competition_ids):
        Competition.objects.filter(id=cid).update(is_featured=True, featured_order=order, updated_by=actor)

    # 公告：is_home_featured
    Announcement.objects.filter(is_home_featured=True).update(is_home_featured=False, home_featured_order=0)
    for order, aid in enumerate(announcement_ids):
        Announcement.objects.filter(id=aid).update(is_home_featured=True, home_featured_order=order, updated_by=actor)

    # 指南
    GuideArticle.objects.filter(is_featured=True).update(is_featured=False, featured_order=0)
    for order, gid in enumerate(guide_ids):
        GuideArticle.objects.filter(id=gid).update(is_featured=True, featured_order=order, updated_by=actor)

    # FAQ
    FaqItem.objects.filter(is_featured=True).update(is_featured=False, featured_order=0)
    for order, fid in enumerate(faq_ids):
        FaqItem.objects.filter(id=fid).update(is_featured=True, featured_order=order, updated_by=actor)

    record_audit(
        actor=actor,
        action="HOMEPAGE_CURATION_UPDATED",
        target=None,
        changes={
            "featured_competitions": competition_ids,
            "featured_announcements": announcement_ids,
            "featured_guides": guide_ids,
            "featured_faqs": faq_ids,
        },
    )
    return {
        "featured_competitions": competition_ids,
        "featured_announcements": announcement_ids,
        "featured_guides": guide_ids,
        "featured_faqs": faq_ids,
    }


def get_homepage_curation() -> dict[str, Any]:
    from apps.competitions.models import Competition

    competitions = (
        Competition.objects.filter(publication_state=Competition.PublicationState.PUBLISHED, is_featured=True)
        .order_by("featured_order", "-created_at")
        .values_list("id", flat=True)
    )
    announcements = (
        Announcement.objects.filter(publication_state=Announcement.PublicationState.PUBLISHED, is_home_featured=True)
        .order_by("home_featured_order", "-published_at")
        .values_list("id", flat=True)
    )
    guides = (
        GuideArticle.objects.filter(publication_state=GuideArticle.PublicationState.PUBLISHED, is_featured=True)
        .order_by("featured_order", "-published_at")
        .values_list("id", flat=True)
    )
    faqs = (
        FaqItem.objects.filter(publication_state=FaqItem.PublicationState.PUBLISHED, is_featured=True)
        .order_by("featured_order", "sort_order", "-created_at")
        .values_list("id", flat=True)
    )
    return {
        "featured_competitions": [str(uid) for uid in competitions],
        "featured_announcements": [str(uid) for uid in announcements],
        "featured_guides": [str(uid) for uid in guides],
        "featured_faqs": [str(uid) for uid in faqs],
    }


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


@transaction.atomic
def create_site_document(*, actor: User, payload: dict[str, Any]) -> SiteDocument:
    _require_operator(actor)
    doc = SiteDocument.objects.create(**payload, publication_state=SiteDocument.PublicationState.DRAFT, created_by=actor, updated_by=actor)
    doc.full_clean()
    record_audit(actor=actor, action="SITE_DOCUMENT_CREATED", target=doc, changes={"slug": doc.slug, "publication_state": "DRAFT"})
    return doc


@transaction.atomic
def update_site_document(*, actor: User, document: SiteDocument, payload: dict[str, Any]) -> SiteDocument:
    _require_operator(actor)
    locked = SiteDocument.objects.select_for_update().get(pk=document.pk)
    if locked.publication_state != SiteDocument.PublicationState.DRAFT:
        raise InvalidState("已发布文档不可直接修改，请先归档为草稿。")
    for field, value in payload.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    locked.full_clean()
    locked.save(update_fields=[*payload.keys(), "updated_by", "updated_at"])
    record_audit(actor=actor, action="SITE_DOCUMENT_UPDATED", target=locked, changes={"fields": sorted(payload)})
    return locked


@transaction.atomic
def publish_site_document(*, actor: User, document: SiteDocument) -> SiteDocument:
    _require_operator(actor)
    locked = SiteDocument.objects.select_for_update().get(pk=document.pk)
    if locked.publication_state != SiteDocument.PublicationState.DRAFT:
        raise InvalidState
    locked.publication_state = SiteDocument.PublicationState.PUBLISHED
    locked.published_at = locked.published_at or timezone.now()
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "published_at", "updated_by", "updated_at"])
    record_audit(actor=actor, action="SITE_DOCUMENT_PUBLISHED", target=locked, changes={"publication_state": "PUBLISHED"})
    return locked


@transaction.atomic
def archive_site_document(*, actor: User, document: SiteDocument) -> SiteDocument:
    _require_operator(actor)
    locked = SiteDocument.objects.select_for_update().get(pk=document.pk)
    if locked.publication_state != SiteDocument.PublicationState.PUBLISHED:
        raise InvalidState
    locked.publication_state = SiteDocument.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="SITE_DOCUMENT_ARCHIVED", target=locked, changes={"publication_state": "ARCHIVED"})
    return locked
