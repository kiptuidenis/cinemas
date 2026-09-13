"""
Unit and API integration tests for cryptographic single-use email verification.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.accounts.services.email_verification import email_verification_service
from apps.cinemas.models import CinemaDomain, CinemaTenant


@pytest.mark.django_db
class TestEmailVerificationService:
    """Test suite for EmailVerificationService cryptographic token engine."""

    @pytest.fixture
    def user(self) -> User:
        return User.objects.create_user(
            email="verify.test@africinemas.com",
            password="VerifyPassword123!",
            first_name="Brian",
            last_name="Mutua",
        )

    def test_token_generation_and_successful_verification(self, user: User) -> None:
        token = email_verification_service.generate_token(user)
        assert isinstance(token, str)

        old_nonce = user.email_verification_nonce
        assert user.email_verified_at is None

        is_valid, verified_user, message = email_verification_service.verify_token(token)
        assert is_valid is True
        assert verified_user is not None
        assert verified_user.id == user.id
        assert verified_user.email_verified_at is not None
        assert verified_user.email_verification_nonce != old_nonce

    def test_single_use_replay_protection(self, user: User) -> None:
        """Assert that an already used verification link cannot be used a second time."""
        token = email_verification_service.generate_token(user)

        # First verification succeeds
        is_valid1, _, _ = email_verification_service.verify_token(token)
        assert is_valid1 is True

        # Second verification with identical token must fail due to nonce rotation
        is_valid2, _, message = email_verification_service.verify_token(token)
        assert is_valid2 is False
        assert "already been used" in message

    def test_expired_token_rejected(self, user: User) -> None:
        token = email_verification_service.generate_token(user)
        # Using max_age=-1 forces expiration
        is_valid, _, message = email_verification_service.verify_token(token, max_age=-1)
        assert is_valid is False
        assert "expired" in message

    def test_tampered_token_rejected(self, user: User) -> None:
        token = email_verification_service.generate_token(user)
        tampered_token = token + "forged"
        is_valid, _, message = email_verification_service.verify_token(tampered_token)
        assert is_valid is False
        assert "Invalid verification link" in message


@pytest.mark.django_db
class TestVerifyEmailAPI:
    """Test suite for /api/v1/auth/verify-email/ endpoint."""

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

    @pytest.fixture
    def client(self) -> APIClient:
        return APIClient()

    @pytest.fixture
    def user(self) -> User:
        return User.objects.create_user(
            email="api.verify@africinemas.com",
            password="VerifyPassword123!",
        )

    def test_api_verify_email_post(self, client: APIClient, user: User) -> None:
        token = email_verification_service.generate_token(user)
        response = client.post(
            "/api/v1/auth/verify-email/",
            {"token": token},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == user.email

        user.refresh_from_db()
        assert user.email_verified_at is not None

    def test_api_verify_email_get(self, client: APIClient, user: User) -> None:
        token = email_verification_service.generate_token(user)
        response = client.get(f"/api/v1/auth/verify-email/?token={token}")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == user.email

    def test_api_verify_email_missing_token(self, client: APIClient) -> None:
        response = client.post("/api/v1/auth/verify-email/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["code"] == "missing_token"

    def test_api_verify_email_invalid_token(self, client: APIClient) -> None:
        response = client.post(
            "/api/v1/auth/verify-email/",
            {"token": "totally-bogus-token"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["code"] == "verification_failed"
