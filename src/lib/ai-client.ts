// ────────────────────────────────────────────────────────────────────────────
// AI BACKEND CLIENT
//
// Talks to the FastAPI decision engine in /backend. Fully optional: when
// NEXT_PUBLIC_VOYAGE_API_URL is unset, or the API is down / slow / returns an
// error, every function resolves to `null` and callers fall back to the built-in
// demo data. Nothing here ever throws into the UI.
// ────────────────────────────────────────────────────────────────────────────

import type { DerivedWorkflowState } from "./demo-engine";
import type { DemoScenario } from "./demo-scenarios";
import type {
  FreightForecast,
  IdleTimeEntry,
  MarketInsights,
  RiskAlert,
  VesselClassOption,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_VOYAGE_API_URL?.replace(/\/$/, "");
export const AI_ENABLED = Boolean(BASE);
const TIMEOUT_MS = 10_000;

export interface AiRequestBody {
  commodity: string;
  quantityMt: number;
  originPortName: string;
  candidateDischargePorts: string[];
  selectedDischargePortName: string;
  laycanStart: string;
  laycanEnd: string;
  numberOfVoyages: number;
  contractDurationMonths: number | null;
}

export interface AiResult {
  recommendation: Partial<DerivedWorkflowState["recommendation"]>;
  pipeline: {
    predict: { modelName: string; forecastDays: number; trendPct: number; trendDirection: "up" | "down"; summary: string };
    constrain: { feasibleVesselClasses: string[]; rejectedVesselClasses: string[]; summary: string };
    optimize: {
      solver: string;
      periodVoyages: number;
      spotVoyages: number;
      periodCoveragePct: number;
      spotFlexibilityPct: number;
      summary: string;
    };
    simulate: { pathsRun: number; p50BaseCostPerMt: number; p90CeilingCostPerMt: number; varHedgeUsd: number; summary: string };
  };
  vesselOptions: VesselClassOption[];
  riskAlerts: RiskAlert[];
  idleEntries: IdleTimeEntry[];
  forecast: FreightForecast;
  entryTiming: { bestWeek: number; start: string; end: string; explanation: string };
  meta: { asOf: string; modelVersion: string; originPort: string; dischargePort: string; vesselClass: string };
}

/** Accepts a scenario request or a user-edited CustomProcurementRequest (same field names). */
export function toAiBody(r: {
  commodity: string;
  quantityMt: number;
  originPortName: string;
  candidateDischargePorts: string[];
  selectedDischargePortName: string;
  laycanStart: string;
  laycanEnd: string;
  numberOfVoyages: number;
  contractDurationMonths: number | null;
}): AiRequestBody {
  return {
    commodity: r.commodity,
    quantityMt: r.quantityMt,
    originPortName: r.originPortName,
    candidateDischargePorts: r.candidateDischargePorts,
    selectedDischargePortName: r.selectedDischargePortName,
    laycanStart: r.laycanStart,
    laycanEnd: r.laycanEnd,
    numberOfVoyages: r.numberOfVoyages,
    contractDurationMonths: r.contractDurationMonths,
  };
}

export function requestKey(r: Parameters<typeof toAiBody>[0]): string {
  return JSON.stringify(toAiBody(r));
}


/** Grab the current Supabase user ID and pass it as a header to the backend. */
function getUserIdHeader(): Record<string, string> {
  // supabase.auth.getSession() is async, but we cache the session synchronously
  // via onAuthStateChange in session-context. Access it from the Supabase client
  // internal state as a best-effort (no await needed here).
  try {
    const raw = localStorage.getItem(
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`
    );
    if (!raw) return {};
    const session = JSON.parse(raw);
    const uid = session?.user?.id;
    return uid ? { "X-User-Id": uid } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!BASE) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...getUserIdHeader() },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Several pages/components ask for pieces of the same recommendation; share one call per request.
const cache = new Map<string, { at: number; value: Promise<AiResult | null> }>();
const TTL_MS = 60_000;

export function fetchAiResult(body: Parameters<typeof toAiBody>[0]): Promise<AiResult | null> {
  if (!AI_ENABLED) return Promise.resolve(null);
  const key = requestKey(body);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = request<AiResult>("/v1/recommend", { method: "POST", body: key }).then((r) => {
    if (!r) cache.delete(key); // never cache failures
    return r;
  });
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function fetchAiForScenario(sc: DemoScenario): Promise<AiResult | null> {
  return fetchAiResult(sc.request);
}

export function fetchAiMarketInsights(): Promise<MarketInsights | null> {
  return request<MarketInsights>("/v1/market-insights");
}

export interface AiPortCongestion {
  name: string;
  level: "Low" | "Moderate" | "High";
  currentWaitDays: number;
  expectedWaitDays: number[];
}

export function fetchAiPortCongestion(): Promise<AiPortCongestion[] | null> {
  return request<AiPortCongestion[]>("/v1/ports/congestion");
}

/** Merge live model output over the deterministic demo state, keeping money figures consistent. */
export function applyAiOverlay(base: DerivedWorkflowState, ai: AiResult): DerivedWorkflowState {
  const r = ai.recommendation;
  const recommendation = {
    ...base.recommendation,
    ...r,
    lighteringComparison: { ...base.recommendation.lighteringComparison, ...(r.lighteringComparison ?? {}) },
  } as DerivedWorkflowState["recommendation"];

  const p = ai.pipeline;
  const task = {
    ...base.task,
    predictDetails: {
      ...base.task.predictDetails,
      modelName: p.predict.modelName,
      forecastDays: p.predict.forecastDays,
      trendPct: p.predict.trendPct,
      trendDirection: p.predict.trendDirection,
      summary: p.predict.summary,
    },
    constrainDetails: {
      ...base.task.constrainDetails,
      feasibleVesselClasses: p.constrain.feasibleVesselClasses,
      rejectedVesselClasses: p.constrain.rejectedVesselClasses,
      summary: p.constrain.summary,
    },
    optimizeDetails: {
      ...base.task.optimizeDetails,
      solver: p.optimize.solver,
      periodVoyages: p.optimize.periodVoyages,
      spotVoyages: p.optimize.spotVoyages,
      periodCoveragePct: p.optimize.periodCoveragePct,
      spotFlexibilityPct: p.optimize.spotFlexibilityPct,
      vesselAllocation: recommendation.vesselStrategyText,
      summary: p.optimize.summary,
    },
    simulateDetails: {
      ...base.task.simulateDetails,
      pathsRun: p.simulate.pathsRun,
      p50BaseCostPerMt: p.simulate.p50BaseCostPerMt,
      p90CeilingCostPerMt: p.simulate.p90CeilingCostPerMt,
      varHedgeUsd: p.simulate.varHedgeUsd,
      summary: p.simulate.summary,
    },
  };

  // Keep fixture / escrow money consistent with the AI landed cost (30/40/30 milestone split preserved).
  const rate = recommendation.expectedLandedCostP50;
  const total = Math.round(rate * base.request.quantityMt);
  const dischargePort = `${ai.meta.dischargePort}, India`;
  const m = base.escrow.milestones;
  let allocated = 0;
  const milestones = m.map((ms, i) => {
    const amt = i === m.length - 1 ? total - allocated : Math.round((total * ms.payoutPct) / 100);
    allocated += amt;
    return { ...ms, payoutAmountUsd: amt };
  });

  return {
    ...base,
    task,
    recommendation,
    lockedFixture: {
      ...base.lockedFixture,
      ratePerMtUsd: rate,
      totalValueUsd: total,
      vesselClass: ai.meta.vesselClass,
      dischargePort,
      contractType: `${recommendation.recommendedContractType} (AI-recommended)`,
    },
    escrow: {
      ...base.escrow,
      ratePerMtUsd: rate,
      totalValueUsd: total,
      vesselClass: ai.meta.vesselClass,
      dischargePort,
      milestones,
    },
  };
}
