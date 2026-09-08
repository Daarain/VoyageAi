"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection,
  index = 0,
  accent = "cyan",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  index?: number;
  accent?: "cyan" | "teal" | "amber" | "rose";
}) {
  const accentText = {
    cyan: "text-cyan-glow",
    teal: "text-teal-soft",
    amber: "text-amber-signal",
    rose: "text-rose-signal",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
    >
      <GlassPanel className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
              {label}
            </div>
            <div className={cn("mt-2 text-2xl font-semibold", accentText)}>{value}</div>
          </div>
          {Icon && (
            <div className="rounded-lg bg-panel-raised p-2">
              <Icon size={16} className={accentText} strokeWidth={2} />
            </div>
          )}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-3 text-xs font-medium",
              trendDirection === "up" && "text-rose-signal",
              trendDirection === "down" && "text-teal-soft",
              trendDirection === "neutral" && "text-ink-muted"
            )}
          >
            {trend}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
