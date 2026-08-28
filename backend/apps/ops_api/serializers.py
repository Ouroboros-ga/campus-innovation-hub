"""BE-040 严格运营请求 DTO 与显式管理响应投影。"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any
from urllib.parse import unquote, urlsplit

from django.core.validators import URLValidator
from rest_framework import serializers
from rest_framework.request import Request

from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition, TimelineEvent
from apps.consultations.models import Consultation, Reply
from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner
from apps.media.models import MediaAsset
from apps.organizations.models import Organization, Recruitment
from apps.public_api.serializers import (
    actor_summary,
    media_ref,
    serialize_activity_detail,
    serialize_announcement_detail,
    serialize_banner,
    serialize_competition_detail,
    serialize_faq,
    serialize_guide_detail,
)


class StrictSerializer(serializers.Serializer):
    """冻结契约拒绝未声明字段，尤其禁止客户端写内部状态。"""

    def to_internal_value(self, data: Any) -> dict[str, Any]:
        if not isinstance(data, Mapping):
            raise serializers.ValidationError({"non_field_errors": ["请求体必须是对象。"]})
        unknown = sorted(set(data) - set(self.fields))
        if unknown:
            raise serializers.ValidationError({"non_field_errors": [f"不支持字段：{', '.join(unknown)}"]})
        return super().to_internal_value(data)


class HttpUrlField(serializers.URLField):
    """冻结契约只允许 http(s)，不让 ftp 等合法 URL 绕过外链边界。"""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.validators.append(URLValidator(schemes=["http", "https"]))


def _is_safe_internal_path(value: str) -> bool:
    """站内链接必须是单斜杠绝对路径，防止 scheme-relative 外跳。"""

    decoded = unquote(value)
    if not decoded.startswith("/") or decoded.startswith("//") or "\\" in decoded:
        return False
    try:
        parsed = urlsplit(decoded)
    except ValueError:
        return False
    return not parsed.scheme and not parsed.netloc


class _CompetitionWriteBase(StrictSerializer):
    name = serializers.CharField(min_length=2, max_length=120)
    edition = serializers.CharField(min_length=1, max_length=40)
    category = serializers.ChoiceField(choices=Competition.Category.choices)
    level = serializers.ChoiceField(choices=Competition.Level.choices)
    participation_mode = serializers.ChoiceField(choices=Competition.ParticipationMode.choices)
    suitable_grade_min = serializers.IntegerField(min_value=1, max_value=4, required=False, allow_null=True)
    suitable_grade_max = serializers.IntegerField(min_value=1, max_value=4, required=False, allow_null=True)
    direction = serializers.CharField(max_length=300, required=False, allow_null=True, allow_blank=True)
    summary = serializers.CharField(max_length=300, required=False, allow_null=True, allow_blank=True)
    description_md = serializers.CharField(min_length=1, max_length=20000)
    suitable_for_md = serializers.CharField(max_length=10000, required=False, allow_null=True, allow_blank=True)
    preparation_advice_md = serializers.CharField(max_length=10000, required=False, allow_null=True, allow_blank=True)
    registration_start_at = serializers.DateTimeField(required=False, allow_null=True)
    registration_end_at = serializers.DateTimeField(required=False, allow_null=True)
    event_start_at = serializers.DateTimeField(required=False, allow_null=True)
    event_end_at = serializers.DateTimeField(required=False, allow_null=True)
    college_organized = serializers.BooleanField()
    college_contact_name = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    college_contact_text = serializers.CharField(max_length=200, required=False, allow_null=True, allow_blank=True)
    official_url = HttpUrlField(max_length=500, required=False, allow_null=True, allow_blank=True)
    registration_url = HttpUrlField(max_length=500, required=False, allow_null=True, allow_blank=True)
    official_notice_url = HttpUrlField(max_length=500, required=False, allow_null=True, allow_blank=True)
    cover_asset_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        competition = self.context.get("competition")

        def value(name: str) -> Any:
            return attrs.get(name, getattr(competition, name, None))

        min_grade, max_grade = value("suitable_grade_min"), value("suitable_grade_max")
        if (min_grade is None) != (max_grade is None):
            raise serializers.ValidationError({"suitable_grade_min": ["适合年级上下限必须同时填写或同时为空。"]})
        if min_grade is not None and min_grade > max_grade:
            raise serializers.ValidationError({"suitable_grade_min": ["适合年级下限不能大于上限。"]})
        for start_field, end_field, label in (
            ("registration_start_at", "registration_end_at", "报名"),
            ("event_start_at", "event_end_at", "活动"),
        ):
            start_at, end_at = value(start_field), value(end_field)
            if start_at is not None and end_at is not None and start_at > end_at:
                raise serializers.ValidationError({start_field: [f"{label}开始时间不能晚于结束时间。"]})
        cover_asset_id = attrs.get("cover_asset_id")
        if cover_asset_id is not None and not MediaAsset.objects.filter(
            id=cover_asset_id, kind=MediaAsset.Kind.IMAGE, status=MediaAsset.Status.ACTIVE
        ).exists():
            raise serializers.ValidationError({"cover_asset_id": ["必须引用可用的图片 MediaAsset。"]})
        return attrs


class CompetitionCreateSerializer(_CompetitionWriteBase):
    pass


class CompetitionPatchSerializer(_CompetitionWriteBase):
    name = serializers.CharField(min_length=2, max_length=120, required=False)
    edition = serializers.CharField(min_length=1, max_length=40, required=False)
    category = serializers.ChoiceField(choices=Competition.Category.choices, required=False)
    level = serializers.ChoiceField(choices=Competition.Level.choices, required=False)
    participation_mode = serializers.ChoiceField(choices=Competition.ParticipationMode.choices, required=False)
    description_md = serializers.CharField(min_length=1, max_length=20000, required=False)
    college_organized = serializers.BooleanField(required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return super().validate(attrs)


class FeaturedSerializer(StrictSerializer):
    is_featured = serializers.BooleanField()
    featured_order = serializers.IntegerField(min_value=0, required=False)


class HomepageCurationSerializer(StrictSerializer):
    featured_competitions = serializers.ListField(child=serializers.UUIDField(), max_length=8, required=False, default=list)
    featured_announcements = serializers.ListField(child=serializers.UUIDField(), max_length=6, required=False, default=list)
    featured_guides = serializers.ListField(child=serializers.UUIDField(), max_length=6, required=False, default=list)
    featured_faqs = serializers.ListField(child=serializers.UUIDField(), max_length=6, required=False, default=list)

    def validate_featured_competitions(self, value: list[Any]) -> list[Any]:
        if len(value) != len(set(str(v) for v in value)):
            raise serializers.ValidationError("精选竞赛不能重复。")
        return value

    def validate_featured_announcements(self, value: list[Any]) -> list[Any]:
        if len(value) != len(set(str(v) for v in value)):
            raise serializers.ValidationError("精选公告不能重复。")
        return value

    def validate_featured_guides(self, value: list[Any]) -> list[Any]:
        if len(value) != len(set(str(v) for v in value)):
            raise serializers.ValidationError("精选指南不能重复。")
        return value

    def validate_featured_faqs(self, value: list[Any]) -> list[Any]:
        if len(value) != len(set(str(v) for v in value)):
            raise serializers.ValidationError("精选 FAQ 不能重复。")
        return value


class TimelineEventCreateSerializer(StrictSerializer):
    title = serializers.CharField(min_length=1, max_length=100)
    event_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField(required=False, allow_null=True)
    description = serializers.CharField(max_length=500, required=False, allow_null=True, allow_blank=True)
    sort_order = serializers.IntegerField(min_value=0)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        end_at = attrs.get("end_at")
        if end_at is not None and attrs["event_at"] > end_at:
            raise serializers.ValidationError({"event_at": ["开始时间不能晚于结束时间。"]})
        return attrs


class TimelineEventPatchSerializer(TimelineEventCreateSerializer):
    title = serializers.CharField(min_length=1, max_length=100, required=False)
    event_at = serializers.DateTimeField(required=False)
    sort_order = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        event = self.context["event"]
        event_at = attrs.get("event_at", event.event_at)
        end_at = attrs.get("end_at", event.end_at)
        if end_at is not None and event_at > end_at:
            raise serializers.ValidationError({"event_at": ["开始时间不能晚于结束时间。"]})
        return attrs


def serialize_timeline_event_management(event: TimelineEvent) -> dict[str, Any]:
    return {
        "id": str(event.id),
        "title": event.title,
        "event_at": event.event_at,
        "end_at": event.end_at,
        "description": event.description,
        "sort_order": event.sort_order,
    }


def serialize_competition_management(competition: Competition, request: Request) -> dict[str, Any]:
    """复用公开字段白名单，并只追加冻结的运营元数据。"""

    payload = serialize_competition_detail(competition, request)
    payload.update(
        {
            "publication_state": competition.publication_state,
            "is_featured": competition.is_featured,
            "featured_order": competition.featured_order,
            "created_at": competition.created_at,
            "updated_at": competition.updated_at,
            "created_by_id": str(competition.created_by_id),
            "updated_by_id": str(competition.updated_by_id),
        }
    )
    return payload


def _active_image_or_error(asset_id: object, field: str) -> None:
    if asset_id is not None and not MediaAsset.objects.filter(
        id=asset_id, kind=MediaAsset.Kind.IMAGE, status=MediaAsset.Status.ACTIVE
    ).exists():
        raise serializers.ValidationError({field: ["必须引用可用的图片 MediaAsset。"]})


class _ActivityWriteBase(StrictSerializer):
    title = serializers.CharField(min_length=2, max_length=120)
    activity_type = serializers.ChoiceField(choices=Activity.ActivityType.choices)
    summary = serializers.CharField(max_length=300, required=False, allow_null=True, allow_blank=True)
    description_md = serializers.CharField(min_length=1, max_length=20000)
    organizer_organization_id = serializers.UUIDField(required=False, allow_null=True)
    organizer_name = serializers.CharField(max_length=120, required=False, allow_null=True, allow_blank=True)
    speaker = serializers.CharField(max_length=200, required=False, allow_null=True, allow_blank=True)
    location = serializers.CharField(min_length=1, max_length=200)
    start_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField(required=False, allow_null=True)
    registration_required = serializers.BooleanField()
    registration_start_at = serializers.DateTimeField(required=False, allow_null=True)
    registration_end_at = serializers.DateTimeField(required=False, allow_null=True)
    capacity = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    notes_md = serializers.CharField(max_length=5000, required=False, allow_null=True, allow_blank=True)
    cover_asset_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        activity = self.context.get("activity")

        def value(name: str) -> Any:
            return attrs.get(name, getattr(activity, name, None))

        start_at, end_at = value("start_at"), value("end_at")
        if end_at is not None and start_at > end_at:
            raise serializers.ValidationError({"start_at": ["开始时间不能晚于结束时间。"]})
        registration_required = value("registration_required")
        registration_start_at, registration_end_at, capacity = (
            value("registration_start_at"),
            value("registration_end_at"),
            value("capacity"),
        )
        if registration_required:
            if registration_start_at is not None and registration_end_at is not None and registration_start_at > registration_end_at:
                raise serializers.ValidationError({"registration_start_at": ["报名开始时间不能晚于结束时间。"]})
        elif any(value is not None for value in (registration_start_at, registration_end_at, capacity)):
            raise serializers.ValidationError({"registration_required": ["不需要报名的活动不能设置报名时间或容量。"]})
        organization_id = attrs.get("organizer_organization_id")
        if organization_id is not None and not Organization.objects.filter(id=organization_id, is_active=True).exists():
            raise serializers.ValidationError({"organizer_organization_id": ["组织不存在或已停用。"]})
        if "cover_asset_id" in attrs:
            _active_image_or_error(attrs["cover_asset_id"], "cover_asset_id")
        return attrs


class ActivityCreateSerializer(_ActivityWriteBase):
    pass


class ActivityPatchSerializer(_ActivityWriteBase):
    title = serializers.CharField(min_length=2, max_length=120, required=False)
    activity_type = serializers.ChoiceField(choices=Activity.ActivityType.choices, required=False)
    description_md = serializers.CharField(min_length=1, max_length=20000, required=False)
    location = serializers.CharField(min_length=1, max_length=200, required=False)
    start_at = serializers.DateTimeField(required=False)
    registration_required = serializers.BooleanField(required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return super().validate(attrs)


class _AnnouncementWriteBase(StrictSerializer):
    title = serializers.CharField(min_length=2, max_length=160)
    summary = serializers.CharField(max_length=300, required=False, allow_null=True, allow_blank=True)
    body_md = serializers.CharField(min_length=1, max_length=20000)
    publisher_scope = serializers.ChoiceField(choices=Announcement.PublisherScope.choices)
    source_name = serializers.CharField(max_length=160, required=False, allow_null=True, allow_blank=True)
    external_url = HttpUrlField(max_length=500, required=False, allow_null=True, allow_blank=True)
    is_pinned = serializers.BooleanField(required=False, default=False)
    is_home_featured = serializers.BooleanField(required=False, default=False)
    competition_id = serializers.UUIDField(required=False, allow_null=True)
    activity_id = serializers.UUIDField(required=False, allow_null=True)
    organization_id = serializers.UUIDField(required=False, allow_null=True)
    recruitment_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        announcement = self.context.get("announcement")
        identifiers = {
            "competition_id": attrs.get("competition_id", getattr(announcement, "competition_id", None)),
            "activity_id": attrs.get("activity_id", getattr(announcement, "activity_id", None)),
            "organization_id": attrs.get("organization_id", getattr(announcement, "organization_id", None)),
            "recruitment_id": attrs.get("recruitment_id", getattr(announcement, "recruitment_id", None)),
        }
        if sum(value is not None for value in identifiers.values()) > 1:
            raise serializers.ValidationError({"non_field_errors": ["公告最多只能关联一个核心业务对象。"]})
        related = (
            ("competition_id", Competition),
            ("activity_id", Activity),
            ("organization_id", Organization),
            ("recruitment_id", Recruitment),
        )
        for field, model in related:
            identifier = attrs.get(field)
            if identifier is not None and not model.objects.filter(id=identifier).exists():
                raise serializers.ValidationError({field: ["关联对象不存在。"]})
        return attrs


class AnnouncementCreateSerializer(_AnnouncementWriteBase):
    pass


class AnnouncementPatchSerializer(_AnnouncementWriteBase):
    title = serializers.CharField(min_length=2, max_length=160, required=False)
    body_md = serializers.CharField(min_length=1, max_length=20000, required=False)
    publisher_scope = serializers.ChoiceField(choices=Announcement.PublisherScope.choices, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return super().validate(attrs)


class _GuideWriteBase(StrictSerializer):
    title = serializers.CharField(min_length=2, max_length=160)
    category = serializers.ChoiceField(choices=GuideArticle.Category.choices)
    summary = serializers.CharField(max_length=300, required=False, allow_null=True, allow_blank=True)
    body_md = serializers.CharField(min_length=1, max_length=50000)
    competition_ids = serializers.ListField(child=serializers.UUIDField(), max_length=20, required=False, allow_null=True)
    is_featured = serializers.BooleanField()
    featured_order = serializers.IntegerField(min_value=0)

    def validate_competition_ids(self, values: list[object] | None) -> list[object] | None:
        if values is not None and len(set(values)) != len(values):
            raise serializers.ValidationError("关联竞赛不能重复。")
        return values


class GuideCreateSerializer(_GuideWriteBase):
    pass


class GuidePatchSerializer(_GuideWriteBase):
    title = serializers.CharField(min_length=2, max_length=160, required=False)
    category = serializers.ChoiceField(choices=GuideArticle.Category.choices, required=False)
    body_md = serializers.CharField(min_length=1, max_length=50000, required=False)
    is_featured = serializers.BooleanField(required=False)
    featured_order = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return attrs


class _FaqWriteBase(StrictSerializer):
    category = serializers.ChoiceField(choices=FaqItem.Category.choices)
    question = serializers.CharField(min_length=2, max_length=300)
    answer_md = serializers.CharField(min_length=1, max_length=20000)
    sort_order = serializers.IntegerField(min_value=0)
    is_featured = serializers.BooleanField()
    featured_order = serializers.IntegerField(min_value=0, required=False, default=0)


class FaqCreateSerializer(_FaqWriteBase):
    pass


class FaqPatchSerializer(_FaqWriteBase):
    category = serializers.ChoiceField(choices=FaqItem.Category.choices, required=False)
    question = serializers.CharField(min_length=2, max_length=300, required=False)
    answer_md = serializers.CharField(min_length=1, max_length=20000, required=False)
    sort_order = serializers.IntegerField(min_value=0, required=False)
    is_featured = serializers.BooleanField(required=False)
    featured_order = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return attrs


class _BannerWriteBase(StrictSerializer):
    title = serializers.CharField(min_length=1, max_length=80)
    subtitle = serializers.CharField(max_length=160, required=False, allow_null=True, allow_blank=True)
    category_label = serializers.CharField(max_length=30, required=False, allow_null=True, allow_blank=True)
    image_asset_id = serializers.UUIDField()
    alt_text = serializers.CharField(max_length=160, required=False, allow_null=True, allow_blank=True)
    link_type = serializers.ChoiceField(choices=HomepageBanner.LinkType.choices)
    internal_path = serializers.CharField(max_length=500, required=False, allow_null=True, allow_blank=True)
    external_url = HttpUrlField(max_length=500, required=False, allow_null=True, allow_blank=True)
    start_at = serializers.DateTimeField(required=False, allow_null=True)
    end_at = serializers.DateTimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField()
    sort_order = serializers.IntegerField(min_value=0)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        banner = self.context.get("banner")

        def value(name: str) -> Any:
            return attrs.get(name, getattr(banner, name, None))

        _active_image_or_error(value("image_asset_id"), "image_asset_id")
        start_at, end_at = value("start_at"), value("end_at")
        if start_at is not None and end_at is not None and start_at > end_at:
            raise serializers.ValidationError({"start_at": ["开始时间不能晚于结束时间。"]})
        link_type, internal_path, external_url = value("link_type"), value("internal_path"), value("external_url")
        if link_type == HomepageBanner.LinkType.NONE and (internal_path or external_url):
            raise serializers.ValidationError({"link_type": ["无链接 Banner 不能设置链接地址。"]})
        if link_type == HomepageBanner.LinkType.INTERNAL and (
            not internal_path or external_url or not _is_safe_internal_path(internal_path)
        ):
            raise serializers.ValidationError({"link_type": ["站内 Banner 只能设置绝对站内路径。"]})
        if link_type == HomepageBanner.LinkType.EXTERNAL and (not external_url or internal_path):
            raise serializers.ValidationError({"link_type": ["站外 Banner 只能设置站外链接。"]})
        return attrs


class BannerCreateSerializer(_BannerWriteBase):
    pass


class BannerPatchSerializer(_BannerWriteBase):
    title = serializers.CharField(min_length=1, max_length=80, required=False)
    image_asset_id = serializers.UUIDField(required=False)
    link_type = serializers.ChoiceField(choices=HomepageBanner.LinkType.choices, required=False)
    is_active = serializers.BooleanField(required=False)
    sort_order = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return super().validate(attrs)


class ConsultationReplySerializer(StrictSerializer):
    body_md = serializers.CharField(min_length=1, max_length=10000)


class DynamicActivityAnnouncementSerializer(StrictSerializer):
    activity = ActivityCreateSerializer()
    announcement = AnnouncementCreateSerializer()
    publish = serializers.BooleanField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        announcement_data = self.initial_data.get("announcement", {})
        if isinstance(announcement_data, Mapping) and any(
            field in announcement_data for field in ("competition_id", "activity_id", "organization_id", "recruitment_id")
        ):
            raise serializers.ValidationError({"announcement": ["组合发布的关联对象由服务端绑定为新活动。"]})
        return attrs


def _management_fields(instance: Any) -> dict[str, Any]:
    return {
        "created_at": instance.created_at,
        "updated_at": instance.updated_at,
        "created_by_id": str(instance.created_by_id),
        "updated_by_id": str(instance.updated_by_id),
    }


def serialize_activity_management(activity: Activity, request: Request) -> dict[str, Any]:
    payload = serialize_activity_detail(activity, request)
    payload.update(
        {
            "publication_state": activity.publication_state,
            "is_featured": activity.is_featured,
            "featured_order": activity.featured_order,
            **_management_fields(activity),
        }
    )
    return payload


def serialize_registration_management(registration: Registration) -> dict[str, Any]:
    return {
        "id": str(registration.id),
        "user_id": str(registration.user_id),
        "name_snapshot": registration.name_snapshot,
        "student_no_snapshot": registration.student_no_snapshot,
        "class_name_snapshot": registration.class_name_snapshot,
        "major_snapshot": registration.major_snapshot,
        "grade_snapshot": registration.grade_snapshot,
        "status": registration.status,
        "registered_at": registration.registered_at,
        "cancelled_at": registration.cancelled_at,
    }


def serialize_announcement_management(announcement: Announcement, request: Request) -> dict[str, Any]:
    payload = serialize_announcement_detail(announcement, request)
    payload.update(
        {
            "competition_id": str(announcement.competition_id) if announcement.competition_id else None,
            "activity_id": str(announcement.activity_id) if announcement.activity_id else None,
            "organization_id": str(announcement.organization_id) if announcement.organization_id else None,
            "recruitment_id": str(announcement.recruitment_id) if announcement.recruitment_id else None,
            "publication_state": announcement.publication_state,
            "is_home_featured": announcement.is_home_featured,
            "home_featured_order": announcement.home_featured_order,
            "is_pinned": announcement.is_pinned,
            **_management_fields(announcement),
        }
    )
    return payload


def serialize_guide_management(guide: GuideArticle, request: Request) -> dict[str, Any]:
    payload = serialize_guide_detail(guide, request)
    payload.update(
        {
            "competition_ids": [str(link.competition_id) for link in guide.competition_links.all().order_by("sort_order", "created_at")],
            "publication_state": guide.publication_state,
            **_management_fields(guide),
        }
    )
    return payload


def serialize_faq_management(faq: FaqItem, request: Request) -> dict[str, Any]:
    payload = serialize_faq(faq, request)
    payload.update({"publication_state": faq.publication_state, **_management_fields(faq)})
    return payload


def serialize_banner_management(banner: HomepageBanner, request: Request) -> dict[str, Any]:
    payload = serialize_banner(banner, request)
    payload.update(
        {
            "start_at": banner.start_at,
            "end_at": banner.end_at,
            "is_active": banner.is_active,
            "sort_order": banner.sort_order,
            **_management_fields(banner),
        }
    )
    return payload


def serialize_reply_management(reply: Reply, request: Request) -> dict[str, Any]:
    return {
        "id": str(reply.id),
        "author": actor_summary(reply.author, request),
        "body_md": reply.body_md,
        "created_at": reply.created_at,
        "updated_at": reply.updated_at,
    }


def serialize_consultation_management(consultation: Consultation, request: Request) -> dict[str, Any]:
    return {
        "id": str(consultation.id),
        "author": actor_summary(consultation.author, request),
        "category": consultation.category,
        "competition_id": str(consultation.competition_id) if consultation.competition_id else None,
        "title": consultation.title,
        "body_md": consultation.body_md,
        "visibility": consultation.visibility,
        "status": consultation.status,
        "answered_at": consultation.answered_at,
        "replies": [serialize_reply_management(reply, request) for reply in consultation.replies.all().order_by("created_at")],
        "created_at": consultation.created_at,
        "updated_at": consultation.updated_at,
    }
