"""
Unit tests for subdomain slug validation, reserved word blacklist, and suggestion generator.
"""

from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.cinemas.models import CinemaDomain, CinemaTenant
from apps.cinemas.services.subdomain import SubdomainService
from apps.cinemas.validators import (
    RESERVED_SUBDOMAINS,
    validate_subdomain_slug,
)


@pytest.mark.django_db
class TestSubdomainSlugValidation:
    """Test syntax validation rules for cinema subdomain slugs."""

    @pytest.mark.parametrize(
        "slug",
        [
            "westgate",
            "angamalls",
            "star-cinemas",
            "cinema-123",
            "kenya-imax-1",
            "nairobi-imax",
            "abc",
        ],
    )
    def test_valid_slugs_pass_validation(self, slug: str) -> None:
        assert validate_subdomain_slug(slug) == slug

    @pytest.mark.parametrize(
        "invalid_slug",
        [
            "a",  # Too short (< 3)
            "ab",  # Too short (< 3)
            "a" * 51,  # Too long (> 50)
            "-leading-hyphen",
            "trailing-hyphen-",
            "double--hyphen",
            "special$chars",
            "spaces not allowed",
            "under_score",
            "dot.in.slug",
        ],
    )
    def test_invalid_slug_syntax_raises_validation_error(self, invalid_slug: str) -> None:
        with pytest.raises(ValidationError):
            validate_subdomain_slug(invalid_slug)

    @pytest.mark.parametrize(
        "reserved_word",
        [
            "admin",
            "administrator",
            "api",
            "app",
            "auth",
            "billing",
            "dashboard",
            "help",
            "login",
            "pay",
            "public",
            "root",
            "secure",
            "support",
            "www",
        ],
    )
    def test_reserved_platform_words_are_rejected(self, reserved_word: str) -> None:
        assert reserved_word in RESERVED_SUBDOMAINS
        with pytest.raises(ValidationError, match="reserved"):
            validate_subdomain_slug(reserved_word)


@pytest.mark.django_db
class TestSubdomainAvailabilityService:
    """Test SubdomainService check_availability and suggestion generation."""

    def test_available_slug_returns_available_status(self) -> None:
        res = SubdomainService.check_availability("brand-new-cinema")
        assert res["available"] is True
        assert res["status"] == "AVAILABLE"
        assert res["subdomain"] == "brand-new-cinema"
        assert res["suggestions"] == []

    def test_reserved_word_returns_reserved_status_with_suggestions(self) -> None:
        res = SubdomainService.check_availability("billing")
        assert res["available"] is False
        assert res["status"] == "RESERVED"
        assert "reserved" in res["reason"].lower()
        assert len(res["suggestions"]) > 0
        assert all("billing" in s for s in res["suggestions"])

    def test_invalid_syntax_returns_invalid_status(self) -> None:
        res = SubdomainService.check_availability("bad--syntax")
        assert res["available"] is False
        assert res["status"] == "INVALID"
        assert "consecutive hyphens" in res["reason"].lower()

    def test_taken_subdomain_by_active_domain_returns_taken(self) -> None:
        tenant = CinemaTenant.objects.create(
            name="Existing Cinema",
            slug="existing-cinema",
        )
        CinemaDomain.objects.create(
            domain="existing-cinema.africinemas.com",
            tenant=tenant,
            status=CinemaDomain.DomainStatus.ACTIVE,
        )

        res = SubdomainService.check_availability("existing-cinema")
        assert res["available"] is False
        assert res["status"] == "TAKEN"
        assert len(res["suggestions"]) > 0

    def test_cooling_down_subdomain_within_90_days_is_rejected(self) -> None:
        tenant = CinemaTenant.objects.create(
            name="Decommissioned Cinema",
            slug="quarantined-cinema",
        )
        CinemaDomain.objects.create(
            domain="quarantined-cinema.africinemas.com",
            tenant=tenant,
            status=CinemaDomain.DomainStatus.COOLING_DOWN,
            cooldown_until=timezone.now() + timedelta(days=45),
        )

        res = SubdomainService.check_availability("quarantined-cinema")
        assert res["available"] is False
        assert res["status"] == "COOLING_DOWN"
        assert "cooldown" in res["reason"].lower()
        assert len(res["suggestions"]) > 0

    def test_expired_cooling_down_subdomain_becomes_available(self) -> None:
        tenant = CinemaTenant.objects.create(
            name="Expired Cooldown Cinema",
            slug="released-cinema",
        )
        CinemaDomain.objects.create(
            domain="released-cinema.africinemas.com",
            tenant=tenant,
            status=CinemaDomain.DomainStatus.COOLING_DOWN,
            cooldown_until=timezone.now() - timedelta(days=1),
        )
        # Also remove the tenant slug collision by changing the old tenant's slug
        tenant.slug = "archived-tenant-old"
        tenant.save()

        res = SubdomainService.check_availability("released-cinema")
        assert res["available"] is True
        assert res["status"] == "AVAILABLE"
