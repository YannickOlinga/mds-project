function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}


export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  }

  // Par défaut, utiliser l'API Scalingo (en dev et en prod)
  return "https://perinea.osc-fr1.scalingo.io";
}

export const API_BASE_URL = getApiBaseUrl();


export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
