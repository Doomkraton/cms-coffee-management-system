"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { beansApi, getErrorMessage } from "@/lib/api";
import type { Bean, BeanUpdate } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function BeanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bean, setBean] = useState<Bean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<BeanUpdate>({});

  useEffect(() => {
    beansApi.get(Number(id)).then((b) => {
      setBean(b);
      setForm({
        name: b.name,
        roaster: b.roaster ?? "",
        origin: b.origin ?? "",
        quantity_grams: b.quantity_grams,
        quantity_purchased_grams: b.quantity_purchased_grams ?? undefined,
        purchase_cost: b.purchase_cost ?? undefined,
        roast_date: b.roast_date ?? undefined,
        purchase_date: b.purchase_date ?? undefined,
        rating: b.rating ?? undefined,
        notes: b.notes ?? "",
        is_available: b.is_available,
      });
      setLoading(false);
    });
  }, [id]);

  function setField<K extends keyof BeanUpdate>(k: K, v: BeanUpdate[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSave(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await beansApi.update(Number(id), {
        ...form,
        roaster: form.roaster || undefined,
        origin: form.origin || undefined,
        notes: (form.notes as string) || undefined,
      });
      setBean(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${bean?.name}"?`)) return;
    await beansApi.delete(Number(id));
    router.push("/beans");
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;
  if (!bean) return <div className="text-red-500">Bean not found</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/beans" className="text-stone-400 hover:text-stone-600 text-sm">
          ← Beans
        </Link>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{bean.name}</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">Saved ✓</p>}

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name *">
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Roaster">
            <input
              type="text"
              value={form.roaster ?? ""}
              onChange={(e) => setField("roaster", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Origin">
            <input
              type="text"
              value={form.origin ?? ""}
              onChange={(e) => setField("origin", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Quantity (g)">
            <input
              type="number"
              min={0}
              value={form.quantity_grams ?? 0}
              onChange={(e) => setField("quantity_grams", parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </Field>
          <Field label="Purchase cost">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.purchase_cost ?? ""}
              onChange={(e) =>
                setField("purchase_cost", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Roast date">
            <input
              type="date"
              value={form.roast_date ? (form.roast_date as string).substring(0, 10) : ""}
              onChange={(e) =>
                setField("roast_date", e.target.value ? new Date(e.target.value).toISOString() : undefined)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Your rating">
          <StarRating
            value={form.rating ?? null}
            onChange={(v) => setField("rating", v)}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setField("notes", e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="available"
            checked={form.is_available ?? true}
            onChange={(e) => setField("is_available", e.target.checked)}
            className="rounded border-stone-300"
          />
          <label htmlFor="available" className="text-sm text-stone-700 dark:text-stone-300">
            Available (has beans remaining)
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-5 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Bean
          </button>
        </div>
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
