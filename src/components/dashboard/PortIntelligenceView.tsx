"use client";

import { motion } from "framer-motion";
import { MapPin, Ruler, CheckCircle2, XCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import type { Port } from "@/lib/types";

const congestionTone = {
  Low: "teal",
  Moderate: "amber",
  High: "rose",
} as const;

export function PortIntelligenceView({ ports }: { ports: Port[] }) {
  return (
    <div className="mx-auto max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Port Intelligence</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Draft restrictions, berth availability, and congestion across the port network
        </p>
      </motion.div>

      <GlassPanel className="overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-glass-border px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-dim md:grid">
          <span>Port</span>
          <span>Max Draft</span>
          <span>Berth</span>
          <span>Congestion</span>
          <span>Coordinates</span>
        </div>
          {ports.length === 0 && <div className="p-8 text-center text-sm text-ink-muted">No port intelligence is currently available.</div>}
        {ports.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="grid grid-cols-2 gap-3 border-b border-glass-border px-5 py-4 last:border-0 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:items-center md:gap-4"
          >
            <div className="col-span-2 flex items-center gap-2.5 md:col-span-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-raised text-cyan-glow">
                <MapPin size={14} />
              </div>
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-ink-dim">{p.country}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm">
              <Ruler size={13} className="text-ink-dim" /> {p.maxDraft} m
            </div>
            <div>
              {p.berthAvailable ? (
                <Badge tone="teal">
                  <CheckCircle2 size={11} /> Available
                </Badge>
              ) : (
                <Badge tone="rose">
                  <XCircle size={11} /> Occupied
                </Badge>
              )}
            </div>
            <div>
              <Badge tone={congestionTone[p.congestionLevel]}>{p.congestionLevel}</Badge>
            </div>
            <div className="font-mono text-xs text-ink-dim">
              {p.lat.toFixed(2)}°, {p.lng.toFixed(2)}°
            </div>
          </motion.div>
        ))}
      </GlassPanel>
    </div>
  );
}
