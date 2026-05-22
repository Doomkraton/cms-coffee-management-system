"use client";

import { useEffect, useState } from "react";
import { authApi, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { InviteCode } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.is_admin) {
      router.push("/dashboard");
      return;
    }
    authApi.listInviteCodes().then((codes) => {
      setInviteCodes(codes);
      setLoading(false);
    });
  }, [user, router]);

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

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (loading) return <div className="text-stone-400 animate-pulse">Loading…</div>;

  const unusedCodes = inviteCodes.filter((c) => c.used_by === null);
  const usedCodes = inviteCodes.filter((c) => c.used_by !== null);

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Settings</h1>

      {/* Account info */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100">Your Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-stone-400">Name</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">{user?.name}</p>
          </div>
          <div>
            <p className="text-stone-400">Email</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">{user?.email}</p>
          </div>
          <div>
            <p className="text-stone-400">Role</p>
            <p className="font-medium text-stone-800 dark:text-stone-100">
              {user?.is_admin ? "Admin ⭐" : "Member"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Sign out
        </button>
      </section>

      {/* Invite codes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">Invite Codes</h2>
          <p className="text-xs text-stone-400">
            Share codes with household members so they can join via /join
          </p>
        </div>

        {/* Create */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-sm text-stone-500 mb-1">Expires in</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {creating ? "Generating…" : "Generate Code"}
          </button>
        </div>

        {/* Active codes */}
        {unusedCodes.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-2">Active Codes</p>
            <div className="space-y-2">
              {unusedCodes.map((code) => (
                <div
                  key={code.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <code className="font-mono text-sm text-stone-800 dark:text-stone-100">
                      {code.code}
                    </code>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Expires {formatDate(code.expires_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyCode(code.code)}
                      className="text-xs px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors"
                    >
                      {copied === code.code ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleRevoke(code.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Used codes */}
        {usedCodes.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-2">Used Codes</p>
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
          <p className="text-sm text-stone-400 text-center py-4">
            No invite codes yet. Generate one above to invite household members.
          </p>
        )}
      </section>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
