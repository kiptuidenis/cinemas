"""
Core abstract model classes providing timestamping, UUID primary keys, and base behaviors.
"""

import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_at`` and ``updated_at`` fields.
    """

    created_at = models.DateTimeField(
        _("created at"),
        auto_now_add=True,
        db_index=True,
        help_text=_("Timestamp when record was initially created."),
    )
    updated_at = models.DateTimeField(
        _("updated at"),
        auto_now=True,
        help_text=_("Timestamp when record was last modified."),
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class UUIDModel(models.Model):
    """
    An abstract base class model that provides a public-facing UUID field
    for safe external routing and URL lookups without leaking internal database IDs.
    """

    uuid = models.UUIDField(
        _("public UUID"),
        default=uuid.uuid4,
        editable=False,
        unique=True,
        db_index=True,
        help_text=_("Globally unique public identifier for API lookups and routing."),
    )

    class Meta:
        abstract = True
