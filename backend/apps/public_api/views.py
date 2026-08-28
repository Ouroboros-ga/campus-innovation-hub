"""BE-010 的公共只读 View。"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from typing import Any

from django.db.models import Count, Exists, OuterRef, Q, QuerySet
from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition
from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner
from apps.organizations.models import Organization, Recruitment
from apps.teams.models import TeamApplication, TeamPost
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_bool,
    parse_optional_enum,
    parse_optional_text,
    parse_optional_uuid,
    parse_ordering,
    parse_uuid,
    validate_query_keys,
)
from apps.public_api.serializers import (
    activity_registration_state,
    competition_registration_state,
    event_phase,
    is_authenticated,
    recruitment_application_state,
    recruitment_open_filter,
    serialize_activity,
    serialize_activity_detail,
    serialize_announcement,
    serialize_announcement_detail,
    serialize_banner,
    serialize_competition,
    serialize_competition_detail,
    serialize_faq,
    serialize_guide,
    serialize_guide_detail,
    serialize_organization,
    serialize_organization_detail,
    serialize_recruitment,
    serialize_recruitment_detail,
    serialize_team_detail,
    serialize_team_post,
)


def published_competitions() -> QuerySet[Competition]:
    return Competition.objects.filter(publication_state=Competition.PublicationState.PUBLISHED).select_related("cover_asset")


def published_activities() -> QuerySet[Activity]:
    return Activity.objects.filter(publication_state=Activity.PublicationState.PUBLISHED).select_related(
        "cover_asset", "organizer_organization"
    ).annotate(registered_count_value=Count("registrations", filter=Q(registrations__status=Registration.Status.REGISTERED)))


def active_organizations() -> QuerySet[Organization]:
    return Organization.objects.filter(is_active=True).select_related("logo_asset", "banner_asset")


def published_recruitments() -> QuerySet[Recruitment]:
    return Recruitment.objects.filter(
        publication_state=Recruitment.PublicationState.PUBLISHED,
        organization__is_active=True,
    ).select_related("organization").annotate(position_count=Count("positions"))


def public_teams() -> QuerySet[TeamPost]:
    return TeamPost.objects.filter(competition__publication_state=Competition.PublicationState.PUBLISHED).select_related(
        "competition", "author", "author__profile", "author__profile__avatar_asset"
    ).prefetch_related("roles").annotate(
        accepted_count=Count("applications", filter=Q(applications__status=TeamApplication.Status.ACCEPTED))
    )


def published_announcements() -> QuerySet[Announcement]:
    return Announcement.objects.filter(publication_state=Announcement.PublicationState.PUBLISHED).select_related(
        "competition", "activity", "organization", "recruitment__organization"
    )


def published_guides() -> QuerySet[GuideArticle]:
    return GuideArticle.objects.filter(publication_state=GuideArticle.PublicationState.PUBLISHED)


def published_faqs() -> QuerySet[FaqItem]:
    return FaqItem.objects.filter(publication_state=FaqItem.PublicationState.PUBLISHED)


def get_visible(queryset: QuerySet[Any], object_id: str) -> Any:
    identifier = parse_uuid(object_id)
    instance = queryset.filter(id=identifier).first()
    if instance is None:
        raise NotFound("请求的资源不存在")
    return instance


def competition_status_filter(queryset: QuerySet[Competition], status: str | None, now: datetime) -> QuerySet[Competition]:
    if status is None:
        return queryset
    if status == "UPCOMING":
        return queryset.filter(registration_start_at__gt=now)
    if status == "OPEN":
        return queryset.filter(
            Q(registration_start_at__isnull=True) | Q(registration_start_at__lte=now),
            Q(registration_end_at__isnull=True) | Q(registration_end_at__gte=now),
        ).exclude(registration_start_at__isnull=True, registration_end_at__isnull=True)
    if status == "IN_PROGRESS":
        return queryset.filter(event_start_at__lte=now).filter(Q(event_end_at__isnull=True) | Q(event_end_at__gte=now))
    return queryset.filter(event_end_at__lt=now)


def activity_status_filter(queryset: QuerySet[Activity], status: str | None, now: datetime) -> QuerySet[Activity]:
    if status is None:
        return queryset
    if status == "UPCOMING":
        return queryset.filter(start_at__gt=now)
    if status == "ENDED":
        return queryset.filter(end_at__lt=now)
    return queryset.filter(
        registration_required=True,
        registration_start_at__lte=now,
    ).filter(Q(registration_end_at__isnull=True) | Q(registration_end_at__gte=now))


def recruitment_state_filter(queryset: QuerySet[Recruitment], status: str | None, now: datetime) -> QuerySet[Recruitment]:
    if status is None:
        return queryset
    if status == "OPEN":
        return queryset.filter(recruitment_open_filter(now))
    if status == "UPCOMING":
        return queryset.filter(apply_start_at__gt=now, completed_at__isnull=True)
    if status == "COMPLETED":
        return queryset.filter(completed_at__isnull=False)
    if status == "CLOSED":
        return queryset.filter(completed_at__isnull=True, apply_end_at__lt=now)
    return queryset.none()


class PublicReadView(APIView):
    permission_classes = [AllowAny]


class HomeView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, set())
        now = timezone.now()
        banners = HomepageBanner.objects.filter(is_active=True).filter(
            Q(start_at__isnull=True) | Q(start_at__lte=now),
            Q(end_at__isnull=True) | Q(end_at__gte=now),
        ).select_related("image_asset").order_by("sort_order", "-created_at")[:4]
        deadlines = published_competitions().filter(registration_end_at__gte=now).order_by("registration_end_at", "event_start_at")[:6]
        featured_competitions = published_competitions().filter(is_featured=True).order_by("featured_order", "-created_at")[:8]
        announcements = published_announcements().order_by("-is_pinned", "-published_at")[:6]
        guides = published_guides().filter(is_featured=True).order_by("featured_order", "-published_at")[:6]
        teams = public_teams().filter(status=TeamPost.Status.RECRUITING).order_by("-created_at")[:6]
        organizations = active_organizations().annotate(
            is_recruiting_value=Exists(
                Recruitment.objects.filter(organization=OuterRef("pk")).filter(recruitment_open_filter(now))
            )
        ).filter(is_recruiting_value=True).order_by("name")[:6]
        activities = published_activities().filter(start_at__gte=now).order_by("start_at")[:6]
        faqs = published_faqs().filter(is_featured=True).order_by("sort_order", "-created_at")[:6]
        return Response(
            {
                "banners": [serialize_banner(item, request) for item in banners],
                "deadlines": [serialize_competition(item, request) for item in deadlines],
                "featured_competitions": [serialize_competition(item, request) for item in featured_competitions],
                "announcements": [serialize_announcement(item, request) for item in announcements],
                "featured_guides": [serialize_guide(item, request) for item in guides],
                "team_posts": [serialize_team_post(item, request) for item in teams],
                "recruiting_organizations": [serialize_organization(item, request) for item in organizations],
                "activities": [serialize_activity(item, request) for item in activities],
                "faqs": [serialize_faq(item, request) for item in faqs],
            }
        )


class CompetitionListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "category", "participation_mode", "page", "page_size", "ordering"})
        now = timezone.now()
        status = parse_optional_enum(request, "status", {"UPCOMING", "OPEN", "IN_PROGRESS", "ENDED"})
        category = parse_optional_enum(request, "category", Competition.Category.values)
        mode = parse_optional_enum(request, "participation_mode", Competition.ParticipationMode.values)
        ordering = parse_ordering(request, {"registration_end_at", "-registration_end_at", "event_start_at", "-event_start_at"})
        queryset = filter_text(published_competitions(), parse_optional_text(request, "q"), ("name", "edition", "direction", "summary"))
        queryset = competition_status_filter(queryset, status, now)
        if category:
            queryset = queryset.filter(category=category)
        if mode:
            queryset = queryset.filter(participation_mode=mode)
        queryset = queryset.order_by(ordering or "registration_end_at", "event_start_at", "-created_at")
        return paginated_response(request, queryset, lambda item: serialize_competition(item, request))


class CompetitionDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        competition = get_visible(published_competitions().prefetch_related("timeline_events"), object_id)
        return Response(serialize_competition_detail(competition, request))


class TeamListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "competition_id", "post_type", "status", "page", "page_size"})
        competition_id = parse_optional_uuid(request, "competition_id")
        post_type = parse_optional_enum(request, "post_type", TeamPost.PostType.values)
        status = parse_optional_enum(request, "status", TeamPost.Status.values)
        queryset = filter_text(public_teams(), parse_optional_text(request, "q"), ("title", "direction", "team_name"))
        queryset = queryset.filter(status=status or TeamPost.Status.RECRUITING)
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        return paginated_response(request, queryset.order_by("-created_at"), lambda item: serialize_team_post(item, request))


class TeamDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        team = get_visible(public_teams(), object_id)
        return Response(serialize_team_detail(team, request))


class OrganizationListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "organization_type", "recruiting", "page", "page_size"})
        now = timezone.now()
        organization_type = parse_optional_enum(request, "organization_type", Organization.OrganizationType.values)
        recruiting = parse_optional_bool(request, "recruiting")
        queryset = active_organizations().annotate(
            is_recruiting_value=Exists(
                Recruitment.objects.filter(organization=OuterRef("pk")).filter(recruitment_open_filter(now))
            )
        )
        queryset = filter_text(queryset, parse_optional_text(request, "q"), ("name", "short_intro"))
        if organization_type:
            queryset = queryset.filter(organization_type=organization_type)
        if recruiting is not None:
            queryset = queryset.filter(is_recruiting_value=recruiting)
        return paginated_response(request, queryset.order_by("-is_recruiting_value", "name"), lambda item: serialize_organization(item, request))


class OrganizationDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        organization = get_visible(active_organizations(), object_id)
        return Response(serialize_organization_detail(organization, request))


class OrganizationRecruitmentListView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, {"status", "page", "page_size"})
        organization = get_visible(active_organizations(), object_id)
        status = parse_optional_enum(request, "status", {"UPCOMING", "OPEN", "CLOSED", "COMPLETED"})
        queryset = recruitment_state_filter(published_recruitments().filter(organization=organization), status, timezone.now())
        return paginated_response(request, queryset.order_by("apply_end_at", "-created_at"), lambda item: serialize_recruitment(item, request))


class RecruitmentDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        recruitment = get_visible(published_recruitments().prefetch_related("positions"), object_id)
        return Response(serialize_recruitment_detail(recruitment, request))


class ActivityListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "activity_type", "page", "page_size"})
        status = parse_optional_enum(request, "status", {"OPEN", "UPCOMING", "ENDED"})
        activity_type = parse_optional_enum(request, "activity_type", Activity.ActivityType.values)
        queryset = filter_text(published_activities(), parse_optional_text(request, "q"), ("title", "summary"))
        queryset = activity_status_filter(queryset, status, timezone.now())
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        return paginated_response(request, queryset.order_by("start_at"), lambda item: serialize_activity(item, request))


class ActivityDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        activity = get_visible(published_activities(), object_id)
        return Response(serialize_activity_detail(activity, request))


class GuideListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "category", "page", "page_size"})
        category = parse_optional_enum(request, "category", GuideArticle.Category.values)
        queryset = filter_text(published_guides(), parse_optional_text(request, "q"), ("title", "summary"))
        if category:
            queryset = queryset.filter(category=category)
        return paginated_response(request, queryset.order_by("-is_featured", "featured_order", "-published_at"), lambda item: serialize_guide(item, request))


class GuideDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        guide = get_visible(published_guides(), object_id)
        return Response(serialize_guide_detail(guide, request))


class FaqListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "category", "page", "page_size"})
        category = parse_optional_enum(request, "category", FaqItem.Category.values)
        queryset = filter_text(published_faqs(), parse_optional_text(request, "q"), ("question", "answer_md"))
        if category:
            queryset = queryset.filter(category=category)
        return paginated_response(request, queryset.order_by("sort_order", "-created_at"), lambda item: serialize_faq(item, request))


class AnnouncementListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "publisher_scope", "page", "page_size"})
        scope = parse_optional_enum(request, "publisher_scope", Announcement.PublisherScope.values)
        queryset = filter_text(published_announcements(), parse_optional_text(request, "q"), ("title", "summary"))
        if scope:
            queryset = queryset.filter(publisher_scope=scope)
        return paginated_response(request, queryset.order_by("-is_pinned", "-published_at"), lambda item: serialize_announcement(item, request))


class AnnouncementDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        announcement = get_visible(published_announcements(), object_id)
        return Response(serialize_announcement_detail(announcement, request))


class QaPublicListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "category", "page", "page_size"})
        from apps.consultations.models import Consultation

        category = parse_optional_enum(request, "category", Consultation.Category.values)
        queryset = Consultation.objects.filter(
            visibility=Consultation.Visibility.PUBLIC, status__in=[Consultation.Status.ANSWERED, Consultation.Status.CLOSED]
        ).select_related("author", "author__profile").prefetch_related("replies__author")
        queryset = filter_text(queryset, parse_optional_text(request, "q"), ("title", "body_md"))
        if category:
            queryset = queryset.filter(category=category)
        queryset = queryset.order_by("-answered_at", "-updated_at", "-id")

        def _serialize_public(item: Consultation) -> dict:
            # 复用已有的 detail 序列化，公开字段已受控
            from apps.student_api.serializers import serialize_consultation_detail

            return serialize_consultation_detail(item, request)

        return paginated_response(request, queryset, _serialize_public)


def _matched_field(item: Any, fields: tuple[str, ...], query: str) -> str:
    lowered = query.lower()
    for field in fields:
        value = getattr(item, field, None)
        if value is not None and lowered in str(value).lower():
            return field
    return fields[0]


class SearchView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "page", "page_size"})
        query = parse_optional_text(request, "q", max_length=100, required=True)
        assert query is not None
        search_results: list[dict[str, Any]] = []

        def append_results(
            queryset: QuerySet[Any],
            *,
            result_type: str,
            fields: tuple[str, ...],
            path: str,
            subtitle: Callable[[Any], str | None],
        ) -> None:
            for item in filter_text(queryset, query, fields):
                search_results.append(
                    {
                        "type": result_type,
                        "id": str(item.id),
                        "title": getattr(item, fields[0]),
                        "subtitle": subtitle(item),
                        "path": path.format(id=item.id),
                        "matched_field": _matched_field(item, fields, query),
                        "_created_at": item.created_at,
                    }
                )

        append_results(
            published_competitions(),
            result_type="COMPETITION",
            fields=("name", "edition", "direction", "summary"),
            path="/competitions/{id}",
            subtitle=lambda item: f"{item.level} · {item.participation_mode}",
        )
        append_results(
            active_organizations(),
            result_type="ORGANIZATION",
            fields=("name", "short_intro"),
            path="/organizations/{id}",
            subtitle=lambda item: item.organization_type,
        )
        append_results(
            published_recruitments(),
            result_type="RECRUITMENT",
            fields=("title", "intro_md"),
            path="/recruitments/{id}",
            subtitle=lambda item: item.organization.name,
        )
        append_results(
            public_teams(),
            result_type="TEAM_POST",
            fields=("title", "direction"),
            path="/teams/{id}",
            subtitle=lambda item: item.competition.name,
        )
        append_results(
            published_activities(),
            result_type="ACTIVITY",
            fields=("title", "summary"),
            path="/activities/{id}",
            subtitle=lambda item: item.activity_type,
        )
        append_results(
            published_faqs(),
            result_type="FAQ",
            fields=("question",),
            path="/faqs#{id}",
            subtitle=lambda item: item.category,
        )
        append_results(
            published_guides(),
            result_type="GUIDE",
            fields=("title", "summary"),
            path="/guides/{id}",
            subtitle=lambda item: item.category,
        )
        append_results(
            published_announcements(),
            result_type="ANNOUNCEMENT",
            fields=("title", "summary"),
            path="/announcements/{id}",
            subtitle=lambda item: item.publisher_scope,
        )
        type_order = {
            "COMPETITION": 0,
            "ORGANIZATION": 1,
            "RECRUITMENT": 2,
            "TEAM_POST": 3,
            "ACTIVITY": 4,
            "FAQ": 5,
            "GUIDE": 6,
            "ANNOUNCEMENT": 7,
        }
        search_results.sort(key=lambda item: (type_order[item["type"]], -item["_created_at"].timestamp()))
        return paginated_response(
            request,
            search_results,
            lambda item: {key: value for key, value in item.items() if key != "_created_at"},
        )
