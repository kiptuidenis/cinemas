"""
Thread-safe and async-safe tenant context engine.
Uses Python standard library `contextvars` to maintain request-scoped active cinema.
"""
from contextvars import ContextVar
from typing import Any, Optional
import uuid

_current_tenant_id: ContextVar[Optional[uuid.UUID]] = ContextVar("current_tenant_id", default=None)
_current_tenant_obj: ContextVar[Optional[Any]] = ContextVar("current_tenant_obj", default=None)


def set_current_tenant_id(tenant_id: Optional[uuid.UUID]) -> None:
    """Set the active tenant UUID for the current request execution context."""
    _current_tenant_id.set(tenant_id)


def get_current_tenant_id() -> Optional[uuid.UUID]:
    """Retrieve the active tenant UUID from the execution context."""
    return _current_tenant_id.get()


def set_current_tenant(tenant: Optional[Any]) -> None:
    """Set the active tenant model instance and ID in context."""
    _current_tenant_obj.set(tenant)
    if tenant and hasattr(tenant, "id"):
        set_current_tenant_id(tenant.id)
    else:
        set_current_tenant_id(None)


def get_current_tenant() -> Optional[Any]:
    """Retrieve the active tenant model instance from the execution context."""
    return _current_tenant_obj.get()


def clear_current_tenant() -> None:
    """Reset the tenant context at the end of the request-response cycle."""
    _current_tenant_id.set(None)
    _current_tenant_obj.set(None)
