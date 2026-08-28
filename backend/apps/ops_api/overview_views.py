"""运营工作台聚合统计（4 页仪表所需真实计数）。"""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response

from apps.activities.models import Activity
from apps.competitions.models import Competition
from apps.consultations.models import Consultation
from apps.content.models import Announcement, GuideArticle
from apps.ops_api.base import OperatorAPIView
from apps.organizations.models import Recruitment, RecruitmentApplication
from apps.teams.models import TeamApplication


class WorkbenchStatsView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        now = timezone.now()
        # 待办
        pending_recruitment_apps = RecruitmentApplication.objects.filter(status=RecruitmentApplication.Status.PENDING).count()
        pending_team_apps = TeamApplication.objects.filter(status=TeamApplication.Status.PENDING).count()
        pending_applications = pending_recruitment_apps + pending_team_apps
        pending_consultations = Consultation.objects.filter(status=Consultation.Status.OPEN).count()
        # 内容待发布 = 各表 DRAFT 计数
        draft_competitions = Competition.objects.filter(publication_state=Competition.PublicationState.DRAFT).count()
        draft_activities = Activity.objects.filter(publication_state=Activity.PublicationState.DRAFT).count()
        draft_announcements = Announcement.objects.filter(publication_state=Announcement.PublicationState.DRAFT).count()
        draft_guides = GuideArticle.objects.filter(publication_state=GuideArticle.PublicationState.DRAFT).count()
        pending_publish = draft_competitions + draft_activities + draft_announcements + draft_guides

        # 内容概览
        total_comp = Competition.objects.count()
        total_act = Activity.objects.count()
        total_ann = Announcement.objects.count()
        total_guide = GuideArticle.objects.count()
        total = total_comp + total_act + total_ann + total_guide
        published = (
            Competition.objects.filter(publication_state=Competition.PublicationState.PUBLISHED).count()
            + Activity.objects.filter(publication_state=Activity.PublicationState.PUBLISHED).count()
            + Announcement.objects.filter(publication_state=Announcement.PublicationState.PUBLISHED).count()
            + GuideArticle.objects.filter(publication_state=GuideArticle.PublicationState.PUBLISHED).count()
        )
        draft = pending_publish
        archived = (
            Competition.objects.filter(publication_state=Competition.PublicationState.ARCHIVED).count()
            + Activity.objects.filter(publication_state=Activity.PublicationState.ARCHIVED).count()
            + Announcement.objects.filter(publication_state=Announcement.PublicationState.ARCHIVED).count()
            + GuideArticle.objects.filter(publication_state=GuideArticle.PublicationState.ARCHIVED).count()
        )

        # 内容异常：缺封面 / 缺官网
        missing_cover = Competition.objects.filter(cover_asset__isnull=True).count() + Activity.objects.filter(cover_asset__isnull=True).count()
        missing_official = Competition.objects.filter(official_url__isnull=True, official_url__exact="").count() if hasattr(Competition, "official_url") else 0

        return Response(
            {
                "pending": {
                    "applications": pending_applications,
                    "consultations": pending_consultations,
                    "pending_publish": pending_publish,
                    "missing": missing_cover + missing_official,
                },
                "overview": {
                    "total": total,
                    "published": published,
                    "draft": draft,
                    "archived": archived,
                },
                "health": {
                    "missing_cover": missing_cover,
                    "missing_official_url": Competition.objects.filter(Q(official_url__isnull=True) | Q(official_url="")).count(),
                    "near_deadline": Competition.objects.filter(publication_state=Competition.PublicationState.PUBLISHED, registration_end_at__gte=now, registration_end_at__lte=now + timedelta(days=7)).count(),
                },
            }
        )


class CompetitionHealthView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        now = timezone.now()
        missing_cover = Competition.objects.filter(cover_asset__isnull=True).count()
        missing_official = Competition.objects.filter(Q(official_url__isnull=True) | Q(official_url="")).count()
        near_deadline = Competition.objects.filter(
            publication_state=Competition.PublicationState.PUBLISHED, registration_end_at__gte=now, registration_end_at__lte=now + timedelta(days=7)
        ).count()
        featured = Competition.objects.filter(is_featured=True).count()
        total = Competition.objects.count()
        complete = Competition.objects.exclude(cover_asset__isnull=True).exclude(Q(official_url__isnull=True) | Q(official_url="")).count()
        return Response(
            {
                "total": total,
                "missing_cover": missing_cover,
                "missing_official_url": missing_official,
                "near_deadline": near_deadline,
                "featured": featured,
                "featured_limit": 15,
                "complete": complete,
            }
        )


class DynamicsStatsView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        total_act = Activity.objects.count()
        total_ann = Announcement.objects.count()
        total = total_act + total_ann
        published_act = Activity.objects.filter(publication_state=Activity.PublicationState.PUBLISHED).count()
        published_ann = Announcement.objects.filter(publication_state=Announcement.PublicationState.PUBLISHED).count()
        published = published_act + published_ann
        draft_act = Activity.objects.filter(publication_state=Activity.PublicationState.DRAFT).count()
        draft_ann = Announcement.objects.filter(publication_state=Announcement.PublicationState.DRAFT).count()
        draft = draft_act + draft_ann
        archived_act = Activity.objects.filter(publication_state=Activity.PublicationState.ARCHIVED).count()
        archived_ann = Announcement.objects.filter(publication_state=Announcement.PublicationState.ARCHIVED).count()
        archived = archived_act + archived_ann
        cancelled = Activity.objects.filter(publication_state=Activity.PublicationState.CANCELLED).count()
        return Response(
            {
                "total": total,
                "published": published,
                "draft": draft,
                "archived": archived,
                "cancelled": cancelled,
                "activities": {"total": total_act, "published": published_act, "draft": draft_act},
                "announcements": {"total": total_ann, "published": published_ann, "draft": draft_ann},
            }
        )


class RecentAndDraftsView(OperatorAPIView):
    def get(self, request: Request) -> Response:
        from apps.content.models import GuideArticle

        # 最近发布：各表 PUBLISHED 按 updated_at 倒序取 5
        recent = []
        for model, label in [
            (Competition, "竞赛"),
            (Activity, "活动"),
            (Announcement, "公告"),
            (GuideArticle, "指南"),
        ]:
            items = model.objects.filter(publication_state="PUBLISHED").order_by("-updated_at")[:5]
            for it in items:
                recent.append(
                    {
                        "id": str(it.id),
                        "title": getattr(it, "name", getattr(it, "title", str(it.id))),
                        "type": label,
                        "updated_at": it.updated_at,
                        "publication_state": it.publication_state,
                    }
                )
        recent = sorted(recent, key=lambda x: x["updated_at"], reverse=True)[:5]

        drafts = []
        for model, label in [
            (Competition, "竞赛"),
            (Activity, "活动"),
            (Announcement, "公告"),
            (GuideArticle, "指南"),
        ]:
            items = model.objects.filter(publication_state="DRAFT").order_by("-updated_at")[:5]
            for it in items:
                drafts.append(
                    {
                        "id": str(it.id),
                        "title": getattr(it, "name", getattr(it, "title", str(it.id))),
                        "type": label,
                        "updated_at": it.updated_at,
                    }
                )
        drafts = sorted(drafts, key=lambda x: x["updated_at"], reverse=True)[:5]

        return Response({"recent": recent, "drafts": drafts})
