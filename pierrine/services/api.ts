import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/auth";
import { AppError } from "@/utils/apiError";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const apiBaseUrl = API_BASE_URL;

// Les jetons JWT et les données de santé ne doivent jamais transiter en clair hors développement.
// Seule exception : un build de démo explicitement marqué (profil EAS "preview", réseau local).
const allowInsecureApi = process.env.EXPO_PUBLIC_ALLOW_INSECURE_API === "true";
if (!__DEV__ && !allowInsecureApi && !apiBaseUrl.startsWith("https://")) {
  throw new Error(
    `[API] URL non sécurisée refusée en production : ${apiBaseUrl}. Configurez EXPO_PUBLIC_API_BASE_URL en https://`
  );
}

if (__DEV__) {
  console.log("[API] baseURL:", apiBaseUrl);
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized: (() => void) | undefined;
let refreshPromise: Promise<string> | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function doRefreshAccessToken() {
  const refresh = await getRefreshToken();
  if (!refresh) {
    throw new AppError("Session expirée.", 401);
  }

  const response = await publicApi.post<{ access: string; refresh?: string }>(
    "/api/auth/refresh",
    { refresh }
  );

  const nextAccess = response.data.access;
  const nextRefresh = response.data.refresh ?? refresh;
  await saveTokens({ accessToken: nextAccess, refreshToken: nextRefresh });
  return nextAccess;
}

/**
 * Un seul refresh à la fois : le backend fait tourner (et révoque) le refresh token
 * à chaque usage, deux refresh concurrents invalideraient la session.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetryConfig | undefined;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      await clearTokens();
      onUnauthorized?.();
      return Promise.reject(refreshError);
    }
  }
);
