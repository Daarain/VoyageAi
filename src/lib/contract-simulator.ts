export const BASE_RATES = { Spot: 21.0, CVC: 18.5, "Time Charter": 19.75 } as const;
export const BASE_CARGO_MT = 600000;
export const BASE_FUEL_USD_PER_MT = 620;

export type ContractType = keyof typeof BASE_RATES;

export interface ContractCost {
  type: ContractType;
  ratePerMt: number;
  totalCost: number;
}

export function calculateContractCosts(
  freightAdjustPct: number,
  fuelPrice: number,
  cargoQty: number
): ContractCost[] {
  const fuelDeltaPct = (fuelPrice - BASE_FUEL_USD_PER_MT) / BASE_FUEL_USD_PER_MT;
  return (Object.keys(BASE_RATES) as ContractType[]).map((type) => {
    const fuelSensitivity = type === "Time Charter" ? 0.35 : 0.15;
    const ratePerMt = BASE_RATES[type] * (1 + freightAdjustPct / 100) * (1 + fuelDeltaPct * fuelSensitivity);
    return { type, ratePerMt, totalCost: ratePerMt * cargoQty };
  });
}
