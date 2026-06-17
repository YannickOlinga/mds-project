import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/auth";
import { AppError } from "@/utils/apiError";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const apiBaseUrl = API_BASE_URL;

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

export async function refreshAccessToken() {
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
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      refreshPromise = null;
      await clearTokens();
      onUnauthorized?.();
      return Promise.reject(refreshError);
    }
  }
);
