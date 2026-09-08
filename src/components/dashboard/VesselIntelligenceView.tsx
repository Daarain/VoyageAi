"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Ship, Gauge, Anchor, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import type { Vessel } from "@/lib/types";

const vesselImageMap: Record<string, string> = {
  Handysize: "/images/vessels/handysize.jpg",
  Supramax: "/images/vessels/supramax.jpg",
  Panamax: "/images/vessels/panamax.jpg",
  Capesize: "/images/vessels/capesize.jpg",
};

function getVesselImage(vesselClass: string): string {
  return vesselImageMap[vesselClass] ?? "/images/vessels/panamax.jpg";
}

const statusTone = {
  "En Route": "cyan",
  Idle: "muted",
  Loading: "amber",
  Discharging: "teal",
  Operational: "teal",
} as const;

export function VesselIntelligenceView({ vessels }: { vessels: Vessel[] }) {
  return (
    <div className="mx-auto max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Vessel Intelligence</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Fleet-wide vessel classes, specifications, and live operational status
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vessels.length === 0 && <GlassPanel className="p-8 text-center text-sm text-ink-muted">No vessels are currently available.</GlassPanel>}
        {vessels.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <GlassPanel className="p-5" glow={v.status === "En Route" ? "cyan" : "none"}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-panel-raised text-cyan-glow">
                    <Ship size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{v.name}</div>
                    <div className="text-xs text-ink-dim">{v.vesselClass}</div>
                  </div>
                </div>
                <Badge tone={statusTone[v.status]}>
                  {v.status === "En Route" && <LiveDot color="cyan" className="mr-0.5" />}
                  {v.status}
                </Badge>
              </div>

              <div className="mb-4 overflow-hidden rounded-lg">
                <Image
                  src={getVesselImage(v.vesselClass)}
                  alt={`${v.vesselClass} vessel class`}
                  width={400}
                  height={160}
                  className="h-24 w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatBlock icon={Anchor} label="DWT" value={`${v.dwt.toLocaleString()} t`} />
                <StatBlock icon={Gauge} label="Draft" value={`${v.draft} m`} />
              </div>

              <div className="mt-4 border-t border-glass-border pt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-dim">
                    <Activity size={12} /> Utilization
                  </span>
                  <span className="font-mono font-semibold text-ink-primary">
                    {v.utilizationPct}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-panel-raised">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-cyan-glow to-teal-soft"
                    style={{ width: `${v.utilizationPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 font-mono text-[11px] text-ink-dim">
                {v.currentLat.toFixed(2)}°, {v.currentLng.toFixed(2)}°
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-panel-raised/60 p-2.5">
      <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-ink-dim">
        <Icon size={10} /> {label}
      </div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
