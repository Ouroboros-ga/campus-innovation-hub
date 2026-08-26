"""Root URL configuration for BE-001 infrastructure and BE-002 authentication."""

from django.contrib import admin
from django.urls import include, path

from apps.accounts import views as account_views
from apps.core.views import HealthCheckView, ReadinessCheckView


urlpatterns = [
    path("api/health", HealthCheckView.as_view(), name="api-health"),
    path("api/ready", ReadinessCheckView.as_view(), name="api-ready"),
    path("api/", include("apps.organization_api.urls")),
    path("api/", include("apps.student_api.urls")),
    path("api/", include("apps.ops_api.urls")),
    path("api/", include("apps.public_api.urls")),
    path("api/auth/csrf", account_views.csrf, name="auth-csrf"),
    path("api/auth/register", account_views.register, name="auth-register"),
    path("api/auth/login", account_views.sign_in, name="auth-login"),
    path("api/auth/logout", account_views.sign_out, name="auth-logout"),
    path("api/auth/me", account_views.me, name="auth-me"),
    path("admin/", admin.site.urls),
]

handler400 = "apps.core.errors.api_bad_request"
handler403 = "apps.core.errors.api_permission_denied"
handler404 = "apps.core.errors.api_not_found"
handler500 = "apps.core.errors.api_server_error"
