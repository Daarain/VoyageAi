"use client";

import { motion } from "framer-motion";
import { TrendingDown, Target, Calendar, Info } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { KPICard } from "@/components/ui/KPICard";
import { useChartTheme } from "@/lib/use-chart-theme";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { FreightForecast } from "@/lib/types";

export function ForecastView({ forecast }: { forecast: FreightForecast }) {
  const chart = useChartTheme();
  const chartData = forecast.series.map((p) => ({
    label: p.date,
    Historical: p.historicalUsdPerMt,
    Forecast: p.forecastUsdPerMt,
  }));

  return (
    <div className="mx-auto max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Freight Forecast</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {forecast.route} — time-series rate prediction for {forecast.vesselClass} class vessels
        </p>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          label="Current Rate"
          value={`$${forecast.currentRateUsdPerMt}/MT`}
          icon={TrendingDown}
          accent="cyan"
          index={0}
        />
        <KPICard
          label="Forecast Confidence"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono">{forecast.confidencePct}%</span>
              <span className="group relative inline-flex" tabIndex={0} aria-label="Forecast confidence explanation">
                <Info size={13} className="text-ink-muted" />
                <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-glass-border bg-panel p-2 text-left text-[10px] font-normal leading-relaxed text-ink-muted opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100">
                  Forecast confidence indicates how strongly available forecasting signals support the current freight-rate projection.
                </span>
              </span>
            </span>
          }
          icon={Target}
          accent="teal"
          index={1}
        />
        <KPICard
          label="Optimal Entry Window"
          value={`${forecast.optimalEntryWindowStart.slice(5)} → ${forecast.optimalEntryWindowEnd.slice(5)}`}
          icon={Calendar}
          accent="amber"
          index={2}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassPanel className="p-5 sm:p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
            90-Day Rate Trajectory (USD/MT)
          </div>
          <div className="h-[380px] w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chart.axisText, fontSize: 11 }}
                  axisLine={{ stroke: chart.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chart.axisText, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 3", "dataMax + 3"]}
                />
                <Tooltip
                  contentStyle={{
                    background: chart.tooltipBg,
                    border: `1px solid ${chart.tooltipBorder}`,
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: chart.tooltipLabel }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: chart.axisText }} />
                <Area
                  type="monotone"
                  dataKey="Historical"
                  stroke="#22D3EE"
                  fill="url(#histFill)"
                  strokeWidth={2.5}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Forecast"
                  stroke="#2DD4BF"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ fill: "#2DD4BF", r: 3 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
