"use client";

import { useEffect, useState } from "react";
import { authApi, usersApi, instanceSettingsApi, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settingsStore";
import { CURRENCIES } from "@/lib/currencies";
import type { InviteCode, User, UserWithBrewCount } from "@/lib/types";
import { useRouter } from "next/navigation";

type Tab = "profile" | "members" | "invites" | "instance";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Settings</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-stone-500 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          My Profile
        </TabButton>
        {user?.is_admin && (
          <>
            <TabButton active={tab === "members"} onClick={() => setTab("members")}>
              Members
            </TabButton>
            <TabButton active={tab === "invites"} onClick={() => setTab("invites")}>
              Invite Codes
            </TabButton>
            <TabButton active={tab === "instance"} onClick={() => setTab("instance")}>
              Instance
            </TabButton>
          </>
        )}
      </div>

      {tab === "profile" && (
        <ProfileTab
          user={user}
          onProfileUpdated={(updated) => setAuth(localStorage.getItem("token")!, updated)}
        />
      )}
      {tab === "members" && user?.is_admin && <MembersTab currentUserId={user.id} />}
      {tab === "invites" && user?.is_admin && <InviteCodesTab />}
      {tab === "instance" && user?.is_admin && <InstanceTab />}
    </div>
  );
}

// ─────────────────────────────── My Profile Tab ──────────────────────────────

function ProfileTab({
  user,
  onProfileUpdated,
}: {
  user: User | null;
  onProfileUpdated: (u: User) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function handleSaveProfile(e: React.SubmitEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      const updated = await usersApi.updateMe({ name, email });
      onProfileUpdated(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.SubmitEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPw !== confirmPw) {
      setPwError("New passwords don't match");
      return;
    }
    setSavingPw(true);
    try {
      await usersApi.changeMyPassword({ current_password: currentPw, new_password: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 2500);
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Edit details */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Account Details</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && <p className="text-red-600 text-sm">{profileError}</p>}
          {profileSuccess && <p className="text-green-600 text-sm">Saved ✓</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className={btnPrimary}
            >
              {savingProfile ? "Saving…" : "Save Details"}
            </button>
            <span className="text-xs text-stone-400">
              {user?.is_admin ? "Admin ⭐" : "Member"} · joined {formatDate(user?.created_at ?? "")}
            </span>
          </div>
        </form>
      </section>

      {/* Change password */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">Password changed ✓</p>}
          <div>
            <label className={labelClass}>Current password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>
          <button type="submit" disabled={savingPw} className={btnPrimary}>
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

// ─────────────────────────────── Members Tab ─────────────────────────────────

function MembersTab({ currentUserId }: { currentUserId: number }) {
  const [members, setMembers] = useState<UserWithBrewCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pwEditingId, setPwEditingId] = useState<number | null>(null);

  useEffect(() => {
    usersApi.list().then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(member: UserWithBrewCount) {
    const brewWord = member.brew_count === 1 ? "brew log" : "brew logs";
    const msg = member.brew_count > 0
      ? `Delete ${member.name}? This will also delete their ${member.brew_count} ${brewWord}. This cannot be undone.`
      : `Delete ${member.name}? This cannot be undone.`;
    if (!confirm(msg)) return;
    try {
      await usersApi.delete(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden"
        >
          {/* Member row */}
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-stone-800 dark:text-stone-100">{member.name}</span>
                {member.is_admin && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded font-medium">
                    Admin
                  </span>
                )}
                {member.id === currentUserId && (
                  <span className="text-xs text-stone-400">(you)</span>
                )}
              </div>
              <p className="text-sm text-stone-400 truncate">{member.email}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {member.brew_count} brew{member.brew_count !== 1 ? "s" : ""} · joined {formatDate(member.created_at)}
              </p>
            </div>

            {/* Actions — only for non-admin, non-self */}
            {!member.is_admin && member.id !== currentUserId && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingId(editingId === member.id ? null : member.id);
                    setPwEditingId(null);
                  }}
                  className="text-xs px-2.5 py-1 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-600 dark:text-stone-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setPwEditingId(pwEditingId === member.id ? null : member.id);
                    setEditingId(null);
                  }}
                  className="text-xs px-2.5 py-1 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-600 dark:text-stone-300"
                >
                  Password
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  className="text-xs px-2.5 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Edit details inline */}
          {editingId === member.id && (
            <EditDetailsForm
              member={member}
              onSaved={(updated) => {
                setMembers((prev) => prev.map((m) =>
                  m.id === updated.id ? { ...m, ...updated } : m
                ));
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          )}

          {/* Edit password inline */}
          {pwEditingId === member.id && (
            <EditPasswordForm
              memberId={member.id}
              memberName={member.name}
              onSaved={() => setPwEditingId(null)}
              onCancel={() => setPwEditingId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function EditDetailsForm({
  member,
  onSaved,
  onCancel,
}: {
  member: UserWithBrewCount;
  onSaved: (u: UserWithBrewCount) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await usersApi.update(member.id, { name, email });
      onSaved({ ...member, ...updated });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-stone-100 dark:border-stone-800 px-4 py-4 bg-stone-50 dark:bg-stone-800/40 space-y-3"
    >
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Edit Details</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
      </div>
    </form>
  );
}

function EditPasswordForm({
  memberId,
  memberName,
  onSaved,
  onCancel,
}: {
  memberId: number;
  memberName: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    if (newPw !== confirmPw) {
      setError("Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      await usersApi.setPassword(memberId, { new_password: newPw });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-stone-100 dark:border-stone-800 px-4 py-4 bg-stone-50 dark:bg-stone-800/40 space-y-3"
    >
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
        Set Password for {memberName}
      </p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>New password</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Confirm password</label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Set Password"}</button>
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
      </div>
    </form>
  );
}

// ─────────────────────────────── Invite Codes Tab ────────────────────────────

function InviteCodesTab() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    authApi.listInviteCodes().then((codes) => {
      setInviteCodes(codes);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const code = await authApi.createInviteCode(expiryDays);
      setInviteCodes((prev) => [code, ...prev]);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: number) {
    if (!confirm("Revoke this invite code?")) return;
    await authApi.revokeInviteCode(id);
    setInviteCodes((prev) => prev.filter((c) => c.id !== id));
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  const unusedCodes = inviteCodes.filter((c) => c.used_by === null);
  const usedCodes = inviteCodes.filter((c) => c.used_by !== null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Generate codes to share with household members. Each code can only be used once.
      </p>

      {/* Generate */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-sm text-stone-500 mb-1">Expires in</label>
          <select
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            className={inputClass}
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        <button onClick={handleCreate} disabled={creating} className={btnPrimary}>
          {creating ? "Generating…" : "Generate Code"}
        </button>
      </div>

      {/* Active */}
      {unusedCodes.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-2">Active</p>
          <div className="space-y-2">
            {unusedCodes.map((code) => (
              <div
                key={code.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <code className="font-mono text-sm text-stone-800 dark:text-stone-100">{code.code}</code>
                  <p className="text-xs text-stone-400 mt-0.5">Expires {formatDate(code.expires_at)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyCode(code.code)}
                    className="text-xs px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors"
                  >
                    {copied === code.code ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => handleRevoke(code.id)} className="text-xs text-red-500 hover:text-red-700">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used */}
      {usedCodes.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-2">Used</p>
          <div className="space-y-2 opacity-60">
            {usedCodes.map((code) => (
              <div
                key={code.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <code className="font-mono text-sm text-stone-500 line-through">{code.code}</code>
                <span className="text-xs text-stone-400">
                  Used by {code.used_by_user?.name ?? "someone"} · {formatDate(code.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inviteCodes.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-6">
          No invite codes yet.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────── Instance Tab ────────────────────────────────

function InstanceTab() {
  const { showCosts, currency, setShowCosts, setCurrency } = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.SubmitEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await instanceSettingsApi.update({ show_costs: showCosts, currency });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-5"
      >
        <div>
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">Instance Preferences</h2>
          <p className="text-sm text-stone-400 mt-0.5">
            These settings apply to everyone in your household.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">Saved ✓</p>}

        {/* Show costs toggle */}
        <div className="flex items-start justify-between gap-4 py-1">
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Show cost tracking</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Display cost-per-brew, total spent, and bean prices across the app.
              Turn off if household members prefer not to see this.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showCosts}
            onClick={() => setShowCosts(!showCosts)}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 ${
              showCosts ? "bg-amber-700" : "bg-stone-300 dark:bg-stone-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                showCosts ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Currency picker */}
        <div>
          <label className={labelClass}>Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={!showCosts}
            className={`${inputClass} disabled:opacity-40`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.name} ({c.code})
              </option>
            ))}
          </select>
          {!showCosts && (
            <p className="text-xs text-stone-400 mt-1">Enable cost tracking to change currency.</p>
          )}
        </div>

        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save Preferences"}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────── Shared ──────────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-amber-700 text-amber-800 dark:text-amber-400"
          : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
const inputClass = "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
const btnPrimary = "px-4 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors";
const btnSecondary = "px-4 py-2 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg text-sm font-medium transition-colors";
