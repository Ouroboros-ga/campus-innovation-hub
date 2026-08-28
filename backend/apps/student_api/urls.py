"""BE-020 学生 API 路由。

注意：/api/teams 与 public_api 共享路径——GET 走公开列表，POST/close 走本文件（需 LOGIN）。
  覆盖顺序见 config/urls.py include 先后；功能等价，后续分歧应合并为单一视图。
"""

from django.urls import path

from apps.student_api import views


urlpatterns = [
    path("me", views.MeOverviewView.as_view(), name="me-overview"),
    path("me/profile", views.MeProfileView.as_view(), name="me-profile"),
    path("me/follows", views.MeFollowListView.as_view(), name="me-follows"),
    path("me/teams", views.MeTeamListView.as_view(), name="me-teams"),
    path("me/applications", views.MeApplicationListView.as_view(), name="me-applications"),
    path("me/activities", views.MeActivityListView.as_view(), name="me-activities"),
    path("me/questions", views.MeConsultationListView.as_view(), name="me-questions"),
    path("me/organizations", views.MeOrganizationListView.as_view(), name="me-organizations"),
    path("competitions/<str:object_id>/follow", views.CompetitionFollowView.as_view(), name="competition-follow"),
    path("teams", views.TeamCollectionView.as_view(), name="team-collection"),
    path("teams/<str:object_id>", views.TeamDetailWriteView.as_view(), name="team-write-detail"),
    path("teams/<str:object_id>/close", views.TeamCloseView.as_view(), name="team-close"),
    path("teams/<str:object_id>/applications", views.TeamApplicationCollectionView.as_view(), name="team-application-collection"),
    path("team-applications/<str:object_id>/accept", views.TeamApplicationAcceptView.as_view(), name="team-application-accept"),
    path("team-applications/<str:object_id>/reject", views.TeamApplicationRejectView.as_view(), name="team-application-reject"),
    path("team-applications/<str:object_id>/withdraw", views.TeamApplicationWithdrawView.as_view(), name="team-application-withdraw"),
    path("recruitments/<str:object_id>/applications", views.RecruitmentApplicationCreateView.as_view(), name="recruitment-application-create"),
    path(
        "recruitment-applications/<str:object_id>/withdraw",
        views.RecruitmentApplicationWithdrawView.as_view(),
        name="recruitment-application-withdraw",
    ),
    path("activities/<str:object_id>/register", views.ActivityRegistrationView.as_view(), name="activity-register"),
    path(
        "activities/<str:object_id>/cancel-registration",
        views.ActivityRegistrationCancelView.as_view(),
        name="activity-cancel-registration",
    ),
    path("consultations", views.ConsultationCollectionView.as_view(), name="consultation-collection"),
    path("consultations/<str:object_id>", views.ConsultationDetailView.as_view(), name="consultation-detail"),
    path("notifications/unread-count", views.NotificationUnreadCountView.as_view(), name="notification-unread-count"),
    path("notifications/read-all", views.NotificationReadAllView.as_view(), name="notification-read-all"),
    path("notifications/<str:object_id>/read", views.NotificationReadView.as_view(), name="notification-read"),
    path("notifications", views.NotificationListView.as_view(), name="notification-list"),
    path("media/upload", views.MediaUploadView.as_view(), name="media-upload"),
]
