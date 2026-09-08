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

export async function getDashboardKpis() {
  return SAMPLE_DASHBOARD_KPIS;
}

export async function getMarketInsights() {
  return SAMPLE_MARKET_INSIGHTS;
}

export async function getActiveRoute(scenarioId?: string) {
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.trackingRoute;
  }
  return SCENARIO_GLADSTONE_DHAMRA.trackingRoute || SAMPLE_ROUTE;
}

export async function getPorts() {
  return SAMPLE_PORTS;
}

export async function getVessels() {
  return SAMPLE_VESSELS;
}

export async function getForecast(scenarioId?: string) {
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.recommendation.forecast;
  }
  return SCENARIO_GLADSTONE_DHAMRA.recommendation.forecast || SAMPLE_FORECAST;
}

export async function getRecommendation(scenarioId?: string) {
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.recommendation;
  }
  return SCENARIO_GLADSTONE_DHAMRA.recommendation || SAMPLE_RECOMMENDATION;
}

export async function getRiskAlerts(scenarioId?: string) {
  if (scenarioId) {
    const sc = getScenarioById(scenarioId);
    return sc.riskAlerts;
  }
  return SCENARIO_GLADSTONE_DHAMRA.riskAlerts || SAMPLE_RISK_ALERTS;
}

export async function getIdleTimeEntries(scenarioId?: string) {
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

