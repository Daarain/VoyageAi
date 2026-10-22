"use client";
// src/app/dashboard/admin/page.tsx
// Admin panel — only visible to Organization Admin & System Administrator.
// middleware.ts enforces the role gate server-side.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, UserCheck, UserX, RefreshCw, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/toast-context";
import { supabase, type Profile } from "@/lib/supabase";
import type { UserRole } from "@/lib/session-context";

const ROLES: UserRole[] = [
  "Chartering Manager",
  "Port Owner",
  "Organization Admin",
  "System Administrator",
];

export default function AdminPage() {
  const showToast = useToast();
  const [users, setUsers]     = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [saving, setSaving]   = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_users_view")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { showToast("Failed to load users: " + error.message); }
    else setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  async function toggleActive(userId: string, current: boolean) {
    setSaving(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !current })
      .eq("id", userId);
    if (error) showToast("Error: " + error.message);
    else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !current } : u))
      );
      showToast(!current ? "User activated." : "User deactivated.");
    }
    setSaving(null);
  }

  async function changeRole(userId: string, role: UserRole) {
    setSaving(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) showToast("Error: " + error.message);
    else {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      showToast("Role updated.");
    }
    setSaving(null);
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const stats = {
    total:  users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) =>
      ["Organization Admin", "System Administrator"].includes(u.role)
    ).length,
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-sm text-ink-muted">Manage users, roles, and access</p>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total users",   value: stats.total },
          { label: "Active",        value: stats.active },
          { label: "Admins",        value: stats.admins },
        ].map((s) => (
          <GlassPanel key={s.label} className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-glow">{s.value}</div>
            <div className="mt-1 text-xs text-ink-muted">{s.label}</div>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="p-4 sm:p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="input-field pl-9 w-full sm:w-64"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 rounded-lg border border-glass-border px-3 py-2 text-xs text-ink-muted hover:bg-panel-raised"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border text-left text-xs text-ink-dim">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Requests</th>
                  <th className="pb-3 pr-4">Last login</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {filtered.map((u) => (
                  <tr key={u.id} className="group">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-ink-dim">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.role}
                        disabled={saving === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                        className="input-field py-1 text-xs"
                      >
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {(u as Profile & { request_count?: number }).request_count ?? 0}
                    </td>
                    <td className="py-3 pr-4 text-xs text-ink-muted">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={u.is_active ? "cyan" : "amber"}>
                        {u.is_active ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleActive(u.id, u.is_active)}
                        disabled={saving === u.id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                        style={{
                          color: u.is_active ? "var(--color-rose-signal)" : "var(--color-teal-soft)",
                          background: u.is_active
                            ? "rgba(var(--rose-signal-rgb),0.1)"
                            : "rgba(var(--teal-soft-rgb),0.1)",
                        }}
                      >
                        {u.is_active
                          ? <><UserX size={13} /> Deactivate</>
                          : <><UserCheck size={13} /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-ink-muted">No users match your search.</div>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
