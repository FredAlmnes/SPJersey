"use client";

// components/storefront/size-guide-modal.tsx
// Native <dialog> size-guide modal with placeholder S-3XL measurement table
// and disclaimer copy (PROD-06, D-17, D-18). No hand-rolled overlay/focus-trap
// — the native dialog element provides both for free.

import { useRef } from "react";
import { Info } from "lucide-react";

interface SizeRow {
  size: string;
  chestCm: number;
  lengthCm: number;
}

const SIZE_ROWS: SizeRow[] = [
  { size: "S", chestCm: 96, lengthCm: 70 },
  { size: "M", chestCm: 100, lengthCm: 72 },
  { size: "L", chestCm: 104, lengthCm: 74 },
  { size: "XL", chestCm: 110, lengthCm: 76 },
  { size: "XXL", chestCm: 116, lengthCm: 78 },
  { size: "3XL", chestCm: 122, lengthCm: 80 },
];

export function SizeGuideModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-500"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
        Se størrelsesguide
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-lg border border-zinc-200 p-6 backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
          Størrelsesguide
        </h2>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-zinc-600 dark:text-zinc-400">
              <th className="pr-4 pb-2">Størrelse</th>
              <th className="pr-4 pb-2">Brystvidde (cm)</th>
              <th className="pb-2">Lengde (cm)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((row) => (
              <tr key={row.size} className="text-zinc-700 dark:text-zinc-300">
                <td className="pr-4 py-1">{row.size}</td>
                <td className="pr-4 py-1">{row.chestCm}</td>
                <td className="py-1">{row.lengthCm}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Foreløpig størrelsesguide — kan bli oppdatert senere.
        </p>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="mt-6 w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Lukk
        </button>
      </dialog>
    </>
  );
}
