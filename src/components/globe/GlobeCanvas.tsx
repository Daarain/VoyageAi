"use client";

import React, { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Port } from "@/lib/types";
import { Navigation, Compass, AlertCircle } from "lucide-react";

interface Props {
  origin: Port;
  destination: Port;
  progress: number;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

// 2D Tactical Vector Radar / Marine Route Map (rendered if WebGL / 3D Canvas encounters any hardware or network fault)
function TacticalMapFallback({ origin, destination, progress }: Props) {
  // Convert lat/lng to normalized SVG percentage coordinates (Equirectangular projection)
  const toX = (lng: number) => ((lng + 180) / 360) * 100;
  const toY = (lat: number) => ((90 - lat) / 180) * 100;

  const x1 = toX(origin.lng);
  const y1 = toY(origin.lat);
  const x2 = toX(destination.lng);
  const y2 = toY(destination.lat);

  // Bezier control point lifted for Great Circle curve appearance
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 14;

  // Current vessel position along quadratic Bezier curve
  const t = Math.max(0, Math.min(progress, 1));
  const curX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
  const curY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#050810] p-4 text-white select-none overflow-hidden">
      {/* Background Graticule & Radials */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* SVG Navigation Map */}
      <div className="relative h-full w-full max-w-5xl">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full filter drop-shadow-[0_0_15px_rgba(34,211,238,0.15)]"
        >
          {/* Latitude / Longitude lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#1E293B" strokeWidth="0.3" strokeDasharray="1 1" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#1E293B" strokeWidth="0.3" strokeDasharray="1 1" />

          {/* Route Curvature */}
          <path
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            fill="none"
            stroke="#22D3EE"
            strokeWidth="0.75"
            strokeDasharray="1.5 1"
            className="animate-pulse"
          />

          {/* Great circle wake */}
          <path
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="0.25"
            opacity="0.4"
          />

          {/* Origin Port Marker */}
          <circle cx={x1} cy={y1} r="1.4" fill="#F59E0B" />
          <circle cx={x1} cy={y1} r="2.8" fill="none" stroke="#F59E0B" strokeWidth="0.3" opacity="0.7" />

          {/* Destination Port Marker */}
          <circle cx={x2} cy={y2} r="1.4" fill="#22D3EE" />
          <circle cx={x2} cy={y2} r="2.8" fill="none" stroke="#22D3EE" strokeWidth="0.3" opacity="0.7" />

          {/* Active Vessel Indicator */}
          <circle cx={curX} cy={curY} r="1.8" fill="#FFFFFF" />
          <circle cx={curX} cy={curY} r="3.6" fill="none" stroke="#22D3EE" strokeWidth="0.5" className="animate-ping" />
        </svg>

        {/* Port Labels and telemetry overlay */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: `${x1}%`, top: `${y1}%` }}
        >
          <div className="mb-1 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-400/40 shadow-lg whitespace-nowrap">
            {origin.name} ({origin.country})
          </div>
        </div>

        <div
          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: `${x2}%`, top: `${y2}%` }}
        >
          <div className="mb-1 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-400/40 shadow-lg whitespace-nowrap">
            {destination.name} ({destination.country})
          </div>
        </div>

        <div
          className="absolute transform -translate-x-1/2 translate-y-2 pointer-events-none"
          style={{ left: `${curX}%`, top: `${curY}%` }}
        >
          <div className="rounded-md bg-cyan-950/90 px-2 py-1 text-[9px] font-mono text-white border border-cyan-400/60 shadow-xl whitespace-nowrap flex items-center gap-1.5">
            <Navigation size={10} className="text-cyan-400 animate-spin" />
            <span>Vessel In Transit ({Math.round(progress * 100)}%)</span>
          </div>
        </div>
      </div>

      {/* Top Banner indicating Tactical Mode */}
      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-panel/80 px-3 py-1.5 text-xs text-ink-muted border border-glass-border backdrop-blur-md">
        <Compass size={14} className="text-cyan-glow" />
        <span>Tactical 2D Marine Nav Grid</span>
      </div>
    </div>
  );
}

class GlobeErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, State> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : "WebGL Texture/Context Error";
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.warn("Globe Canvas Error Boundary handled:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DynamicGlobe = dynamic(() => import("./Globe").then((mod) => mod.Globe), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#050810]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-glass-border border-t-cyan-glow" />
        <span className="text-xs font-medium text-ink-dim tracking-wider uppercase">Loading Maritime Globe...</span>
      </div>
    </div>
  ),
});

export function GlobeCanvas({
  origin,
  destination,
  progress,
}: Props) {
  const fallback = (
    <TacticalMapFallback
      origin={origin}
      destination={destination}
      progress={progress}
    />
  );

  return (
    <GlobeErrorBoundary fallback={fallback}>
      <DynamicGlobe origin={origin} destination={destination} progress={progress} />
    </GlobeErrorBoundary>
  );
}
