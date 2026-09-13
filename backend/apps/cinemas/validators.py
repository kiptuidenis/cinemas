"""
Subdomain slug validators and reserved word definitions for cinema tenant registration.
"""

import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

SUBDOMAIN_MIN_LENGTH = 3
SUBDOMAIN_MAX_LENGTH = 50

# Alphanumeric start/end, lowercase alphanumeric and single hyphens in between.
# 3 to 50 characters: 1 start char + 1 to 48 middle chars + 1 end char.
SUBDOMAIN_REGEX = re.compile(r"^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$")

RESERVED_SUBDOMAINS: frozenset[str] = frozenset(
    {
        "admin",
        "administrator",
        "api",
        "app",
        "auth",
        "billing",
        "cdn",
        "checkout",
        "cinema",
        "cinemas",
        "dashboard",
        "dev",
        "docs",
        "graphql",
        "health",
        "help",
        "login",
        "mail",
        "metrics",
        "pay",
        "payment",
        "payments",
        "platform",
        "portal",
        "public",
        "root",
        "secure",
        "staging",
        "status",
        "support",
        "sysadmin",
        "system",
        "test",
        "webhook",
        "webhooks",
        "www",
    }
)


def validate_subdomain_slug(value: str) -> str:
    """
    Validate and normalize a cinema subdomain slug.

    Rules:
    - Must be between 3 and 50 characters.
    - Must contain only lowercase alphanumeric characters and hyphens.
    - Must start and end with an alphanumeric character (no leading or trailing hyphens).
    - Cannot contain consecutive hyphens ('--').
    - Cannot be a reserved platform word (e.g. 'api', 'admin', 'billing').
    """
    if not isinstance(value, str):
        raise ValidationError(_("Subdomain must be a string."))

    slug = value.strip().lower()

    if len(slug) < SUBDOMAIN_MIN_LENGTH:
        raise ValidationError(
            _(f"Subdomain must be at least {SUBDOMAIN_MIN_LENGTH} characters long.")
        )

    if len(slug) > SUBDOMAIN_MAX_LENGTH:
        raise ValidationError(_(f"Subdomain cannot exceed {SUBDOMAIN_MAX_LENGTH} characters."))

    if "--" in slug:
        raise ValidationError(_("Subdomain cannot contain consecutive hyphens."))

    if not SUBDOMAIN_REGEX.match(slug):
        raise ValidationError(
            _(
                "Subdomain must start and end with a lowercase letter or digit, "
                "and contain only lowercase letters, digits, and single hyphens."
            )
        )

    if slug in RESERVED_SUBDOMAINS:
        raise ValidationError(_(f"'{slug}' is a reserved platform keyword and cannot be used."))

    return slug
