"""
First-class security test suite for multi-tenant isolation and host defense.
Verifies Host Header Poisoning defense, suffix injection prevention,
cross-tenant BOLA / IDOR mitigation, 90-day domain quarantine, and schema immutability.
"""

from datetime import timedelta
from typing import Any, cast

import pytest
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import connection
from django.test import Client, RequestFactory
from django.utils import timezone
from rest_framework import status
from rest_framework.request import Request
from rest_framework.test import APIClient
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import TenantMembership, User
from apps.accounts.permissions import IsTenantManager, IsTenantOwner, IsTenantStaff
from apps.cinemas.models import CinemaDomain, CinemaTenant
from apps.cinemas.services.subdomain import SubdomainService


@pytest.fixture
def isolation_setup(db: None) -> dict[str, Any]:
    """
    Set up two isolated cinema tenants (Cinema A and Cinema B),
    public hub, and respective domain routing records.
    """
    if hasattr(connection, "set_schema_to_public"):
        connection.set_schema_to_public()

    cache.clear()

    # Public Platform Tenant
    public_tenant, _ = CinemaTenant.objects.get_or_create(
        schema_name="public",
        defaults={
            "name": "Africinemas Hub",
            "slug": "public",
            "city": "Nairobi",
        },
    )
    CinemaDomain.objects.get_or_create(
        domain="africinemas.com",
        defaults={"tenant": public_tenant, "is_primary": True},
    )
    CinemaDomain.objects.get_or_create(
        domain="localhost",
        defaults={"tenant": public_tenant, "is_primary": False},
    )

    # Cinema A: Anga Diamond Plaza
    tenant_a = CinemaTenant.objects.create(
        name="Anga Diamond Plaza",
        slug="anga-diamond",
        city="Nairobi",
    )
    domain_a = CinemaDomain.objects.create(
        domain="anga.africinemas.com",
        tenant=tenant_a,
        is_primary=True,
    )

    # Cinema B: Westgate Mall Cinema
    tenant_b = CinemaTenant.objects.create(
        name="Westgate Mall Cinema",
        slug="westgate-mall",
        city="Nairobi",
    )
    domain_b = CinemaDomain.objects.create(
        domain="westgate.africinemas.com",
        tenant=tenant_b,
        is_primary=True,
    )

    # Operator A (Owner & Manager of Cinema A)
    user_a = User.objects.create_user(
        email="manager.a@angacinemas.ke",
        first_name="Alice",
        last_name="Anga",
        password="SecurePass99A!",
    )
    TenantMembership.objects.create(
        user=user_a,
        tenant=tenant_a,
        role=TenantMembership.Role.OWNER,
        is_active=True,
    )

    # Operator B (Owner & Manager of Cinema B)
    user_b = User.objects.create_user(
        email="manager.b@westgatecinema.ke",
        first_name="Bob",
        last_name="Westgate",
        password="SecurePass99B!",
    )
    TenantMembership.objects.create(
        user=user_b,
        tenant=tenant_b,
        role=TenantMembership.Role.OWNER,
        is_active=True,
    )

    return {
        "tenant_a": tenant_a,
        "domain_a": domain_a,
        "user_a": user_a,
        "tenant_b": tenant_b,
        "domain_b": domain_b,
        "user_b": user_b,
    }


@pytest.mark.django_db
class TestHostHeaderPoisoningAndSuffixDefense:
    """Verify HTTP Host header poisoning and suffix injection attacks are rejected."""

    @pytest.fixture(autouse=True)
    def _ensure_public(self) -> None:
        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

    def test_unmapped_forged_host_returns_404(self, isolation_setup: dict) -> None:
        """Requests with unmapped external hosts must return 404 without activating tenant schemas."""
        client = Client(headers={"host": "evil-attacker.com"})
        response = client.get("/api/v1/health/")
        assert response.status_code == 404
        assert getattr(connection, "schema_name", "public") == "public"

    @pytest.mark.parametrize(
        "malicious_host",
        [
            "attacker-anga.africinemas.com",
            "anga-attacker.africinemas.com",
            "anga.africinemas.com.evil.com",
            "evil.com:anga.africinemas.com",
            "anga.africinemas.com.attacker.ke",
        ],
    )
    def test_suffix_and_confusable_domain_injection_rejected(
        self, isolation_setup: dict, malicious_host: str
    ) -> None:
        """
        Attacker domains attempting suffix confusion (e.g. anga.africinemas.com.evil.com)
        must never resolve to Cinema A's schema and must return 404.
        """
        client = Client(headers={"host": malicious_host})
        response = client.get("/api/v1/health/")
        assert response.status_code == 404
        assert (
            getattr(connection, "schema_name", "public") != isolation_setup["tenant_a"].schema_name
        )


@pytest.mark.django_db
class TestCrossTenantBOLAandIDORDefense:
    """
    Verify zero-trust cross-tenant isolation.
    An authenticated operator at Cinema A cannot read or modify resources at Cinema B.
    """

    @pytest.fixture(autouse=True)
    def _ensure_public(self) -> None:
        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

    def test_operator_cannot_access_other_tenant_with_manager_permission(
        self, isolation_setup: dict
    ) -> None:
        """
        User A (Manager of Cinema A) must be rejected with 403 when requesting
        an endpoint protected by IsTenantManager on Cinema B's host.
        """
        rf = RequestFactory()
        view = APIView()

        # Simulated request on Cinema B's domain with User A's identity
        django_req = rf.get("/api/v1/manager/reports/", HTTP_HOST="westgate.africinemas.com")
        django_req.tenant = isolation_setup["tenant_b"]  # type: ignore[attr-defined]
        django_req.user = isolation_setup["user_a"]

        drf_req = Request(django_req)
        drf_req.user = isolation_setup["user_a"]

        perm = IsTenantManager()
        assert perm.has_permission(drf_req, view) is False
        assert perm.has_object_permission(drf_req, view, None) is False

    def test_operator_has_permission_on_their_own_tenant(self, isolation_setup: dict) -> None:
        """User A has valid permission when requesting Cinema A's domain."""
        rf = RequestFactory()
        view = APIView()

        django_req = rf.get("/api/v1/manager/reports/", HTTP_HOST="anga.africinemas.com")
        django_req.tenant = isolation_setup["tenant_a"]  # type: ignore[attr-defined]
        django_req.user = isolation_setup["user_a"]

        drf_req = Request(django_req)
        drf_req.user = isolation_setup["user_a"]

        perm = IsTenantManager()
        assert perm.has_permission(drf_req, view) is True
        assert perm.has_object_permission(drf_req, view, None) is True

    def test_forged_cinema_id_header_cannot_override_server_derived_tenant(
        self, isolation_setup: dict
    ) -> None:
        """
        Passing header X-Cinema-ID pointing to Cinema A while requesting Cinema B
        must not grant authorization on Cinema B.
        """
        rf = RequestFactory()
        view = APIView()

        django_req = rf.get(
            "/api/v1/manager/reports/",
            HTTP_HOST="westgate.africinemas.com",
            HTTP_X_CINEMA_ID=str(isolation_setup["tenant_a"].uuid),
        )
        django_req.tenant = isolation_setup["tenant_b"]  # type: ignore[attr-defined]
        django_req.user = isolation_setup["user_a"]

        drf_req = Request(django_req)
        drf_req.user = isolation_setup["user_a"]

        assert IsTenantOwner().has_permission(drf_req, view) is False
        assert IsTenantManager().has_permission(drf_req, view) is False
        assert IsTenantStaff().has_permission(drf_req, view) is False

    def test_cross_tenant_jwt_token_rejection(self, isolation_setup: dict) -> None:
        """
        JWT access token issued for Operator A embeds only Cinema A's memberships,
        preventing privilege escalation on Cinema B.
        """
        from apps.accounts.serializers import CustomTokenObtainPairSerializer

        token_a = cast(
            RefreshToken,
            CustomTokenObtainPairSerializer.get_token(isolation_setup["user_a"]),
        )
        membership_slugs = [m["tenant_slug"] for m in token_a["memberships"]]
        assert "anga-diamond" in membership_slugs
        assert "westgate-mall" not in membership_slugs

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token_a.access_token)}")

        response = client.get("/api/v1/auth/me/", HTTP_HOST="westgate.africinemas.com")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "manager.a@angacinemas.ke"

        # Explicitly verify that Operator A has no membership records in Cinema B
        assert (
            TenantMembership.objects.filter(
                user=isolation_setup["user_a"],
                tenant=isolation_setup["tenant_b"],
            ).exists()
            is False
        )


@pytest.mark.django_db
class TestDomainQuarantineSecurity:
    """Verify 90-day cooldown quarantine protects retired cinema subdomains from takeover."""

    @pytest.fixture(autouse=True)
    def _setup_public(self) -> None:
        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

        public_tenant, _ = CinemaTenant.objects.get_or_create(
            schema_name="public",
            defaults={"name": "Africinemas Hub", "slug": "public", "city": "Nairobi"},
        )
        CinemaDomain.objects.get_or_create(
            domain="testserver",
            defaults={"tenant": public_tenant, "is_primary": True},
        )

    def test_cooling_down_subdomain_rejects_onboarding_registration(self) -> None:
        """An active 90-day quarantine domain rejects registration with HTTP 400."""
        decom_tenant = CinemaTenant.objects.create(
            name="Decommissioned Cineplex",
            slug="decom-cineplex",
        )
        CinemaDomain.objects.create(
            domain="decom-cineplex.africinemas.com",
            tenant=decom_tenant,
            status=CinemaDomain.DomainStatus.COOLING_DOWN,
            cooldown_until=timezone.now() + timedelta(days=60),
        )

        # Check SubdomainService directly
        avail = SubdomainService.check_availability("decom-cineplex")
        assert avail["available"] is False
        assert avail["status"] == "COOLING_DOWN"
        assert len(avail["suggestions"]) > 0

        # Attempt API registration
        client = APIClient()
        payload = {
            "name": "Attacker Hijack Attempt",
            "subdomain": "decom-cineplex",
            "first_name": "Attacker",
            "last_name": "User",
            "email": "attacker@hijack.com",
            "password": "Password123!",
        }
        response = client.post(
            "/api/v1/onboarding/register/",
            data=payload,
            format="json",
            HTTP_X_IDEMPOTENCY_KEY="hijack-attempt-1",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "cinema" in response.data
        assert "cooldown" in str(response.data["cinema"]).lower()

    def test_expired_quarantine_domain_allows_reregistration(self) -> None:
        """A domain whose 90-day cooldown has passed can be re-registered."""
        expired_tenant = CinemaTenant.objects.create(
            name="Old Decommissioned",
            slug="old-decom",
        )
        CinemaDomain.objects.create(
            domain="reclaimable.africinemas.com",
            tenant=expired_tenant,
            status=CinemaDomain.DomainStatus.COOLING_DOWN,
            cooldown_until=timezone.now() - timedelta(days=1),
        )

        avail = SubdomainService.check_availability("reclaimable")
        assert avail["available"] is True
        assert avail["status"] == "AVAILABLE"


@pytest.mark.django_db
class TestTenantSchemaImmutability:
    """Verify tenant schema_name cannot be mutated after creation."""

    @pytest.fixture(autouse=True)
    def _ensure_public(self) -> None:
        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

    def test_schema_name_mutation_raises_validation_error(self) -> None:
        tenant = CinemaTenant.objects.create(
            name="Immutable Cine",
            slug="immutable-cine",
        )
        assert tenant.schema_name == "tenant_immutable_cine"

        # Attempt to mutate schema_name to hijack another schema
        tenant.schema_name = "tenant_attacker_hijack"
        with pytest.raises(ValidationError, match="cannot be mutated"):
            tenant.clean()
