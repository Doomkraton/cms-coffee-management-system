"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
      return;
    }
    authApi.status().then((status) => {
      setRegistrationOpen(status.registration_open);
    });
  }, [router, isAuthenticated]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--background)]">
      <div className="text-center max-w-md w-full">
        <div className="text-7xl mb-6">☕</div>
        <h1 className="text-4xl font-bold mb-2 text-stone-800 dark:text-stone-100">
          Coffee Management System
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-10 text-lg">
          Self-hosted coffee tracking for your household
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3 px-6 bg-amber-800 hover:bg-amber-700 text-white rounded-xl font-semibold text-center transition-colors"
          >
            Log In
          </Link>

          {registrationOpen === null ? (
            <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
          ) : registrationOpen ? (
            <Link
              href="/register"
              className="w-full py-3 px-6 border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl font-semibold text-center transition-colors"
            >
              Claim This Instance
            </Link>
          ) : (
            <Link
              href="/join"
              className="w-full py-3 px-6 border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl font-semibold text-center transition-colors"
            >
              Join with Invite Code
            </Link>
          )}
        </div>

        {registrationOpen === false && (
          <p className="mt-5 text-sm text-stone-400">
            Instance claimed · Ask your admin for an invite code
          </p>
        )}
      </div>
    </main>
  );
}
