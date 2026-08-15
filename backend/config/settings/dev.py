"""
Development Django settings with local conveniences and fallbacks.
"""

import os
from urllib.parse import urlparse

from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")

# CORS & CSRF Configuration for local Vite dev server
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Database Configuration
# Fallback to local SQLite if DATABASE_URL is not set or empty
db_url = os.environ.get("DATABASE_URL", "").strip()

if db_url and db_url.startswith("postgres"):
    parsed = urlparse(db_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/"),
            "USER": parsed.username or "cinema_user",
            "PASSWORD": parsed.password or "cinema_password",
            "HOST": parsed.hostname or "localhost",
            "PORT": parsed.port or 5432,
            "CONN_MAX_AGE": 60,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# Cache Configuration
redis_url = os.environ.get("REDIS_URL", "").strip()
if redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": redis_url,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "cinema-dev-locmem",
        }
    }
