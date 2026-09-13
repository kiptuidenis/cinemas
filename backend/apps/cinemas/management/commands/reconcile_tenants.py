"""
Management command to run the provisioning reconciliation worker.
"""

from typing import Any

from django.core.management.base import BaseCommand

from apps.cinemas.services.reconciliation import ReconciliationWorker


class Command(BaseCommand):
    help = "Scan for stalled cinema tenant provisioning sagas and reconcile them."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--threshold",
            type=int,
            default=300,
            help="Stale threshold in seconds (default: 300).",
        )
        parser.add_argument(
            "--max-attempts",
            type=int,
            default=3,
            help="Maximum allowed attempts before marking permanently FAILED (default: 3).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        threshold = options["threshold"]
        max_attempts = options["max_attempts"]

        self.stdout.write(
            f"Running ReconciliationWorker (threshold={threshold}s, max_attempts={max_attempts})..."
        )
        stats = ReconciliationWorker.reconcile_stalled_tenants(
            stale_threshold_seconds=threshold,
            max_attempts=max_attempts,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Reconciliation complete: {stats['reconciled_count']} checked, "
                f"{stats['retried_count']} retried, "
                f"{stats['permanently_failed_count']} permanently failed."
            )
        )
