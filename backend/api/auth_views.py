from __future__ import annotations

from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .utils import ensure_profile_data


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value: str) -> str:
        User = get_user_model()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(_("Ce nom d'utilisateur est déjà utilisé."))
        return value


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)


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

    def post(self, request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        User = get_user_model()
        user = User.objects.create_user(username=username, email=email, password=password)
        profile = Profile.objects.create(
            user=user,
            name=username,
            email=email,
            age=0,
            objective="",
        )
        ensure_profile_data(profile.id)

        return Response(auth_payload(user, profile))


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"detail": "Identifiants invalides."}, status=401)

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
