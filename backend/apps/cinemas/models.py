"""
Multi-tenant cinema models using django-tenants.
Provides schema-per-tenant isolation for arbitrary cinema operators and mall locations,
along with branding theme design tokens and hybrid fintech configurations (IntaSend vs Daraja).
"""

import re
from decimal import Decimal
from typing import Any

from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django_tenants.models import DomainMixin, TenantMixin

from apps.core.models import TimeStampedModel, UUIDModel

HEX_COLOR_VALIDATOR = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message=_("Must be a valid 6-character hex color code (e.g. #E50914)."),
)

SCHEMA_NAME_VALIDATOR = RegexValidator(
    regex=r"^[a-z][a-z0-9_]{1,62}$",
    message=_(
        "Schema name must start with a lowercase letter and contain only lowercase letters, digits, and underscores."
    ),
)


class CinemaTenant(TenantMixin, UUIDModel, TimeStampedModel):
    """
    Cinema Tenant representing a cinema operator or mall location.
    Dynamically creates an isolated PostgreSQL schema per tenant in PostgreSQL.
    """

    name = models.CharField(
        _("cinema display name"),
        max_length=255,
        help_text=_("Public commercial name of the cinema (e.g. Westgate Cinema, Rupa's Cinemas)."),
    )
    slug = models.SlugField(
        _("subdomain slug"),
        max_length=63,
        unique=True,
        db_index=True,
        help_text=_(
            "URL-safe slug used for subdomain routing (e.g. 'westgate' -> westgate.africinemas.com)."
        ),
    )
    city = models.CharField(
        _("city / town"),
        max_length=100,
        default="Nairobi",
        help_text=_(
            "City or municipality where the cinema is located (e.g. Nairobi, Eldoret, Kisumu)."
        ),
    )
    physical_address = models.TextField(
        _("physical address"),
        blank=True,
        default="",
        help_text=_("Physical address within the mall or building (e.g. 2nd Floor, Wing B)."),
    )
    contact_email = models.EmailField(
        _("operational contact email"),
        blank=True,
        default="",
        help_text=_("Primary administrative and notification email for cinema management."),
    )
    contact_phone = models.CharField(
        _("support contact phone"),
        max_length=32,
        blank=True,
        default="",
        help_text=_("Customer support hotline or WhatsApp number."),
    )
    is_active = models.BooleanField(
        _("is active"),
        default=True,
        help_text=_("Designates whether this cinema is active and allowed to accept bookings."),
    )

    # Disable auto schema creation during non-postgres or test fixtures unless explicitly called
    auto_create_schema = False
    auto_drop_schema = False
    schema_name: str

    class Meta:
        verbose_name = _("Cinema Tenant")
        verbose_name_plural = _("Cinema Tenants")
        ordering = ["name"]

    def clean(self) -> None:
        super().clean()
        if self.slug:
            self.slug = slugify(self.slug)
        if not getattr(self, "schema_name", None):
            self.schema_name = self.generate_schema_name(self.slug)
        SCHEMA_NAME_VALIDATOR(self.schema_name)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.slug:
            self.slug = slugify(self.slug)
        if not getattr(self, "schema_name", None):
            self.schema_name = self.generate_schema_name(self.slug)
        super().save(*args, **kwargs)

    @staticmethod
    def generate_schema_name(slug: str) -> str:
        """Derive a safe PostgreSQL schema name from a tenant slug."""
        normalized_slug = slug.lower().replace("-", "_")
        # Ensure schema name starts with tenant_ prefix to avoid SQL keywords
        if not normalized_slug.startswith("tenant_"):
            schema_name = f"tenant_{normalized_slug}"
        else:
            schema_name = normalized_slug
        # Clean any remaining non-alphanumeric/underscore characters
        return re.sub(r"[^a-z0-9_]", "", schema_name)[:63]

    def __str__(self) -> str:
        return f"{self.name} ({self.slug})"


class CinemaDomain(DomainMixin, UUIDModel, TimeStampedModel):
    """
    Subdomain or custom domain routing entry linked to a CinemaTenant.
    Enables multi-tenant resolution from incoming HTTP Host headers.
    """

    tenant = models.ForeignKey(
        CinemaTenant,
        on_delete=models.CASCADE,
        related_name="domains",
        verbose_name=_("cinema tenant"),
    )

    class Meta:
        verbose_name = _("Cinema Domain")
        verbose_name_plural = _("Cinema Domains")
        ordering = ["domain"]

    def __str__(self) -> str:
        return f"{self.domain} ({self.tenant.slug})"


class CinemaTheme(UUIDModel, TimeStampedModel):
    """
    Branding and styling tokens for a cinema storefront.
    Dynamically injected as CSS custom properties in the React frontend.
    """

    tenant = models.OneToOneField(
        CinemaTenant,
        on_delete=models.CASCADE,
        related_name="theme",
        verbose_name=_("cinema tenant"),
    )
    logo_url = models.URLField(
        _("logo URL"),
        blank=True,
        default="",
        help_text=_("Public CDN URL for transparent SVG / PNG dark-mode logo."),
    )
    favicon_url = models.URLField(
        _("favicon URL"),
        blank=True,
        default="",
        help_text=_("Public URL for browser favicon."),
    )
    hero_backdrop_url = models.URLField(
        _("hero backdrop image URL"),
        blank=True,
        default="",
        help_text=_("Default banner backdrop image for cinema homepage."),
    )
    primary_color = models.CharField(
        _("primary color"),
        max_length=7,
        default="#E50914",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Primary brand accent color (hex e.g. #E50914)."),
    )
    secondary_color = models.CharField(
        _("secondary color"),
        max_length=7,
        default="#E5A93B",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Secondary badge/highlight color (hex e.g. #E5A93B)."),
    )
    background_color = models.CharField(
        _("background color"),
        max_length=7,
        default="#0B0B0E",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Main application background color (hex e.g. #0B0B0E)."),
    )
    surface_color = models.CharField(
        _("surface elevated color"),
        max_length=7,
        default="#14141A",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Card / container surface color (hex e.g. #14141A)."),
    )
    font_display = models.CharField(
        _("display typography font"),
        max_length=100,
        default="'Outfit', sans-serif",
        help_text=_("Font family for titles and headers."),
    )
    font_body = models.CharField(
        _("body typography font"),
        max_length=100,
        default="'Inter', sans-serif",
        help_text=_("Font family for body text and paragraphs."),
    )
    border_radius = models.CharField(
        _("border radius token"),
        max_length=16,
        default="8px",
        help_text=_("Global component border radius (e.g. 8px, 12px)."),
    )

    class Meta:
        verbose_name = _("Cinema Theme")
        verbose_name_plural = _("Cinema Themes")

    def clean(self) -> None:
        super().clean()
        HEX_COLOR_VALIDATOR(self.primary_color)
        HEX_COLOR_VALIDATOR(self.secondary_color)
        HEX_COLOR_VALIDATOR(self.background_color)
        HEX_COLOR_VALIDATOR(self.surface_color)

    def __str__(self) -> str:
        return f"Theme for {self.tenant.name}"


class CinemaPaymentConfig(UUIDModel, TimeStampedModel):
    """
    Fintech payment configuration per cinema tenant.
    Supports default IntaSend escrow mode with 10% platform fee split,
    as well as optional direct Safaricom Daraja Paybill / Till integration.
    """

    class GatewayMode(models.TextChoices):
        INTASEND_ESCROW = "INTASEND_ESCROW", _("IntaSend Escrow (10% Platform Commission Split)")
        DIRECT_DARAJA = "DIRECT_DARAJA", _("Direct Safaricom Daraja (Paybill / Buy Goods)")

    class DarajaTillType(models.TextChoices):
        PAYBILL = "PAYBILL", _("Paybill")
        BUY_GOODS = "BUY_GOODS", _("Buy Goods Till")

    tenant = models.OneToOneField(
        CinemaTenant,
        on_delete=models.CASCADE,
        related_name="payment_config",
        verbose_name=_("cinema tenant"),
    )
    gateway_mode = models.CharField(
        _("payment gateway mode"),
        max_length=32,
        choices=GatewayMode.choices,
        default=GatewayMode.INTASEND_ESCROW,
        help_text=_("Default is IntaSend escrow with 10% platform revenue fee split."),
    )
    platform_fee_percent = models.DecimalField(
        _("platform fee percentage"),
        max_digits=5,
        decimal_places=2,
        default=Decimal("10.00"),
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))],
        help_text=_(
            "Platform commission fee percentage deducted per transaction (default 10.00%)."
        ),
    )
    settlement_phone = models.CharField(
        _("settlement M-Pesa phone"),
        max_length=32,
        blank=True,
        default="",
        help_text=_("M-Pesa phone number for automated merchant payout disbursements."),
    )
    settlement_bank_account = models.CharField(
        _("settlement bank details"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Bank name, account number, and branch for EFT / RTGS payouts."),
    )

    # Optional Direct Safaricom Daraja 2.0 Credentials
    daraja_shortcode = models.PositiveIntegerField(
        _("Daraja shortcode"),
        null=True,
        blank=True,
        help_text=_("Safaricom Daraja Paybill or Buy Goods Till Number."),
    )
    daraja_consumer_key = models.TextField(
        _("Daraja consumer key"),
        blank=True,
        default="",
        help_text=_("Daraja 2.0 OAuth Consumer Key."),
    )
    daraja_consumer_secret = models.TextField(
        _("Daraja consumer secret"),
        blank=True,
        default="",
        help_text=_("Daraja 2.0 OAuth Consumer Secret."),
    )
    daraja_passkey = models.TextField(
        _("Daraja online passkey"),
        blank=True,
        default="",
        help_text=_("Lipa Na M-Pesa Online STK Push Passkey."),
    )
    daraja_till_type = models.CharField(
        _("Daraja till type"),
        max_length=16,
        choices=DarajaTillType.choices,
        default=DarajaTillType.PAYBILL,
        help_text=_("Specify whether the shortcode is a Paybill or Buy Goods Till."),
    )
    is_active = models.BooleanField(
        _("is payment active"),
        default=True,
        help_text=_("Whether payment processing is enabled for this cinema."),
    )

    class Meta:
        verbose_name = _("Cinema Payment Configuration")
        verbose_name_plural = _("Cinema Payment Configurations")

    def __str__(self) -> str:
        return f"PaymentConfig ({self.gateway_mode} - {self.platform_fee_percent}%) for {self.tenant.name}"
