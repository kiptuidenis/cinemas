"""Root URL Configuration for Cinema Management Platform API."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path


def root_health_check(request):
    """Basic root API health check endpoint."""
    return JsonResponse(
        {
            "status": "healthy",
            "service": "cinema-management-api",
            "version": "v1",
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", root_health_check, name="api-health"),
]
