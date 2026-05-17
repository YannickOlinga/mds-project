import { api, publicApi } from "@/services/api";
import type {
  AuthResponse,
  DashboardResponse,
  DeviceStatus,
  LevelKey,
  ProfileResponse,
  ProgressResponse,
  TrainingProgramResponse,
} from "@/types/api";

export async function loginRequest(username: string, password: string) {
  const response = await publicApi.post<AuthResponse>("/api/auth/login", {
    username,
    password,
  });
  return response.data;
}

export async function registerRequest(username: string, email: string, password: string) {
  const response = await publicApi.post<AuthResponse>("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
}

export async function getDashboard() {
  const response = await api.get<DashboardResponse>("/api/home/dashboard");
  return response.data;
}

export async function getDeviceStatus() {
  const response = await api.get<DeviceStatus>("/api/device/status");
  return response.data;
}

export async function connectDevice(payload: Partial<DeviceStatus> = {}) {
  const response = await api.post<DeviceStatus>("/api/device/connect", payload);
  return response.data;
}

export async function getTrainingProgram(levelKey: LevelKey) {
  const response = await api.get<TrainingProgramResponse>("/api/training/program", {
    params: { level_key: levelKey },
  });
  return response.data;
}

export async function completeTraining(levelKey: LevelKey, exercisesCount: number) {
  const response = await api.post<DashboardResponse>("/api/training/complete", {
    level_key: levelKey,
    exercises_count: exercisesCount,
  });
  return response.data;
}

export async function getProgress() {
  const response = await api.get<ProgressResponse>("/api/stats/progress");
  return response.data;
}

export async function getMeProfile() {
  const response = await api.get<ProfileResponse>("/api/me/profile");
  return response.data;
}

export async function updateMeProfileSettings(payload: {
  reminders?: boolean;
  notifications?: boolean;
  darkMode?: boolean;
}) {
  const response = await api.put<ProfileResponse>("/api/me/profile", payload);
  return response.data;
}
