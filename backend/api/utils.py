from __future__ import annotations

from datetime import timedelta
from typing import TypedDict

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import (
    AchievementTemplate,
    DeviceStatus,
    ExerciseTemplate,
    LEVEL_AVANCE,
    LEVEL_CHOICES,
    LEVEL_DEBUTANT,
    LEVEL_INTERMEDIAIRE,
    Profile,
    Session,
    SessionTemplate,
    TipTemplate,
)


LEVEL_LABEL_BY_KEY = {key: label for key, label in LEVEL_CHOICES}

LEVEL_COLOR_BY_KEY = {
    LEVEL_DEBUTANT: "#B9657C",
    LEVEL_INTERMEDIAIRE: "#6A1E3A",
    LEVEL_AVANCE: "#5A1A30",
}


class WeeklyItem(TypedDict):
    day: str
    value: int


FR_WEEK_LETTERS = ["L", "M", "M", "J", "V", "S", "D"]  # Lundi..Dimanche


ACH_PREMIERS_PAS = "premiers_pas"
ACH_REGULARITE = "regularite"
ACH_ATHLETE = "athlete"
ACH_MAITRE = "maitre"
ACH_ECLAIR = "eclair"
ACH_PERSERVERANCE = "perserverance"


def level_label(level_key: str) -> str:
    return LEVEL_LABEL_BY_KEY.get(level_key, level_key)


def format_duration_minutes(total_minutes: int) -> str:
    hours = total_minutes // 60
    minutes = total_minutes % 60
    if hours > 0:
        return f"{hours}h {minutes:02d}".replace("h 00", "h 0")
    return f"{minutes} min"


def format_session_duration(minutes: int) -> str:
    return f"{minutes} min"


def compute_total_sessions(profile: Profile) -> int:
    return Session.objects.filter(profile=profile).count()


def compute_total_minutes(profile: Profile) -> int:
    agg = Session.objects.filter(profile=profile).aggregate(total=Sum("duration_minutes"))
    return int(agg["total"] or 0)


def compute_streak_days(profile: Profile) -> int:
    today = timezone.localdate()
    session_dates = set(
        Session.objects.filter(profile=profile).values_list("started_at__date", flat=True)
    )
    streak = 0
    cursor = today
    while cursor in session_dates:
        streak += 1
        cursor = cursor - timedelta(days=1)
        if streak > 3650:  # safety guard
            break
    return streak


def compute_weekly_data(profile: Profile) -> list[WeeklyItem]:
    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())  # Monday

    out: list[WeeklyItem] = []
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        agg = Session.objects.filter(profile=profile, started_at__date=day_date).aggregate(
            total=Sum("duration_minutes")
        )
        out.append(
            {
                "day": FR_WEEK_LETTERS[i],
                "value": int((agg["total"] or 0)),
            }
        )
    return out


def compute_month_sessions(profile: Profile, *, year: int, month: int) -> int:
    return Session.objects.filter(profile=profile, started_at__year=year, started_at__month=month).count()


def compute_distinct_training_days(profile: Profile) -> int:
    today = timezone.localdate()
    session_dates = set(
        Session.objects.filter(profile=profile).values_list("started_at__date", flat=True)
    )
    if not session_dates:
        return 0
    first = min(session_dates)
    return (today - first).days + 1


def earned_achievements(profile: Profile) -> set[str]:
    total_sessions = compute_total_sessions(profile)
    streak_days = compute_streak_days(profile)
    total_training_span_days = compute_distinct_training_days(profile)
    fast_sessions = Session.objects.filter(profile=profile, duration_minutes__lte=10).exists()

    earned: set[str] = set()
    if total_sessions >= 1:
        earned.add(ACH_PREMIERS_PAS)
    if streak_days >= 7:
        earned.add(ACH_REGULARITE)
    if total_sessions >= 10:
        earned.add(ACH_ATHLETE)
    if total_sessions >= 50:
        earned.add(ACH_MAITRE)
    if fast_sessions:
        earned.add(ACH_ECLAIR)
    if total_training_span_days >= 30:
        earned.add(ACH_PERSERVERANCE)
    return earned


@transaction.atomic
def ensure_reference_data() -> None:
    if not ExerciseTemplate.objects.exists():
        exercises = [
            ("Contraction douce", "Contractez les muscles du plancher pelvien", 10, 1),
            ("Relachement controle", "Detendez completement les muscles", 10, 2),
            ("Contraction longue", "Maintenez la contraction cinq secondes", 10, 3),
            ("Repetition rapide", "Realisez des contractions courtes et rapides", 15, 4),
        ]
        ExerciseTemplate.objects.bulk_create(
            [
                ExerciseTemplate(
                    level_key=level_key,
                    name=name,
                    description=description,
                    icon="activity",
                    duration_minutes=duration,
                    timer_duration_seconds=duration,
                    sort_order=sort_order,
                )
                for level_key in (LEVEL_DEBUTANT, LEVEL_INTERMEDIAIRE, LEVEL_AVANCE)
                for name, description, duration, sort_order in exercises
            ]
        )
    else:
        ExerciseTemplate.objects.update(icon="activity")

    if not SessionTemplate.objects.exists():
        SessionTemplate.objects.bulk_create(
            [
                SessionTemplate(
                    level_key=LEVEL_DEBUTANT,
                    title="Renforcement de base",
                    duration_minutes=15,
                    color_hex="#C95F7B",
                    sort_order=1,
                ),
                SessionTemplate(
                    level_key=LEVEL_INTERMEDIAIRE,
                    title="Controle musculaire",
                    duration_minutes=20,
                    color_hex="#571534",
                    sort_order=2,
                ),
                SessionTemplate(
                    level_key=LEVEL_AVANCE,
                    title="Endurance avancee",
                    duration_minutes=25,
                    color_hex="#F7C5C8",
                    sort_order=3,
                ),
            ]
        )

    if not AchievementTemplate.objects.exists():
        AchievementTemplate.objects.bulk_create(
            [
                AchievementTemplate(
                    code=ACH_PREMIERS_PAS,
                    title="Premiers pas",
                    description="Premiere session completee",
                    icon="target",
                ),
                AchievementTemplate(
                    code=ACH_REGULARITE,
                    title="Regularite",
                    description="Sept jours consecutifs",
                    icon="calendar-check",
                ),
                AchievementTemplate(
                    code=ACH_ATHLETE,
                    title="Assiduite",
                    description="Dix sessions completees",
                    icon="award",
                ),
                AchievementTemplate(
                    code=ACH_MAITRE,
                    title="Expertise",
                    description="Cinquante sessions completees",
                    icon="shield-check",
                ),
                AchievementTemplate(
                    code=ACH_ECLAIR,
                    title="Session courte",
                    description="Session rapide terminee",
                    icon="timer",
                ),
                AchievementTemplate(
                    code=ACH_PERSERVERANCE,
                    title="Perseverance",
                    description="Trente jours d'entrainement",
                    icon="badge-check",
                ),
            ]
        )
    else:
        icon_by_code = {
            ACH_PREMIERS_PAS: "target",
            ACH_REGULARITE: "calendar-check",
            ACH_ATHLETE: "award",
            ACH_MAITRE: "shield-check",
            ACH_ECLAIR: "timer",
            ACH_PERSERVERANCE: "badge-check",
        }
        for code, icon in icon_by_code.items():
            AchievementTemplate.objects.filter(code=code).update(icon=icon)


@transaction.atomic
def ensure_profile_data(profile_id: int) -> Profile:
    ensure_reference_data()
    profile = Profile.objects.select_related("device_status").get(id=profile_id)
    DeviceStatus.objects.get_or_create(
        profile=profile,
        defaults={
            "device_name": "",
            "battery_pct": 0,
            "signal_level": "Indisponible",
            "connected": False,
        },
    )
    return profile


def build_dashboard(profile_id: int) -> dict:
    profile = ensure_profile_data(profile_id)
    device = getattr(profile, "device_status", None)
    if device is None:
        device = DeviceStatus.objects.create(profile=profile)

    today = timezone.localdate()
    cutoff = today - timedelta(days=6)
    sessions_this_week = Session.objects.filter(profile=profile, started_at__date__gte=cutoff, started_at__date__lte=today).count()

    total_minutes = compute_total_minutes(profile)

    current_month_sessions = compute_month_sessions(profile, year=today.year, month=today.month)
    target = profile.monthly_goal_sessions_target or 1
    objective_percent = round((current_month_sessions / target) * 100)
    objective_percent = max(0, min(100, objective_percent))

    upcoming = list(SessionTemplate.objects.all().order_by("sort_order")[:3])
    upcoming_sessions = [
        {
            "id": t.id,
            "title": t.title,
            "duration": f"{t.duration_minutes} min",
            "level": level_label(t.level_key),
            "color": t.color_hex,
        }
        for t in upcoming
    ]

    tips = list(TipTemplate.objects.all().order_by("sort_order")[:3])
    tips_out = [{"id": t.id, "text": t.text, "icon": t.icon} for t in tips]

    streak_days = compute_streak_days(profile)

    return {
        "streak_days": streak_days,
        "sessions_this_week": sessions_this_week,
        "total_minutes": total_minutes,
        "objective_percent": objective_percent,
        "upcoming_sessions": upcoming_sessions,
        "tips": tips_out,
        "device": {
            "device_name": device.device_name,
            "battery_pct": device.battery_pct,
            "signal_level": device.signal_level,
            "connected": device.connected,
        },
    }


def build_training_program(profile_id: int, level_key: str) -> dict:
    profile = ensure_profile_data(profile_id)

    level_key = level_key if level_key in LEVEL_LABEL_BY_KEY else LEVEL_DEBUTANT

    exercises = list(
        ExerciseTemplate.objects.filter(level_key=level_key).order_by("sort_order")
    )

    levels = []
    for lk in (LEVEL_DEBUTANT, LEVEL_INTERMEDIAIRE, LEVEL_AVANCE):
        levels.append(
            {
                "key": lk,
                "label": level_label(lk),
                "color": LEVEL_COLOR_BY_KEY.get(lk, "#B9657C"),
                "sessions": Session.objects.filter(profile=profile, level_key=lk).count(),
            }
        )

    objective_percent = build_dashboard(profile_id)["objective_percent"]

    total_minutes = sum(e.duration_minutes for e in exercises)
    return {
        "levels": levels,
        "selected_level": {
            "key": level_key,
            "label": level_label(level_key),
            "color": LEVEL_COLOR_BY_KEY.get(level_key, "#B9657C"),
        },
        "exercises": [
            {
                "id": e.id,
                "name": e.name,
                "description": e.description,
                "icon": e.icon,
                "duration_minutes": e.duration_minutes,
                "timer_duration_seconds": e.timer_duration_seconds,
            }
            for e in exercises
        ],
        "summary": {
            "total_duration_minutes": total_minutes,
            "exercises_count": len(exercises),
            "objective_percent": objective_percent,
        },
    }


def build_progress(profile_id: int) -> dict:
    profile = ensure_profile_data(profile_id)
    today = timezone.localdate()

    weekly = compute_weekly_data(profile)
    weekly_max = max([item["value"] for item in weekly] or [0])
    total_minutes = compute_total_minutes(profile)
    streak_days = compute_streak_days(profile)

    current_month_sessions = compute_month_sessions(profile, year=today.year, month=today.month)
    target = profile.monthly_goal_sessions_target or 1
    remaining = max(0, target - current_month_sessions)
    percent = round((current_month_sessions / target) * 100) if target else 0

    achievements_earned = earned_achievements(profile)
    achievements_tpl = list(AchievementTemplate.objects.all().order_by("code"))

    achievements = []
    for idx, a in enumerate(achievements_tpl, start=1):
        achievements.append(
            {
                "id": idx,
                "title": a.title,
                "description": a.description,
                "icon": a.icon,
                "earned": a.code in achievements_earned,
            }
        )

    badges_count = sum(1 for x in achievements if x["earned"])

    recent_sessions = list(Session.objects.filter(profile=profile).order_by("-started_at")[:5])
    history = []
    for s in recent_sessions:
        session_date = s.started_at.date()
        diff = (today - session_date).days
        if diff == 0:
            date_label = "Aujourd'hui"
        elif diff == 1:
            date_label = "Hier"
        else:
            date_label = f"Il y a {diff} jours"

        history.append(
            {
                "id": s.id,
                "date": date_label,
                "duration": format_session_duration(s.duration_minutes),
                "exercises": s.exercises_count,
                "level": level_label(s.level_key),
            }
        )

    return {
        "overall": {
            "sessions_total": compute_total_sessions(profile),
            "streak_days": streak_days,
            "time_total_minutes": total_minutes,
            "time_total_formatted": format_duration_minutes(total_minutes),
            "badges_count": badges_count,
        },
        "weekly": {
            "data": weekly,
            "max_value": weekly_max,
        },
        "monthly_goal": {
            "done": current_month_sessions,
            "target": target,
            "remaining": remaining,
            "percent": percent,
        },
        "achievements": achievements,
        "history": history,
    }


def build_profile(profile_id: int) -> dict:
    profile = ensure_profile_data(profile_id)

    total_minutes = compute_total_minutes(profile)
    total_sessions = compute_total_sessions(profile)
    streak_days = compute_streak_days(profile)

    achievements_earned = earned_achievements(profile)
    badges_count = len(achievements_earned)

    personal_info = [
        {"label": "Nom", "value": profile.name},
        {"label": "Email", "value": profile.email},
        {"label": "Âge", "value": f"{profile.age} ans"},
        {"label": "Objectif", "value": profile.objective},
    ]

    return {
        "personalInfo": personal_info,
        "stats": {
            "sessions_total": total_sessions,
            "time_total_formatted": format_duration_minutes(total_minutes),
            "streak_days": streak_days,
            "badges_count": badges_count,
        },
        "settings": {
            "reminders": profile.reminders,
            "notifications": profile.notifications,
            "darkMode": profile.dark_mode,
        },
        "device": {
            "device_name": profile.device_status.device_name,
            "battery_pct": profile.device_status.battery_pct,
            "connected": profile.device_status.connected,
        },
        # Niveau actuel utilisé dans le "badge" profil
        "level": {
            "label": level_label(profile.level_key),
        },
    }
