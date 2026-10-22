// src/app/api/ais/route.ts
// Server-side AIS proxy — keeps AISHUB_USERNAME out of the browser bundle.
// Frontend calls  GET /api/ais?latmin=5&latmax=25&lonmin=65&lonmax=100
// This fetches from AISHub, normalises the response, and returns clean JSON.
//
// AISHub free tier:
//   • Register at https://www.aishub.net/join  (free for non-commercial / academic)
//   • Set AISHUB_USERNAME in .env.local
//   • Rate limit: 1 request / minute per IP — enforced by the cache below

import { NextRequest, NextResponse } from "next/server";

const USERNAME = process.env.AISHUB_USERNAME ?? "";

// ── Indian Ocean / Bay of Bengal bounding box (covers all your routes) ──────
const DEFAULT_BOUNDS = {
  latmin: "-5",   // 5°S — covers Australian departure zones
  latmax: "25",   // 25°N — covers all Indian east coast ports
  lonmin: "55",   // 55°E — Red Sea / Arabian Sea entry
  lonmax: "100",  // 100°E — Strait of Malacca / Indonesian waters
};

// Server-side cache: AISHub free tier allows 1 req/min. Cache for 60 seconds.
let _cache: { data: AISVessel[]; at: number } | null = null;
const CACHE_TTL_MS = 60_000;

export interface AISVessel {
  mmsi:      string;
  name:      string;
  lat:       number;
  lng:       number;
  speed:     number;   // knots × 10 in raw AISHub, normalised here to knots
  heading:   number;   // degrees 0–359
  course:    number;   // degrees over ground
  status:    number;   // AIS navigational status code
  statusLabel: string; // human-readable
  shipType:  number;   // AIS ship type code
  typeLabel: string;   // "Bulk Carrier", "Tanker", etc.
  length:    number | null;
  draught:   number | null; // metres × 10 in raw, normalised here
  destination: string;
  eta:       string;
  updatedAt: string;   // ISO timestamp
}

// AIS navigational status → label
function statusLabel(code: number): string {
  const MAP: Record<number, string> = {
    0: "Underway",    1: "At Anchor",  2: "Not Under Command",
    3: "Restricted",  4: "Constrained",5: "Moored",
    6: "Aground",     7: "Fishing",    8: "Sailing",
    15: "Unknown",
  };
  return MAP[code] ?? "Unknown";
}

// AIS ship type → simplified label (bulk carriers, tankers for this platform)
function typeLabel(code: number): string {
  if (code >= 70 && code <= 79) return "Cargo";
  if (code >= 80 && code <= 89) return "Tanker";
  if (code >= 60 && code <= 69) return "Passenger";
  if (code === 30)               return "Fishing";
  if (code >= 20 && code <= 29) return "WIG";
  if (code >= 40 && code <= 49) return "High Speed";
  if (code >= 50 && code <= 59) return "Special";
  if (code === 0)                return "Unknown";
  return "Other";
}

function normalise(raw: Record<string, string | number>): AISVessel {
  return {
    mmsi:        String(raw.MMSI  ?? raw.mmsi  ?? ""),
    name:        String(raw.NAME  ?? raw.name  ?? "Unknown"),
    lat:         Number(raw.LATITUDE  ?? raw.lat  ?? 0),
    lng:         Number(raw.LONGITUDE ?? raw.lng  ?? 0),
    speed:       Number(raw.SPEED ?? 0) / 10,        // AISHub sends knots × 10
    heading:     Number(raw.HEADING ?? raw.COG ?? 0),
    course:      Number(raw.COG ?? raw.COURSE ?? 0),
    status:      Number(raw.NAVSTAT ?? raw.STATUS ?? 15),
    statusLabel: statusLabel(Number(raw.NAVSTAT ?? raw.STATUS ?? 15)),
    shipType:    Number(raw.SHIPTYPE ?? raw.TYPE ?? 0),
    typeLabel:   typeLabel(Number(raw.SHIPTYPE ?? raw.TYPE ?? 0)),
    length:      raw.LENGTH ? Number(raw.LENGTH) : null,
    draught:     raw.DRAUGHT ? Number(raw.DRAUGHT) / 10 : null,   // × 10 in raw
    destination: String(raw.DESTINATION ?? raw.DEST ?? ""),
    eta:         String(raw.ETA ?? ""),
    updatedAt:   new Date().toISOString(),
  };
}

async function fetchFromAISHub(bounds: typeof DEFAULT_BOUNDS): Promise<AISVessel[]> {
  if (!USERNAME) {
    // No API key — return demo vessels so the UI still works
    return getDemoVessels();
  }

  const url = new URL("http://data.aishub.net/ws.php");
  url.searchParams.set("username",  USERNAME);
  url.searchParams.set("format",    "1");      // JSON array
  url.searchParams.set("output",    "json");
  url.searchParams.set("compress",  "0");
  url.searchParams.set("latmin",    bounds.latmin);
  url.searchParams.set("latmax",    bounds.latmax);
  url.searchParams.set("lonmin",    bounds.lonmin);
  url.searchParams.set("lonmax",    bounds.lonmax);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },   // Next.js server-side cache hint
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`AISHub HTTP ${res.status}`);

  const json = await res.json();
  // AISHub returns [[metadata], [vessel, vessel, ...]]
  const vessels: Record<string, string | number>[] = Array.isArray(json[1])
    ? json[1]
    : Array.isArray(json)
    ? json
    : [];

  return vessels
    .map(normalise)
    .filter((v) => v.lat !== 0 && v.lng !== 0)
    // Keep only cargo / tanker / bulk types relevant to this platform
    .filter((v) => v.shipType === 0 || (v.shipType >= 60 && v.shipType <= 99))
    .slice(0, 200);    // cap at 200 vessels for map performance
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const bounds = {
    latmin: sp.get("latmin") ?? DEFAULT_BOUNDS.latmin,
    latmax: sp.get("latmax") ?? DEFAULT_BOUNDS.latmax,
    lonmin: sp.get("lonmin") ?? DEFAULT_BOUNDS.lonmin,
    lonmax: sp.get("lonmax") ?? DEFAULT_BOUNDS.lonmax,
  };

  // Return cached data if fresh
  if (_cache && Date.now() - _cache.at < CACHE_TTL_MS) {
    return NextResponse.json(_cache.data, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "X-Cache": "HIT",
        "X-Vessel-Count": String(_cache.data.length),
      },
    });
  }

  try {
    const vessels = await fetchFromAISHub(bounds);
    _cache = { data: vessels, at: Date.now() };
    return NextResponse.json(vessels, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "X-Cache": "MISS",
        "X-Vessel-Count": String(vessels.length),
      },
    });
  } catch (err) {
    console.error("[AIS proxy]", err);
    // On error, return stale cache if available, else demo vessels
    const fallback = _cache?.data ?? getDemoVessels();
    return NextResponse.json(fallback, {
      status: _cache ? 200 : 503,
      headers: { "X-Cache": "STALE" },
    });
  }
}

// ── Demo vessels — used when AISHUB_USERNAME is not set ──────────────────────
function getDemoVessels(): AISVessel[] {
  const now = new Date().toISOString();
  return [
    { mmsi: "419001234", name: "MV PARADIP STAR",   lat: 14.2,  lng: 80.3,  speed: 11.2, heading: 42,  course: 42,  status: 0, statusLabel: "Underway", shipType: 70, typeLabel: "Cargo",  length: 190, draught: 10.2, destination: "PARADIP",       eta: "", updatedAt: now },
    { mmsi: "419005678", name: "MV VIZAG EXPRESS",  lat: 17.6,  lng: 83.2,  speed: 9.4,  heading: 330, course: 330, status: 0, statusLabel: "Underway", shipType: 70, typeLabel: "Cargo",  length: 230, draught: 12.1, destination: "VISAKHAPATNAM", eta: "", updatedAt: now },
    { mmsi: "636015432", name: "PACIFIC COAL",      lat: 8.4,   lng: 77.9,  speed: 12.1, heading: 355, course: 355, status: 0, statusLabel: "Underway", shipType: 79, typeLabel: "Cargo",  length: 280, draught: 13.8, destination: "HALDIA",        eta: "", updatedAt: now },
    { mmsi: "538006721", name: "CAPE GLADSTONE",    lat: 12.8,  lng: 74.5,  speed: 13.5, heading: 68,  course: 68,  status: 0, statusLabel: "Underway", shipType: 79, typeLabel: "Cargo",  length: 290, draught: 17.2, destination: "DHAMRA",        eta: "", updatedAt: now },
    { mmsi: "372001108", name: "SURAMA BULK",       lat: 20.1,  lng: 86.7,  speed: 0.0,  heading: 180, course: 0,   status: 1, statusLabel: "At Anchor", shipType: 70, typeLabel: "Cargo", length: 200, draught: 11.0, destination: "PARADIP",       eta: "", updatedAt: now },
    { mmsi: "525016003", name: "MV INDO SPIRIT",    lat: 5.8,   lng: 95.4,  speed: 14.2, heading: 285, course: 285, status: 0, statusLabel: "Underway", shipType: 70, typeLabel: "Cargo",  length: 245, draught: 12.5, destination: "KRISHNAPATNAM", eta: "", updatedAt: now },
    { mmsi: "477123456", name: "EASTERN PROMISE",   lat: 3.1,   lng: 80.2,  speed: 10.8, heading: 330, course: 330, status: 0, statusLabel: "Underway", shipType: 79, typeLabel: "Cargo",  length: 260, draught: 14.1, destination: "GANGAVARAM",    eta: "", updatedAt: now },
  ];
}
