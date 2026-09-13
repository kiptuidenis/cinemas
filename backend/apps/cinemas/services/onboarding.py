"""
Cinema tenant onboarding and registration service.
Enforces database-level idempotency via OnboardingRequest, orchestrates atomic tenant registration,
and transitions tenant state to PROVISIONING for the background runner.
"""

import hashlib
import json
import logging
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import TenantMembership
from apps.cinemas.models import (
    CinemaDomain,
    CinemaTenant,
    CinemaTheme,
    OnboardingRequest,
    PlatformAuditLog,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class IdempotencyConflictError(Exception):
    """Raised when an idempotency key is reused with a mutated payload."""


def compute_payload_hash(data: dict[str, Any]) -> str:
    """Compute a deterministic SHA-256 hash of a JSON-serializable payload dictionary."""
    canonical_json = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


class CinemaOnboardingService:
    """
    Coordinates progressive cinema onboarding, idempotency replay, and tenant entity creation.
    """

    @classmethod
    def submit_registration(
        cls,
        data: dict[str, Any],
        idempotency_key: str,
        ip_address: str | None = None,
        request_hash: str | None = None,
    ) -> tuple[dict[str, Any], int]:
        """
        Register a new cinema tenant with database-level idempotency.

        Returns:
            tuple[dict[str, Any], int]: (response_payload, http_status_code)

        Raises:
            IdempotencyConflictError: If the key exists with a different payload hash.
        """
        normalized_data = cls._normalize_registration_data(data)
        if not request_hash:
            request_hash = compute_payload_hash(normalized_data)

        # 1. Database-backed Idempotency Check
        existing_request = (
            OnboardingRequest.objects.filter(idempotency_key=idempotency_key)
            .select_related("tenant", "user")
            .first()
        )

        if existing_request:
            if existing_request.request_hash == request_hash:
                logger.info(
                    "Idempotent replay for key %s (status: %s)",
                    idempotency_key,
                    existing_request.status,
                )
                return (
                    existing_request.response_payload,
                    existing_request.response_status_code,
                )
            logger.warning(
                "Idempotency conflict detected for key %s: hash mismatch",
                idempotency_key,
            )
            raise IdempotencyConflictError(
                "The provided Idempotency-Key has already been used with a different registration payload."
            )

        # 2. Atomic Provisioning Transaction
        with transaction.atomic():
            # A. Create Operator Account
            op_data = normalized_data["operator"]
            user = User.objects.create_user(
                email=op_data["email"],
                first_name=op_data["first_name"],
                last_name=op_data["last_name"],
                password=op_data["password"],
                phone_number=op_data.get("phone", ""),
            )

            # B. Create Cinema Tenant in PROVISIONING state
            cinema_data = normalized_data["cinema"]
            slug = cinema_data["subdomain"]
            tenant = CinemaTenant.objects.create(
                name=cinema_data["name"],
                slug=slug,
                city=cinema_data.get("city", "Nairobi"),
                physical_address=cinema_data.get("physical_address", ""),
                contact_email=cinema_data.get("contact_email") or user.email,
                contact_phone=cinema_data.get("contact_phone", ""),
                provisioning_status=CinemaTenant.ProvisioningStatus.PROVISIONING,
                provisioning_started_at=timezone.now(),
                provisioning_attempts=1,
            )

            # C. Create Primary Cinema Domain
            domain_root = getattr(settings, "TENANT_DOMAIN_ROOT", "africinemas.com")
            fqdn = f"{slug}.{domain_root}"
            CinemaDomain.objects.create(
                domain=fqdn,
                tenant=tenant,
                is_primary=True,
                status=CinemaDomain.DomainStatus.ACTIVE,
            )

            # D. Initialize Cinema Brand Theme
            theme_data = normalized_data.get("theme", {})
            CinemaTheme.objects.create(
                tenant=tenant,
                primary_color=theme_data.get("primary_color", "#E61C24"),
                secondary_color=theme_data.get("secondary_color", "#E5A93B"),
                accent_color=theme_data.get("accent_color", "#3B82F6"),
                background_color=theme_data.get("background_color", "#0B0B0E"),
                surface_color=theme_data.get("surface_color", "#14141A"),
            )

            # E. Assign Tenant Owner Membership
            TenantMembership.objects.create(
                user=user,
                tenant=tenant,
                role=TenantMembership.Role.OWNER,
                is_active=True,
            )

            # F. Prepare Polling Response
            poll_url = f"/api/v1/onboarding/status/?slug={tenant.slug}"
            response_payload = {
                "cinema_slug": tenant.slug,
                "status": CinemaTenant.ProvisioningStatus.PROVISIONING,
                "poll_url": poll_url,
                "message": "Cinema registered successfully. Tenant provisioning initiated.",
            }

            # G. Persist Onboarding Request for Future Idempotency Replays
            OnboardingRequest.objects.create(
                idempotency_key=idempotency_key,
                request_hash=request_hash,
                status=OnboardingRequest.Status.COMMITTED,
                user=user,
                tenant=tenant,
                response_payload=response_payload,
                response_status_code=202,
            )

            # H. Append to Platform Audit Trail
            PlatformAuditLog.objects.create(
                action="TENANT_REGISTERED",
                actor_email=user.email,
                tenant_slug=tenant.slug,
                ip_address=ip_address,
                details={
                    "cinema_name": tenant.name,
                    "domain": fqdn,
                    "idempotency_key": idempotency_key,
                },
            )

        # 3. Async Background Task Dispatch (Provisioning Runner hooked in Phase 1C)
        cls._dispatch_async_provisioning(tenant.id)

        return response_payload, 202

    @classmethod
    def _dispatch_async_provisioning(cls, tenant_id: Any) -> None:
        """
        Dispatch asynchronous schema creation and turnkey migration job.
        In Phase 1B, this logs the dispatch intent; Phase 1C hooks the full Celery/Django-Q runner.
        """
        logger.info("Dispatched async schema provisioning runner for tenant %s", tenant_id)

    @classmethod
    def _normalize_registration_data(cls, raw: dict[str, Any]) -> dict[str, Any]:
        """
        Standardize raw dictionary into structured nested blocks:
        { "cinema": {...}, "operator": {...}, "theme": {...} }
        Handles both nested and flat input payloads.
        """
        # If already nested
        if "cinema" in raw and "operator" in raw:
            cinema = dict(raw["cinema"])
            cinema["subdomain"] = cinema["subdomain"].strip().lower()
            cinema["name"] = cinema["name"].strip()
            operator = dict(raw["operator"])
            operator["email"] = operator["email"].strip().lower()
            return {
                "cinema": cinema,
                "operator": operator,
                "theme": dict(raw.get("theme", {})),
            }

        # Handle flat payload structure
        cinema = {
            "name": str(raw.get("name", "")).strip(),
            "subdomain": str(raw.get("subdomain", "")).strip().lower(),
            "city": str(raw.get("city", "Nairobi")).strip(),
            "physical_address": str(raw.get("physical_address", "")).strip(),
            "contact_email": str(raw.get("contact_email", "")).strip().lower(),
            "contact_phone": str(raw.get("contact_phone", "")).strip(),
        }
        operator = {
            "first_name": str(raw.get("first_name", "")).strip(),
            "last_name": str(raw.get("last_name", "")).strip(),
            "email": str(raw.get("email", "")).strip().lower(),
            "password": str(raw.get("password", "")),
            "phone": str(raw.get("phone", "")).strip(),
        }
        theme = {
            "primary_color": raw.get("primary_color", "#E61C24"),
            "secondary_color": raw.get("secondary_color", "#E5A93B"),
            "accent_color": raw.get("accent_color", "#3B82F6"),
            "background_color": raw.get("background_color", "#0B0B0E"),
            "surface_color": raw.get("surface_color", "#14141A"),
        }
        return {"cinema": cinema, "operator": operator, "theme": theme}
