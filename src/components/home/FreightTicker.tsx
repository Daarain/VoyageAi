"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp, Radio, ArrowUpRight, Activity } from "lucide-react";
import { freightTickerRoutes, balticIndices, marketTrendSeries } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export function FreightTicker({ delay = 0.9 }: { delay?: number }) {
  const reduceMotion = useReducedMotion();

  // Generate SVG path for 30-day sparkline
  const minVal = Math.min(...marketTrendSeries);
  const maxVal = Math.max(...marketTrendSeries);
  const width = 80;
  const height = 24;
  const points = marketTrendSeries
    .map((val, idx) => {
      const x = (idx / (marketTrendSeries.length - 1)) * width;
      const y = height - ((val - minVal) / (maxVal - minVal || 1)) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className="landing-entrance absolute inset-x-0 bottom-0 z-20"
    >
      <div className="relative border-t border-cyan-500/20 bg-slate-950/92 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.85)]">
        {/* Subtle cyan glow line at the top */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Left: Feed Header & Baltic Dry Index */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Live Freight Radar
                </span>
              </div>
              <span className="mt-0.5 text-[11px] font-medium text-slate-400">
                Satellite AIS & Baltic FFA Feed
              </span>
            </div>

            {/* Baltic Macro Indices Badges */}
            <div className="hidden items-center gap-2 xl:flex">
              {balticIndices.map((idx) => (
                <div
                  key={idx.symbol}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
                >
                  <span className="font-semibold text-slate-300">{idx.symbol}</span>
                  <span className="font-mono font-bold text-white">{idx.value}</span>
                  <span
                    className={cn(
                      "font-semibold text-[10px]",
                      idx.direction === "up" ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {idx.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden h-9 w-px shrink-0 bg-white/15 lg:block" />

          {/* Middle: Complete Corridor Freight Rates Stream */}
          <div className="flex flex-1 items-center gap-6 overflow-x-auto no-scrollbar py-0.5 sm:gap-7 lg:gap-8">
            {freightTickerRoutes.map((r) => (
              <div key={r.route} className="flex shrink-0 flex-col whitespace-nowrap group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {r.route}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-medium text-cyan-300/90">
                    {r.vesselClass}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-base font-extrabold text-white tracking-tight sm:text-lg">
                    ${r.rateUsdPerMt.toFixed(2)}
                    <span className="text-xs font-medium text-slate-400">/MT</span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
                      r.direction === "down"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    )}
                  >
                    {r.direction === "down" ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {r.trendPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden h-9 w-px shrink-0 bg-white/15 lg:block" />

          {/* Right: 30-Day Forward Trend Visualizer & Action */}
          <div className="hidden shrink-0 items-center gap-5 md:flex">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Activity size={13} className="text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">30-Day Market Trend</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                {/* Mini SVG Sparkline */}
                <svg width={width} height={height} className="overflow-visible">
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#sparklineGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                  +14.0% Rally
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/forecast"
              className="group flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:text-white"
            >
              <span>Forecast</span>
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
