"""
Serializers for authentication, JWT custom claims injection, and user profiles.
"""

from typing import Any

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import Token

from apps.accounts.models import TenantMembership, User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer embedding user identity and active tenant memberships
    into the token claims to avoid unnecessary database queries on the frontend.
    """

    @classmethod
    def get_token(cls, user: Any) -> Token:
        token = super().get_token(user)

        token["user_id"] = str(user.id)
        token["email"] = user.email
        token["full_name"] = user.get_full_name()
        token["is_staff"] = user.is_staff

        active_memberships = (
            TenantMembership.objects.filter(user=user, is_active=True)
            .select_related("tenant")
            .values("tenant__slug", "role")
        )
        token["memberships"] = [
            {
                "tenant_slug": m["tenant__slug"],
                "role": m["role"],
            }
            for m in active_memberships
        ]

        return token

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        data: dict[str, Any] = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data


class UserProfileSerializer(serializers.ModelSerializer[User]):
    """Publicly safe representation of user identity."""

    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    email_verified_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "date_joined",
            "email_verified_at",
        ]
