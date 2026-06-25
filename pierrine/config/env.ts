import Constants from "expo-constants";

/** API Django déployée sur Scalingo (base de données en ligne). */
export const SCALINGO_API_URL = "https://perinea.osc-fr1.scalingo.io";

export type ExpoExtra = {
  apiBaseUrl?: string;
  apiHost?: string;
  apiPort?: string;
};

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

/**
 * URL de base de l'API.
 * Priorité : EXPO_PUBLIC_API_BASE_URL > extra Expo (app.config.js) > Scalingo.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  if (extra.apiBaseUrl?.trim()) {
    return normalizeBaseUrl(extra.apiBaseUrl);
  }

  return SCALINGO_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
