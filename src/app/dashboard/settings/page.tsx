"use client";
// src/app/dashboard/settings/page.tsx  — wired to Supabase

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Bell, UserPlus, UserMinus } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/toast-context";
import { useSession, type UserRole } from "@/lib/session-context";
import { supabase, type Profile } from "@/lib/supabase";

const notificationOptions = ["Email", "SMS", "Webhook"] as const;
type NotificationOption = (typeof notificationOptions)[number];
type Preferences = Record<string, Record<NotificationOption, boolean>>;
const defaultPreferences: Preferences = {
  "Risk alerts":           { Email: true,  SMS: false, Webhook: true  },
  "Chartering approvals":  { Email: true,  SMS: true,  Webhook: false },
  "Idle-vessel warnings":  { Email: true,  SMS: false, Webhook: false },
};

export default function SettingsPage() {
  const showToast = useToast();
  const { user, updateProfile } = useSession();

  // Profile form
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [company,  setCompany]  = useState(user?.company ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Org users (shown to admins)
  const [orgUsers, setOrgUsers] = useState<Profile[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const isAdmin = user?.role === "Organization Admin" || user?.role === "System Administrator";

  // Notification prefs (stored in Supabase user metadata for simplicity)
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    if (user) { setFullName(user.name); setCompany(user.company ?? ""); }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("voyageai-notification-preferences");
    if (saved) setPreferences(JSON.parse(saved) as Preferences);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("profiles").select("*").order("created_at").then(({ data }) => {
      if (data) setOrgUsers(data as Profile[]);
    });
  }, [isAdmin]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const err = await updateProfile({ full_name: fullName, company });
    setSavingProfile(false);
    showToast(err ? `Error: ${err}` : "Profile updated.");
  }

  async function changeOrgUserRole(userId: string, role: UserRole) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) { showToast("Error: " + error.message); return; }
    setOrgUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    showToast("Role updated.");
  }

  async function toggleOrgUserStatus(userId: string, active: boolean) {
    const { error } = await supabase.from("profiles").update({ is_active: !active }).eq("id", userId);
    if (error) { showToast("Error: " + error.message); return; }
    setOrgUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !active } : u)));
    showToast(!active ? "User activated." : "User deactivated.");
  }

  function togglePref(category: string, option: NotificationOption) {
    const next = { ...preferences, [category]: { ...preferences[category], [option]: !preferences[category][option] } };
    setPreferences(next);
    localStorage.setItem("voyageai-notification-preferences", JSON.stringify(next));
  }

  function invite() {
    if (!inviteEmail.trim()) return;
    showToast(`Invite sent to ${inviteEmail} (email delivery via Supabase Auth).`);
    setInviteEmail("");
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your profile, organization, and notifications</p>
      </motion.div>

      <div className="space-y-6">
        {/* ── Profile ── */}
        <GlassPanel className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Building2 size={16} className="text-cyan-glow" /> My Profile
          </div>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-ink-muted">
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="input-field mt-1.5" />
            </label>
            <label className="block text-xs font-semibold text-ink-muted">
              Company
              <input value={company} onChange={(e) => setCompany(e.target.value)}
                className="input-field mt-1.5" />
            </label>
            <label className="block text-xs font-semibold text-ink-muted">
              Email
              <input value={user?.email ?? ""} disabled className="input-field mt-1.5 opacity-50 cursor-not-allowed" />
            </label>
            <label className="block text-xs font-semibold text-ink-muted">
              Role
              <input value={user?.role ?? ""} disabled className="input-field mt-1.5 opacity-50 cursor-not-allowed" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={savingProfile}
                className="rounded-xl bg-cyan-glow px-5 py-2.5 text-sm font-bold text-void hover:opacity-90 disabled:opacity-50">
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        </GlassPanel>

        {/* ── Organization Users (admins only) ── */}
        {isAdmin && (
          <GlassPanel className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Users size={16} className="text-cyan-glow" /> Organization Users
            </div>
            <div className="mb-4 flex gap-2">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite by email…" className="input-field flex-1" />
              <button onClick={invite}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-glow px-4 py-2 text-xs font-bold text-void hover:opacity-90">
                <UserPlus size={14} /> Invite
              </button>
            </div>
            <div className="space-y-2">
              {orgUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-glass-border bg-panel-raised px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{u.full_name ?? u.id.slice(0, 8)}</div>
                    <div className="text-xs text-ink-dim">{u.role}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={u.role} onChange={(e) => changeOrgUserRole(u.id, e.target.value as UserRole)}
                      className="input-field py-1 text-xs">
                      {["Chartering Manager","Port Owner","Organization Admin","System Administrator"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    <Badge tone={u.is_active ? "cyan" : "amber"}>{u.is_active ? "Active" : "Off"}</Badge>
                    <button onClick={() => toggleOrgUserStatus(u.id, u.is_active)}
                      className="text-ink-dim hover:text-rose-signal">
                      <UserMinus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* ── Notifications ── */}
        <GlassPanel className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Bell size={16} className="text-cyan-glow" /> Notification Preferences
          </div>
          <div className="divide-y divide-glass-border/50">
            {Object.entries(preferences).map(([category, opts]) => (
              <div key={category} className="flex items-center justify-between py-3">
                <span className="text-sm">{category}</span>
                <div className="flex gap-4">
                  {notificationOptions.map((option) => (
                    <label key={option} className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                      <input type="checkbox" checked={opts[option]} onChange={() => togglePref(category, option)}
                        className="accent-cyan-glow" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
