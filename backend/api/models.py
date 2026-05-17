from django.db import models
from django.conf import settings


LEVEL_DEBUTANT = "debutant"
LEVEL_INTERMEDIAIRE = "intermediaire"
LEVEL_AVANCE = "avance"

LEVEL_CHOICES = [
    (LEVEL_DEBUTANT, "Débutant"),
    (LEVEL_INTERMEDIAIRE, "Intermédiaire"),
    (LEVEL_AVANCE, "Avancé"),
]


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=120)
    email = models.EmailField()
    age = models.PositiveIntegerField()
    objective = models.CharField(max_length=255)
    level_key = models.CharField(max_length=32, choices=LEVEL_CHOICES, default=LEVEL_DEBUTANT)

    reminders = models.BooleanField(default=True)
    notifications = models.BooleanField(default=True)
    dark_mode = models.BooleanField(default=False)

    # Objectif mensuel (nombre de sessions)
    monthly_goal_sessions_target = models.PositiveIntegerField(default=25)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name} ({self.id})"


class DeviceStatus(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="device_status")

    device_name = models.CharField(max_length=120, default="Périnea")
    battery_pct = models.PositiveSmallIntegerField(default=85)
    signal_level = models.CharField(max_length=32, default="Excellent")
    connected = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"DeviceStatus(profile_id={self.profile_id}, connected={self.connected})"


class ExerciseTemplate(models.Model):
    level_key = models.CharField(max_length=32, choices=LEVEL_CHOICES)

    name = models.CharField(max_length=150)
    description = models.TextField()
    icon = models.CharField(max_length=16)

    # Durée "réelle" (pour statistiques/affichage)
    duration_minutes = models.PositiveIntegerField()

    # Duree utilisee par le minuteur de session cote application.
    timer_duration_seconds = models.PositiveIntegerField(default=10)

    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["level_key", "sort_order"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name} ({self.level_key})"


class SessionTemplate(models.Model):
    level_key = models.CharField(max_length=32, choices=LEVEL_CHOICES)

    title = models.CharField(max_length=150)
    duration_minutes = models.PositiveIntegerField()
    color_hex = models.CharField(max_length=16, default="#B9657C")

    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.title} ({self.level_key})"


class TipTemplate(models.Model):
    text = models.CharField(max_length=255)
    icon = models.CharField(max_length=16)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self) -> str:  # pragma: no cover
        return f"TipTemplate({self.id})"


class Session(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="sessions")

    title = models.CharField(max_length=150)
    level_key = models.CharField(max_length=32, choices=LEVEL_CHOICES)

    duration_minutes = models.PositiveIntegerField()
    duration_seconds = models.PositiveIntegerField()
    exercises_count = models.PositiveIntegerField(default=0)

    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self) -> str:  # pragma: no cover
        return f"Session({self.profile_id}, {self.started_at:%Y-%m-%d})"


class AchievementTemplate(models.Model):
    # Identifiant stable
    code = models.CharField(max_length=64, unique=True)

    title = models.CharField(max_length=120)
    description = models.CharField(max_length=255)
    icon = models.CharField(max_length=16)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:  # pragma: no cover
        return f"AchievementTemplate({self.code})"


class UserAchievement(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(AchievementTemplate, on_delete=models.CASCADE)

    earned = models.BooleanField(default=False)
    earned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["profile", "achievement"]

    def __str__(self) -> str:  # pragma: no cover
        return f"UserAchievement(profile_id={self.profile_id}, code={self.achievement.code}, earned={self.earned})"
