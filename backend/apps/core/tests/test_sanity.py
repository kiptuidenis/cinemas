"""
Sanity tests validating Django environment configuration, core middleware, and health endpoints.
"""

import uuid

import pytest
from django.conf import settings
from django.test import Client

from apps.core.context import get_current_tenant_id


@pytest.mark.django_db
def test_django_environment_sanity() -> None:
    """Verify that Django settings are properly initialized."""
    assert settings.SECRET_KEY is not None
    assert "apps.core.apps.CoreConfig" in settings.INSTALLED_APPS
    assert settings.TIME_ZONE == "Africa/Nairobi"


def test_health_check_endpoint() -> None:
    """Verify that the baseline health check API responds with 200 OK and valid JSON."""
    client = Client()
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "cinema-management-api"


def test_request_id_middleware_generates_header() -> None:
    """Verify that RequestIDMiddleware attaches a valid X-Request-ID header to responses."""
    client = Client()
    response = client.get("/api/v1/health/")
    assert "X-Request-ID" in response.headers
    # Validate it is a valid UUID format
    parsed_uuid = uuid.UUID(response.headers["X-Request-ID"])
    assert str(parsed_uuid) == response.headers["X-Request-ID"]


def test_tenant_context_middleware_header_resolution() -> None:
    """Verify that TenantContextMiddleware parses and isolates tenant context from headers."""
    client = Client()
    test_tenant_id = uuid.uuid4()
    response = client.get("/api/v1/health/", HTTP_X_CINEMA_ID=str(test_tenant_id))
    assert response.status_code == 200
    # After request completes, the context should be cleared cleanly
    assert get_current_tenant_id() is None
