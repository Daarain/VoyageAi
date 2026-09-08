"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Ship,
  FileCheck2,
  TrendingDown,
  ShieldAlert,
  Clock3,
  CalendarClock,
  PiggyBank,
  CheckCircle2,
  Download,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Anchor,
  Repeat,
  DollarSign,
  AlertTriangle,
  Layers,
  Fuel,
  Lock,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge, riskTone } from "@/components/ui/Badge";
import { CountUp } from "@/components/ui/CountUp";
import { cn, formatUsd } from "@/lib/utils";
import { useChartTheme } from "@/lib/use-chart-theme";
import type { Recommendation } from "@/lib/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useWorkflow } from "@/lib/workflow-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

const vesselImageMap: Record<string, string> = {
  Handysize: "/images/vessels/handysize.jpg",
  Supramax: "/images/vessels/supramax.jpg",
  Panamax: "/images/vessels/panamax.jpg",
  Capesize: "/images/vessels/capesize.jpg",
};

function getVesselImage(vesselClass: string): string {
  return vesselImageMap[vesselClass] ?? "/images/vessels/panamax.jpg";
}

export function RecommendationView({ recommendation: r }: { recommendation: Recommendation }) {
  const chart = useChartTheme();
  const router = useRouter();
  const { activeScenario, lockFixture } = useWorkflow();

  const chartData = r.contractComparison.map((c) => ({
    type: c.type,
    cost: c.totalCostUsd,
    isRecommended: c.type === r.recommendedContractType,
  }));

  async function handleApproveAndLock() {
    await lockFixture("123456");
    router.push(`/dashboard/escrow?contractId=${activeScenario.escrow.contractId}`);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-glow/10 px-2 py-0.5 text-xs font-bold tracking-wider text-cyan-glow uppercase">
              Act IV: Commercial Action Cockpit
            </span>
            <span className="text-xs text-ink-dim">•</span>
            <span className="text-xs text-ink-muted">Gemini Pro Multi-Modal Synthesis</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-bright sm:text-3xl">
            Commercial Chartering Action Cockpit
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Executive fixture recommendations for{" "}
            <strong className="text-ink-bright">{activeScenario.request.targetSteelPlant}</strong> (
            {activeScenario.request.quantityMt.toLocaleString()} MT {activeScenario.request.commodity}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-void-border bg-void-surface px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-cyan-glow/40 hover:text-ink-bright"
          >
            <Download size={14} />
            <span>Export Board Memo (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleApproveAndLock}
            className="flex items-center gap-2 rounded-xl bg-cyan-glow px-5 py-2.5 text-xs font-bold text-void shadow-glow-cyan transition-all hover:opacity-90"
          >
            <Lock size={14} />
            <span>Approve &amp; Lock Fixture</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Hero Recommendation Callout Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        <GlassPanel className="p-6 sm:p-8" glow="teal">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-deep/30 px-3 py-1 text-xs font-bold text-teal-soft uppercase tracking-wider">
                <Sparkles size={13} />
                <span>Primary Executive Action</span>
              </div>
              <h2 className="text-2xl font-black text-ink-bright sm:text-3xl">
                {activeScenario.recommendation.primaryAction || "LOCK 3-MONTH MULTI-VOYAGE CONTRACT"}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
                {activeScenario.recommendation.recommendedRouteText} utilizing{" "}
                <strong className="text-teal-soft">
                  {activeScenario.recommendation.vesselStrategyText}
                </strong>
                . Bypasses Haldia draft restriction penalty and hedges against imminent Baltic FFA rally.
              </p>
            </div>

            <div className="flex flex-col items-start rounded-2xl border border-teal-soft/30 bg-teal-deep/15 p-5 text-left sm:items-end sm:text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-soft">
                Projected Net Portfolio Savings
              </div>
              <div className="mt-1 font-mono text-3xl font-bold text-teal-soft sm:text-4xl">
                <CountUp value={activeScenario.recommendation.netSavingsUsd} prefix="$" />
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                <strong className="text-teal-soft">
                  {activeScenario.recommendation.netSavingsPct}% Net Savings
                </strong>{" "}
                vs. volatile spot baseline
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* 4 Key Metrics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-dim">
            <span className="font-semibold uppercase tracking-wider">P50 Base Landed Cost</span>
            <DollarSign size={14} className="text-teal-soft" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-teal-soft">
            ${activeScenario.recommendation.expectedLandedCostP50.toFixed(2)}
            <span className="text-xs font-normal text-ink-dim">/MT</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Optimal expected rate under MILP solution</p>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-dim">
            <span className="font-semibold uppercase tracking-wider">P90 Stress Market Ceiling</span>
            <ShieldAlert size={14} className="text-amber-signal" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-signal">
            ${activeScenario.recommendation.stressCeilingP90.toFixed(2)}
            <span className="text-xs font-normal text-ink-dim">/MT</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Maximum adverse tail under 10k Monte Carlo runs</p>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-dim">
            <span className="font-semibold uppercase tracking-wider">Value-at-Risk Downside Hedge</span>
            <ShieldCheck size={14} className="text-cyan-glow" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-cyan-glow">
            ${(activeScenario.task.simulateDetails.varHedgeUsd / 1000000).toFixed(1)}M
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Insulated risk against Baltic paper rally</p>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-dim">
            <span className="font-semibold uppercase tracking-wider">Lightering Cost Avoided</span>
            <Anchor size={14} className="text-teal-soft" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-teal-soft">
            ${activeScenario.recommendation.lighteringComparison.dhamraDirectSavingsPerMt.toFixed(2)}
            <span className="text-xs font-normal text-ink-dim">/MT</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">Direct Dhamra berthing vs. Haldia offshore barge</p>
        </GlassPanel>
      </div>

      {/* Main Analysis Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Vessel Strategy & Port Hydrographics */}
        <div className="space-y-6 lg:col-span-2">
          {/* Vessel Selection Strategy */}
          <GlassPanel className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                <Ship size={14} className="text-cyan-glow" />
                <span>Recommended Vessel Strategy</span>
              </div>
              <Badge tone="teal">
                <CheckCircle2 size={12} />
                <span>{r.recommendedVessel.fitScorePct}% Fit Score</span>
              </Badge>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-glow/10 text-cyan-glow">
                <Ship size={32} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-ink-bright">
                  {r.recommendedVessel.vesselClass} Fleet (2 × 75,000 DWT)
                </h3>
                <p className="font-mono text-xs text-ink-dim">
                  Loaded Draft: {r.recommendedVessel.draft}m · Beam: 32.2m · Speed: 13.8 kts · Direct Berth Feasible
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl">
              <Image
                src={getVesselImage(r.recommendedVessel.vesselClass)}
                alt={`${r.recommendedVessel.vesselClass} bulk carrier`}
                width={800}
                height={260}
                className="h-32 w-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="mt-4 rounded-xl border border-void-border bg-void-surface/50 p-4 text-xs leading-relaxed text-ink-muted">
              {r.recommendedVessel.reasoning}
            </div>
          </GlassPanel>

          {/* Port Hydrographic & Draft Feasibility Matrix */}
          <GlassPanel className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                <Anchor size={14} className="text-cyan-glow" />
                <span>Port Hydrographic &amp; Lightering Feasibility</span>
              </div>
              <span className="text-[11px] text-ink-dim">PostGIS Spatial Validation</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-teal-soft/30 bg-teal-deep/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-soft">Dhamra Port (Recommended)</span>
                  <span className="rounded bg-teal-deep/40 px-2 py-0.5 font-mono text-[10px] text-teal-soft">
                    18.0m Draft Limit
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                  100% direct berthing for Panamax bulkers. <strong className="text-teal-soft">Zero lightering penalty</strong>. Dedicated deep-water mechanised coal conveyor directly connected to Kalinganagar rail siding.
                </p>
              </div>

              <div className="rounded-xl border border-rose-signal/30 bg-rose-signal/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-signal">Haldia Port (Rejected)</span>
                  <span className="rounded bg-rose-signal/20 px-2 py-0.5 font-mono text-[10px] text-rose-signal">
                    8.5m Draft Limit
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                  Capesize (16.2m draft) and loaded Panamax violate shallow draft limit. Requires Sagar / Sandheads offshore lightering with floating crane (<strong className="text-rose-signal">+$4.50/MT penalty</strong>).
                </p>
              </div>
            </div>
          </GlassPanel>

          {/* Backhaul Monetization Analysis */}
          <GlassPanel className="p-6" glow="teal">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-soft">
              <Fuel size={14} />
              <span>Backhaul Monetization &amp; Ballast Elimination</span>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              {activeScenario.recommendation.backhaulMonetizationText}
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-teal-deep/20 p-3 text-xs text-teal-soft">
              <CheckCircle2 size={16} />
              <span>
                Export Iron Ore fixture ex-Paradip to Qingdao negotiated: eliminates ballast fuel burn and generates an estimated <strong>+$180,000 gross voyage recovery</strong>.
              </span>
            </div>
          </GlassPanel>

          {/* Contract Comparison Chart */}
          <GlassPanel className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                <FileCheck2 size={14} className="text-cyan-glow" />
                <span>Contract Type Financial Comparison</span>
              </div>
              <Badge tone="teal">Time Charter Optimal</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tick={{ fill: chart.axisText, fontSize: 11 }}
                      axisLine={{ stroke: chart.grid }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: chart.axisText, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatUsd(v, true)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: chart.tooltipBg,
                        border: `1px solid ${chart.tooltipBorder}`,
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatUsd(v)}
                      labelStyle={{ color: chart.tooltipLabel }}
                    />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.isRecommended ? "#2DD4BF" : chart.grid} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center gap-2.5">
                {r.contractComparison.map((c) => (
                  <div
                    key={c.type}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3.5 transition-all",
                      c.type === r.recommendedContractType
                        ? "border-teal-soft/60 bg-teal-deep/15 shadow-glow-teal"
                        : "border-void-border bg-void-surface/50"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-bright">{c.type}</span>
                        {c.type === r.recommendedContractType && <Badge tone="teal">Selected</Badge>}
                      </div>
                      <div className="font-mono text-[11px] text-ink-dim">${c.ratePerMt.toFixed(2)}/MT</div>
                    </div>
                    <div className="font-mono text-sm font-bold text-ink-bright">
                      {formatUsd(c.totalCostUsd, true)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column: Execution Panel, 2FA Trigger, Risks */}
        <div className="space-y-6">
          {/* 2FA Escrow Execution Card */}
          <GlassPanel className="p-6" glow="cyan">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-glow">
              <Lock size={14} />
              <span>Smart Escrow Execution</span>
            </div>
            <h3 className="text-lg font-bold text-ink-bright">Execute 2FA Fixture Lock</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Lock fixture #{activeScenario.escrow.fixtureId} via 3-milestone cryptographic escrow ledger with partner working capital credit line.
            </p>

            <div className="my-4 space-y-2 rounded-xl border border-void-border bg-void-surface/60 p-3.5 font-mono text-xs">
              <div className="flex justify-between text-ink-dim">
                <span>Vessel:</span>
                <span className="font-bold text-ink-bright">{activeScenario.escrow.vesselName}</span>
              </div>
              <div className="flex justify-between text-ink-dim">
                <span>Shipowner:</span>
                <span className="text-ink-bright">{activeScenario.escrow.shipOwner}</span>
              </div>
              <div className="flex justify-between text-ink-dim">
                <span>Total Escrow Value:</span>
                <span className="font-bold text-cyan-glow">{formatUsd(activeScenario.escrow.totalValueUsd)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApproveAndLock}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow py-3.5 text-sm font-bold text-void shadow-glow-cyan transition-all hover:opacity-90"
            >
              <Lock size={16} />
              <span>Approve &amp; Lock Fixture (2FA)</span>
              <ArrowRight size={16} />
            </button>
          </GlassPanel>

          {/* Risk Factors */}
          <GlassPanel className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
              <ShieldAlert size={14} className="text-amber-signal" />
              <span>Monitored Risk Factors</span>
            </div>
            <Badge tone={riskTone(r.riskLevel)} className="mb-3 text-xs font-bold">
              {r.riskLevel} Risk Profile
            </Badge>
            <ul className="space-y-2">
              {r.riskFactors.map((factor, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-signal" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>

          {/* Market Entry Timing */}
          <GlassPanel className="p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
              <CalendarClock size={14} className="text-teal-soft" />
              <span>Optimal Entry Window</span>
            </div>
            <div className="font-mono text-base font-bold text-teal-soft">
              {r.forecast.optimalEntryWindowStart} → {r.forecast.optimalEntryWindowEnd}
            </div>
            <div className="mt-1 text-xs text-ink-dim">
              {r.forecast.confidencePct}% Confidence · Model predicts rate surge thereafter
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

