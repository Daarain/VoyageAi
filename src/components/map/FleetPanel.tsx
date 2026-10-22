"use client";
// src/components/map/FleetPanel.tsx
// Live vessel fleet panel — shown below the globe on the Live Map page.
// Uses useFleetPositions() which polls /api/ais every 60 seconds.

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ship, Anchor, Navigation, Search,
  RefreshCw, Radio, AlertTriangle,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { cn } from "@/lib/utils";
import { useFleetPositions, type AISVessel } from "@/lib/use-live-vessel-position";

const TYPE_COLOR: Record<string, string> = {
  Cargo:   "text-cyan-glow",
  Tanker:  "text-amber-signal",
  Fishing: "text-teal-soft",
  Other:   "text-ink-muted",
  Unknown: "text-ink-dim",
};

const STATUS_TONE: Record<string, "cyan" | "amber" | "default"> = {
  Underway:    "cyan",
  "At Anchor": "amber",
  Moored:      "amber",
  Unknown:     "default",
};

function VesselRow({
  vessel,
  selected,
  onSelect,
}: {
  vessel: AISVessel;
  selected: boolean;
  onSelect: (v: AISVessel) => void;
}) {
  const typeColor = TYPE_COLOR[vessel.typeLabel] ?? "text-ink-muted";
  const tone = STATUS_TONE[vessel.statusLabel] ?? "default";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onSelect(vessel)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
        selected
          ? "border-cyan-glow/40 bg-cyan-glow/8"
          : "border-transparent hover:border-glass-border hover:bg-panel-raised/60"
      )}
    >
      {/* Icon */}
      <div className={cn("mt-0.5 shrink-0", typeColor)}>
        {vessel.statusLabel === "At Anchor" || vessel.statusLabel === "Moored"
          ? <Anchor size={16} />
          : <Ship size={16} />}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {vessel.name || `MMSI ${vessel.mmsi}`}
          </span>
          <Badge tone={tone} className="shrink-0 text-[10px]">
            {vessel.statusLabel === "Underway"
              ? <><LiveDot color="cyan" className="mr-0.5" /> Underway</>
              : vessel.statusLabel}
          </Badge>
        </div>

        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-dim">
          {vessel.speed > 0 && (
            <span className="flex items-center gap-1">
              <Navigation size={10} /> {vessel.speed.toFixed(1)} kts
            </span>
          )}
          <span className="font-mono">
            {vessel.lat.toFixed(2)}°, {vessel.lng.toFixed(2)}°
          </span>
          {vessel.destination && (
            <span className="truncate max-w-[120px]">→ {vessel.destination}</span>
          )}
        </div>
      </div>

      {/* Type badge */}
      <span className={cn("shrink-0 text-[10px] font-medium mt-0.5", typeColor)}>
        {vessel.typeLabel}
      </span>
    </motion.button>
  );
}

function VesselDetail({ vessel }: { vessel: AISVessel }) {
  const rows = [
    { label: "MMSI",        value: vessel.mmsi },
    { label: "Speed",       value: `${vessel.speed.toFixed(1)} kts` },
    { label: "Heading",     value: `${vessel.heading}°` },
    { label: "Course",      value: `${vessel.course}°` },
    { label: "Draught",     value: vessel.draught ? `${vessel.draught} m` : "—" },
    { label: "Length",      value: vessel.length ? `${vessel.length} m` : "—" },
    { label: "Destination", value: vessel.destination || "—" },
    { label: "ETA",         value: vessel.eta || "—" },
    { label: "Updated",     value: new Date(vessel.updatedAt).toLocaleTimeString() },
  ];

  return (
    <GlassPanel className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Ship size={15} className="text-cyan-glow" />
        <span className="font-semibold">{vessel.name || vessel.mmsi}</span>
        <Badge tone={STATUS_TONE[vessel.statusLabel] ?? "default"}>
          {vessel.statusLabel}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <div className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
            <div className="font-mono text-xs font-medium text-ink-primary">{value}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export function FleetPanel() {
  const { vessels, loading, error, lastFetch } = useFleetPositions();
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<AISVessel | null>(null);
  const [filter,   setFilter]   = useState<"all" | "underway" | "anchored">("all");

  const filtered = useMemo(() => {
    let list = vessels;
    if (filter === "underway") list = list.filter((v) => v.speed > 1);
    if (filter === "anchored") list = list.filter((v) => v.speed <= 1);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.mmsi.includes(q) ||
          v.destination.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vessels, filter, search]);

  const stats = useMemo(() => ({
    total:    vessels.length,
    underway: vessels.filter((v) => v.speed > 1).length,
    anchored: vessels.filter((v) => v.speed <= 1).length,
  }), [vessels]);

  return (
    <div className="mt-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-cyan-glow" />
          <h2 className="font-semibold">Live Fleet</h2>
          {!loading && (
            <span className="text-xs text-ink-dim">
              {stats.total} vessels in Indian Ocean
            </span>
          )}
        </div>
        {lastFetch && (
          <div className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            <LiveDot color="cyan" />
            Updated {lastFetch.toLocaleTimeString()} · auto-refresh every 60s
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: stats.total,    key: "all" as const },
          { label: "Underway", value: stats.underway, key: "underway" as const },
          { label: "Anchored", value: stats.anchored, key: "anchored" as const },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(f => f === s.key ? "all" : s.key)}
            className={cn(
              "rounded-xl border p-3 text-center transition-all",
              filter === s.key
                ? "border-cyan-glow/40 bg-cyan-glow/8"
                : "border-glass-border bg-panel-raised/40 hover:bg-panel-raised"
            )}
          >
            <div className="text-lg font-bold text-cyan-glow">{s.value}</div>
            <div className="text-[11px] text-ink-dim">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Vessel list */}
        <GlassPanel className="p-3">
          {/* Search + filter */}
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vessel, MMSI, destination…"
                className="input-field w-full pl-8 py-1.5 text-xs"
              />
            </div>
            {loading && <RefreshCw size={14} className="animate-spin self-center text-ink-dim" />}
          </div>

          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-signal/20 bg-amber-signal/8 p-2.5 text-xs text-amber-signal">
              <AlertTriangle size={13} /> {error} — showing cached / demo data
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-ink-muted">
              <RefreshCw size={18} className="mx-auto mb-2 animate-spin" />
              Fetching vessel positions…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-muted">
              No vessels match your filter.
            </div>
          ) : (
            <div className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
              <AnimatePresence>
                {filtered.map((v) => (
                  <VesselRow
                    key={v.mmsi}
                    vessel={v}
                    selected={selected?.mmsi === v.mmsi}
                    onSelect={setSelected}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </GlassPanel>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.mmsi}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <VesselDetail vessel={selected} />
              </motion.div>
            </AnimatePresence>
          ) : (
            <GlassPanel className="flex flex-col items-center justify-center py-14 text-center">
              <Ship size={28} className="mb-3 text-ink-dim" />
              <p className="text-sm text-ink-muted">Select a vessel</p>
              <p className="mt-1 text-xs text-ink-dim">
                Click any row to see full AIS details
              </p>
            </GlassPanel>
          )}

          {/* AIS source note */}
          <div className="rounded-xl border border-glass-border bg-panel-raised/40 p-3 text-[11px] text-ink-dim leading-relaxed">
            <span className="font-medium text-ink-muted">Data source:</span>{" "}
            {process.env.NEXT_PUBLIC_AISHUB_CONFIGURED === "true"
              ? "AISHub live AIS feed (Indian Ocean)"
              : "Demo vessel data — add AISHUB_USERNAME to .env.local for live AIS"}
          </div>
        </div>
      </div>
    </div>
  );
}
