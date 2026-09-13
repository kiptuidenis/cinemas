"""
Public onboarding URL patterns for cinema tenant registration and provisioning polling.
"""

from django.urls import path

from apps.cinemas.views import (
    CinemaRegistrationView,
    OnboardingStatusView,
    SubdomainCheckView,
)

app_name = "onboarding"

urlpatterns = [
    path("check-subdomain/", SubdomainCheckView.as_view(), name="check-subdomain"),
    path("register/", CinemaRegistrationView.as_view(), name="cinema-register"),
    path("status/", OnboardingStatusView.as_view(), name="onboarding-status"),
]
