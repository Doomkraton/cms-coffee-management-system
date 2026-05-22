"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/brews",      label: "Brews" },
  { href: "/beans",      label: "Beans" },
  { href: "/grinders",   label: "Grinders" },
  { href: "/methods",    label: "Methods" },
  { href: "/analytics",  label: "Analytics" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/dashboard" className="font-bold text-amber-800 dark:text-amber-500 text-lg flex items-center gap-2">
          ☕ <span className="hidden sm:inline">CMS</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* User + Settings + Logout */}
        <div className="flex items-center gap-2">
          {user?.is_admin && (
            <Link
              href="/settings"
              className={`p-2 rounded-lg text-sm transition-colors ${
                pathname === "/settings"
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400"
                  : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
              title="Settings"
            >
              ⚙️
            </Link>
          )}
          <span className="hidden sm:block text-sm text-stone-500 dark:text-stone-400">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
