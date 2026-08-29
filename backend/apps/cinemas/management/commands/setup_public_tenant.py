"""
Management command to provision or ensure the public tenant and default domains exist.
"""

from typing import Any

from django.core.management.base import BaseCommand
from django_tenants.utils import get_public_schema_name

from apps.cinemas.models import CinemaDomain, CinemaTenant


class Command(BaseCommand):
    help = "Provisions or updates the public platform tenant and primary domains."

    def handle(self, *args: Any, **options: Any) -> None:
        public_schema = get_public_schema_name()

        public_tenant, created = CinemaTenant.objects.get_or_create(
            schema_name=public_schema,
            defaults={
                "name": "Africinemas Platform Hub",
                "slug": "public",
                "city": "Nairobi",
                "physical_address": "Africinemas Headquarters",
                "contact_email": "admin@africinemas.com",
                "contact_phone": "+254700000000",
                "is_active": True,
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created public tenant: {public_tenant.name}"))
        else:
            self.stdout.write(
                self.style.NOTICE(f"Public tenant already exists: {public_tenant.name}")
            )

        domains = [
            ("localhost", True),
            ("africinemas.com", False),
            ("127.0.0.1", False),
        ]

        for domain_name, is_primary in domains:
            domain, d_created = CinemaDomain.objects.get_or_create(
                domain=domain_name,
                defaults={
                    "tenant": public_tenant,
                    "is_primary": is_primary,
                },
            )
            if d_created:
                self.stdout.write(
                    self.style.SUCCESS(f"  + Added domain: {domain.domain} (primary={is_primary})")
                )
            else:
                self.stdout.write(self.style.NOTICE(f"  - Domain already exists: {domain.domain}"))
