"use client";

// components/storefront/patch-checkboxes.tsx
// Patch checkbox/chip group (PROD-03, D-09/D-10). Renders PATCHES from
// config/patches.ts and routes every toggle through the single togglePatch
// pure function so "ingen" mutual exclusivity can never be violated by
// independent per-checkbox handlers (02-RESEARCH.md Pitfall 6).

import { PATCHES } from "@/config/patches";
import { togglePatch } from "@/lib/cart/patch-selection";

export interface PatchCheckboxesProps {
  value: string[];
  onChange: (patchIds: string[]) => void;
}

export function PatchCheckboxes({ value, onChange }: PatchCheckboxesProps) {
  return (
    <div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Merker (valgfritt)
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {PATCHES.map((patch) => {
          const selected = value.includes(patch.id);
          return (
            <button
              key={patch.id}
              type="button"
              onClick={() => onChange(togglePatch(value, patch.id))}
              aria-pressed={selected}
              className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold ${
                selected
                  ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                  : "border-zinc-300 bg-transparent text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {patch.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
