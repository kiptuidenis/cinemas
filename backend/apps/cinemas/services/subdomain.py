"""
Subdomain availability service for cinema tenant onboarding.
Validates slug syntax, enforces reserved word blacklists, checks domain quarantine status,
and generates available alternative suggestions.
"""

from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.cinemas.models import CinemaDomain, CinemaTenant
from apps.cinemas.validators import RESERVED_SUBDOMAINS, validate_subdomain_slug


class SubdomainService:
    """Domain resolution and availability engine for platform onboarding."""

    @classmethod
    def check_availability(cls, raw_subdomain: str | None) -> dict[str, Any]:
        """
        Evaluate whether a subdomain slug can be registered.

        Returns a dictionary with:
        - subdomain: normalized slug
        - available: bool
        - status: 'AVAILABLE' | 'TAKEN' | 'RESERVED' | 'COOLING_DOWN' | 'INVALID'
        - reason: descriptive text explaining the status
        - suggestions: list of available alternative slugs if unavailable
        """
        if not raw_subdomain:
            return {
                "subdomain": "",
                "available": False,
                "status": "INVALID",
                "reason": "Subdomain is required.",
                "suggestions": [],
            }

        slug = raw_subdomain.strip().lower()

        # Check for reserved platform words first to provide clear feedback
        if slug in RESERVED_SUBDOMAINS:
            return {
                "subdomain": slug,
                "available": False,
                "status": "RESERVED",
                "reason": f"'{slug}' is reserved for platform infrastructure and cannot be registered.",
                "suggestions": cls.generate_suggestions(slug),
            }

        # Syntax and character validation
        try:
            validated_slug = validate_subdomain_slug(slug)
        except ValidationError as exc:
            return {
                "subdomain": slug,
                "available": False,
                "status": "INVALID",
                "reason": exc.messages[0] if hasattr(exc, "messages") else str(exc),
                "suggestions": [],
            }

        domain_root = getattr(settings, "TENANT_DOMAIN_ROOT", "africinemas.com")
        fqdn = f"{validated_slug}.{domain_root}"

        # Check existing domain mapping
        existing_domain = (
            CinemaDomain.objects.filter(
                models.Q(domain=fqdn)
                | models.Q(domain=validated_slug)
                | models.Q(tenant__slug=validated_slug)
            )
            .select_related("tenant")
            .first()
        )

        if existing_domain:
            if existing_domain.status == CinemaDomain.DomainStatus.COOLING_DOWN:
                if (
                    existing_domain.cooldown_until
                    and existing_domain.cooldown_until > timezone.now()
                ):
                    return {
                        "subdomain": validated_slug,
                        "available": False,
                        "status": "COOLING_DOWN",
                        "reason": (
                            f"The subdomain '{validated_slug}' is currently in a 90-day cooldown "
                            "quarantine period following decommission."
                        ),
                        "suggestions": cls.generate_suggestions(validated_slug),
                    }
                # If cooldown expired, the domain is released and can be reclaimed
            elif existing_domain.status == CinemaDomain.DomainStatus.ACTIVE:
                return {
                    "subdomain": validated_slug,
                    "available": False,
                    "status": "TAKEN",
                    "reason": f"'{validated_slug}' is already registered by another cinema.",
                    "suggestions": cls.generate_suggestions(validated_slug),
                }

        # Check existing tenant slug directly
        if CinemaTenant.objects.filter(slug=validated_slug).exists():
            return {
                "subdomain": validated_slug,
                "available": False,
                "status": "TAKEN",
                "reason": f"'{validated_slug}' is already registered by another cinema.",
                "suggestions": cls.generate_suggestions(validated_slug),
            }

        return {
            "subdomain": validated_slug,
            "available": True,
            "status": "AVAILABLE",
            "reason": "",
            "suggestions": [],
        }

    @classmethod
    def generate_suggestions(cls, base_slug: str, limit: int = 4) -> list[str]:
        """
        Generate alternative subdomain suggestions based on the requested slug.
        Only returns suggestions that are currently available.
        """
        clean_base = base_slug.strip().lower().replace("_", "-")
        candidate_patterns = [
            f"{clean_base}-cinema",
            f"{clean_base}-ke",
            f"{clean_base}-nairobi",
            f"{clean_base}-screens",
            f"{clean_base}-theatres",
            f"the-{clean_base}",
        ]

        available_suggestions: list[str] = []
        domain_root = getattr(settings, "TENANT_DOMAIN_ROOT", "africinemas.com")

        for candidate in candidate_patterns:
            if len(available_suggestions) >= limit:
                break
            try:
                validate_subdomain_slug(candidate)
            except ValidationError:
                continue

            if candidate in RESERVED_SUBDOMAINS:
                continue

            cand_fqdn = f"{candidate}.{domain_root}"
            domain_taken = CinemaDomain.objects.filter(
                models.Q(domain=cand_fqdn)
                | models.Q(domain=candidate)
                | models.Q(tenant__slug=candidate),
                status__in=[
                    CinemaDomain.DomainStatus.ACTIVE,
                    CinemaDomain.DomainStatus.COOLING_DOWN,
                ],
            ).exists()

            tenant_taken = CinemaTenant.objects.filter(slug=candidate).exists()

            if not domain_taken and not tenant_taken:
                available_suggestions.append(candidate)

        return available_suggestions
