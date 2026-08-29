"""公开 DTO 的显式投影。

这里故意不用 ``ModelSerializer(fields='__all__')``：公开接口是隐私边界，字段
必须由白名单逐一写出，不能让 Model 新字段意外穿透到 API。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from django.db.models import Q
from django.utils import timezone
from rest_framework.request import Request

from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition, Follow, TimelineEvent
from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner, SiteDocument
from apps.media.models import MediaAsset
from apps.media.storage import get_object_storage
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentPosition
from apps.teams.models import TeamApplication, TeamPost, TeamRole


def _now(now: datetime | None = None) -> datetime:
    return now or timezone.now()


def is_authenticated(request: Request) -> bool:
    return bool(getattr(request.user, "is_authenticated", False))


def media_ref(asset: MediaAsset | None, request: Request) -> dict[str, str] | None:
    if asset is None or asset.status != MediaAsset.Status.ACTIVE:
        return None
    url = get_object_storage().public_url(asset.object_key)
    if url.startswith("/"):
        url = request.build_absolute_uri(url)
    return {"id": str(asset.id), "url": url}


def actor_summary(user: Any, request: Request) -> dict[str, Any]:
    profile = getattr(user, "profile", None)
    # TEACHER 的公开显示名优先 public_name
    display_name = None
    if profile:
        if getattr(profile, "public_name", None):
            display_name = profile.public_name
        else:
            display_name = profile.nickname
    return {
        "id": str(user.id),
        "nickname": profile.nickname if profile else None,
        "public_name": getattr(profile, "public_name", None) if profile else None,
        "display_name": display_name,
        "avatar": media_ref(profile.avatar_asset, request) if profile and profile.avatar_asset_id else None,
        "major": profile.major if profile else None,
        "grade": profile.grade if profile else None,
        "department": getattr(profile, "department", None) if profile else None,
        "academic_title": getattr(profile, "academic_title", None) if profile else None,
    }


def competition_registration_state(competition: Competition, now: datetime | None = None) -> str:
    current = _now(now)
    if competition.registration_start_at is None and competition.registration_end_at is None:
        return "NOT_AVAILABLE"
    if competition.registration_start_at is not None and current < competition.registration_start_at:
        return "UPCOMING"
    if competition.registration_end_at is not None and current > competition.registration_end_at:
        return "CLOSED"
    return "OPEN"


def event_phase(start_at: datetime | None, end_at: datetime | None, now: datetime | None = None) -> str:
    current = _now(now)
    if end_at is not None and current > end_at:
        return "ENDED"
    if start_at is not None and current >= start_at:
        return "IN_PROGRESS"
    return "UPCOMING"


def recruitment_application_state(recruitment: Recruitment, now: datetime | None = None) -> str:
    current = _now(now)
    if recruitment.publication_state != Recruitment.PublicationState.PUBLISHED:
        return recruitment.publication_state
    if recruitment.completed_at is not None:
        return "COMPLETED"
    if recruitment.apply_start_at is not None and current < recruitment.apply_start_at:
        return "UPCOMING"
    if current <= recruitment.apply_end_at:
        return "OPEN"
    return "CLOSED"


def _annotated_or_count(instance: Any, attribute: str, queryset: Any) -> int:
    value = getattr(instance, attribute, None)
    return int(value) if value is not None else queryset.count()


def activity_registered_count(activity: Activity) -> int:
    return _annotated_or_count(
        activity,
        "registered_count_value",
        activity.registrations.filter(status=Registration.Status.REGISTERED),
    )


def activity_registration_state(activity: Activity, now: datetime | None = None) -> str:
    if not activity.registration_required:
        return "NOT_REQUIRED"
    current = _now(now)
    if activity.registration_start_at is not None and current < activity.registration_start_at:
        return "UPCOMING"
    if activity.registration_end_at is not None and current > activity.registration_end_at:
        return "CLOSED"
    if activity.capacity is not None and activity_registered_count(activity) >= activity.capacity:
        return "FULL"
    return "OPEN"


def serialize_competition(competition: Competition, request: Request) -> dict[str, Any]:
    followed: bool | None = None
    if is_authenticated(request):
        followed = Follow.objects.filter(competition=competition, user=request.user).exists()
    return {
        "id": str(competition.id),
        "name": competition.name,
        "edition": competition.edition,
        "category": competition.category,
        "level": competition.level,
        "participation_mode": competition.participation_mode,
        "suitable_grade_min": competition.suitable_grade_min,
        "suitable_grade_max": competition.suitable_grade_max,
        "direction": competition.direction,
        "summary": competition.summary,
        "cover": media_ref(competition.cover_asset, request),
        "registration_start_at": competition.registration_start_at,
        "registration_end_at": competition.registration_end_at,
        "event_start_at": competition.event_start_at,
        "event_end_at": competition.event_end_at,
        "publication_state": competition.publication_state,
        "registration_state": competition_registration_state(competition),
        "event_phase": event_phase(competition.event_start_at, competition.event_end_at),
        "official_url": competition.official_url,
        "followed": followed,
    }


def serialize_home_competition(competition: Competition, request: Request) -> dict[str, Any]:
    """首页专用：完全公共、无用户状态，避免 N+1 与缓存分化。"""

    return {
        "id": str(competition.id),
        "name": competition.name,
        "edition": competition.edition,
        "category": competition.category,
        "level": competition.level,
        "participation_mode": competition.participation_mode,
        "suitable_grade_min": competition.suitable_grade_min,
        "suitable_grade_max": competition.suitable_grade_max,
        "direction": competition.direction,
        "summary": competition.summary,
        "cover": media_ref(competition.cover_asset, request),
        "registration_start_at": competition.registration_start_at,
        "registration_end_at": competition.registration_end_at,
        "event_start_at": competition.event_start_at,
        "event_end_at": competition.event_end_at,
        "publication_state": competition.publication_state,
        "registration_state": competition_registration_state(competition),
        "event_phase": event_phase(competition.event_start_at, competition.event_end_at),
        "official_url": competition.official_url,
    }


def serialize_timeline_event(event: TimelineEvent) -> dict[str, Any]:
    return {
        "id": str(event.id),
        "title": event.title,
        "event_at": event.event_at,
        "end_at": event.end_at,
        "description": event.description,
        "sort_order": event.sort_order,
    }


def serialize_team_role(role: TeamRole) -> dict[str, Any]:
    return {
        "id": str(role.id),
        "name": role.name,
        "headcount": role.headcount,
        "requirements": role.requirements,
        "skills": role.skills,
        "sort_order": role.sort_order,
    }


def serialize_team_post(team: TeamPost, request: Request) -> dict[str, Any]:
    accepted_count = _annotated_or_count(
        team,
        "accepted_count",
        team.applications.filter(status=TeamApplication.Status.ACCEPTED),
    )
    return {
        "id": str(team.id),
        "post_type": team.post_type,
        "title": team.title,
        "competition_id": str(team.competition_id),
        "competition_name": team.competition.name,
        "team_name": team.team_name,
        "direction": team.direction,
        "base_member_count": team.base_member_count,
        "target_member_count": team.target_member_count,
        "current_member_count": team.base_member_count + accepted_count,
        "members_summary": team.members_summary,
        "goal": team.goal,
        "weekly_commitment": team.weekly_commitment,
        "roles": [serialize_team_role(role) for role in team.roles.all().order_by("sort_order", "created_at")],
        "status": team.status,
        "author": actor_summary(team.author, request),
        "created_at": team.created_at,
    }


def serialize_team_detail(team: TeamPost, request: Request) -> dict[str, Any]:
    payload = serialize_team_post(team, request)
    my_application_status: str | None = None
    if is_authenticated(request):
        application = team.applications.filter(applicant=request.user).order_by("-created_at").first()
        my_application_status = application.status if application else None
        if team.author_id == request.user.id or (application and application.status == TeamApplication.Status.ACCEPTED):
            payload["contact_method"] = team.contact_method
            payload["contact_value"] = team.contact_value
    payload.update({"notes_md": team.notes_md, "updated_at": team.updated_at, "my_application_status": my_application_status})
    return payload


def recruitment_open_filter(now: datetime | None = None) -> Q:
    current = _now(now)
    return (
        Q(publication_state=Recruitment.PublicationState.PUBLISHED)
        & Q(completed_at__isnull=True)
        & (Q(apply_start_at__isnull=True) | Q(apply_start_at__lte=current))
        & Q(apply_end_at__gte=current)
    )


def serialize_recruitment(recruitment: Recruitment, request: Request) -> dict[str, Any]:
    position_count = _annotated_or_count(recruitment, "position_count", recruitment.positions.all())
    return {
        "id": str(recruitment.id),
        "organization_id": str(recruitment.organization_id),
        "organization_name": recruitment.organization.name,
        "title": recruitment.title,
        "apply_start_at": recruitment.apply_start_at,
        "apply_end_at": recruitment.apply_end_at,
        "application_state": recruitment_application_state(recruitment),
        "position_count": position_count,
    }


def serialize_recruitment_position(position: RecruitmentPosition) -> dict[str, Any]:
    return {
        "id": str(position.id),
        "name": position.name,
        "headcount": position.headcount,
        "description_md": position.description_md,
        "requirements_md": position.requirements_md,
        "sort_order": position.sort_order,
    }


def serialize_recruitment_detail(recruitment: Recruitment, request: Request) -> dict[str, Any]:
    payload = serialize_recruitment(recruitment, request)
    payload.update(
        {
            "intro_md": recruitment.intro_md,
            "target_grade_min": recruitment.target_grade_min,
            "target_grade_max": recruitment.target_grade_max,
            "notes_md": recruitment.notes_md,
            "positions": [
                serialize_recruitment_position(position)
                for position in recruitment.positions.all().order_by("sort_order", "created_at")
            ],
        }
    )
    return payload


def organization_is_recruiting(organization: Organization, now: datetime | None = None) -> bool:
    annotated = getattr(organization, "is_recruiting_value", None)
    if annotated is not None:
        return bool(annotated)
    return organization.recruitments.filter(recruitment_open_filter(now)).exists()


def serialize_organization(organization: Organization, request: Request) -> dict[str, Any]:
    return {
        "id": str(organization.id),
        "name": organization.name,
        "organization_type": organization.organization_type,
        "short_intro": organization.short_intro,
        "logo": media_ref(organization.logo_asset, request),
        "is_recruiting": organization_is_recruiting(organization),
    }


def _advisor_card(membership: OrganizationMembership, request: Request) -> dict[str, Any]:
    user = membership.user
    profile = getattr(user, "profile", None)
    return {
        "membership_id": str(membership.id),
        "user_id": str(user.id),
        "public_name": getattr(profile, "public_name", None) if profile else None,
        "display_name": (getattr(profile, "public_name", None) or profile.nickname if profile else None),
        "avatar": media_ref(profile.avatar_asset, request) if profile and profile.avatar_asset_id else None,
        "department": getattr(profile, "department", None) if profile else None,
        "academic_title": getattr(profile, "academic_title", None) if profile else None,
        "public_email": getattr(profile, "public_email", None) if profile else None,
        "office_location": getattr(profile, "office_location", None) if profile else None,
        "research_interests": getattr(profile, "research_interests_json", []) if profile else [],
        "title": membership.title,
    }


def serialize_organization_detail(organization: Organization, request: Request) -> dict[str, Any]:
    payload = serialize_organization(organization, request)
    is_leader: bool | None = None
    can_manage: bool | None = None
    current_user_role: str | None = None
    if is_authenticated(request):
        # ORG_MANAGER 权限：LEADER 或 ADVISOR
        membership = OrganizationMembership.objects.filter(
            organization=organization, user=request.user, is_active=True
        ).first()
        if membership:
            current_user_role = membership.role
        is_leader = OrganizationMembership.objects.filter(
            organization=organization,
            user=request.user,
            role=OrganizationMembership.Role.LEADER,
            is_active=True,
        ).exists()
        from apps.permissions import is_org_manager

        can_manage = is_org_manager(request.user, organization.id)
    # 指导老师由 Membership 派生（database-design.md §10.1）
    advisors = list(
        OrganizationMembership.objects.filter(
            organization=organization, role=OrganizationMembership.Role.ADVISOR, is_active=True
        ).select_related("user", "user__profile", "user__profile__avatar_asset")
    )
    leaders = list(
        OrganizationMembership.objects.filter(
            organization=organization, role=OrganizationMembership.Role.LEADER, is_active=True
        ).select_related("user", "user__profile", "user__profile__avatar_asset")
    )
    current_recruitments = organization.recruitments.filter(
        publication_state=Recruitment.PublicationState.PUBLISHED
    ).select_related("organization")
    ordered_recruitments = sorted(
        current_recruitments,
        key=lambda item: (0 if recruitment_application_state(item) == "OPEN" else 1, item.apply_end_at, item.created_at),
    )[:4]
    recent_activities = organization.activities.filter(
        publication_state=Activity.PublicationState.PUBLISHED,
        start_at__gte=timezone.now(),
    ).select_related("cover_asset", "organizer_organization")[:3]
    payload.update(
        {
            "description_md": organization.description_md,
            "banner": media_ref(organization.banner_asset, request),
            "public_contact": organization.public_contact,
            "advisors": [_advisor_card(m, request) for m in advisors],
            "leaders": [_advisor_card(m, request) for m in leaders],
            "current_recruitments": [serialize_recruitment(item, request) for item in ordered_recruitments],
            "recent_activities": [serialize_activity(item, request) for item in recent_activities],
            "is_leader": is_leader,
            "can_manage": can_manage,
            "current_user_organization_role": current_user_role,
        }
    )
    return payload


def serialize_activity(activity: Activity, request: Request) -> dict[str, Any]:
    registered_count: int | None = None
    if is_authenticated(request):
        registered_count = activity_registered_count(activity)
    return {
        "id": str(activity.id),
        "title": activity.title,
        "activity_type": activity.activity_type,
        "summary": activity.summary,
        "organizer_organization_id": str(activity.organizer_organization_id) if activity.organizer_organization_id else None,
        "organizer_name": activity.organizer_name,
        "speaker": activity.speaker,
        "location": activity.location,
        "start_at": activity.start_at,
        "end_at": activity.end_at,
        "cover": media_ref(activity.cover_asset, request),
        "registration_required": activity.registration_required,
        "registration_state": activity_registration_state(activity),
        "capacity": activity.capacity,
        "registered_count": registered_count,
        "publication_state": activity.publication_state,
    }


def serialize_activity_detail(activity: Activity, request: Request) -> dict[str, Any]:
    payload = serialize_activity(activity, request)
    registered: bool | None = None
    if is_authenticated(request):
        registered = activity.registrations.filter(user=request.user, status=Registration.Status.REGISTERED).exists()
    related_announcements = activity.announcements.filter(
        publication_state=Announcement.PublicationState.PUBLISHED
    ).order_by("-is_pinned", "-published_at")
    payload.update(
        {
            "description_md": activity.description_md,
            "registration_start_at": activity.registration_start_at,
            "registration_end_at": activity.registration_end_at,
            "notes_md": activity.notes_md,
            "event_phase": event_phase(activity.start_at, activity.end_at),
            "registered": registered,
            "related_announcements": [serialize_announcement(item, request) for item in related_announcements],
        }
    )
    return payload


def _linked_object_for(announcement: Announcement) -> dict[str, str] | None:
    if announcement.competition_id and announcement.competition.publication_state == Competition.PublicationState.PUBLISHED:
        return {
            "type": "COMPETITION",
            "id": str(announcement.competition_id),
            "title": announcement.competition.name,
            "path": f"/competitions/{announcement.competition_id}",
        }
    if announcement.activity_id and announcement.activity.publication_state == Activity.PublicationState.PUBLISHED:
        return {
            "type": "ACTIVITY",
            "id": str(announcement.activity_id),
            "title": announcement.activity.title,
            "path": f"/activities/{announcement.activity_id}",
        }
    if announcement.organization_id and announcement.organization.is_active:
        return {
            "type": "ORGANIZATION",
            "id": str(announcement.organization_id),
            "title": announcement.organization.name,
            "path": f"/organizations/{announcement.organization_id}",
        }
    if (
        announcement.recruitment_id
        and announcement.recruitment.publication_state == Recruitment.PublicationState.PUBLISHED
        and announcement.recruitment.organization.is_active
    ):
        return {
            "type": "RECRUITMENT",
            "id": str(announcement.recruitment_id),
            "title": announcement.recruitment.title,
            "path": f"/recruitments/{announcement.recruitment_id}",
        }
    return None


def serialize_announcement(announcement: Announcement, request: Request) -> dict[str, Any]:
    return {
        "id": str(announcement.id),
        "title": announcement.title,
        "summary": announcement.summary,
        "published_at": announcement.published_at,
        "is_pinned": announcement.is_pinned,
        "publisher_scope": announcement.publisher_scope,
        "source_name": announcement.source_name,
        "external_url": announcement.external_url,
        "linked_object": _linked_object_for(announcement),
    }


def serialize_announcement_detail(announcement: Announcement, request: Request) -> dict[str, Any]:
    payload = serialize_announcement(announcement, request)
    payload["body_md"] = announcement.body_md
    return payload


def serialize_guide(guide: GuideArticle, request: Request) -> dict[str, Any]:
    return {
        "id": str(guide.id),
        "title": guide.title,
        "category": guide.category,
        "summary": guide.summary,
        "published_at": guide.published_at,
        "is_featured": guide.is_featured,
        "featured_order": guide.featured_order,
    }


def serialize_guide_detail(guide: GuideArticle, request: Request) -> dict[str, Any]:
    payload = serialize_guide(guide, request)
    links = guide.competition_links.select_related("competition").filter(
        competition__publication_state=Competition.PublicationState.PUBLISHED
    ).order_by("sort_order", "created_at")
    payload.update(
        {
            "body_md": guide.body_md,
            "related_competitions": [
                {
                    "type": "COMPETITION",
                    "id": str(link.competition_id),
                    "title": link.competition.name,
                    "path": f"/competitions/{link.competition_id}",
                }
                for link in links
            ],
        }
    )
    return payload


def serialize_faq(faq: FaqItem, request: Request) -> dict[str, Any]:
    return {
        "id": str(faq.id),
        "category": faq.category,
        "question": faq.question,
        "answer_md": faq.answer_md,
        "sort_order": faq.sort_order,
        "is_featured": faq.is_featured,
        "featured_order": faq.featured_order,
    }


def serialize_banner(banner: HomepageBanner, request: Request) -> dict[str, Any]:
    return {
        "id": str(banner.id),
        "title": banner.title,
        "subtitle": banner.subtitle,
        "category_label": banner.category_label,
        "image": media_ref(banner.image_asset, request),
        "alt_text": banner.alt_text,
        "link_type": banner.link_type,
        "internal_path": banner.internal_path,
        "external_url": banner.external_url,
    }


def serialize_competition_detail(competition: Competition, request: Request) -> dict[str, Any]:
    payload = serialize_competition(competition, request)
    guides = GuideArticle.objects.filter(
        publication_state=GuideArticle.PublicationState.PUBLISHED,
        competition_links__competition=competition,
    ).distinct().order_by("-is_featured", "featured_order", "-published_at")
    announcements = competition.announcements.filter(
        publication_state=Announcement.PublicationState.PUBLISHED
    ).select_related("competition", "activity", "organization", "recruitment__organization").order_by("-is_pinned", "-published_at")
    teams = competition.team_posts.filter(status=TeamPost.Status.RECRUITING).select_related(
        "competition", "author", "author__profile", "author__profile__avatar_asset"
    ).prefetch_related("roles").order_by("-created_at")[:4]
    payload.update(
        {
            "description_md": competition.description_md,
            "suitable_for_md": competition.suitable_for_md,
            "preparation_advice_md": competition.preparation_advice_md,
            "registration_url": competition.registration_url,
            "official_notice_url": competition.official_notice_url,
            "college_organized": competition.college_organized,
            "college_contact_name": competition.college_contact_name,
            "college_contact_text": competition.college_contact_text,
            "timeline": [
                serialize_timeline_event(event)
                for event in competition.timeline_events.all().order_by("sort_order", "event_at", "created_at")
            ],
            "related_guides": [serialize_guide(guide, request) for guide in guides],
            "related_announcements": [serialize_announcement(item, request) for item in announcements],
            "team_posts": [serialize_team_post(team, request) for team in teams],
        }
    )
    return payload


def serialize_site_document(document: SiteDocument, request: Request) -> dict[str, Any]:
    return {
        "id": str(document.id),
        "slug": document.slug,
        "title": document.title,
        "category": document.category,
        "summary": document.summary,
        "published_at": document.published_at,
        "version": document.version,
        "updated_at": document.updated_at,
    }


def serialize_site_document_detail(document: SiteDocument, request: Request) -> dict[str, Any]:
    payload = serialize_site_document(document, request)
    payload.update({"body_md": document.body_md})
    return payload
