import { API_BASE_URL } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/auth";
import { AppError } from "@/utils/apiError";

const apiBaseUrl = API_BASE_URL;

if (__DEV__) {
  console.log("[API] baseURL:", apiBaseUrl);
}

async function fetchWithAuth(url: string, options: RequestInit = {}, requireAuth = true) {
  const token = requireAuth ? await getAccessToken() : null;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (__DEV__) {
    console.log("[API Request]", options.method || "GET", url, options.body);
  }

  try {
    const response = await fetch(`${apiBaseUrl}${url}`, {
      ...options,
      headers,
    });

    if (__DEV__) {
      console.log("[API Response]", response.status, url);
    }

    if (!response) {
      throw new AppError("Pas de réponse du serveur");
    }

    if (!response.ok) {
      if (response.status === 401 && requireAuth) {
        // Try to refresh token
        try {
          const newToken = await refreshAccessToken();
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string> || {}),
            "Authorization": `Bearer ${newToken}`,
          };
          const retryResponse = await fetch(`${apiBaseUrl}${url}`, {
            ...options,
            headers: retryHeaders,
          });
          if (!retryResponse.ok) {
            throw new AppError(`Erreur serveur (${retryResponse.status})`, retryResponse.status);
          }
          return retryResponse.json();
        } catch {
          await clearTokens();
          onUnauthorized?.();
          throw new AppError("Session expirée.", 401);
        }
      }
      throw new AppError(`Erreur serveur (${response.status})`, response.status);
    }

    return response.json();
  } catch (error) {
    if (__DEV__) {
      console.log("[API Error]", error);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Connexion au serveur impossible. Vérifiez votre réseau.");
  }
}

export const api = {
  get: (url: string, params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchWithAuth(`${url}${queryString}`, { method: "GET" });
  },
  post: (url: string, data?: any) => fetchWithAuth(url, { method: "POST", body: JSON.stringify(data) }),
  put: (url: string, data?: any) => fetchWithAuth(url, { method: "PUT", body: JSON.stringify(data) }),
  delete: (url: string) => fetchWithAuth(url, { method: "DELETE" }),
};

export const publicApi = {
  get: (url: string, params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchWithAuth(`${url}${queryString}`, { method: "GET" }, false);
  },
  post: (url: string, data?: any) => fetchWithAuth(url, { method: "POST", body: JSON.stringify(data) }, false),
  put: (url: string, data?: any) => fetchWithAuth(url, { method: "PUT", body: JSON.stringify(data) }, false),
  delete: (url: string) => fetchWithAuth(url, { method: "DELETE" }, false),
};

let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function refreshAccessToken() {
  const refresh = await getRefreshToken();
  if (!refresh) {
    throw new AppError("Session expirée.", 401);
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw new AppError("Session expirée.", 401);
  }

  const data = await response.json();
  const nextAccess = data.access;
  const nextRefresh = data.refresh ?? refresh;
  await saveTokens({ accessToken: nextAccess, refreshToken: nextRefresh });
  return nextAccess;
}
