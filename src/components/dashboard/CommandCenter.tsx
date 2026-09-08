"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Gauge,
  Navigation,
  Ship,
  TrendingDown,
  TrendingUp,
  Users,
  Building2,
  Fuel,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlobeCanvas } from "@/components/globe/GlobeCanvas";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { useLiveVesselPosition } from "@/lib/use-live-vessel-position";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { VoyageRoute, MarketInsights, FreightForecast } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useWorkflow } from "@/lib/workflow-context";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function CommandCenter({
  route: initialRoute,
  market,
  forecast,
}: {
  route: VoyageRoute;
  market: MarketInsights;
  forecast: FreightForecast;
}) {
  const { derivedState } = useWorkflow();
  const route = derivedState?.trackingRoute || initialRoute;

  const chartData = forecast.series.map((p) => ({
    label: p.date.split("-")[1],
    historical: p.historicalUsdPerMt,
    forecast: p.forecastUsdPerMt,
  }));


  const live = useLiveVesselPosition(
    { lat: route.originPort.lat, lng: route.originPort.lng },
    { lat: route.destinationPort.lat, lng: route.destinationPort.lng }
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[26px]">
            Live Maritime Intelligence
          </h1>
        </div>
      </motion.div>

      {/* Globe stage + floating panels — this stage is intentionally always
          dark, like a radar/map screen on a real instrument panel, so the
          globe and its overlaid readouts stay legible regardless of the
          app-wide theme (the same reason aviation/maritime dashboards keep
          map displays dark even in a "light" cockpit theme). Wrapping in
          `dark` re-scopes every CSS variable below back to the dark token
          set, so all the same GlassPanel/Badge/text-ink-* classes used
          elsewhere in the app work unchanged here. */}
      <div
        className="dark relative overflow-hidden rounded-3xl border border-glass-border bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.07),transparent_60%)]"
        style={{ backgroundColor: "#050810" }}
      >
        <div className="h-[460px] w-full sm:h-[580px] lg:h-[720px]">
          <GlobeCanvas
            origin={route.originPort}
            destination={route.destinationPort}
            progress={live.progress}
          />
        </div>

        {/* Route overview — top right on desktop, stacked on mobile */}
        <motion.div
          {...fadeUp(0.1)}
          className="relative -mt-2 px-4 pb-4 lg:absolute lg:right-5 lg:top-5 lg:mt-0 lg:w-72 lg:px-0 lg:pb-0"
        >
          <GlassPanel className="p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
              Route Overview
            </div>
            <div className="mb-3 text-base font-bold">
              {route.originPort.country.toUpperCase()} → {route.destinationPort.name.toUpperCase()}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Metric icon={Navigation} label="Distance" value={`${route.distanceNm.toLocaleString()} NM`} />
              <Metric icon={Clock} label="Est. Time" value={`${route.estTimeDays} days`} />
              <Metric icon={Gauge} label="Avg Speed" value={`${route.avgSpeedKts} kts`} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-3 text-xs">
              <span className="text-ink-dim">Route Status</span>
              <Badge tone="teal">{route.status}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-ink-dim">Weather</span>
              <span className="font-medium text-ink-primary">{route.weather}</span>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Selected vessel — right side below route card on desktop */}
        <motion.div
          {...fadeUp(0.16)}
          className="relative px-4 pb-4 lg:absolute lg:right-5 lg:top-[15.5rem] lg:w-72 lg:px-0 lg:pb-0"
        >
          <GlassPanel className="p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
              Selected Vessel
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-panel-raised text-cyan-glow">
                <Ship size={20} />
              </div>
              <div>
                <div className="text-sm font-bold">{route.vessel.name}</div>
                <div className="text-xs text-ink-dim">{route.vessel.vesselClass}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="DWT" value={route.vessel.dwt.toLocaleString()} />
              <Metric label="Draft" value={`${route.vessel.draft} m`} />
            </div>
            <div className="mt-2 rounded-lg bg-panel-raised/60 p-2">
              <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wide text-ink-dim">
                <span className="flex items-center gap-1">
                  <LiveDot color="cyan" /> Live Position
                </span>
                <span className="font-mono">{live.percentComplete}%</span>
              </div>
              <div className="font-mono text-xs font-semibold text-cyan-glow">
                {live.lat.toFixed(2)}°, {live.lng.toFixed(2)}°
              </div>
              <div className="mt-1.5 h-1 w-full rounded-full bg-panel">
                <div
                  className="h-1 rounded-full bg-cyan-glow transition-all duration-1000 ease-linear"
                  style={{ width: `${live.percentComplete}%` }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-3 text-xs">
              <span className="text-ink-dim">Status</span>
              <Badge tone="cyan">
                <LiveDot color="cyan" className="mr-0.5" />
                {route.vessel.status}
              </Badge>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Freight forecast — bottom left */}
        <motion.div
          {...fadeUp(0.22)}
          className="relative px-4 pb-4 lg:absolute lg:bottom-5 lg:left-5 lg:w-[340px] lg:px-0 lg:pb-0"
        >
          <GlassPanel className="p-4">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
              Freight Forecast
            </div>
            <div className="mb-2 text-sm font-bold">
              {forecast.route} ({forecast.vesselClass})
            </div>
            <div className="mb-1 flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-ink-primary">
                {forecast.currentRateUsdPerMt}
              </span>
              <span className="text-xs text-ink-dim">USD/MT</span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#1E2A3F" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#48566E", fontSize: 10 }}
                    axisLine={{ stroke: "#1E2A3F" }}
                    tickLine={false}
                  />
                  <YAxis hide domain={["dataMin - 3", "dataMax + 3"]} />
                  <Tooltip
                    contentStyle={{
                      background: "#101A2E",
                      border: "1px solid #1E2A3F",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "#7C8AA0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#2DD4BF"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span className="h-1.5 w-3 rounded-full bg-cyan-glow" /> Historical
              </span>
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span className="h-1.5 w-3 rounded-full bg-teal-soft" /> Forecast
              </span>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Origin port — bottom right */}
        <motion.div
          {...fadeUp(0.34)}
          className="relative px-4 pb-5 lg:absolute lg:bottom-5 lg:right-5 lg:w-72 lg:px-0 lg:pb-0"
        >
          <GlassPanel className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Building2 size={14} className="text-amber-signal" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
                Origin Port
              </span>
            </div>
            <div className="mb-2 text-sm font-bold">
              {route.originPort.name.toUpperCase()}, {route.originPort.country.toUpperCase()}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-dim">ETD</span>
              <span className="font-mono text-ink-primary">{route.etd}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-ink-dim">Cargo</span>
              <span className="font-mono text-ink-primary">{route.cargoDescription}</span>
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* Market Insights — full width strip below */}
      <motion.div {...fadeUp(0.4)} className="mt-5">
        <GlassPanel className="p-4 sm:p-5">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
            Market Insights
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InsightItem
              icon={market.freightTrendDirection === "down" ? TrendingDown : TrendingUp}
              label="Freight Trend"
              value={`${market.freightTrendDirection === "down" ? "↓" : "↑"} ${market.freightTrendPct}%`}
              sub="Next 30 days"
              tone={market.freightTrendDirection === "down" ? "teal" : "rose"}
            />
            <InsightItem
              icon={Users}
              label="Demand Level"
              value={market.demandLevel}
              tone="amber"
            />
            <InsightItem
              icon={Activity}
              label="Port Congestion"
              value={market.portCongestion}
              tone="amber"
            />
            <InsightItem
              icon={Fuel}
              label="Bunker Price"
              value={`$${market.bunkerPriceUsdPerMt}/MT`}
              sub={`↑ ${market.bunkerPriceChangePct}%`}
              tone="cyan"
            />
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-panel-raised/60 p-2">
      <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-ink-dim">
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <div className="font-mono text-xs font-semibold text-ink-primary">{value}</div>
    </div>
  );
}

function InsightItem({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone: "cyan" | "teal" | "amber" | "rose";
}) {
  const toneColor = {
    cyan: "text-cyan-glow",
    teal: "text-teal-soft",
    amber: "text-amber-signal",
    rose: "text-rose-signal",
  }[tone];

  return (
    <div className="flex items-start gap-2.5">
      <div className={cn("mt-0.5 rounded-lg bg-panel-raised p-1.5", toneColor)}>
        <Icon size={14} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
        <div className={cn("text-sm font-bold", toneColor)}>{value}</div>
        {sub && <div className="text-[10px] text-ink-dim">{sub}</div>}
      </div>
    </div>
  );
}
