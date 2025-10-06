# clinic_backend/settings.py
from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

# ── Secrets (ne JAMAIS les mettre en dur) ─────────────────────────────
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

# ── Bases ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

DEBUG = os.getenv("DEBUG", "0") == "1"
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")

_raw_hosts = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
ALLOWED_HOSTS = _raw_hosts if _raw_hosts else (["*"] if DEBUG else ["localhost", "127.0.0.1"])

# ── Apps ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "corsheaders","rest_framework","drf_spectacular",
    "accounts","appointments","referrals","whatsapp",
]

# ── Middleware ────────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
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
FRONTEND_DIR  = BASE_DIR / "clinic_front"
FRONTEND_DIST = FRONTEND_DIR / "dist"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [FRONTEND_DIST],
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

# ── Base de données (SSL Render) ──────────────────────────────────────
DEFAULT_SQLITE_URL = f"sqlite:///{ROOT_DIR / 'db.sqlite3'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        ssl_require=("postgres" in DATABASE_URL or "postgresql" in DATABASE_URL),
    )
}
# Ceinture et bretelles : forcer sslmode=require dans OPTIONS
if "postgres" in DATABASE_URL or "postgresql" in DATABASE_URL:
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"]["sslmode"] = "require"
    # (optionnel) ATOMIC_REQUESTS si tu veux transactions par requête
    # DATABASES["default"]["ATOMIC_REQUESTS"] = True

# ── Auth / DRF / JWT / Swagger ───────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
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

DEV_CLIENTS = [
    "http://localhost:5173","http://127.0.0.1:5173",
    "http://localhost:8000","http://127.0.0.1:8000",
]

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CSRF_TRUSTED_ORIGINS = DEV_CLIENTS
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
    # Autoriser variable explicite si fournie, sinon dériver de CORS_ORIGINS
    _csrf_env = [o.strip() for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()]
    if _csrf_env:
        CSRF_TRUSTED_ORIGINS = [o.replace("http://", "https://") for o in _csrf_env]
    else:
        CSRF_TRUSTED_ORIGINS = [o.replace("http://", "https://") for o in CORS_ALLOWED_ORIGINS]

# ── i18n / Timezone ──────────────────────────────────────────────────
LANGUAGE_CODE = "fr"
TIME_ZONE = "Africa/Casablanca"
USE_I18N = True
USE_TZ = True

# ── Static & Media (WhiteNoise + Vite) ───────────────────────────────
STATIC_URL = os.getenv("STATIC_URL", "/static/")
if not STATIC_URL.endswith("/"):
    STATIC_URL += "/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [FRONTEND_DIST] if FRONTEND_DIST.exists() else []
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
    # (optionnel mais recommandé)
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))  # ex: 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
