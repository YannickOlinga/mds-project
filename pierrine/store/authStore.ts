import { router } from "expo-router";
import { create } from "zustand";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  normalizeAuthResponse,
  saveTokens,
} from "@/services/auth";
import { loginRequest, registerRequest } from "@/services/endpoints";
import type { AuthResponse, AuthUser } from "@/types/api";
import { getErrorMessage } from "@/utils/apiError";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

type AuthActions = {
  initializeAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  applyAuthResponse: (response: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  setError: (error: string | null) => void;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  initializeAuth: async () => {
    set({ loading: true, error: null });
    try {
      const [accessToken, refreshToken] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
      ]);

      set({
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken && refreshToken),
        loading: false,
      });
    } catch (error) {
      await clearTokens();
      set({
        ...initialState,
        loading: false,
        error: getErrorMessage(error),
      });
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      await get().applyAuthResponse(await loginRequest(username, password));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      await get().applyAuthResponse(await registerRequest(username, email, password));
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  applyAuthResponse: async (response) => {
    const session = normalizeAuthResponse(response);
    await saveTokens({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  },

  logout: async () => {
    await get().clearSession();
    router.replace("/login");
  },

  clearSession: async () => {
    await clearTokens();
    set({ ...initialState, loading: false });
  },

  setError: (error) => set({ error }),
}));

export default useAuthStore;
