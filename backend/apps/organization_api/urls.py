"""组织负责人工作台路由。"""

from django.urls import path

from apps.organization_api import views


urlpatterns = [
    path("manage/organizations/<str:organization_id>/profile", views.OrganizationProfileView.as_view(), name="manage-organization-profile"),
    path(
        "manage/organizations/<str:organization_id>/recruitments",
        views.RecruitmentCollectionView.as_view(),
        name="manage-recruitment-collection",
    ),
    path(
        "manage/organizations/<str:organization_id>/recruitments/<str:recruitment_id>",
        views.RecruitmentDetailView.as_view(),
        name="manage-recruitment-detail",
    ),
    path(
        "manage/organizations/<str:organization_id>/recruitments/<str:recruitment_id>/publish",
        views.RecruitmentPublishView.as_view(),
        name="manage-recruitment-publish",
    ),
    path(
        "manage/organizations/<str:organization_id>/recruitments/<str:recruitment_id>/cancel",
        views.RecruitmentCancelView.as_view(),
        name="manage-recruitment-cancel",
    ),
    path(
        "manage/organizations/<str:organization_id>/recruitments/<str:recruitment_id>/complete",
        views.RecruitmentCompleteView.as_view(),
        name="manage-recruitment-complete",
    ),
    path(
        "manage/organizations/<str:organization_id>/recruitments/<str:recruitment_id>/archive",
        views.RecruitmentArchiveView.as_view(),
        name="manage-recruitment-archive",
    ),
    path(
        "manage/organizations/<str:organization_id>/applications",
        views.RecruitmentApplicationCollectionView.as_view(),
        name="manage-recruitment-application-collection",
    ),
    path(
        "manage/organizations/<str:organization_id>/applications/<str:application_id>/accept",
        views.RecruitmentApplicationAcceptView.as_view(),
        name="manage-recruitment-application-accept",
    ),
    path(
        "manage/organizations/<str:organization_id>/applications/<str:application_id>/reject",
        views.RecruitmentApplicationRejectView.as_view(),
        name="manage-recruitment-application-reject",
    ),
]
