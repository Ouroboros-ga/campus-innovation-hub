"""BE-040 运营路由；避免与公开读取路由共享同一资源前缀。"""

from django.urls import path

from apps.ops_api import activity_views, competition_views, consultation_views, content_views


urlpatterns = [
    path("ops/competitions", competition_views.CompetitionCollectionView.as_view(), name="ops-competition-collection"),
    path("ops/competitions/<str:object_id>", competition_views.CompetitionDetailView.as_view(), name="ops-competition-detail"),
    path("ops/competitions/<str:object_id>/publish", competition_views.CompetitionPublishView.as_view(), name="ops-competition-publish"),
    path("ops/competitions/<str:object_id>/cancel", competition_views.CompetitionCancelView.as_view(), name="ops-competition-cancel"),
    path("ops/competitions/<str:object_id>/archive", competition_views.CompetitionArchiveView.as_view(), name="ops-competition-archive"),
    path("ops/competitions/<str:object_id>/featured", competition_views.CompetitionFeaturedView.as_view(), name="ops-competition-featured"),
    path("ops/competitions/<str:object_id>/timeline-events", competition_views.CompetitionTimelineCollectionView.as_view(), name="ops-competition-timeline-collection"),
    path("ops/competitions/<str:object_id>/timeline-events/<str:event_id>", competition_views.CompetitionTimelineDetailView.as_view(), name="ops-competition-timeline-detail"),
    path("ops/activities", activity_views.ActivityCollectionView.as_view(), name="ops-activity-collection"),
    path("ops/activities/<str:object_id>", activity_views.ActivityDetailView.as_view(), name="ops-activity-detail"),
    path("ops/activities/<str:object_id>/publish", activity_views.ActivityPublishView.as_view(), name="ops-activity-publish"),
    path("ops/activities/<str:object_id>/cancel", activity_views.ActivityCancelView.as_view(), name="ops-activity-cancel"),
    path("ops/activities/<str:object_id>/archive", activity_views.ActivityArchiveView.as_view(), name="ops-activity-archive"),
    path("ops/activities/<str:object_id>/close-registration", activity_views.ActivityCloseRegistrationView.as_view(), name="ops-activity-close-registration"),
    path("ops/activities/<str:object_id>/featured", activity_views.ActivityFeaturedView.as_view(), name="ops-activity-featured"),
    path("ops/activities/<str:object_id>/registrations", activity_views.ActivityRegistrationCollectionView.as_view(), name="ops-activity-registration-collection"),
    path("ops/activities/<str:object_id>/export-registrations", activity_views.ActivityRegistrationExportView.as_view(), name="ops-activity-registration-export"),
    path("ops/dynamics/activity-with-announcement", activity_views.DynamicActivityAnnouncementView.as_view(), name="ops-dynamic-activity-announcement"),
    path("ops/announcements", content_views.AnnouncementCollectionView.as_view(), name="ops-announcement-collection"),
    path("ops/announcements/<str:object_id>", content_views.AnnouncementDetailView.as_view(), name="ops-announcement-detail"),
    path("ops/announcements/<str:object_id>/publish", content_views.AnnouncementPublishView.as_view(), name="ops-announcement-publish"),
    path("ops/announcements/<str:object_id>/archive", content_views.AnnouncementArchiveView.as_view(), name="ops-announcement-archive"),
    path("ops/guides", content_views.GuideCollectionView.as_view(), name="ops-guide-collection"),
    path("ops/guides/<str:object_id>", content_views.GuideDetailView.as_view(), name="ops-guide-detail"),
    path("ops/guides/<str:object_id>/publish", content_views.GuidePublishView.as_view(), name="ops-guide-publish"),
    path("ops/guides/<str:object_id>/archive", content_views.GuideArchiveView.as_view(), name="ops-guide-archive"),
    path("ops/guides/<str:object_id>/featured", content_views.GuideFeaturedView.as_view(), name="ops-guide-featured"),
    path("ops/faq", content_views.FaqCollectionView.as_view(), name="ops-faq-collection"),
    path("ops/faq/<str:object_id>", content_views.FaqDetailView.as_view(), name="ops-faq-detail"),
    path("ops/faq/<str:object_id>/publish", content_views.FaqPublishView.as_view(), name="ops-faq-publish"),
    path("ops/faq/<str:object_id>/archive", content_views.FaqArchiveView.as_view(), name="ops-faq-archive"),
    path("ops/faq/<str:object_id>/featured", content_views.FaqFeaturedView.as_view(), name="ops-faq-featured"),
    path("ops/banners", content_views.BannerCollectionView.as_view(), name="ops-banner-collection"),
    path("ops/banners/<str:object_id>", content_views.BannerDetailView.as_view(), name="ops-banner-detail"),
    path("ops/consultations", consultation_views.ConsultationCollectionView.as_view(), name="ops-consultation-collection"),
    path("ops/consultations/<str:object_id>", consultation_views.ConsultationDetailView.as_view(), name="ops-consultation-detail"),
    path("ops/consultations/<str:object_id>/replies", consultation_views.ConsultationReplyView.as_view(), name="ops-consultation-reply"),
]
