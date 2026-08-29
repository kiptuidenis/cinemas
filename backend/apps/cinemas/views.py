"""
Public views for cinema tenant bootstrap metadata and dynamic branding tokens.
"""

import hashlib
import json
from typing import Any

from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.cinemas.models import CinemaPaymentConfig, CinemaTenant, CinemaTheme
from apps.cinemas.serializers import (
    CinemaIdentitySerializer,
    CinemaThemeSerializer,
    SanitizedPaymentCapabilitiesSerializer,
)


class TenantBootstrapView(APIView):
    """
    Public API endpoint returning the active cinema's identity, dynamic design tokens,
    and sanitized payment capabilities for single-page frontend application initialization.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "bootstrap"

    def get(self, request: Request) -> Response:
        tenant: CinemaTenant | None = getattr(request, "tenant", None)

        if not tenant or getattr(tenant, "schema_name", "") == "public":
            return Response(
                {"detail": "Tenant not resolved for the current request host."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cache_key = f"tenant:bootstrap:{tenant.slug}"
        cached_payload: dict[str, Any] | None = cache.get(cache_key)

        if cached_payload is not None:
            etag = hashlib.sha256(
                json.dumps(cached_payload, sort_keys=True).encode("utf-8")
            ).hexdigest()[:32]
            response = Response(cached_payload, status=status.HTTP_200_OK)
            response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
            response["ETag"] = f'"{etag}"'
            return response

        # 1. Cinema Identity
        cinema_data = CinemaIdentitySerializer(tenant).data

        # 2. Dynamic Theme Tokens (with fallback if uncustomized)
        try:
            theme = tenant.theme
        except CinemaTheme.DoesNotExist:
            theme = CinemaTheme(tenant=tenant)
        theme_data = CinemaThemeSerializer(theme).data

        # 3. Sanitized Payment Capabilities
        try:
            payment_config = tenant.payment_config
            gateway_mode = payment_config.gateway_mode
        except CinemaPaymentConfig.DoesNotExist:
            gateway_mode = CinemaPaymentConfig.GatewayMode.INTASEND_ESCROW

        payment_capabilities = {
            "gateway_mode": gateway_mode,
            "accepts_mpesa": True,
            "accepts_card": gateway_mode == CinemaPaymentConfig.GatewayMode.INTASEND_ESCROW,
        }
        payment_data = SanitizedPaymentCapabilitiesSerializer(payment_capabilities).data

        payload: dict[str, Any] = {
            "cinema": cinema_data,
            "theme": theme_data,
            "payment": payment_data,
        }

        # Cache in Redis for 1 hour (3600 seconds)
        cache.set(cache_key, payload, timeout=3600)

        etag = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()[:32]
        response = Response(payload, status=status.HTTP_200_OK)
        response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
        response["ETag"] = f'"{etag}"'
        return response
