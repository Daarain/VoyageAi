"use client";
// src/app/dashboard/live-map/page.tsx
// Live map using MarineTraffic free embedded widget — real AIS vessels, zero API cost

import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Ship, Anchor, ExternalLink, Info } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";

// Indian east coast ports — centre map on each
const PORTS = [
  { name: "All Routes",     lat: 13.0,  lon: 81.0,  zoom: 5  },
  { name: "Paradip",        lat: 20.26, lon: 86.67, zoom: 10 },
  { name: "Haldia",         lat: 22.02, lon: 88.07, zoom: 10 },
  { name: "Vizag",          lat: 17.68, lon: 83.28, zoom: 10 },
  { name: "Dhamra",         lat: 20.78, lon: 86.90, zoom: 10 },
  { name: "Gangavaram",     lat: 17.62, lon: 83.23, zoom: 11 },
  { name: "Krishnapatnam",  lat: 14.25, lon: 80.13, zoom: 10 },
  { name: "Gopalpur",       lat: 19.26, lon: 84.87, zoom: 10 },
];

const VESSEL_FILTERS = [
  { label: "All Vessels",   mmsi: "",   shiptype: 0  },
  { label: "Cargo Only",    mmsi: "",   shiptype: 70 },
  { label: "Bulk Carriers", mmsi: "",   shiptype: 79 },
  { label: "Tankers",       mmsi: "",   shiptype: 80 },
];

export default function LiveMapPage() {
  const [selectedPort,   setSelectedPort]   = useState(PORTS[0]);
  const [selectedFilter, setSelectedFilter] = useState(VESSEL_FILTERS[0]);
  const [showInfo,       setShowInfo]       = useState(false);

  // MarineTraffic free embed widget URL
  // Parameters: width, height, latitude, longitude, zoom, trackvessel, shownames, showmenu
  const mapUrl = [
    "https://www.marinetraffic.com/en/ais/embed/zoom:",
    `${selectedPort.zoom}`,
    "/centery:",
    `${selectedPort.lat}`,
    "/centerx:",
    `${selectedPort.lon}`,
    "/default_vessels_opacity:0.7",
    "/default_tracks_opacity:0.7",
    "/default_showvessel_labels:false",
    `/default_shiptype:${selectedFilter.shiptype}`,
    "/lang:0",
  ].join("");

  return (
    <div className="mx-auto max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
              <Radio size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Live Map</h1>
              <p className="text-sm text-ink-muted">
                Real-time AIS vessel tracking — Indian Ocean & Bay of Bengal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveDot color="cyan" />
            <span className="text-xs text-ink-dim">Live AIS · MarineTraffic</span>
            <button
              onClick={() => setShowInfo(v => !v)}
              className="ml-1 text-ink-dim hover:text-ink-primary"
            >
              <Info size={15} />
            </button>
          </div>
        </div>

        {/* Info banner */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-cyan-glow/20 bg-cyan-glow/5 p-3 text-xs text-ink-muted leading-relaxed"
          >
            <span className="font-semibold text-cyan-glow">Data source:</span> MarineTraffic
            live AIS feed. Vessel positions update every 2–5 minutes via AIS receivers.
            Coverage includes all Indian east coast ports (Paradip, Haldia, Vizag, Dhamra,
            Gangavaram, Krishnapatnam, Gopalpur) and origin routes from Australia, South Africa,
            Indonesia, USA, and Russia.
          </motion.div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Port selector */}
        <GlassPanel className="flex flex-wrap gap-1.5 p-2">
          <span className="self-center px-1 text-[10px] uppercase tracking-wider text-ink-dim">
            <Anchor size={11} className="inline mr-1" />Port
          </span>
          {PORTS.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedPort(p)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                selectedPort.name === p.name
                  ? "bg-cyan-glow text-void"
                  : "text-ink-muted hover:bg-panel-raised hover:text-ink-primary",
              ].join(" ")}
            >
              {p.name}
            </button>
          ))}
        </GlassPanel>

        {/* Vessel type filter */}
        <GlassPanel className="flex flex-wrap gap-1.5 p-2">
          <span className="self-center px-1 text-[10px] uppercase tracking-wider text-ink-dim">
            <Ship size={11} className="inline mr-1" />Type
          </span>
          {VESSEL_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setSelectedFilter(f)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                selectedFilter.label === f.label
                  ? "bg-cyan-glow text-void"
                  : "text-ink-muted hover:bg-panel-raised hover:text-ink-primary",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </GlassPanel>
      </div>

      {/* Map embed */}
      <GlassPanel className="overflow-hidden p-0">
        <div className="relative">
          {/* Live badge overlay */}
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-cyan-glow/30 bg-void/80 px-2.5 py-1.5 backdrop-blur-sm">
            <LiveDot color="cyan" />
            <span className="text-[11px] font-semibold text-cyan-glow">LIVE AIS</span>
          </div>

          {/* Port label overlay */}
          <div className="absolute right-3 top-3 z-10 rounded-lg border border-glass-border bg-void/80 px-2.5 py-1.5 backdrop-blur-sm">
            <span className="text-[11px] text-ink-muted">{selectedPort.name}</span>
          </div>

          {/* MarineTraffic embed */}
          <iframe
            key={`${selectedPort.name}-${selectedFilter.label}`}
            src={mapUrl}
            width="100%"
            height="580"
            style={{ border: "none", display: "block" }}
            allowFullScreen
            loading="lazy"
            title={`Live AIS Map — ${selectedPort.name}`}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-glass-border px-4 py-2.5">
          <div className="flex items-center gap-4 text-[11px] text-ink-dim">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Underway
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> At Anchor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Moored
            </span>
          </div>
          <a
            href="https://www.marinetraffic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-ink-dim hover:text-cyan-glow"
          >
            MarineTraffic <ExternalLink size={11} />
          </a>
        </div>
      </GlassPanel>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Coverage",   value: "Indian Ocean",    icon: <Radio size={14} />       },
          { label: "Update Rate",value: "Every 2–5 min",  icon: <LiveDot color="cyan" />  },
          { label: "Vessel Types",value: "Cargo · Tanker", icon: <Ship size={14} />       },
          { label: "Ports Tracked",value: "7 East Coast", icon: <Anchor size={14} />      },
        ].map((s) => (
          <GlassPanel key={s.label} className="flex items-center gap-3 p-3">
            <div className="text-cyan-glow">{s.icon}</div>
            <div>
              <div className="text-xs font-semibold">{s.value}</div>
              <div className="text-[10px] text-ink-dim">{s.label}</div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
