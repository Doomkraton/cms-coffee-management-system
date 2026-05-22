"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { beansApi, grindersApi, methodsApi, brewsApi, getErrorMessage } from "@/lib/api";
import type { Bean, Grinder, BrewMethod, BrewLogCreate, GrinderProfile } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function NewBrewPage() {
  const router = useRouter();
  const [beans, setBeans] = useState<Bean[]>([]);
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [methods, setMethods] = useState<BrewMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Grinder setting suggestion
  const [suggestedProfile, setSuggestedProfile] = useState<GrinderProfile | null>(null);

  const [form, setForm] = useState<BrewLogCreate>({ bean_id: 0, method_id: 0 });

  useEffect(() => {
    Promise.all([beansApi.list(), grindersApi.list(), methodsApi.list()]).then(
      ([b, g, m]) => {
        const available = b.filter((bean) => bean.is_available);
        setBeans(available);
        setGrinders(g);
        setMethods(m);
        setForm((prev) => ({
          ...prev,
          bean_id: available[0]?.id ?? 0,
          method_id: m[0]?.id ?? 0,
        }));
        setLoading(false);
      }
    );
  }, []);

  // Auto-fetch a profile suggestion whenever grinder + bean + method change
  const fetchSuggestion = useCallback(async (
    grinderId: number | undefined,
    beanId: number,
    methodId: number,
  ) => {
    if (!grinderId || !beanId || !methodId) {
      setSuggestedProfile(null);
      return;
    }
    try {
      const suggestion = await grindersApi.suggestProfile(grinderId, beanId, methodId);
      setSuggestedProfile(suggestion);
    } catch {
      setSuggestedProfile(null);
    }
  }, []);

  function setField<K extends keyof BrewLogCreate>(k: K, v: BrewLogCreate[K]) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "grinder_id" || k === "bean_id" || k === "method_id") {
        void fetchSuggestion(
          k === "grinder_id" ? (v as number | undefined) : next.grinder_id,
          k === "bean_id" ? (v as number) : next.bean_id,
          k === "method_id" ? (v as number) : next.method_id,
        );
      }
      return next;
    });
  }

  function applySuggestion() {
    if (suggestedProfile) {
      setForm((prev) => ({ ...prev, grinder_setting: suggestedProfile.setting }));
    }
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!form.bean_id || !form.method_id) {
      setError("Please select a bean and a brew method");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const newLog = await brewsApi.create({
        ...form,
        grinder_id: form.grinder_id || undefined,
      });
      router.push(`/brews/${newLog.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  // Live stock preview for selected bean
  const selectedBean = beans.find((b) => b.id === form.bean_id);
  const coffeeAmount = form.coffee_amount ?? 0;
  const stockAfter = selectedBean
    ? Math.max(0, selectedBean.quantity_grams - coffeeAmount)
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/brews" className="text-stone-400 hover:text-stone-600 text-sm">
          ← Brews
        </Link>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Log a Brew</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-5"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Bean + Method */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Field label="Bean *">
              <select
                value={form.bean_id}
                onChange={(e) => setField("bean_id", Number(e.target.value))}
                required
                className={inputClass}
              >
                <option value={0}>Select bean…</option>
                {beans.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.roaster ? ` (${b.roaster})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            {/* Live stock indicator */}
            {selectedBean && (
              <p className={`text-xs mt-1 ${stockAfter !== null && stockAfter < 20 ? "text-red-500" : "text-stone-400"}`}>
                Stock: {selectedBean.quantity_grams}g
                {coffeeAmount > 0 && ` → ${stockAfter}g after brew`}
              </p>
            )}
          </div>

          <Field label="Brew Method *">
            <select
              value={form.method_id}
              onChange={(e) => setField("method_id", Number(e.target.value))}
              required
              className={inputClass}
            >
              <option value={0}>Select method…</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Measurements */}
        <div>
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-3">
            Measurements (optional)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Coffee (g)">
              <input
                type="number" min={0} step={0.1}
                value={form.coffee_amount ?? ""}
                onChange={(e) =>
                  setField("coffee_amount", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="18"
                className={inputClass}
              />
            </Field>
            <Field label="Water (g)">
              <input
                type="number" min={0} step={0.1}
                value={form.water_amount ?? ""}
                onChange={(e) =>
                  setField("water_amount", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="300"
                className={inputClass}
              />
            </Field>
            <Field label="Temp (°C)">
              <input
                type="number" min={0} max={100} step={0.5}
                value={form.water_temperature ?? ""}
                onChange={(e) =>
                  setField("water_temperature", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="93"
                className={inputClass}
              />
            </Field>
            <Field label="Time (sec)">
              <input
                type="number" min={0}
                value={form.brew_time ?? ""}
                onChange={(e) =>
                  setField("brew_time", e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="240"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {/* Grinder + auto-suggest */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
            Grinder (optional)
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Grinder">
              <select
                value={form.grinder_id ?? ""}
                onChange={(e) =>
                  setField("grinder_id", e.target.value ? Number(e.target.value) : undefined)
                }
                className={inputClass}
              >
                <option value="">No grinder</option>
                {grinders.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>

            <div>
              <Field label="Grinder Setting">
                <input
                  type="text"
                  value={form.grinder_setting ?? ""}
                  onChange={(e) => setField("grinder_setting", e.target.value || undefined)}
                  placeholder="e.g. 24 clicks, 15"
                  className={inputClass}
                />
              </Field>

              {/* Suggestion banner */}
              {suggestedProfile && (
                <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                    💡 Suggested:{" "}
                    <span className="font-mono font-semibold">{suggestedProfile.setting}</span>
                    {suggestedProfile.bean_id && suggestedProfile.method_id
                      ? " (exact match)"
                      : suggestedProfile.bean_id
                      ? " (bean match)"
                      : suggestedProfile.method_id
                      ? " (method match)"
                      : " (general)"}
                  </span>
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          <Field label="Grind size description (optional)">
            <input
              type="text"
              value={form.grind_size ?? ""}
              onChange={(e) => setField("grind_size", e.target.value || undefined)}
              placeholder="e.g. medium-coarse"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Rating + Notes */}
        <Field label="Rating">
          <StarRating value={form.rating ?? null} onChange={(v) => setField("rating", v)} />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setField("notes", e.target.value || undefined)}
            rows={2}
            placeholder="How did it taste?"
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
        >
          {saving ? "Saving…" : "☕ Log Brew"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
