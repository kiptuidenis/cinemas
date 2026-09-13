"""
User identity and multi-tenant Role-Based Access Control (RBAC) models.
Placed in SHARED_APPS (public schema) for unified cross-cinema operator and customer identities.
"""

import uuid
from typing import Any

from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class CustomUserManager(BaseUserManager["User"]):
    """Custom user manager where email is the unique identifier for authentication."""

    def create_user(self, email: str, password: str | None = None, **extra_fields: Any) -> "User":
        if not email:
            raise ValueError(_("The Email field must be set."))
        email = self.normalize_email(email).lower().strip()
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Unified global identity model residing in the public PostgreSQL schema.
    Eliminates legacy Django usernames in favor of normalized email authentication.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email address"), unique=True, db_index=True)
    first_name = models.CharField(_("first name"), max_length=150, blank=True, default="")
    last_name = models.CharField(_("last name"), max_length=150, blank=True, default="")
    phone_number = models.CharField(_("phone number"), max_length=32, blank=True, default="")
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )
    is_staff = models.BooleanField(
        _("platform staff status"),
        default=False,
        help_text=_(
            "Designates whether the user can log into the Africinemas platform admin site. "
            "Tenant staff use TenantMembership roles instead."
        ),
    )
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)

    # Cryptographic Email Verification Tracking
    email_verified_at = models.DateTimeField(
        _("email verified at"),
        null=True,
        blank=True,
        help_text=_("Timestamp when the user verified their email address."),
    )
    email_verification_nonce = models.UUIDField(
        _("email verification nonce"),
        default=uuid.uuid4,
        help_text=_("Cryptographic nonce rotated on verification to enforce single-use links."),
    )

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["-date_joined"]

    def clean(self) -> None:
        super().clean()
        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email).lower().strip()

    def get_full_name(self) -> str:
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def get_short_name(self) -> str:
        return self.first_name or self.email.split("@")[0]

    def __str__(self) -> str:
        return self.email


class TenantMembership(TimeStampedModel):
    """
    Multi-tenant RBAC bridge linking a global User to a specific CinemaTenant.
    Enforces tenant-scoped roles (OWNER, MANAGER, CASHIER, USHER) with instant revocation.
    """

    class Role(models.TextChoices):
        OWNER = "OWNER", _("Cinema Owner")
        MANAGER = "MANAGER", _("Cinema Manager")
        CASHIER = "CASHIER", _("Cashier / Box Office")
        USHER = "USHER", _("Floor Usher / Ticket Scanner")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
        verbose_name=_("user"),
    )
    tenant = models.ForeignKey(
        "cinemas.CinemaTenant",
        on_delete=models.CASCADE,
        related_name="memberships",
        verbose_name=_("cinema tenant"),
    )
    role = models.CharField(
        _("role"),
        max_length=16,
        choices=Role.choices,
        default=Role.OWNER,
        help_text=_("Operational role defining tenant-scoped permissions."),
    )
    is_active = models.BooleanField(
        _("is active"),
        default=True,
        help_text=_("Allows instant revocation of tenant staff access without deleting the user."),
    )
    authorization_version = models.PositiveIntegerField(
        _("authorization version"),
        default=1,
        help_text=_(
            "Monotonically increasing version used to bust cached authorization decisions."
        ),
    )

    class Meta:
        verbose_name = _("Tenant Membership")
        verbose_name_plural = _("Tenant Memberships")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "tenant"],
                name="unique_user_tenant_membership",
            )
        ]
        ordering = ["-created_at"]

    def bump_authorization_version(self) -> None:
        """Increment version counter to invalidate downstream role caches."""
        self.authorization_version += 1
        self.save(update_fields=["authorization_version", "updated_at"])

    def __str__(self) -> str:
        return f"{self.user.email} - {self.role} at {self.tenant.name}"
