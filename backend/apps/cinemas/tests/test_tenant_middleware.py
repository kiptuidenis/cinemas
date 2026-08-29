"""
Integration tests for django-tenants subdomain routing middleware and dual URLConf.
Verifies that HTTP Host headers correctly route requests to the public schema or
dedicated tenant schemas for arbitrary cinema locations, and that unregistered domains return 404.
"""

from collections.abc import Generator

import pytest
from django.db import connection
from django.test import Client

from apps.cinemas.models import CinemaDomain, CinemaTenant


@pytest.fixture
def setup_tenants(db: None) -> Generator[dict[str, CinemaTenant]]:
    """Seed public platform tenant and two distinct cinema tenants for routing tests."""
    getattr(connection, "set_schema_to_public", lambda: None)()

    # 1. Public Tenant
    public_tenant, _ = CinemaTenant.objects.get_or_create(
        schema_name="public",
        defaults={
            "name": "Africinemas Hub",
            "slug": "public",
            "city": "Nairobi",
            "contact_email": "admin@africinemas.com",
        },
    )
    CinemaDomain.objects.get_or_create(
        domain="localhost",
        defaults={"tenant": public_tenant, "is_primary": True},
    )
    CinemaDomain.objects.get_or_create(
        domain="africinemas.com",
        defaults={"tenant": public_tenant, "is_primary": False},
    )

    # 2. Westgate Cinema Tenant
    westgate_tenant = CinemaTenant.objects.create(
        name="Westgate Cinema",
        slug="westgate",
        city="Nairobi",
        contact_email="ops@westgatecinema.co.ke",
    )
    CinemaDomain.objects.create(
        domain="westgate.localhost",
        tenant=westgate_tenant,
        is_primary=True,
    )
    CinemaDomain.objects.create(
        domain="westgate.africinemas.com",
        tenant=westgate_tenant,
        is_primary=False,
    )

    # 3. Mega Mall Kisumu Tenant
    mega_tenant = CinemaTenant.objects.create(
        name="Mega Mall Kisumu",
        slug="mega-kisumu",
        city="Kisumu",
        contact_email="ops@megacinema.co.ke",
    )
    CinemaDomain.objects.create(
        domain="mega.localhost",
        tenant=mega_tenant,
        is_primary=True,
    )

    yield {
        "public": public_tenant,
        "westgate": westgate_tenant,
        "mega": mega_tenant,
    }

    getattr(connection, "set_schema_to_public", lambda: None)()


@pytest.mark.django_db
@pytest.mark.parametrize("host", ["localhost", "africinemas.com"])
def test_public_domain_routes_to_public_schema(
    setup_tenants: dict[str, CinemaTenant], host: str
) -> None:
    """Verify that requests to the platform apex domain or localhost route to the public schema."""
    client = Client(headers={"host": host})
    response = client.get("/api/v1/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["schema"] == "public"
    assert getattr(connection, "schema_name", "public") == "public"


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("host", "expected_schema", "expected_slug"),
    [
        ("westgate.localhost", "tenant_westgate", "westgate"),
        ("westgate.africinemas.com", "tenant_westgate", "westgate"),
        ("mega.localhost", "tenant_mega_kisumu", "mega-kisumu"),
    ],
)
def test_arbitrary_subdomain_routes_to_respective_tenant_schema(
    setup_tenants: dict[str, CinemaTenant],
    host: str,
    expected_schema: str,
    expected_slug: str,
) -> None:
    """Verify that requests with cinema subdomains route to their respective tenant schemas."""
    client = Client(headers={"host": host})
    response = client.get("/api/v1/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["schema"] == expected_schema
    assert data["tenant_slug"] == expected_slug
    assert getattr(connection, "schema_name", "") == expected_schema


@pytest.mark.django_db
def test_unregistered_subdomain_returns_404(setup_tenants: dict[str, CinemaTenant]) -> None:
    """Verify that visiting an unmapped/unregistered subdomain returns HTTP 404 cleanly."""
    client = Client(headers={"host": "non-existent-mall.localhost"})
    response = client.get("/api/v1/health/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_setup_public_tenant_management_command() -> None:
    """Verify setup_public_tenant command idempotently provisions public tenant and domains."""
    from io import StringIO

    from django.core.management import call_command

    out = StringIO()
    call_command("setup_public_tenant", stdout=out)
    output = out.getvalue()

    assert "Africinemas Platform Hub" in output
    assert CinemaTenant.objects.filter(schema_name="public").exists()
    assert CinemaDomain.objects.filter(domain="localhost", tenant__schema_name="public").exists()
    assert CinemaDomain.objects.filter(
        domain="africinemas.com", tenant__schema_name="public"
    ).exists()
