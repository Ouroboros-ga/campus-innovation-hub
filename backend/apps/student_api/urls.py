"""BE-020 学生 API 路由。"""

from django.urls import path

from apps.student_api import views


urlpatterns = [
    path("competitions/<str:object_id>/follow", views.CompetitionFollowView.as_view(), name="competition-follow"),
    path("teams", views.TeamCollectionView.as_view(), name="team-collection"),
    path("teams/<str:object_id>", views.TeamDetailWriteView.as_view(), name="team-write-detail"),
    path("teams/<str:object_id>/close", views.TeamCloseView.as_view(), name="team-close"),
    path("teams/<str:object_id>/applications", views.TeamApplicationCreateView.as_view(), name="team-application-create"),
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
