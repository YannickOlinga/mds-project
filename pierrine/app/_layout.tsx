import { Stack } from "expo-router";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import ToastHost from "@/components/ui/ToastHost";
import { queryClient } from "@/services/queryClient";
import { setUnauthorizedHandler } from "@/services/api";
import useAuthStore from '@/store/authStore';

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
          <Stack.Screen name="questionnaire" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
