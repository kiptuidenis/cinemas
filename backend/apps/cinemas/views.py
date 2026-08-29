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
    TenantBootstrapSerializer,
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
            etag = f'"{hashlib.sha256(json.dumps(cached_payload, sort_keys=True).encode("utf-8")).hexdigest()[:32]}"'
            if_none_match = request.headers.get("If-None-Match")
            if if_none_match and if_none_match == etag:
                response = Response(status=status.HTTP_304_NOT_MODIFIED)
                response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
                response["ETag"] = etag
                return response

            response = Response(cached_payload, status=status.HTTP_200_OK)
            response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
            response["ETag"] = etag
            return response

        # 1. Dynamic Theme Tokens (with fallback if uncustomized)
        try:
            theme = tenant.theme
        except CinemaTheme.DoesNotExist:
            theme = CinemaTheme(tenant=tenant)

        # 2. Sanitized Payment Capabilities
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

        # 3. Combined Serialization
        payload: dict[str, Any] = TenantBootstrapSerializer(
            {
                "cinema": tenant,
                "theme": theme,
                "payment": payment_capabilities,
            }
        ).data

        # Cache in Redis for 1 hour (3600 seconds)
        cache.set(cache_key, payload, timeout=3600)

        etag = f'"{hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()[:32]}"'
        if_none_match = request.headers.get("If-None-Match")
        if if_none_match and if_none_match == etag:
            response = Response(status=status.HTTP_304_NOT_MODIFIED)
            response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
            response["ETag"] = etag
            return response

        response = Response(payload, status=status.HTTP_200_OK)
        response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
        response["ETag"] = etag
        return response
