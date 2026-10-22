"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { freightTickerRoutes } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export function FreightTicker({ delay = 0.9 }: { delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className="landing-entrance absolute inset-x-0 bottom-0 z-10"
    >
      <div className="border-t border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 overflow-x-auto px-4 py-3.5 sm:px-6 lg:px-10">
          <div className="flex shrink-0 flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-white/50">
              Live Freight Insights
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-teal-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-soft" /> Updated 2 min ago
            </span>
          </div>

          <div className="h-8 w-px shrink-0 bg-white/10" />

          {freightTickerRoutes.map((r) => (
            <div key={r.route} className="flex shrink-0 flex-col whitespace-nowrap">
              <span className="text-[10px] font-medium text-white/60">{r.route}</span>
              <span className="text-[9px] text-white/40">{r.vesselClass}</span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-white">
                  ${r.rateUsdPerMt.toFixed(2)}
                  <span className="text-[9px] font-normal text-white/40">/MT</span>
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] font-semibold",
                    r.direction === "down" ? "text-rose-signal" : "text-teal-soft"
                  )}
                >
                  {r.direction === "down" ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                  {r.trendPct}%
                </span>
              </div>
            </div>
          ))}

          <div className="h-8 w-px shrink-0 bg-white/10" />

          <div className="flex shrink-0 flex-col">
            <span className="text-[10px] font-medium text-white/60">Market Trend</span>
            <span className="text-[9px] text-white/40">Next 30 Days</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
