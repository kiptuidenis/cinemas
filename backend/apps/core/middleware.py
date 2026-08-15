"""
Core middleware for request correlation ID tracing and tenant context isolation.
"""
from typing import Callable
import uuid
from django.http import HttpRequest, HttpResponse
from apps.core.context import clear_current_tenant, set_current_tenant_id


class RequestIDMiddleware:
    """
    Middleware that assigns a unique Correlation ID (X-Request-ID) to every HTTP request,
    attaching it to the request object and returning it in the HTTP response headers.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())

        request.request_id = request_id  # type: ignore[attr-defined]
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response


class TenantContextMiddleware:
    """
    Middleware that resolves the active Cinema Tenant ID from HTTP headers or user affiliation,
    populates the thread-safe ContextVar, and ensures guaranteed cleanup upon response exit.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Check explicit X-Cinema-ID header
        tenant_header = request.headers.get("X-Cinema-ID")
        if tenant_header:
            try:
                tenant_uuid = uuid.UUID(tenant_header)
                set_current_tenant_id(tenant_uuid)
            except (ValueError, TypeError):
                set_current_tenant_id(None)
        elif hasattr(request, "user") and getattr(request.user, "is_authenticated", False):
            user_cinema_id = getattr(request.user, "cinema_id", None)
            if user_cinema_id:
                set_current_tenant_id(user_cinema_id)
            else:
                set_current_tenant_id(None)
        else:
            set_current_tenant_id(None)

        try:
            response = self.get_response(request)
            return response
        finally:
            clear_current_tenant()
