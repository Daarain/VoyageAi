"use client";

import { motion } from "framer-motion";
import { Clock, Ship, Route, DollarSign, ArrowRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import type { IdleTimeEntry, Vessel } from "@/lib/types";

// Idle-berth day rate assumption used to estimate the cost of doing nothing
// — this is what makes "management" concrete rather than just a number.
const IDLE_COST_PER_DAY_USD = 18500;

export function IdleTimeView({
  idleEntries,
  vessels,
}: {
  idleEntries: IdleTimeEntry[];
  vessels: Vessel[];
}) {
  const totalIdleDays = idleEntries.reduce((sum, e) => sum + e.expectedIdleDays, 0);
  const totalIdleCost = totalIdleDays * IDLE_COST_PER_DAY_USD;
  const withSuggestion = idleEntries.filter((e) => e.repositioningSuggestion).length;

  return (
    <div className="mx-auto max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Idle-Time Optimizer</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Vessels sitting idle between voyages, and where to reposition them for backhaul work
        </p>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Vessels Idle" value={idleEntries.length} icon={Clock} accent="amber" index={0} />
        <KPICard
          label="Est. Idle Cost"
          value={`$${(totalIdleCost / 1000).toFixed(0)}K`}
          icon={DollarSign}
          accent="rose"
          index={1}
        />
        <KPICard
          label="Repositioning Suggestions"
          value={withSuggestion}
          icon={Route}
          accent="teal"
          index={2}
        />
      </div>

      {idleEntries.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <Ship size={28} className="mx-auto mb-3 text-ink-dim" />
          <p className="text-sm text-ink-muted">No vessels are currently idle.</p>
        </GlassPanel>
      ) : (
        <div className="flex flex-col gap-3">
          {idleEntries.map((entry, i) => {
            const vessel = vessels.find((v) => v.id === entry.vesselId);
            return (
              <motion.div
                key={entry.vesselId}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <GlassPanel className="p-5" glow={entry.expectedIdleDays >= 5 ? "rose" : "none"}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-panel-raised text-amber-signal">
                        <Ship size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{entry.vesselName}</div>
                        <div className="text-xs text-ink-dim">
                          {vessel?.vesselClass} · Currently at {entry.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="amber">{entry.expectedIdleDays} days idle</Badge>
                      <Badge tone="rose">
                        ${((entry.expectedIdleDays * IDLE_COST_PER_DAY_USD) / 1000).toFixed(0)}K cost
                      </Badge>
                    </div>
                  </div>

                  {entry.repositioningSuggestion ? (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-teal-deep/30 bg-teal-deep/10 p-3.5">
                      <ArrowRight size={14} className="mt-0.5 shrink-0 text-teal-soft" />
                      <div>
                        <div className="mb-0.5 text-xs font-semibold text-teal-soft">
                          Backhaul Suggestion
                        </div>
                        <p className="text-xs leading-relaxed text-ink-muted">
                          {entry.repositioningSuggestion}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-glass-border bg-panel-raised/40 p-3.5 text-xs text-ink-dim">
                      No repositioning opportunity identified for this idle window yet.
                    </div>
                  )}
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
