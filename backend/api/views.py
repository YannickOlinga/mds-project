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


def _payload(request: Request) -> dict:
    """Garantit un objet JSON : un tableau ou un scalaire ferait planter les `.get()`."""
    if not isinstance(request.data, dict):
        raise ValidationError({"detail": "Le corps de la requête doit être un objet JSON."})
    return request.data


def _as_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "oui"}
    if isinstance(value, int):
        return value != 0
    raise ValidationError({"detail": "Booléen attendu."})


def _as_int(value: object, field: str, *, minimum: int, maximum: int) -> int:
    if isinstance(value, bool):
        raise ValidationError({field: "Entier attendu."})
    try:
        number = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        raise ValidationError({field: "Entier attendu."})
    if number < minimum or number > maximum:
        raise ValidationError({field: f"Doit être compris entre {minimum} et {maximum}."})
    return number


def _as_text(value: object, field: str, *, max_length: int, required: bool = False) -> str:
    if value is None:
        text = ""
    elif isinstance(value, (str, int, float)) and not isinstance(value, bool):
        text = str(value).strip()
    else:
        raise ValidationError({field: "Texte attendu."})
    if required and not text:
        raise ValidationError({field: "Champ requis."})
    if len(text) > max_length:
        raise ValidationError({field: f"{max_length} caractères maximum."})
    return text


def _as_level_key(value: object) -> str:
    if not isinstance(value, str) or value not in _valid_level_keys():
        raise ValidationError({"level_key": "Niveau invalide."})
    return value


MAX_SYMPTOMS = 20
MAX_SYMPTOM_LENGTH = 80
MAX_HEALTH_NOTES_LENGTH = 2000


HEALTH_FIELDS = ("symptoms", "birth_context", "health_notes")


def _apply_health_consent(profile: Profile, data: dict) -> list[str]:
    """Consentement explicite (RGPD art. 9.2.a) avant tout stockage de données de santé.

    - `health_data_consent: true`  -> horodate le consentement
    - `health_data_consent: false` -> retrait : les données de santé sont effacées
    - sans consentement, seules des valeurs vides sont acceptées pour ces champs
    """
    updated: list[str] = []
    if "health_data_consent" in data:
        consent = _as_bool(data.get("health_data_consent"))
        if consent and profile.health_data_consent_at is None:
            profile.health_data_consent_at = timezone.now()
            updated.append("health_data_consent_at")
        elif not consent:
            profile.health_data_consent_at = None
            profile.symptoms = []
            profile.birth_context = ""
            profile.health_notes = ""
            updated.extend(["health_data_consent_at", *HEALTH_FIELDS])

    if profile.health_data_consent_at is None:
        for field in HEALTH_FIELDS:
            if data.get(field):
                raise ValidationError(
                    {"health_data_consent": "Votre consentement est requis pour enregistrer des données de santé."}
                )
    return updated


def _update_profile_from_payload(profile: Profile, data: dict) -> list[str]:
    updated_fields: list[str] = _apply_health_consent(profile, data)
    consent_withdrawn = "health_data_consent" in data and profile.health_data_consent_at is None
    if consent_withdrawn:
        data = {key: value for key, value in data.items() if key not in HEALTH_FIELDS}

    if "name" in data:
        profile.name = _as_text(data.get("name"), "name", max_length=120, required=True)
        updated_fields.append("name")

    if "age" in data:
        profile.age = _as_int(data.get("age"), "age", minimum=13, maximum=100)
        updated_fields.append("age")

    if "objective" in data:
        profile.objective = _as_text(data.get("objective"), "objective", max_length=255, required=True)
        updated_fields.append("objective")

    if "level_key" in data:
        profile.level_key = _as_level_key(data.get("level_key"))
        updated_fields.append("level_key")

    if "training_frequency" in data:
        profile.training_frequency = _as_text(data.get("training_frequency"), "training_frequency", max_length=80)
        updated_fields.append("training_frequency")

    if "symptoms" in data:
        symptoms = data.get("symptoms") or []
        if not isinstance(symptoms, list) or len(symptoms) > MAX_SYMPTOMS:
            raise ValidationError({"symptoms": "Liste de symptomes invalide."})
        cleaned = [_as_text(item, "symptoms", max_length=MAX_SYMPTOM_LENGTH) for item in symptoms]
        profile.symptoms = [item for item in cleaned if item]
        updated_fields.append("symptoms")

    if "birth_context" in data:
        profile.birth_context = _as_text(data.get("birth_context"), "birth_context", max_length=120)
        updated_fields.append("birth_context")

    if "has_probe" in data:
        profile.has_probe = _as_bool(data.get("has_probe"))
        updated_fields.append("has_probe")

    if "health_notes" in data:
        profile.health_notes = _as_text(
            data.get("health_notes"), "health_notes", max_length=MAX_HEALTH_NOTES_LENGTH
        )
        updated_fields.append("health_notes")

    if "monthly_goal_sessions_target" in data:
        profile.monthly_goal_sessions_target = _as_int(
            data.get("monthly_goal_sessions_target"), "monthly_goal_sessions_target", minimum=1, maximum=60
        )
        updated_fields.append("monthly_goal_sessions_target")

    if data.get("onboarding_completed") is True:
        profile.onboarding_completed = True
        updated_fields.append("onboarding_completed")

    for payload_key, model_field in (
        ("reminders", "reminders"),
        ("notifications", "notifications"),
        ("darkMode", "dark_mode"),
    ):
        if data.get(payload_key) is not None:
            # bool("false") == True : on parse explicitement.
            setattr(profile, model_field, _as_bool(data.get(payload_key)))
            updated_fields.append(model_field)

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

        data = _payload(request)

        device_name = data.get("device_name")
        if not isinstance(device_name, str) or not device_name.strip():
            raise ValidationError({"device_name": "Nom de sonde requis."})

        device.connected = True
        device.updated_at = timezone.now()
        device.device_name = _as_text(device_name, "device_name", max_length=120, required=True)
        if data.get("battery_pct") is not None:
            device.battery_pct = _as_int(data["battery_pct"], "battery_pct", minimum=0, maximum=100)
        if "signal_level" in data:
            device.signal_level = (
                _as_text(data.get("signal_level"), "signal_level", max_length=32) or "Indisponible"
            )
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

        data = _payload(request)
        level_key = _as_level_key(data.get("level_key", "debutant"))

        exercises = list(ExerciseTemplate.objects.filter(level_key=level_key))
        if not exercises:
            raise ValidationError({"level_key": "Aucun exercice disponible pour ce niveau."})

        # Borné au nombre réel d'exercices : empêche de gonfler artificiellement les stats.
        exercises_count = _as_int(
            data.get("exercises_count", 0) or 0, "exercises_count", minimum=0, maximum=len(exercises)
        )

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

        updated_fields = _update_profile_from_payload(profile, _payload(request))
        if updated_fields:
            profile.save(update_fields=sorted(set(updated_fields)))
        return Response(build_profile(profile_id))
