import Constants from "expo-constants";
import { Platform } from "react-native";

export type ExpoExtra = {
  apiBaseUrl?: string;
  apiHost?: string;
  apiPort?: string;
};

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

/**
 * URL de base de l'API (injectée par app.config.js depuis l'IP locale).
 * Surcharge possible via EXPO_PUBLIC_API_BASE_URL dans .env
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  }

  if (Platform.OS === "web") {
    const port = process.env.EXPO_PUBLIC_API_PORT ?? "8000";
    return `http://localhost:${port}`;
  }

  const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

  if (extra.apiBaseUrl) {
    return normalizeBaseUrl(extra.apiBaseUrl);
  }

  const host = extra.apiHost ?? process.env.EXPO_PUBLIC_API_HOST ?? "localhost";
  const port = extra.apiPort ?? process.env.EXPO_PUBLIC_API_PORT ?? "8000";

  return `http://${host}:${port}`;
}

export const API_BASE_URL = getApiBaseUrl();
