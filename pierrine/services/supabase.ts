import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/env";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants — voir .env.example",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Stockage de session sécurisé via AsyncStorage (pas de localStorage en RN).
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl uniquement pertinent sur le web (OAuth redirect).
    detectSessionInUrl: Platform.OS === "web",
  },
});
