import * as Network from "expo-network";

import { getApiBaseUrl } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/auth";
import { AppError } from "@/utils/apiError";

const apiBaseUrl = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 12_000;

if (__DEV__) {
  console.log("[API] baseURL:", apiBaseUrl);
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  auth?: boolean;
  retryOn401?: boolean;
};

function buildUrl(path: string, params?: Record<string, string | number | boolean>) {
  const base = apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${normalizedPath}`;

  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      search.set(key, String(value));
    }
    url += `?${search.toString()}`;
  }

  return url;
}

function extractDetail(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { detail?: unknown; message?: unknown };
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  return null;
}

async function ensureInternetReachable() {
  const state = await Network.getNetworkStateAsync();
  if (state.isConnected === false) {
    throw new AppError("Pas de connexion internet sur l’appareil.");
  }
  if (state.isInternetReachable === false) {
    throw new AppError(
      "Internet inaccessible (Wi‑Fi sans accès externe ?). Essayez en 4G ou ouvrez l’URL dans Safari."
    );
  }
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  await ensureInternetReachable();

  const url = buildUrl(path, options.params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();

  if (__DEV__) {
    console.log(`[API Request] ${method} ${url}`, options.body ?? "");
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (options.auth) {
      const token = await getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const data = await parseResponseBody(response);
    const elapsed = Date.now() - started;

    if (__DEV__) {
      console.log(`[API Response] ${response.status} ${url} (${elapsed}ms)`);
    }

    if (
      response.status === 401 &&
      options.auth &&
      options.retryOn401 !== false
    ) {
      await refreshAccessToken();
      return await request<T>(method, path, {
        ...options,
        retryOn401: false,
      });
    }

    if (!response.ok) {
      throw new AppError(
        extractDetail(data) ?? `Erreur serveur (${response.status})`,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    const elapsed = Date.now() - started;

    if (__DEV__) {
      console.log(`[API Error] ${url} (${elapsed}ms)`, error);
    }

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError(
        `Délai dépassé (${REQUEST_TIMEOUT_MS / 1000}s). Le serveur ne répond pas — testez https://perinea.osc-fr1.scalingo.io dans Safari.`
      );
    }

    if (error instanceof TypeError) {
      throw new AppError(
        `Impossible de joindre le serveur. Vérifiez internet sur l’iPhone (Safari ou 4G, pas seulement le partage de connexion).`
      );
    }

    throw new AppError("Connexion au serveur impossible.");
  } finally {
    clearTimeout(timeoutId);
  }
}

let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function refreshAccessToken() {
  const refresh = await getRefreshToken();
  if (!refresh) {
    throw new AppError("Session expirée.", 401);
  }

  try {
    const response = await publicApi.post<{ access: string; refresh?: string }>(
      "/api/auth/refresh",
      { refresh }
    );
    const nextAccess = response.access;
    const nextRefresh = response.refresh ?? refresh;
    await saveTokens({ accessToken: nextAccess, refreshToken: nextRefresh });
    return nextAccess;
  } catch (error) {
    await clearTokens();
    onUnauthorized?.();
    throw error;
  }
}

function createClient(auth: boolean) {
  return {
    get: <T = unknown>(url: string, params?: Record<string, string | number | boolean>) =>
      request<T>("GET", url, { params, auth }),
    post: <T = unknown>(url: string, data?: unknown) =>
      request<T>("POST", url, { body: data, auth }),
    put: <T = unknown>(url: string, data?: unknown) =>
      request<T>("PUT", url, { body: data, auth }),
    delete: <T = unknown>(url: string) => request<T>("DELETE", url, { auth }),
  };
}

export const api = createClient(true);
export const publicApi = createClient(false);
