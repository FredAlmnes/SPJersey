// config/pricing-tiers.ts
// Whole-order unit pricing, per D-07: 3 jerseys = 3 x 290, NOT 350+320+290.
export const PRICING_TIERS = [
  { minQty: 1, maxQty: 1, unitPriceOre: 35000 }, // 350 NOK
  { minQty: 2, maxQty: 2, unitPriceOre: 32000 }, // 320 NOK
  { minQty: 3, maxQty: Infinity, unitPriceOre: 29000 }, // 290 NOK
] as const;

export function getUnitPriceOre(quantity: number): number {
  const tier = PRICING_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty);
  if (!tier) throw new Error(`No pricing tier for quantity ${quantity}`);
  return tier.unitPriceOre;
}

export function getOrderTotalOre(quantity: number): number {
  return getUnitPriceOre(quantity) * quantity;
}
