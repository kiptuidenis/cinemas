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


class CinemaDetailsSerializer(serializers.Serializer[dict[str, Any]]):
    """Step 1: Cinema operational identity and subdomain reservation."""

    name = serializers.CharField(max_length=255)
    subdomain = serializers.CharField(max_length=50)
    city = serializers.CharField(max_length=100, default="Nairobi", required=False)
    physical_address = serializers.CharField(required=False, allow_blank=True, default="")
    contact_email = serializers.EmailField(required=False, allow_blank=True, default="")
    contact_phone = serializers.CharField(
        max_length=32, required=False, allow_blank=True, default=""
    )

    def validate_subdomain(self, value: str) -> str:
        from apps.cinemas.services.subdomain import SubdomainService

        res = SubdomainService.check_availability(value)
        if not res["available"]:
            raise serializers.ValidationError(res["reason"])
        return str(res["subdomain"])


class ThemePreferenceSerializer(serializers.Serializer[dict[str, Any]]):
    """Step 2: Brand styling tokens with hex validation."""

    primary_color = serializers.CharField(max_length=7, default="#E61C24", required=False)
    secondary_color = serializers.CharField(max_length=7, default="#E5A93B", required=False)
    accent_color = serializers.CharField(max_length=7, default="#3B82F6", required=False)
    background_color = serializers.CharField(max_length=7, default="#0B0B0E", required=False)
    surface_color = serializers.CharField(max_length=7, default="#14141A", required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        from apps.cinemas.models import HEX_COLOR_VALIDATOR

        for key in (
            "primary_color",
            "secondary_color",
            "accent_color",
            "background_color",
            "surface_color",
        ):
            val = attrs.get(key)
            if val:
                HEX_COLOR_VALIDATOR(val)
        return attrs


class OperatorAccountSerializer(serializers.Serializer[dict[str, Any]]):
    """Step 3: Initial cinema tenant owner account credentials."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")

    def validate_email(self, value: str) -> str:
        from django.contrib.auth import get_user_model

        user_model = get_user_model()
        norm_email = value.strip().lower()
        if user_model.objects.filter(email=norm_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return norm_email

    def validate_password(self, value: str) -> str:
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value


class CinemaRegistrationSerializer(serializers.Serializer[dict[str, Any]]):
    """
    Composite registration serializer orchestrating 3-step cinema onboarding wizard.
    Supports both nested ('cinema', 'operator', 'theme') and flat payload formats.
    """

    cinema = CinemaDetailsSerializer()
    operator = OperatorAccountSerializer()
    theme = ThemePreferenceSerializer(required=False, default=dict)

    def to_internal_value(self, data: Any) -> dict[str, Any]:
        if isinstance(data, dict) and "cinema" not in data and "name" in data:
            # Re-structure flat payload into nested blocks
            nested: dict[str, Any] = {
                "cinema": {
                    "name": data.get("name"),
                    "subdomain": data.get("subdomain"),
                    "city": data.get("city", "Nairobi"),
                    "physical_address": data.get("physical_address", ""),
                    "contact_email": data.get("contact_email", ""),
                    "contact_phone": data.get("contact_phone", ""),
                },
                "operator": {
                    "first_name": data.get("first_name"),
                    "last_name": data.get("last_name"),
                    "email": data.get("email"),
                    "password": data.get("password"),
                    "phone": data.get("phone", ""),
                },
                "theme": {
                    "primary_color": data.get("primary_color", "#E61C24"),
                    "secondary_color": data.get("secondary_color", "#E5A93B"),
                    "accent_color": data.get("accent_color", "#3B82F6"),
                    "background_color": data.get("background_color", "#0B0B0E"),
                    "surface_color": data.get("surface_color", "#14141A"),
                },
            }
            return super().to_internal_value(nested)
        return super().to_internal_value(data)
