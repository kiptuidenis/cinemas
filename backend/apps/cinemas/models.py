"""
Multi-tenant cinema models using django-tenants.
Provides schema-per-tenant isolation for arbitrary cinema operators and mall locations,
along with branding theme design tokens and hybrid fintech configurations (IntaSend vs Daraja).
"""

import logging
import re
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django_tenants.models import DomainMixin, TenantMixin

from apps.core.models import TimeStampedModel, UUIDModel

logger = logging.getLogger(__name__)


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

    class ProvisioningStatus(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        PROVISIONING = "PROVISIONING", _("Provisioning")
        READY = "READY", _("Ready")
        FAILED = "FAILED", _("Failed")
        RETRYING = "RETRYING", _("Retrying")
        SUSPENDED = "SUSPENDED", _("Suspended")
        DELETING = "DELETING", _("Deleting")

    provisioning_status = models.CharField(
        _("provisioning status"),
        max_length=20,
        choices=ProvisioningStatus.choices,
        default=ProvisioningStatus.PENDING,
        db_index=True,
        help_text=_("Current lifecycle and provisioning state of the cinema tenant."),
    )
    provisioning_started_at = models.DateTimeField(
        _("provisioning started at"),
        null=True,
        blank=True,
        help_text=_("Timestamp when async schema provisioning was started."),
    )
    provisioning_completed_at = models.DateTimeField(
        _("provisioning completed at"),
        null=True,
        blank=True,
        help_text=_("Timestamp when schema provisioning and turnkey seeding finished."),
    )
    last_provisioning_attempt_at = models.DateTimeField(
        _("last provisioning attempt at"),
        null=True,
        blank=True,
        help_text=_("Timestamp of the most recent provisioning runner attempt."),
    )
    provisioning_error = models.TextField(
        _("provisioning error details"),
        blank=True,
        default="",
        help_text=_("Error diagnostic trace if provisioning failed."),
    )
    provisioning_attempts = models.PositiveIntegerField(
        _("provisioning attempts"),
        default=0,
        help_text=_("Total number of provisioning execution attempts."),
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

    class DomainStatus(models.TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        COOLING_DOWN = "COOLING_DOWN", _("Cooling Down")
        RELEASED = "RELEASED", _("Released")

    status = models.CharField(
        _("domain status"),
        max_length=20,
        choices=DomainStatus.choices,
        default=DomainStatus.ACTIVE,
        db_index=True,
        help_text=_("Current lifecycle status of this domain mapping."),
    )
    cooldown_until = models.DateTimeField(
        _("cooldown quarantine expiration"),
        null=True,
        blank=True,
        help_text=_(
            "Enforces 90-day quarantine before a released domain/subdomain can be re-registered."
        ),
    )

    class Meta:
        verbose_name = _("Cinema Domain")
        verbose_name_plural = _("Cinema Domains")
        ordering = ["domain"]

    def __str__(self) -> str:
        return f"{self.domain} ({self.tenant.slug})"


def get_contrasting_text_color(hex_color: str) -> str:
    """
    Calculate WCAG-compliant high-contrast foreground color (white or near-black)
    based on relative luminance of the provided background hex color.
    """
    clean_hex = hex_color.lstrip("#")
    if len(clean_hex) != 6:
        return "#FFFFFF"
    try:
        r, g, b = (int(clean_hex[i : i + 2], 16) / 255.0 for i in (0, 2, 4))
        # Relative luminance formula (sRGB)
        r_lin = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
        g_lin = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
        b_lin = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
        luminance = 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin
        return "#111111" if luminance > 0.4 else "#FFFFFF"
    except (ValueError, TypeError):
        return "#FFFFFF"


class CinemaTheme(UUIDModel, TimeStampedModel):
    """
    Branding and styling tokens for a cinema storefront.
    Dynamically injected as CSS custom properties in the React frontend.
    Includes semantic tokens, WCAG accessibility helpers, and draft/publish state.
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

    # Core Brand Tokens (African Cinematic Ruby & Warm Savannah Gold defaults)
    primary_color = models.CharField(
        _("primary color"),
        max_length=7,
        default="#E61C24",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Primary brand accent color (hex e.g. #E61C24)."),
    )
    primary_hover = models.CharField(
        _("primary hover color"),
        max_length=7,
        default="#B8121B",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Hover state for primary buttons and interactive accents."),
    )
    secondary_color = models.CharField(
        _("secondary color"),
        max_length=7,
        default="#E5A93B",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Secondary badge/VIP highlight color (hex e.g. #E5A93B)."),
    )
    accent_color = models.CharField(
        _("accent highlight color"),
        max_length=7,
        default="#3B82F6",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Tertiary accent for badges and status highlights."),
    )

    # Semantic Surfaces & Backgrounds
    background_color = models.CharField(
        _("background color"),
        max_length=7,
        default="#0B0B0E",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Main application background color (hex e.g. #0B0B0E)."),
    )
    surface_color = models.CharField(
        _("surface container color"),
        max_length=7,
        default="#14141A",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Card / container surface color (hex e.g. #14141A)."),
    )
    surface_elevated = models.CharField(
        _("surface elevated color"),
        max_length=7,
        default="#1E1E26",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Elevated modals, dropdowns, and navigation headers."),
    )
    border_color = models.CharField(
        _("subtle border color"),
        max_length=7,
        default="#2A2A36",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Dividers and component borders."),
    )

    # Semantic Typography & Text Colors
    text_primary = models.CharField(
        _("primary text color"),
        max_length=7,
        default="#FFFFFF",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("High-emphasis headings and body text."),
    )
    text_muted = models.CharField(
        _("muted text color"),
        max_length=7,
        default="#9CA3AF",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Low-emphasis captions and subtitles."),
    )
    text_on_primary = models.CharField(
        _("text on primary color"),
        max_length=7,
        default="#FFFFFF",
        validators=[HEX_COLOR_VALIDATOR],
        help_text=_("Foreground text on primary buttons (auto-calculated for WCAG contrast)."),
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

    # Publishing & Versioning Controls
    is_published = models.BooleanField(
        _("is theme published"),
        default=True,
        help_text=_(
            "Whether this theme is active on the live storefront or currently in preview/draft mode."
        ),
    )
    version = models.PositiveIntegerField(
        _("theme version"),
        default=1,
        help_text=_("Monotonically increasing version counter for CDN and browser cache busting."),
    )

    class Meta:
        verbose_name = _("Cinema Theme")
        verbose_name_plural = _("Cinema Themes")

    def clean(self) -> None:
        super().clean()
        for field_name in (
            "primary_color",
            "primary_hover",
            "secondary_color",
            "accent_color",
            "background_color",
            "surface_color",
            "surface_elevated",
            "border_color",
            "text_primary",
            "text_muted",
            "text_on_primary",
        ):
            val = getattr(self, field_name, None)
            if val:
                HEX_COLOR_VALIDATOR(val)

        # Auto-derive high contrast foreground if text_on_primary was not explicitly overridden
        if not self.text_on_primary or self.text_on_primary == "#FFFFFF":
            self.text_on_primary = get_contrasting_text_color(self.primary_color)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.clean()
        super().save(*args, **kwargs)
        self.invalidate_cache()

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        self.invalidate_cache()
        return super().delete(*args, **kwargs)

    def invalidate_cache(self) -> None:
        """Purge theme cache in Redis when theme settings are modified."""
        try:
            from django.core.cache import cache

            if hasattr(self, "tenant") and self.tenant and self.tenant.slug:
                cache.delete(f"tenant:theme:{self.tenant.slug}")
                cache.delete(f"tenant:bootstrap:{self.tenant.slug}")
        except Exception as exc:
            logger.debug("Failed to purge tenant theme cache: %s", exc)

    def to_css_variables(self) -> dict[str, str]:
        """Generate dynamic CSS custom property mapping for frontend theme injection."""
        return {
            "--color-primary": self.primary_color,
            "--color-primary-hover": self.primary_hover,
            "--color-secondary": self.secondary_color,
            "--color-accent": self.accent_color,
            "--bg-app": self.background_color,
            "--bg-surface": self.surface_color,
            "--bg-surface-elevated": self.surface_elevated,
            "--border-subtle": self.border_color,
            "--text-primary": self.text_primary,
            "--text-muted": self.text_muted,
            "--text-on-primary": self.text_on_primary,
            "--font-family-display": self.font_display,
            "--font-family-body": self.font_body,
            "--radius-md": self.border_radius,
        }

    def __str__(self) -> str:
        return f"Theme for {self.tenant.name} (v{self.version})"


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


class OnboardingRequest(UUIDModel, TimeStampedModel):
    """
    Tracks tenant onboarding requests for strict database-level idempotency and audit replay.
    Guarantees at-most-once creation across distributed retry attempts.
    """

    class Status(models.TextChoices):
        RECEIVED = "RECEIVED", _("Received")
        COMMITTED = "COMMITTED", _("Committed")
        FAILED = "FAILED", _("Failed")

    idempotency_key = models.CharField(
        _("idempotency key"),
        max_length=128,
        unique=True,
        db_index=True,
        help_text=_("Client-provided unique key from X-Idempotency-Key HTTP header."),
    )
    request_hash = models.CharField(
        _("request payload hash"),
        max_length=64,
        help_text=_("SHA-256 canonical hash of registration payload to detect payload mutation."),
    )
    status = models.CharField(
        _("request status"),
        max_length=20,
        choices=Status.choices,
        default=Status.RECEIVED,
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="onboarding_requests",
        verbose_name=_("operator user"),
    )
    tenant = models.ForeignKey(
        CinemaTenant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="onboarding_requests",
        verbose_name=_("cinema tenant"),
    )
    response_payload = models.JSONField(
        _("cached response payload"),
        default=dict,
        blank=True,
        help_text=_("Exact response body returned to client for idempotent replay."),
    )
    response_status_code = models.PositiveIntegerField(
        _("cached response status code"),
        default=202,
        help_text=_("HTTP status code for idempotent replay (e.g. 202)."),
    )

    class Meta:
        verbose_name = _("Onboarding Request")
        verbose_name_plural = _("Onboarding Requests")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"OnboardingRequest ({self.idempotency_key}) - {self.status}"


class PlatformAuditLog(UUIDModel, TimeStampedModel):
    """
    Append-only security and operational audit trail for tenant lifecycle events.
    """

    action = models.CharField(
        _("action"),
        max_length=100,
        db_index=True,
        help_text=_("Security action or event name (e.g. TENANT_REGISTERED, PROVISIONING_FAILED)."),
    )
    actor_email = models.CharField(
        _("actor email"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Email address of user or system agent initiating action."),
    )
    tenant_slug = models.CharField(
        _("tenant slug"),
        max_length=63,
        blank=True,
        default="",
        db_index=True,
        help_text=_("Associated cinema tenant slug."),
    )
    ip_address = models.GenericIPAddressField(
        _("client IP address"),
        null=True,
        blank=True,
        help_text=_("Origin IP address for the audit record."),
    )
    details = models.JSONField(
        _("event metadata"),
        default=dict,
        blank=True,
        help_text=_("Arbitrary structured metadata about this audit event."),
    )

    class Meta:
        verbose_name = _("Platform Audit Log")
        verbose_name_plural = _("Platform Audit Logs")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.created_at}] {self.action} - {self.tenant_slug or 'platform'}"


class TenantOperationalConfig(UUIDModel, TimeStampedModel):
    """
    Turnkey operational defaults injected into new cinema tenants.
    Configures booking seat hold TTLs, maximum ticket limits, notification preferences,
    and the administrative onboarding checklist.
    """

    tenant = models.OneToOneField(
        CinemaTenant,
        on_delete=models.CASCADE,
        related_name="operational_config",
        verbose_name=_("cinema tenant"),
    )
    hold_ttl_seconds = models.PositiveIntegerField(
        _("seat hold TTL (seconds)"),
        default=420,
        help_text=_(
            "Duration in seconds that selected seats are held during checkout (default: 420s / 7 mins)."
        ),
    )
    max_seats_per_order = models.PositiveIntegerField(
        _("max seats per order"),
        default=8,
        help_text=_("Maximum number of seats bookable in a single order (default: 8)."),
    )
    booking_confirmation_email = models.BooleanField(
        _("email booking confirmations"),
        default=True,
        help_text=_("Send automated email confirmation and QR tickets upon successful payment."),
    )
    booking_confirmation_sms = models.BooleanField(
        _("SMS booking confirmations"),
        default=True,
        help_text=_("Send automated SMS confirmation and short booking code upon payment."),
    )
    onboarding_checklist = models.JSONField(
        _("onboarding checklist"),
        default=list,
        blank=True,
        help_text=_("Interactive launch checklist tracking setup milestones."),
    )

    class Meta:
        verbose_name = _("Tenant Operational Configuration")
        verbose_name_plural = _("Tenant Operational Configurations")

    @classmethod
    def get_default_checklist(cls) -> list[dict[str, Any]]:
        return [
            {
                "id": "add_screen",
                "title": "Add Screen",
                "category": "operations",
                "completed": False,
            },
            {
                "id": "schedule_showtime",
                "title": "Schedule Showtime",
                "category": "programming",
                "completed": False,
            },
            {
                "id": "connect_payments",
                "title": "Connect Payments",
                "category": "billing",
                "completed": False,
            },
        ]

    def mark_checklist_item(self, item_id: str, completed: bool = True) -> None:
        """Toggle checklist task completion status."""
        items: list[dict[str, Any]] = list(self.onboarding_checklist or [])
        found = False
        for item in items:
            if item.get("id") == item_id:
                item["completed"] = completed
                found = True
                break
        if not found:
            items.append(
                {"id": item_id, "title": item_id.replace("_", " ").title(), "completed": completed}
            )
        self.onboarding_checklist = items
        self.save(update_fields=["onboarding_checklist"])

    def __str__(self) -> str:
        return f"OperationalConfig for {self.tenant.name}"
