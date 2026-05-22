"use client";

import { useEffect, useState } from "react";
import { methodsApi, getErrorMessage } from "@/lib/api";
import type { BrewMethod, BrewMethodCreate } from "@/lib/types";

const CATEGORIES = ["pour-over", "espresso", "immersion", "cold brew", "moka pot", "aeropress", "other"];

export default function MethodsPage() {
  const [methods, setMethods] = useState<BrewMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<BrewMethodCreate>({ name: "" });

  useEffect(() => {
    methodsApi.list().then((data) => {
      setMethods(data);
      setLoading(false);
    });
  }, []);

  async function handleCreate(e: React.SubmitEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const m = await methodsApi.create({
        ...form,
        category: form.category || undefined,
        description: form.description || undefined,
      });
      setMethods((prev) => [...prev, m].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
      setForm({ name: "" });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this brew method?")) return;
    await methodsApi.delete(id);
    setMethods((prev) => prev.filter((m) => m.id !== id));
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Brew Methods</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Method"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4"
        >
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. V60, Chemex, Espresso"
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              placeholder="Brewing tips or notes"
            />
          </div>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? "Saving…" : "Save Method"}
          </button>
        </form>
      )}

      {methods.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
          <p className="text-stone-400">No brew methods yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100">{method.name}</h3>
                  {method.category && (
                    <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full mt-1 inline-block">
                      {method.category}
                    </span>
                  )}
                </div>
                <button onClick={() => handleDelete(method.id)} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">
                  Delete
                </button>
              </div>
              {method.description && (
                <p className="text-sm text-stone-500 mt-2">{method.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
const inputClass =
  "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
