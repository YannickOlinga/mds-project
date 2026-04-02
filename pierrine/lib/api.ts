import Constants from "expo-constants";
import { getAccessToken } from "@/lib/auth";

const apiBaseUrl =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Constants.expoConfig as any)?.extra?.apiBaseUrl ?? "http://localhost:8000";

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}

export type ApiIdParam = { profile_id?: number };

function withProfileId(path: string) {
  // Les endpoints backend utilisent le profil lié à l'utilisateur authentifié.
  // On laisse cette fonction pour compat côté frontend, mais on n'ajoute plus `profile_id`.
  return path;
}

export async function getDashboard(profileId = 1) {
  return apiFetch(
    withProfileId("/api/home/dashboard"),
    {
      method: "GET",
    }
  );
}

export async function getDeviceStatus(profileId = 1) {
  return apiFetch(withProfileId("/api/device/status"));
}

export async function connectDevice(profileId = 1) {
  return apiFetch(withProfileId("/api/device/connect"), {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getTrainingProgram(levelKey: string, profileId = 1) {
  const path = withProfileId(
    `/api/training/program?level_key=${encodeURIComponent(levelKey)}`
  );
  return apiFetch(path);
}

export async function completeTraining(
  levelKey: string,
  exercisesCount: number,
  profileId = 1
) {
  return apiFetch(withProfileId("/api/training/complete"), {
    method: "POST",
    body: JSON.stringify({ level_key: levelKey, exercises_count: exercisesCount }),
  });
}

export async function getProgress(profileId = 1) {
  return apiFetch(withProfileId("/api/stats/progress"));
}

export async function getMeProfile(profileId = 1) {
  return apiFetch(withProfileId("/api/me/profile"));
}

export async function updateMeProfileSettings(
  payload: { reminders?: boolean; notifications?: boolean; darkMode?: boolean },
  profileId = 1
) {
  return apiFetch(withProfileId("/api/me/profile"), {
    method: "PUT",
    body: JSON.stringify({
      reminders: payload.reminders,
      notifications: payload.notifications,
      darkMode: payload.darkMode,
    }),
  });
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(username: string, password: string) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

