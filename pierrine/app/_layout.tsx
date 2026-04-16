import { Stack } from "expo-router";
import { useEffect } from "react";
import { useFonts } from "expo-font";

import useAuthStore from '@/store/authStore';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add any custom fonts here if needed
  });
  
  const auth = useAuthStore();

  useEffect(() => {
    auth.initializeAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="connect" />
      <Stack.Screen name="connected" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

