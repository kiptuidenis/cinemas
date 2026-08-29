"""
URL routing for cinema tenant endpoints.
"""

from django.urls import path

from apps.cinemas.views import TenantBootstrapView

app_name = "cinemas"

urlpatterns = [
    path("tenant/bootstrap/", TenantBootstrapView.as_view(), name="tenant-bootstrap"),
]
