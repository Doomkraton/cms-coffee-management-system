"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { brewsApi, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settingsStore";
import { formatCost, calcBrewCost } from "@/lib/currencies";
import type { BrewLog } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function BrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { showCosts, currency } = useSettingsStore();
  const [brew, setBrew] = useState<BrewLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    brewsApi
      .get(Number(id))
      .then((b) => {
        setBrew(b);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    if (!brew) return;
    if (!confirm("Delete this brew log?")) return;
    try {
      await brewsApi.delete(brew.id);
      router.push("/brews");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;
  if (notFound || !brew) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400">Brew log not found.</p>
        <Link href="/brews" className="text-amber-700 hover:underline text-sm mt-2 block">
          ← Back to brews
        </Link>
      </div>
    );
  }

  const canDelete = brew.user_id === user?.id || user?.is_admin;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/brews" className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-sm">
          ← Brews
        </Link>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          {brew.bean.name}
        </h1>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-5">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">
              {brew.method.name}
              {brew.method.category && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
                  {brew.method.category}
                </span>
              )}
            </p>
            <p className="text-sm text-stone-400 mt-0.5">
              Brewed by <span className="text-stone-600 dark:text-stone-300 font-medium">{brew.user.name}</span>
              {" · "}
              {formatDateTime(brew.brew_date)}
            </p>
          </div>
          {brew.rating && (
            <StarRating value={brew.rating} readonly />
          )}
        </div>

        {/* Measurements grid */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
            Measurements
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Coffee" value={brew.coffee_amount ? `${brew.coffee_amount}g` : null} />
            <Stat label="Water" value={brew.water_amount ? `${brew.water_amount}g` : null} />
            <Stat label="Temperature" value={brew.water_temperature ? `${brew.water_temperature}°C` : null} />
            <Stat label="Brew Time" value={brew.brew_time ? formatTime(brew.brew_time) : null} />
            {showCosts && (
              <Stat
                label="Cost"
                value={(() => {
                  const cost = calcBrewCost(
                    brew.coffee_amount,
                    brew.bean.purchase_cost,
                    brew.bean.quantity_purchased_grams,
                  );
                  return cost != null ? formatCost(cost, currency) : null;
                })()}
              />
            )}
          </div>
        </div>

        {/* Ratio */}
        {brew.coffee_amount && brew.water_amount && (
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="text-amber-800 dark:text-amber-400 text-sm font-medium">Ratio:</span>
            <span className="text-stone-700 dark:text-stone-300 font-mono text-sm">
              1 : {(brew.water_amount / brew.coffee_amount).toFixed(1)}
            </span>
            <span className="text-stone-400 text-xs ml-1">
              ({brew.coffee_amount}g coffee / {brew.water_amount}g water)
            </span>
          </div>
        )}

        {/* Grinder */}
        {(brew.grinder || brew.grinder_setting || brew.grind_size) && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              Grinder
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {brew.grinder && <Stat label="Grinder" value={brew.grinder.name} />}
              {brew.grinder_setting && <Stat label="Setting" value={brew.grinder_setting} />}
              {brew.grind_size && <Stat label="Grind Size" value={brew.grind_size} />}
            </div>
          </div>
        )}

        {/* Bean info */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
            Bean
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Link
                href={`/beans/${brew.bean.id}`}
                className="font-medium text-stone-800 dark:text-stone-100 hover:text-amber-700 transition-colors"
              >
                {brew.bean.name}
              </Link>
              {(brew.bean.roaster || brew.bean.origin) && (
                <p className="text-sm text-stone-400">
                  {[brew.bean.roaster, brew.bean.origin].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            {brew.bean.rating && (
              <StarRating value={brew.bean.rating} readonly />
            )}
          </div>
        </div>

        {/* Notes */}
        {brew.notes && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-stone-700 dark:text-stone-300 italic">&ldquo;{brew.notes}&rdquo;</p>
          </div>
        )}

        {/* Delete */}
        {canDelete && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Delete this brew log
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-stone-50 dark:bg-stone-800 rounded-lg px-3 py-2">
      <p className="text-xs text-stone-400">{label}</p>
      <p className={`font-medium text-sm mt-0.5 ${value ? "text-stone-800 dark:text-stone-100" : "text-stone-300 dark:text-stone-600"}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
