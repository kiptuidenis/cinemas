"""
Tenant Schema URL Configuration.
Handles branded cinema storefront APIs, movie listings, showtimes, seat booking, and theme bootstrap.
"""

from django.db import connection
from django.http import HttpRequest, JsonResponse
from django.urls import path


def tenant_health_check(request: HttpRequest) -> JsonResponse:
    """Health check endpoint for active tenant schema."""
    tenant = getattr(request, "tenant", None)
    tenant_slug = getattr(tenant, "slug", "")
    tenant_name = getattr(tenant, "name", "")
    return JsonResponse(
        {
            "status": "healthy",
            "service": "cinema-management-api",
            "schema": getattr(connection, "schema_name", "unknown"),
            "tenant_slug": tenant_slug,
            "tenant_name": tenant_name,
            "version": "v1",
        }
    )


urlpatterns = [
    path("api/v1/health/", tenant_health_check, name="tenant-api-health"),
]
