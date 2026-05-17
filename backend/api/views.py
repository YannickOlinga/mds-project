from __future__ import annotations

from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceStatus, ExerciseTemplate, LEVEL_CHOICES, Session
from .utils import build_dashboard, build_profile, build_progress, build_training_program, ensure_profile_data


def _profile_id_from_request(request: Request) -> int:
    profile = getattr(request.user, "profile", None)
    if profile is None:
        raise NotFound("Profil utilisateur introuvable.")
    return int(profile.id)


class DashboardView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        return Response(build_dashboard(profile_id))


class DeviceStatusView(APIView):
    def get(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_profile_data(profile_id)
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
        profile = ensure_profile_data(profile_id)
        device: DeviceStatus = profile.device_status

        device_name = request.data.get("device_name")
        if not isinstance(device_name, str) or not device_name.strip():
            raise ValidationError({"device_name": "Nom de sonde requis."})

        device.connected = True
        device.updated_at = timezone.now()
        device.device_name = device_name.strip()
        if "battery_pct" in request.data:
            device.battery_pct = int(request.data["battery_pct"] or 0)
        if "signal_level" in request.data:
            device.signal_level = str(request.data["signal_level"] or "Indisponible")
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

        valid_keys = {key for key, _ in LEVEL_CHOICES}
        if level_key not in valid_keys:
            level_key = "debutant"

        return Response(build_training_program(profile_id, level_key))


class TrainingCompleteView(APIView):
    def post(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_profile_data(profile_id)

        level_key = request.data.get("level_key", "debutant")
        valid_keys = {key for key, _ in LEVEL_CHOICES}
        if level_key not in valid_keys:
            raise ValidationError({"level_key": "Niveau invalide."})

        exercises_count = int(request.data.get("exercises_count", 0) or 0)
        exercises = list(ExerciseTemplate.objects.filter(level_key=level_key))
        if not exercises:
            raise ValidationError({"level_key": "Aucun exercice disponible pour ce niveau."})

        duration_minutes = sum(exercise.duration_minutes for exercise in exercises)
        duration_seconds = duration_minutes * 60

        if duration_minutes <= 10:
            title = "Session courte"
        elif duration_minutes <= 15:
            title = "Renforcement de base"
        elif duration_minutes <= 20:
            title = "Controle musculaire"
        else:
            title = "Endurance avancee"

        Session.objects.create(
            profile=profile,
            title=title,
            level_key=level_key,
            duration_minutes=duration_minutes,
            duration_seconds=duration_seconds,
            exercises_count=exercises_count or len(exercises),
        )

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
        profile = ensure_profile_data(profile_id)

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
