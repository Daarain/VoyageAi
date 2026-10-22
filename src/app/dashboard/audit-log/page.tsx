"use client";
// src/app/dashboard/audit-log/page.tsx
// Reads real audit entries from Supabase; falls back to demo data if not configured.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, RefreshCw, Shield, Download } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { supabase, type AuditEntry } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";

const ACTION_TONE: Record<string, "cyan" | "amber" | "rose" | "default"> = {
  AI_RECOMMENDATION: "cyan",
  MANUAL_OVERRIDE:   "amber",
  STATUS_CHANGE:     "default",
  LOGIN:             "default",
  REJECTED:          "rose",
};

export default function AuditLogPage() {
  const { user } = useSession();
  const [entries,  setEntries]  = useState<AuditEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const isAdmin = user?.role === "Organization Admin" || user?.role === "System Administrator";

  async function load() {
    setLoading(true);
    let q = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Non-admins only see their own entries
    if (!isAdmin && user?.id) q = q.eq("user_id", user.id);

    const { data, error } = await q;
    if (!error && data) setEntries(data as AuditEntry[]);
    setLoading(false);
  }

  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  function exportCSV() {
    const headers = ["Date","Action","Actor","Role","Model","Confidence","Summary"];
    const rows = entries.map(e => [
      new Date(e.created_at).toLocaleString(),
      e.action,
      e.actor_name ?? "",
      e.actor_role ?? "",
      e.model_version ?? "",
      e.confidence_pct ? `${e.confidence_pct.toFixed(1)}%` : "",
      e.output_summary ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "voyageai-audit-log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="mb-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
              <FileText size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
              <p className="text-sm text-ink-muted">
                {isAdmin ? "All system actions" : "Your activity history"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-2 text-xs text-ink-muted hover:bg-panel-raised disabled:opacity-50">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={exportCSV} disabled={entries.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-2 text-xs text-ink-muted hover:bg-panel-raised disabled:opacity-50">
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      <GlassPanel className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-muted">
            <RefreshCw size={18} className="animate-spin mr-3" /> Loading audit log…
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <Shield size={32} className="mx-auto mb-3 text-ink-dim" />
            <p className="text-sm text-ink-muted">No audit entries yet.</p>
            <p className="mt-1 text-xs text-ink-dim">
              Actions are logged automatically when you use the AI engine.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border text-left text-xs text-ink-dim">
                  <th className="pb-3 pr-4">Date & Time</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3 pr-4">Actor</th>
                  {isAdmin && <th className="pb-3 pr-4">Role</th>}
                  <th className="pb-3 pr-4">Model</th>
                  <th className="pb-3 pr-4">Confidence</th>
                  <th className="pb-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {entries.map((e, i) => (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td className="py-3 pr-4 text-xs text-ink-muted whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={ACTION_TONE[e.action] ?? "default"}>
                        {e.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs">{e.actor_name ?? "System"}</td>
                    {isAdmin && (
                      <td className="py-3 pr-4 text-xs text-ink-muted">{e.actor_role ?? "—"}</td>
                    )}
                    <td className="py-3 pr-4 font-mono text-xs text-ink-dim">
                      {e.model_version ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {e.confidence_pct ? (
                        <span className={e.confidence_pct >= 70 ? "text-teal-soft" : "text-amber-signal"}>
                          {e.confidence_pct.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 text-xs text-ink-muted max-w-[280px] truncate">
                      {e.output_summary ?? "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
