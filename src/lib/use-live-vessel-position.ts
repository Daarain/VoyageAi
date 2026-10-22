"use client";
// src/lib/use-live-vessel-position.ts
//
// Drop-in replacement for the simulation-based hook.
// Return shape is IDENTICAL to the old version — zero changes needed in
// CommandCenter, GlobeCanvas, or any other consumer.
//
// Strategy:
//  1. Poll /api/ais every 60 s (AISHub free tier limit = 1 req/min).
//  2. Find the vessel on the active route by matching destination port name.
//  3. Interpolate progress (0→1) from vessel lat/lng against the route arc.
//  4. Fall back to smooth simulation if AIS returns no matching vessel
//     (vessel hasn't entered the Indian Ocean bounding box yet).

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildArcPoints } from "@/components/globe/geo-utils";
import type { AISVessel } from "@/app/api/ais/route";

export type { AISVessel };

interface LiveVesselPosition {
  progress:        number;   // 0→1 along the route arc
  lat:             number;
  lng:             number;
  percentComplete: number;
  speed:           number;   // knots (real AIS or estimated from arc)
  heading:         number;   // degrees
  source:          "ais" | "simulation";
  vessel:          AISVessel | null;
}

const POLL_INTERVAL_MS = 60_000;   // 1 minute — AISHub free tier
const SIM_STEP_MS      = 1_000;    // simulation tick

/** Haversine distance in nautical miles */
function distNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find closest point on the arc curve and return progress 0→1 */
function progressFromLatLng(
  curve: THREE.CatmullRomCurve3,
  lat: number,
  lng: number
): number {
  const target = new THREE.Vector3(
    -Math.cos((lat * Math.PI) / 180) * Math.cos((lng * Math.PI) / 180),
     Math.sin((lat * Math.PI) / 180),
    -Math.cos((lat * Math.PI) / 180) * Math.sin((lng * Math.PI) / 180)
  );
  let best = 0, bestDist = Infinity;
  const STEPS = 200;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const d = curve.getPointAt(t).distanceTo(target);
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best;
}

export function useLiveVesselPosition(
  origin:      { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name?: string },
  voyageDurationSeconds = 180
): LiveVesselPosition {
  const [state, setState] = useState<LiveVesselPosition>({
    progress: 0.42, lat: origin.lat, lng: origin.lng,
    percentComplete: 42, speed: 12, heading: 0,
    source: "simulation", vessel: null,
  });
  const curveRef   = useRef<THREE.CatmullRomCurve3 | null>(null);
  const simRef     = useRef<number>(0.42);
  const aisRef     = useRef<AISVessel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build arc curve
  useEffect(() => {
    const pts = buildArcPoints(origin.lat, origin.lng, destination.lat, destination.lng, 1);
    curveRef.current = new THREE.CatmullRomCurve3(pts);
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Convert progress → lat/lng using the arc curve
  const progressToLatLng = useCallback((t: number) => {
    if (!curveRef.current) return { lat: origin.lat, lng: origin.lng };
    const p = curveRef.current.getPointAt(Math.min(Math.max(t, 0), 0.999)).normalize();
    const lat = 90 - (Math.acos(p.y) * 180) / Math.PI;
    const theta = Math.atan2(p.z, -p.x);
    let lng = (theta * 180) / Math.PI - 180;
    if (lng < -180) lng += 360;
    return { lat, lng };
  }, [origin.lat, origin.lng]);

  // Poll AIS endpoint
  const pollAIS = useCallback(async () => {
    try {
      const res = await fetch("/api/ais");
      if (!res.ok) return;
      const vessels: AISVessel[] = await res.json();

      // Match vessel to this route:
      // 1) destination port name substring match
      // 2) geographically closest vessel heading roughly toward dest
      const destName = destination.name?.toLowerCase() ?? "";
      let match: AISVessel | null = null;

      if (destName) {
        match = vessels.find(
          (v) =>
            v.status !== 1 &&  // exclude anchored
            v.speed > 1 &&     // moving
            v.destination.toLowerCase().includes(destName)
        ) ?? null;
      }

      // Fallback: closest moving cargo vessel to midpoint of route
      if (!match) {
        const midProgress = progressToLatLng(0.5);
        match = vessels
          .filter((v) => v.speed > 1 && v.shipType >= 70 && v.shipType <= 89)
          .sort(
            (a, b) =>
              distNm(a.lat, a.lng, midProgress.lat, midProgress.lng) -
              distNm(b.lat, b.lng, midProgress.lat, midProgress.lng)
          )[0] ?? null;
      }

      aisRef.current = match;
    } catch {
      // Network error — keep using simulation
    }
  }, [destination.name, progressToLatLng]);

  // Initial poll + interval
  useEffect(() => {
    pollAIS();
    const id = setInterval(pollAIS, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollAIS]);

  // Simulation tick — advances smoothly; overridden if AIS match found
  useEffect(() => {
    const step = SIM_STEP_MS / (voyageDurationSeconds * 1000);
    intervalRef.current = setInterval(() => {
      const aisVessel = aisRef.current;

      if (aisVessel && curveRef.current) {
        // Real AIS position
        const progress = progressFromLatLng(curveRef.current, aisVessel.lat, aisVessel.lng);
        simRef.current = progress;
        setState({
          progress,
          lat:             aisVessel.lat,
          lng:             aisVessel.lng,
          percentComplete: Math.round(progress * 100),
          speed:           aisVessel.speed,
          heading:         aisVessel.heading,
          source:          "ais",
          vessel:          aisVessel,
        });
      } else {
        // Simulation fallback
        const next = simRef.current + step;
        simRef.current = next >= 1 ? 0.02 : next;
        const { lat, lng } = progressToLatLng(simRef.current);
        setState((prev) => ({
          ...prev,
          progress:        simRef.current,
          lat, lng,
          percentComplete: Math.round(simRef.current * 100),
          source:          "simulation",
        }));
      }
    }, SIM_STEP_MS);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [voyageDurationSeconds, progressToLatLng]);

  return state;
}

// ── Fleet hook: all vessels in Indian Ocean bounding box ─────────────────────
export interface FleetState {
  vessels:  AISVessel[];
  loading:  boolean;
  error:    string | null;
  lastFetch: Date | null;
}

export function useFleetPositions(): FleetState {
  const [state, setState] = useState<FleetState>({
    vessels: [], loading: true, error: null, lastFetch: null,
  });

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/ais");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const vessels: AISVessel[] = await res.json();
      setState({ vessels, loading: false, error: null, lastFetch: new Date() });
    } catch (e) {
      setState((prev) => ({
        ...prev, loading: false,
        error: e instanceof Error ? e.message : "AIS fetch failed",
      }));
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetch_]);

  return state;
}
