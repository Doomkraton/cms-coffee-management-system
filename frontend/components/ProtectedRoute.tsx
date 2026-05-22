"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settingsStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps all protected pages.
 * - Redirects to /login if unauthenticated.
 * - Fetches instance settings once per session (currency, show_costs).
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { fetch: fetchSettings, loaded } = useSettingsStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (!loaded) {
      void fetchSettings();
    }
  }, [router, isAuthenticated, fetchSettings, loaded]);

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
