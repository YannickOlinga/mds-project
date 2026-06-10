from __future__ import annotations

import math

from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceStatus, ExerciseTemplate, LEVEL_CHOICES, Profile, Session
from .utils import build_dashboard, build_profile, build_progress, build_training_program, ensure_profile_data


def _profile_id_from_request(request: Request) -> int:
    profile = getattr(request.user, "profile", None)
    if profile is None:
        raise NotFound("Profil utilisateur introuvable.")
    return int(profile.id)


def _valid_level_keys() -> set[str]:
    return {key for key, _ in LEVEL_CHOICES}


def _as_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "oui"}
    return bool(value)


def _update_profile_from_payload(profile: Profile, data: dict) -> list[str]:
    updated_fields: list[str] = []

    if "name" in data:
        name = str(data.get("name") or "").strip()
        if not name:
            raise ValidationError({"name": "Nom requis."})
        profile.name = name
        updated_fields.append("name")

    if "age" in data:
        try:
            age = int(data.get("age") or 0)
        except (TypeError, ValueError):
            raise ValidationError({"age": "Age invalide."})
        if age < 13 or age > 100:
            raise ValidationError({"age": "Age invalide."})
        profile.age = age
        updated_fields.append("age")

    if "objective" in data:
        objective = str(data.get("objective") or "").strip()
        if not objective:
            raise ValidationError({"objective": "Objectif requis."})
        profile.objective = objective
        updated_fields.append("objective")

    if "level_key" in data:
        level_key = str(data.get("level_key") or "").strip()
        if level_key not in _valid_level_keys():
            raise ValidationError({"level_key": "Niveau invalide."})
        profile.level_key = level_key
        updated_fields.append("level_key")

    if "training_frequency" in data:
        profile.training_frequency = str(data.get("training_frequency") or "").strip()
        updated_fields.append("training_frequency")

    if "symptoms" in data:
        symptoms = data.get("symptoms") or []
        if not isinstance(symptoms, list):
            raise ValidationError({"symptoms": "Liste de symptomes invalide."})
        profile.symptoms = [str(item).strip() for item in symptoms if str(item).strip()]
        updated_fields.append("symptoms")

    if "birth_context" in data:
        profile.birth_context = str(data.get("birth_context") or "").strip()
        updated_fields.append("birth_context")

    if "has_probe" in data:
        profile.has_probe = _as_bool(data.get("has_probe"))
        updated_fields.append("has_probe")

    if "health_notes" in data:
        profile.health_notes = str(data.get("health_notes") or "").strip()
        updated_fields.append("health_notes")

    if "monthly_goal_sessions_target" in data:
        try:
            target = int(data.get("monthly_goal_sessions_target") or 0)
        except (TypeError, ValueError):
            raise ValidationError({"monthly_goal_sessions_target": "Objectif mensuel invalide."})
        if target < 1 or target > 60:
            raise ValidationError({"monthly_goal_sessions_target": "Objectif mensuel invalide."})
        profile.monthly_goal_sessions_target = target
        updated_fields.append("monthly_goal_sessions_target")

    if data.get("onboarding_completed") is True:
        profile.onboarding_completed = True
        updated_fields.append("onboarding_completed")

    return updated_fields


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

        if level_key not in _valid_level_keys():
            level_key = "debutant"

        return Response(build_training_program(profile_id, level_key))


class TrainingCompleteView(APIView):
    def post(self, request: Request) -> Response:
        profile_id = _profile_id_from_request(request)
        profile = ensure_profile_data(profile_id)

        level_key = request.data.get("level_key", "debutant")
        if level_key not in _valid_level_keys():
            raise ValidationError({"level_key": "Niveau invalide."})

        exercises_count = int(request.data.get("exercises_count", 0) or 0)
        exercises = list(ExerciseTemplate.objects.filter(level_key=level_key))
        if not exercises:
            raise ValidationError({"level_key": "Aucun exercice disponible pour ce niveau."})

        duration_seconds = sum(exercise.timer_duration_seconds for exercise in exercises)
        duration_minutes = max(1, math.ceil(duration_seconds / 60))

        if duration_seconds <= 60:
            title = "Session courte"
        elif duration_seconds <= 300:
            title = "Renforcement de base"
        elif duration_seconds <= 900:
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

        updated_fields = _update_profile_from_payload(profile, request.data)
        updated_fields.extend(["reminders", "notifications", "dark_mode"])
        profile.save(update_fields=sorted(set(updated_fields)))
        return Response(build_profile(profile_id))
