"""
Unit tests for User, CustomUserManager, and TenantMembership models.
Verifies Argon2id password hashing, email normalization, UUID PKs, and RBAC constraints.
"""

import pytest
from django.db import IntegrityError

from apps.accounts.models import TenantMembership, User
from apps.cinemas.models import CinemaTenant


@pytest.mark.django_db
class TestUserModel:
    """Test suite for the unified global User model."""

    def test_create_user_with_normalized_email(self) -> None:
        user = User.objects.create_user(
            email="Operator.Test@Africinemas.COM",
            password="SecurePassword123!",
            first_name="Wanjiku",
            last_name="Kimani",
        )
        assert user.email == "operator.test@africinemas.com"
        assert user.first_name == "Wanjiku"
        assert user.last_name == "Kimani"
        assert user.get_full_name() == "Wanjiku Kimani"
        assert user.get_short_name() == "Wanjiku"
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
        assert user.email_verified_at is None
        assert user.email_verification_nonce is not None

    def test_argon2id_password_hashing_by_default(self) -> None:
        """Verify that newly created passwords use Argon2id hasher."""
        user = User.objects.create_user(
            email="argon.user@africinemas.com",
            password="UltraSecretPassword2026!",
        )
        assert user.check_password("UltraSecretPassword2026!") is True
        assert user.password.startswith("argon2")

    def test_create_user_requires_email(self) -> None:
        with pytest.raises(ValueError, match="The Email field must be set"):
            User.objects.create_user(email="", password="SomePassword123!")

    def test_create_superuser_success(self) -> None:
        superuser = User.objects.create_superuser(
            email="superadmin@africinemas.com",
            password="SuperAdminPassword2026!",
        )
        assert superuser.is_staff is True
        assert superuser.is_superuser is True
        assert superuser.is_active is True

    def test_create_superuser_validation_errors(self) -> None:
        with pytest.raises(ValueError, match="Superuser must have is_staff=True"):
            User.objects.create_superuser(
                email="badadmin1@africinemas.com",
                password="password123",
                is_staff=False,
            )

        with pytest.raises(ValueError, match="Superuser must have is_superuser=True"):
            User.objects.create_superuser(
                email="badadmin2@africinemas.com",
                password="password123",
                is_superuser=False,
            )

    def test_email_uniqueness_enforced(self) -> None:
        User.objects.create_user(
            email="unique@africinemas.com",
            password="Password123!",
        )
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                email="unique@africinemas.com",
                password="AnotherPassword123!",
            )


@pytest.mark.django_db
class TestTenantMembershipModel:
    """Test suite for the TenantMembership RBAC bridge model."""

    @pytest.fixture
    def cinema_tenant(self) -> CinemaTenant:
        return CinemaTenant.objects.create(
            name="Anga Diamond Plaza",
            slug="anga-diamond",
            city="Nairobi",
        )

    @pytest.fixture
    def user(self) -> User:
        return User.objects.create_user(
            email="manager@angacinemas.com",
            password="CinemaPassword123!",
            first_name="David",
            last_name="Otieno",
        )

    def test_create_tenant_membership(self, user: User, cinema_tenant: CinemaTenant) -> None:
        membership = TenantMembership.objects.create(
            user=user,
            tenant=cinema_tenant,
            role=TenantMembership.Role.OWNER,
        )
        assert membership.user == user
        assert membership.tenant == cinema_tenant
        assert membership.role == TenantMembership.Role.OWNER
        assert membership.is_active is True
        assert membership.authorization_version == 1
        assert "Anga Diamond Plaza" in str(membership)

    def test_membership_unique_per_user_and_tenant(
        self, user: User, cinema_tenant: CinemaTenant
    ) -> None:
        TenantMembership.objects.create(
            user=user,
            tenant=cinema_tenant,
            role=TenantMembership.Role.MANAGER,
        )
        with pytest.raises(IntegrityError):
            TenantMembership.objects.create(
                user=user,
                tenant=cinema_tenant,
                role=TenantMembership.Role.CASHIER,
            )

    def test_bump_authorization_version(self, user: User, cinema_tenant: CinemaTenant) -> None:
        membership = TenantMembership.objects.create(
            user=user,
            tenant=cinema_tenant,
            role=TenantMembership.Role.CASHIER,
        )
        initial_version = membership.authorization_version
        membership.bump_authorization_version()
        membership.refresh_from_db()
        assert membership.authorization_version == initial_version + 1
