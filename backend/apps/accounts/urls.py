"""
URL routing for authentication, session management, and user identity.
"""

from django.urls import path

from apps.accounts.views import (
    LoginView,
    LogoutView,
    RefreshTokenView,
    UserProfileView,
    VerifyEmailView,
)

app_name = "accounts"

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", UserProfileView.as_view(), name="auth-profile"),
    path("verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"),
]
