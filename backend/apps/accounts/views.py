"""
Authentication, token lifecycle, and user profile views.
"""

from typing import cast

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.models import User
from apps.accounts.serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
)
from apps.accounts.services.email_verification import email_verification_service


class LoginView(TokenObtainPairView):
    """
    Authenticate user via email and password, issuing access and refresh JWT tokens.
    Protected by strict rate limiting against brute-force attacks.
    """

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"


class RefreshTokenView(TokenRefreshView):
    """
    Rotate and issue a new access token using a valid, non-blacklisted refresh token.
    """


class LogoutView(APIView):
    """
    Blacklist the provided refresh token, invalidating the session.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        payload = request.data if isinstance(request.data, dict) else {}
        refresh_token = payload.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required.", "code": "missing_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out.", "code": "logout_success"},
                status=status.HTTP_200_OK,
            )
        except (TokenError, InvalidToken) as exc:
            return Response(
                {"detail": f"Invalid or expired refresh token: {exc}", "code": "invalid_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileView(APIView):
    """
    Retrieve or update the authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = cast(User, request.user)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request: Request) -> Response:
        user = cast(User, request.user)
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    """
    Validate a cryptographic email verification token and update the user's verification status.
    """

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        payload = request.data if isinstance(request.data, dict) else {}
        token = payload.get("token") or request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Verification token is required.", "code": "missing_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_valid, user, message = email_verification_service.verify_token(token)
        if not is_valid or not user:
            return Response(
                {"detail": message, "code": "verification_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": message,
                "email": user.email,
                "email_verified_at": user.email_verified_at,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request: Request) -> Response:
        return self.post(request)
