"use client";

// components/storefront/size-selector.tsx
// Six-button adult size group S/M/L/XL/XXL/3XL (PROD-02, D-19). No kids' sizes.

import type { JerseySize } from "@/lib/cart/cart-types";

export interface SizeSelectorProps {
  value: JerseySize | null;
  onChange: (size: JerseySize) => void;
}

const SIZES: JerseySize[] = ["S", "M", "L", "XL", "XXL", "3XL"];

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">Størrelse</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {SIZES.map((size) => {
          const selected = value === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => onChange(size)}
              aria-pressed={selected}
              className={`min-h-11 min-w-11 rounded-md border px-3 py-2 text-sm font-semibold ${
                selected
                  ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                  : "border-zinc-300 bg-transparent text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
