import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthResponse, AuthTokens, AuthUser } from "@/types/api";

const ACCESS_TOKEN_KEY = "pierrine.accessToken";
const REFRESH_TOKEN_KEY = "pierrine.refreshToken";

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
};

// Web : sessionStorage plutôt que localStorage -> les jetons disparaissent à la fermeture de
// l'onglet et ne sont pas partagés entre onglets (réduit l'exposition en cas de XSS).
// Natif : SecureStore (Keychain iOS / Keystore Android).
const webStorage = () => globalThis.sessionStorage;

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === "web") {
    webStorage().setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string) {
  if (Platform.OS === "web") {
    return webStorage().getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteStorageItem(key: string) {
  if (Platform.OS === "web") {
    webStorage().removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(tokens: AuthTokens) {
  await setStorageItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  await setStorageItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getAccessToken() {
  return getStorageItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return getStorageItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await Promise.all([
    deleteStorageItem(ACCESS_TOKEN_KEY),
    deleteStorageItem(REFRESH_TOKEN_KEY),
  ]);
}

export function normalizeAuthResponse(data: AuthResponse): StoredAuth {
  const user: AuthUser | null = data.user ?? {
    id: data.profile_id,
    username: data.profile?.name ?? "",
    email: data.profile?.email ?? "",
  };

  return {
    accessToken: data.access,
    refreshToken: data.refresh,
    user,
  };
}
