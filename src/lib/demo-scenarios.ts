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

export type OptimizationPipelineStep = "PREDICT" | "CONSTRAIN" | "OPTIMIZE" | "SIMULATE";

export interface OptimizationTaskStatus {
  taskId: string;
  currentStep: OptimizationPipelineStep;
  completedSteps: OptimizationPipelineStep[];
  isComplete: boolean;
  predictDetails: {
    modelName: string;
    ffaSignal: string;
    weatherStatus: string;
    forecastDays: number;
    trendPct: number;
    trendDirection: "up" | "down";
    summary: string;
  };
  constrainDetails: {
    hydrographicCheck: string;
    capesizeDraftViolation: string;
    lighteringOption: string;
    dhamraDirectBerthing: string;
    feasibleVesselClasses: string[];
    rejectedVesselClasses: string[];
    summary: string;
  };
  optimizeDetails: {
    solver: string;
    periodCoveragePct: number;
    periodVoyages: number;
    spotFlexibilityPct: number;
    spotVoyages: number;
    vesselAllocation: string;
    summary: string;
  };
  simulateDetails: {
    pathsRun: number;
    p50BaseCostPerMt: number;
    p90CeilingCostPerMt: number;
    varHedgeUsd: number;
    summary: string;
  };
}

export interface EscrowMilestone {
  id: number;
  title: string;
  payoutPct: number;
  payoutAmountUsd: number;
  condition: string;
  status: "Completed" | "Active" | "Pending";
  verificationMethod: string;
  documentName?: string;
  sha256Hash?: string;
  geofenceName?: string;
  geofenceRadiusNm?: number;
  unlockedAt?: string;
  description: string;
}

export interface EscrowContract {
  contractId: string;
  fixtureId: string;
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
  totalValueUsd: number;
  ratePerMtUsd: number;
  contractType: string;
  milestones: EscrowMilestone[];
  nbfcPartner: string;
  creditLineStatus: string;
  twoFactorVerified: boolean;
  verifiedBy: string;
  verifiedAt: string;
  securityHash: string;
}

export interface CustomProcurementRequest {
  commodity: string;
  quantityMt: number;
  originPortName: string;
  candidateDischargePorts: string[];
  selectedDischargePortName: string;
  targetSteelPlant: string;
  laycanStart: string;
  laycanEnd: string;
  numberOfVoyages: number;
  contractDurationMonths: number | null;
  scenarioId: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  request: {
    commodity: string;
    quantityMt: number;
    originPortName: string;
    originPortCountry: string;
    originPortLat: number;
    originPortLng: number;
    candidateDischargePorts: string[];
    selectedDischargePortName: string;
    selectedDischargePortLat: number;
    selectedDischargePortLng: number;
    targetSteelPlant: string;
    laycanStart: string;
    laycanEnd: string;
    numberOfVoyages: number;
    contractDurationMonths: number;
    isSparseCorridor?: boolean;
    weatherFallbackActive?: boolean;
  };
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

export const SCENARIO_GLADSTONE_DHAMRA: DemoScenario = {
  id: "scenario-gladstone-dhamra",
  name: "Gladstone (Australia) → Dhamra / Kalinganagar",
  badge: "Primary Demo Workflow",
  description: "150,000 MT Coking Coal procurement for Tata Steel Kalinganagar Plant via Deep-Draft Dhamra Port.",
  request: {
    commodity: "Coking Coal",
    quantityMt: 150000,
    originPortName: "Gladstone, Australia",
    originPortCountry: "Australia",
    originPortLat: -23.8431,
    originPortLng: 151.2684,
    candidateDischargePorts: ["Dhamra", "Paradip", "Haldia", "Vizag"],
    selectedDischargePortName: "Dhamra, India",
    selectedDischargePortLat: 20.7719,
    selectedDischargePortLng: 86.9658,
    targetSteelPlant: "Tata Steel Kalinganagar Plant (Odisha)",
    laycanStart: "2026-10-15",
    laycanEnd: "2026-10-30",
    numberOfVoyages: 2,
    contractDurationMonths: 3,
    isSparseCorridor: false,
    weatherFallbackActive: true,
  },
  task: {
    taskId: "8f7e2c1a",
    currentStep: "SIMULATE",
    completedSteps: ["PREDICT", "CONSTRAIN", "OPTIMIZE", "SIMULATE"],
    isComplete: true,
    predictDetails: {
      modelName: "Temporal Fusion Transformer (TFT) v2.4",
      ffaSignal: "Baltic Forward Freight Agreements (FFA) forward curve +14% freight rise over next 45-60 days",
      weatherStatus: "Live Weather API Offline → 30-Day Climatology Moving Averages Applied",
      forecastDays: 60,
      trendPct: 14.0,
      trendDirection: "up",
      summary: "Predictive freight curve signals imminent paper rally; 30-day climatology fallback ensures model robustness.",
    },
    constrainDetails: {
      hydrographicCheck: "PostGIS spatial hydrographic check completed across 4 candidate ports",
      capesizeDraftViolation: "Capesize loaded draft (16.2m) exceeds Haldia Port permissible draft limit (8.5m) — Draft Violation",
      lighteringOption: "Sagar / Sandheads Offshore Lightering Alternative calculated (+$4.50/MT barge transfer penalty)",
      dhamraDirectBerthing: "Dhamra Port (18.0m draft) allows 100% direct berthing with zero lightering penalty",
      feasibleVesselClasses: ["Panamax (75,000 MT)", "Supramax (55,000 MT)"],
      rejectedVesselClasses: ["Capesize (Draft violation at Haldia)", "Handysize (Inefficient unit economics)"],
      summary: "Dhamra Port selected for direct berthing; Haldia rejected due to $4.50/MT lightering penalty.",
    },
    optimizeDetails: {
      solver: "Mixed-Integer Linear Programming (MILP) via Google OR-Tools",
      periodCoveragePct: 62.5,
      periodVoyages: 5,
      spotFlexibilityPct: 37.5,
      spotVoyages: 3,
      vesselAllocation: "2 × Panamax (75,000 MT) shipments",
      summary: "Portfolio split: 62.5% Period coverage locked to hedge against FFA surge + 37.5% Spot flexibility.",
    },
    simulateDetails: {
      pathsRun: 10000,
      p50BaseCostPerMt: 24.80,
      p90CeilingCostPerMt: 32.40,
      varHedgeUsd: 1300000,
      summary: "Monte Carlo 10,000 paths: P50 Base $24.80/MT vs P90 Stress $32.40/MT with $1.3M downside risk hedge.",
    },
  },
  recommendation: {
    id: "rec-8f7e2c1a",
    requestId: "req-tata-150k",
    primaryAction: "LOCK 3-MONTH MULTI-VOYAGE CONTRACT",
    recommendedRouteText: "Gladstone (Australia) → Dhamra Port (Direct Discharge, zero lightering penalty)",
    vesselStrategyText: "2 × Panamax (75,000 MT) — 100% Port Feasible at Dhamra Port",
    portfolioSplitText: "5 Period Voyages (62.5%) + 3 Spot Voyages (37.5%)",
    expectedLandedCostP50: 24.80,
    stressCeilingP90: 32.40,
    netSavingsPct: 8.4,
    netSavingsUsd: 520000,
    backhaulMonetizationText: "Post-discharge, vessel will load export Iron Ore from Paradip to Asia to offset return ballast fuel costs.",
    lighteringComparison: {
      haldiaLighteringCostPerMt: 4.50,
      dhamraDirectSavingsPerMt: 4.50,
      sagarFloatingCraneRate: 2.80,
    },
    recommendedVessel: {
      vesselClass: "Panamax",
      dwt: 75000,
      draft: 13.5,
      fitScorePct: 98,
      reasoning: "Panamax draft (13.5m) is 100% compatible with Dhamra Port (18.0m draft limit) with zero lightering penalty and optimal 2-voyage allocation for 150,000 MT coking coal.",
      portCompatible: true,
    },
    recommendedContractType: "Time Charter",
    contractComparison: [
      { type: "Spot", totalCostUsd: 4240000, ratePerMt: 28.27 },
      { type: "CVC", totalCostUsd: 3910000, ratePerMt: 26.07 },
      { type: "Time Charter", totalCostUsd: 3720000, ratePerMt: 24.80 },
    ],
    forecast: {
      route: "Gladstone → Dhamra",
      vesselClass: "Panamax",
      confidencePct: 91,
      optimalEntryWindowStart: "2026-10-15",
      optimalEntryWindowEnd: "2026-10-24",
      currentRateUsdPerMt: 24.80,
      series: [
        { date: "2026-07", historicalUsdPerMt: 22.4, forecastUsdPerMt: null },
        { date: "2026-08", historicalUsdPerMt: 23.9, forecastUsdPerMt: null },
        { date: "2026-09", historicalUsdPerMt: 24.8, forecastUsdPerMt: null },
        { date: "2026-10", historicalUsdPerMt: null, forecastUsdPerMt: 25.9 },
        { date: "2026-11", historicalUsdPerMt: null, forecastUsdPerMt: 27.6 },
        { date: "2026-12", historicalUsdPerMt: null, forecastUsdPerMt: 28.3 },
      ],
    },
    riskLevel: "Medium",
    riskFactors: [
      "Baltic FFA forward curve signaling +14% freight increase over 45 days",
      "Moderate seasonal monsoon wave activity in Bay of Bengal (Hs = 1.16m)",
      "Paradip outer anchorage queue extending; Dhamra berth clear",
    ],
    expectedIdleDays: 1,
    estimatedSavingsUsd: 520000,
    estimatedSavingsPct: 8.4,
    generatedAt: "2026-08-30T07:12:00Z",
    modelVersion: "voyageai-milp-tft-v2.4",
  },
  escrow: {
    contractId: "ESC-8F7E-2026",
    fixtureId: "FIX-2026-8F7E",
    chartererName: "Captain Rajesh Nair",
    chartererDesk: "Tata Steel / JSW Maritime Desk",
    plantDestination: "Tata Steel Kalinganagar Plant",
    shipOwner: "Pacific Basin Shipping Ltd.",
    vesselName: "MV Kalinganagar Voyager",
    vesselClass: "Panamax",
    commodity: "Coking Coal",
    quantityMt: 150000,
    originPort: "Gladstone, Australia",
    dischargePort: "Dhamra, India",
    totalValueUsd: 3720000,
    ratePerMtUsd: 24.80,
    contractType: "Period Multi-Voyage Charter (3 Months)",
    nbfcPartner: "HDFC Maritime Working Capital Facility",
    creditLineStatus: "Active — Credit line pre-approved for $4.5M",
    twoFactorVerified: true,
    verifiedBy: "Captain Rajesh Nair (Chartering Manager)",
    verifiedAt: "2026-08-30T07:15:22Z",
    securityHash: "8f7e2c1a4e9b817d23f1a0e447b938914619fc04ad919245e9981a8b3017cf12",
    milestones: [
      {
        id: 1,
        title: "Milestone 1 (15% Booking Payout)",
        payoutPct: 15,
        payoutAmountUsd: 558000,
        condition: "Digital contract execution & fixture confirmation",
        status: "Completed",
        verificationMethod: "2FA Digital Signature + NBFC Credit Line Activation",
        documentName: "Digital_Charter_Fixture_FIX-2026-8F7E.pdf",
        sha256Hash: "a93b448f2190c173e4db1208fb944208e920fae13028c617bb492048fe09112a",
        unlockedAt: "2026-08-30 07:15:30 UTC",
        description: "Instant unlock upon digital contract signature, activating shipowner advance booking payout and partner NBFC credit line.",
      },
      {
        id: 2,
        title: "Milestone 2 (40% Loading Payout)",
        payoutPct: 40,
        payoutAmountUsd: 1488000,
        condition: "Satellite AIS geofence entry at Gladstone Port + Digital Bill of Lading (B/L) SHA-256 hash match",
        status: "Active",
        verificationMethod: "Satellite AIS Geofence Telemetry + Cryptographic B/L Hash Matching",
        documentName: "Electronic_Bill_of_Lading_BL-GLAD-9912.pdf",
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        geofenceName: "Gladstone Outer Anchor & Loading Terminal (23.84°S, 151.27°E)",
        geofenceRadiusNm: 4.5,
        unlockedAt: "2026-08-30 07:18:45 UTC",
        description: "Auto-released when satellite AIS confirms vessel entry into Gladstone loading geofence and digital Bill of Lading hash verifies.",
      },
      {
        id: 3,
        title: "Milestone 3 (45% Discharge Payout)",
        payoutPct: 45,
        payoutAmountUsd: 1674000,
        condition: "PostGIS geofence arrival at Dhamra Port outer anchorage + Final Draft Survey document hash match",
        status: "Pending",
        verificationMethod: "PostGIS Spatial Outer Anchorage Geofence + Certified Draft Survey Document Hash",
        documentName: "Dhamra_Port_Certified_Draft_Survey_DS-881.pdf",
        sha256Hash: "7d8902f4a1389c902341ba04882194cc28b010488ae8210381048209bb4819aa",
        geofenceName: "Dhamra Outer Anchorage Polygon (20.77°N, 86.96°E)",
        geofenceRadiusNm: 6.0,
        description: "Final settlement unlocked when vessel arrives at Dhamra PostGIS anchorage polygon and digital draft survey hash matches.",
      },
    ],
  },
  trackingRoute: {
    id: "route-gladstone-dhamra",
    originPort: {
      id: "port-gladstone",
      name: "Gladstone",
      country: "Australia",
      countryCode: "AU",
      lat: -23.8431,
      lng: 151.2684,
      maxDraft: 19.8,
      berthAvailable: true,
      congestionLevel: "Low",
    },
    destinationPort: {
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
    vessel: {
      id: "vsl-kalinganagar-voyager",
      name: "MV Kalinganagar Voyager",
      vesselClass: "Panamax",
      dwt: 75000,
      draft: 13.5,
      status: "En Route",
      currentLat: -5.2,
      currentLng: 106.8,
      utilizationPct: 100,
    },
    distanceNm: 5820,
    estTimeDays: 13.2,
    avgSpeedKts: 13.8,
    headingDeg: 312,
    dynamicDraftM: 13.5,
    status: "Optimal",
    weather: "Good",
    etd: "2026-10-15",
    eta: "2026-10-28",
    cargoDescription: "Coking Coal (75,000 MT Voyage 1/2)",
    dhamraAnchorageWeather: {
      waveHeightHs: 1.16,
      windKts: 11.4,
      status: "Green",
    },
    paradipAnchorageWeather: {
      waveHeightHs: 1.85,
      windKts: 18.2,
      status: "Amber",
    },
  },
  vesselOptions: [
    {
      vesselClass: "Panamax",
      capacityRange: "70K-82K DWT",
      dwtRange: "75,000 DWT",
      draftRange: "13.2-13.8 m",
      cargoFitPct: 98,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 24.80,
      idleRisk: "Low",
      suitabilityStatus: "Best Match",
      availability: "Available",
      reasoning: "Panamax draft is 100% compatible with Dhamra Port (18.0m limit). Perfectly splits 150,000 MT into 2 direct shipments with zero lightering penalty.",
      reasons: [
        "100% port feasible at Dhamra Port (18.0m draft)",
        "Zero lightering penalty (saves $4.50/MT vs Haldia)",
        "Optimal 2-voyage allocation for 150k MT coking coal",
        "High fuel efficiency with post-discharge Paradip backhaul",
      ],
    },
    {
      vesselClass: "Supramax",
      capacityRange: "50K-60K DWT",
      dwtRange: "55,000 DWT",
      draftRange: "11.2-12.0 m",
      cargoFitPct: 79,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 27.40,
      idleRisk: "Medium",
      suitabilityStatus: "Good Fit",
      availability: "Available",
      reasoning: "Fully port compatible but requires 3 voyages instead of 2, increasing total operational bunker burn and port call turnaround costs.",
      reasons: [
        "Port draft compatible",
        "Higher freight rate per MT ($27.40/MT)",
        "Requires 3 voyages to move 150,000 MT",
      ],
    },
    {
      vesselClass: "Capesize",
      capacityRange: "140K-180K DWT",
      dwtRange: "160,000 DWT",
      draftRange: "16.2-17.5 m",
      cargoFitPct: 62,
      portCompatibility: false,
      estimatedFreightUsdPerMt: 23.50,
      idleRisk: "High",
      suitabilityStatus: "Not Suitable",
      availability: "Limited",
      reasoning: "Capesize loaded draft (16.2m) violates Haldia Port (8.5m permissible limit). Can only discharge at Haldia with $4.50/MT Sagar lightering penalty.",
      reasons: [
        "Draft violation at Haldia Port (16.2m vs 8.5m limit)",
        "Requires Sagar/Sandheads offshore lightering (+ $4.50/MT)",
        "High demurrage risk if weather deteriorates during barge lightering",
      ],
    },
    {
      vesselClass: "Handysize",
      capacityRange: "28K-38K DWT",
      dwtRange: "35,000 DWT",
      draftRange: "9.0-10.2 m",
      cargoFitPct: 41,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 32.10,
      idleRisk: "High",
      suitabilityStatus: "Marginal",
      availability: "Available",
      reasoning: "Small cargo volume per voyage requires 5 shipments for 150,000 MT, yielding unviable unit freight economics.",
      reasons: [
        "Excessive voyage count (5 trips)",
        "Highest cost per MT ($32.10/MT)",
        "Unfavorable carbon and fuel footprint",
      ],
    },
  ],
  riskAlerts: [
    {
      id: "risk-ffa-01",
      level: "High",
      category: "Freight Volatility",
      title: "Baltic Forward Freight Agreements (FFA) signaling +14% rally",
      description: "Q4 forward paper contracts indicate paper freight surge. Period charter lock recommended immediately.",
      route: "Pacific Basin → Indian East Coast",
      detectedAt: "2026-08-30T06:30:00Z",
      acknowledged: false,
    },
    {
      id: "risk-weather-02",
      level: "Medium",
      category: "Weather",
      title: "Live Weather API Timeout → Climatology Averages Active",
      description: "Bay of Bengal live weather service timed out. 30-day regional climatology moving averages loaded seamlessly.",
      route: "Bay of Bengal Corridor",
      detectedAt: "2026-08-30T07:01:00Z",
      acknowledged: true,
    },
    {
      id: "risk-port-03",
      level: "Medium",
      category: "Port Congestion",
      title: "Paradip queue extending; Dhamra berth unobstructed",
      description: "Paradip queue at 4.8 days average waiting time. Dhamra deep-water berth has zero queue.",
      route: "Dhamra / Paradip Hub",
      detectedAt: "2026-08-30T07:05:00Z",
      acknowledged: false,
    },
  ],
  idleEntries: [
    {
      vesselId: "vsl-kalinganagar-voyager",
      vesselName: "MV Kalinganagar Voyager",
      expectedIdleDays: 1,
      location: "Post-Dhamra / Paradip Anchorage",
      repositioningSuggestion: "Backhaul iron ore fixture ex-Paradip to Qingdao/Asia negotiated to eliminate ballast return fuel.",
    },
  ],
};

export const SCENARIO_MAPUTO_DHAMRA: DemoScenario = {
  id: "scenario-maputo-eastcoast",
  name: "Maputo (Mozambique) → Dhamra (Sparse Corridor)",
  badge: "Cold-Start & Resilient Fallback",
  description: "150,000 MT Coking Coal from Mozambique sparse data corridor. Triggers Cold-Start Monte Carlo Proxy and Climatology fallback.",
  request: {
    commodity: "Coking Coal",
    quantityMt: 150000,
    originPortName: "Maputo, Mozambique",
    originPortCountry: "Mozambique",
    originPortLat: -25.9692,
    originPortLng: 32.5732,
    candidateDischargePorts: ["Dhamra", "Paradip", "Haldia"],
    selectedDischargePortName: "Dhamra, India",
    selectedDischargePortLat: 20.7719,
    selectedDischargePortLng: 86.9658,
    targetSteelPlant: "Tata Steel Kalinganagar Plant (Odisha)",
    laycanStart: "2026-10-20",
    laycanEnd: "2026-11-05",
    numberOfVoyages: 2,
    contractDurationMonths: 3,
    isSparseCorridor: true,
    weatherFallbackActive: true,
  },
  task: {
    taskId: "8f7e2c1a",
    currentStep: "SIMULATE",
    completedSteps: ["PREDICT", "CONSTRAIN", "OPTIMIZE", "SIMULATE"],
    isComplete: true,
    predictDetails: {
      modelName: "Cold-Start Regional Proxy Monte Carlo (Deep Learning Bypassed)",
      ffaSignal: "Indian Ocean FFA forward indicator +12.8% over 45 days",
      weatherStatus: "Live Weather API Offline → 30-Day Climatology Fallback Active",
      forecastDays: 60,
      trendPct: 12.8,
      trendDirection: "up",
      summary: "Sparse data corridor triggered automated Monte Carlo regional proxy parameters with climatology resilience.",
    },
    constrainDetails: {
      hydrographicCheck: "Hydrographic check verified Mozambique Channel & Bay of Bengal routing",
      capesizeDraftViolation: "Capesize draft (16.2m) cannot berth at Haldia (8.5m draft limit)",
      lighteringOption: "Sagar Offshore Lightering computed at +$4.50/MT penalty vs direct Dhamra berthing",
      dhamraDirectBerthing: "Dhamra 18.0m draft provides unrestricted direct discharge",
      feasibleVesselClasses: ["Panamax (75,000 MT)", "Supramax (56,000 MT)"],
      rejectedVesselClasses: ["Capesize", "Handysize"],
      summary: "Dhamra selected for zero lightering penalty; Capesize draft limit avoided.",
    },
    optimizeDetails: {
      solver: "MILP Solver (Google OR-Tools)",
      periodCoveragePct: 62.5,
      periodVoyages: 5,
      spotFlexibilityPct: 37.5,
      spotVoyages: 3,
      vesselAllocation: "2 × Panamax (75,000 MT)",
      summary: "62.5% committed period coverage hedge against Mozambique freight spikes.",
    },
    simulateDetails: {
      pathsRun: 10000,
      p50BaseCostPerMt: 25.20,
      p90CeilingCostPerMt: 33.10,
      varHedgeUsd: 1150000,
      summary: "Monte Carlo 10k paths: P50 Base $25.20/MT vs P90 Stress $33.10/MT ($1.15M hedge).",
    },
  },
  recommendation: {
    id: "rec-maputo-992",
    requestId: "req-maputo-150k",
    primaryAction: "LOCK 3-MONTH MULTI-VOYAGE CONTRACT",
    recommendedRouteText: "Maputo (Mozambique) → Dhamra Port (Direct Discharge)",
    vesselStrategyText: "2 × Panamax (75,000 MT) — 100% Port Feasible at Dhamra",
    portfolioSplitText: "5 Period Voyages (62.5%) + 3 Spot Voyages (37.5%)",
    expectedLandedCostP50: 25.20,
    stressCeilingP90: 33.10,
    netSavingsPct: 7.9,
    netSavingsUsd: 490000,
    backhaulMonetizationText: "Vessel completes discharge at Dhamra and positions to Paradip for iron ore backhaul export.",
    lighteringComparison: {
      haldiaLighteringCostPerMt: 4.50,
      dhamraDirectSavingsPerMt: 4.50,
      sagarFloatingCraneRate: 2.80,
    },
    recommendedVessel: {
      vesselClass: "Panamax",
      dwt: 76500,
      draft: 13.4,
      fitScorePct: 96,
      reasoning: "Panamax handles Mozambique coal volume with high fuel efficiency across the Indian Ocean corridor and berths directly at Dhamra.",
      portCompatible: true,
    },
    recommendedContractType: "Time Charter",
    contractComparison: [
      { type: "Spot", totalCostUsd: 4270000, ratePerMt: 28.47 },
      { type: "CVC", totalCostUsd: 3990000, ratePerMt: 26.60 },
      { type: "Time Charter", totalCostUsd: 3780000, ratePerMt: 25.20 },
    ],
    forecast: {
      route: "Maputo → Dhamra",
      vesselClass: "Panamax",
      confidencePct: 88,
      optimalEntryWindowStart: "2026-10-20",
      optimalEntryWindowEnd: "2026-10-29",
      currentRateUsdPerMt: 25.20,
      series: [
        { date: "2026-07", historicalUsdPerMt: 23.1, forecastUsdPerMt: null },
        { date: "2026-08", historicalUsdPerMt: 24.5, forecastUsdPerMt: null },
        { date: "2026-09", historicalUsdPerMt: 25.2, forecastUsdPerMt: null },
        { date: "2026-10", historicalUsdPerMt: null, forecastUsdPerMt: 26.4 },
        { date: "2026-11", historicalUsdPerMt: null, forecastUsdPerMt: 27.9 },
        { date: "2026-12", historicalUsdPerMt: null, forecastUsdPerMt: 28.8 },
      ],
    },
    riskLevel: "Medium",
    riskFactors: [
      "Sparse corridor historical data — cold start Monte Carlo proxy active",
      "Live weather API offline — 30-day climatology averages applied",
      "Mozambique channel swell conditions moderate",
    ],
    expectedIdleDays: 2,
    estimatedSavingsUsd: 490000,
    estimatedSavingsPct: 7.9,
    generatedAt: "2026-08-30T07:12:00Z",
    modelVersion: "voyageai-coldstart-v2.1",
  },
  escrow: {
    contractId: "ESC-MAP-2026",
    fixtureId: "FIX-2026-MAP-92",
    chartererName: "Captain Rajesh Nair",
    chartererDesk: "Tata Steel Maritime Desk",
    plantDestination: "Tata Steel Kalinganagar Plant",
    shipOwner: "Oldendorff Carriers",
    vesselName: "MV Odisha Star",
    vesselClass: "Panamax",
    commodity: "Coking Coal",
    quantityMt: 150000,
    originPort: "Maputo, Mozambique",
    dischargePort: "Dhamra, India",
    totalValueUsd: 3780000,
    ratePerMtUsd: 25.20,
    contractType: "Period Multi-Voyage Charter (3 Months)",
    nbfcPartner: "Axis Bank Maritime Trade Credit",
    creditLineStatus: "Active — Credit line pre-approved for $4.2M",
    twoFactorVerified: true,
    verifiedBy: "Captain Rajesh Nair",
    verifiedAt: "2026-08-30T07:15:40Z",
    securityHash: "5b128e4418a09f8c129e840184b910488210381048209bb4819aa93b448f2190",
    milestones: [
      {
        id: 1,
        title: "Milestone 1 (15% Booking Payout)",
        payoutPct: 15,
        payoutAmountUsd: 567000,
        condition: "Digital contract execution & fixture confirmation",
        status: "Completed",
        verificationMethod: "2FA Digital Signature + NBFC Credit Line Activation",
        documentName: "Digital_Charter_Fixture_FIX-2026-MAP-92.pdf",
        sha256Hash: "b84819aa93b448f2190c173e4db1208fb944208e920fae13028c617bb492048f",
        unlockedAt: "2026-08-30 07:15:50 UTC",
        description: "Advance booking payout unlocked with partner working capital credit line.",
      },
      {
        id: 2,
        title: "Milestone 2 (40% Loading Payout)",
        payoutPct: 40,
        payoutAmountUsd: 1512000,
        condition: "Satellite AIS geofence entry at Maputo Port + Digital B/L SHA-256 hash match",
        status: "Active",
        verificationMethod: "Satellite AIS Geofence Telemetry + Cryptographic B/L Hash Matching",
        documentName: "Electronic_Bill_of_Lading_BL-MAP-4412.pdf",
        sha256Hash: "f1a0e447b938914619fc04ad919245e9981a8b3017cf128f7e2c1a4e9b817d23",
        geofenceName: "Maputo Coal Terminal Geofence (25.97°S, 32.57°E)",
        geofenceRadiusNm: 5.0,
        unlockedAt: "2026-08-30 07:19:10 UTC",
        description: "Released when satellite AIS verifies vessel at Maputo terminal and cryptographic B/L hash matches.",
      },
      {
        id: 3,
        title: "Milestone 3 (45% Discharge Payout)",
        payoutPct: 45,
        payoutAmountUsd: 1701000,
        condition: "PostGIS geofence arrival at Dhamra outer anchorage + Certified Draft Survey hash match",
        status: "Pending",
        verificationMethod: "PostGIS Spatial Geofence + Certified Draft Survey Hash",
        documentName: "Dhamra_Port_Certified_Draft_Survey_DS-994.pdf",
        sha256Hash: "c173e4db1208fb944208e920fae13028c617bb492048fe09112ab84819aa93b4",
        geofenceName: "Dhamra Outer Anchorage Polygon (20.77°N, 86.96°E)",
        geofenceRadiusNm: 6.0,
        description: "Full settlement unlocked upon arrival at Dhamra outer anchorage polygon and draft survey document hash match.",
      },
    ],
  },
  trackingRoute: {
    id: "route-maputo-dhamra",
    originPort: {
      id: "port-maputo",
      name: "Maputo",
      country: "Mozambique",
      countryCode: "MZ",
      lat: -25.9692,
      lng: 32.5732,
      maxDraft: 15.5,
      berthAvailable: true,
      congestionLevel: "Low",
    },
    destinationPort: {
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
    vessel: {
      id: "vsl-odisha-star",
      name: "MV Odisha Star",
      vesselClass: "Panamax",
      dwt: 76500,
      draft: 13.4,
      status: "En Route",
      currentLat: -8.1,
      currentLng: 65.4,
      utilizationPct: 100,
    },
    distanceNm: 4620,
    estTimeDays: 11.0,
    avgSpeedKts: 14.1,
    headingDeg: 42,
    dynamicDraftM: 13.4,
    status: "Optimal",
    weather: "Good",
    etd: "2026-10-20",
    eta: "2026-10-31",
    cargoDescription: "Coking Coal (75,000 MT Voyage 1/2)",
    dhamraAnchorageWeather: {
      waveHeightHs: 1.16,
      windKts: 11.4,
      status: "Green",
    },
    paradipAnchorageWeather: {
      waveHeightHs: 1.85,
      windKts: 18.2,
      status: "Amber",
    },
  },
  vesselOptions: [
    {
      vesselClass: "Panamax",
      capacityRange: "70K-82K DWT",
      dwtRange: "76,500 DWT",
      draftRange: "13.2-13.8 m",
      cargoFitPct: 96,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 25.20,
      idleRisk: "Low",
      suitabilityStatus: "Best Match",
      availability: "Available",
      reasoning: "Optimal draft and beam for Mozambique export terminal and Dhamra deep-water berthing.",
      reasons: ["100% compatible with Maputo & Dhamra ports", "Zero lightering costs", "Lower cost per ton"],
    },
    {
      vesselClass: "Supramax",
      capacityRange: "50K-60K DWT",
      dwtRange: "56,000 DWT",
      draftRange: "11.2-12.0 m",
      cargoFitPct: 81,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 28.10,
      idleRisk: "Medium",
      suitabilityStatus: "Good Fit",
      availability: "Available",
      reasoning: "Compatible but requires 3 voyages, increasing fuel burn.",
      reasons: ["Draft compatible", "Higher unit rate ($28.10/MT)"],
    },
    {
      vesselClass: "Capesize",
      capacityRange: "140K-180K DWT",
      dwtRange: "160,000 DWT",
      draftRange: "16.2-17.5 m",
      cargoFitPct: 58,
      portCompatibility: false,
      estimatedFreightUsdPerMt: 24.10,
      idleRisk: "High",
      suitabilityStatus: "Not Suitable",
      availability: "Limited",
      reasoning: "Draft exceeds Maputo outer channel and Haldia draft limits.",
      reasons: ["Channel draft restriction", "Lightering requirement"],
    },
    {
      vesselClass: "Handysize",
      capacityRange: "28K-38K DWT",
      dwtRange: "35,000 DWT",
      draftRange: "9.0-10.2 m",
      cargoFitPct: 40,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 32.80,
      idleRisk: "High",
      suitabilityStatus: "Marginal",
      availability: "Available",
      reasoning: "Uneconomic for 150,000 MT coking coal requirement.",
      reasons: ["High freight rate", "5 voyages required"],
    },
  ],
  riskAlerts: [
    {
      id: "risk-maputo-01",
      level: "Medium",
      category: "Freight Volatility",
      title: "Mozambique Corridor Cold-Start Active",
      description: "Low historical frequency triggered Monte Carlo regional proxy modeling.",
      route: "Maputo → Dhamra",
      detectedAt: "2026-08-30T06:50:00Z",
      acknowledged: true,
    },
  ],
  idleEntries: [
    {
      vesselId: "vsl-odisha-star",
      vesselName: "MV Odisha Star",
      expectedIdleDays: 2,
      location: "Post-Dhamra / Paradip Anchorage",
      repositioningSuggestion: "Backhaul iron ore export ex-Paradip scheduled to eliminate return ballast cost.",
    },
  ],
};

export const SCENARIO_NEWCASTLE_PARADIP: DemoScenario = {
  id: "scenario-newcastle-paradip",
  name: "Newcastle (Australia) → Paradip (Quarterly 600K MT)",
  badge: "Quarterly Program",
  description: "600,000 MT Coking Coal quarterly supply program across 4 voyages to Paradip Port.",
  request: {
    commodity: "Coal",
    quantityMt: 600000,
    originPortName: "Newcastle, Australia",
    originPortCountry: "Australia",
    originPortLat: -32.9167,
    originPortLng: 151.75,
    candidateDischargePorts: ["Paradip", "Dhamra", "Vizag"],
    selectedDischargePortName: "Paradip, India",
    selectedDischargePortLat: 20.3167,
    selectedDischargePortLng: 86.6167,
    targetSteelPlant: "Tata Steel Kalinganagar Plant (Odisha)",
    laycanStart: "2026-09-01",
    laycanEnd: "2026-11-30",
    numberOfVoyages: 4,
    contractDurationMonths: 3,
    isSparseCorridor: false,
    weatherFallbackActive: false,
  },
  task: {
    taskId: "8f7e2c1a",
    currentStep: "SIMULATE",
    completedSteps: ["PREDICT", "CONSTRAIN", "OPTIMIZE", "SIMULATE"],
    isComplete: true,
    predictDetails: {
      modelName: "Temporal Fusion Transformer (TFT) v2.4",
      ffaSignal: "FFA forward rates easing to $18.50/MT in October, optimal entry late September",
      weatherStatus: "Live Weather API Online — Normal Indian Ocean Conditions",
      forecastDays: 90,
      trendPct: 8.5,
      trendDirection: "down",
      summary: "Freight forecast indicates optimal entry window in late September to capitalize on rate dip.",
    },
    constrainDetails: {
      hydrographicCheck: "Paradip 18.0m max draft compatible with Capesize and Panamax bulkers",
      capesizeDraftViolation: "Paradip accepts Capesize, but berth queue extends turnaround time",
      lighteringOption: "Zero lightering required at Paradip main deep-water coal berth",
      dhamraDirectBerthing: "Alternative berth available at Dhamra if Paradip queue exceeds 5 days",
      feasibleVesselClasses: ["Panamax (82,000 MT)", "Capesize (150,000 MT)"],
      rejectedVesselClasses: ["Handysize"],
      summary: "Panamax selected for balanced berth queue transit and port turnaround.",
    },
    optimizeDetails: {
      solver: "MILP Solver (Google OR-Tools)",
      periodCoveragePct: 75.0,
      periodVoyages: 3,
      spotFlexibilityPct: 25.0,
      spotVoyages: 1,
      vesselAllocation: "4 × Panamax (82,000 MT) across 3-month contract",
      summary: "75% CVC / Period contract coverage locks $1.2M savings vs volatile spot market.",
    },
    simulateDetails: {
      pathsRun: 10000,
      p50BaseCostPerMt: 18.50,
      p90CeilingCostPerMt: 22.80,
      varHedgeUsd: 1480000,
      summary: "Monte Carlo 10k paths: P50 Base $18.50/MT vs P90 Stress $22.80/MT.",
    },
  },
  recommendation: {
    id: "rec-newcastle-8841",
    requestId: "req-nc-600k",
    primaryAction: "LOCK 3-MONTH CVC CONTRACT",
    recommendedRouteText: "Newcastle (Australia) → Paradip Port (4 Voyages Program)",
    vesselStrategyText: "Panamax Fleet (82,000 DWT) — 4 Scheduled Voyages",
    portfolioSplitText: "3 Period Voyages (75%) + 1 Spot Voyage (25%)",
    expectedLandedCostP50: 18.50,
    stressCeilingP90: 22.80,
    netSavingsPct: 11.9,
    netSavingsUsd: 1200000,
    backhaulMonetizationText: "Repositioning iron ore opportunity ex-Paradip / Singapore to China offsets ballast voyages.",
    lighteringComparison: {
      haldiaLighteringCostPerMt: 4.50,
      dhamraDirectSavingsPerMt: 0,
      sagarFloatingCraneRate: 2.80,
    },
    recommendedVessel: {
      vesselClass: "Panamax",
      dwt: 82000,
      draft: 13.2,
      fitScorePct: 94,
      reasoning: "Panamax draft is compatible with Paradip berth restrictions and executes 600,000 MT across 4 voyages efficiently without exceeding port handling capacity.",
      portCompatible: true,
    },
    recommendedContractType: "CVC",
    contractComparison: [
      { type: "Spot", totalCostUsd: 12600000, ratePerMt: 21.00 },
      { type: "CVC", totalCostUsd: 11100000, ratePerMt: 18.50 },
      { type: "Time Charter", totalCostUsd: 11850000, ratePerMt: 19.75 },
    ],
    forecast: {
      route: "Australia → Paradip",
      vesselClass: "Panamax",
      confidencePct: 87,
      optimalEntryWindowStart: "2026-09-20",
      optimalEntryWindowEnd: "2026-09-28",
      currentRateUsdPerMt: 25.70,
      series: [
        { date: "2026-05", historicalUsdPerMt: 22.1, forecastUsdPerMt: null },
        { date: "2026-06", historicalUsdPerMt: 24.8, forecastUsdPerMt: null },
        { date: "2026-07", historicalUsdPerMt: 23.6, forecastUsdPerMt: null },
        { date: "2026-08", historicalUsdPerMt: 25.7, forecastUsdPerMt: null },
        { date: "2026-09", historicalUsdPerMt: null, forecastUsdPerMt: 21.4 },
        { date: "2026-10", historicalUsdPerMt: null, forecastUsdPerMt: 18.5 },
      ],
    },
    riskLevel: "Medium",
    riskFactors: [
      "Seasonal monsoon queue building at Paradip berth",
      "Australian origin weather window monitoring active",
    ],
    expectedIdleDays: 3,
    estimatedSavingsUsd: 1200000,
    estimatedSavingsPct: 11.9,
    generatedAt: "2026-08-20T09:12:00Z",
    modelVersion: "voyageai-core-v0.9",
  },
  escrow: {
    contractId: "ESC-NC-2026",
    fixtureId: "FIX-2026-NC-441",
    chartererName: "Captain Rajesh Nair",
    chartererDesk: "Tata Steel Maritime Desk",
    plantDestination: "Tata Steel Kalinganagar Plant",
    shipOwner: "Ocean Bulk Navigation Inc.",
    vesselName: "MV Ocean Progress",
    vesselClass: "Panamax",
    commodity: "Coal",
    quantityMt: 600000,
    originPort: "Newcastle, Australia",
    dischargePort: "Paradip, India",
    totalValueUsd: 11100000,
    ratePerMtUsd: 18.50,
    contractType: "Consecutive Voyage Contract (CVC - 4 Voyages)",
    nbfcPartner: "State Bank of India Maritime Trade Credit",
    creditLineStatus: "Active — Credit line pre-approved for $12.5M",
    twoFactorVerified: true,
    verifiedBy: "Captain Rajesh Nair",
    verifiedAt: "2026-08-20T14:40:00Z",
    securityHash: "23f1a0e447b938914619fc04ad919245e9981a8b3017cf128f7e2c1a4e9b817d",
    milestones: [
      {
        id: 1,
        title: "Milestone 1 (15% Booking Payout)",
        payoutPct: 15,
        payoutAmountUsd: 1665000,
        condition: "Digital contract execution & fixture confirmation",
        status: "Completed",
        verificationMethod: "2FA Digital Signature + NBFC Credit Line Activation",
        documentName: "Digital_CVC_Contract_FIX-2026-NC-441.pdf",
        sha256Hash: "4db1208fb944208e920fae13028c617bb492048fe09112ab84819aa93b448f21",
        unlockedAt: "2026-08-20 14:41:00 UTC",
        description: "Booking advance payout unlocked upon digital fixture execution.",
      },
      {
        id: 2,
        title: "Milestone 2 (40% Loading Payout)",
        payoutPct: 40,
        payoutAmountUsd: 4440000,
        condition: "Satellite AIS geofence entry at Newcastle + Digital B/L SHA-256 hash match",
        status: "Active",
        verificationMethod: "Satellite AIS Geofence Telemetry + Cryptographic B/L Hash Matching",
        documentName: "Electronic_Bill_of_Lading_BL-NC-8801.pdf",
        sha256Hash: "19fc04ad919245e9981a8b3017cf128f7e2c1a4e9b817d23f1a0e447b9389146",
        geofenceName: "Newcastle Coal Terminal Geofence (32.92°S, 151.75°E)",
        geofenceRadiusNm: 5.0,
        unlockedAt: "2026-08-20 14:45:00 UTC",
        description: "Auto-released when satellite AIS confirms loading at Newcastle terminal.",
      },
      {
        id: 3,
        title: "Milestone 3 (45% Discharge Payout)",
        payoutPct: 45,
        payoutAmountUsd: 4995000,
        condition: "PostGIS geofence arrival at Paradip outer anchorage + Certified Draft Survey hash match",
        status: "Pending",
        verificationMethod: "PostGIS Spatial Geofence + Certified Draft Survey Hash",
        documentName: "Paradip_Port_Certified_Draft_Survey_DS-552.pdf",
        sha256Hash: "920fae13028c617bb492048fe09112ab84819aa93b448f2190c173e4db1208fb",
        geofenceName: "Paradip Outer Anchorage Polygon (20.32°N, 86.62°E)",
        geofenceRadiusNm: 6.0,
        description: "Full settlement unlocked upon arrival at Paradip outer anchorage polygon.",
      },
    ],
  },
  trackingRoute: {
    id: "route-newcastle-paradip",
    originPort: {
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
    destinationPort: {
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
    vessel: {
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
    distanceNm: 5742,
    estTimeDays: 12.6,
    avgSpeedKts: 13.8,
    headingDeg: 305,
    dynamicDraftM: 13.2,
    status: "Optimal",
    weather: "Good",
    etd: "2026-09-01",
    eta: "2026-09-14",
    cargoDescription: "Coal (82,000 MT Voyage 1/4)",
    dhamraAnchorageWeather: {
      waveHeightHs: 1.16,
      windKts: 11.4,
      status: "Green",
    },
    paradipAnchorageWeather: {
      waveHeightHs: 1.85,
      windKts: 18.2,
      status: "Amber",
    },
  },
  vesselOptions: [
    {
      vesselClass: "Panamax",
      capacityRange: "60K-82K DWT",
      dwtRange: "60,000-82,000 DWT",
      draftRange: "11.5-13.2 m",
      cargoFitPct: 94,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 25.70,
      idleRisk: "Low",
      suitabilityStatus: "Best Match",
      availability: "Available",
      reasoning: "Panamax capacity and draft align with the cargo volume and Paradip port limits.",
      reasons: ["Cargo quantity fits capacity", "Destination draft limit satisfied", "Low idle risk"],
    },
    {
      vesselClass: "Supramax",
      capacityRange: "45K-60K DWT",
      dwtRange: "45,000-60,000 DWT",
      draftRange: "10.0-11.5 m",
      cargoFitPct: 78,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 27.20,
      idleRisk: "Medium",
      suitabilityStatus: "Good Fit",
      availability: "Limited",
      reasoning: "Supramax is port compatible but requires more voyages for 600k MT.",
      reasons: ["Port draft compatible", "More voyages required"],
    },
    {
      vesselClass: "Capesize",
      capacityRange: "100K-180K DWT",
      dwtRange: "100,000-180,000 DWT",
      draftRange: "15.0-18.0 m",
      cargoFitPct: 61,
      portCompatibility: false,
      estimatedFreightUsdPerMt: 23.90,
      idleRisk: "High",
      suitabilityStatus: "Not Suitable",
      availability: "Available",
      reasoning: "Capesize offers capacity but increases waiting time at Paradip berth.",
      reasons: ["Higher demurrage risk at berth queue"],
    },
    {
      vesselClass: "Handysize",
      capacityRange: "10K-40K DWT",
      dwtRange: "10,000-40,000 DWT",
      draftRange: "7.0-10.0 m",
      cargoFitPct: 46,
      portCompatibility: true,
      estimatedFreightUsdPerMt: 31.40,
      idleRisk: "Medium",
      suitabilityStatus: "Marginal",
      availability: "Available",
      reasoning: "Inefficient for large volume long-haul route.",
      reasons: ["Small capacity", "High unit cost"],
    },
  ],
  riskAlerts: [
    {
      id: "risk-001",
      level: "Medium",
      category: "Weather",
      title: "Cyclone activity building near Australian east coast",
      description: "Developing low-pressure system may affect loading windows at Newcastle over next 10 days.",
      route: "Australia → Paradip",
      detectedAt: "2026-08-19T14:30:00Z",
      acknowledged: false,
    },
    {
      id: "risk-002",
      level: "High",
      category: "Port Congestion",
      title: "Paradip berth queue extending beyond forecast",
      description: "Waiting time at Paradip has increased 40% week-over-week.",
      route: "Australia → Paradip",
      detectedAt: "2026-08-20T06:00:00Z",
      acknowledged: false,
    },
  ],
  idleEntries: [
    {
      vesselId: "vsl-ocean-progress",
      vesselName: "MV Ocean Progress",
      expectedIdleDays: 2,
      location: "Paradip",
      repositioningSuggestion: "Backhaul iron ore opportunity available ex-Paradip to Qingdao.",
    },
  ],
};

export const ALL_DEMO_SCENARIOS: DemoScenario[] = [
  SCENARIO_GLADSTONE_DHAMRA,
  SCENARIO_MAPUTO_DHAMRA,
  SCENARIO_NEWCASTLE_PARADIP,
];

export function getScenarioById(id: string): DemoScenario {
  const found = ALL_DEMO_SCENARIOS.find((s) => s.id === id);
  return found || SCENARIO_GLADSTONE_DHAMRA;
}
