"""
Tenant seeder service for newly provisioned cinema schemas.
Injects turnkey operational defaults, payment gateway configuration, and onboarding checklists.
"""

import logging
from decimal import Decimal
from typing import Any

from apps.cinemas.models import (
    CinemaPaymentConfig,
    CinemaTenant,
    CinemaTheme,
    TenantOperationalConfig,
)

logger = logging.getLogger(__name__)


class TenantSeeder:
    """
    Seeds turnkey operational defaults into a newly provisioned CinemaTenant.
    Guarantees that once a cinema reaches READY state, it possesses all necessary
    configurations to operate immediately without manual system administrator setup.
    """

    @classmethod
    def seed_tenant(cls, tenant: CinemaTenant) -> dict[str, Any]:
        """
        Inject turnkey operational configuration into the tenant.

        Returns:
            dict containing references to initialized configurations.
        """
        logger.info(
            "Seeding turnkey operational defaults for tenant '%s' (%s)", tenant.name, tenant.slug
        )

        # 1. Operational Configuration (Hold TTL, Max Seats, Notifications, Checklist)
        operational_config, op_created = TenantOperationalConfig.objects.get_or_create(
            tenant=tenant,
            defaults={
                "hold_ttl_seconds": 420,  # 7-minute hold TTL
                "max_seats_per_order": 8,  # Max 8 seats per checkout
                "booking_confirmation_email": True,
                "booking_confirmation_sms": True,
                "onboarding_checklist": TenantOperationalConfig.get_default_checklist(),
            },
        )
        if op_created:
            logger.info("Created default operational configuration for %s", tenant.slug)

        # 2. Payment Configuration (IntaSend 10% platform escrow split)
        payment_config, pay_created = CinemaPaymentConfig.objects.get_or_create(
            tenant=tenant,
            defaults={
                "gateway_mode": CinemaPaymentConfig.GatewayMode.INTASEND_ESCROW,
                "platform_fee_percent": Decimal("10.00"),
                "is_active": True,
            },
        )
        if pay_created:
            logger.info("Created default IntaSend escrow payment configuration for %s", tenant.slug)

        # 3. Dynamic Theme Tokens
        theme, theme_created = CinemaTheme.objects.get_or_create(
            tenant=tenant,
            defaults={
                "primary_color": "#E61C24",
                "secondary_color": "#E5A93B",
                "accent_color": "#3B82F6",
                "background_color": "#0B0B0E",
                "surface_color": "#14141A",
            },
        )
        if theme_created:
            logger.info("Created starter brand theme tokens for %s", tenant.slug)

        return {
            "operational_config": operational_config,
            "payment_config": payment_config,
            "theme": theme,
        }
