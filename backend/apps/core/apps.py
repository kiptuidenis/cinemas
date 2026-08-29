import re
from typing import Any

from django.apps import AppConfig

# Module-level patch for Django 5.2/6.0+ compatibility with DRF
try:
    import django.utils.cache

    if not hasattr(django.utils.cache, "cc_delim_re"):
        django.utils.cache.cc_delim_re = re.compile(r"\s*,\s*")  # type: ignore[attr-defined]
except (ImportError, AttributeError):
    pass


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Core & Multi-Tenancy Framework"

    def ready(self) -> None:
        self._patch_sqlite_for_tenants()
        self._patch_drf_compat()

    @staticmethod
    def _patch_drf_compat() -> None:
        """Shim missing internal Django symbols for Django REST Framework compatibility."""
        try:
            import django.utils.cache

            if not hasattr(django.utils.cache, "cc_delim_re"):
                django.utils.cache.cc_delim_re = re.compile(r"\s*,\s*")  # type: ignore[attr-defined]
        except (ImportError, AttributeError):
            pass

    @staticmethod
    def _patch_sqlite_for_tenants() -> None:
        """
        Add django-tenants schema compatibility methods to SQLite DatabaseWrapper.
        Enables fast local execution and unit test suites on SQLite environments
        without crashing when set_schema / set_tenant is invoked.
        """
        try:
            from django.db.backends.sqlite3.base import DatabaseWrapper as SQLiteDatabaseWrapper

            if not hasattr(SQLiteDatabaseWrapper, "set_schema"):
                SQLiteDatabaseWrapper.schema_name = "public"  # type: ignore[attr-defined]
                SQLiteDatabaseWrapper.tenant = None  # type: ignore[attr-defined]
                SQLiteDatabaseWrapper.include_public_schema = True  # type: ignore[attr-defined]
                SQLiteDatabaseWrapper.search_path_set_schemas = None  # type: ignore[attr-defined]

                def set_schema(
                    self: Any, schema_name: str, tenant_type: str = "", include_public: bool = True
                ) -> Any:
                    self.schema_name = schema_name
                    return self

                def set_tenant(self: Any, tenant: Any, include_public: bool = True) -> Any:
                    self.tenant = tenant
                    self.schema_name = getattr(tenant, "schema_name", "public")
                    return self

                def set_schema_to_public(self: Any) -> Any:
                    self.schema_name = "public"
                    self.tenant = None
                    return self

                def get_tenant(self: Any) -> Any:
                    return self.tenant

                SQLiteDatabaseWrapper.set_schema = set_schema  # type: ignore[attr-defined]
                SQLiteDatabaseWrapper.set_tenant = set_tenant  # type: ignore[attr-defined]
                SQLiteDatabaseWrapper.set_schema_to_public = set_schema_to_public  # type: ignore[attr-defined]
                SQLiteDatabaseWrapper.get_tenant = get_tenant  # type: ignore[attr-defined]
        except ImportError:
            pass
