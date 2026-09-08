"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Bell, Plug, ShieldCheck, UserPlus, UserMinus } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/toast-context";

interface OrgUser {
  name: string;
  role: string;
  status: "Active" | "Deactivated";
}

const initialUsers: OrgUser[] = [
  { name: "Rajesh Kumar", role: "Chartering Manager", status: "Active" },
  { name: "Priya Sharma", role: "Port Owner", status: "Active" },
  { name: "Amit Verma", role: "Organization Admin", status: "Active" },
  { name: "VoyageAI Platform Ops", role: "System Administrator", status: "Active" },
];

const notificationOptions = ["Email", "SMS", "Webhook"] as const;
type NotificationOption = (typeof notificationOptions)[number];
type Preferences = Record<string, Record<NotificationOption, boolean>>;
const defaultPreferences: Preferences = {
  "Risk alerts": { Email: true, SMS: false, Webhook: true },
  "Chartering approvals": { Email: true, SMS: true, Webhook: false },
  "Idle-vessel warnings": { Email: true, SMS: false, Webhook: false },
};

export default function SettingsPage() {
  const [users, setUsers] = useState(initialUsers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const showToast = useToast();

  useEffect(() => {
    const saved = window.localStorage.getItem("voyageai-notification-preferences");
    if (saved) setPreferences(JSON.parse(saved) as Preferences);
  }, []);

  function togglePreference(category: string, option: NotificationOption) {
    const next = { ...preferences, [category]: { ...preferences[category], [option]: !preferences[category][option] } };
    setPreferences(next);
    window.localStorage.setItem("voyageai-notification-preferences", JSON.stringify(next));
  }

  function toggleStatus(name: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.name === name
          ? { ...u, status: u.status === "Active" ? "Deactivated" : "Active" }
          : u
      )
    );
  }

  function invite() {
    if (!inviteEmail.trim()) return;
    setUsers((prev) => [
      ...prev,
      { name: inviteEmail.trim(), role: "Chartering Manager", status: "Active" },
    ]);
    setInviteEmail("");
    showToast("Invitation added to the local demo organization.");
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage company profile, user roles, and notification preferences
        </p>
      </motion.div>

      <div className="flex flex-col gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <GlassPanel className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
              <Building2 size={13} className="text-cyan-glow" /> Company Profile
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-dim">
                  Organization Name
                </div>
                <div className="text-sm font-semibold">Odisha Port Coal Import Ltd.</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-dim">Plan</div>
                <Badge tone="teal">Enterprise</Badge>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <GlassPanel className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
              <Users size={13} className="text-cyan-glow" /> Users &amp; Roles
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="input-field flex-1"
              />
              <button
                onClick={invite}
                disabled={!inviteEmail.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan-glow px-4 py-2 text-xs font-bold text-void disabled:opacity-40"
              >
                <UserPlus size={13} /> Invite
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <div
                  key={u.name}
                  className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3"
                >
                  <div>
                    <div className="text-xs font-semibold">{u.name}</div>
                    <div className="text-[10px] text-ink-dim">{u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={u.status === "Active" ? "teal" : "muted"}>{u.status}</Badge>
                    <button
                      onClick={() => u.status === "Active" ? setDeactivating(u.name) : toggleStatus(u.name)}
                      aria-label={u.status === "Active" ? `Deactivate ${u.name}` : `Reactivate ${u.name}`}
                      title={u.status === "Active" ? "Deactivate user" : "Reactivate user"}
                      className="rounded-lg p-1.5 text-ink-dim hover:bg-panel-hover hover:text-rose-signal"
                    >
                      <UserMinus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <GlassPanel className="p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
                <Bell size={13} className="text-amber-signal" /> Notifications
              </div>
              <p className="text-xs text-ink-muted">
                Choose where each event type should be delivered in this browser.
              </p>
              <button onClick={() => { window.localStorage.removeItem("voyageai-onboarding-complete"); window.dispatchEvent(new Event("voyageai:replay-tour")); }} className="mt-4 rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-cyan-glow hover:bg-panel-raised">Replay onboarding tour</button>
              <div className="mt-4 space-y-3">
                {Object.entries(preferences).map(([category, options]) => (
                  <div key={category}>
                    <div className="mb-2 text-xs font-semibold text-ink-primary">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {notificationOptions.map((option) => (
                        <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-glass-border px-2.5 py-2 text-xs text-ink-muted">
                          <input type="checkbox" checked={options[option]} onChange={() => togglePreference(category, option)} className="accent-cyan-glow" />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <GlassPanel className="p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
                <Plug size={13} className="text-cyan-glow" /> Integrations
              </div>
              <p className="text-xs text-ink-muted">
                AIS telemetry, Baltic Exchange/FFA feed, port congestion API, weather provider.
                Broker hand-off delivered via signed webhook — no broker login required.
              </p>
            </GlassPanel>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
              <ShieldCheck size={13} className="text-teal-soft" /> Security
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              JWT/OAuth2 authentication · AES-256 encryption at rest · TLS 1.3 in transit ·
              Role-based access control enforced at the API layer.
            </p>
          </GlassPanel>
        </motion.div>
      </div>
      {deactivating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
          <GlassPanel className="w-full max-w-sm p-6">
            <h2 id="deactivate-title" className="text-lg font-bold">Deactivate this user?</h2>
            <p className="mt-2 text-sm text-ink-muted">The user will remain in the local organization list and can be reactivated.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeactivating(null)} className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-ink-muted">Cancel</button>
              <button onClick={() => { toggleStatus(deactivating); setDeactivating(null); showToast("User deactivated."); }} className="rounded-lg bg-rose-signal px-3 py-2 text-xs font-bold text-white">Confirm deactivate</button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
