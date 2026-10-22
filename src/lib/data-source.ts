// ────────────────────────────────────────────────────────────────────────────
// SINGLE DATA ACCESS POINT
//
// Every screen in this app imports data through the functions below — never
// directly from `sample-data.ts`. This is deliberate: when the real backend
// (FastAPI/Node services described in the architecture doc) is ready, only
// this file changes to real `fetch()` calls against the real API routes.
// No component code needs to change.
// ────────────────────────────────────────────────────────────────────────────

import {
  SAMPLE_PORTS,
  SAMPLE_VESSELS,
  SAMPLE_ROUTE,
  SAMPLE_DASHBOARD_KPIS,
  SAMPLE_MARKET_INSIGHTS,
  SAMPLE_FORECAST,
  SAMPLE_RECOMMENDATION,
  SAMPLE_RISK_ALERTS,
  SAMPLE_IDLE_TIME,
  SAMPLE_REQUESTS,
  SAMPLE_AUDIT_LOG,
  SAMPLE_VESSEL_CLASS_OPTIONS,
} from "./sample-data";
import {
  SCENARIO_GLADSTONE_DHAMRA,
  ALL_DEMO_SCENARIOS,
  getScenarioById,
  type DemoScenario,
} from "./demo-scenarios";
import {
  AI_ENABLED,
  fetchAiForScenario,
  fetchAiMarketInsights,
  fetchAiPortCongestion,
  type AiResult,
} from "./ai-client";

// AI-first, demo-data-fallback. Returns null when the AI backend is disabled/unreachable.
//
// In-flight deduplication: multiple dashboard sections that mount at the same
// time (Forecast, Risk, VesselOptions, IdleTime) all call aiFor() with the same
// scenarioId. Without this guard they fire separate POST /v1/recommend requests
// before the 60-second cache in ai-client.ts has a chance to populate.
// The Map below ensures only ONE in-flight promise exists per scenario key.
const _inflight = new Map<string, Promise<AiResult | null>>();

async function aiFor(scenarioId?: string): Promise<AiResult | null> {
  if (!AI_ENABLED) return null;
  const sc = scenarioId ? getScenarioById(scenarioId) : SCENARIO_GLADSTONE_DHAMRA;
  const key = scenarioId ?? "__default__";
  const hit = _inflight.get(key);
  if (hit) return hit;
  const p = fetchAiForScenario(sc).finally(() => _inflight.delete(key));
  _inflight.set(key, p);
  return p;
}

export async function getDashboardKpis() {
  return SAMPLE_DASHBOARD_KPIS;
}

export async function getMarketInsights() {
  const live = AI_ENABLED ? await fetchAiMarketInsights() : null;
  return live ?? SAMPLE_MARKET_INSIGHTS;
}

export async function getActiveRoute(scenarioId?: string) {
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.trackingRoute;
  }
  return SCENARIO_GLADSTONE_DHAMRA.trackingRoute || SAMPLE_ROUTE;
}

export async function getPorts() {
  const live = AI_ENABLED ? await fetchAiPortCongestion() : null;
  if (!live) return SAMPLE_PORTS;
  // Override only the congestion level for ports the model covers; keep everything else as-is.
  return SAMPLE_PORTS.map((p) => {
    const m = live.find((l) => l.name.toLowerCase() === p.name.toLowerCase());
    return m ? { ...p, congestionLevel: m.level } : p;
  });
}

export async function getVessels() {
  return SAMPLE_VESSELS;
}

export async function getForecast(scenarioId?: string) {
  const ai = await aiFor(scenarioId);
  if (ai) return ai.forecast;
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.recommendation.forecast;
  }
  return SCENARIO_GLADSTONE_DHAMRA.recommendation.forecast || SAMPLE_FORECAST;
}

export async function getRecommendation(scenarioId?: string) {
  const ai = await aiFor(scenarioId);
  if (ai) {
    const base = scenarioId ? getScenarioById(scenarioId) : SCENARIO_GLADSTONE_DHAMRA;
    return { ...base.recommendation, ...ai.recommendation } as typeof base.recommendation;
  }
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.recommendation;
  }
  return SCENARIO_GLADSTONE_DHAMRA.recommendation || SAMPLE_RECOMMENDATION;
}

export async function getRiskAlerts(scenarioId?: string) {
  const ai = await aiFor(scenarioId);
  if (ai) return ai.riskAlerts;
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.riskAlerts;
  }
  return SCENARIO_GLADSTONE_DHAMRA.riskAlerts || SAMPLE_RISK_ALERTS;
}

export async function getIdleTimeEntries(scenarioId?: string) {
  const ai = await aiFor(scenarioId);
  if (ai) return ai.idleEntries;
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.idleEntries;
  }
  return SCENARIO_GLADSTONE_DHAMRA.idleEntries || SAMPLE_IDLE_TIME;
}

export async function getCharteringRequests() {
  return SAMPLE_REQUESTS;
}

export async function getAuditLog() {
  return SAMPLE_AUDIT_LOG;
}

export async function getVesselClassOptions(scenarioId?: string) {
  const ai = await aiFor(scenarioId);
  if (ai) return ai.vesselOptions;
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.vesselOptions;
  }
  return SCENARIO_GLADSTONE_DHAMRA.vesselOptions || SAMPLE_VESSEL_CLASS_OPTIONS;
}

export async function getAllScenarios(): Promise<DemoScenario[]> {
  return ALL_DEMO_SCENARIOS;
}

export async function getScenario(id: string): Promise<DemoScenario> {
  return getScenarioById(id);
}

