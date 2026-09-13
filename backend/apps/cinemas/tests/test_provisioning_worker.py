"""
Unit and integration tests for TenantProvisioningRunner and TenantSeeder.
Validates schema initialization, turnkey operational configuration, starter theme tokens,
error handling, and status state transitions.
"""

from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.cinemas.models import (
    CinemaPaymentConfig,
    CinemaTenant,
    CinemaTheme,
    PlatformAuditLog,
    TenantOperationalConfig,
)
from apps.cinemas.services.provisioning import TenantProvisioningRunner
from apps.cinemas.services.seeder import TenantSeeder


@pytest.mark.django_db
class TestTenantProvisioningWorker:
    """Test suite for asynchronous tenant provisioning runner and seeder."""

    @pytest.fixture(autouse=True)
    def _ensure_public_schema(self) -> None:
        from django.db import connection

        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

    @pytest.fixture
    def unprovisioned_tenant(self) -> CinemaTenant:
        return CinemaTenant.objects.create(
            name="Two Rivers Mall Cinema",
            slug="two-rivers",
            city="Nairobi",
            contact_email="management@tworiverscinema.ke",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now(),
            provisioning_attempts=1,
        )

    def test_provision_tenant_transitions_to_ready_and_seeds_turnkey_defaults(
        self, unprovisioned_tenant: CinemaTenant
    ) -> None:
        success = TenantProvisioningRunner.provision_tenant(unprovisioned_tenant.id)
        assert success is True

        # Refresh tenant from database
        tenant = CinemaTenant.objects.get(id=unprovisioned_tenant.id)
        assert tenant.provisioning_status == CinemaTenant.ProvisioningStatus.READY
        assert tenant.provisioning_completed_at is not None
        assert tenant.provisioning_error == ""
        assert tenant.last_provisioning_attempt_at is not None

        # Verify Turnkey Operational Defaults Seeding
        op_config = TenantOperationalConfig.objects.get(tenant=tenant)
        assert op_config.hold_ttl_seconds == 420  # 7-minute hold TTL
        assert op_config.max_seats_per_order == 8  # Max 8 tickets
        assert op_config.booking_confirmation_email is True
        assert op_config.booking_confirmation_sms is True
        assert len(op_config.onboarding_checklist) == 3
        assert any(item["id"] == "add_screen" for item in op_config.onboarding_checklist)

        # Verify IntaSend 10% Platform Escrow Default
        payment_config = CinemaPaymentConfig.objects.get(tenant=tenant)
        assert payment_config.gateway_mode == CinemaPaymentConfig.GatewayMode.INTASEND_ESCROW
        assert str(payment_config.platform_fee_percent) == "10.00"
        assert payment_config.is_active is True

        # Verify Cinema Theme Tokens
        theme = CinemaTheme.objects.get(tenant=tenant)
        assert theme.primary_color == "#E61C24"

        # Verify Platform Audit Trail Record
        audit_log = PlatformAuditLog.objects.filter(
            tenant_slug="two-rivers", action="TENANT_PROVISIONED"
        ).first()
        assert audit_log is not None
        assert audit_log.details["schema_name"] == tenant.schema_name

    def test_provision_tenant_handles_exceptions_and_records_failure_diagnostics(
        self, unprovisioned_tenant: CinemaTenant
    ) -> None:
        error_msg = "Database deadlocked during screen schema creation"
        with patch.object(TenantSeeder, "seed_tenant", side_effect=RuntimeError(error_msg)):
            success = TenantProvisioningRunner.provision_tenant(unprovisioned_tenant.id)

        assert success is False

        tenant = CinemaTenant.objects.get(id=unprovisioned_tenant.id)
        assert tenant.provisioning_status == CinemaTenant.ProvisioningStatus.FAILED
        assert error_msg in tenant.provisioning_error
        assert tenant.provisioning_completed_at is None

        audit_log = PlatformAuditLog.objects.filter(
            tenant_slug="two-rivers", action="TENANT_PROVISIONING_FAILED"
        ).first()
        assert audit_log is not None
        assert error_msg in audit_log.details["error"]

    def test_provision_tenant_is_idempotent_when_already_ready(
        self, unprovisioned_tenant: CinemaTenant
    ) -> None:
        # First execution -> READY
        TenantProvisioningRunner.provision_tenant(unprovisioned_tenant.id)

        # Second execution on already READY tenant
        success = TenantProvisioningRunner.provision_tenant(unprovisioned_tenant.id)
        assert success is True

        tenant = CinemaTenant.objects.get(id=unprovisioned_tenant.id)
        assert tenant.provisioning_status == CinemaTenant.ProvisioningStatus.READY

    def test_provision_tenant_rejects_suspended_state(
        self, unprovisioned_tenant: CinemaTenant
    ) -> None:
        unprovisioned_tenant.provisioning_status = CinemaTenant.ProvisioningStatus.SUSPENDED
        unprovisioned_tenant.save()

        success = TenantProvisioningRunner.provision_tenant(unprovisioned_tenant.id)
        assert success is False

    def test_operational_config_mark_checklist_item(
        self, unprovisioned_tenant: CinemaTenant
    ) -> None:
        TenantProvisioningRunner.provision_tenant(unprovisioned_tenant.id)
        op_config = TenantOperationalConfig.objects.get(tenant=unprovisioned_tenant)

        # Mark "add_screen" task as complete
        op_config.mark_checklist_item("add_screen", completed=True)

        refreshed = TenantOperationalConfig.objects.get(id=op_config.id)
        screen_item = next(
            item for item in refreshed.onboarding_checklist if item["id"] == "add_screen"
        )
        assert screen_item["completed"] is True
