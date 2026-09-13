"""
Integration tests for public onboarding polling and live subdomain check API endpoints.
"""

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.cinemas.models import CinemaDomain, CinemaTenant


@pytest.mark.django_db
class TestOnboardingPollingAndSubdomainAPI:
    """Test suite for live subdomain check and status polling endpoints."""

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

    # --- Subdomain Check API ---

    def test_subdomain_check_missing_param_returns_400(self, client: APIClient) -> None:
        response = client.get("/api/v1/onboarding/check-subdomain/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_subdomain_check_available_slug_returns_200(self, client: APIClient) -> None:
        response = client.get("/api/v1/onboarding/check-subdomain/?subdomain=eldoret-cinema")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is True
        assert response.data["status"] == "AVAILABLE"
        assert response.data["subdomain"] == "eldoret-cinema"

    def test_subdomain_check_reserved_word_returns_200_with_suggestions(
        self, client: APIClient
    ) -> None:
        response = client.get("/api/v1/onboarding/check-subdomain/?subdomain=billing")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False
        assert response.data["status"] == "RESERVED"
        assert len(response.data["suggestions"]) > 0

    # --- Onboarding Status Polling API ---

    def test_polling_missing_slug_returns_400(self, client: APIClient) -> None:
        response = client.get("/api/v1/onboarding/status/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_polling_nonexistent_cinema_returns_404(self, client: APIClient) -> None:
        response = client.get("/api/v1/onboarding/status/?slug=non-existent-cinema")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_polling_tenant_in_provisioning_state(self, client: APIClient) -> None:
        tenant = CinemaTenant.objects.create(
            name="Garden City Cinema",
            slug="garden-city",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now(),
            provisioning_attempts=1,
        )

        response = client.get(f"/api/v1/onboarding/status/?slug={tenant.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["cinema_slug"] == "garden-city"
        assert response.data["status"] == "PROVISIONING"
        assert response.data["ready"] is False
        assert response.data["launch_url"] is None
        assert response.data["provisioning_attempts"] == 1

    def test_polling_tenant_in_ready_state(self, client: APIClient) -> None:
        tenant = CinemaTenant.objects.create(
            name="Sarit Centre Cinema",
            slug="sarit-centre",
            provisioning_status=CinemaTenant.ProvisioningStatus.READY,
            provisioning_started_at=timezone.now(),
            provisioning_completed_at=timezone.now(),
            provisioning_attempts=1,
        )

        response = client.get(f"/api/v1/onboarding/status/?slug={tenant.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["cinema_slug"] == "sarit-centre"
        assert response.data["status"] == "READY"
        assert response.data["ready"] is True
        assert response.data["launch_url"] == "https://sarit-centre.africinemas.com"
        assert response.data["error"] is None

    def test_polling_tenant_in_failed_state(self, client: APIClient) -> None:
        tenant = CinemaTenant.objects.create(
            name="Failing Cinema",
            slug="failing-cinema",
            provisioning_status=CinemaTenant.ProvisioningStatus.FAILED,
            provisioning_error="Migration timeout on table screens",
            provisioning_started_at=timezone.now(),
            provisioning_attempts=3,
        )

        response = client.get(f"/api/v1/onboarding/status/?slug={tenant.slug}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["cinema_slug"] == "failing-cinema"
        assert response.data["status"] == "FAILED"
        assert response.data["ready"] is False
        assert response.data["error"] == "Migration timeout on table screens"
        assert response.data["launch_url"] is None
