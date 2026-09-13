"""
Unit and integration tests for ReconciliationWorker and reconcile_tenants management command.
Validates detection of stalled provisioning operations, retry incrementation,
and permanent failure transition after exceeding maximum retry budgets.
"""

from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.cinemas.models import CinemaTenant, PlatformAuditLog
from apps.cinemas.services.reconciliation import ReconciliationWorker


@pytest.mark.django_db
class TestProvisioningReconciliation:
    """Test suite for ReconciliationWorker stalled tenant detection and recovery."""

    @pytest.fixture(autouse=True)
    def _ensure_public_schema(self) -> None:
        from django.db import connection

        if hasattr(connection, "set_schema_to_public"):
            connection.set_schema_to_public()

    def test_reconciliation_ignores_recent_provisioning_tenants(self) -> None:
        # Created only 30 seconds ago
        tenant = CinemaTenant.objects.create(
            name="Recent Cinema",
            slug="recent-cinema",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now() - timedelta(seconds=30),
            provisioning_attempts=1,
        )

        stats = ReconciliationWorker.reconcile_stalled_tenants(stale_threshold_seconds=300)
        assert stats["reconciled_count"] == 0
        assert stats["retried_count"] == 0
        assert stats["permanently_failed_count"] == 0

        refreshed = CinemaTenant.objects.get(id=tenant.id)
        assert refreshed.provisioning_status == "PROVISIONING"
        assert refreshed.provisioning_attempts == 1

    def test_reconciliation_retries_stalled_tenant(self) -> None:
        # Started 10 minutes ago (stalled > 300s)
        stalled_tenant = CinemaTenant.objects.create(
            name="Stalled Mall Cinema",
            slug="stalled-mall",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now() - timedelta(minutes=10),
            provisioning_attempts=1,
        )

        stats = ReconciliationWorker.reconcile_stalled_tenants(stale_threshold_seconds=300)
        assert stats["reconciled_count"] == 1
        assert stats["retried_count"] == 1
        assert stats["permanently_failed_count"] == 0

        # After retry dispatch, runner succeeds and transitions to READY
        refreshed = CinemaTenant.objects.get(id=stalled_tenant.id)
        assert refreshed.provisioning_status == CinemaTenant.ProvisioningStatus.READY
        assert refreshed.provisioning_attempts == 2
        assert refreshed.provisioning_completed_at is not None

        # Verify retry audit log
        audit_log = PlatformAuditLog.objects.filter(
            tenant_slug="stalled-mall", action="TENANT_PROVISIONING_RETRY_DISPATCHED"
        ).first()
        assert audit_log is not None
        assert audit_log.details["attempt"] == 2

    def test_reconciliation_marks_permanently_failed_after_exhausting_retries(self) -> None:
        # Started 15 minutes ago, already attempted 3 times
        exhausted_tenant = CinemaTenant.objects.create(
            name="Exhausted Cinema",
            slug="exhausted-cinema",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now() - timedelta(minutes=15),
            provisioning_attempts=3,
        )

        stats = ReconciliationWorker.reconcile_stalled_tenants(
            stale_threshold_seconds=300, max_attempts=3
        )
        assert stats["reconciled_count"] == 1
        assert stats["retried_count"] == 0
        assert stats["permanently_failed_count"] == 1

        refreshed = CinemaTenant.objects.get(id=exhausted_tenant.id)
        assert refreshed.provisioning_status == CinemaTenant.ProvisioningStatus.FAILED
        assert "exceeded maximum retry attempts" in refreshed.provisioning_error

        # Verify permanent failure audit log
        audit_log = PlatformAuditLog.objects.filter(
            tenant_slug="exhausted-cinema", action="TENANT_PROVISIONING_PERMANENTLY_FAILED"
        ).first()
        assert audit_log is not None
        assert audit_log.details["attempts"] == 3

    def test_reconcile_tenants_management_command(self) -> None:
        CinemaTenant.objects.create(
            name="Command Test Cinema",
            slug="cmd-cinema",
            provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
            provisioning_started_at=timezone.now() - timedelta(seconds=600),
            provisioning_attempts=1,
        )

        out = StringIO()
        call_command("reconcile_tenants", "--threshold", "300", stdout=out)
        output_str = out.getvalue()

        assert "Reconciliation complete" in output_str
        assert "1 retried" in output_str
