import { describe, expect, it } from "vitest";
import { calculateContractCosts, BASE_CARGO_MT, BASE_FUEL_USD_PER_MT } from "@/lib/contract-simulator";

describe("contract simulator calculations", () => {
  it("returns the baseline rates and total costs", () => {
    const costs = calculateContractCosts(0, BASE_FUEL_USD_PER_MT, BASE_CARGO_MT);
    expect(costs.map((cost) => cost.ratePerMt)).toEqual([21, 18.5, 19.75]);
    expect(costs[0].totalCost).toBe(12_600_000);
  });

  it("applies freight and fuel assumptions to every contract type", () => {
    const costs = calculateContractCosts(10, 720, 100_000);
    expect(costs[0].ratePerMt).toBeCloseTo(23.6589, 3);
    expect(costs[2].ratePerMt).toBeGreaterThan(costs[1].ratePerMt);
    expect(costs.every((cost) => cost.totalCost > 0)).toBe(true);
  });
});