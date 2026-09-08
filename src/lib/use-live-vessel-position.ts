"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildArcPoints } from "@/components/globe/geo-utils";

// ─────────────────────────────────────────────────────────────────────────
// LIVE VESSEL POSITION — frontend simulation, isolated by design.
//
// There is no backend yet, so this hook advances a vessel's position along
// its real great-circle route on a timer, exactly the way a real AIS
// telemetry feed (REQ-3.2.1: refresh every ≤15 min) would update it.
//
// When the backend exists, this hook's internals are the ONLY thing that
// changes — swap the setInterval simulation below for a polling/WebSocket
// subscription to the real AIS endpoint. Every component consuming
// `useLiveVesselPosition()` (the globe, the Selected Vessel panel) needs
// zero changes, because they only ever see { progress, lat, lng, etaText }.
// ─────────────────────────────────────────────────────────────────────────

interface LiveVesselPosition {
  progress: number; // 0 → 1 along the route
  lat: number;
  lng: number;
  percentComplete: number;
}

export function useLiveVesselPosition(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  voyageDurationSeconds = 180 // full demo transit time; tune freely
): LiveVesselPosition {
  const [progress, setProgress] = useState(0.42); // start mid-voyage, matches reference framing
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  useEffect(() => {
    const points = buildArcPoints(origin.lat, origin.lng, destination.lat, destination.lng, 1);
    curveRef.current = new THREE.CatmullRomCurve3(points);
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  useEffect(() => {
    const tickMs = 1000;
    const step = tickMs / (voyageDurationSeconds * 1000);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next >= 1 ? 0.02 : next; // loop for continuous demo visualization
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [voyageDurationSeconds]);

  let lat = origin.lat;
  let lng = origin.lng;

  if (curveRef.current) {
    const point = curveRef.current.getPointAt(Math.min(Math.max(progress, 0), 0.999));
    // Convert the unit-sphere point back to lat/lng for display purposes
    const normalized = point.clone().normalize();
    lat = 90 - (Math.acos(normalized.y) * 180) / Math.PI;
    const theta = Math.atan2(normalized.z, -normalized.x);
    lng = (theta * 180) / Math.PI - 180;
    if (lng < -180) lng += 360;
  }

  return {
    progress,
    lat,
    lng,
    percentComplete: Math.round(progress * 100),
  };
}
