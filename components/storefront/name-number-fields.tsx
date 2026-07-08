"use client";

// components/storefront/name-number-fields.tsx
// Live-validated print name/number inputs (PROD-04, D-20..D-23). Both fields
// are optional draft strings; validation runs on every change/blur via
// jerseyNameSchema/jerseyNumberSchema.safeParse and never trusts the native
// <input type="number"> min/max attributes alone (02-RESEARCH.md Pitfall 4) —
// the number field is kept as a string in the draft and validated through the
// Zod schema like the name field.

import { useState } from "react";
import {
  jerseyNameSchema,
  jerseyNumberSchema,
} from "@/lib/validation/jersey-schema";

export interface NameNumberFieldsProps {
  name: string;
  number: string;
  onNameChange: (v: string) => void;
  onNumberChange: (v: string) => void;
}

export function NameNumberFields({
  name,
  number,
  onNameChange,
  onNumberChange,
}: NameNumberFieldsProps) {
  const [nameError, setNameError] = useState<string | null>(null);
  const [numberError, setNumberError] = useState<string | null>(null);

  function validateName(v: string) {
    const result = jerseyNameSchema.safeParse(v);
    setNameError(result.success ? null : (result.error.issues[0]?.message ?? null));
  }

  function validateNumber(v: string) {
    const result = jerseyNumberSchema.safeParse(v);
    setNumberError(result.success ? null : (result.error.issues[0]?.message ?? null));
  }

  const inputClass = (hasError: boolean) =>
    `mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-zinc-900 ${
      hasError
        ? "border-red-600 dark:border-red-400"
        : "border-zinc-300 dark:border-zinc-700"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Navn på trykk (valgfritt)
        <input
          type="text"
          value={name}
          onChange={(e) => {
            onNameChange(e.target.value);
            validateName(e.target.value);
          }}
          onBlur={(e) => validateName(e.target.value)}
          className={inputClass(nameError !== null)}
        />
        {nameError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {nameError}
          </p>
        )}
      </label>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Nummer på trykk (valgfritt)
        <input
          type="text"
          inputMode="numeric"
          value={number}
          onChange={(e) => {
            onNumberChange(e.target.value);
            validateNumber(e.target.value);
          }}
          onBlur={(e) => validateNumber(e.target.value)}
          className={inputClass(numberError !== null)}
        />
        {numberError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {numberError}
          </p>
        )}
      </label>
    </div>
  );
}
