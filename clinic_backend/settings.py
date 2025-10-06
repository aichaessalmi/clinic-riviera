# clinic_backend/settings.py
from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

load_dotenv()
# settings.py
TWILIO_ACCOUNT_SID = "US6daac7a4ceb9b44f133a3e4fa53e5782"
TWILIO_AUTH_TOKEN = "QPZA55V9VCMJGQDDHGGLRB8L"
TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886"  # numéro sandbox Twilio

# ── Bases ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent       # .../clinic_backend
ROOT_DIR = BASE_DIR.parent                               # racine du repo

DEBUG = os.getenv("DEBUG", "0") == "1"
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")

_raw_hosts = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
ALLOWED_HOSTS = _raw_hosts if _raw_hosts else (["*"] if DEBUG else ["localhost", "127.0.0.1"])

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
    "whatsapp",
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
FRONTEND_DIR  = BASE_DIR / "clinic_front"
FRONTEND_DIST = FRONTEND_DIR / "dist"        # contient index.html buildé
FRONTEND_ASSETS = FRONTEND_DIST / "assets"   # contient JS/CSS

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [FRONTEND_DIST],                  # index.html du build Vite
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
# Utiliser uniquement SQLite, même sur Render
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
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

DEV_CLIENTS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # ajoute l'IP LAN de ton PC si tu testes sur téléphone :
    # "http://192.168.1.50:5173",
    # "http://192.168.1.50:8000",
]

if DEBUG:
    # Dev : simplifier au max
    CORS_ALLOW_ALL_ORIGINS = True
    CSRF_TRUSTED_ORIGINS = DEV_CLIENTS
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
    ]
    # En prod : forcer https dans la liste depuis l'env
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
# IMPORTANT : STATIC_URL doit exister et finir par '/'
STATIC_URL = os.getenv("STATIC_URL", "/static/")
if not STATIC_URL.endswith("/"):
    STATIC_URL += "/"

STATIC_ROOT = BASE_DIR / "staticfiles"  # collecte en prod (collectstatic)

# En dev, si le build Vite n’existe pas encore, évite d’ajouter un dossier inexistant
if FRONTEND_DIST.exists():
    STATICFILES_DIRS = [FRONTEND_DIST]
else:
    STATICFILES_DIRS = []  # pas de dossier inexistant

# WhiteNoise (OK en prod, ne gêne pas en dev)
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
else:
    # Dev : ne surtout pas forcer HTTPS
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# (Optionnel) Debug des chemins :
# print("DEBUG =", DEBUG)
# print("FRONTEND_DIST ->", FRONTEND_DIST, "exists:", FRONTEND_DIST.exists())
# print("STATIC_URL =", STATIC_URL)
