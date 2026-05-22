"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { beansApi, grindersApi, methodsApi, brewsApi, getErrorMessage } from "@/lib/api";
import type { Bean, Grinder, BrewMethod, BrewLogCreate } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function NewBrewPage() {
  const router = useRouter();
  const [beans, setBeans] = useState<Bean[]>([]);
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [methods, setMethods] = useState<BrewMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<BrewLogCreate>({
    bean_id: 0,
    method_id: 0,
  });

  useEffect(() => {
    Promise.all([beansApi.list(), grindersApi.list(), methodsApi.list()]).then(
      ([b, g, m]) => {
        const available = b.filter((bean) => bean.is_available);
        setBeans(available);
        setGrinders(g);
        setMethods(m);

        // Pre-select first available options
        setForm((prev) => ({
          ...prev,
          bean_id: available[0]?.id ?? 0,
          method_id: m[0]?.id ?? 0,
        }));

        setLoading(false);
      }
    );
  }, []);

  function setField<K extends keyof BrewLogCreate>(k: K, v: BrewLogCreate[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
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

        {/* Required */}
        <div className="grid md:grid-cols-2 gap-4">
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

          <Field label="Brew Method *">
            <select
              value={form.method_id}
              onChange={(e) => setField("method_id", Number(e.target.value))}
              required
              className={inputClass}
            >
              <option value={0}>Select method…</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Optional measurements */}
        <div>
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-3">
            Measurements (optional)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Coffee (g)">
              <input
                type="number"
                min={0}
                step={0.1}
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
                type="number"
                min={0}
                step={0.1}
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
                type="number"
                min={0}
                max={100}
                step={0.5}
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
                type="number"
                min={0}
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

        {/* Grinder */}
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Grinder (optional)">
            <select
              value={form.grinder_id ?? ""}
              onChange={(e) =>
                setField("grinder_id", e.target.value ? Number(e.target.value) : undefined)
              }
              className={inputClass}
            >
              <option value="">No grinder</option>
              {grinders.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Grinder setting (optional)">
            <input
              type="text"
              value={form.grinder_setting ?? ""}
              onChange={(e) => setField("grinder_setting", e.target.value || undefined)}
              placeholder="e.g. 15, or 'medium-fine'"
              className={inputClass}
            />
          </Field>
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

        {/* Rating */}
        <Field label="Rating">
          <StarRating
            value={form.rating ?? null}
            onChange={(v) => setField("rating", v)}
          />
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
