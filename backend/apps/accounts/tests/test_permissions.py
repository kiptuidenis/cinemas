"""
Unit tests for multi-tenant RBAC permission classes.
Verifies role boundaries, tenant scoping, and isolation against cross-tenant privilege escalation.
"""

from unittest.mock import MagicMock

import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from apps.accounts.models import TenantMembership, User
from apps.accounts.permissions import (
    IsPlatformSuperAdmin,
    IsTenantManager,
    IsTenantOwner,
    IsTenantStaff,
)
from apps.cinemas.models import CinemaTenant


@pytest.mark.django_db
class TestTenantRBACPermissions:
    """Test suite for tenant-scoped authorization permissions."""

    @pytest.fixture
    def factory(self) -> APIRequestFactory:
        return APIRequestFactory()

    @pytest.fixture
    def tenant_a(self) -> CinemaTenant:
        return CinemaTenant.objects.create(name="Westgate Cinema", slug="westgate", city="Nairobi")

    @pytest.fixture
    def tenant_b(self) -> CinemaTenant:
        return CinemaTenant.objects.create(name="Rupa's Cinema", slug="rupas", city="Eldoret")

    @pytest.fixture
    def public_tenant(self) -> CinemaTenant:
        return CinemaTenant.objects.create(
            name="Public Platform", slug="public", schema_name="public"
        )

    @pytest.fixture
    def owner_user(self) -> User:
        return User.objects.create_user(email="owner@westgate.com", password="Password123!")

    @pytest.fixture
    def manager_user(self) -> User:
        return User.objects.create_user(email="manager@westgate.com", password="Password123!")

    @pytest.fixture
    def cashier_user(self) -> User:
        return User.objects.create_user(email="cashier@westgate.com", password="Password123!")

    @pytest.fixture
    def superadmin_user(self) -> User:
        return User.objects.create_superuser(
            email="superadmin@africinemas.com", password="Password123!"
        )

    def _build_request(
        self, factory: APIRequestFactory, user: User | None, tenant: CinemaTenant | None
    ) -> Request:
        django_req = factory.get("/api/v1/test/")
        django_req.user = user  # type: ignore[assignment]
        django_req.tenant = tenant  # type: ignore[attr-defined]
        drf_req = Request(django_req)
        if user is not None:
            drf_req._user = user  # type: ignore[attr-defined]
        return drf_req

    def test_is_tenant_owner_permits_active_owner(
        self, factory: APIRequestFactory, owner_user: User, tenant_a: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=owner_user, tenant=tenant_a, role=TenantMembership.Role.OWNER
        )
        req = self._build_request(factory, owner_user, tenant_a)
        assert IsTenantOwner().has_permission(req, MagicMock()) is True

    def test_is_tenant_owner_rejects_manager(
        self, factory: APIRequestFactory, manager_user: User, tenant_a: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=manager_user, tenant=tenant_a, role=TenantMembership.Role.MANAGER
        )
        req = self._build_request(factory, manager_user, tenant_a)
        assert IsTenantOwner().has_permission(req, MagicMock()) is False

    def test_is_tenant_owner_rejects_owner_of_different_tenant(
        self,
        factory: APIRequestFactory,
        owner_user: User,
        tenant_a: CinemaTenant,
        tenant_b: CinemaTenant,
    ) -> None:
        # User is OWNER of tenant_a, but request targets tenant_b
        TenantMembership.objects.create(
            user=owner_user, tenant=tenant_a, role=TenantMembership.Role.OWNER
        )
        req = self._build_request(factory, owner_user, tenant_b)
        assert IsTenantOwner().has_permission(req, MagicMock()) is False

    def test_is_tenant_owner_rejects_inactive_membership(
        self, factory: APIRequestFactory, owner_user: User, tenant_a: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=owner_user, tenant=tenant_a, role=TenantMembership.Role.OWNER, is_active=False
        )
        req = self._build_request(factory, owner_user, tenant_a)
        assert IsTenantOwner().has_permission(req, MagicMock()) is False

    def test_is_tenant_owner_rejects_public_schema(
        self, factory: APIRequestFactory, owner_user: User, public_tenant: CinemaTenant
    ) -> None:
        req = self._build_request(factory, owner_user, public_tenant)
        assert IsTenantOwner().has_permission(req, MagicMock()) is False

    def test_is_tenant_manager_permits_owner_and_manager(
        self,
        factory: APIRequestFactory,
        owner_user: User,
        manager_user: User,
        tenant_a: CinemaTenant,
    ) -> None:
        TenantMembership.objects.create(
            user=owner_user, tenant=tenant_a, role=TenantMembership.Role.OWNER
        )
        TenantMembership.objects.create(
            user=manager_user, tenant=tenant_a, role=TenantMembership.Role.MANAGER
        )

        req_owner = self._build_request(factory, owner_user, tenant_a)
        req_manager = self._build_request(factory, manager_user, tenant_a)

        assert IsTenantManager().has_permission(req_owner, MagicMock()) is True
        assert IsTenantManager().has_permission(req_manager, MagicMock()) is True

    def test_is_tenant_manager_rejects_cashier(
        self, factory: APIRequestFactory, cashier_user: User, tenant_a: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=cashier_user, tenant=tenant_a, role=TenantMembership.Role.CASHIER
        )
        req = self._build_request(factory, cashier_user, tenant_a)
        assert IsTenantManager().has_permission(req, MagicMock()) is False

    def test_is_tenant_staff_permits_all_roles(
        self, factory: APIRequestFactory, cashier_user: User, tenant_a: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=cashier_user, tenant=tenant_a, role=TenantMembership.Role.CASHIER
        )
        req = self._build_request(factory, cashier_user, tenant_a)
        assert IsTenantStaff().has_permission(req, MagicMock()) is True

    def test_is_platform_superadmin(
        self, factory: APIRequestFactory, superadmin_user: User, owner_user: User
    ) -> None:
        req_super = self._build_request(factory, superadmin_user, None)
        req_owner = self._build_request(factory, owner_user, None)

        assert IsPlatformSuperAdmin().has_permission(req_super, MagicMock()) is True
        assert IsPlatformSuperAdmin().has_permission(req_owner, MagicMock()) is False
