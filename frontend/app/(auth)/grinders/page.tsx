"use client";

import { useEffect, useState } from "react";
import { grindersApi, beansApi, methodsApi, getErrorMessage } from "@/lib/api";
import type { Grinder, GrinderCreate, GrinderProfile, Bean, BrewMethod } from "@/lib/types";

export default function GrindersPage() {
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [methods, setMethods] = useState<BrewMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState<GrinderCreate>({ name: "" });

  useEffect(() => {
    Promise.all([grindersApi.list(), beansApi.list(), methodsApi.list()]).then(
      ([g, b, m]) => {
        setGrinders(g);
        setBeans(b);
        setMethods(m);
        setLoading(false);
      }
    );
  }, []);

  async function handleCreate(e: React.SubmitEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const g = await grindersApi.create({
        ...form,
        model: form.model || undefined,
        manufacturer: form.manufacturer || undefined,
      });
      setGrinders((prev) => [g, ...prev]);
      setShowForm(false);
      setForm({ name: "" });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this grinder and all its profiles?")) return;
    await grindersApi.delete(id);
    setGrinders((prev) => prev.filter((g) => g.id !== id));
  }

  async function addProfile(
    grinderId: number,
    setting: string,
    beanId: number | undefined,
    methodId: number | undefined,
    notes: string,
  ) {
    const profile = await grindersApi.createProfile(grinderId, {
      setting,
      bean_id: beanId,
      method_id: methodId,
      notes: notes || undefined,
    });
    setGrinders((prev) =>
      prev.map((g) =>
        g.id === grinderId ? { ...g, profiles: [...g.profiles, profile] } : g
      )
    );
  }

  async function deleteProfile(grinderId: number, profileId: number) {
    await grindersApi.deleteProfile(grinderId, profileId);
    setGrinders((prev) =>
      prev.map((g) =>
        g.id === grinderId
          ? { ...g, profiles: g.profiles.filter((p) => p.id !== profileId) }
          : g
      )
    );
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Grinders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Grinder"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4"
        >
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input type="text" value={form.model ?? ""}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Manufacturer</label>
              <input type="text" value={form.manufacturer ?? ""}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea rows={2} value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass} />
          </div>
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? "Saving…" : "Save Grinder"}
          </button>
        </form>
      )}

      {grinders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
          <p className="text-stone-400">No grinders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grinders.map((grinder) => (
            <GrinderCard
              key={grinder.id}
              grinder={grinder}
              beans={beans}
              methods={methods}
              expanded={expanded === grinder.id}
              onToggle={() => setExpanded(expanded === grinder.id ? null : grinder.id)}
              onDelete={() => handleDelete(grinder.id)}
              onAddProfile={(setting, beanId, methodId, notes) =>
                addProfile(grinder.id, setting, beanId, methodId, notes)
              }
              onDeleteProfile={(profileId) => deleteProfile(grinder.id, profileId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────── Grinder Card ────────────────────────────────

function GrinderCard({
  grinder, beans, methods, expanded, onToggle, onDelete, onAddProfile, onDeleteProfile,
}: {
  grinder: Grinder;
  beans: Bean[];
  methods: BrewMethod[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddProfile: (setting: string, beanId: number | undefined, methodId: number | undefined, notes: string) => void;
  onDeleteProfile: (id: number) => void;
}) {
  const [setting, setSetting] = useState("");
  const [beanId, setBeanId] = useState<number | undefined>(undefined);
  const [methodId, setMethodId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");

  function submitProfile(e: React.SubmitEvent) {
    e.preventDefault();
    if (!setting.trim()) return;
    onAddProfile(setting.trim(), beanId, methodId, notes);
    setSetting("");
    setBeanId(undefined);
    setMethodId(undefined);
    setNotes("");
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50"
        onClick={onToggle}
      >
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-100">{grinder.name}</h3>
          {(grinder.model || grinder.manufacturer) && (
            <p className="text-sm text-stone-500">
              {[grinder.manufacturer, grinder.model].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">
            {grinder.profiles.length} profile{grinder.profiles.length !== 1 ? "s" : ""}
          </span>
          <span className="text-stone-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-4 space-y-4">
          {grinder.notes && (
            <p className="text-sm text-stone-500 italic">{grinder.notes}</p>
          )}

          {/* Existing profiles */}
          {grinder.profiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Saved Profiles
              </p>
              {grinder.profiles.map((p) => (
                <ProfileRow
                  key={p.id}
                  profile={p}
                  onDelete={() => onDeleteProfile(p.id)}
                />
              ))}
            </div>
          )}

          {/* Add profile form */}
          <form onSubmit={submitProfile} className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
              Add Profile
            </p>

            {/* Bean + Method selectors */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bean (optional)</label>
                <select
                  value={beanId ?? ""}
                  onChange={(e) => setBeanId(e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                >
                  <option value="">Any bean</option>
                  {beans.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Method (optional)</label>
                <select
                  value={methodId ?? ""}
                  onChange={(e) => setMethodId(e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                >
                  <option value="">Any method</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Setting + notes */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Setting *</label>
                <input
                  type="text"
                  required
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  placeholder="e.g. 24 clicks, 15, medium-fine"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bright and clean"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-1.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg text-sm font-medium"
              >
                Save Profile
              </button>
              <p className="text-xs text-stone-400">
                {!beanId && !methodId
                  ? "Will be used as a general fallback for this grinder"
                  : `Specific to: ${[beanId ? "selected bean" : null, methodId ? "selected method" : null].filter(Boolean).join(" + ")}`}
              </p>
            </div>
          </form>

          <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">
            Delete grinder
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ profile, onDelete }: { profile: GrinderProfile; onDelete: () => void }) {
  const beanLabel = profile.bean?.name ?? "Any bean";
  const methodLabel = profile.method?.name ?? "Any method";
  const isGeneral = !profile.bean_id && !profile.method_id;

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isGeneral ? (
            <span className="text-xs px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-500 rounded">
              General
            </span>
          ) : (
            <>
              {profile.bean_id && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded">
                  {beanLabel}
                </span>
              )}
              {profile.method_id && (
                <span className="text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
                  {methodLabel}
                </span>
              )}
            </>
          )}
          <span className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-400">
            {profile.setting}
          </span>
        </div>
        {profile.notes && (
          <p className="text-xs text-stone-400 mt-0.5">{profile.notes}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-xs text-stone-400 hover:text-red-500 flex-shrink-0 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
const inputClass =
  "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
