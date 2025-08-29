# clinic_backend/settings.py
from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# ── Bases ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent       # .../clinic_backend
ROOT_DIR = BASE_DIR.parent                               # racine repo

DEBUG = os.getenv("DEBUG", "0") == "1"
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")

_raw_hosts = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
ALLOWED_HOSTS = _raw_hosts if _raw_hosts else (["*"] if DEBUG else [])

# ── Apps ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Tiers
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    # Tes apps
    "accounts",
    "appointments",
    "referrals",
]

# ── Middleware ────────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # servir statiques en prod
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "clinic_backend.urls"

# ── Front (Vite build) + Templates ───────────────────────────────────
# ton front est DANS clinic_backend/clinic_front
FRONTEND_DIR    = BASE_DIR / "clinic_front"
FRONTEND_DIST   = FRONTEND_DIR / "dist"        # contient index.html buildé
FRONTEND_ASSETS = FRONTEND_DIST / "assets"     # contient JS/CSS

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [FRONTEND_DIST],                   # index.html du build Vite
    "APP_DIRS": True,
    "OPTIONS": {
        "context_processors": [
            "django.template.context_processors.debug",
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
        ],
    },
}]

WSGI_APPLICATION = "clinic_backend.wsgi.application"

# ── Base de données ──────────────────────────────────────────────────
DEFAULT_SQLITE_URL = f"sqlite:///{ROOT_DIR / 'db.sqlite3'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

import dj_database_url
DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        ssl_require=("postgres" in DATABASE_URL or "postgresql" in DATABASE_URL),
    )
}

# ── Auth / DRF / JWT / Swagger ───────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MIN", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Clinique Riviera API",
    "DESCRIPTION": "Back-office & webapp médecins référents",
    "VERSION": "1.0.0",
}

# ── CORS / CSRF ──────────────────────────────────────────────────────
CORS_ALLOW_CREDENTIALS = True
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
    ]

CSRF_TRUSTED_ORIGINS = [
    o.strip().replace("http://", "https://")
    for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
]

# ── i18n / Timezone ──────────────────────────────────────────────────
LANGUAGE_CODE = "fr"
TIME_ZONE = "Africa/Casablanca"
USE_I18N = True
USE_TZ = True

# ── Static & Media (WhiteNoise + Vite) ───────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"     # sous clinic_backend/

# POINTER SUR LA RACINE DU BUILD (dist) pour servir /static/assets/* et /static/vite.svg
STATICFILES_DIRS = [FRONTEND_DIST]

# WhiteNoise : compression + manifest + finders
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
WHITENOISE_USE_FINDERS = True

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── Sécurité production ──────────────────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# # (Debug local des chemins : décommente si besoin)
# print("FRONTEND_DIST ->", FRONTEND_DIST, "exists:", FRONTEND_DIST.exists())
# print("INDEX ->", (FRONTEND_DIST / "index.html").exists())
# print("ASSETS ->", FRONTEND_ASSETS.exists(), FRONTEND_ASSETS)
