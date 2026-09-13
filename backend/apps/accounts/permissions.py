"""
Multi-tenant Role-Based Access Control (RBAC) permission classes.
Derives tenant context strictly from the server-resolved request.tenant,
preventing cross-tenant BOLA / IDOR vulnerabilities.
"""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import TenantMembership


class IsPlatformSuperAdmin(BasePermission):
    """Allows access strictly to Africinemas platform superadmins."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
            and request.user.is_superuser
        )


class IsTenantOwner(BasePermission):
    """
    Grants access only to users with the OWNER role for the current active request.tenant.
    Rejects requests from public schema or unauthenticated users.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        tenant = getattr(request, "tenant", None)
        if not tenant or getattr(tenant, "schema_name", "") == "public":
            return False

        return TenantMembership.objects.filter(
            user=request.user,
            tenant=tenant,
            role=TenantMembership.Role.OWNER,
            is_active=True,
        ).exists()

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self.has_permission(request, view)


class IsTenantManager(BasePermission):
    """
    Grants access to OWNER and MANAGER roles for the current active request.tenant.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        tenant = getattr(request, "tenant", None)
        if not tenant or getattr(tenant, "schema_name", "") == "public":
            return False

        return TenantMembership.objects.filter(
            user=request.user,
            tenant=tenant,
            role__in=[TenantMembership.Role.OWNER, TenantMembership.Role.MANAGER],
            is_active=True,
        ).exists()

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self.has_permission(request, view)


class IsTenantStaff(BasePermission):
    """
    Grants access to any active staff member (OWNER, MANAGER, CASHIER, USHER)
    for the current active request.tenant.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        tenant = getattr(request, "tenant", None)
        if not tenant or getattr(tenant, "schema_name", "") == "public":
            return False

        return TenantMembership.objects.filter(
            user=request.user,
            tenant=tenant,
            is_active=True,
        ).exists()

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self.has_permission(request, view)
