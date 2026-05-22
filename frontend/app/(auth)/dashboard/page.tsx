"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brewsApi, beansApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { BrewStats, BrewLog, Bean } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<BrewStats | null>(null);
  const [recentBrews, setRecentBrews] = useState<BrewLog[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      brewsApi.stats(),
      brewsApi.list(0, 5),
      beansApi.list(),
    ]).then(([s, brews, b]) => {
      setStats(s);
      setRecentBrews(brews);
      setBeans(b.filter((bean) => bean.is_available));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-stone-400 animate-pulse">Loading…</div>;
  }

  const availableBeans = beans.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Good {getTimeOfDay()}, {user?.name} ☕
        </h1>
        <p className="text-stone-500 text-sm mt-0.5">Here&apos;s what&apos;s brewing</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Brews" value={stats?.total_brews ?? 0} />
        <StatCard
          label="Avg Rating"
          value={stats?.avg_rating ? `${stats.avg_rating}/5` : "—"}
        />
        <StatCard
          label="Coffee Used"
          value={stats?.total_coffee_grams ? `${stats.total_coffee_grams}g` : "—"}
        />
        <StatCard label="Available Beans" value={availableBeans} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/brews/new" emoji="☕" label="Log Brew" primary />
        <QuickAction href="/beans" emoji="🫘" label="Beans" />
        <QuickAction href="/grinders" emoji="⚙️" label="Grinders" />
        <QuickAction href="/analytics" emoji="📊" label="Analytics" />
      </div>

      {/* Top stats */}
      {(stats?.top_bean || stats?.top_method) && (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.top_bean && (
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
              <p className="text-xs uppercase text-stone-400 tracking-wide mb-1">Favourite Bean</p>
              <p className="font-semibold text-stone-800 dark:text-stone-100">{stats.top_bean}</p>
            </div>
          )}
          {stats.top_method && (
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
              <p className="text-xs uppercase text-stone-400 tracking-wide mb-1">Favourite Method</p>
              <p className="font-semibold text-stone-800 dark:text-stone-100">{stats.top_method}</p>
            </div>
          )}
        </div>
      )}

      {/* Recent brews */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Recent Brews</h2>
          <Link href="/brews" className="text-sm text-amber-700 hover:underline">
            View all
          </Link>
        </div>

        {recentBrews.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
            <p className="text-stone-400">No brews yet.</p>
            <Link href="/brews/new" className="text-amber-700 text-sm hover:underline mt-1 block">
              Log your first brew
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBrews.map((brew) => (
              <Link
                key={brew.id}
                href={`/brews/${brew.id}`}
                className="flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-100 text-sm">
                    {brew.bean.name}
                  </p>
                  <p className="text-xs text-stone-400">
                    {brew.method.name} · {brew.user.name} · {formatDate(brew.brew_date)}
                  </p>
                </div>
                {brew.rating && (
                  <StarRating value={brew.rating} readonly />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4">
      <p className="text-xs uppercase text-stone-400 tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">{value}</p>
    </div>
  );
}

function QuickAction({
  href, emoji, label, primary = false,
}: {
  href: string; emoji: string; label: string; primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 py-4 rounded-xl border font-medium text-sm transition-colors ${
        primary
          ? "bg-amber-800 hover:bg-amber-700 border-amber-800 text-white"
          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-300 dark:hover:border-amber-700"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      {label}
    </Link>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
