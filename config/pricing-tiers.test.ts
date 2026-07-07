import { describe, it, expect } from "vitest";
import { getUnitPriceOre, getOrderTotalOre } from "./pricing-tiers";

describe("pricing-tiers", () => {
  it("returns the correct unit price per quantity tier", () => {
    expect(getUnitPriceOre(1)).toBe(35000);
    expect(getUnitPriceOre(2)).toBe(32000);
    expect(getUnitPriceOre(3)).toBe(29000);
    expect(getUnitPriceOre(10)).toBe(29000);
  });

  it("computes whole-order totals, not marginal totals (D-07)", () => {
    expect(getOrderTotalOre(1)).toBe(35000);
    expect(getOrderTotalOre(2)).toBe(64000);
    expect(getOrderTotalOre(3)).toBe(87000);
    expect(getOrderTotalOre(3)).not.toBe(96000);
  });

  it("throws when there is no matching tier", () => {
    expect(() => getUnitPriceOre(0)).toThrow();
  });
});
