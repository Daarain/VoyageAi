// ────────────────────────────────────────────────────────────────────────────
// PROTOTYPE DATA — NOT PRODUCTION DATA
//
// This file exists for one reason only: to let the frontend render real,
// working screens before the Core AI Decision Engine (Layer 4) and Data
// Storage layer (Layer 6) are wired up. Every value below is shaped EXACTLY
// like the real API response types in `types.ts` — nothing here invents a
// field the backend won't actually produce.
//
// This is intentionally isolated in one file, behind the single access point
// in `data-source.ts`. When the real backend exists, only `data-source.ts`
// needs to change (swap these constants for real `fetch()` calls) — no
// component in the app touches this file directly.
// ────────────────────────────────────────────────────────────────────────────

import type {
  Vessel,
  Port,
  DashboardKpis,
  MarketInsights,
  VoyageRoute,
  FreightForecast,
  Recommendation,
  RiskAlert,
  IdleTimeEntry,
  CharteringRequest,
  AuditLogEntry,
  VesselClassOption,
} from "./types";

export const SAMPLE_PORTS: Port[] = [
  {
    id: "port-paradip",
    name: "Paradip",
    country: "India",
    countryCode: "IN",
    lat: 20.3167,
    lng: 86.6167,
    maxDraft: 18.0,
    berthAvailable: true,
    congestionLevel: "Moderate",
  },
  {
    id: "port-haldia",
    name: "Haldia",
    country: "India",
    countryCode: "IN",
    lat: 22.0257,
    lng: 88.0583,
    maxDraft: 12.5,
    berthAvailable: true,
    congestionLevel: "Moderate",
  },
  {
    id: "port-dhamra",
    name: "Dhamra",
    country: "India",
    countryCode: "IN",
    lat: 20.7719,
    lng: 86.9658,
    maxDraft: 18.0,
    berthAvailable: true,
    congestionLevel: "Low",
  },
  {
    id: "port-newcastle",
    name: "Newcastle",
    country: "Australia",
    countryCode: "AU",
    lat: -32.9167,
    lng: 151.75,
    maxDraft: 19.6,
    berthAvailable: true,
    congestionLevel: "Low",
  },
  {
    id: "port-singapore",
    name: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    lat: 1.29,
    lng: 103.85,
    maxDraft: 21.0,
    berthAvailable: true,
    congestionLevel: "High",
  },
  {
    id: "port-rotterdam",
    name: "Rotterdam",
    country: "Netherlands",
    countryCode: "NL",
    lat: 51.9225,
    lng: 4.47917,
    maxDraft: 24.0,
    berthAvailable: false,
    congestionLevel: "Moderate",
  },
];

export const SAMPLE_VESSELS: Vessel[] = [
  {
    id: "vsl-ocean-progress",
    name: "MV Ocean Progress",
    vesselClass: "Panamax",
    dwt: 82000,
    draft: 13.2,
    status: "En Route",
    currentLat: -8.5,
    currentLng: 118.2,
    utilizationPct: 89,
  },
  {
    id: "vsl-star-navigator",
    name: "MV Star Navigator",
    vesselClass: "Capesize",
    dwt: 178000,
    draft: 17.8,
    status: "Idle",
    currentLat: 1.29,
    currentLng: 103.85,
    utilizationPct: 0,
  },
  {
    id: "vsl-blue-horizon",
    name: "MV Blue Horizon",
    vesselClass: "Supramax",
    dwt: 58000,
    draft: 11.9,
    status: "Operational",
    currentLat: -32.9167,
    currentLng: 151.75,
    utilizationPct: 62,
  },
];

export const SAMPLE_ROUTE: VoyageRoute = {
  id: "route-001",
  originPort: SAMPLE_PORTS[1],
  destinationPort: SAMPLE_PORTS[0],
  vessel: SAMPLE_VESSELS[0],
  distanceNm: 5742,
  estTimeDays: 12.6,
  avgSpeedKts: 13.8,
  status: "Optimal",
  weather: "Good",
  etd: "2026-05-05",
  eta: "2026-05-18",
  cargoDescription: "Coal (55,000 MT)",
};

export const SAMPLE_DASHBOARD_KPIS: DashboardKpis = {
  activeVoyages: 7,
  totalSavingsUsd: 1_480_000,
  portfolioRiskLevel: "Medium",
  idleVesselsCount: 2,
};

export const SAMPLE_MARKET_INSIGHTS: MarketInsights = {
  freightTrendPct: 4.8,
  freightTrendDirection: "down",
  demandLevel: "High",
  portCongestion: "Moderate",
  bunkerPriceUsdPerMt: 620,
  bunkerPriceChangePct: 1.2,
  marketSentiment: "Bullish",
};

export const SAMPLE_FORECAST: FreightForecast = {
  route: "Australia → Paradip",
  vesselClass: "Panamax",
  confidencePct: 87,
  optimalEntryWindowStart: "2026-09-20",
  optimalEntryWindowEnd: "2026-09-28",
  currentRateUsdPerMt: 25.7,
  series: [
    { date: "2026-05", historicalUsdPerMt: 22.1, forecastUsdPerMt: null },
    { date: "2026-06", historicalUsdPerMt: 24.8, forecastUsdPerMt: null },
    { date: "2026-07", historicalUsdPerMt: 23.6, forecastUsdPerMt: null },
    { date: "2026-08", historicalUsdPerMt: 25.7, forecastUsdPerMt: null },
    { date: "2026-09", historicalUsdPerMt: null, forecastUsdPerMt: 21.4 },
    { date: "2026-10", historicalUsdPerMt: null, forecastUsdPerMt: 18.5 },
  ],
};

export const SAMPLE_RECOMMENDATION: Recommendation = {
  id: "rec-8841",
  requestId: "req-2214",
  recommendedVessel: {
    vesselClass: "Panamax",
    dwt: 82000,
    draft: 13.2,
    fitScorePct: 94,
    reasoning:
      "Panamax draft is compatible with Paradip's berth restrictions and matches 600,000 MT across 4 voyages efficiently without exceeding port handling capacity.",
    portCompatible: true,
  },
  recommendedContractType: "CVC",
  contractComparison: [
    { type: "Spot", totalCostUsd: 12_600_000, ratePerMt: 21.0 },
    { type: "CVC", totalCostUsd: 11_100_000, ratePerMt: 18.5 },
    { type: "Time Charter", totalCostUsd: 11_850_000, ratePerMt: 19.75 },
  ],
  forecast: SAMPLE_FORECAST,
  riskLevel: "Medium",
  riskFactors: [
    "Cyclone season active in the Australian origin region through October",
    "Moderate congestion reported at Paradip berth queue",
  ],
  expectedIdleDays: 3,
  estimatedSavingsUsd: 1_200_000,
  estimatedSavingsPct: 11.9,
  generatedAt: "2026-08-20T09:12:00Z",
  modelVersion: "voyageai-core-v0.9",
};

export const SAMPLE_VESSEL_CLASS_OPTIONS: VesselClassOption[] = [
  {
    vesselClass: "Panamax",
    capacityRange: "60K-82K DWT",
    dwtRange: "60,000-82,000 DWT",
    draftRange: "11.5-13.2 m",
    cargoFitPct: 94,
    portCompatibility: true,
    estimatedFreightUsdPerMt: 25.7,
    idleRisk: "Low",
    suitabilityStatus: "Best Match",
    availability: "Available",
    reasoning: "Panamax capacity and draft align with the current cargo volume and destination port limits.",
    reasons: ["Cargo quantity fits capacity", "Destination draft limit satisfied", "Strong cargo compatibility", "Low idle risk"],
  },
  {
    vesselClass: "Supramax",
    capacityRange: "45K-60K DWT",
    dwtRange: "45,000-60,000 DWT",
    draftRange: "10.0-11.5 m",
    cargoFitPct: 78,
    portCompatibility: true,
    estimatedFreightUsdPerMt: 27.2,
    idleRisk: "Medium",
    suitabilityStatus: "Good Fit",
    availability: "Limited",
    reasoning: "Supramax remains port compatible but would require more voyages for the current cargo quantity.",
    reasons: ["Port draft compatible", "Flexible berth access", "More voyages required", "Moderate idle risk"],
  },
  {
    vesselClass: "Capesize",
    capacityRange: "100K-180K DWT",
    dwtRange: "100,000-180,000 DWT",
    draftRange: "15.0-18.0 m",
    cargoFitPct: 61,
    portCompatibility: false,
    estimatedFreightUsdPerMt: 23.9,
    idleRisk: "High",
    suitabilityStatus: "Not Suitable",
    availability: "Available",
    reasoning: "Capesize offers capacity but exceeds the destination draft constraint for this route.",
    reasons: ["High cargo capacity", "Destination draft constraint exceeded", "Higher idle risk"],
  },
  {
    vesselClass: "Handysize",
    capacityRange: "10K-40K DWT",
    dwtRange: "10,000-40,000 DWT",
    draftRange: "7.0-10.0 m",
    cargoFitPct: 46,
    portCompatibility: true,
    estimatedFreightUsdPerMt: 31.4,
    idleRisk: "Medium",
    suitabilityStatus: "Marginal",
    availability: "Available",
    reasoning: "Handysize is port compatible but its smaller capacity makes it inefficient for this cargo volume.",
    reasons: ["Port compatible", "Small capacity for this cargo", "Higher freight estimate", "More voyages required"],
  },
];

export const SAMPLE_RISK_ALERTS: RiskAlert[] = [
  {
    id: "risk-001",
    level: "Medium",
    category: "Weather",
    title: "Cyclone activity building near Australian east coast",
    description:
      "Meteorological data shows a developing low-pressure system that may affect loading windows at Newcastle over the next 10 days.",
    route: "Australia → Paradip",
    detectedAt: "2026-08-19T14:30:00Z",
    acknowledged: false,
  },
  {
    id: "risk-002",
    level: "High",
    category: "Port Congestion",
    title: "Paradip berth queue extending beyond forecast",
    description:
      "Waiting time at Paradip has increased 40% week-over-week, driven by seasonal coal import volume.",
    route: "Australia → Paradip",
    detectedAt: "2026-08-20T06:00:00Z",
    acknowledged: false,
  },
  {
    id: "risk-003",
    level: "Low",
    category: "Freight Volatility",
    title: "Panamax spot rates showing minor short-term volatility",
    description: "Rates fluctuated within a normal 3% band over the past 5 trading days.",
    route: "Global — Panamax",
    detectedAt: "2026-08-18T11:00:00Z",
    acknowledged: true,
  },
];

export const SAMPLE_IDLE_TIME: IdleTimeEntry[] = [
  {
    vesselId: "vsl-star-navigator",
    vesselName: "MV Star Navigator",
    expectedIdleDays: 6,
    location: "Singapore",
    repositioningSuggestion:
      "Backhaul iron ore opportunity available ex-Singapore to Qingdao within idle window.",
  },
  {
    vesselId: "vsl-blue-horizon",
    vesselName: "MV Blue Horizon",
    expectedIdleDays: 2,
    location: "Newcastle",
    repositioningSuggestion: null,
  },
];

export const SAMPLE_REQUESTS: CharteringRequest[] = [
  {
    id: "req-2214",
    cargoType: "Coal",
    cargoQuantityMt: 600000,
    originPortId: "port-newcastle",
    destinationPortId: "port-paradip",
    numberOfVoyages: 4,
    deliveryWindowStart: "2026-09-01",
    deliveryWindowEnd: "2026-11-30",
    contractDurationMonths: 3,
    createdAt: "2026-08-20T08:00:00Z",
    status: "Recommended",
    requestedBy: "Rajesh Kumar",
  },
  {
    id: "req-2215",
    cargoType: "Iron Ore",
    cargoQuantityMt: 180000,
    originPortId: "port-singapore",
    destinationPortId: "port-paradip",
    numberOfVoyages: 2,
    deliveryWindowStart: "2026-09-10",
    deliveryWindowEnd: "2026-10-15",
    contractDurationMonths: null,
    createdAt: "2026-08-21T10:15:00Z",
    status: "Processing",
    requestedBy: "Rajesh Kumar",
  },
  {
    id: "req-2216",
    cargoType: "Grain",
    cargoQuantityMt: 95000,
    originPortId: "port-rotterdam",
    destinationPortId: "port-paradip",
    numberOfVoyages: 1,
    deliveryWindowStart: "2026-09-05",
    deliveryWindowEnd: "2026-09-25",
    contractDurationMonths: null,
    createdAt: "2026-08-22T09:30:00Z",
    status: "Draft",
    requestedBy: "Rajesh Kumar",
  },
];

export const SAMPLE_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "audit-001",
    requestId: "req-2214",
    timestamp: "2026-08-20T09:12:00Z",
    modelVersion: "voyageai-core-v0.9",
    inputSnapshot: "600,000 MT Coal · Newcastle → Paradip · 4 voyages · 3-month window",
    confidencePct: 87,
    outputSummary: "Recommended Panamax, COA contract, $1.2M projected savings",
    actor: "VoyageAI Core Engine",
    actorRole: "System",
    action: "AI Recommendation Generated",
  },
  {
    id: "audit-002",
    requestId: "req-2214",
    timestamp: "2026-08-20T14:40:00Z",
    modelVersion: "voyageai-core-v0.9",
    inputSnapshot: "Same request — reviewed by Chartering Manager",
    confidencePct: 87,
    outputSummary: "Recommendation accepted as-is, no parameter changes",
    actor: "Rajesh Kumar",
    actorRole: "Chartering Manager",
    action: "Approved",
  },
  {
    id: "audit-003",
    requestId: "req-2215",
    timestamp: "2026-08-21T11:05:00Z",
    modelVersion: "voyageai-core-v0.9",
    inputSnapshot: "180,000 MT Iron Ore · Singapore → Paradip · 2 voyages",
    confidencePct: 74,
    outputSummary: "Recommended Supramax, Spot contract — vessel class overridden by manager",
    actor: "Rajesh Kumar",
    actorRole: "Chartering Manager",
    action: "Manually Overridden",
  },
];
