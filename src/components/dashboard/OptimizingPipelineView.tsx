"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Compass,
  Cpu,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useRouter } from "next/navigation";
import { useWorkflow } from "@/lib/workflow-context";
import Link from "next/link";

interface StepConfig {
  id: "PREDICT" | "CONSTRAIN" | "OPTIMIZE" | "SIMULATE";
  title: string;
  subtitle: string;
  icon: any;
  durationMs: number;
}

export function OptimizingPipelineView({ taskId }: { taskId?: string }) {
  const router = useRouter();
  const { activeScenario, customRequest, derivedState, scenarioId } = useWorkflow();

  const task = derivedState.task;
  const request = customRequest || derivedState.request;
  const rec = derivedState.recommendation;

  const steps: StepConfig[] = useMemo(() => [
    {
      id: "PREDICT",
      title: "1. PREDICT: Temporal Fusion Transformer",
      subtitle: `Computing 60-day freight curve & parsing FFA forward paper rally (+${task.predictDetails.trendPct}%)`,
      icon: TrendingUp,
      durationMs: 2000,
    },
    {
      id: "CONSTRAIN",
      title: "2. CONSTRAIN: PostGIS Hydrographic Check",
      subtitle: `Evaluating draft constraints & direct berthing across candidate discharge ports`,
      icon: Compass,
      durationMs: 2200,
    },
    {
      id: "OPTIMIZE",
      title: "3. OPTIMIZE: MILP Portfolio Solver",
      subtitle: `Google OR-Tools solving ${task.optimizeDetails.periodCoveragePct}% Period / ${task.optimizeDetails.spotFlexibilityPct}% Spot split`,
      icon: Cpu,
      durationMs: 2200,
    },
    {
      id: "SIMULATE",
      title: "4. SIMULATE: Monte Carlo Engine",
      subtitle: `10,000 paths: P50 $${task.simulateDetails.p50BaseCostPerMt.toFixed(2)}/MT, P90 $${task.simulateDetails.p90CeilingCostPerMt.toFixed(2)}/MT ($${(task.simulateDetails.varHedgeUsd / 1000000).toFixed(1)}M VaR hedge)`,
      icon: BarChart3,
      durationMs: 1800,
    },
  ], [task]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{ text: string; time: string; tone: "info" | "warn" | "success" }>>([]);

  const currentTaskId = taskId || task.taskId || "8f7e2c1a";

  useEffect(() => {
    // Step-by-step sequential animation
    const timeouts: NodeJS.Timeout[] = [];

    // Initial logs
    addLog(`Task [${currentTaskId}] spawned via Celery worker pool`, "info");
    addLog(`Model initialized: ${task.predictDetails.modelName}`, "info");

    let accumulatedTime = 0;

    steps.forEach((step, idx) => {
      accumulatedTime += step.durationMs;

      const t = setTimeout(() => {
        setCurrentStepIndex(idx + 1);
        setCompletedSteps((prev) => [...prev, step.id]);

        if (step.id === "PREDICT") {
          addLog(task.predictDetails.summary, "info");
          addLog(task.predictDetails.ffaSignal, "info");
          addLog(task.predictDetails.weatherStatus, "warn");
        } else if (step.id === "CONSTRAIN") {
          addLog(task.constrainDetails.hydrographicCheck, "info");
          addLog(task.constrainDetails.capesizeDraftViolation, "warn");
          addLog(task.constrainDetails.dhamraDirectBerthing, "success");
        } else if (step.id === "OPTIMIZE") {
          addLog(task.optimizeDetails.summary, "info");
          addLog(`Optimal allocation: ${task.optimizeDetails.vesselAllocation}`, "success");
        } else if (step.id === "SIMULATE") {
          addLog(task.simulateDetails.summary, "success");
          addLog(rec.backhaulMonetizationText, "success");
          setIsDone(true);
        }
      }, accumulatedTime);

      timeouts.push(t);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [currentTaskId, task, rec, steps]);

  function addLog(text: string, tone: "info" | "warn" | "success") {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLogs((prev) => [...prev, { text, time, tone }]);
  }

  const overallProgressPct = Math.min(100, Math.round(((completedSteps.length) / steps.length) * 100));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-glow/10 px-2 py-0.5 text-xs font-bold tracking-wider text-cyan-glow uppercase">
              Act II &amp; III: Asynchronous Optimization Engine
            </span>
            <span className="text-xs text-ink-dim">•</span>
            <span className="font-mono text-xs text-cyan-glow">Task ID: #{currentTaskId}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-bright sm:text-3xl">
            Multi-Voyage OR-Tools &amp; TFT Pipeline
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Executing 4-stage optimization pipeline for{" "}
            <strong className="text-ink-bright">
              {request.quantityMt.toLocaleString()} MT {request.commodity}
            </strong>{" "}
            ({request.originPortName} → {request.selectedDischargePortName}).
          </p>
        </div>

        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Link
              href={`/dashboard/recommendation?taskId=${currentTaskId}&scenario=${scenarioId}`}
              className="flex items-center gap-2 rounded-xl bg-cyan-glow px-5 py-3 text-sm font-bold text-void shadow-glow-cyan transition-all hover:opacity-95"
            >
              <span>View Action Cockpit</span>
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      <GlassPanel className="p-5" glow="cyan">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-muted uppercase tracking-wider">
            {isDone ? "Optimization Complete (All 4 Stages Verified)" : `Executing Stage ${Math.min(4, completedSteps.length + 1)} of 4...`}
          </span>
          <span className="font-mono text-cyan-glow">{overallProgressPct}%</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-void-border/60">
          <motion.div
            className="h-full bg-cyan-glow shadow-glow-cyan transition-all duration-500"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>
      </GlassPanel>

      {/* 4-Stage Interactive Pipeline Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Stage 1: PREDICT */}
        <StageCard
          step={steps[0]}
          isCompleted={completedSteps.includes("PREDICT")}
          isActive={currentStepIndex === 0 && !completedSteps.includes("PREDICT")}
        >
          <div className="space-y-2 text-xs text-ink-muted">
            <div className="flex items-center justify-between rounded-lg bg-void-surface/60 p-2.5">
              <span>Forecast Model:</span>
              <span className="font-mono font-bold text-ink-bright">
                {task.predictDetails.modelName}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-void-surface/60 p-2.5">
              <span>FFA 60-Day Paper Signal:</span>
              <span className="font-mono font-bold text-cyan-glow">
                +{task.predictDetails.trendPct}% (Bullish Surge)
              </span>
            </div>
            <div className="rounded-lg border border-amber-signal/30 bg-amber-signal/10 p-2.5 text-amber-signal">
              {task.predictDetails.weatherStatus}
            </div>
          </div>
        </StageCard>

        {/* Stage 2: CONSTRAIN */}
        <StageCard
          step={steps[1]}
          isCompleted={completedSteps.includes("CONSTRAIN")}
          isActive={currentStepIndex === 1 && !completedSteps.includes("CONSTRAIN")}
        >
          <div className="space-y-2 text-xs text-ink-muted">
            <div className="rounded-lg border border-rose-signal/30 bg-rose-signal/10 p-2.5 text-rose-signal">
              {task.constrainDetails.capesizeDraftViolation}
            </div>
            <div className="rounded-lg border border-teal-soft/30 bg-teal-deep/15 p-2.5 text-teal-soft">
              {task.constrainDetails.dhamraDirectBerthing}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-void-surface/60 p-2.5">
              <span>Recommended Vessel Class:</span>
              <span className="font-mono font-bold text-teal-soft">Panamax (75,000 DWT)</span>
            </div>
          </div>
        </StageCard>

        {/* Stage 3: OPTIMIZE */}
        <StageCard
          step={steps[2]}
          isCompleted={completedSteps.includes("OPTIMIZE")}
          isActive={currentStepIndex === 2 && !completedSteps.includes("OPTIMIZE")}
        >
          <div className="space-y-2 text-xs text-ink-muted">
            <div className="flex items-center justify-between rounded-lg bg-void-surface/60 p-2.5">
              <span>MILP Solver:</span>
              <span className="font-mono font-bold text-ink-bright">
                {task.optimizeDetails.solver}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-cyan-glow/10 p-2.5 text-center">
                <div className="text-[11px] text-ink-dim">Period Multi-Voyage Lock</div>
                <div className="text-base font-bold text-cyan-glow">
                  {task.optimizeDetails.periodCoveragePct}% ({task.optimizeDetails.periodVoyages} Voyages)
                </div>
              </div>
              <div className="rounded-lg bg-void-surface/60 p-2.5 text-center">
                <div className="text-[11px] text-ink-dim">Spot Market Buffer</div>
                <div className="text-base font-bold text-ink-muted">
                  {task.optimizeDetails.spotFlexibilityPct}% ({task.optimizeDetails.spotVoyages} Voyages)
                </div>
              </div>
            </div>
            <p className="text-[11px] text-ink-dim leading-relaxed">
              Period lock insulates {request.targetSteelPlant} against FFA rallies while retaining spot flexibility.
            </p>
          </div>
        </StageCard>

        {/* Stage 4: SIMULATE */}
        <StageCard
          step={steps[3]}
          isCompleted={completedSteps.includes("SIMULATE")}
          isActive={currentStepIndex === 3 && !completedSteps.includes("SIMULATE")}
        >
          <div className="space-y-2 text-xs text-ink-muted">
            <div className="flex items-center justify-between rounded-lg bg-void-surface/60 p-2.5">
              <span>Monte Carlo Market Paths:</span>
              <span className="font-mono font-bold text-ink-bright">{task.simulateDetails.pathsRun.toLocaleString()} Simulated Paths</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-teal-deep/15 p-2.5">
                <div className="text-[11px] text-teal-soft">P50 Base Expected Cost</div>
                <div className="text-base font-bold text-teal-soft">
                  ${task.simulateDetails.p50BaseCostPerMt.toFixed(2)}/MT
                </div>
              </div>
              <div className="rounded-lg bg-amber-signal/10 p-2.5">
                <div className="text-[11px] text-amber-signal">P90 Adverse Ceiling</div>
                <div className="text-base font-bold text-amber-signal">
                  ${task.simulateDetails.p90CeilingCostPerMt.toFixed(2)}/MT
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-teal-soft/30 bg-teal-deep/10 p-2.5 text-teal-soft">
              <span>Value-at-Risk (VaR) Downside Hedge:</span>
              <span className="font-mono font-bold">${(task.simulateDetails.varHedgeUsd / 1000000).toFixed(1)}M Protection</span>
            </div>
          </div>
        </StageCard>
      </div>

      {/* Live Pipeline Telemetry Stream */}
      <GlassPanel className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted uppercase tracking-wider">
            <Clock size={14} className="text-cyan-glow" />
            <span>Celery Worker Real-Time Event Log</span>
          </div>
          <span className="font-mono text-[11px] text-ink-dim">{logs.length} events logged</span>
        </div>

        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-void p-3 font-mono text-xs">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-ink-dim">[{log.time}]</span>
              <span
                className={
                  log.tone === "success"
                    ? "text-teal-soft"
                    : log.tone === "warn"
                    ? "text-amber-signal"
                    : "text-ink-muted"
                }
              >
                {log.text}
              </span>
            </div>
          ))}
          {!isDone && (
            <div className="flex items-center gap-2 text-cyan-glow animate-pulse pt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-glow" />
              <span>Processing next heuristic optimization layer...</span>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* CTA Footer when Complete */}
      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-cyan-glow/40 bg-gradient-to-r from-cyan-glow/15 via-void-surface to-teal-deep/15 p-6 sm:flex-row shadow-glow-cyan"
        >
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-glow" />
              <h3 className="text-lg font-bold text-ink-bright">
                Optimization Complete: Gemini Pro Action Cockpit Ready
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Optimal strategy: Lock {request.contractDurationMonths || 3}-Month Period Multi-Voyage Contract via {request.selectedDischargePortName} for{" "}
              <strong className="text-teal-soft">
                {rec.netSavingsPct}% Net Savings (~${rec.netSavingsUsd.toLocaleString()})
              </strong>.
            </p>
          </div>

          <Link
            href={`/dashboard/recommendation?taskId=${currentTaskId}&scenario=${scenarioId}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow px-6 py-3.5 text-sm font-bold text-void transition-all hover:opacity-90 sm:w-auto shadow-glow-cyan"
          >
            <span>Enter Action Cockpit</span>
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}

function StageCard({
  step,
  isCompleted,
  isActive,
  children,
}: {
  step: StepConfig;
  isCompleted: boolean;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const Icon = step.icon;

  return (
    <GlassPanel
      className={`p-5 transition-all ${
        isActive
          ? "border-cyan-glow ring-1 ring-cyan-glow shadow-glow-cyan"
          : isCompleted
          ? "border-teal-soft/40"
          : "opacity-60"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isCompleted
                ? "bg-teal-deep/30 text-teal-soft"
                : isActive
                ? "bg-cyan-glow/20 text-cyan-glow animate-pulse"
                : "bg-void-border/40 text-ink-dim"
            }`}
          >
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-bright">{step.title}</h3>
            <p className="text-[11px] text-ink-dim">{step.subtitle}</p>
          </div>
        </div>

        {isCompleted ? (
          <span className="flex items-center gap-1 rounded-full bg-teal-deep/20 px-2 py-0.5 text-[11px] font-bold text-teal-soft">
            <CheckCircle2 size={12} />
            Done
          </span>
        ) : isActive ? (
          <span className="flex items-center gap-1 rounded-full bg-cyan-glow/20 px-2 py-0.5 text-[11px] font-bold text-cyan-glow animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow animate-ping" />
            Active
          </span>
        ) : (
          <span className="rounded-full bg-void-border/40 px-2 py-0.5 text-[11px] text-ink-dim">
            Queued
          </span>
        )}
      </div>

      {children}
    </GlassPanel>
  );
}

