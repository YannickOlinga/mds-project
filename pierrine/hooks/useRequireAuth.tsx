import { Redirect } from "expo-router";
import type { ReactNode } from "react";

import LoadingScreen from "@/components/ui/LoadingScreen";
import useAuthStore from "@/store/authStore";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuthStore();

  if (loading) {
    return <LoadingScreen label="Session en cours de vérification" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return children;
}
