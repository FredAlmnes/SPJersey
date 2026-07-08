"use client";

// components/storefront/order-summary.tsx
// Live order summary (PROD-05, T-02-08/T-02-09). Price is ALWAYS derived
// fresh from config/pricing-tiers.ts (getUnitPriceOre/getOrderTotalOre) by
// cart.length on every render — never read off a CartItem, never stored
// here. config/pricing-tiers.ts is the single source of truth for all
// bundle pricing math; Phase 3 recomputes the trusted total server-side
// from the same module (this display total is advisory only).

import { useCart } from "@/lib/cart/cart-context";
import { getOrderTotalOre, getUnitPriceOre } from "@/config/pricing-tiers";

function formatOre(ore: number): string {
  // Pricing tiers are always whole hundreds of øre (35000/32000/29000), so
  // integer division by 100 is always exact — no rounding logic needed.
  return `${ore / 100} kr`;
}

export function OrderSummary() {
  const cart = useCart();
  const quantity = cart.length;

  if (quantity === 0) {
    return (
      <div>
        <h2 className="text-base font-semibold text-black dark:text-zinc-50">
          Handlekurven er tom
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sett sammen din første drakt i skjemaet for å komme i gang.
        </p>
      </div>
    );
  }

  let unitPriceOre: number;
  let totalOre: number;
  try {
    unitPriceOre = getUnitPriceOre(quantity);
    totalOre = getOrderTotalOre(quantity);
  } catch {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Vi klarte ikke å beregne prisen. Prøv å oppdatere siden.
      </p>
    );
  }

  const bundleDiscountActive = quantity >= 2;

  return (
    <div>
      <h2 className="text-base font-semibold text-black dark:text-zinc-50">
        Din bestilling
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {quantity} × {formatOre(unitPriceOre)}
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Delsum: {formatOre(totalOre)}
      </p>
      {bundleDiscountActive && (
        <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
          Pakkerabatt aktivert
        </p>
      )}
      <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-500">
        Total: {formatOre(totalOre)}
      </p>
    </div>
  );
}
