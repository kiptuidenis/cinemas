"""
Reconciliation worker for recovering stalled or orphaned cinema tenant provisioning sagas.
Scans for tenants stuck in PROVISIONING beyond a configured threshold and re-dispatches
the runner or permanently marks them FAILED after exhausting retries.
"""

import logging
from datetime import timedelta

from django.utils import timezone

from apps.cinemas.models import CinemaTenant, PlatformAuditLog
from apps.cinemas.services.provisioning import TenantProvisioningRunner

logger = logging.getLogger(__name__)


class ReconciliationWorker:
    """
    Background recovery engine for stalled tenant provisioning runs.
    Guarantees that network drops, worker restarts, or database lock timeouts
    do not leave tenants permanently frozen in 'PROVISIONING' state.
    """

    MAX_ATTEMPTS = 3
    DEFAULT_STALE_THRESHOLD_SECONDS = 300  # 5 minutes

    @classmethod
    def reconcile_stalled_tenants(
        cls,
        stale_threshold_seconds: int = DEFAULT_STALE_THRESHOLD_SECONDS,
        max_attempts: int = MAX_ATTEMPTS,
    ) -> dict[str, int]:
        """
        Scan and reconcile stalled provisioning operations.

        Args:
            stale_threshold_seconds: Maximum seconds a tenant can remain in PROVISIONING
                                     before considered stalled.
            max_attempts: Maximum retry attempts before marking permanently FAILED.

        Returns:
            dict[str, int]: Reconciliation summary statistics.
        """
        cutoff = timezone.now() - timedelta(seconds=stale_threshold_seconds)
        stalled_tenants = list(
            CinemaTenant.objects.filter(
                provisioning_status__in=[
                    CinemaTenant.ProvisioningStatus.PROVISIONING,
                    CinemaTenant.ProvisioningStatus.RETRYING,
                ],
                provisioning_started_at__lt=cutoff,
            )
        )

        reconciled_count = len(stalled_tenants)
        retried_count = 0
        permanently_failed_count = 0

        logger.info("Found %d stalled tenant(s) requiring reconciliation.", reconciled_count)

        for tenant in stalled_tenants:
            if tenant.provisioning_attempts >= max_attempts:
                # Exhausted retry budget -> Permanently FAILED
                tenant.provisioning_status = CinemaTenant.ProvisioningStatus.FAILED
                tenant.provisioning_error = (
                    f"Provisioning stalled and exceeded maximum retry attempts ({tenant.provisioning_attempts}). "
                    "Marked permanently FAILED by ReconciliationWorker."
                )
                tenant.save(update_fields=["provisioning_status", "provisioning_error"])

                PlatformAuditLog.objects.create(
                    action="TENANT_PROVISIONING_PERMANENTLY_FAILED",
                    tenant_slug=tenant.slug,
                    details={
                        "attempts": tenant.provisioning_attempts,
                        "stale_threshold_seconds": stale_threshold_seconds,
                        "reason": "Exhausted maximum retry attempts",
                    },
                )
                logger.error(
                    "Tenant '%s' permanently marked FAILED after exhausting %d attempts.",
                    tenant.slug,
                    tenant.provisioning_attempts,
                )
                permanently_failed_count += 1
            else:
                # Increment attempt counter and re-dispatch provisioning runner
                tenant.provisioning_status = CinemaTenant.ProvisioningStatus.RETRYING
                tenant.provisioning_attempts += 1
                tenant.last_provisioning_attempt_at = timezone.now()
                tenant.save(
                    update_fields=[
                        "provisioning_status",
                        "provisioning_attempts",
                        "last_provisioning_attempt_at",
                    ]
                )

                PlatformAuditLog.objects.create(
                    action="TENANT_PROVISIONING_RETRY_DISPATCHED",
                    tenant_slug=tenant.slug,
                    details={
                        "attempt": tenant.provisioning_attempts,
                        "stale_threshold_seconds": stale_threshold_seconds,
                    },
                )
                logger.info(
                    "Re-dispatching provisioning runner for stalled tenant '%s' (attempt %d/%d)",
                    tenant.slug,
                    tenant.provisioning_attempts,
                    max_attempts,
                )

                # Re-run provisioning saga
                success = TenantProvisioningRunner.provision_tenant(tenant.id)
                if success:
                    logger.info("Successfully recovered stalled tenant '%s'.", tenant.slug)
                retried_count += 1

        return {
            "reconciled_count": reconciled_count,
            "retried_count": retried_count,
            "permanently_failed_count": permanently_failed_count,
        }
