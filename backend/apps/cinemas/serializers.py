"""
Serializers for cinema tenant data, dynamic branding themes, and sanitized public capabilities.
"""

from typing import Any

from rest_framework import serializers

from apps.cinemas.models import CinemaTenant, CinemaTheme


class CinemaIdentitySerializer(serializers.ModelSerializer[CinemaTenant]):
    """Public identification and contact information for a cinema tenant."""

    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = CinemaTenant
        fields = [
            "id",
            "name",
            "slug",
            "city",
            "physical_address",
            "contact_email",
            "contact_phone",
        ]


class CinemaThemeSerializer(serializers.ModelSerializer[CinemaTheme]):
    """Dynamic branding design tokens and CSS custom properties for frontend theming."""

    css_variables = serializers.SerializerMethodField()

    class Meta:
        model = CinemaTheme
        fields = [
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
            "font_display",
            "font_body",
            "border_radius",
            "logo_url",
            "favicon_url",
            "hero_backdrop_url",
            "css_variables",
        ]

    def get_css_variables(self, obj: CinemaTheme) -> dict[str, str]:
        return obj.to_css_variables()


class SanitizedPaymentCapabilitiesSerializer(serializers.Serializer[dict[str, Any]]):
    """
    Public payment capabilities without leaking private API keys, secrets, or bank accounts.
    """

    gateway_mode = serializers.CharField()
    accepts_mpesa = serializers.BooleanField(default=True)
    accepts_card = serializers.BooleanField(default=True)


class TenantBootstrapSerializer(serializers.Serializer[dict[str, Any]]):
    """
    Combined bootstrap payload returned to the frontend on initial app load.
    """

    cinema = CinemaIdentitySerializer()
    theme = CinemaThemeSerializer()
    payment = SanitizedPaymentCapabilitiesSerializer()
