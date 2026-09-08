"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ship,
  PiggyBank,
  ShieldAlert,
  ClipboardList,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  PlusCircle,
  Cpu,
  Lock,
  Compass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { KPICard } from "@/components/ui/KPICard";
import { Badge, riskTone } from "@/components/ui/Badge";
import type {
  DashboardKpis,
  MarketInsights,
  RiskAlert,
  CharteringRequest,
} from "@/lib/types";

const statusTone = {
  Draft: "muted",
  Processing: "amber",
  Recommended: "cyan",
  Approved: "teal",
  Rejected: "rose",
} as const;

export function CommandCenterOverview({
  kpis,
  market,
  alerts,
  requests,
}: {
  kpis: DashboardKpis;
  market: MarketInsights;
  alerts: RiskAlert[];
  requests: CharteringRequest[];
}) {
  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-bright">Maritime Command Center</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Fleet-wide operational summary across every active chartering decision and multi-voyage contract
          </p>
        </div>

        <Link
          href="/dashboard/request"
          className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-xs font-bold text-void shadow-glow-cyan transition-all hover:opacity-90 self-start sm:self-auto"
        >
          <PlusCircle size={15} />
          <span>New Procurement Run</span>
        </Link>
      </motion.div>

      {/* 5-Act Workflow Fast Track */}
      <GlassPanel className="p-4 sm:p-5" glow="cyan">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-glow">
            <Sparkles size={14} />
            <span>End-to-End Procurement &amp; Settlement Flow</span>
          </div>
          <span className="text-[11px] text-ink-dim">Acts I – V Live Demo</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/request"
            className="group flex items-center justify-between rounded-xl border border-void-border bg-void-surface/60 p-3 transition-all hover:border-cyan-glow/50 hover:bg-void-surface"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-glow/10 text-cyan-glow group-hover:scale-105 transition-transform">
                <PlusCircle size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-ink-bright">1. Request Form</div>
                <div className="text-[10px] text-ink-dim">Gladstone / Maputo / Newcastle</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-ink-dim group-hover:text-cyan-glow group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/dashboard/optimizing"
            className="group flex items-center justify-between rounded-xl border border-void-border bg-void-surface/60 p-3 transition-all hover:border-cyan-glow/50 hover:bg-void-surface"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-glow/10 text-cyan-glow group-hover:scale-105 transition-transform">
                <Cpu size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-ink-bright">2. 4-Stage Engine</div>
                <div className="text-[10px] text-ink-dim">TFT + PostGIS + OR-Tools + MC</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-ink-dim group-hover:text-cyan-glow group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/dashboard/recommendation"
            className="group flex items-center justify-between rounded-xl border border-void-border bg-void-surface/60 p-3 transition-all hover:border-cyan-glow/50 hover:bg-void-surface"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-deep/30 text-teal-soft group-hover:scale-105 transition-transform">
                <Compass size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-ink-bright">3. Action Cockpit</div>
                <div className="text-[10px] text-ink-dim">8.4% Savings ($520k)</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-ink-dim group-hover:text-teal-soft group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/dashboard/escrow"
            className="group flex items-center justify-between rounded-xl border border-void-border bg-void-surface/60 p-3 transition-all hover:border-cyan-glow/50 hover:bg-void-surface"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-deep/30 text-teal-soft group-hover:scale-105 transition-transform">
                <Lock size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-ink-bright">4. 2FA Smart Escrow</div>
                <div className="text-[10px] text-ink-dim">3-Tier Milestone Release</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-ink-dim group-hover:text-teal-soft group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </GlassPanel>


      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Active Voyages" value={kpis.activeVoyages} icon={Ship} accent="cyan" index={0} />
        <KPICard
          label="Total Savings"
          value={`$${(kpis.totalSavingsUsd / 1_000_000).toFixed(2)}M`}
          icon={PiggyBank}
          accent="teal"
          index={1}
        />
        <KPICard
          label="Portfolio Risk"
          value={kpis.portfolioRiskLevel}
          icon={ShieldAlert}
          accent="amber"
          index={2}
        />
        <KPICard label="Idle Vessels" value={kpis.idleVesselsCount} icon={Ship} accent="rose" index={3} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <GlassPanel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
                <ClipboardList size={13} className="text-cyan-glow" /> Recent Chartering Requests
              </div>
              <Link
                href="/dashboard/chartering"
                className="flex items-center gap-1 text-xs font-medium text-cyan-glow hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-panel-raised/60 p-3.5"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {r.cargoType} · {(r.cargoQuantityMt / 1000).toFixed(0)}K MT
                    </div>
                    <div className="text-xs text-ink-dim">
                      {r.numberOfVoyages} voyages · requested by {r.requestedBy}
                    </div>
                  </div>
                  <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassPanel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
                <ShieldAlert size={13} className="text-amber-signal" /> Active Risk Alerts
              </div>
              <Link
                href="/dashboard/risk"
                className="flex items-center gap-1 text-xs font-medium text-cyan-glow hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {activeAlerts.length === 0 && (
                <p className="text-xs text-ink-dim">No unacknowledged alerts.</p>
              )}
              {activeAlerts.map((a) => (
                <div key={a.id} className="rounded-xl bg-panel-raised/60 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={riskTone(a.level)}>{a.level}</Badge>
                    <span className="text-xs font-semibold">{a.title}</span>
                  </div>
                  <div className="text-[11px] text-ink-dim">{a.route}</div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-5"
      >
        <GlassPanel className="p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
            Market Snapshot
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MarketItem
              icon={market.freightTrendDirection === "down" ? TrendingDown : TrendingUp}
              label="Freight Trend"
              value={`${market.freightTrendDirection === "down" ? "↓" : "↑"} ${market.freightTrendPct}%`}
              tone={market.freightTrendDirection === "down" ? "teal" : "rose"}
            />
            <MarketItem label="Demand Level" value={market.demandLevel} tone="amber" />
            <MarketItem label="Port Congestion" value={market.portCongestion} tone="amber" />
            <MarketItem label="Market Sentiment" value={market.marketSentiment} tone="cyan" />
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

function MarketItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  tone: "cyan" | "teal" | "amber" | "rose";
}) {
  const toneColor = {
    cyan: "text-cyan-glow",
    teal: "text-teal-soft",
    amber: "text-amber-signal",
    rose: "text-rose-signal",
  }[tone];
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ink-dim">
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className={`text-sm font-bold ${toneColor}`}>{value}</div>
    </div>
  );
}
