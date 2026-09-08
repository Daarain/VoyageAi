"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { formatUsd, cn } from "@/lib/utils";
import { useChartTheme } from "@/lib/use-chart-theme";
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
import {
  BASE_CARGO_MT,
  BASE_FUEL_USD_PER_MT,
  calculateContractCosts,
} from "@/lib/contract-simulator";

// Baseline figures sourced from the sample recommendation (SIH-style
// transparency: the simulator recomputes from these bases using the
// adjusted assumptions below — REQ-3.3.1/3.3.3).

export default function ContractSimulatorPage() {
  const chart = useChartTheme();
  const [freightAdjustPct, setFreightAdjustPct] = useState(0);
  const [fuelPrice, setFuelPrice] = useState(BASE_FUEL_USD_PER_MT);
  const [cargoQty, setCargoQty] = useState(BASE_CARGO_MT);

  const results = useMemo(() => {
    return calculateContractCosts(freightAdjustPct, fuelPrice, cargoQty);
  }, [freightAdjustPct, fuelPrice, cargoQty]);

  const cheapest = results.reduce((a, b) => (b.totalCost < a.totalCost ? b : a));
  const spotCost = results.find((r) => r.type === "Spot")!.totalCost;
  const savingsVsSpot = spotCost - cheapest.totalCost;

  function reset() {
    setFreightAdjustPct(0);
    setFuelPrice(BASE_FUEL_USD_PER_MT);
    setCargoQty(BASE_CARGO_MT);
  }

  return (
    <div className="mx-auto max-w-[1300px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Contract Simulator</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Adjust market assumptions and see spot / CVC / time-charter costs recompute live
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <GlassPanel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
                <SlidersHorizontal size={13} className="text-cyan-glow" /> Assumptions
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-[11px] font-medium text-ink-dim hover:text-ink-primary"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>

            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Freight Rate Adjustment</span>
                <span className="font-mono font-semibold text-cyan-glow">
                  {freightAdjustPct > 0 ? "+" : ""}
                  {freightAdjustPct}%
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={freightAdjustPct}
                onChange={(e) => setFreightAdjustPct(Number(e.target.value))}
                className="w-full accent-cyan-glow"
              />
            </div>

            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Bunker Fuel Price</span>
                <span className="font-mono font-semibold text-cyan-glow">${fuelPrice}/MT</span>
              </div>
              <input
                type="range"
                min={400}
                max={900}
                step={10}
                value={fuelPrice}
                onChange={(e) => setFuelPrice(Number(e.target.value))}
                className="w-full accent-cyan-glow"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Cargo Quantity</span>
                <span className="font-mono font-semibold text-cyan-glow">
                  {(cargoQty / 1000).toFixed(0)}K MT
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={1000000}
                step={10000}
                value={cargoQty}
                onChange={(e) => setCargoQty(Number(e.target.value))}
                className="w-full accent-cyan-glow"
              />
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <GlassPanel className="p-5 sm:p-6" glow="teal">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
                Recomputed Contract Costs
              </div>
              <Badge tone="teal">
                Cheapest: {cheapest.type} · Saves {formatUsd(savingsVsSpot, true)} vs Spot
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={results} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
                  <Bar dataKey="totalCost" radius={[6, 6, 0, 0]}>
                    {results.map((entry, i) => (
                      <Cell key={i} fill={entry.type === cheapest.type ? "#2DD4BF" : chart.grid} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {results.map((r) => (
                <div
                  key={r.type}
                  className={cn(
                    "rounded-xl border p-3.5",
                    r.type === cheapest.type
                      ? "border-teal-deep/50 bg-teal-deep/10"
                      : "border-glass-border bg-panel-raised/40"
                  )}
                >
                  <div className="text-xs font-semibold">{r.type}</div>
                  <div className="mt-1 font-mono text-sm font-bold">
                    {formatUsd(r.totalCost, true)}
                  </div>
                  <div className="font-mono text-[10px] text-ink-dim">
                    ${r.ratePerMt.toFixed(2)}/MT
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
