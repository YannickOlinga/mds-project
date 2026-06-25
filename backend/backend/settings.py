import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

# Charge backend/.env (DATABASE_URL, etc.) si présent.
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

# Allow all hosts in development, but only the production domain otherwise.
# The `README.md` mentions running the dev server on `0.0.0.0`, so we need
# to allow local network IPs.
if DEBUG:
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = ["perinea.osc-fr1.scalingo.io"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "backend.wsgi.application"

# Base de données :
#  - si DB_HOST est défini -> Postgres Supabase (mot de passe dans une variable
#    séparée, pas besoin d'encoder les caractères spéciaux dans une URL).
#  - sinon -> SQLite (dev local).
if os.environ.get("DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": os.environ["DB_HOST"],
            "PORT": os.environ.get("DB_PORT", "5432"),
            "NAME": os.environ.get("DB_NAME", "postgres"),
            "USER": os.environ["DB_USER"],
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "CONN_MAX_AGE": 600,
            "OPTIONS": {"sslmode": "require"},
        }
    }
elif os.environ.get("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            env="DATABASE_URL",
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
}

# CORS configuration
if DEBUG:
    # In development, allow any origin for easier local testing with Expo.
    CORS_ALLOW_ALL_ORIGINS = True
else:
    # In production, only allow requests from your deployed frontend if you have one,
    # or keep it restrictive. Native apps don't have a traditional 'origin',
    # so this is more for web-based clients or added security.
    CORS_ALLOWED_ORIGINS = []  # Add your frontend URL here if you have one.
