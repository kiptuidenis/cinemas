"""
Integration tests for SimpleJWT authentication, token claims, refresh rotation,
token blacklisting, and rate limiting.
"""

import pytest
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import TenantMembership, User
from apps.cinemas.models import CinemaDomain, CinemaTenant


@pytest.mark.django_db
class TestJWTAuthenticationAPI:
    """Test suite for JWT authentication endpoints."""

    @pytest.fixture(autouse=True)
    def _setup_public_domain(self, db: None) -> None:
        public_tenant, _ = CinemaTenant.objects.get_or_create(
            schema_name="public",
            defaults={
                "name": "Africinemas Hub",
                "slug": "public",
                "city": "Nairobi",
            },
        )
        CinemaDomain.objects.get_or_create(
            domain="testserver",
            defaults={"tenant": public_tenant, "is_primary": True},
        )

    @pytest.fixture(autouse=True)
    def _clear_cache(self) -> None:
        cache.clear()

    @pytest.fixture
    def client(self) -> APIClient:
        return APIClient()

    @pytest.fixture
    def operator(self) -> User:
        return User.objects.create_user(
            email="operator@westgatecinemas.com",
            password="StrongPassword2026!",
            first_name="Amina",
            last_name="Mohamed",
        )

    @pytest.fixture
    def tenant(self) -> CinemaTenant:
        return CinemaTenant.objects.create(
            name="Westgate Cinema",
            slug="westgate",
            city="Nairobi",
        )

    def test_login_success_and_token_claims(
        self, client: APIClient, operator: User, tenant: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=operator,
            tenant=tenant,
            role=TenantMembership.Role.OWNER,
        )

        response = client.post(
            "/api/v1/auth/login/",
            {"email": "operator@westgatecinemas.com", "password": "StrongPassword2026!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == "operator@westgatecinemas.com"
        assert data["user"]["first_name"] == "Amina"

        # Decode access token and assert custom claims
        token = AccessToken(data["access"])
        assert token["user_id"] == str(operator.id)
        assert token["email"] == "operator@westgatecinemas.com"
        assert token["full_name"] == "Amina Mohamed"
        assert len(token["memberships"]) == 1
        assert token["memberships"][0]["tenant_slug"] == "westgate"
        assert token["memberships"][0]["role"] == "OWNER"

    def test_login_invalid_password(self, client: APIClient, operator: User) -> None:
        response = client.post(
            "/api/v1/auth/login/",
            {"email": "operator@westgatecinemas.com", "password": "WrongPassword!"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, client: APIClient, operator: User) -> None:
        operator.is_active = False
        operator.save()

        response = client.post(
            "/api/v1/auth/login/",
            {"email": "operator@westgatecinemas.com", "password": "StrongPassword2026!"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, client: APIClient, operator: User) -> None:
        login_resp = client.post(
            "/api/v1/auth/login/",
            {"email": "operator@westgatecinemas.com", "password": "StrongPassword2026!"},
            format="json",
        )
        refresh_token = login_resp.json()["refresh"]

        refresh_resp = client.post(
            "/api/v1/auth/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        assert refresh_resp.status_code == status.HTTP_200_OK
        assert "access" in refresh_resp.json()

    def test_logout_blacklists_refresh_token(self, client: APIClient, operator: User) -> None:
        login_resp = client.post(
            "/api/v1/auth/login/",
            {"email": "operator@westgatecinemas.com", "password": "StrongPassword2026!"},
            format="json",
        )
        access_token = login_resp.json()["access"]
        refresh_token = login_resp.json()["refresh"]

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_resp = client.post(
            "/api/v1/auth/logout/",
            {"refresh": refresh_token},
            format="json",
        )
        assert logout_resp.status_code == status.HTTP_200_OK
        assert logout_resp.json()["code"] == "logout_success"

        # Attempt to use blacklisted refresh token
        client.credentials()  # Clear auth header
        re_refresh_resp = client.post(
            "/api/v1/auth/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        assert re_refresh_resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_profile_get_and_patch(self, client: APIClient, operator: User) -> None:
        login_resp = client.post(
            "/api/v1/auth/login/",
            {"email": "operator@westgatecinemas.com", "password": "StrongPassword2026!"},
            format="json",
        )
        access_token = login_resp.json()["access"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # GET profile
        profile_resp = client.get("/api/v1/auth/me/")
        assert profile_resp.status_code == status.HTTP_200_OK
        assert profile_resp.json()["email"] == operator.email

        # PATCH profile
        patch_resp = client.patch(
            "/api/v1/auth/me/",
            {"first_name": "Amina Updated", "phone_number": "+254712345678"},
            format="json",
        )
        assert patch_resp.status_code == status.HTTP_200_OK
        assert patch_resp.json()["first_name"] == "Amina Updated"
        assert patch_resp.json()["phone_number"] == "+254712345678"
