"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CloudLightning,
  Anchor,
  TrendingUp,
  Globe as GlobeIcon,
  Settings2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge, riskTone } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import type { RiskAlert } from "@/lib/types";
import { useState } from "react";
import { useToast } from "@/lib/toast-context";

const categoryIcon: Record<RiskAlert["category"], LucideIcon> = {
  Weather: CloudLightning,
  "Port Congestion": Anchor,
  "Freight Volatility": TrendingUp,
  Geopolitical: GlobeIcon,
  Operational: Settings2,
};

export function RiskAlertsView({ alerts }: { alerts: RiskAlert[] }) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);
  const showToast = useToast();
  const activeCount = visibleAlerts.filter((a) => !a.acknowledged).length;
  const highOrCritical = visibleAlerts.filter(
    (a) => (a.level === "High" || a.level === "Critical") && !a.acknowledged
  ).length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Risk &amp; Alerts Center</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Freight volatility, congestion, weather, and operational risk signals across active
          voyages
        </p>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Active Alerts" value={activeCount} icon={AlertTriangle} accent="amber" index={0} />
        <KPICard
          label="High / Critical"
          value={highOrCritical}
          icon={AlertTriangle}
          accent="rose"
          index={1}
        />
        <KPICard
          label="Acknowledged"
          value={visibleAlerts.filter((a) => a.acknowledged).length}
          icon={CheckCircle2}
          accent="teal"
          index={2}
        />
      </div>

      <div className="flex flex-col gap-3">
        {visibleAlerts.length === 0 && <GlassPanel className="p-8 text-center text-sm text-ink-muted">No risk alerts are currently recorded.</GlassPanel>}
        {visibleAlerts.map((alert, i) => {
          const Icon = categoryIcon[alert.category];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <GlassPanel
                className="p-4 sm:p-5"
                glow={alert.level === "Critical" || alert.level === "High" ? "rose" : "none"}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panel-raised text-amber-signal">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{alert.title}</span>
                        <Badge tone={riskTone(alert.level)}>{alert.level}</Badge>
                        {alert.acknowledged && (
                          <Badge tone="teal">
                            <CheckCircle2 size={11} /> Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 text-xs leading-relaxed text-ink-muted">
                        {alert.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-dim">
                        <span>{alert.route}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(alert.detectedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="rounded bg-panel-raised px-1.5 py-0.5">
                          {alert.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button onClick={() => { setVisibleAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, acknowledged: true } : item)); showToast("Risk alert acknowledged."); }} className="shrink-0 rounded-lg border border-glass-border bg-panel-raised px-3.5 py-1.5 text-xs font-medium text-ink-primary transition-colors hover:bg-panel-hover">
                      Acknowledge
                    </button>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
