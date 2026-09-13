"""
Public views for cinema tenant bootstrap metadata and dynamic branding tokens.
"""

import hashlib
import json
from typing import Any

from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.cinemas.models import (
    CinemaPaymentConfig,
    CinemaTenant,
    CinemaTheme,
    OnboardingRequest,
)
from apps.cinemas.serializers import (
    CinemaRegistrationSerializer,
    TenantBootstrapSerializer,
)
from apps.cinemas.services.onboarding import (
    CinemaOnboardingService,
    IdempotencyConflictError,
    compute_payload_hash,
)
from apps.cinemas.services.subdomain import SubdomainService


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


class SubdomainCheckView(APIView):
    """
    Public endpoint for live subdomain availability checking and suggestion generation.
    Rate limited to 60 requests/minute.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "subdomain_check"

    def get(self, request: Request) -> Response:
        subdomain = request.query_params.get("subdomain") or request.query_params.get("slug")
        if not subdomain:
            return Response(
                {"detail": "Query parameter 'subdomain' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = SubdomainService.check_availability(subdomain)
        return Response(result, status=status.HTTP_200_OK)


class CinemaRegistrationView(APIView):
    """
    Public cinema tenant registration endpoint.
    Enforces X-Idempotency-Key header, executes atomic entity creation,
    and dispatches asynchronous schema provisioning runner.
    Rate limited to 10 requests/hour.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "onboarding_register"

    def post(self, request: Request) -> Response:
        idempotency_key = (
            request.headers.get("X-Idempotency-Key")
            or request.headers.get("Idempotency-Key")
            or request.META.get("HTTP_X_IDEMPOTENCY_KEY")
        )
        if not idempotency_key or not idempotency_key.strip():
            return Response(
                {
                    "detail": "X-Idempotency-Key header is required for registration.",
                    "code": "missing_idempotency_key",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        key = idempotency_key.strip()

        if not isinstance(request.data, dict):
            return Response(
                {"detail": "Invalid registration payload: expected a JSON object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        normalized_raw = CinemaOnboardingService._normalize_registration_data(request.data)
        request_hash = compute_payload_hash(normalized_raw)

        # Database-level idempotency replay check before unique constraint validation
        existing_request = OnboardingRequest.objects.filter(idempotency_key=key).first()
        if existing_request:
            if existing_request.request_hash == request_hash:
                return Response(
                    existing_request.response_payload,
                    status=existing_request.response_status_code,
                )
            return Response(
                {
                    "detail": (
                        "The provided Idempotency-Key has already been used with a "
                        "different registration payload."
                    ),
                    "code": "idempotency_conflict",
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = CinemaRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ip_header = request.META.get("HTTP_X_FORWARDED_FOR")
        ip_address: str | None = None
        if ip_header:
            ip_address = ip_header.split(",")[0].strip()
        else:
            ip_address = request.META.get("REMOTE_ADDR")

        try:
            payload, http_status = CinemaOnboardingService.submit_registration(
                serializer.validated_data,
                idempotency_key=key,
                ip_address=ip_address,
                request_hash=request_hash,
            )
        except IdempotencyConflictError as exc:
            return Response(
                {"detail": str(exc), "code": "idempotency_conflict"},
                status=status.HTTP_409_CONFLICT,
            )

        response = Response(payload, status=http_status)
        if "poll_url" in payload:
            response["Location"] = payload["poll_url"]
        return response


class OnboardingStatusView(APIView):
    """
    Public polling endpoint for monitoring tenant schema provisioning progress.
    Rate limited to 120 requests/minute.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "onboarding_status"

    def get(self, request: Request) -> Response:
        slug = request.query_params.get("slug") or request.query_params.get("subdomain")
        if not slug:
            return Response(
                {"detail": "Query parameter 'slug' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tenant = CinemaTenant.objects.filter(slug=slug.strip().lower()).first()
        if not tenant:
            return Response(
                {"detail": "Cinema not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        domain_root = getattr(settings, "TENANT_DOMAIN_ROOT", "africinemas.com")
        data = {
            "cinema_slug": tenant.slug,
            "cinema_name": tenant.name,
            "status": tenant.provisioning_status,
            "provisioning_started_at": tenant.provisioning_started_at,
            "provisioning_completed_at": tenant.provisioning_completed_at,
            "provisioning_attempts": tenant.provisioning_attempts,
            "error": (
                tenant.provisioning_error
                if tenant.provisioning_status == CinemaTenant.ProvisioningStatus.FAILED
                else None
            ),
            "ready": tenant.provisioning_status == CinemaTenant.ProvisioningStatus.READY,
            "launch_url": (
                f"https://{tenant.slug}.{domain_root}"
                if tenant.provisioning_status == CinemaTenant.ProvisioningStatus.READY
                else None
            ),
        }
        return Response(data, status=status.HTTP_200_OK)
