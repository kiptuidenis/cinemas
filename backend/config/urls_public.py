"""
Public Schema URL Configuration.
Handles marketing, platform administration, cinema onboarding/registration, and platform health checks.
"""

from django.contrib import admin
from django.http import HttpRequest, JsonResponse
from django.urls import path


def public_health_check(request: HttpRequest) -> JsonResponse:
    """Health check endpoint for public platform schema."""
    return JsonResponse(
        {
            "status": "healthy",
            "service": "cinema-management-api",
            "schema": "public",
            "tenant": "public",
            "version": "v1",
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", public_health_check, name="public-api-health"),
]
