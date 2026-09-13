"""
Tenant provisioning runner for executing PostgreSQL schema creation,
django-tenants migration execution, and turnkey seeding.
"""

import logging
import uuid
from typing import Any

from django.db import connection
from django.utils import timezone

from apps.cinemas.models import CinemaTenant, PlatformAuditLog
from apps.cinemas.services.seeder import TenantSeeder

logger = logging.getLogger(__name__)


class TenantProvisioningRunner:
    """
    Asynchronous runner executing isolated schema creation, DDL table migrations,
    and turnkey defaults seeding for new CinemaTenants.
    """

    @classmethod
    def provision_tenant(
        cls,
        tenant_id: Any,
        raise_exception: bool = False,
    ) -> bool:
        """
        Execute tenant provisioning saga.

        Args:
            tenant_id: Integer PK, UUID, slug, or CinemaTenant model instance.
            raise_exception: If True, re-raises any caught exceptions (useful in tests).

        Returns:
            bool: True if provisioning succeeded or was already READY, False otherwise.
        """
        tenant = cls._resolve_tenant(tenant_id)
        if not tenant:
            logger.error("Tenant '%s' could not be resolved for provisioning.", tenant_id)
            return False

        if not cls._can_provision(tenant):
            return tenant.provisioning_status == CinemaTenant.ProvisioningStatus.READY

        tenant.last_provisioning_attempt_at = timezone.now()
        tenant.save(update_fields=["last_provisioning_attempt_at"])

        try:
            cls._create_tenant_schema(tenant)

            # Ensure execution returns to public schema for shared models seeding
            cls._ensure_public_schema()

            # Seed operational defaults, payments, and theme tokens
            logger.info("Invoking TenantSeeder for '%s'", tenant.slug)
            TenantSeeder.seed_tenant(tenant)

            # Transition to READY
            cls._mark_tenant_ready(tenant)
            return True

        except Exception as exc:
            logger.exception("Provisioning execution failed for tenant '%s': %s", tenant.slug, exc)
            cls._ensure_public_schema()
            cls._mark_tenant_failed(tenant, str(exc))

            if raise_exception:
                raise
            return False
        finally:
            cls._ensure_public_schema()

    @classmethod
    def _can_provision(cls, tenant: CinemaTenant) -> bool:
        """Verify tenant is in a valid state for provisioning."""
        if tenant.provisioning_status in [
            CinemaTenant.ProvisioningStatus.PROVISIONING,
            CinemaTenant.ProvisioningStatus.RETRYING,
        ]:
            return True

        if tenant.provisioning_status == CinemaTenant.ProvisioningStatus.READY:
            logger.info(
                "Tenant '%s' is already in READY state. Skipping provisioning.", tenant.slug
            )
        else:
            logger.warning(
                "Tenant '%s' is in state '%s'; cannot provision.",
                tenant.slug,
                tenant.provisioning_status,
            )
        return False

    @classmethod
    def _create_tenant_schema(cls, tenant: CinemaTenant) -> None:
        """Execute PostgreSQL schema creation or SQLite connection shim."""
        if connection.vendor == "postgresql":
            logger.info(
                "Executing PostgreSQL schema creation for '%s' (schema: %s)",
                tenant.slug,
                tenant.schema_name,
            )
            tenant.create_schema(check_if_exists=True, sync_schema=True)
        elif hasattr(connection, "set_schema"):
            connection.set_schema(tenant.schema_name)

    @classmethod
    def _ensure_public_schema(cls) -> None:
        """Restore active database connection schema to public."""
        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

    @classmethod
    def _mark_tenant_ready(cls, tenant: CinemaTenant) -> None:
        """Update tenant state to READY and record audit log."""
        tenant.provisioning_status = CinemaTenant.ProvisioningStatus.READY
        tenant.provisioning_completed_at = timezone.now()
        tenant.provisioning_error = ""
        tenant.save(
            update_fields=[
                "provisioning_status",
                "provisioning_completed_at",
                "provisioning_error",
            ]
        )

        PlatformAuditLog.objects.create(
            action="TENANT_PROVISIONED",
            tenant_slug=tenant.slug,
            details={
                "attempts": tenant.provisioning_attempts,
                "schema_name": tenant.schema_name,
            },
        )
        logger.info("Tenant '%s' successfully provisioned and transitioned to READY.", tenant.slug)

    @classmethod
    def _mark_tenant_failed(cls, tenant: CinemaTenant, error_msg: str) -> None:
        """Update tenant state to FAILED and record audit log."""
        tenant.provisioning_status = CinemaTenant.ProvisioningStatus.FAILED
        tenant.provisioning_error = error_msg
        tenant.save(
            update_fields=[
                "provisioning_status",
                "provisioning_error",
            ]
        )

        PlatformAuditLog.objects.create(
            action="TENANT_PROVISIONING_FAILED",
            tenant_slug=tenant.slug,
            details={
                "error": error_msg,
                "attempts": tenant.provisioning_attempts,
            },
        )

    @classmethod
    def _resolve_tenant(cls, tenant_id: Any) -> CinemaTenant | None:
        """Resolve a tenant reference into a CinemaTenant model instance."""
        if isinstance(tenant_id, CinemaTenant):
            return tenant_id

        if isinstance(tenant_id, int) or (isinstance(tenant_id, str) and tenant_id.isdigit()):
            return CinemaTenant.objects.filter(id=int(tenant_id)).first()

        if isinstance(tenant_id, uuid.UUID):
            return CinemaTenant.objects.filter(uuid=tenant_id).first()

        if isinstance(tenant_id, str):
            try:
                parsed_uuid = uuid.UUID(tenant_id)
                return CinemaTenant.objects.filter(uuid=parsed_uuid).first()
            except ValueError:
                return CinemaTenant.objects.filter(slug=tenant_id).first()

        return None
