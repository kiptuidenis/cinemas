"""
Cryptographic single-use email verification service using Django TimestampSigner.
Guarantees 24-hour expiration and single-use replay protection via User nonce rotation.
"""

import uuid
from typing import TYPE_CHECKING

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone

if TYPE_CHECKING:
    from apps.accounts.models import User


class EmailVerificationService:
    """Service handling signed, timestamped, single-use email verification tokens."""

    SALT = "africinemas.email-verification"
    DEFAULT_MAX_AGE_SECONDS = 86400  # 24 hours

    def __init__(self) -> None:
        self.signer = TimestampSigner(salt=self.SALT)

    def generate_token(self, user: "User") -> str:
        """
        Generate a cryptographic signed token bundling the user UUID and current nonce.
        Format: "<user_id>:<nonce>:<timestamp>:<signature>"
        """
        payload = f"{user.id}:{user.email_verification_nonce}"
        return self.signer.sign(payload)

    def verify_token(
        self, token: str, max_age: int | None = None
    ) -> tuple[bool, "User | None", str]:
        """
        Verify the signed token and enforce single-use protection.
        Returns a tuple of (is_valid, user_or_none, message).
        """
        from apps.accounts.models import User

        if not token or not isinstance(token, str):
            return False, None, "Invalid verification token format."

        max_age_val = max_age if max_age is not None else self.DEFAULT_MAX_AGE_SECONDS

        try:
            unsign_value = self.signer.unsign(token, max_age=max_age_val)
        except SignatureExpired:
            return False, None, "Verification link has expired. Please request a new one."
        except BadSignature:
            return False, None, "Invalid verification link."

        parts = unsign_value.split(":")
        if len(parts) != 2:
            return False, None, "Malformed verification token payload."

        user_id_str, token_nonce_str = parts[0], parts[1]

        try:
            user_uuid = uuid.UUID(user_id_str)
            token_nonce = uuid.UUID(token_nonce_str)
        except (ValueError, TypeError):
            return False, None, "Malformed verification token identifiers."

        user = User.objects.filter(id=user_uuid).first()
        if not user:
            return False, None, "User associated with verification token not found."

        # Single-use replay protection: nonce in token MUST match active user nonce
        if user.email_verification_nonce != token_nonce:
            return False, None, "This verification link has already been used or invalidated."

        # Mark email as verified and rotate nonce immediately
        user.email_verified_at = timezone.now()
        user.email_verification_nonce = uuid.uuid4()
        user.save(update_fields=["email_verified_at", "email_verification_nonce", "updated_at"])

        return True, user, "Email address verified successfully."


email_verification_service = EmailVerificationService()
