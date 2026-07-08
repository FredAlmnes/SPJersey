"use client";

// components/storefront/cart-panel.tsx
// Persistent, responsive cart panel (D-13/D-16/PROD-05) — sticky side panel
// on desktop (lg:), collapsed bottom bar that expands into a full-height
// bottom sheet on mobile (UI-SPEC "Layout & responsive behavior"). Visible
// from first load, even when empty (D-16). Owns the 5-second "Angre" (undo)
// affordance on remove — no confirmation dialog (Copywriting Contract).
// Unit price is recomputed once per render for the whole cart and passed to
// every CartItemCard so all lines reflect the current whole-order tier
// (config/pricing-tiers.ts, never reimplemented here).
//
// CR-01 fix: the collapsed mobile bar is `h-16` (4rem) — storefront-client.tsx's
// `pb-16` safe-area padding on the scrollable form content must match this
// value exactly, since the full expanded sheet is a temporary overlay (not
// a layout participant) and only the collapsed bar's height needs reserving.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCart, useCartDispatch } from "@/lib/cart/cart-context";
import { getOrderTotalOre, getUnitPriceOre } from "@/config/pricing-tiers";
import { CartItemCard } from "@/components/storefront/cart-item-card";
import { OrderSummary } from "@/components/storefront/order-summary";
import type { CartItem } from "@/lib/cart/cart-types";

export interface CartPanelProps {
  onEditItem: (item: CartItem) => void;
  onRemoveItem?: (item: CartItem) => void;
}

const UNDO_TIMEOUT_MS = 5000;

function formatOre(ore: number): string {
  return `${ore / 100} kr`;
}

export function CartPanel({ onEditItem, onRemoveItem }: CartPanelProps) {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const [pendingRemoval, setPendingRemoval] = useState<CartItem | null>(null);
  const [expanded, setExpanded] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const unitPriceOre = cart.length > 0 ? getUnitPriceOre(cart.length) : 0;

  function handleRemove(item: CartItem) {
    dispatch({ type: "remove", id: item.id });
    setPendingRemoval(item);
    onRemoveItem?.(item);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setPendingRemoval(null);
      undoTimerRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }

  function handleUndo() {
    if (!pendingRemoval) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    dispatch({ type: "add", item: pendingRemoval });
    setPendingRemoval(null);
  }

  return (
    <>
      {/* Collapsed mobile bar (UI-SPEC: item count badge + running total +
          chevron/handle to expand). Hidden on lg (desktop always shows the
          full sticky panel below) and hidden while expanded on mobile. */}
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Vis handlekurv"
          className="fixed inset-x-0 bottom-0 z-10 flex h-16 w-full items-center justify-between border-t border-zinc-200 bg-white px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-sm font-semibold text-white dark:bg-emerald-500">
              {cart.length}
            </span>
            <span className="text-sm font-semibold text-black dark:text-zinc-50">
              {cart.length > 0 ? formatOre(getOrderTotalOre(cart.length)) : "Handlekurven er tom"}
            </span>
          </div>
          <ChevronUp className="h-5 w-5 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
        </button>
      )}

      <div
        className={`${expanded ? "block" : "hidden"} fixed inset-x-0 bottom-0 z-20 max-h-[85vh] overflow-y-auto border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:z-10 lg:block lg:sticky lg:top-6 lg:bottom-auto lg:inset-x-auto lg:max-h-[calc(100vh-3rem)] lg:w-[360px] lg:shrink-0 lg:rounded-lg lg:bg-zinc-50 lg:p-6 lg:shadow-none lg:dark:bg-zinc-900`}
      >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Din bestilling</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-sm font-semibold text-white dark:bg-emerald-500">
            {cart.length}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Skjul handlekurv"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 lg:hidden"
          >
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {pendingRemoval && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <span className="text-zinc-600 dark:text-zinc-400">Drakt fjernet</span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-500"
          >
            Angre
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {cart.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              unitPriceOre={unitPriceOre}
              onEdit={onEditItem}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <OrderSummary />
      </div>

      <button
        type="button"
        onClick={() => {}}
        className="mt-6 min-h-11 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white dark:bg-emerald-500"
      >
        Gå til betaling
      </button>
      </div>
    </>
  );
}
