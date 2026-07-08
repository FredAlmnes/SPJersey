"use client";

// components/storefront/cart-item-card.tsx
// Single cart line (D-12/PROD-05). Shows the jersey config plus a
// whole-cart-recomputed unit price passed in by cart-panel.tsx — this
// card never computes its own price (see order-summary.tsx / Pitfall 2).

import { Pencil, Trash2 } from "lucide-react";
import { PATCHES } from "@/config/patches";
import type { CartItem } from "@/lib/cart/cart-types";

export interface CartItemCardProps {
  item: CartItem;
  unitPriceOre: number; // recomputed for the whole cart by cart-panel.tsx
  onEdit: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

function formatOre(ore: number): string {
  return `${ore / 100} kr`;
}

function resolvePatchLabels(patchIds: string[]): string {
  if (patchIds.length === 0 || patchIds.includes("ingen")) return "Ingen";
  return patchIds
    .map((id) => PATCHES.find((patch) => patch.id === id)?.label ?? id)
    .join(", ");
}

export function CartItemCard({ item, unitPriceOre, onEdit, onRemove }: CartItemCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-black dark:text-zinc-50">
            {item.teamName}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sesong: {item.season}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Størrelse: {item.size}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Merker: {resolvePatchLabels(item.patchIds)}
          </p>
          {(item.name || item.number !== undefined) && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Trykk: {item.name ?? ""}
              {item.name && item.number !== undefined ? " " : ""}
              {item.number !== undefined ? item.number : ""}
            </p>
          )}
          <p className="mt-1 text-sm text-black dark:text-zinc-50">
            {formatOre(unitPriceOre)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label="Rediger"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400"
          >
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label="Fjern"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
