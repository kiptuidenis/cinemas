"""
Tests for CinemaTenant, CinemaDomain, CinemaTheme, and CinemaPaymentConfig models.
Validates multi-tenant domain isolation, dynamic schema naming for arbitrary malls,
theme token initialization, and hybrid fintech configurations (IntaSend 10% vs Direct Daraja).
"""

import uuid
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.cinemas.models import CinemaDomain, CinemaPaymentConfig, CinemaTenant, CinemaTheme


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("name", "slug", "city", "expected_schema"),
    [
        ("Westgate Cinema", "westgate", "Nairobi", "tenant_westgate"),
        ("Mega Mall Cinema", "mega-kisumu", "Kisumu", "tenant_mega_kisumu"),
        ("Garden City IMAX", "garden-city", "Nairobi", "tenant_garden_city"),
        ("Rupa's Cinemas", "rupas", "Eldoret", "tenant_rupas"),
        ("Nyali Cinemax", "nyali-cinemax", "Mombasa", "tenant_nyali_cinemax"),
    ],
)
def test_dynamic_tenant_schema_creation_for_arbitrary_cinemas(
    name: str, slug: str, city: str, expected_schema: str
) -> None:
    """
    Assert that any cinema / mall location automatically generates a valid,
    sanitized PostgreSQL schema name (tenant_<slug_with_underscores>) on creation.
    """
    tenant = CinemaTenant(
        name=name,
        slug=slug,
        city=city,
        physical_address="Main Mall Entrance, 1st Floor",
        contact_email=f"info@{slug.replace('-', '')}.co.ke",
        contact_phone="+254712345678",
    )
    tenant.save()

    assert tenant.pk is not None
    assert isinstance(tenant.uuid, uuid.UUID)
    assert tenant.schema_name == expected_schema
    assert tenant.is_active is True
    assert str(tenant) == f"{name} ({slug})"


@pytest.mark.django_db
def test_cinema_tenant_slug_uniqueness() -> None:
    """Verify that creating two cinema tenants with identical slugs raises an IntegrityError."""
    CinemaTenant.objects.create(
        name="Prestige Cinema",
        slug="prestige",
        city="Nairobi",
        contact_email="admin@prestige.co.ke",
    )

    with pytest.raises(IntegrityError):
        CinemaTenant.objects.create(
            name="Prestige Cinema 2",
            slug="prestige",
            city="Mombasa",
            contact_email="admin2@prestige.co.ke",
        )


@pytest.mark.django_db
def test_cinema_domain_creation_and_primary_flag() -> None:
    """Verify that CinemaDomain properly links to CinemaTenant and enforces domain uniqueness."""
    tenant = CinemaTenant.objects.create(
        name="Anga Diamond",
        slug="anga-diamond",
        city="Nairobi",
        contact_email="contact@angadiamond.co.ke",
    )

    domain = CinemaDomain.objects.create(
        domain="anga.localhost",
        tenant=tenant,
        is_primary=True,
    )

    assert domain.pk is not None
    assert domain.tenant == tenant
    assert domain.is_primary is True
    assert str(domain) == "anga.localhost (anga-diamond)"

    # Duplicate domain must fail
    with pytest.raises(IntegrityError):
        CinemaDomain.objects.create(
            domain="anga.localhost",
            tenant=tenant,
            is_primary=False,
        )


@pytest.mark.django_db
def test_cinema_theme_creation_and_default_tokens() -> None:
    """Verify CinemaTheme creates default luxury dark theme tokens if none specified."""
    tenant = CinemaTenant.objects.create(
        name="Century Cinemax",
        slug="century-cinemax",
        city="Nairobi",
        contact_email="ops@century.co.ke",
    )

    theme = CinemaTheme.objects.create(tenant=tenant)

    assert theme.primary_color == "#E61C24"
    assert theme.primary_hover == "#B8121B"
    assert theme.secondary_color == "#E5A93B"
    assert theme.accent_color == "#3B82F6"
    assert theme.background_color == "#0B0B0E"
    assert theme.surface_color == "#14141A"
    assert theme.surface_elevated == "#1E1E26"
    assert theme.border_color == "#2A2A36"
    assert theme.text_primary == "#FFFFFF"
    assert theme.text_muted == "#9CA3AF"
    assert theme.text_on_primary == "#FFFFFF"  # High contrast on ruby red
    assert theme.font_display == "'Outfit', sans-serif"
    assert theme.font_body == "'Inter', sans-serif"
    assert theme.border_radius == "8px"
    assert theme.is_published is True
    assert theme.version == 1
    assert str(theme) == "Theme for Century Cinemax (v1)"

    # Verify CSS variables export for frontend token injection
    css_vars = theme.to_css_variables()
    assert css_vars["--color-primary"] == "#E61C24"
    assert css_vars["--color-secondary"] == "#E5A93B"
    assert css_vars["--bg-app"] == "#0B0B0E"
    assert css_vars["--text-on-primary"] == "#FFFFFF"


@pytest.mark.django_db
def test_cinema_theme_hex_color_validation() -> None:
    """Verify CinemaTheme validates hex color formats."""
    tenant = CinemaTenant.objects.create(
        name="Fox Drive-In",
        slug="fox-drivein",
        city="Nairobi",
        contact_email="ops@fox.co.ke",
    )

    theme = CinemaTheme(
        tenant=tenant,
        primary_color="invalid-color",
    )

    with pytest.raises(ValidationError):
        theme.full_clean()


@pytest.mark.django_db
def test_cinema_theme_contrast_auto_derivation() -> None:
    """Verify CinemaTheme auto-derives high contrast foreground color for light primary colors."""
    tenant = CinemaTenant.objects.create(
        name="Sunny Cinema",
        slug="sunny-cinema",
        city="Mombasa",
        contact_email="hello@sunny.co.ke",
    )

    # Light yellow background should automatically set text_on_primary to dark #111111
    theme = CinemaTheme.objects.create(
        tenant=tenant,
        primary_color="#FACC15",
    )

    assert theme.text_on_primary == "#111111"


@pytest.mark.django_db
def test_cinema_payment_config_default_intasend() -> None:
    """
    Verify CinemaPaymentConfig defaults to IntaSend escrow mode with 10% platform fee.
    """
    tenant = CinemaTenant.objects.create(
        name="Rupa's Cinemas",
        slug="rupas-eldoret",
        city="Eldoret",
        contact_email="finance@rupacinemas.co.ke",
    )

    payment_config = CinemaPaymentConfig.objects.create(
        tenant=tenant,
        settlement_phone="+254700000000",
        settlement_bank_account="1234567890 (KCB Eldoret)",
    )

    assert payment_config.gateway_mode == CinemaPaymentConfig.GatewayMode.INTASEND_ESCROW
    assert payment_config.platform_fee_percent == Decimal("10.00")
    assert payment_config.settlement_phone == "+254700000000"
    assert str(payment_config) == "PaymentConfig (INTASEND_ESCROW - 10.00%) for Rupa's Cinemas"


@pytest.mark.django_db
def test_cinema_payment_config_optional_direct_daraja() -> None:
    """
    Verify CinemaPaymentConfig allows switching to direct Daraja Paybill mode.
    """
    tenant = CinemaTenant.objects.create(
        name="Panari Sky Cinema",
        slug="panari-cinema",
        city="Nairobi",
        contact_email="accounts@panari.co.ke",
    )

    payment_config = CinemaPaymentConfig.objects.create(
        tenant=tenant,
        gateway_mode=CinemaPaymentConfig.GatewayMode.DIRECT_DARAJA,
        platform_fee_percent=Decimal("10.00"),
        daraja_shortcode=174379,
        daraja_consumer_key="test_consumer_key",
        daraja_consumer_secret="test_consumer_secret",  # noqa: S106
        daraja_passkey="test_passkey",
        daraja_till_type=CinemaPaymentConfig.DarajaTillType.PAYBILL,
    )

    assert payment_config.gateway_mode == CinemaPaymentConfig.GatewayMode.DIRECT_DARAJA
    assert payment_config.daraja_shortcode == 174379
    assert payment_config.daraja_till_type == "PAYBILL"
