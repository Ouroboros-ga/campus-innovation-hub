"""Root URL configuration for infrastructure endpoints only in BE-001."""

from django.urls import path

from apps.core.views import HealthCheckView


urlpatterns = [
    path("api/health", HealthCheckView.as_view(), name="api-health"),
]

handler400 = "apps.core.errors.api_bad_request"
handler403 = "apps.core.errors.api_permission_denied"
handler404 = "apps.core.errors.api_not_found"
handler500 = "apps.core.errors.api_server_error"
