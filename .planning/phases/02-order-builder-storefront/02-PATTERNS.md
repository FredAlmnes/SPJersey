# Phase 2: Order Builder & Storefront - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 21 (17 new source files + 4 test files; package.json/vitest.config.ts modifications noted separately)
**Analogs found:** 21 / 21 (all matched to a real codebase file; none are exact role+dataflow matches — this phase introduces the first client-state/interactive-form/modal code in the repo, so every match is a "structural/convention" analog, not a "same pattern already exists" analog)

## Codebase Reality Check (read this before using the table below)

Grep confirms **zero** existing usage in this repo of: `zod` (`z.`), `useReducer`, `createContext`, `useState`, or any client-side form/cart/modal logic. Only one `"use client"` file exists (`app/(admin)/admin/login/page.tsx`), and it uses `useActionState` + a Server Action, not local component state. There are also no `components/` directory and no `lib/cart/` or `lib/validation/` directories yet.

This means: **there is no true "same role, same data flow" analog anywhere in the codebase for the interactive/client-state parts of this phase.** The closest real analogs are (a) Phase 1's pure-TypeScript `config/*.ts` modules for anything that is logic-only and framework-free (reducer, Zod schema, derivation helpers), and (b) Phase 1's Tailwind card/typography conventions in `app/(admin)/admin/*` for anything that is a rendered page/component. Where the codebase has no equivalent at all (Context providers, native `<dialog>`, cascading selects), RESEARCH.md's locally-verified Code Examples are the fallback pattern source — this is flagged explicitly per file below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/(storefront)/page.tsx` | route (Server Component shell) | request-response | `app/(admin)/admin/page.tsx` | role-match (async Server Component page shape) |
| `app/(storefront)/storefront-client.tsx` | provider/root component | event-driven | `app/(admin)/admin/login/page.tsx` (`"use client"` shape) | partial (only existing client component in repo) |
| `lib/cart/cart-types.ts` | model | CRUD (in-memory) | `config/leagues-teams-seasons.ts` (interface + const exports) | role-match (plain TS interfaces/types module) |
| `lib/cart/cart-reducer.ts` | store (pure reducer) | event-driven | `config/pricing-tiers.ts` (pure function module) | role-match (pure function, no framework, unit-testable) |
| `lib/cart/cart-reducer.test.ts` | test | transform | `config/pricing-tiers.test.ts` | exact (same vitest/describe/it shape, same `node` environment) |
| `lib/cart/cart-context.tsx` | provider | event-driven | none in repo — RESEARCH.md Code Example (Pattern 1) | no analog (see below) |
| `lib/cart/team-options.test.ts` | test | transform | `config/leagues-teams-seasons.test.ts` | exact (derivation/filter assertions over same catalog data) |
| `lib/cart/patch-selection.test.ts` | test | transform | `config/patches.test.ts` | exact (fixed-list assertions over same catalog data) |
| `lib/validation/jersey-schema.ts` | utility (Zod schema) | transform | none in repo (no prior Zod usage) — RESEARCH.md Code Example | no analog (see below) |
| `lib/validation/jersey-schema.test.ts` | test | transform | `config/patches.test.ts` (simplest existing `.test.ts` shape) | role-match (vitest unit test structure only) |
| `components/storefront/configurator-form.tsx` | component (form) | event-driven | `app/(admin)/admin/login/page.tsx` (form + Tailwind card) | partial (only existing form/`"use client"` component) |
| `components/storefront/league-team-select.tsx` | component (cascading select) | transform | `config/leagues-teams-seasons.ts` (data shape) + RESEARCH.md Pattern 2 | no analog for UI; data shape confirmed |
| `components/storefront/season-display.tsx` | component (read-only display) | transform | `app/(admin)/admin/page.tsx` (read-only value rendering: `Antall bestillinger: {count}`) | role-match (label + derived value pattern) |
| `components/storefront/size-selector.tsx` | component (button group) | event-driven | `app/(admin)/admin/login/page.tsx` (input/label Tailwind pattern) | partial (styling convention only) |
| `components/storefront/size-guide-modal.tsx` | component (modal) | event-driven | none in repo — RESEARCH.md Code Example (native `<dialog>`) | no analog (see below) |
| `components/storefront/patch-checkboxes.tsx` | component (checkbox group) | event-driven | `config/patches.ts` (data shape) + RESEARCH.md Pitfall 6 | no analog for UI; data shape confirmed |
| `components/storefront/name-number-fields.tsx` | component (validated inputs) | event-driven | `app/(admin)/admin/login/page.tsx` (labeled input + error text pattern) | role-match (input/error Tailwind convention) |
| `components/storefront/cart-panel.tsx` | component (panel) | event-driven | `app/(admin)/admin/page.tsx` (card container convention) | partial (styling convention only) |
| `components/storefront/cart-item-card.tsx` | component (list item) | event-driven | `app/(admin)/admin/page.tsx` (card container convention) | partial (styling convention only) |
| `components/storefront/order-summary.tsx` | component (derived display) | transform | `config/pricing-tiers.ts` (consumer must call `getUnitPriceOre`/`getOrderTotalOre`) + `app/(admin)/admin/page.tsx` (count/value display) | role-match (derived-value display pattern) |
| `components/storefront/checkout-explainer.tsx` | component (static copy) | transform | `app/page.tsx` (static centered copy block) | exact (static Tailwind text block, no logic) |
| `package.json` (modify) | config | — | existing `package.json` | exact (add `lucide-react` dep, add `"test": "vitest run"` script) |
| `vitest.config.ts` (modify, only if Option B/component tests chosen) | config | — | existing `vitest.config.ts` | exact (extend `include`, optionally add jsdom project) |

## Pattern Assignments

### `app/(storefront)/page.tsx` (route, request-response)

**Analog:** `app/(admin)/admin/page.tsx` (also compare `app/page.tsx` for the simplest possible shape)

**Core pattern** (`app/(admin)/admin/page.tsx` lines 1-29, full file):
```typescript
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* ... */}
      </div>
    </div>
  );
}
```

**What to copy:** The `async function` Server Component shell shape and the `flex flex-1 flex-col items-center` outer wrapper class convention. **What NOT to copy:** the Supabase data fetch — `app/(storefront)/page.tsx` needs **no** data fetching at all (RESEARCH.md confirms catalog data is statically imported, not DB-backed). This file should be the thinnest possible shell:
```typescript
import { StorefrontClient } from "./storefront-client";

export default function StorefrontPage() {
  return <StorefrontClient />;
}
```
Note it does not need `async` since there is no `await` — simpler than both admin analogs.

**Layout convention** (from `app/page.tsx` lines 1-14 and `app/layout.tsx` lines 20-33): the root `<html>`/`<body>` already sets `min-h-full flex flex-col` globally — new storefront pages compose inside that, following `app/page.tsx`'s `flex flex-col flex-1 items-center` container pattern for the outermost wrapper before the two-column layout takes over per UI-SPEC.

---

### `app/(storefront)/storefront-client.tsx` (client root, event-driven)

**Analog:** `app/(admin)/admin/login/page.tsx` (only existing `"use client"` file in the repo)

**Imports/directive pattern** (lines 1-4):
```typescript
"use client";

import { useActionState } from "react";
import { login } from "../actions";
```

**What to copy:** The `"use client"` directive placement (top of file, before imports) and the fact that this repo keeps client components as default-exported, single-purpose files. **What NOT to copy:** `useActionState`/Server Action wiring — this phase has no server mutation; `storefront-client.tsx` instead mounts `CartProvider` (see `lib/cart/cart-context.tsx` below) and composes the form + cart panel, per RESEARCH.md's Architecture Patterns diagram:
```typescript
"use client";
import { CartProvider } from "@/lib/cart/cart-context";
import { ConfiguratorForm } from "@/components/storefront/configurator-form";
import { CartPanel } from "@/components/storefront/cart-panel";
import { CheckoutExplainer } from "@/components/storefront/checkout-explainer";

export function StorefrontClient() {
  return (
    <CartProvider>
      <div className="flex flex-1 flex-col lg:flex-row lg:gap-8 lg:p-6">
        <ConfiguratorForm />
        <CartPanel />
      </div>
      <CheckoutExplainer />
    </CartProvider>
  );
}
```

---

### `lib/cart/cart-types.ts` (model, CRUD in-memory)

**Analog:** `config/leagues-teams-seasons.ts`

**Core pattern** (lines 7-16 — plain interface exports, no class, no decorator):
```typescript
export interface Team {
  id: string;
  name: string;
}

export interface League {
  id: string;
  name: string;
  teams: Team[];
}
```

**What to copy:** Plain `export interface`, no runtime validation logic mixed into the type file (validation lives separately in `lib/validation/jersey-schema.ts`, matching this repo's existing separation of concerns — `config/*.ts` never imports Zod). Header comment convention (line 1-3 of the analog: a `// path/filename` comment plus a one-line rationale referencing the decision ID) should be copied verbatim as a repo convention:
```typescript
// lib/cart/cart-types.ts
// CartItem shape for the in-memory cart (D-11..D-13). No price field is ever
// stored here — see Pitfall 2 in 02-RESEARCH.md: price is always derived live
// from config/pricing-tiers.ts, never persisted on the item.
```

---

### `lib/cart/cart-reducer.ts` (store/pure reducer, event-driven)

**Analog:** `config/pricing-tiers.ts`

**Core pattern** (full file, lines 1-17 — pure exported functions, no side effects, throws on invalid input rather than silently failing):
```typescript
// config/pricing-tiers.ts
export function getUnitPriceOre(quantity: number): number {
  const tier = PRICING_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty);
  if (!tier) throw new Error(`No pricing tier for quantity ${quantity}`);
  return tier.unitPriceOre;
}
```

**What to copy:** The "pure function, framework-free, throws on invariant violation" style. `cartReducer` should follow the exact same shape — a plain exported function taking `(state, action)` and returning new state, with no React import at all (React import only appears in `cart-context.tsx`, which wires the reducer into `useReducer`). This is what makes it testable under the existing `node` vitest environment with zero new config, exactly like `pricing-tiers.test.ts` tests `pricing-tiers.ts`.

**Import pattern to use inside the reducer** — reference `config/pricing-tiers.ts`'s "single source of truth" comment convention (line 2): every file that touches pricing must have a comment pointing back to `config/pricing-tiers.ts` as the only place tier math lives, e.g. in `order-summary.tsx`.

---

### `lib/cart/cart-reducer.test.ts`, `lib/cart/team-options.test.ts`, `lib/cart/patch-selection.test.ts`, `lib/validation/jersey-schema.test.ts` (tests, transform)

**Analog:** `config/pricing-tiers.test.ts` (full file, 22 lines) and `config/leagues-teams-seasons.test.ts`

**Imports pattern** (pricing-tiers.test.ts lines 1-2):
```typescript
import { describe, it, expect } from "vitest";
import { getUnitPriceOre, getOrderTotalOre } from "./pricing-tiers";
```

**Core test structure pattern** (lines 4-22):
```typescript
describe("pricing-tiers", () => {
  it("returns the correct unit price per quantity tier", () => {
    expect(getUnitPriceOre(1)).toBe(35000);
    // ...
  });

  it("throws when there is no matching tier", () => {
    expect(() => getUnitPriceOre(0)).toThrow();
  });
});
```

**What to copy:** Relative import (`./pricing-tiers`, not `@/config/pricing-tiers`) for same-directory test-to-source pairs — `lib/cart/cart-reducer.test.ts` should import `./cart-reducer` the same way. One `describe` block per module, one `it` per behavior/invariant, explicit `.toBe`/`.toThrow` assertions (no snapshot testing anywhere in this repo). These four new test files sit directly under `vitest.config.ts`'s existing `include: ["config/**/*.test.ts", "tests/**/*.test.ts"]` glob — **note this glob does NOT currently include `lib/**/*.test.ts`**, so `vitest.config.ts` must be modified to add `"lib/**/*.test.ts"` to `include` (a required, not optional, change — flag this to the planner as a Wave 0 task regardless of whether Option A or B testing scope is chosen).

---

### `lib/cart/cart-context.tsx` (provider, event-driven) — NO CODEBASE ANALOG

No `createContext`/`useReducer` usage exists anywhere in this repo (confirmed via grep). Use RESEARCH.md's locally-verified Pattern 1 code example verbatim as the pattern source (already vetted against this project's exact CONTEXT.md decisions D-13/D-14/D-16):
```typescript
"use client";
import { createContext, useContext, useReducer, type ReactNode } from "react";
import { cartReducer } from "./cart-reducer";
import type { CartItem, CartAction } from "./cart-types";

const CartStateContext = createContext<CartItem[] | null>(null);
const CartDispatchContext = createContext<React.Dispatch<CartAction> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  return (
    <CartStateContext.Provider value={cart}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartStateContext);
  if (cart === null) throw new Error("useCart must be used within CartProvider");
  return cart;
}
```
The only repo convention to apply on top of this example: match the header-comment style (`// lib/cart/cart-context.tsx` + one-line rationale) used in `config/*.ts`.

---

### `lib/validation/jersey-schema.ts` (utility/Zod schema, transform) — NO CODEBASE ANALOG

`zod` is an installed dependency (`package.json` line 18: `"zod": "^4.4.3"`) but is not imported anywhere yet in the repo. Use RESEARCH.md's locally-verified Code Example verbatim (already tested against installed Zod 4.4.3 in this session):
```typescript
import { z } from "zod";

export const jerseyNameSchema = z
  .string()
  .trim()
  .max(12, "Kan bare inneholde bokstaver, mellomrom og bindestrek (maks 12 tegn).")
  .regex(
    /^[\p{L}\s-]*$/u,
    "Kan bare inneholde bokstaver, mellomrom og bindestrek (maks 12 tegn).",
  )
  .optional()
  .or(z.literal(""));

export const jerseyNumberSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(/^\d{1,2}$/, "Må være et helt tall mellom 0 og 99.")
      .refine((val) => Number(val) >= 0 && Number(val) <= 99, "Må være et helt tall mellom 0 og 99."),
  ])
  .optional();
```
Error message strings must match `02-UI-SPEC.md`'s Copywriting Contract exactly ("Kan bare inneholde bokstaver, mellomrom og bindestrek (maks 12 tegn)." / "Må være et helt tall mellom 0 og 99.") — the RESEARCH.md example already uses the exact locked copy, so no rewording is needed.

---

### `components/storefront/configurator-form.tsx` (component/form, event-driven)

**Analog:** `app/(admin)/admin/login/page.tsx` (full file, 63 lines)

**Imports pattern** (lines 1-4):
```typescript
"use client";

import { useActionState } from "react";
import { login } from "../actions";
```
Adapt to: `"use client"` + `import { useState } from "react"` + `import { useCartDispatch } from "@/lib/cart/cart-context"` (path-alias imports, per `@/` convention already used throughout the repo, e.g. `import { createClient } from "@/lib/supabase/server"`).

**Form/card container pattern** (lines 12-16):
```typescript
<div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
  <form
    action={formAction}
    className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
  >
```
Adapt classes to UI-SPEC's spacing/color tokens (`rounded-lg border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950` for section cards — UI-SPEC uses `lg` (24px) for section padding rather than login's `p-8`/32px, since login is a single centered card and this is a full-page multi-section form).

**Labeled input pattern** (lines 24-33 — label wraps input, `mt-1`/`mt-4` vertical rhythm, border + rounded + text-sm):
```typescript
<label className="mt-6 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
  E-post
  <input
    type="email"
    name="email"
    required
    autoComplete="username"
    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
  />
</label>
```
**Important deviation required by UI-SPEC:** UI-SPEC's typography contract (line 58) explicitly forbids `font-medium` (500) this phase — "Labels use regular weight, not medium." Copy the structural `<label>`-wraps-`<input>` pattern and the `mt-1`/spacing rhythm, but change `font-medium` → default/regular weight (no font-weight class, or `font-normal` if the base isn't already regular) on every label in the new storefront components.

**Error text pattern** (lines 46-50):
```typescript
{state.error && (
  <p className="mt-4 text-sm text-red-600 dark:text-red-400">
    Feil e-post eller passord.
  </p>
)}
```
Adapt for live per-field Zod errors (D-23): render conditionally below each field, same `text-sm text-red-600 dark:text-red-400` classes (matches UI-SPEC's destructive color token `#dc2626` red-600 / `#f87171` red-400 exactly — no new color needed).

**Button pattern** (lines 52-58, adapt background to UI-SPEC's emerald accent instead of black/white for the primary CTA):
```typescript
<button
  type="submit"
  disabled={pending}
  className="mt-6 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
>
  {pending ? "Logger inn…" : "Logg inn"}
</button>
```
For "Legg i handlekurv" / "Gå til betaling": swap `bg-black`/`dark:bg-white` for UI-SPEC's accent (`bg-emerald-600 dark:bg-emerald-500`), keep `font-semibold` per UI-SPEC's 2-weight rule (buttons use 600, not `font-medium`/500 — another required deviation from this analog).

---

### `components/storefront/league-team-select.tsx` (cascading select, transform) — NO UI CODEBASE ANALOG (data shape confirmed)

No `<select>` or cascading-derivation component exists in the repo. Data source confirmed directly from `config/leagues-teams-seasons.ts` (read in full above — 5 leagues, `NATIONAL_TEAMS` as a flat array with no league wrapper). Use RESEARCH.md's Pattern 2 verbatim for the derivation logic:
```typescript
import { LEAGUES, NATIONAL_TEAMS, type Team } from "@/config/leagues-teams-seasons";

const LANDSLAG_ID = "landslag" as const;

function useTeamOptions(leagueOrNationalId: string | null): Team[] {
  return useMemo(() => {
    if (leagueOrNationalId === null) return [];
    if (leagueOrNationalId === LANDSLAG_ID) return NATIONAL_TEAMS;
    return LEAGUES.find((l) => l.id === leagueOrNationalId)?.teams ?? [];
  }, [leagueOrNationalId]);
}
```
For visual styling of the `<select>` elements themselves, apply the same `rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900` input classes from the login page analog above (there is no dedicated `<select>` styling anywhere yet, so the `<input>` convention is the correct fallback per UI-SPEC's "native HTML form elements ... styled directly with Tailwind" directive).

---

### `components/storefront/season-display.tsx` (read-only display, transform)

**Analog:** `app/(admin)/admin/page.tsx` lines 21-25 (read-only derived-value display):
```typescript
<p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
  Antall bestillinger: <span className="font-medium">{count ?? 0}</span>
</p>
```
**What to copy:** The `label: <emphasized value>` inline text pattern. Adapt to:
```typescript
import { CURRENT_SEASON } from "@/config/leagues-teams-seasons";

<p className="text-sm text-zinc-600 dark:text-zinc-400">
  Sesong: <span className="font-semibold text-black dark:text-zinc-50">{CURRENT_SEASON}</span>
</p>
```
(use `font-semibold`, not `font-medium`, per UI-SPEC's 2-weight rule — the analog's `font-medium` must NOT be copied literally here, same deviation as noted above).

---

### `components/storefront/size-guide-modal.tsx` (modal, event-driven) — NO CODEBASE ANALOG

No modal/dialog exists in the repo. Use RESEARCH.md's locally-verified native `<dialog>` Code Example verbatim as the structural pattern, adapted to UI-SPEC's exact copy and table columns:
```typescript
"use client";
import { useRef } from "react";

export function SizeGuideModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button onClick={() => dialogRef.current?.showModal()} className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-500">
        Se størrelsesguide
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-zinc-200 p-6 backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-xl font-semibold">Størrelsesguide</h2>
        {/* table: Størrelse | Brystvidde (cm) | Lengde (cm), per UI-SPEC */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Foreløpig størrelsesguide — kan bli oppdatert senere.
        </p>
        <button onClick={() => dialogRef.current?.close()}>Lukk</button>
      </dialog>
    </>
  );
}
```
Card surface classes (`rounded-lg border border-zinc-200 ... dark:border-zinc-800 dark:bg-zinc-950`) match the repo's existing card convention from `app/(admin)/admin/login/page.tsx` line 15 and `app/(admin)/admin/page.tsx` line 13 exactly — this is the one place the "no analog" modal still inherits a real repo convention (surface color/border), even though the `<dialog>` mechanism itself has no analog.

---

### `components/storefront/patch-checkboxes.tsx` (checkbox group, event-driven) — NO UI CODEBASE ANALOG (data shape confirmed)

Data source confirmed from `config/patches.ts` (full file, 15 lines) — 4 fixed patches including `"ingen"`. Apply RESEARCH.md Pitfall 6's single-`togglePatch`-function pattern (not independent per-checkbox handlers):
```typescript
import { PATCHES } from "@/config/patches";

function togglePatch(current: string[], clickedId: string): string[] {
  if (clickedId === "ingen") return ["ingen"];
  const withoutNone = current.filter((id) => id !== "ingen");
  const next = withoutNone.includes(clickedId)
    ? withoutNone.filter((id) => id !== clickedId)
    : [...withoutNone, clickedId];
  return next.length === 0 ? ["ingen"] : next;
}
```
Chip/checkbox visual styling: apply UI-SPEC's accent-selected-state convention (`bg-emerald-600 text-white` when checked, `border-zinc-300` when unchecked) — no repo precedent, follow UI-SPEC's Color section directly (accent reserved for "checked patch chips").

---

### `components/storefront/name-number-fields.tsx` (validated inputs, event-driven)

**Analog:** `app/(admin)/admin/login/page.tsx` lines 24-33 and 46-50 (labeled input + conditional error text — same excerpts as `configurator-form.tsx` above). **What to copy:** identical labeled-input structure and error-paragraph structure. **What's new:** wire `onBlur`/`onChange` to call `jerseyNameSchema.safeParse`/`jerseyNumberSchema.safeParse` (D-23 live validation) and set an inline error state per field, then apply UI-SPEC's dual error signal — red border on invalid input **and** red error text below it (UI-SPEC Component Notes: "add a destructive-color border to the invalid input itself"):
```typescript
className={`mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-zinc-900 ${
  error ? "border-red-600 dark:border-red-400" : "border-zinc-300 dark:border-zinc-700"
}`}
```

---

### `components/storefront/cart-panel.tsx`, `cart-item-card.tsx` (panel/list item, event-driven)

**Analog:** `app/(admin)/admin/page.tsx` lines 13 / `app/(admin)/admin/login/page.tsx` line 15 (card surface convention — the only "boxed content area" convention in the repo):
```typescript
className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
```
Adapt padding to UI-SPEC's `lg` token (24px, `p-6`) instead of the login page's `p-8` (32px), and background to UI-SPEC's `zinc-50`/`zinc-900` secondary tone for the cart panel specifically (UI-SPEC: "Cart panel background ... matches Phase 1's `border-zinc-200 bg-white ...` card pattern" but uses the zinc-100/zinc-900 secondary token, not pure white/black, to visually distinguish it from the form column). No existing repo pattern for the sticky/fixed-bottom-bar responsive behavior (D-13/D-16) — this is genuinely new; follow UI-SPEC's exact literal classes (`sticky top-6` desktop / `fixed bottom-0 inset-x-0` mobile) directly, no analog needed since UI-SPEC already specifies the exact Tailwind classes.

---

### `components/storefront/order-summary.tsx` (derived display, transform)

**Analog:** `config/pricing-tiers.ts` (the functions themselves, imported not reimplemented) + `app/(admin)/admin/page.tsx` lines 21-25 (derived-value display pattern, same as `season-display.tsx` above).

**Core pattern** (RESEARCH.md Pattern 4, already adapted to this repo's exact exports):
```typescript
import { getUnitPriceOre, getOrderTotalOre } from "@/config/pricing-tiers";
import { useCart } from "@/lib/cart/cart-context";

export function OrderSummary() {
  const cart = useCart();
  const quantity = cart.length;

  if (quantity === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Handlekurven er tom</p>;
  }

  const unitPriceOre = getUnitPriceOre(quantity);
  const totalOre = getOrderTotalOre(quantity);
  // render per UI-SPEC: quantity, unit price, subtotal, total in "NNN kr" format
}
```
**Critical constraint (do not deviate):** never store a computed price on `CartItem` — always call `getUnitPriceOre(cart.length)` fresh on every render (RESEARCH.md Pitfall 2, CONTEXT.md's cart data shape requirement for Phase 3 handoff).

---

### `components/storefront/checkout-explainer.tsx` (static copy, transform)

**Analog:** `app/page.tsx` (full file, lines 1-14 — static centered text block, no props, no state):
```typescript
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          SpJersey
        </h1>
        <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Skreddersydde fotballdrakter — kommer snart.
        </p>
      </main>
    </div>
  );
}
```
**What to copy:** Exact pattern of a stateless component rendering a heading + paragraph with no logic. Adapt copy to the exact locked UI-SPEC string: "Etter betaling får du en ordrebekreftelse på e-post. Sporingsnummer sender vi så snart varene er sendt fra leverandøren." Use UI-SPEC's Body (16px/400) typography role, not this analog's `text-lg`/`text-3xl` (those are page-hero-scale, not applicable to an inline explainer block near the CTA).

---

## Shared Patterns

### Path-alias imports (`@/...`)
**Source:** `app/(admin)/admin/page.tsx` line 1, `lib/supabase/client.ts` line 1, `vitest.config.ts` lines 6-7 (confirms `@` → repo root alias is configured for both Next.js and Vitest)
**Apply to:** Every new file importing from `config/*.ts`, `lib/cart/*`, or `lib/validation/*` — always use `@/config/...`, `@/lib/...`, never relative `../../config/...` paths across directory boundaries. Relative imports (`./cart-reducer`) are reserved for same-directory sibling files only, per the `config/*.test.ts` convention.

### Tailwind card/surface convention
**Source:** `app/(admin)/admin/login/page.tsx` line 15, `app/(admin)/admin/page.tsx` line 13
**Apply to:** All panel/card-like components (`cart-panel.tsx`, `cart-item-card.tsx`, `size-guide-modal.tsx`, `configurator-form.tsx` section blocks):
```typescript
"rounded-lg border border-zinc-200 bg-white ... shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
```

### Typography weight discipline (UI-SPEC override of Phase 1 precedent)
**Source:** `02-UI-SPEC.md` line 58, contradicting `app/(admin)/admin/login/page.tsx`'s repeated `font-medium` usage (lines 24, 35, 55) and `app/(admin)/admin/page.tsx` line 23
**Apply to:** All new storefront components — replace every instance of the Phase 1 `font-medium` (500) convention with either no weight class (regular/400, the default) or `font-semibold` (600) for headings/buttons/prices/selected-state. This is the one place where the closest analog's literal class must be deliberately NOT copied.

### Header-comment convention for logic-only files
**Source:** `config/pricing-tiers.ts` lines 1-2, `config/patches.ts` lines 1-3, `config/leagues-teams-seasons.ts` lines 1-4
**Apply to:** `lib/cart/cart-types.ts`, `lib/cart/cart-reducer.ts`, `lib/cart/cart-context.tsx`, `lib/validation/jersey-schema.ts` — a `// path/filename` line followed by a one-line rationale referencing the relevant decision ID(s) (e.g., `// D-11..D-13`, `// D-20/D-21`).

### Test file convention
**Source:** `config/pricing-tiers.test.ts` (full file), `config/leagues-teams-seasons.test.ts`, `config/patches.test.ts`
**Apply to:** All four new Wave-0 test files (`lib/cart/cart-reducer.test.ts`, `lib/cart/team-options.test.ts`, `lib/cart/patch-selection.test.ts`, `lib/validation/jersey-schema.test.ts`) — `import { describe, it, expect } from "vitest"`, relative same-directory import of the module under test, one `describe` per module, explicit `.toBe`/`.toThrow`/`.toContain` assertions, no snapshots, no mocking framework (none used anywhere in this repo).

### Supabase client — explicitly NOT needed this phase
**Source:** `lib/supabase/client.ts` (full file, 9 lines)
**Note:** CONTEXT.md flags this as a "reusable asset if any client-side data fetching is needed" but RESEARCH.md confirms it is **not** needed — catalog data is static config, not DB-backed, this phase. Do not import `lib/supabase/client.ts` into any new storefront file; its presence in CONTEXT.md's Reusable Assets list is a false lead for this specific phase (it will become relevant in Phase 3).

## No Analog Found

Files/patterns with no existing codebase precedent — planner should rely on RESEARCH.md's locally-verified Code Examples (cited above per file) instead of a repo analog:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/cart/cart-context.tsx` | provider | event-driven | No `createContext`/`useReducer` usage exists anywhere in the repo (confirmed via grep) — first Context/reducer pattern in this codebase |
| `lib/validation/jersey-schema.ts` | utility | transform | `zod` is installed but has zero existing imports anywhere in the repo — first Zod schema in this codebase |
| `components/storefront/size-guide-modal.tsx` | component | event-driven | No `<dialog>` or any modal/overlay component exists in the repo |
| `components/storefront/league-team-select.tsx` (cascading logic specifically) | component | transform | No cascading/dependent-select UI exists in the repo (data shape it reads is confirmed, the UI pattern is not) |
| `components/storefront/patch-checkboxes.tsx` (mutual-exclusivity logic specifically) | component | event-driven | No checkbox-group-with-exclusivity-rule UI exists in the repo (data shape it reads is confirmed, the UI pattern is not) |

## Metadata

**Analog search scope:** entire repo excluding `node_modules/`, `.next/`, `.git/` — full file listing enumerated via `find`; all `.ts`/`.tsx` source files read in full (17 files: `config/*.ts` ×6, `app/(admin)/admin/*` ×4, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `lib/supabase/client.ts`, `package.json`, `vitest.config.ts`)
**Files scanned:** 17 read in full + grep verification of `zod`/`useReducer`/`createContext`/`useState`/`"use client"` usage across the whole repo (confirmed near-zero prior art for this phase's core interactive patterns)
**Pattern extraction date:** 2026-07-07
