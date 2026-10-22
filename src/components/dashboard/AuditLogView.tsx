"use client";

import { motion } from "framer-motion";
import { History, Bot, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/lib/types";

const actionTone = {
  "AI Recommendation Generated": "cyan",
  "Manually Overridden": "amber",
  Approved: "teal",
  Rejected: "rose",
} as const;

export function AuditLogView({ entries }: { entries: AuditLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Decision Audit Log</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every AI recommendation and human decision, with model version, inputs, and confidence
          — retained per REQ-5.3.1/5.3.3
        </p>
      </motion.div>

      <GlassPanel className="overflow-hidden">
        {entries.length === 0 && <div className="p-8 text-center text-sm text-ink-muted">No audit decisions have been recorded.</div>}
        {entries.map((entry, i) => {
          const expanded = expandedId === entry.id;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="border-b border-glass-border last:border-0"
            >
              <button
                aria-expanded={expanded}
                aria-label={`Toggle details for ${entry.action}`}
                onClick={() => setExpandedId(expanded ? null : entry.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-panel-raised/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panel-raised text-cyan-glow">
                    {entry.actorRole === "System" ? <Bot size={15} /> : <User size={15} />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{entry.action}</span>
                      <Badge tone={actionTone[entry.action]}>{entry.requestId}</Badge>
                    </div>
                    <div className="text-xs text-ink-dim">
                      {entry.actor} ({entry.actorRole}) ·{" "}
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={cn("shrink-0 text-ink-dim transition-transform", expanded && "rotate-180")}
                />
              </button>

              {expanded && (
                <div className="grid grid-cols-1 gap-3 px-5 pb-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-panel-raised/60 p-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                      Input Snapshot
                    </div>
                    <div className="text-xs text-ink-muted">{entry.inputSnapshot}</div>
                  </div>
                  <div className="rounded-xl bg-panel-raised/60 p-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                      Output Summary
                    </div>
                    <div className="text-xs text-ink-muted">{entry.outputSummary}</div>
                  </div>
                  <div className="rounded-xl bg-panel-raised/60 p-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                      Model Version
                    </div>
                    <div className="font-mono text-xs text-ink-primary">{entry.modelVersion}</div>
                  </div>
                  <div className="rounded-xl bg-panel-raised/60 p-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                      Confidence Score
                    </div>
                    <div className="font-mono text-xs text-ink-primary">{entry.confidencePct}%</div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </GlassPanel>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-dim">
        <History size={11} /> Audit log entries retained for a minimum of 3 years per SRS
        REQ-5.3.3
      </div>
    </div>
  );
}
