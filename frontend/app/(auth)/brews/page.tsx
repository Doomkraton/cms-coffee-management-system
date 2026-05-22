"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brewsApi, getErrorMessage } from "@/lib/api";
import type { BrewLog } from "@/lib/types";
import StarRating from "@/components/StarRating";
import { useAuthStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settingsStore";
import { formatCost, calcBrewCost } from "@/lib/currencies";

export default function BrewsPage() {
  const { user } = useAuthStore();
  const { showCosts, currency } = useSettingsStore();
  const [brews, setBrews] = useState<BrewLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Initial load — fetched directly in the effect, setState called in .then()
  useEffect(() => {
    brewsApi.list(0, LIMIT).then((data) => {
      setBrews(data);
      setHasMore(data.length === LIMIT);
      setLoading(false);
    });
  }, []);

  async function loadBrews(skip = 0) {
    const data = await brewsApi.list(skip, LIMIT);
    setBrews((prev) => [...prev, ...data]);
    setHasMore(data.length === LIMIT);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this brew log?")) return;
    try {
      await brewsApi.delete(id);
      setBrews((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadBrews(next * LIMIT);
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Brew Logs</h1>
        <Link
          href="/brews/new"
          className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
        >
          + Log Brew
        </Link>
      </div>

      {brews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
          <p className="text-4xl mb-3">☕</p>
          <p className="text-stone-400">No brews yet.</p>
          <Link href="/brews/new" className="text-amber-700 text-sm hover:underline mt-1 block">
            Log your first brew
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {brews.map((brew) => (
              <div
                key={brew.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                        {brew.bean.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-full">
                        {brew.method.name}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {brew.user.name} · {formatDate(brew.brew_date)}
                    </p>
                  </div>
                  {brew.rating && <StarRating value={brew.rating} readonly />}
                </div>

                {/* Brew params */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
                  {brew.coffee_amount && <Param label="Coffee" value={`${brew.coffee_amount}g`} />}
                  {brew.water_amount && <Param label="Water" value={`${brew.water_amount}g`} />}
                  {brew.water_temperature && <Param label="Temp" value={`${brew.water_temperature}°C`} />}
                  {brew.brew_time && <Param label="Time" value={formatTime(brew.brew_time)} />}
                  {brew.grinder && <Param label="Grinder" value={brew.grinder.name} />}
                  {showCosts && (() => {
                    const cost = calcBrewCost(
                      brew.coffee_amount,
                      brew.bean.purchase_cost,
                      brew.bean.quantity_purchased_grams,
                    );
                    return cost != null
                      ? <Param label="Cost" value={formatCost(cost, currency)} />
                      : null;
                  })()}
                  {brew.grinder_setting && <Param label="Setting" value={brew.grinder_setting} />}
                </div>

                {brew.notes && (
                  <p className="text-sm text-stone-500 mt-2 italic">&ldquo;{brew.notes}&rdquo;</p>
                )}

                {(brew.user_id === user?.id || user?.is_admin) && (
                  <button
                    onClick={() => handleDelete(brew.id)}
                    className="mt-3 text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-stone-400">{label}: </span>
      {value}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
