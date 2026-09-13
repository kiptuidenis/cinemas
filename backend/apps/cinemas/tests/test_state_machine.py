"""
Unit tests for tenant provisioning state machine, domain cooldown quarantine,
and platform audit trail logging.
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.cinemas.models import (
    CinemaDomain,
    CinemaTenant,
    PlatformAuditLog,
)


@pytest.mark.django_db
class TestTenantProvisioningStateMachine:
    """Test suite for CinemaTenant and CinemaDomain state machine transitions."""

    def test_tenant_provisioning_status_choices(self) -> None:
        expected_statuses = {
            "PENDING",
            "PROVISIONING",
            "READY",
            "FAILED",
            "RETRYING",
            "SUSPENDED",
            "DELETING",
        }
        actual_statuses = set(CinemaTenant.ProvisioningStatus.values)
        assert expected_statuses == actual_statuses

    def test_domain_status_choices(self) -> None:
        expected_statuses = {"ACTIVE", "COOLING_DOWN", "RELEASED"}
        actual_statuses = set(CinemaDomain.DomainStatus.values)
        assert expected_statuses == actual_statuses

    def test_tenant_state_transitions_and_error_capture(self) -> None:
        tenant = CinemaTenant.objects.create(
            name="State Machine Cinema",
            slug="state-machine-cinema",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now(),
            provisioning_attempts=1,
        )
        assert tenant.provisioning_status == "PROVISIONING"
        assert tenant.provisioning_attempts == 1
        assert tenant.provisioning_error == ""

        # Transition to FAILED on runner exception
        tenant.provisioning_status = CinemaTenant.ProvisioningStatus.FAILED
        tenant.provisioning_error = "OperationalError: connection to server lost"
        tenant.last_provisioning_attempt_at = timezone.now()
        tenant.save()

        refreshed = CinemaTenant.objects.get(id=tenant.id)
        assert refreshed.provisioning_status == "FAILED"
        assert "OperationalError" in refreshed.provisioning_error

        # Transition to RETRYING
        refreshed.provisioning_status = CinemaTenant.ProvisioningStatus.RETRYING
        refreshed.provisioning_attempts += 1
        refreshed.save()

        assert refreshed.provisioning_attempts == 2

        # Transition to READY
        refreshed.provisioning_status = CinemaTenant.ProvisioningStatus.READY
        refreshed.provisioning_completed_at = timezone.now()
        refreshed.provisioning_error = ""
        refreshed.save()

        final = CinemaTenant.objects.get(id=tenant.id)
        assert final.provisioning_status == "READY"
        assert final.provisioning_completed_at is not None

    def test_domain_cooldown_quarantine_dates(self) -> None:
        tenant = CinemaTenant.objects.create(
            name="Decommissioned Plaza",
            slug="decom-plaza",
        )
        now = timezone.now()
        cooldown_90_days = now + timedelta(days=90)

        domain = CinemaDomain.objects.create(
            domain="decom-plaza.africinemas.com",
            tenant=tenant,
            status=CinemaDomain.DomainStatus.COOLING_DOWN,
            cooldown_until=cooldown_90_days,
        )

        assert domain.status == "COOLING_DOWN"
        assert domain.cooldown_until is not None
        assert domain.cooldown_until > now

    def test_platform_audit_log_append(self) -> None:
        log_entry = PlatformAuditLog.objects.create(
            action="TENANT_PROVISIONING_FAILED",
            actor_email="system.worker@africinemas.com",
            tenant_slug="broken-cinema",
            ip_address="127.0.0.1",
            details={"error": "Schema timeout", "attempt": 3},
        )

        assert log_entry.uuid is not None
        assert log_entry.created_at is not None
        assert str(log_entry).startswith(f"[{log_entry.created_at}] TENANT_PROVISIONING_FAILED")

        retrieved = PlatformAuditLog.objects.filter(tenant_slug="broken-cinema").first()
        assert retrieved is not None
        assert retrieved.details["attempt"] == 3
