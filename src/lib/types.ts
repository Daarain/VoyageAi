// Core entity types — grounded directly in VoyageAI Pro SRS v1.0, Section 6 (Data Requirements)
// and the approved 6-layer architecture. Every field here corresponds to a real
// requirement (REQ IDs referenced in comments) so the frontend never invents a
// data shape the backend wouldn't actually produce.

export type VesselClass = "Capesize" | "Panamax" | "Supramax" | "Handysize";

export type ContractType = "Spot" | "CVC" | "Time Charter";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type RouteStatus = "Optimal" | "Delayed" | "Congested";

// REQ-6.1.1 — vessels entity
export interface Vessel {
  id: string;
  name: string;
  vesselClass: VesselClass;
  dwt: number; // Deadweight Tonnage
  draft: number; // meters
  status: "En Route" | "Idle" | "Loading" | "Discharging" | "Operational";
  currentLat: number;
  currentLng: number;
  utilizationPct: number;
}

// REQ-6.1.1 — ports entity
export interface Port {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  maxDraft: number;
  berthAvailable: boolean;
  congestionLevel: "Low" | "Moderate" | "High";
}

// REQ-2.2.1 — chartering_requests entity (mandatory intake fields)
export interface CharteringRequest {
  id: string;
  cargoType: string;
  cargoQuantityMt: number;
  originPortId: string;
  destinationPortId: string;
  numberOfVoyages: number;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  contractDurationMonths: number | null;
  createdAt: string;
  status: "Draft" | "Processing" | "Recommended" | "Approved" | "Rejected";
  requestedBy: string; // REQ-1.2.1 — chartering manager who submitted it
  overrideNote?: string; // REQ-1.2.3 — manual override justification, if any
}

// REQ-5.3.1 — audit trail: model name/version, input snapshot, confidence, output
export interface AuditLogEntry {
  id: string;
  requestId: string;
  timestamp: string;
  modelVersion: string;
  inputSnapshot: string;
  confidencePct: number;
  outputSummary: string;
  actor: string;
  actorRole: "Chartering Manager" | "Port Owner" | "System";
  action: "AI Recommendation Generated" | "Manually Overridden" | "Approved" | "Rejected";
}

// REQ-4.1.x — Freight Forecasting Model output
export interface FreightForecastPoint {
  date: string;
  historicalUsdPerMt: number | null;
  forecastUsdPerMt: number | null;
}

export interface FreightForecast {
  route: string;
  vesselClass: VesselClass;
  confidencePct: number; // REQ-4.1.2
  optimalEntryWindowStart: string;
  optimalEntryWindowEnd: string;
  currentRateUsdPerMt: number;
  series: FreightForecastPoint[];
}

// REQ-4.2.x — Vessel Matching & Optimization output
export interface VesselRecommendation {
  vesselClass: VesselClass;
  dwt: number;
  draft: number;
  fitScorePct: number;
  reasoning: string;
  portCompatible: boolean;
}

export interface VesselClassOption {
  vesselClass: VesselClass;
  capacityRange: string;
  dwtRange: string;
  draftRange: string;
  cargoFitPct: number;
  portCompatibility: boolean;
  estimatedFreightUsdPerMt: number;
  idleRisk: "Low" | "Medium" | "High";
  suitabilityStatus: "Best Match" | "Good Fit" | "Marginal" | "Not Suitable";
  availability: "Available" | "Limited" | "Unavailable";
  reasoning: string;
  reasons: string[];
}

// REQ-4.4.x — Risk & Congestion Prediction output
export interface RiskAlert {
  id: string;
  level: RiskLevel;
  category: "Freight Volatility" | "Port Congestion" | "Weather" | "Geopolitical" | "Operational";
  title: string;
  description: string;
  route: string;
  detectedAt: string;
  acknowledged: boolean;
}

// REQ-4.5.x — Idle-Time & Repositioning Optimizer output
export interface IdleTimeEntry {
  vesselId: string;
  vesselName: string;
  expectedIdleDays: number;
  location: string;
  repositioningSuggestion: string | null;
}

// REQ-3.3.x + REQ-4.x — full recommendation bundle (what Section "Example" describes end to end)
export interface Recommendation {
  id: string;
  requestId: string;
  recommendedVessel: VesselRecommendation;
  recommendedContractType: ContractType;
  contractComparison: {
    type: ContractType;
    totalCostUsd: number;
    ratePerMt: number;
  }[];
  forecast: FreightForecast;
  riskLevel: RiskLevel;
  riskFactors: string[];
  expectedIdleDays: number;
  estimatedSavingsUsd: number;
  estimatedSavingsPct: number;
  generatedAt: string;
  modelVersion: string; // REQ-5.3.1 — audit trail requirement
}

// REQ-1.1.1 — dashboard summary
export interface DashboardKpis {
  activeVoyages: number;
  totalSavingsUsd: number;
  portfolioRiskLevel: RiskLevel;
  idleVesselsCount: number;
}

// REQ-3.2.x — Market & Congestion Ingestion snapshot
export interface MarketInsights {
  freightTrendPct: number;
  freightTrendDirection: "up" | "down";
  demandLevel: "Low" | "Moderate" | "High";
  portCongestion: "Low" | "Moderate" | "High";
  bunkerPriceUsdPerMt: number;
  bunkerPriceChangePct: number;
  marketSentiment: "Bullish" | "Bearish" | "Neutral";
}

export interface VoyageRoute {
  id: string;
  originPort: Port;
  destinationPort: Port;
  vessel: Vessel;
  distanceNm: number;
  estTimeDays: number;
  avgSpeedKts: number;
  status: RouteStatus;
  weather: "Good" | "Moderate" | "Severe";
  etd: string;
  eta: string;
  cargoDescription: string;
}
