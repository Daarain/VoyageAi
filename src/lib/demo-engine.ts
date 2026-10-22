// ────────────────────────────────────────────────────────────────────────────
// VOYAGEAI PRO — DETERMINISTIC DEMO PROCESSING ENGINE
//
// Translates user procurement requests + baseline scenario inputs into
// coherent, mathematically consistent, and presentation-ready workflow states:
// PREDICT → CONSTRAIN → OPTIMIZE → SIMULATE → RECOMMENDATION → FIXTURE → ESCROW → TRACKING
//
// Purely deterministic: No Math.random(), no random rate fluctuations.
// ────────────────────────────────────────────────────────────────────────────

import type {
  Port,
  Vessel,
  VoyageRoute,
  FreightForecast,
  Recommendation,
  VesselClassOption,
  RiskAlert,
  IdleTimeEntry,
} from "./types";
import {
  type DemoScenario,
  type OptimizationTaskStatus,
  type EscrowContract,
  type EscrowMilestone,
  type CustomProcurementRequest,
  getScenarioById,
  SCENARIO_GLADSTONE_DHAMRA,
  SCENARIO_MAPUTO_PARADIP,
  SCENARIO_NEWCASTLE_KRISHNAPATNAM,
} from "./demo-scenarios";

export interface DerivedWorkflowState {
  request: CustomProcurementRequest;
  task: OptimizationTaskStatus;
  recommendation: Recommendation & {
    primaryAction: string;
    recommendedRouteText: string;
    vesselStrategyText: string;
    portfolioSplitText: string;
    expectedLandedCostP50: number;
    stressCeilingP90: number;
    netSavingsPct: number;
    netSavingsUsd: number;
    backhaulMonetizationText: string;
    lighteringComparison: {
      haldiaLighteringCostPerMt: number;
      dhamraDirectSavingsPerMt: number;
      sagarFloatingCraneRate: number;
    };
  };
  lockedFixture: {
    fixtureId: string;
    contractId: string;
    chartererName: string;
    chartererDesk: string;
    plantDestination: string;
    shipOwner: string;
    vesselName: string;
    vesselClass: string;
    commodity: string;
    quantityMt: number;
    originPort: string;
    dischargePort: string;
    ratePerMtUsd: number;
    totalValueUsd: number;
    contractType: string;
    contractDurationMonths: number;
    nbfcPartner: string;
    creditLineStatus: string;
    securityHash: string;
    twoFactorVerified: boolean;
    verifiedBy: string;
    verifiedAt: string;
  };
  escrow: EscrowContract;
  trackingRoute: VoyageRoute & {
    headingDeg: number;
    dynamicDraftM: number;
    dhamraAnchorageWeather: {
      waveHeightHs: number;
      windKts: number;
      status: "Green" | "Amber" | "Red";
    };
    paradipAnchorageWeather: {
      waveHeightHs: number;
      windKts: number;
      status: "Green" | "Amber" | "Red";
    };
  };
  vesselOptions: VesselClassOption[];
  riskAlerts: RiskAlert[];
  idleEntries: IdleTimeEntry[];
}

interface PortCoordinates {
  name: string;
  country: string;
  lat: number;
  lng: number;
  draftM: number;
}

const PORT_GEO_LOOKUP: Record<string, PortCoordinates> = {
  "Gladstone, Australia": { name: "Gladstone", country: "Australia", lat: -23.8431, lng: 151.2684, draftM: 18.5 },
  "Maputo, Mozambique": { name: "Maputo", country: "Mozambique", lat: -25.9692, lng: 32.5732, draftM: 14.2 },
  "Newcastle, Australia": { name: "Newcastle", country: "Australia", lat: -32.9283, lng: 151.7817, draftM: 16.8 },
  "Richards Bay, South Africa": { name: "Richards Bay", country: "South Africa", lat: -28.7807, lng: 32.0383, draftM: 19.0 },
  "Singapore Port": { name: "Singapore Port", country: "Singapore", lat: 1.29027, lng: 103.851959, draftM: 18.0 },
  "Rotterdam, Netherlands": { name: "Rotterdam", country: "Netherlands", lat: 51.9244, lng: 4.4777, draftM: 24.0 },

  // Discharge ports
  "Dhamra": { name: "Dhamra Port", country: "India", lat: 20.7719, lng: 86.9658, draftM: 18.0 },
  "Dhamra Port": { name: "Dhamra Port", country: "India", lat: 20.7719, lng: 86.9658, draftM: 18.0 },
  "Dhamra, India": { name: "Dhamra Port", country: "India", lat: 20.7719, lng: 86.9658, draftM: 18.0 },
  "Paradip": { name: "Paradip Port", country: "India", lat: 20.2644, lng: 86.6667, draftM: 18.0 },
  "Paradip Port": { name: "Paradip Port", country: "India", lat: 20.2644, lng: 86.6667, draftM: 18.0 },
  "Paradip, India": { name: "Paradip Port", country: "India", lat: 20.2644, lng: 86.6667, draftM: 18.0 },
  "Haldia": { name: "Haldia Port", country: "India", lat: 22.0667, lng: 88.0667, draftM: 8.5 },
  "Haldia Port": { name: "Haldia Port", country: "India", lat: 22.0667, lng: 88.0667, draftM: 8.5 },
  "Vizag": { name: "Vizag Port", country: "India", lat: 17.6868, lng: 83.2185, draftM: 16.5 },
  "Vizag Port": { name: "Vizag Port", country: "India", lat: 17.6868, lng: 83.2185, draftM: 16.5 },
  "Krishnapatnam": { name: "Krishnapatnam Port", country: "India", lat: 14.2564, lng: 80.1245, draftM: 18.5 },
  "Krishnapatnam Port": { name: "Krishnapatnam Port", country: "India", lat: 14.2564, lng: 80.1245, draftM: 18.5 },
};

function getPortGeo(name: string, fallbackCountry = "International"): PortCoordinates {
  const match = PORT_GEO_LOOKUP[name];
  if (match) return match;

  for (const key of Object.keys(PORT_GEO_LOOKUP)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return PORT_GEO_LOOKUP[key];
    }
  }

  return {
    name,
    country: fallbackCountry,
    lat: 18.0,
    lng: 85.0,
    draftM: 16.0,
  };
}

/**
 * Deterministic Demo Processing Engine
 * Derives complete workflow state from a custom procurement request + baseline scenario.
 */
export function deriveOptimizationAndRecommendation(
  req: CustomProcurementRequest,
  baseScenario?: DemoScenario
): DerivedWorkflowState {
  const scenario = baseScenario || getScenarioById(req.scenarioId || "scenario-gladstone-dhamra");

  // Determine origin & discharge port info
  const originGeo = getPortGeo(req.originPortName || scenario.request.originPortName, "Origin");
  
  // Choose primary discharge port among candidate discharge ports
  const candidatePorts = req.candidateDischargePorts && req.candidateDischargePorts.length > 0
    ? req.candidateDischargePorts
    : scenario.request.candidateDischargePorts;

  // Prefer Dhamra if in candidate ports, else Krishnapatnam, else Paradip, else first
  let primaryDischargeName = candidatePorts[0] || "Dhamra";
  if (candidatePorts.some((p) => p.toLowerCase().includes("dhamra"))) {
    primaryDischargeName = "Dhamra Port";
  } else if (candidatePorts.some((p) => p.toLowerCase().includes("krishnapatnam"))) {
    primaryDischargeName = "Krishnapatnam Port";
  } else if (candidatePorts.some((p) => p.toLowerCase().includes("paradip"))) {
    primaryDischargeName = "Paradip Port";
  }

  const dischargeGeo = getPortGeo(primaryDischargeName, "India");

  // Deterministic freight rate calculation
  const isMozambique = req.originPortName.toLowerCase().includes("maputo") || req.originPortName.toLowerCase().includes("mozambique");
  const isNewcastle = req.originPortName.toLowerCase().includes("newcastle");
  const isRotterdam = req.originPortName.toLowerCase().includes("rotterdam");
  const isSingapore = req.originPortName.toLowerCase().includes("singapore");

  let baseRatePerMt = 24.80; // default Australia -> Dhamra Panamax
  let ffaTrendPct = 14.0;
  let ffaSignalText = "Baltic Forward Freight Agreements (FFA) forward curve signals +14% freight rise over next 45-60 days";
  let weatherStatusText = "Live Weather API Online · Bay of Bengal Hs = 1.16m, Wind = 14 kts";
  let isSparse = isNewcastle;
  let isWeatherFallback = isMozambique;

  if (isMozambique) {
    baseRatePerMt = 31.20;
    ffaTrendPct = 9.2;
    ffaSignalText = "South Atlantic / Mozambique Channel FFA curve signals +9.2% rate escalation";
    weatherStatusText = "Live Weather API Timeout → 30-Day Climatology Moving Averages Loaded";
  } else if (isNewcastle) {
    baseRatePerMt = 25.40;
    ffaTrendPct = 11.5;
    ffaSignalText = "East Coast Australia FFA paper curve signaling +11.5% quarter-over-quarter increase";
    weatherStatusText = "Sparse-Corridor Regional Proxy Enabled (Port Kembla / Hay Point baseline)";
  } else if (isRotterdam) {
    baseRatePerMt = 36.00;
    ffaTrendPct = 7.5;
    ffaSignalText = "North Atlantic Capesize paper curve signaling +7.5% seasonal rate lift";
  } else if (isSingapore) {
    baseRatePerMt = 14.50;
    ffaTrendPct = 5.0;
    ffaSignalText = "Malacca Strait short-haul spot market relatively balanced (+5.0% paper curve)";
  }

  // Vessel sizing & multi-voyage parcel calculation
  const quantityMt = req.quantityMt || scenario.request.quantityMt || 150000;
  const parcelSize = quantityMt >= 250000 && !candidatePorts.includes("Haldia") ? 75000 : 75000;
  const calculatedVoyages = req.numberOfVoyages || Math.max(1, Math.round(quantityMt / parcelSize));
  const contractDuration = req.contractDurationMonths || scenario.request.contractDurationMonths || 3;

  // Period vs Spot allocation (MILP solver simulation)
  let periodVoyages = Math.ceil(calculatedVoyages * 0.625);
  if (calculatedVoyages === 1) periodVoyages = 1;
  else if (calculatedVoyages === 2) periodVoyages = 1; // 1 period + 1 spot
  const spotVoyages = Math.max(0, calculatedVoyages - periodVoyages);
  const periodCoveragePct = Math.round((periodVoyages / calculatedVoyages) * 1000) / 10;
  const spotFlexibilityPct = Math.round((100 - periodCoveragePct) * 10) / 10;

  // Economics & Simulation calculation
  const p50BaseCostPerMt = baseRatePerMt;
  const p90CeilingCostPerMt = Math.round((baseRatePerMt * 1.306) * 100) / 100;
  const spotMarketBaselineRate = Math.round((baseRatePerMt * 1.14) * 100) / 100;
  const cvcRate = Math.round((baseRatePerMt * 1.051) * 100) / 100;

  const totalTimeCharterCost = Math.round(quantityMt * p50BaseCostPerMt);
  const totalSpotCost = Math.round(quantityMt * spotMarketBaselineRate);
  const totalCvcCost = Math.round(quantityMt * cvcRate);

  const netSavingsUsd = Math.max(50000, totalSpotCost - totalTimeCharterCost);
  const netSavingsPct = Math.round(((spotMarketBaselineRate - p50BaseCostPerMt) / spotMarketBaselineRate) * 1000) / 10;
  const varHedgeUsd = Math.round((p90CeilingCostPerMt - p50BaseCostPerMt) * (quantityMt * (periodCoveragePct / 100)));

  // Hydrographic checks
  const hasHaldia = candidatePorts.some((p) => p.toLowerCase().includes("haldia"));
  const hasDhamra = candidatePorts.some((p) => p.toLowerCase().includes("dhamra"));
  const hasParadip = candidatePorts.some((p) => p.toLowerCase().includes("paradip"));

  let hydrographicCheckSummary = `PostGIS spatial hydrographic analysis executed across ${candidatePorts.length} candidate ports (${candidatePorts.join(", ")}).`;
  let haldiaCheckText = hasHaldia
    ? "ALERT: Capesize loaded draft (16.2m) and loaded Panamax (>12.5m) violate Haldia 8.5m permissible limit. Sagar lightering penalty: +$4.50/MT."
    : "Haldia draft limitation bypassed by selecting deep-water candidate berths.";
  let dhamraCheckText = hasDhamra
    ? "Dhamra Port (18.0m permissible draft) confirmed 100% compatible for direct Panamax/Capesize berthing (zero lightering penalty)."
    : hasParadip
    ? "Paradip Port (18.0m permissible draft) provides direct berthing capability (queue wait ~4.2d monitored)."
    : `${primaryDischargeName} permissible draft (${dischargeGeo.draftM}m) satisfies loaded vessel requirements.`;

  const lighteringAvoidedPerMt = hasHaldia && (hasDhamra || hasParadip) ? 4.50 : 0.00;

  // Selected Vessel & Owner
  const vesselName = scenario.escrow.vesselName || "MV Kalinganagar Voyager";
  const shipOwner = scenario.escrow.shipOwner || "Pacific Basin Shipping Ltd.";
  const chartererName = "Captain Rajesh Nair";
  const chartererDesk = "Tata Steel / JSW Maritime Desk";
  const targetSteelPlant = req.targetSteelPlant || scenario.request.targetSteelPlant;

  // Task Status Object
  const taskId = scenario.task.taskId || "8f7e2c1a";
  const task: OptimizationTaskStatus = {
    taskId,
    currentStep: "SIMULATE",
    completedSteps: ["PREDICT", "CONSTRAIN", "OPTIMIZE", "SIMULATE"],
    isComplete: true,
    predictDetails: {
      modelName: isSparse ? "Temporal Fusion Transformer (TFT) v2.4 (Sparse Proxy Mode)" : "Temporal Fusion Transformer (TFT) v2.4",
      ffaSignal: ffaSignalText,
      weatherStatus: weatherStatusText,
      forecastDays: 60,
      trendPct: ffaTrendPct,
      trendDirection: "up",
      summary: `TFT forward curve generated: +${ffaTrendPct}% Baltic FFA forward paper rally detected.`,
    },
    constrainDetails: {
      hydrographicCheck: hydrographicCheckSummary,
      capesizeDraftViolation: haldiaCheckText,
      lighteringOption: "Sagar / Sandheads offshore lightering with floating crane calculated at +$4.50/MT barge transfer cost.",
      dhamraDirectBerthing: dhamraCheckText,
      feasibleVesselClasses: ["Panamax (75,000 DWT)", "Supramax (55,000 DWT)"],
      rejectedVesselClasses: hasHaldia ? ["Capesize (Draft violation at Haldia 8.5m)", "Handysize (Inefficient unit economics)"] : ["Handysize (Inefficient unit economics)"],
      summary: `Hydrographic draft validation: Direct berthing approved at ${primaryDischargeName} ($0 penalty).`,
    },
    optimizeDetails: {
      solver: "Mixed-Integer Linear Programming (MILP) via Google OR-Tools",
      periodCoveragePct,
      periodVoyages,
      spotFlexibilityPct,
      spotVoyages,
      vesselAllocation: `${calculatedVoyages} × Panamax (75,000 MT) shipments`,
      summary: `Google OR-Tools MILP solver converged in 142ms: ${periodCoveragePct}% Period Lock + ${spotFlexibilityPct}% Spot Buffer.`,
    },
    simulateDetails: {
      pathsRun: 10000,
      p50BaseCostPerMt,
      p90CeilingCostPerMt,
      varHedgeUsd,
      summary: `Monte Carlo engine simulated 10,000 market paths: P50 $${p50BaseCostPerMt.toFixed(2)}/MT, P90 $${p90CeilingCostPerMt.toFixed(2)}/MT ($${(varHedgeUsd / 1000000).toFixed(1)}M VaR hedge).`,
    },
  };

  // Recommendation Object
  const recommendation: DerivedWorkflowState["recommendation"] = {
    id: `rec-${taskId}`,
    requestId: `req-${taskId}`,
    primaryAction: `LOCK ${contractDuration}-MONTH MULTI-VOYAGE CONTRACT`,
    recommendedRouteText: `${originGeo.name} (${originGeo.country}) → ${primaryDischargeName} (Direct Discharge, zero lightering penalty)`,
    vesselStrategyText: `${calculatedVoyages} × Panamax (75,000 MT) — 100% Port Feasible at ${primaryDischargeName}`,
    portfolioSplitText: `${periodVoyages} Period Voyages (${periodCoveragePct}%) + ${spotVoyages} Spot Voyages (${spotFlexibilityPct}%)`,
    expectedLandedCostP50: p50BaseCostPerMt,
    stressCeilingP90: p90CeilingCostPerMt,
    netSavingsPct,
    netSavingsUsd,
    backhaulMonetizationText: `Post-discharge at ${primaryDischargeName}, vessel will load export Iron Ore ex-Paradip to Asia to eliminate return ballast fuel burn.`,
    lighteringComparison: {
      haldiaLighteringCostPerMt: 4.50,
      dhamraDirectSavingsPerMt: lighteringAvoidedPerMt,
      sagarFloatingCraneRate: 2.80,
    },
    recommendedVessel: {
      vesselClass: "Panamax",
      name: vesselName,
      dwt: 75000,
      draft: 13.5,
      fitScorePct: 98,
      reasoning: `Panamax draft (13.5m) is 100% compatible with ${primaryDischargeName} (${dischargeGeo.draftM}m draft limit) with zero lightering penalty and optimal ${calculatedVoyages}-voyage allocation for ${quantityMt.toLocaleString()} MT ${req.commodity}.`,
      portCompatible: true,
    },
    recommendedContractType: "Time Charter",
    contractComparison: [
      { type: "Spot", totalCostUsd: totalSpotCost, ratePerMt: spotMarketBaselineRate },
      { type: "CVC", totalCostUsd: totalCvcCost, ratePerMt: cvcRate },
      { type: "Time Charter", totalCostUsd: totalTimeCharterCost, ratePerMt: p50BaseCostPerMt },
    ],
    forecast: {
      route: `${originGeo.name} → ${primaryDischargeName.split(" ")[0]}`,
      vesselClass: "Panamax",
      confidencePct: 91,
      optimalEntryWindowStart: req.laycanStart || "2026-10-15",
      optimalEntryWindowEnd: req.laycanEnd || "2026-10-30",
      currentRateUsdPerMt: p50BaseCostPerMt,
      series: [
        { date: "2026-07", historicalUsdPerMt: Math.round((baseRatePerMt - 2.4) * 10) / 10, forecastUsdPerMt: null },
        { date: "2026-08", historicalUsdPerMt: Math.round((baseRatePerMt - 0.9) * 10) / 10, forecastUsdPerMt: null },
        { date: "2026-09", historicalUsdPerMt: baseRatePerMt, forecastUsdPerMt: null },
        { date: "2026-10", historicalUsdPerMt: null, forecastUsdPerMt: Math.round((baseRatePerMt + 1.1) * 10) / 10 },
        { date: "2026-11", historicalUsdPerMt: null, forecastUsdPerMt: Math.round((baseRatePerMt + 2.8) * 10) / 10 },
        { date: "2026-12", historicalUsdPerMt: null, forecastUsdPerMt: Math.round((baseRatePerMt + 3.5) * 10) / 10 },
      ],
    },
    riskLevel: "Medium",
    riskFactors: [
      `Baltic FFA forward curve signaling +${ffaTrendPct}% freight increase over 45 days`,
      `Seasonal weather active along corridor (${weatherStatusText})`,
      `${primaryDischargeName} direct mechanised berth active; rail siding connected to ${targetSteelPlant}`,
    ],
    expectedIdleDays: 1,
    estimatedSavingsUsd: netSavingsUsd,
    estimatedSavingsPct: netSavingsPct,
    generatedAt: new Date().toISOString(),
    modelVersion: "voyageai-milp-tft-v2.4",
  };

  // Locked Fixture Object
  const fixtureId = scenario.escrow.fixtureId || `FIX-2026-${taskId.toUpperCase().slice(0, 4)}`;
  const contractId = scenario.escrow.contractId || `ESC-${taskId.toUpperCase().slice(0, 4)}-2026`;
  const totalValueUsd = totalTimeCharterCost;

  const lockedFixture = {
    fixtureId,
    contractId,
    chartererName,
    chartererDesk,
    plantDestination: targetSteelPlant,
    shipOwner,
    vesselName,
    vesselClass: "Panamax",
    commodity: req.commodity,
    quantityMt,
    originPort: req.originPortName,
    dischargePort: primaryDischargeName,
    ratePerMtUsd: p50BaseCostPerMt,
    totalValueUsd,
    contractType: `Period Multi-Voyage Charter (${contractDuration} Months)`,
    contractDurationMonths: contractDuration,
    nbfcPartner: "HDFC Maritime Working Capital Facility",
    creditLineStatus: `Active — Credit line pre-approved for $${Math.max(3, Math.round((totalValueUsd * 1.2) / 1000000))}M`,
    securityHash: scenario.escrow.securityHash || "4a8f9c2d1e7b3a5f8c0e2d4b6a8c0e2d4b6a8c0e2d4b6a8c0e2d4b6a8c0e2d4b",
    twoFactorVerified: false,
    verifiedBy: "Captain Rajesh Nair (Chartering Manager)",
    verifiedAt: new Date().toISOString(),
  };

  // Escrow Milestones calculation (30% / 40% / 30%)
  const milestone1Amount = Math.round(totalValueUsd * 0.30);
  const milestone2Amount = Math.round(totalValueUsd * 0.40);
  const milestone3Amount = totalValueUsd - milestone1Amount - milestone2Amount;

  const escrowMilestones: EscrowMilestone[] = [
    {
      id: 1,
      title: "Notice of Readiness (NOR) Tendered at Loading Port",
      payoutPct: 30,
      payoutAmountUsd: milestone1Amount,
      condition: `Notice of Readiness (NOR) verified inside ${originGeo.name} Port geofence`,
      status: "Completed",
      verificationMethod: "Automated Satellite AIS Geofence Event & Terminal Confirmation",
      documentName: `NOR_Tender_${originGeo.name.toLowerCase()}_signed.pdf`,
      sha256Hash: "8f7e2c1a9b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
      geofenceName: `${originGeo.name} Outer Anchorage Geofence`,
      geofenceRadiusNm: 5.0,
      unlockedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      description: `Vessel arrived at ${originGeo.name} loading anchorage. NOR formally tendered and verified by terminal oracle. 30% advance freight disbursed.`,
    },
    {
      id: 2,
      title: "Clean Ocean Bill of Lading (B/L) Issued with SGS Draft Survey",
      payoutPct: 40,
      payoutAmountUsd: milestone2Amount,
      condition: `Certified Clean on Board B/L + SGS draft survey for ${quantityMt.toLocaleString()} MT ${req.commodity}`,
      status: "Active",
      verificationMethod: "Cryptographic Document Hash Match & SGS Digital Certificate Signature",
      documentName: `BL_SGS_DraftSurvey_${quantityMt}MT.pdf`,
      sha256Hash: "3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f8f7e2c1a9b3d4e5f6a7b8c9d0e1f2a",
      unlockedAt: undefined,
      description: `Loading complete at ${originGeo.name}. Mate's receipt and certified draft survey verified by SGS. 40% milestone ready for cryptographic release.`,
    },
    {
      id: 3,
      title: "Final Outturn Discharge & Zero Demurrage Clearance",
      payoutPct: 30,
      payoutAmountUsd: milestone3Amount,
      condition: `Complete discharge at ${primaryDischargeName} + final laytime statement with zero demurrage penalty`,
      status: "Pending",
      verificationMethod: "Port Terminal Gate Oracle & Draft Survey Outturn Confirmation",
      documentName: `Discharge_Statement_Laytime_${primaryDischargeName.split(" ")[0]}.pdf`,
      sha256Hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      geofenceName: `${primaryDischargeName} Mechanised Berth`,
      geofenceRadiusNm: 2.5,
      unlockedAt: undefined,
      description: `Vessel berthing at ${primaryDischargeName} mechanised deep-draft conveyor. Remaining 30% retention released upon final outturn discharge.`,
    },
  ];

  const escrow: EscrowContract = {
    ...lockedFixture,
    milestones: escrowMilestones,
  };

  // Tracking Route for Live Map
  const originPortObj: Port = {
    id: `port-${originGeo.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: originGeo.name,
    code: originGeo.name.slice(0, 3).toUpperCase(),
    country: originGeo.country,
    lat: originGeo.lat,
    lng: originGeo.lng,
    maxDraftM: originGeo.draftM,
    currentCongestionDays: 1.2,
    avgWaitDays: 1.0,
    status: "Green",
    activeVesselsCount: 14,
    anchorageQueueCount: 3,
    weather: {
      waveHeightM: 0.8,
      windSpeedKts: 11,
      visibilityKm: 12,
      condition: "Clear",
    },
  };

  const dischargePortObj: Port = {
    id: `port-${primaryDischargeName.toLowerCase().replace(/\s+/g, "-")}`,
    name: primaryDischargeName,
    code: primaryDischargeName.slice(0, 3).toUpperCase(),
    country: dischargeGeo.country,
    lat: dischargeGeo.lat,
    lng: dischargeGeo.lng,
    maxDraftM: dischargeGeo.draftM,
    currentCongestionDays: hasDhamra ? 0.8 : 4.2,
    avgWaitDays: hasDhamra ? 0.5 : 4.0,
    status: hasDhamra ? "Green" : "Amber",
    activeVesselsCount: 8,
    anchorageQueueCount: 2,
    weather: {
      waveHeightM: 1.16,
      windSpeedKts: 14,
      visibilityKm: 10,
      condition: "Partly Cloudy",
    },
  };

  const trackingVessel: Vessel = {
    id: `vessel-${vesselName.toLowerCase().replace(/\s+/g, "-")}`,
    name: vesselName,
    vesselClass: "Panamax",
    dwt: 75000,
    draft: 13.5,
    speedKts: 13.8,
    fuelConsumptionTonsPerDay: 28.5,
    status: "In Transit",
    currentPortId: originPortObj.id,
    currentLat: (originGeo.lat + dischargeGeo.lat) / 2,
    currentLng: (originGeo.lng + dischargeGeo.lng) / 2,
    destinationPortId: dischargePortObj.id,
    eta: req.laycanEnd || "2026-10-30",
    imoNumber: "9482910",
    flagState: "Singapore",
    yearBuilt: 2021,
  };

  // Estimate distance in NM
  const latDiff = dischargeGeo.lat - originGeo.lat;
  const lngDiff = dischargeGeo.lng - originGeo.lng;
  const approxDistanceNm = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 60 * 1.15);
  const estDays = Math.round((approxDistanceNm / (13.8 * 24)) * 10) / 10;

  const trackingRoute = {
    originPort: originPortObj,
    destinationPort: dischargePortObj,
    vessel: trackingVessel,
    distanceNm: Math.max(3800, approxDistanceNm),
    estTimeDays: Math.max(12, estDays),
    avgSpeedKts: 13.8,
    fuelEstimateTons: Math.round(Math.max(12, estDays) * 28.5),
    costEstimateUsd: totalTimeCharterCost,
    status: "Optimal" as const,
    weather: "Bay of Bengal Fair · Hs 1.16m",
    headingDeg: 304,
    dynamicDraftM: 13.5,
    dhamraAnchorageWeather: {
      waveHeightHs: 1.16,
      windKts: 14,
      status: "Green" as const,
    },
    paradipAnchorageWeather: {
      waveHeightHs: 1.84,
      windKts: 19,
      status: "Amber" as const,
    },
  };

  return {
    request: req,
    task,
    recommendation,
    lockedFixture,
    escrow,
    trackingRoute,
    vesselOptions: scenario.vesselOptions,
    riskAlerts: scenario.riskAlerts,
    idleEntries: scenario.idleEntries,
  };
}
