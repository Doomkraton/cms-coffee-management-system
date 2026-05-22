"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { beansApi, getErrorMessage } from "@/lib/api";
import type { Bean, BeanCreate } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function BeansPage() {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<BeanCreate>({
    name: "",
    roaster: "",
    origin: "",
    quantity_grams: 0,
    is_available: true,
  });

  useEffect(() => {
    beansApi.list().then((data) => {
      setBeans(data);
      setLoading(false);
    });
  }, []);

  function setField<K extends keyof BeanCreate>(k: K, v: BeanCreate[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleCreate(e: React.SubmitEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const newBean = await beansApi.create({
        ...form,
        roaster: form.roaster || undefined,
        origin: form.origin || undefined,
      });
      setBeans((prev) => [newBean, ...prev]);
      setShowForm(false);
      setForm({ name: "", roaster: "", origin: "", quantity_grams: 0, is_available: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(bean: Bean) {
    const updated = await beansApi.update(bean.id, { is_available: !bean.is_available });
    setBeans((prev) => prev.map((b) => (b.id === bean.id ? updated : b)));
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this bean?")) return;
    await beansApi.delete(id);
    setBeans((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Beans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Bean"}
        </button>
      </div>

      {/* Add Bean form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">New Bean</h2>

          {formError && (
            <p className="text-red-600 text-sm">{formError}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name *">
              <input
                type="text"
                value={form.name}
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
                value={form.quantity_grams}
                onChange={(e) => setField("quantity_grams", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
            <Field label="Purchase cost (optional)">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.purchase_cost ?? ""}
                onChange={(e) =>
                  setField("purchase_cost", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className={inputClass}
                placeholder="e.g. 18.99"
              />
            </Field>
            <Field label="Roast date (optional)">
              <input
                type="date"
                value={form.roast_date ? form.roast_date.substring(0, 10) : ""}
                onChange={(e) =>
                  setField("roast_date", e.target.value ? new Date(e.target.value).toISOString() : undefined)
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {saving ? "Saving…" : "Save Bean"}
          </button>
        </form>
      )}

      {/* Beans list */}
      {beans.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
          <p className="text-stone-400">No beans added yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {beans.map((bean) => (
            <div
              key={bean.id}
              className={`bg-white dark:bg-stone-900 border rounded-xl p-4 ${
                bean.is_available
                  ? "border-stone-200 dark:border-stone-800"
                  : "border-stone-100 dark:border-stone-900 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/beans/${bean.id}`} className="hover:text-amber-700 transition-colors">
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
                      {bean.name}
                    </h3>
                  </Link>
                  {(bean.roaster || bean.origin) && (
                    <p className="text-sm text-stone-500 mt-0.5">
                      {[bean.roaster, bean.origin].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    bean.is_available
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                  }`}
                >
                  {bean.is_available ? "Available" : "Empty"}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-stone-500">
                <span>{bean.quantity_grams}g remaining</span>
                {bean.rating && <StarRating value={bean.rating} readonly />}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/beans/${bean.id}`}
                  className="text-xs text-amber-700 hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => toggleAvailability(bean)}
                  className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  Mark as {bean.is_available ? "empty" : "available"}
                </button>
                <button
                  onClick={() => handleDelete(bean.id)}
                  className="text-xs text-red-500 hover:text-red-700 ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
