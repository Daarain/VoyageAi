// ────────────────────────────────────────────────────────────────────────
// HOME PAGE DATA — isolated from presentation, same convention as
// src/lib/data-source.ts. All values here are demonstration-only; when
// real freight/vessel/market feeds exist, only this file changes.
// ────────────────────────────────────────────────────────────────────────

export interface HeroStat {
  label: string;
  sublabel: string;
  value: string;
}

export interface FreightTickerRoute {
  route: string;
  vesselClass: string;
  rateUsdPerMt: number;
  trendPct: number;
  direction: "up" | "down";
}

export interface VesselIntelligenceSummary {
  name: string;
  status: "En Route" | "Idle" | "Loading" | "Discharging";
  vesselClass: string;
  dwt: number;
  utilizationPct: number;
}

export const heroStats: HeroStat[] = [
  { label: "12+", sublabel: "Trade Routes\nMonitored 24/7", value: "12+" },
  { label: "45+", sublabel: "Vessel Types\nDry Bulk & Tankers", value: "45+" },
  { label: "10+", sublabel: "Ports Covered\nEast & West Coast", value: "10+" },
  { label: "87%", sublabel: "Forecast Accuracy\n30–90 Day Window", value: "87%" },
];

export const heroVesselIntelligence: VesselIntelligenceSummary = {
  name: "MV Ocean Progress",
  status: "En Route",
  vesselClass: "Panamax",
  dwt: 82000,
  utilizationPct: 89,
};

export const freightTickerRoutes: FreightTickerRoute[] = [
  { route: "Australia → Paradip", vesselClass: "Panamax", rateUsdPerMt: 26.48, trendPct: 4.2, direction: "down" },
  { route: "Indonesia → Vizag", vesselClass: "Supramax", rateUsdPerMt: 24.17, trendPct: 2.6, direction: "up" },
  { route: "USA → Haldia", vesselClass: "Handysize", rateUsdPerMt: 23.91, trendPct: 1.3, direction: "down" },
  { route: "Mozambique → Dhamra", vesselClass: "Capesize", rateUsdPerMt: 27.63, trendPct: 1.8, direction: "up" },
  { route: "Russia → Gangavaram", vesselClass: "Panamax", rateUsdPerMt: 25.32, trendPct: 0.9, direction: "up" },
];

export const marketTrendSeries = [22, 24, 23, 25, 24, 26, 25, 27, 26, 25];
