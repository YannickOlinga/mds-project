import { api, publicApi } from "@/services/api";
import type {
  DeviceStatus,
  LevelKey,
  ProfileUpdatePayload,
} from "@/types/api";

export async function loginRequest(username: string, password: string) {
  return await publicApi.post("/api/auth/login", {
    username,
    password,
  });
}

export async function registerRequest(username: string, email: string, password: string) {
  return await publicApi.post("/api/auth/register", {
    username,
    email,
    password,
  });
}

export async function getDashboard() {
  return await api.get("/api/home/dashboard");
}

export async function getDeviceStatus() {
  return await api.get("/api/device/status");
}

export async function connectDevice(payload: Partial<DeviceStatus> = {}) {
  return await api.post("/api/device/connect", payload);
}

export async function getTrainingProgram(levelKey: LevelKey) {
  return await api.get("/api/training/program", { level_key: levelKey });
}

export async function completeTraining(levelKey: LevelKey, exercisesCount: number) {
  return await api.post("/api/training/complete", {
    level_key: levelKey,
    exercises_count: exercisesCount,
  });
}

export async function getProgress() {
  return await api.get("/api/stats/progress");
}

export async function getMeProfile() {
  return await api.get("/api/me/profile");
}

export async function updateMeProfile(payload: ProfileUpdatePayload) {
  return await api.put("/api/me/profile", payload);
}

export const updateMeProfileSettings = updateMeProfile;
