"use client";

import { useEffect, useState } from "react";
import { grindersApi, getErrorMessage } from "@/lib/api";
import type { Grinder, GrinderCreate } from "@/lib/types";

export default function GrindersPage() {
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [form, setForm] = useState<GrinderCreate>({ name: "" });

  useEffect(() => {
    grindersApi.list().then((data) => {
      setGrinders(data);
      setLoading(false);
    });
  }, []);

  async function handleCreate(e: React.SubmitEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const g = await grindersApi.create({ ...form, model: form.model || undefined, manufacturer: form.manufacturer || undefined });
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
    if (!confirm("Delete this grinder?")) return;
    await grindersApi.delete(id);
    setGrinders((prev) => prev.filter((g) => g.id !== id));
  }

  async function addProfile(grinderId: number, name: string, setting: string) {
    const profile = await grindersApi.createProfile(grinderId, { name, setting });
    setGrinders((prev) =>
      prev.map((g) =>
        g.id === grinderId
          ? { ...g, settings_profiles: [...g.settings_profiles, profile] }
          : g
      )
    );
  }

  async function deleteProfile(grinderId: number, profileId: number) {
    await grindersApi.deleteProfile(grinderId, profileId);
    setGrinders((prev) =>
      prev.map((g) =>
        g.id === grinderId
          ? { ...g, settings_profiles: g.settings_profiles.filter((p) => p.id !== profileId) }
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
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input type="text" value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Manufacturer</label>
              <input type="text" value={form.manufacturer ?? ""} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
          </div>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? "Saving…" : "Save Grinder"}
          </button>
        </form>
      )}

      {grinders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
          <p className="text-stone-400">No grinders added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grinders.map((grinder) => (
            <GrinderCard
              key={grinder.id}
              grinder={grinder}
              expanded={expanded === grinder.id}
              onToggle={() => setExpanded(expanded === grinder.id ? null : grinder.id)}
              onDelete={() => handleDelete(grinder.id)}
              onAddProfile={(name, setting) => addProfile(grinder.id, name, setting)}
              onDeleteProfile={(profileId) => deleteProfile(grinder.id, profileId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GrinderCard({
  grinder, expanded, onToggle, onDelete, onAddProfile, onDeleteProfile,
}: {
  grinder: Grinder;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddProfile: (name: string, setting: string) => void;
  onDeleteProfile: (id: number) => void;
}) {
  const [profileName, setProfileName] = useState("");
  const [profileSetting, setProfileSetting] = useState("");

  function submitProfile(e: React.SubmitEvent) {
    e.preventDefault();
    if (!profileName || !profileSetting) return;
    onAddProfile(profileName, profileSetting);
    setProfileName("");
    setProfileSetting("");
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
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
          <span className="text-xs text-stone-400">{grinder.settings_profiles.length} profile{grinder.settings_profiles.length !== 1 ? "s" : ""}</span>
          <span className="text-stone-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-4 space-y-3">
          {grinder.notes && (
            <p className="text-sm text-stone-500 italic">{grinder.notes}</p>
          )}

          {/* Profiles */}
          {grinder.settings_profiles.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Settings Profiles</p>
              {grinder.settings_profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1 px-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                  <span className="text-sm text-stone-700 dark:text-stone-300">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-amber-700 dark:text-amber-400">{p.setting}</span>
                    <button onClick={() => onDeleteProfile(p.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add profile inline */}
          <form onSubmit={submitProfile} className="flex gap-2">
            <input type="text" placeholder="Profile name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={`${inputClass} flex-1`} />
            <input type="text" placeholder="Setting value" value={profileSetting} onChange={(e) => setProfileSetting(e.target.value)} className={`${inputClass} w-28`} />
            <button type="submit" className="px-3 py-1.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg text-sm font-medium">Add</button>
          </form>

          <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">
            Delete grinder
          </button>
        </div>
      )}
    </div>
  );
}

const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
const inputClass =
  "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
