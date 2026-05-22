"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps protected pages. Redirects to /login if no token is present.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router, isAuthenticated]);

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
