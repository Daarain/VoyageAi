"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  Repeat,
  Calendar,
  FileClock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CloudSun,
  TrendingUp,
  Building2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useRouter } from "next/navigation";
import { useWorkflow } from "@/lib/workflow-context";
import { ALL_DEMO_SCENARIOS } from "@/lib/demo-scenarios";
import { useSession } from "@/lib/session-context";
import { supabase } from "@/lib/supabase";

const cargoTypes = [
  "Coking Coal",
  "Thermal Coal",
  "Iron Ore",
  "Grain",
  "Bauxite",
  "Fertilizer",
  "Steel Products",
];

const originPorts = [
  { name: "Gladstone, Australia", country: "Australia", isSparse: false },
  { name: "Maputo, Mozambique", country: "Mozambique", isSparse: true },
  { name: "Newcastle, Australia", country: "Australia", isSparse: false },
  { name: "Richards Bay, South Africa", country: "South Africa", isSparse: false },
  { name: "Singapore Port", country: "Singapore", isSparse: false },
  { name: "Rotterdam, Netherlands", country: "Netherlands", isSparse: false },
];

const candidateDischargePortOptions = [
  { id: "dhamra", name: "Dhamra Port", draftM: 18.0, desc: "Deep-draft direct berthing (0 penalty)" },
  { id: "paradip", name: "Paradip Port", draftM: 18.0, desc: "High queue congestion (4.8d wait)" },
  { id: "haldia", name: "Haldia Port", draftM: 8.5, desc: "Draft limit 8.5m (Sagar Lightering +$4.50/MT)" },
  { id: "vizag", name: "Vizag Port", draftM: 16.5, desc: "Alternative East Coast deep berth" },
];

const steelPlants = [
  { name: "Tata Steel Kalinganagar Plant (Odisha)", railHub: "Dhamra / Paradip Rail Corridor" },
  { name: "Tata Steel Jamshedpur Plant (Jharkhand)", railHub: "East Coast / Haldia Line" },
  { name: "JSW Steel Angul Plant (Odisha)", railHub: "Dhamra Coal Siding" },
  { name: "JSW Steel Vijayanagar (Karnataka)", railHub: "South-Central Freight Corridor" },
];

export function RequestForm() {
  const router = useRouter();
  const { scenarioId, activeScenario, selectScenario, runOptimization } = useWorkflow();
  const { user } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [cargoType, setCargoType] = useState(activeScenario.request.commodity || "Coking Coal");
  const [quantity, setQuantity] = useState(String(activeScenario.request.quantityMt || 150000));
  const [origin, setOrigin] = useState(activeScenario.request.originPortName || "Gladstone, Australia");
  const [candidatePorts, setCandidatePorts] = useState<string[]>(
    activeScenario.request.candidateDischargePorts || ["Dhamra", "Paradip", "Haldia", "Vizag"]
  );
  const [steelPlant, setSteelPlant] = useState(
    activeScenario.request.targetSteelPlant || "Tata Steel Kalinganagar Plant (Odisha)"
  );
  const [voyages, setVoyages] = useState(String(activeScenario.request.numberOfVoyages || 2));
  const [startDate, setStartDate] = useState(activeScenario.request.laycanStart || "2026-10-15");
  const [endDate, setEndDate] = useState(activeScenario.request.laycanEnd || "2026-10-30");
  const [durationMonths, setDurationMonths] = useState(
    String(activeScenario.request.contractDurationMonths || 3)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync whenever activeScenario changes from scenario picker
  useEffect(() => {
    setCargoType(activeScenario.request.commodity);
    setQuantity(String(activeScenario.request.quantityMt));
    setOrigin(activeScenario.request.originPortName);
    setCandidatePorts(activeScenario.request.candidateDischargePorts);
    setSteelPlant(activeScenario.request.targetSteelPlant);
    setVoyages(String(activeScenario.request.numberOfVoyages));
    setStartDate(activeScenario.request.laycanStart);
    setEndDate(activeScenario.request.laycanEnd);
    setDurationMonths(String(activeScenario.request.contractDurationMonths));
  }, [activeScenario]);

  const selectedOriginObj = originPorts.find((o) => o.name === origin) || originPorts[0];
  const isSparseCorridor = selectedOriginObj.isSparse || activeScenario.request.isSparseCorridor;

  function togglePort(portName: string) {
    setCandidatePorts((current) => {
      if (current.includes(portName)) {
        if (current.length === 1) return current; // Keep at least one
        return current.filter((p) => p !== portName);
      }
      return [...current, portName];
    });
  }

  function handleScenarioPreset(id: string) {
    selectScenario(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!cargoType) nextErrors.cargoType = "Select a cargo type.";
    if (!quantity || Number(quantity) <= 0 || Number(quantity) > 2000000)
      nextErrors.quantity = "Enter a valid quantity (1 - 2,000,000 MT).";
    if (!origin) nextErrors.origin = "Select an origin port.";
    if (candidatePorts.length === 0) nextErrors.candidatePorts = "Select at least one candidate discharge port.";
    if (!voyages || Number(voyages) <= 0) nextErrors.voyages = "Enter at least 1 voyage.";
    if (!startDate) nextErrors.startDate = "Select laycan start date.";
    if (!endDate) nextErrors.endDate = "Select laycan end date.";
    if (startDate && endDate && endDate <= startDate)
      nextErrors.endDate = "Laycan end date must be after start date.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    // Generate a unique requestId so the backend can attribute this to the DB row
    const requestId = crypto.randomUUID();

    // Save request to Supabase before running AI
    if (user?.id) {
      await supabase.from("chartering_requests").insert({
        id: requestId,
        user_id: user.id,
        cargo_type: cargoType,
        cargo_quantity_mt: Number(quantity),
        origin_port: origin,
        destination_ports: candidatePorts,
        number_of_voyages: Number(voyages),
        laycan_start: startDate,
        laycan_end: endDate,
        contract_duration_months: Number(durationMonths) || null,
        status: "Processing",
      });
    }

    const taskId = await runOptimization({
      commodity: cargoType,
      quantityMt: Number(quantity),
      originPortName: origin,
      candidateDischargePorts: candidatePorts,
      targetSteelPlant: steelPlant,
      laycanStart: startDate,
      laycanEnd: endDate,
      numberOfVoyages: Number(voyages),
      contractDurationMonths: Number(durationMonths) || null,
      scenarioId,
      requestId,
    });

    // Store in session storage for legacy readers
    try {
      window.sessionStorage.setItem(
        "voyageai-vessel-request",
        JSON.stringify({
          cargoType,
          quantity: Number(quantity),
          origin,
          destination: candidatePorts[0] || "Dhamra",
          targetSteelPlant: steelPlant,
          numberOfVoyages: Number(voyages),
          laycanStart: startDate,
          laycanEnd: endDate,
          taskId,
        })
      );
    } catch {
      // ignore
    }

    router.push(`/dashboard/optimizing?taskId=${taskId}&scenario=${scenarioId}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-glow/10 px-2 py-0.5 text-xs font-bold tracking-wider text-cyan-glow uppercase">
              Act I: Procurement Demand Input
            </span>
            <span className="text-xs text-ink-dim">•</span>
            <span className="text-xs text-ink-muted">Captain Rajesh Nair (Chartering Desk)</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-bright sm:text-3xl">
            Create Chartering Request
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Configure bulk commodity parameters for multi-voyage hydrographic constraint check &amp; MILP portfolio optimization.
          </p>
        </div>
      </motion.div>

      {/* Preset Scenarios Selector Bar */}
      <GlassPanel className="p-4" glow="cyan">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted uppercase tracking-wider">
            <Sparkles size={14} className="text-cyan-glow" />
            <span>Select Demonstration Preset:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_DEMO_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleScenarioPreset(sc.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  scenarioId === sc.id
                    ? "bg-cyan-glow text-void shadow-glow-cyan"
                    : "border border-void-border bg-void-surface/80 text-ink-muted hover:border-cyan-glow/40 hover:text-ink-bright"
                }`}
              >
                {sc.name.split("→")[0].trim()} ({sc.request.quantityMt.toLocaleString()} MT)
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Live System Intelligence & Resilient Fallback Indicators */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-glow/25 bg-cyan-glow/5 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-glow">
            <TrendingUp size={14} />
            <span>Baltic FFA Forward Signal</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            Paper curve signaling <strong className="text-cyan-glow">+14% freight surge</strong> over next 45-60 days. Period lock recommended.
          </p>
        </div>

        <div
          className={`rounded-xl border p-3.5 ${
            isSparseCorridor
              ? "border-amber-signal/40 bg-amber-signal/10"
              : "border-teal-soft/30 bg-teal-deep/10"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${
              isSparseCorridor ? "text-amber-signal" : "text-teal-soft"
            }`}
          >
            <Layers size={14} />
            <span>Corridor Data Density</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            {isSparseCorridor ? (
              <>
                <strong className="text-amber-signal">Sparse-Data Corridor:</strong> Cold-Start Monte Carlo Proxy mode enabled.
              </>
            ) : (
              <>
                <strong className="text-teal-soft">Rich Corridor Data:</strong> Temporal Fusion Transformer (TFT) active with full historical telemetry.
              </>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-amber-signal/30 bg-amber-signal/5 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-signal">
            <CloudSun size={14} />
            <span>Weather API Status</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            <strong className="text-amber-signal">Live API Timeout:</strong> 30-Day Climatology Moving Averages seamlessly applied.
          </p>
        </div>
      </div>

      {/* Main Request Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <GlassPanel className="space-y-6 p-6 sm:p-8">
          {/* Commodity & Quantity */}
          <FieldGroup icon={Package} label="Bulk Cargo & Procurement Volume">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-ink-dim">Cargo Commodity Type</label>
                <select
                  className="input-field"
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                >
                  {cargoTypes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.cargoType} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-dim">Total Volume (Metric Tons)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 150000"
                  step={1000}
                />
                <FieldError message={errors.quantity} />
              </div>
            </div>
          </FieldGroup>

          {/* Origin Port & Target Steel Plant */}
          <FieldGroup icon={MapPin} label="Origin Terminal & End-Destination Plant">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-ink-dim">Origin Load Port</label>
                <select
                  className="input-field"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                >
                  {originPorts.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.isSparse ? "(Sparse Corridor)" : ""}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.origin} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-ink-dim">Target Steel Plant (Rail Siding)</label>
                <select
                  className="input-field"
                  value={steelPlant}
                  onChange={(e) => setSteelPlant(e.target.value)}
                >
                  {steelPlants.map((plant) => (
                    <option key={plant.name} value={plant.name}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FieldGroup>

          {/* Candidate Discharge Ports (Multi-Select Hydrographic Evaluator) */}
          <FieldGroup icon={Building2} label="Candidate Discharge Ports (Spatial Hydrographic Check)">
            <p className="mb-2 text-xs text-ink-muted">
              Select ports for PostGIS draft tolerance checks and Sagar lightering penalty comparisons:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {candidateDischargePortOptions.map((port) => {
                const isSelected = candidatePorts.includes(port.name.replace(" Port", ""));
                return (
                  <div
                    key={port.id}
                    onClick={() => togglePort(port.name.replace(" Port", ""))}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-cyan-glow/60 bg-cyan-glow/10 shadow-glow-cyan"
                        : "border-void-border bg-void-surface/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={16}
                          className={isSelected ? "text-cyan-glow" : "text-ink-dim"}
                        />
                        <span className="text-sm font-bold text-ink-bright">{port.name}</span>
                      </div>
                      <span className="rounded bg-void-border/40 px-2 py-0.5 text-[11px] font-mono text-cyan-glow">
                        {port.draftM}m Draft Limit
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-muted">{port.desc}</p>
                  </div>
                );
              })}
            </div>
            <FieldError message={errors.candidatePorts} />
          </FieldGroup>

          {/* Laycan Window & Multi-Voyage Schedule */}
          <FieldGroup icon={Calendar} label="Laycan Window & Voyage Program">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-ink-dim">Laycan Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                />
                <FieldError message={errors.startDate} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-ink-dim">Laycan End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                />
                <FieldError message={errors.endDate} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-ink-dim">Program Voyages</label>
                <input
                  type="number"
                  value={voyages}
                  onChange={(e) => setVoyages(e.target.value)}
                  className="input-field"
                  min={1}
                  max={12}
                />
                <FieldError message={errors.voyages} />
              </div>
            </div>
          </FieldGroup>

          {/* Contract Duration */}
          <FieldGroup icon={FileClock} label="Contract Duration & Structure">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-ink-dim">Period Duration (Months)</label>
                <input
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="input-field"
                  min={1}
                  max={24}
                  placeholder="3"
                />
              </div>
              <div className="flex items-center rounded-xl border border-void-border bg-void-surface/40 p-3 text-xs text-ink-muted">
                <span className="leading-relaxed">
                  Optimization will solve for optimal split between <strong>Period Time Charter</strong> (to hedge Baltic FFA rally) and <strong>Spot Voyages</strong> (for flexibility).
                </span>
              </div>
            </div>
          </FieldGroup>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-glow py-4 text-base font-bold text-void transition-all hover:opacity-90 disabled:opacity-50 shadow-glow-cyan"
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-void border-t-transparent" />
                  <span>Initializing OR-Tools MILP Solver &amp; TFT Forecast...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Run Multi-Voyage Optimization</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </GlassPanel>
      </motion.form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-rose-signal" role="alert">
      {message}
    </p>
  ) : null;
}

function FieldGroup({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-void-border/60 pb-6 last:border-none last:pb-0">
      <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-bright">
        <Icon size={14} className="text-cyan-glow" />
        {label}
      </label>
      {children}
    </div>
  );
}

