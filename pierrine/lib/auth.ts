import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "pierrine.accessToken";
const REFRESH_TOKEN_KEY = "pierrine.refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export async function saveTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

