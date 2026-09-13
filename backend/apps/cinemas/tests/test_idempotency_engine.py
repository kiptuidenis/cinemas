"""
Tests for cinema onboarding database-level idempotency engine.
Validates X-Idempotency-Key enforcement, at-most-once execution, replay caching,
and payload mutation conflict detection (HTTP 409).
"""

import uuid

import pytest
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import TenantMembership, User
from apps.cinemas.models import (
    CinemaDomain,
    CinemaTenant,
    CinemaTheme,
    OnboardingRequest,
    PlatformAuditLog,
)


@pytest.mark.django_db
class TestIdempotencyEngine:
    """Test suite for registration idempotency and atomic onboarding."""

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
    def valid_payload(self) -> dict:
        return {
            "cinema": {
                "name": "Prestige Plaza Cinema",
                "subdomain": "prestige-plaza",
                "city": "Nairobi",
                "physical_address": "Ngong Road, 2nd Floor",
                "contact_phone": "+254711000111",
            },
            "operator": {
                "first_name": "Juma",
                "last_name": "Kamau",
                "email": "juma.kamau@prestigecinema.ke",
                "password": "StrongPassword99!",
                "phone": "+254711000111",
            },
            "theme": {
                "primary_color": "#E61C24",
                "secondary_color": "#E5A93B",
                "accent_color": "#3B82F6",
            },
        }

    def test_registration_without_idempotency_key_returns_400(
        self, client: APIClient, valid_payload: dict
    ) -> None:
        response = client.post(
            "/api/v1/onboarding/register/",
            data=valid_payload,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "missing_idempotency_key"

    def test_first_registration_succeeds_and_creates_all_entities(
        self, client: APIClient, valid_payload: dict
    ) -> None:
        idempotency_key = f"idemp-test-{uuid.uuid4()}"

        response = client.post(
            "/api/v1/onboarding/register/",
            data=valid_payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY=idempotency_key,
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["cinema_slug"] == "prestige-plaza"
        assert response.data["status"] == CinemaTenant.ProvisioningStatus.PROVISIONING
        assert response.data["poll_url"] == "/api/v1/onboarding/status/?slug=prestige-plaza"
        assert response.headers.get("Location") == response.data["poll_url"]

        # Verify DB Entities Created
        tenant = CinemaTenant.objects.get(slug="prestige-plaza")
        assert tenant.name == "Prestige Plaza Cinema"
        assert tenant.provisioning_status == CinemaTenant.ProvisioningStatus.PROVISIONING
        assert tenant.provisioning_attempts == 1

        user = User.objects.get(email="juma.kamau@prestigecinema.ke")
        assert user.first_name == "Juma"
        assert user.last_name == "Kamau"
        assert user.check_password("StrongPassword99!")

        domain = CinemaDomain.objects.get(domain="prestige-plaza.africinemas.com")
        assert domain.tenant == tenant
        assert domain.status == CinemaDomain.DomainStatus.ACTIVE

        theme = CinemaTheme.objects.get(tenant=tenant)
        assert theme.primary_color == "#E61C24"

        membership = TenantMembership.objects.get(user=user, tenant=tenant)
        assert membership.role == TenantMembership.Role.OWNER
        assert membership.is_active is True

        onboarding_req = OnboardingRequest.objects.get(idempotency_key=idempotency_key)
        assert onboarding_req.status == OnboardingRequest.Status.COMMITTED
        assert onboarding_req.user == user
        assert onboarding_req.tenant == tenant
        assert onboarding_req.response_status_code == 202

        audit = PlatformAuditLog.objects.get(tenant_slug="prestige-plaza")
        assert audit.action == "TENANT_REGISTERED"
        assert audit.actor_email == user.email

    def test_idempotent_replay_returns_cached_response_without_duplicate_creation(
        self, client: APIClient, valid_payload: dict
    ) -> None:
        idempotency_key = f"idemp-test-{uuid.uuid4()}"

        # Request 1
        resp1 = client.post(
            "/api/v1/onboarding/register/",
            data=valid_payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert resp1.status_code == status.HTTP_202_ACCEPTED

        initial_user_count = User.objects.count()
        initial_tenant_count = CinemaTenant.objects.count()
        initial_membership_count = TenantMembership.objects.count()

        # Request 2 (Exact duplicate replay)
        resp2 = client.post(
            "/api/v1/onboarding/register/",
            data=valid_payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert resp2.status_code == status.HTTP_202_ACCEPTED
        assert resp2.data == resp1.data

        # Verify no duplicate records created in DB
        assert User.objects.count() == initial_user_count
        assert CinemaTenant.objects.count() == initial_tenant_count
        assert TenantMembership.objects.count() == initial_membership_count

    def test_idempotency_payload_mutation_returns_409_conflict(
        self, client: APIClient, valid_payload: dict
    ) -> None:
        idempotency_key = f"idemp-test-{uuid.uuid4()}"

        # Request 1
        resp1 = client.post(
            "/api/v1/onboarding/register/",
            data=valid_payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert resp1.status_code == status.HTTP_202_ACCEPTED

        # Request 2 (Same key, but altered cinema name)
        mutated_payload = dict(valid_payload)
        mutated_payload["cinema"] = dict(valid_payload["cinema"])
        mutated_payload["cinema"]["name"] = "Mutated Cinema Name"

        resp2 = client.post(
            "/api/v1/onboarding/register/",
            data=mutated_payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert resp2.status_code == status.HTTP_409_CONFLICT
        assert resp2.data["code"] == "idempotency_conflict"
        assert "different registration payload" in resp2.data["detail"]

    def test_flat_payload_format_is_supported(self, client: APIClient) -> None:
        idempotency_key = f"idemp-test-{uuid.uuid4()}"
        flat_payload = {
            "name": "Flat Cinema Hub",
            "subdomain": "flat-cinema",
            "city": "Mombasa",
            "first_name": "Fatuma",
            "last_name": "Ali",
            "email": "fatuma.ali@flatcinema.ke",
            "password": "StrongPassword99!",
            "primary_color": "#B8121B",
        }

        response = client.post(
            "/api/v1/onboarding/register/",
            data=flat_payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["cinema_slug"] == "flat-cinema"
        assert CinemaTenant.objects.filter(slug="flat-cinema").exists()
        assert User.objects.filter(email="fatuma.ali@flatcinema.ke").exists()
