import "@/lib/polyfills";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

import ToastHost from "@/components/ui/ToastHost";
import { queryClient } from "@/services/queryClient";
import { setUnauthorizedHandler } from "@/services/api";
import useAuthStore from '@/store/authStore';

// Désactive le mode strict de Reanimated (warnings "Reading from `value`
// during component render" — faux positifs émis par les animations en boucle).
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  useFonts({});
  
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().clearSession();
    });
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="connect" />
          <Stack.Screen name="connected" />
          <Stack.Screen name="device-settings" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="questionnaire" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="game" />
          <Stack.Screen name="game-hub" />
          <Stack.Screen name="game-bulles" />
          <Stack.Screen name="game-eclipse" />
          <Stack.Screen name="game-source" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
