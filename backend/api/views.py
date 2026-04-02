from __future__ import annotations

from typing import Any

from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceStatus, ExerciseTemplate, LEVEL_CHOICES
from .utils import build_dashboard, build_profile, build_progress, build_training_program, ensure_demo_data


def _profile_id_from_request(request: Request) -> int:
    # Les endpoints de l'app utilisent le profil lié à l'utilisateur connecté.
    # `ensure_demo_data()` crée aussi les templates + sessions de démo si nécessaire.
    profile = getattr(request.user, "profile", None)
    if profile is not None:
        return int(profile.id)
    # Fallback (développement) - si jamais on appelle sans profil lié.
    raw = request.query_params.get("profile_id")
    if raw:
        try:
            return int(raw)
        except ValueError:
            pass
    return 1


class DashboardView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response(build_dashboard(profile_id))


class DeviceStatusView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_demo_data(profile_id)
        device: DeviceStatus = profile.device_status
        return Response(
            {
                "device_name": device.device_name,
                "battery_pct": device.battery_pct,
                "signal_level": device.signal_level,
                "connected": device.connected,
            }
        )


class ConnectDeviceView(APIView):
    def post(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_demo_data(profile_id)
        device: DeviceStatus = profile.device_status

        # Pour la démo: on "simule" la connexion.
        device.connected = True
        device.updated_at = timezone.now()
        device.battery_pct = request.data.get("battery_pct", device.battery_pct or 85)
        device.signal_level = request.data.get("signal_level", device.signal_level or "Excellent")
        device.device_name = request.data.get("device_name", device.device_name or "Périnea #A4F2B")
        device.save(update_fields=["connected", "battery_pct", "signal_level", "device_name", "updated_at"])

        return Response(
            {
                "device_name": device.device_name,
                "battery_pct": device.battery_pct,
                "signal_level": device.signal_level,
                "connected": device.connected,
            }
        )


class TrainingProgramView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        level_key = request.query_params.get("level_key", "debutant")

        # Vérifie que la valeur est cohérente (sinon fallback)
        valid_keys = {k for k, _ in LEVEL_CHOICES}
        if level_key not in valid_keys:
            level_key = "debutant"

        return Response(build_training_program(profile_id, level_key))


class TrainingCompleteView(APIView):
    """
    Enregistre une session "terminée" (appelée par le frontend à la fin du timer).

    Payload attendu:
    - level_key: string
    - exercises_count: number
    """

    def post(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_demo_data(profile_id)

        level_key = request.data.get("level_key", "debutant")
        exercises_count = int(request.data.get("exercises_count", 0) or 0)

        # Durée totale "réelle" = somme des modèles d'exercices pour ce niveau.
        exercises = list(ExerciseTemplate.objects.filter(level_key=level_key))
        duration_minutes = sum(e.duration_minutes for e in exercises)
        duration_seconds = duration_minutes * 60

        # Titre simple, basé sur la durée (cohérent avec l'UI).
        if duration_minutes <= 10:
            title = "Session rapide"
        elif duration_minutes <= 15:
            title = "Renforcement de base"
        elif duration_minutes <= 20:
            title = "Contrôle musculaire"
        else:
            title = "Endurance avancée"

        Session.objects.create(
            profile=profile,
            title=title,
            level_key=level_key,
            duration_minutes=duration_minutes,
            duration_seconds=duration_seconds,
            exercises_count=exercises_count or len(exercises),
        )

        # Retourne un aperçu (utile pour debug UI)
        return Response(build_dashboard(profile_id))


class StatsWeeklyView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response(build_progress(profile_id)["weekly"])


class StatsAchievementsView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response({"achievements": build_progress(profile_id)["achievements"]})


class StatsHistoryView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response({"history": build_progress(profile_id)["history"]})


class StatsProgressView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response(build_progress(profile_id))


class ProfileView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response(build_profile(profile_id))

    def put(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_demo_data(profile_id)

        reminders = request.data.get("reminders")
        notifications = request.data.get("notifications")
        dark_mode = request.data.get("darkMode")

        if reminders is not None:
            profile.reminders = bool(reminders)
        if notifications is not None:
            profile.notifications = bool(notifications)
        if dark_mode is not None:
            profile.dark_mode = bool(dark_mode)

        profile.save(update_fields=["reminders", "notifications", "dark_mode"])
        return Response(build_profile(profile_id))

