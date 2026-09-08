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
  cargoType?: string;
}

export interface BalticIndexSummary {
  symbol: string;
  name: string;
  value: string;
  change: string;
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

export const balticIndices: BalticIndexSummary[] = [
  { symbol: "BDI", name: "Baltic Dry Index", value: "1,842", change: "+2.4%", direction: "up" },
  { symbol: "BPI", name: "Panamax Index", value: "1,685", change: "+3.1%", direction: "up" },
  { symbol: "BCI", name: "Capesize Index", value: "2,940", change: "-1.2%", direction: "down" },
];

export const freightTickerRoutes: FreightTickerRoute[] = [
  { route: "Australia → Paradip", vesselClass: "Panamax", cargoType: "Coking Coal", rateUsdPerMt: 26.48, trendPct: 4.2, direction: "down" },
  { route: "Indonesia → Vizag", vesselClass: "Supramax", cargoType: "Thermal Coal", rateUsdPerMt: 24.17, trendPct: 2.6, direction: "up" },
  { route: "USA → Haldia", vesselClass: "Handysize", cargoType: "Met Coal", rateUsdPerMt: 23.91, trendPct: 1.3, direction: "down" },
  { route: "Mozambique → Dhamra", vesselClass: "Capesize", cargoType: "Coking Coal", rateUsdPerMt: 27.63, trendPct: 1.8, direction: "up" },
  { route: "Russia → Gangavaram", vesselClass: "Panamax", cargoType: "Anthracite", rateUsdPerMt: 25.32, trendPct: 0.9, direction: "up" },
  { route: "Brazil → Dhamra", vesselClass: "Capesize", cargoType: "Iron Ore", rateUsdPerMt: 29.80, trendPct: 3.4, direction: "up" },
  { route: "South Africa → Paradip", vesselClass: "Capesize", cargoType: "Steam Coal", rateUsdPerMt: 21.45, trendPct: 0.8, direction: "down" },
];

export const marketTrendSeries = [22.4, 23.1, 22.8, 24.5, 24.2, 25.8, 26.1, 27.4, 26.9, 27.8, 28.5];
