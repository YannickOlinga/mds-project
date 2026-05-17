from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ConnectDeviceView,
    DashboardView,
    DeviceStatusView,
    ProfileView,
    TrainingCompleteView,
    TrainingProgramView,
    StatsProgressView,
    StatsAchievementsView,
    StatsHistoryView,
    StatsWeeklyView,
)
from .auth_views import LoginView, RegisterView


urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    path("home/dashboard", DashboardView.as_view(), name="home-dashboard"),
    path("device/status", DeviceStatusView.as_view(), name="device-status"),
    path("device/connect", ConnectDeviceView.as_view(), name="device-connect"),
    path("training/program", TrainingProgramView.as_view(), name="training-program"),
    path("training/complete", TrainingCompleteView.as_view(), name="training-complete"),
    path("stats/progress", StatsProgressView.as_view(), name="stats-progress"),
    path("stats/weekly", StatsWeeklyView.as_view(), name="stats-weekly"),
    path("stats/achievements", StatsAchievementsView.as_view(), name="stats-achievements"),
    path("stats/history", StatsHistoryView.as_view(), name="stats-history"),
    path("me/profile", ProfileView.as_view(), name="me-profile"),
]
