"""BE-010 公共读取路由。"""

from django.urls import path

from apps.public_api import views


urlpatterns = [
    path("home", views.HomeView.as_view(), name="public-home"),
    path("competitions", views.CompetitionListView.as_view(), name="public-competition-list"),
    path("competitions/<str:object_id>", views.CompetitionDetailView.as_view(), name="public-competition-detail"),
    path("organizations", views.OrganizationListView.as_view(), name="public-organization-list"),
    path(
        "organizations/<str:object_id>/recruitments",
        views.OrganizationRecruitmentListView.as_view(),
        name="public-organization-recruitment-list",
    ),
    path("organizations/<str:object_id>", views.OrganizationDetailView.as_view(), name="public-organization-detail"),
    path("recruitments/<str:object_id>", views.RecruitmentDetailView.as_view(), name="public-recruitment-detail"),
    path("teams", views.TeamListView.as_view(), name="public-team-list"),
    path("teams/<str:object_id>", views.TeamDetailView.as_view(), name="public-team-detail"),
    path("activities", views.ActivityListView.as_view(), name="public-activity-list"),
    path("activities/<str:object_id>", views.ActivityDetailView.as_view(), name="public-activity-detail"),
    path("guides", views.GuideListView.as_view(), name="public-guide-list"),
    path("guides/<str:object_id>", views.GuideDetailView.as_view(), name="public-guide-detail"),
    path("faqs", views.FaqListView.as_view(), name="public-faq-list"),
    path("announcements", views.AnnouncementListView.as_view(), name="public-announcement-list"),
    path("announcements/<str:object_id>", views.AnnouncementDetailView.as_view(), name="public-announcement-detail"),
    path("search", views.SearchView.as_view(), name="public-search"),
]
