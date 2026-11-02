from __future__ import annotations

import logging

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import Profile
from .utils import ensure_profile_data


security_log = logging.getLogger("api.security")

INVALID_CREDENTIALS = "Identifiants invalides."


def _client_ip(request) -> str:
    return request.META.get("REMOTE_ADDR", "?")


class RegisterSerializer(serializers.Serializer):
    username = serializers.RegexField(
        r"^[\w.@+-]+\Z",
        max_length=150,
        min_length=3,
        error_messages={"invalid": _("Caractères autorisés : lettres, chiffres et @/./+/-/_")},
    )
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128, trim_whitespace=False)

    def validate_username(self, value: str) -> str:
        User = get_user_model()
        # Insensible à la casse : empêche "Alice" et "alice" de coexister (usurpation).
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(_("Ce nom d'utilisateur est déjà utilisé."))
        return value

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate(self, attrs: dict) -> dict:
        User = get_user_model()
        candidate = User(username=attrs["username"], email=attrs["email"])
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)


class RefreshInputSerializer(serializers.Serializer):
    refresh = serializers.CharField(max_length=2048)


def auth_payload(user, profile: Profile) -> dict:
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    return {
        "access": str(access),
        "refresh": str(refresh),
        "profile_id": profile.id,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        "profile": {"name": profile.name, "email": profile.email},
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_scope = "auth_register"

    def post(self, request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        User = get_user_model()
        try:
            with transaction.atomic():
                user = User.objects.create_user(username=username, email=email, password=password)
                profile = Profile.objects.create(
                    user=user,
                    name=username,
                    email=email,
                    age=0,
                    objective="",
                )
        except IntegrityError:
            # Course entre deux inscriptions simultanées avec le même username.
            raise serializers.ValidationError({"username": [_("Ce nom d'utilisateur est déjà utilisé.")]})

        ensure_profile_data(profile.id)
        security_log.info("register user_id=%s ip=%s", user.id, _client_ip(request))
        return Response(auth_payload(user, profile), status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_scope = "auth_login"

    def post(self, request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=username, password=password)
        if user is None:
            security_log.warning("login_failed ip=%s", _client_ip(request))
            return Response({"detail": INVALID_CREDENTIALS}, status=401)

        profile = getattr(user, "profile", None)
        if profile is None:
            profile = Profile.objects.create(
                user=user,
                name=user.username,
                email=user.email or "",
                age=0,
                objective="",
            )
        ensure_profile_data(profile.id)

        return Response(auth_payload(user, profile))


class ThrottledTokenRefreshView(TokenRefreshView):
    authentication_classes: list = []
    throttle_scope = "auth_refresh"


class LogoutView(APIView):
    """Révoque le refresh token (blacklist) : la session ne peut plus être prolongée."""

    throttle_scope = "auth_refresh"

    def post(self, request) -> Response:
        serializer = RefreshInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            if str(token.get("user_id")) != str(request.user.pk):
                return Response({"detail": "Jeton invalide."}, status=400)
            token.blacklist()
        except TokenError:
            # Déjà expiré / déjà révoqué : la déconnexion est de toute façon effective.
            pass
        return Response(status=204)


class DeleteAccountView(APIView):
    """Droit à l'effacement (RGPD art. 17) : supprime le compte et toutes les données de santé."""

    throttle_scope = "account_delete"

    def post(self, request) -> Response:
        password = request.data.get("password") if isinstance(request.data, dict) else None
        if not isinstance(password, str) or not request.user.check_password(password):
            return Response({"detail": "Mot de passe incorrect."}, status=403)

        user_id = request.user.pk
        with transaction.atomic():
            # Profile, Session, DeviceStatus... sont supprimés en cascade.
            Profile.objects.filter(user=request.user).delete()
            request.user.delete()
        security_log.info("account_deleted user_id=%s ip=%s", user_id, _client_ip(request))
        return Response(status=204)
