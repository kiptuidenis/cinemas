"""
Integration tests for the Tenant Bootstrap Public API (GET /api/v1/tenant/bootstrap/).
Validates that the active cinema's branding tokens, semantic styles, and payment capabilities
are correctly serialized, cached in Redis, and strictly sanitized of all private credentials.
"""

from collections.abc import Generator

import pytest
from django.core.cache import cache
from django.db import connection
from django.test import Client

from apps.cinemas.models import CinemaDomain, CinemaPaymentConfig, CinemaTenant, CinemaTheme


@pytest.fixture
def westgate_setup(db: None) -> Generator[dict[str, object]]:
    """Seed public tenant and Westgate cinema with customized theme and Daraja credentials."""
    getattr(connection, "set_schema_to_public", lambda: None)()
    cache.clear()

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

    # 2. Westgate Cinema Tenant
    westgate = CinemaTenant.objects.create(
        name="Westgate Cinema",
        slug="westgate",
        city="Nairobi",
        physical_address="2nd Floor, Westgate Shopping Mall, Westlands",
        contact_email="support@westgatecinema.co.ke",
        contact_phone="+254712345678",
    )
    CinemaDomain.objects.create(
        domain="westgate.localhost",
        tenant=westgate,
        is_primary=True,
    )
    CinemaDomain.objects.create(
        domain="westgate.africinemas.com",
        tenant=westgate,
        is_primary=False,
    )

    # Custom Theme
    theme = CinemaTheme.objects.create(
        tenant=westgate,
        primary_color="#F59E0B",  # Amber gold
        primary_hover="#D97706",
        secondary_color="#10B981",
        accent_color="#6366F1",
        background_color="#0D0D11",
        surface_color="#16161E",
        surface_elevated="#20202C",
        border_color="#2E2E3E",
        text_primary="#FFFFFF",
        text_muted="#A1A1AA",
        font_display="'Outfit', sans-serif",
        font_body="'Inter', sans-serif",
        border_radius="12px",
        logo_url="https://cdn.africinemas.com/westgate/logo.png",
        hero_backdrop_url="https://cdn.africinemas.com/westgate/banner.jpg",
    )

    # Payment config with private credentials
    payment_config = CinemaPaymentConfig.objects.create(
        tenant=westgate,
        gateway_mode=CinemaPaymentConfig.GatewayMode.DIRECT_DARAJA,
        daraja_shortcode="600999",
        daraja_consumer_key="private-consumer-key-xyz",
        daraja_consumer_secret="super-secret-key-123",  # noqa: S106
        daraja_passkey="test-passkey-abc",
        settlement_phone="+254700112233",
        settlement_bank_account="01100123456789",
    )

    yield {
        "tenant": westgate,
        "theme": theme,
        "payment": payment_config,
    }

    cache.clear()
    getattr(connection, "set_schema_to_public", lambda: None)()


@pytest.mark.django_db
def test_bootstrap_returns_200_and_full_theme_tokens(westgate_setup: dict[str, object]) -> None:
    """Verify that GET /api/v1/tenant/bootstrap/ returns 200 with full cinema details and theme tokens."""
    client = Client(headers={"host": "westgate.localhost"})
    response = client.get("/api/v1/tenant/bootstrap/")

    assert response.status_code == 200
    data = response.json()

    # 1. Cinema Identity
    assert "cinema" in data
    cinema_data = data["cinema"]
    assert cinema_data["name"] == "Westgate Cinema"
    assert cinema_data["slug"] == "westgate"
    assert cinema_data["city"] == "Nairobi"
    assert cinema_data["physical_address"] == "2nd Floor, Westgate Shopping Mall, Westlands"
    assert cinema_data["contact_email"] == "support@westgatecinema.co.ke"
    assert cinema_data["contact_phone"] == "+254712345678"

    # 2. Dynamic Theme Tokens
    assert "theme" in data
    theme_data = data["theme"]
    assert theme_data["primary_color"] == "#F59E0B"
    assert theme_data["primary_hover"] == "#D97706"
    assert theme_data["secondary_color"] == "#10B981"
    assert theme_data["background_color"] == "#0D0D11"
    assert theme_data["surface_color"] == "#16161E"
    assert theme_data["border_radius"] == "12px"
    assert theme_data["logo_url"] == "https://cdn.africinemas.com/westgate/logo.png"
    assert theme_data["hero_backdrop_url"] == "https://cdn.africinemas.com/westgate/banner.jpg"

    # 3. CSS Variables dictionary
    assert "css_variables" in theme_data
    css_vars = theme_data["css_variables"]
    assert css_vars["--color-primary"] == "#F59E0B"
    assert css_vars["--bg-app"] == "#0D0D11"
    assert css_vars["--radius-md"] == "12px"

    # 4. Sanitized Payment Capabilities
    assert "payment" in data
    payment_data = data["payment"]
    assert payment_data["gateway_mode"] == "DIRECT_DARAJA"
    assert payment_data["accepts_mpesa"] is True


@pytest.mark.django_db
def test_bootstrap_sanitizes_sensitive_credentials(westgate_setup: dict[str, object]) -> None:
    """Verify that private keys, secrets, passkeys, and bank accounts are never leaked in bootstrap."""
    client = Client(headers={"host": "westgate.localhost"})
    response = client.get("/api/v1/tenant/bootstrap/")

    assert response.status_code == 200
    raw_content = response.content.decode("utf-8")

    # None of the private strings should appear anywhere in the HTTP response body
    assert "private-consumer-key-xyz" not in raw_content
    assert "super-secret-key-123" not in raw_content
    assert "test-passkey-abc" not in raw_content
    assert "01100123456789" not in raw_content
    assert "daraja_consumer_key" not in raw_content
    assert "daraja_consumer_secret" not in raw_content
    assert "settlement_bank_account" not in raw_content


@pytest.mark.django_db
def test_bootstrap_handles_unconfigured_tenant_with_defaults() -> None:
    """Verify that newly registered cinema without custom theme or payment configs gets default luxury tokens."""
    getattr(connection, "set_schema_to_public", lambda: None)()
    new_cinema = CinemaTenant.objects.create(
        name="Nyali Cinemax",
        slug="nyali",
        city="Mombasa",
        contact_email="ops@nyali.co.ke",
    )
    CinemaDomain.objects.create(
        domain="nyali.localhost",
        tenant=new_cinema,
        is_primary=True,
    )

    client = Client(headers={"host": "nyali.localhost"})
    response = client.get("/api/v1/tenant/bootstrap/")

    assert response.status_code == 200
    data = response.json()

    assert data["cinema"]["name"] == "Nyali Cinemax"
    # Auto-derived default tokens
    assert data["theme"]["primary_color"] == "#E61C24"  # African Ruby default
    assert data["theme"]["secondary_color"] == "#E5A93B"  # Savannah Gold default
    assert data["payment"]["gateway_mode"] == "INTASEND_ESCROW"
    assert data["payment"]["accepts_mpesa"] is True
    assert data["payment"]["accepts_card"] is True


@pytest.mark.django_db
def test_bootstrap_caching_and_cache_headers(westgate_setup: dict[str, object]) -> None:
    """Verify that bootstrap responses include Cache-Control and ETag headers and populate Redis cache."""
    client = Client(headers={"host": "westgate.localhost"})
    response = client.get("/api/v1/tenant/bootstrap/")
    assert response.status_code == 200
    assert "Cache-Control" in response.headers
    assert "public" in response.headers["Cache-Control"]
    assert "ETag" in response.headers

    # Verify Redis cache has populated key
    cached_data = cache.get("tenant:bootstrap:westgate")
    assert cached_data is not None
    assert cached_data["cinema"]["name"] == "Westgate Cinema"


@pytest.mark.django_db
def test_bootstrap_on_public_schema_returns_404() -> None:
    """Verify that accessing tenant bootstrap on public apex domain or localhost returns 404 cleanly."""
    getattr(connection, "set_schema_to_public", lambda: None)()
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

    client = Client(headers={"host": "localhost"})
    response = client.get("/api/v1/tenant/bootstrap/")

    assert response.status_code == 404


def test_bootstrap_security_throttling_scope() -> None:
    """Verify that TenantBootstrapView has scoped rate limiting applied per api-security skill."""
    from rest_framework.throttling import ScopedRateThrottle

    from apps.cinemas.views import TenantBootstrapView

    assert ScopedRateThrottle in TenantBootstrapView.throttle_classes
    assert TenantBootstrapView.throttle_scope == "bootstrap"
