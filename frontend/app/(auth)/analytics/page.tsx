"use client";

import { useEffect, useState } from "react";
import { brewsApi, beansApi } from "@/lib/api";
import { useSettingsStore } from "@/lib/settingsStore";
import { formatCost } from "@/lib/currencies";
import type { BrewStats, Bean } from "@/lib/types";

export default function AnalyticsPage() {
  const { showCosts, currency } = useSettingsStore();
  const [stats, setStats] = useState<BrewStats | null>(null);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([brewsApi.stats(), beansApi.list()]).then(([s, b]) => {
      setStats(s);
      setBeans(b);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  const availableBeans = beans.filter((b) => b.is_available);
  const totalInventoryGrams = availableBeans.reduce((sum, b) => sum + b.quantity_grams, 0);
  const ratedBeans = beans.filter((b) => b.rating !== null);
  const avgBeanRating =
    ratedBeans.length > 0
      ? ratedBeans.reduce((sum, b) => sum + (b.rating ?? 0), 0) / ratedBeans.length
      : null;

  // Cost per gram for each available bean (for the inventory table)
  function beanCostPerGram(bean: Bean): number | null {
    if (!bean.purchase_cost || !bean.quantity_purchased_grams || bean.quantity_purchased_grams <= 0) {
      return null;
    }
    return bean.purchase_cost / bean.quantity_purchased_grams;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Analytics</h1>

      {/* Brew stats */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Brew Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Brews" value={stats?.total_brews ?? 0} />
          <StatCard
            label="Average Rating"
            value={stats?.avg_rating ? `${stats.avg_rating} / 5` : "—"}
          />
          <StatCard
            label="Coffee Brewed"
            value={stats?.total_coffee_grams ? `${stats.total_coffee_grams}g` : "—"}
          />
          <StatCard
            label="Coffee Brewed (kg)"
            value={
              stats?.total_coffee_grams
                ? `${(stats.total_coffee_grams / 1000).toFixed(2)}kg`
                : "—"
            }
          />
        </div>
      </section>

      {/* Cost stats — shown only when enabled */}
      {showCosts && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Cost Tracking</h2>
          {stats?.total_spent != null ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Total Spent"
                value={formatCost(stats.total_spent, currency)}
              />
              <StatCard
                label="Avg Cost / Brew"
                value={stats.avg_cost_per_brew != null
                  ? formatCost(stats.avg_cost_per_brew, currency)
                  : "—"}
              />
              <StatCard
                label="Brews with Cost Data"
                value={`${stats.costed_brews} / ${stats.total_brews}`}
              />
            </div>
          ) : (
            <p className="text-sm text-stone-400 bg-stone-50 dark:bg-stone-800/50 rounded-xl px-4 py-3">
              No cost data yet. Add <span className="font-medium">purchase price</span> to your beans to track spending.
            </p>
          )}
        </section>
      )}

      {/* Favourites */}
      {(stats?.top_bean || stats?.top_method) && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Favourites</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {stats?.top_bean && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Most Brewed Bean</p>
                <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{stats.top_bean}</p>
              </div>
            )}
            {stats?.top_method && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Most Used Method</p>
                <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{stats.top_method}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Inventory */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Bean Inventory</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label="Available Beans" value={availableBeans.length} />
          <StatCard label="Total Inventory" value={`${totalInventoryGrams}g`} />
          <StatCard label="Total Beans" value={beans.length} />
          <StatCard
            label="Avg Bean Rating"
            value={avgBeanRating ? `${avgBeanRating.toFixed(1)} / 5` : "—"}
          />
        </div>

        {availableBeans.length > 0 && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800">
                <tr>
                  <th className="text-left px-4 py-2 text-stone-500 font-medium">Bean</th>
                  <th className="text-left px-4 py-2 text-stone-500 font-medium hidden md:table-cell">Roaster</th>
                  <th className="text-right px-4 py-2 text-stone-500 font-medium">Remaining</th>
                  {showCosts && (
                    <>
                      <th className="text-right px-4 py-2 text-stone-500 font-medium hidden md:table-cell">
                        Paid
                      </th>
                      <th className="text-right px-4 py-2 text-stone-500 font-medium hidden md:table-cell">
                        /gram
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {availableBeans.map((bean) => {
                  const cpg = beanCostPerGram(bean);
                  return (
                    <tr key={bean.id} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="px-4 py-2 text-stone-800 dark:text-stone-200 font-medium">{bean.name}</td>
                      <td className="px-4 py-2 text-stone-500 hidden md:table-cell">{bean.roaster ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-medium ${bean.quantity_grams < 50 ? "text-red-600" : "text-stone-800 dark:text-stone-200"}`}>
                          {bean.quantity_grams}g
                        </span>
                      </td>
                      {showCosts && (
                        <>
                          <td className="px-4 py-2 text-right text-stone-500 hidden md:table-cell">
                            {bean.purchase_cost ? formatCost(bean.purchase_cost, currency) : "—"}
                          </td>
                          <td className="px-4 py-2 text-right text-stone-400 hidden md:table-cell text-xs">
                            {cpg ? formatCost(cpg, currency) : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
