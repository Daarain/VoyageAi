import Link from "next/link";
import { ArrowLeft, Compass, ShieldCheck, Cpu, Database, Anchor, Globe2 } from "lucide-react";
import { HomeNav } from "@/components/home/HomeNav";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | VoyageAI Pro",
  description: "Learn about VoyageAI Pro's AI-driven freight forecasting, hydrographic routing, and smart chartering algorithms.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-void text-ink-primary">
      <HomeNav />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-50" />
      
      <main className="relative z-10 mx-auto max-w-[1200px] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-glow hover:underline"
          >
            <ArrowLeft size={14} /> Back to Overview
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-glow animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-glow">
              Enterprise Maritime Tech
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-white">
            About VoyageAI Pro
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            VoyageAI Pro brings high-frequency predictive modeling, hydrodynamic routing simulations, and automated chartering contract intelligence to bulk shipping operations across the Indian Ocean and global trade lanes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GlassPanel className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
              <Cpu size={20} />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Neural Freight Forecasting</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Trained on 14+ years of Baltic Dry Index (BDI), bunker oil pricing, and congestion telemetry to forecast spot and forward rates up to 180 days with confidence intervals.
            </p>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft/15 text-teal-soft">
              <Compass size={20} />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Hydrographic Optimization</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Calculates real Great Circle and choke-point-aware routes (Suez Canal, Malacca Strait, Cape of Good Hope) with live weather, tide, and draft depth constraints.
            </p>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-signal/15 text-amber-signal">
              <ShieldCheck size={20} />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Smart Contract & Escrow</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Automates CP (Charter Party) clauses, demurrage calculation, and staged milestone escrow releases triggered by cryptographically verified Notice of Readiness (NOR).
            </p>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-400">
              <Anchor size={20} />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Port Intelligence</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Monitors draft limits, waiting times, lightering charges, and berth productivity across key discharge terminals (Dhamra, Haldia, Paradip, Vizag).
            </p>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
              <Globe2 size={20} />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Global AIS Tracking</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Live vessel position telemetry, speed analysis, remaining distance, and ETA calculations updated in real time.
            </p>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
              <Database size={20} />
            </div>
            <h2 className="mt-4 text-base font-bold text-white">Verifiable Audit Logs</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Immutable logging of every fixture approval, rate override, and bunker price tick for compliance and ESG reporting.
            </p>
          </GlassPanel>
        </div>

        <div className="mt-10 flex items-center justify-between rounded-2xl border border-glass-border bg-panel-raised/50 p-6 backdrop-blur-md">
          <div>
            <h3 className="text-base font-bold text-white">Ready to explore active charter fixtures?</h3>
            <p className="mt-1 text-xs text-ink-muted">Access the live simulation or test a custom cargo request.</p>
          </div>
          <Link
            href="/dashboard/request"
            className="rounded-xl bg-cyan-glow px-5 py-2.5 text-xs font-bold text-void shadow-glow-cyan hover:opacity-95"
          >
            Launch Pipeline →
          </Link>
        </div>
      </main>
    </div>
  );
}
