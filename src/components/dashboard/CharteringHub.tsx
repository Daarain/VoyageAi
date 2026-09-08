"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, XCircle, PenLine, ChevronDown } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { CharteringRequest } from "@/lib/types";
import { useSession } from "@/lib/session-context";
import { useToast } from "@/lib/toast-context";

const statusTone = {
  Draft: "muted",
  Processing: "amber",
  Recommended: "cyan",
  Approved: "teal",
  Rejected: "rose",
} as const;

export function CharteringHub({ requests: initial }: { requests: CharteringRequest[] }) {
  const [requests, setRequests] = useState(initial);
  const [overrideOpenId, setOverrideOpenId] = useState<string | null>(null);
  const [overrideText, setOverrideText] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const { user } = useSession();
  const showToast = useToast();

  function updateStatus(id: string, status: CharteringRequest["status"]) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    showToast(`Request ${status.toLowerCase()}.`);
  }

  function submitOverride(id: string) {
    if (!overrideText.trim()) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, overrideNote: overrideText.trim() } : r))
    );
    setOverrideOpenId(null);
    setOverrideText("");
    showToast("Manual override submitted.");
  }

  const pendingCount = requests.filter((r) => r.status === "Recommended").length;

  return (
    <div className="mx-auto max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chartering</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting Port Owner approval
          </p>
        </div>
        <Link
          href="/dashboard/request"
          className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-bold text-void hover:opacity-90"
        >
          <Plus size={16} /> New Request
        </Link>
      </motion.div>

      <div className="flex flex-col gap-3">
        {requests.length === 0 && <GlassPanel className="p-8 text-center text-sm text-ink-muted">No chartering requests to review.</GlassPanel>}
        {requests.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
          >
            <GlassPanel className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {r.cargoType} · {(r.cargoQuantityMt / 1000).toFixed(0)}K MT
                    </span>
                    <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                  </div>
                  <div className="text-xs text-ink-dim">
                    {r.numberOfVoyages} voyages · {r.deliveryWindowStart} → {r.deliveryWindowEnd}
                    {r.contractDurationMonths && ` · ${r.contractDurationMonths}mo contract`}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-dim">
                    Requested by <span className="text-ink-muted">{r.requestedBy}</span> ·{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                  {r.overrideNote && (
                    <div className="mt-2 rounded-lg border border-amber-signal/30 bg-amber-signal/10 p-2.5 text-xs text-ink-muted">
                      <span className="font-semibold text-amber-signal">Manual override:</span>{" "}
                      {r.overrideNote}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {r.status === "Recommended" && user?.role === "Port Owner" && (
                    <>
                      <button
                        onClick={() => updateStatus(r.id, "Approved")}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-deep/20 px-3 py-1.5 text-xs font-semibold text-teal-soft hover:bg-teal-deep/30"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(r.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-signal/20 px-3 py-1.5 text-xs font-semibold text-rose-signal hover:bg-rose-signal/30"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        onClick={() =>
                          setOverrideOpenId(overrideOpenId === r.id ? null : r.id)
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-panel-raised"
                      >
                        <PenLine size={13} /> Override
                        <ChevronDown
                          size={12}
                          className={cn(
                            "transition-transform",
                            overrideOpenId === r.id && "rotate-180"
                          )}
                        />
                      </button>
                    </>
                  )}
                  {r.status === "Recommended" && (
                    <Link
                      href="/dashboard/recommendation"
                      className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-cyan-glow hover:bg-panel-raised"
                    >
                      View AI Recommendation
                    </Link>
                  )}
                </div>
              </div>

              {overrideOpenId === r.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 border-t border-glass-border pt-4"
                >
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">
                    Justification for overriding the AI recommendation (required, per REQ-1.2.3 —
                    persisted to the audit log)
                  </label>
                  <textarea
                    value={overrideText}
                    onChange={(e) => setOverrideText(e.target.value)}
                    rows={2}
                    placeholder="e.g. Preferred vessel already contracted for another voyage — switching to Capesize"
                    className="input-field resize-none"
                  />
                  <button
                    onClick={() => submitOverride(r.id)}
                    disabled={!overrideText.trim()}
                    className="mt-2 rounded-lg bg-cyan-glow px-4 py-1.5 text-xs font-bold text-void disabled:opacity-40"
                  >
                    Submit Override
                  </button>
                </motion.div>
              )}
            </GlassPanel>
          </motion.div>
        ))}
      </div>
      {rejectingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
          <GlassPanel className="w-full max-w-sm p-6">
            <h2 id="reject-title" className="text-lg font-bold">Reject this request?</h2>
            <p className="mt-2 text-sm text-ink-muted">This local demo action will mark the recommendation as rejected.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setRejectingId(null)} className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-ink-muted">Cancel</button>
              <button onClick={() => { updateStatus(rejectingId, "Rejected"); setRejectingId(null); }} className="rounded-lg bg-rose-signal px-3 py-2 text-xs font-bold text-white">Confirm reject</button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
