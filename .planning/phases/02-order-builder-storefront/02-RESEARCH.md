# Phase 2: Order Builder & Storefront - Research

**Researched:** 2026-07-07
**Domain:** Client-side e-commerce configurator (React 19 / Next.js 16 App Router) — cascading catalog selection, cart state, live pricing, Zod validation
**Confidence:** HIGH

## Summary

Phase 2 is almost entirely a **client-side, static-data** problem: there is no new database table, no new server route, and no payment/webhook code in scope (that's Phase 3). The catalog (`config/leagues-teams-seasons.ts`, `config/patches.ts`) and pricing math (`config/pricing-tiers.ts`) already exist from Phase 1 as pure TypeScript modules with unit tests — this phase's job is to build a single-page React UI that reads those modules, manages an in-memory cart, and renders a live-updating summary. No backend work, no new Supabase tables, no auth changes.

Two things need explicit resolution before planning: (1) `config/leagues-teams-seasons.ts` does **not** have a per-team season array — it exports one `CURRENT_SEASON` constant — so the "cascading season selector" in CONTEXT.md D-15 must be implemented as a read-only label, exactly as the UI-SPEC already concluded; the config file does not need to change. (2) No client-side state library is installed. Given the phase's own decisions (D-13/D-14/D-16: everything lives on **one page**, cart panel never becomes a separate route), a new dependency (e.g. zustand) is not justified — plain `useReducer` lifted into a single Client Component root, exposed via a scoped React Context, is sufficient, zero-dependency, and matches Phase 1's zero-abstraction style (hand-rolled Tailwind, no state library, no component library).

**Primary recommendation:** Build the storefront as one `"use client"` root component holding a `useReducer` cart store (exposed via a page-scoped Context, not a global store), with the configurator form as a "draft" state object separate from the committed cart array; import all pricing/catalog logic from Phase 1's `config/*.ts` modules and never reimplement it; validate name/number with Zod using Unicode-aware regex (`\p{L}` with the `u` flag), not hardcoded Latin-with-diacritics character classes.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Multi-drakt-flyt (cart behavior)**
- D-11: Customer builds a cart — configure one jersey, add it to the cart, then start configuring the next. Not a repeating form, not single-jersey-per-order.
- D-12: Jerseys already in the cart can be fully re-opened and edited (all fields pre-filled), not just removed and re-added from scratch.
- D-13: The cart/order summary is a persistent panel shown alongside the configurator at all times (sticky side panel on desktop, collapses to a bottom summary on mobile) — not a separate cart page/step.

**Skjema-struktur (form structure)**
- D-14: The configurator is a single page/form (league → team → season → size → patches → name/number), not a multi-step wizard.
- D-15: League → team → season selection is cascading/dependent (team list filters by league, season list filters by team) — matches the existing shape of `config/leagues-teams-seasons.ts`. Invalid combinations are structurally impossible, not caught by validation after the fact.
- D-16: The cart panel (D-13) is visible from the very first moment on the same page as the form — not something that only appears after the first "add to cart."

**Størrelsesguide (size guide, PROD-06)**
- D-17: No real size chart/measurements exist yet from the China contact. Build a standard placeholder football-jersey size table (S/M/L/XL/XXL/3XL with chest/length cm measurements), clearly labeled as a placeholder the owner can swap out later. Not a blocker for this phase.
- D-18: Size guide is shown via a modal/popover triggered by a link/icon next to the size selector — not permanently inline.
- D-19: Selectable sizes: standard adult S–3XL only. No kids' sizes in v1.

**Navn/nummer-validering (name/number validation, PROD-04)**
- D-20: Name: max 12 characters, allowing letters (including Norwegian æøå and other international letters), spaces, and hyphens (for double-barreled names).
- D-21: Number: valid range 0–99, integers only (no decimals, no negative numbers).
- D-22: Name and number are both optional per jersey — a customer can order a plain jersey with no print. Validation only runs on non-empty input.
- D-23: Validation feedback appears live (on blur/change), not only on form submission.

### Claude's Discretion
- Exact visual layout/styling of the cart side panel and mobile collapse behavior — implementation detail, follow existing Tailwind conventions from Phase 1's admin UI. **(Now further constrained by 02-UI-SPEC.md — see that file for exact spacing/color/breakpoint values; UI-SPEC supersedes this research on visual detail.)**
- Exact wording of the post-payment explainer text (PROD-07) — draft Norwegian copy consistent with PROJECT.md's tone. **(Now locked by UI-SPEC's Copywriting Contract — use that exact copy.)**
- Whether size guide numbers use metric-only or also include a rough garment-size correspondence — draft reasonable placeholder content.
- State management approach for the cart (client state vs. persisted somewhere) — **this research resolves it: see Architecture Patterns below.**

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Kids' sizes was decided against for v1 (D-19), not deferred.

## Project Constraints (from CLAUDE.md)

- Next.js 16.x App Router only — **never** the Pages Router (`pages/`), which is officially in maintenance mode.
- TypeScript strict typing throughout; Zod for all input validation (order form input, later webhook payloads).
- Tailwind CSS 4.x for styling; CLAUDE.md's stack table recommends shadcn/ui + Radix, but 02-UI-SPEC.md has **already overridden this for Phase 2 specifically** — no shadcn init this phase, hand-rolled Tailwind matching Phase 1's admin pattern. Follow the UI-SPEC, not the general CLAUDE.md recommendation, for this phase.
- `date-fns` recommended for Norwegian-locale date formatting — not needed in this phase (no dates rendered in the configurator/cart).
- GSD workflow enforcement: file edits must happen through `/gsd-execute-phase`, not ad hoc.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROD-01 | Kunde kan velge liga, lag og sesong fra et strukturert utvalg | Cascading select pattern (Architecture Patterns §Cascading form); confirmed `config/leagues-teams-seasons.ts` shape (single `CURRENT_SEASON`, not per-team seasons) — season renders as read-only text per UI-SPEC, no config change needed |
| PROD-02 | Kunde kan velge størrelse | Fixed 6-option button/radio group (S–3XL), pure client state, no research risk |
| PROD-03 | Kunde kan hake av patcher fra fast utvalg (inkl. "ingen") | Mutual-exclusivity reducer pattern (Common Pitfalls §7) reading `config/patches.ts` |
| PROD-04 | Navn og nummer på trykk, med validering | Zod schema pattern with Unicode property escapes (Code Examples §Zod schema); numeric input pitfalls (Common Pitfalls §6) |
| PROD-05 | Live oppdatert ordresammendrag med automatisk pakkerabatt | `useReducer`-driven cart + `useMemo` derived pricing from `config/pricing-tiers.ts` (Architecture Patterns §Cart state) |
| PROD-06 | Størrelsesguide/fit chart ved størrelsesvalg | Native `<dialog>` element pattern (Don't Hand-Roll §Modal), Baseline-supported since 2022 |
| PROD-07 | Kort forklaringstekst nær checkout | Static copy block, exact text locked in UI-SPEC Copywriting Contract — no research risk |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| League/team/season cascading selection | Browser / Client | — | Static config bundled at build time (`config/leagues-teams-seasons.ts`); no fetch, no server round-trip needed |
| Size selection + size guide modal | Browser / Client | — | Pure UI state, placeholder content is static |
| Patch checkbox group | Browser / Client | — | Reads static `config/patches.ts`; no persistence this phase |
| Name/number input + live validation | Browser / Client | — | Zod validation runs client-side for immediate feedback this phase; **must be re-validated server-side in Phase 3** when the order is actually persisted (defense in depth — never trust client validation alone for what gets written to the DB or sent to the supplier) |
| Cart state (add/edit/remove) | Browser / Client | — | In-memory only this phase; no `orders`/`order_items` table writes happen until Phase 3's payment webhook |
| Live order summary / bundle pricing display | Browser / Client | API / Backend (forward dependency) | Displayed price this phase is **advisory only**; PAY-03 (Phase 3) requires the total to be recomputed server-side at Checkout Session creation — this phase's math must import the exact same `config/pricing-tiers.ts` functions so the two calculations can never drift |
| "Gå til betaling" CTA | Browser / Client (UI only, no-op) | API / Backend (Phase 3) | UI-SPEC explicitly scopes this phase's button to a no-op click handler; Phase 3 wires the real Stripe/Vipps Checkout Session creation |

## Standard Stack

### Core (already installed, Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.10 | App Router framework | Already the project's framework; confirmed via `package.json` |
| react / react-dom | 19.2.4 | UI runtime | Ships with Next 16; `useReducer`, `useActionState`, `useOptimistic` all available |
| zod | 4.4.3 | Runtime validation (name/number/jersey config) | Already installed; v4 API (`z.string().max().regex()`) verified working locally against Unicode test cases (see Code Examples) |
| tailwindcss | 4.x | Styling | Already installed; UI-SPEC specifies exact tokens to use |

### Supporting (new this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 1.23.0 [VERIFIED: npm registry] | Icons (size-guide info icon, cart edit/remove icons) | Already specified in 02-UI-SPEC.md as "not yet installed — add as a dependency this phase." Confirmed on npm registry, current version 1.23.0, published under the official `lucide-icons/lucide` GitHub org. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useReducer` + page-scoped React Context for cart state | `zustand` (5.0.14, verified legitimate — see Package Legitimacy Audit) | Zustand is the general 2026 community default for e-commerce cart state [MEDIUM — WebSearch, cross-verified across multiple 2026 sources] because it avoids Context re-render fan-out and works cleanly across route boundaries. **Neither advantage applies here**: D-13/D-14/D-16 lock the cart panel and configurator to the *same single page* — there is no route boundary to cross, and the cart realistically holds a handful of items (not hundreds), so Context re-render cost is negligible. Reconsider zustand only if a future phase splits the configurator and cart across separate routes, or if the cart needs to survive a full page navigation (e.g., a dedicated `/checkout` route in Phase 3) without a shared layout wrapping both. |
| Native `<dialog>` for the size-guide modal | Hand-rolled `<div>` overlay + manual focus trap/outside-click | `<dialog>` + `showModal()` give focus trapping, ESC-to-close, and top-layer backdrop stacking for free, and have been Baseline widely available since March 2022 (~96% global browser support) [CITED: developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog]. A hand-rolled modal reimplements all of this and is a classic "don't hand-roll" trap for exactly the kind of low-stakes UI this phase needs. |
| Zod `\p{L}` Unicode property escape for name validation | Hardcoded Latin+diacritics character class (e.g. `[a-zA-ZæøåÆØÅ]`) | Hardcoded classes silently reject legitimate international names (e.g., "Müller", "José", "Şahin") that a Norwegian jersey shop's customers will realistically want to print — verified locally that `\p{L}` accepts all of these while still rejecting digits/symbols (see Code Examples). |

**Installation:**
```bash
npm install lucide-react
npm install -D jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @vitejs/plugin-react vite-tsconfig-paths
```

**Version verification:** Verified via `npm view <package> version` against the live registry on 2026-07-07:
- `lucide-react` → 1.23.0 (created 2020-10-19, official repo `lucide-icons/lucide`)
- `jsdom` → 29.1.1 (official repo `jsdom/jsdom`)
- `@testing-library/react` → 16.3.2, `@testing-library/dom` → 10.4.1, `@testing-library/jest-dom` → 6.9.1 (all official `testing-library` GitHub org)
- `@vitejs/plugin-react` → 6.0.3, `vite-tsconfig-paths` → 6.1.1 (official `vitejs`/community-maintained repos)
- `zustand` → 5.0.14 confirmed to exist and be legitimate, but **not recommended for installation this phase** (see Alternatives Considered)

No `postinstall` scripts found on any of the above packages (`npm view <pkg> scripts.postinstall` returned empty for all).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads (last week, npm API) | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------------------------|-------------|-----------|-------------|
| lucide-react | npm | ~5.7 yrs | very high volume | github.com/lucide-icons/lucide | OK | Approved |
| jsdom | npm | ~14.7 yrs | very high volume | github.com/jsdom/jsdom | OK | Approved |
| @testing-library/react | npm | ~7 yrs | very high volume | github.com/testing-library/react-testing-library | OK | Approved |
| @testing-library/dom | npm | ~7 yrs | very high volume | github.com/testing-library/dom-testing-library | OK | Approved |
| @testing-library/jest-dom | npm | ~7 yrs | very high volume | github.com/testing-library/jest-dom | OK | Approved |
| @vitejs/plugin-react | npm | ~4.9 yrs | very high volume | github.com/vitejs/vite-plugin-react | OK | Approved |
| vite-tsconfig-paths | npm | ~5.9 yrs | very high volume | github.com/aleclarson/vite-tsconfig-paths | OK | Approved |
| zustand | npm | ~7.2 yrs | very high volume | github.com/pmndrs/zustand | OK | Verified legitimate, **not recommended for install** (see Alternatives Considered) |

*Exact npm download-count API values returned implausibly large numbers for all packages during this session (likely a registry mirror/aggregation artifact) — download-volume magnitude is reported qualitatively ("very high volume", all multi-year-old packages with official GitHub-org-owned repos) rather than as a precise weekly figure, since the raw numbers could not be trusted as exact.*

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ▼
app/(storefront)/page.tsx  (Server Component shell — no data fetching needed,
  │                          catalog data is statically imported, not DB-backed)
  ▼
<StorefrontClient> ("use client" root — mounted once per page load)
  │
  ├── CartProvider (React Context + useReducer)
  │     cart: CartItem[]
  │     dispatch: add | update | remove | undoRemove
  │
  ├── <ConfiguratorForm>                         <CartPanel>
  │     draft state (useState):                    ├── empty state (D-16: visible pre-add)
  │       league/national choice ──┐                ├── <CartItemCard> × N
  │       team (filtered by above) │  cascading      │     "Rediger" → loads item into
  │       season (derived, read-   │  derivation     │       ConfiguratorForm draft state
  │         only from CURRENT_     │  (useMemo)      │     "Fjern" → dispatch(remove) +
  │         SEASON)                │                 │       5s inline undo affordance
  │       size ─────────────────────┘                ├── <OrderSummary>
  │       patches (mutual excl.)                     │     useMemo(() => {
  │       name / number ── Zod validation             │       getUnitPriceOre(cart.length)
  │         (live, on blur/change)                    │       getOrderTotalOre(cart.length)
  │     "Legg i handlekurv" / "Oppdater"               │     }, [cart.length])
  │       → dispatch(add | update)                     │     ← imported from
  │       → reset draft state                          │       config/pricing-tiers.ts
  │                                                    └── "Gå til betaling" (no-op this phase)
  ├── <SizeGuideModal> (native <dialog>, opened via ref)
  └── <CheckoutExplainer> (static PROD-07 copy)

  All catalog/pricing data flows one-way, in-memory, client-side:
  config/leagues-teams-seasons.ts ──┐
  config/patches.ts ─────────────────┼──► imported directly into Client Components
  config/pricing-tiers.ts ──────────┘     (no API route, no Supabase call this phase)
```

A reader can trace the primary use case (pick league → team → size → patches → name/number → add to cart → see live total → click "Gå til betaling") entirely within this single client-side tree; nothing crosses a network boundary in this phase.

### Recommended Project Structure
```
app/
└── (storefront)/
    ├── page.tsx                    # Server Component shell, renders <StorefrontClient/>
    └── storefront-client.tsx       # "use client" root: mounts CartProvider + layout

components/
└── storefront/
    ├── configurator-form.tsx       # top-level form, owns "draft" state
    ├── league-team-select.tsx      # league/national + team cascading selects
    ├── season-display.tsx          # read-only "Sesong: 2025/26" label
    ├── size-selector.tsx           # 6-button group, 44px touch targets
    ├── size-guide-modal.tsx        # native <dialog>, placeholder table
    ├── patch-checkboxes.tsx        # reads config/patches.ts, enforces "Ingen" exclusivity
    ├── name-number-fields.tsx      # Zod-validated inputs, live feedback
    ├── cart-panel.tsx              # sticky desktop / bottom-sheet mobile
    ├── cart-item-card.tsx          # Rediger / Fjern actions
    ├── order-summary.tsx           # imports config/pricing-tiers.ts only
    └── checkout-explainer.tsx      # static PROD-07 copy

lib/
├── cart/
│   ├── cart-context.tsx            # createContext + Provider wiring useReducer
│   ├── cart-reducer.ts             # pure reducer function — unit-testable, no DOM
│   └── cart-types.ts               # CartItem, CartAction, CartState
└── validation/
    └── jersey-schema.ts            # Zod schema for name/number (+ full jersey config)
```

### Pattern 1: Page-scoped cart Context + useReducer (not a global store, not zustand)

**What:** A single `CartProvider` mounted inside the storefront route's Client Component root, wrapping the configurator form and cart panel. State lives in a `useReducer`, exposed via Context so the form and cart panel can both dispatch/read without prop-drilling through every intermediate component.

**When to use:** Exactly this phase's shape — one page, one cart, low item count (realistically 1–10 jerseys per order), no cross-route state sharing required.

**Example:**
```typescript
// lib/cart/cart-types.ts
export interface CartItem {
  id: string;
  leagueId: string | "landslag";
  teamId: string;
  teamName: string;
  season: string; // CURRENT_SEASON at time of add — snapshotted, not re-derived later
  size: "S" | "M" | "L" | "XL" | "XXL" | "3XL";
  patchIds: string[]; // subset of PATCHES ids; ["ingen"] when no patch selected
  name?: string;
  number?: number;
}

export type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "update"; id: string; item: CartItem }
  | { type: "remove"; id: string };

// lib/cart/cart-reducer.ts — pure function, no DOM dependency, unit-testable
// under the existing vitest.config.ts "node" environment with zero new setup.
import type { CartItem, CartAction } from "./cart-types";

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add":
      return [...state, action.item];
    case "update":
      return state.map((item) => (item.id === action.id ? action.item : item));
    case "remove":
      return state.filter((item) => item.id !== action.id);
  }
}
```

```typescript
// lib/cart/cart-context.tsx
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

export function useCartDispatch() {
  const dispatch = useContext(CartDispatchContext);
  if (dispatch === null) throw new Error("useCartDispatch must be used within CartProvider");
  return dispatch;
}
```

Splitting state and dispatch into two contexts (a standard React pattern) means components that only dispatch (e.g., the configurator form's submit handler) don't re-render when the cart array changes.

### Pattern 2: Cascading select derivation via `useMemo`

**What:** Team options are derived from the selected league via `useMemo`, not stored redundantly in state. Season is never a selectable field — it's read directly from `CURRENT_SEASON`.

**Example:**
```typescript
// Source: config/leagues-teams-seasons.ts (Phase 1, verified shape)
import { LEAGUES, NATIONAL_TEAMS, CURRENT_SEASON, type Team } from "@/config/leagues-teams-seasons";

const LANDSLAG_ID = "landslag" as const;

function useTeamOptions(leagueOrNationalId: string | null): Team[] {
  return useMemo(() => {
    if (leagueOrNationalId === null) return [];
    if (leagueOrNationalId === LANDSLAG_ID) return NATIONAL_TEAMS;
    return LEAGUES.find((l) => l.id === leagueOrNationalId)?.teams ?? [];
  }, [leagueOrNationalId]);
}

// Season is NEVER a select — render directly once a team is chosen:
// <p>Sesong: {CURRENT_SEASON}</p>
```

**Important:** `config/leagues-teams-seasons.ts` (confirmed by direct read + its own test suite `leagues-teams-seasons.test.ts`, which asserts `expect(CURRENT_SEASON).toBe("2025/26")` and that no `team` object ever has a `season` property) exports exactly one `CURRENT_SEASON` string constant — there is no per-team or per-league season array to cascade against. **Do not add one.** CONTEXT.md's D-15 wording ("season list filters by team") describes the intended *UX outcome* (invalid league/team/season combinations are structurally impossible), which is already achieved trivially since there is only one valid season value — rendering it as read-only text satisfies D-15 without any config change. This matches 02-UI-SPEC.md's own resolution of the same discrepancy; this research confirms the UI-SPEC's read of the file is correct.

### Pattern 3: Draft-vs-cart separation for the "add or edit" flow (D-12)

**What:** The configurator form owns its own local "draft" state (`useState`), completely separate from the committed `cart` array in Context. An `editingId` (or `null`) tracks whether the form is in "add new" or "edit existing" mode.

**When to use:** Whenever "Rediger" is clicked on a cart card — pass that item's full config into the form's draft state and set `editingId`. On submit, dispatch `update` instead of `add` if `editingId` is set, then clear both.

```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const [draft, setDraft] = useState<DraftJersey>(EMPTY_DRAFT);

function handleEdit(item: CartItem) {
  setEditingId(item.id);
  setDraft(itemToDraft(item));
  // scroll form into view — cart card "Rediger" reopens the SAME form (D-14: single page/form)
}

function handleSubmit(validated: DraftJersey) {
  const item = draftToCartItem(validated);
  if (editingId) {
    dispatch({ type: "update", id: editingId, item: { ...item, id: editingId } });
  } else {
    dispatch({ type: "add", item: { ...item, id: crypto.randomUUID() } });
  }
  setEditingId(null);
  setDraft(EMPTY_DRAFT);
}
```

### Pattern 4: Live order summary derived from Phase 1's pricing module

**What:** The summary never stores its own price — it derives from `cart.length` on every render via `useMemo`, calling Phase 1's exported functions directly.

```typescript
// Source: config/pricing-tiers.ts (Phase 1, verified — imports directly, no reimplementation)
import { getUnitPriceOre, getOrderTotalOre } from "@/config/pricing-tiers";
import { useCart } from "@/lib/cart/cart-context";

function OrderSummary() {
  const cart = useCart();
  const quantity = cart.length;

  if (quantity === 0) {
    return <p>Handlekurven er tom</p>; // UI-SPEC empty state copy
  }

  const unitPriceOre = getUnitPriceOre(quantity);
  const totalOre = getOrderTotalOre(quantity);

  return (
    <div>
      <p>{quantity} × {formatOre(unitPriceOre)}</p>
      <p className="font-semibold">{formatOre(totalOre)}</p>
    </div>
  );
}

// Pricing tiers are always whole hundreds of øre (35000/32000/29000), so
// integer division by 100 is always exact — no rounding logic needed.
function formatOre(ore: number): string {
  return `${ore / 100} kr`;
}
```

### Anti-Patterns to Avoid
- **Reimplementing bundle-discount math in a component:** violates the single-source-of-truth constraint both CONTEXT.md and 02-UI-SPEC.md call out explicitly (`getUnitPriceOre`/`getOrderTotalOre` must be the only place tier logic lives).
- **Computing each cart item's price from its own position/index:** the pricing model is whole-order tiered (3 jerseys = 3×290, not 350+320+290, per Phase 1's own code comment) — every item's displayed unit price must be recomputed from the *current total cart length*, not fixed at the moment it was added.
- **Treating `config/leagues-teams-seasons.ts` as needing a schema change:** it doesn't; see Pattern 2.
- **Adding a state-management library "because it's 2026 best practice":** justified only by app shape, and this app's shape (single page, small cart) doesn't need one — see Alternatives Considered.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle-discount price calculation | Custom tier-lookup logic inside a React component | `getUnitPriceOre()` / `getOrderTotalOre()` from `config/pricing-tiers.ts` | Already built, tested, and is the single source of truth Phase 3's server-side recompute (PAY-03) must match exactly |
| Size-guide modal | Hand-rolled `<div>` overlay + manual focus trap + outside-click listener + Escape-key listener | Native `<dialog>` element (`ref.current.showModal()` / `.close()`) | Free focus trap, Escape-to-close, and top-layer backdrop; Baseline widely available since March 2022 (~96% global support) [CITED: MDN] |
| International name character validation | Hardcoded Latin+diacritics regex like `[a-zA-ZæøåÆØÅ\s-]` | Zod `.regex(/^[\p{L}\s-]+$/u)` (Unicode property escape) | Hardcoded classes silently reject real customer input (e.g. "Müller", "José", "Şahin") that isn't in the author's assumed alphabet — verified locally, see Code Examples |
| "Ingen" ↔ other-patch mutual exclusivity | Ad hoc `onChange` handlers on each checkbox independently mutating a shared array | A single derived function/reducer case that recomputes the whole `patchIds` array atomically from the clicked patch id | Independent handlers can race/produce an invalid state (both "Ingen" and another patch checked) depending on event/render order |
| Cart item IDs | `Math.random()` or index-based IDs assigned inline during JSX render | `crypto.randomUUID()` called only inside the `add` action/event handler, never during render | ID generation during render can cause hydration mismatches if the component ever renders on the server; generating only in response to a user event avoids this entirely regardless |

**Key insight:** Every "don't hand-roll" item in this phase already has a locally-verified, low-risk standard solution (native platform API or Phase 1's own exported functions) — there is no case in this phase where reaching for a new heavyweight dependency is justified over the native/existing option.

## Common Pitfalls

### Pitfall 1: Treating `config/leagues-teams-seasons.ts` as under-built and adding a season array
**What goes wrong:** A planner/executor reads CONTEXT.md's D-15 ("season list filters by team") literally and adds a `season: string[]` or similar field to the `Team` interface, duplicating `CURRENT_SEASON` per team.
**Why it happens:** CONTEXT.md was written before the actual Phase 1 config shape was double-checked; the UI-SPEC already caught and resolved this.
**How to avoid:** Render season as read-only text derived from the single `CURRENT_SEASON` export (Pattern 2 above). Confirmed via direct file read and via `leagues-teams-seasons.test.ts`, which explicitly asserts no `Team` object ever carries a `season` property.
**Warning signs:** Any diff that touches `config/leagues-teams-seasons.ts` in this phase should be treated as a red flag — this phase is a *consumer* of that config, not an editor of it.

### Pitfall 2: Reimplementing or "optimizing" the tiered pricing math in the UI layer
**What goes wrong:** A per-item price is stored at add-time and never revisited, so removing/adding items produces stale per-item prices that don't reflect the new tier.
**Why it happens:** It's tempting to store `unitPriceOre` on the `CartItem` itself for convenience.
**How to avoid:** Never persist a price on `CartItem`. Always derive `getUnitPriceOre(cart.length)` fresh, for the *entire* cart, on every render (Pattern 4). UI-SPEC explicitly requires this: "recomputed for ALL items whenever cart size changes."
**Warning signs:** Any `unitPriceOre`/`price` field appearing on the `CartItem` type is a sign the pattern was violated.

### Pitfall 3: Hardcoded Latin character-class regex for the name field
**What goes wrong:** `/^[a-zA-ZæøåÆØÅ\s-]+$/` (no Unicode flag) passes for Norwegian names but rejects other legitimate international names players/customers may want printed (accented Latin, Turkish, etc.), producing false validation errors.
**Why it happens:** D-20's wording ("Norwegian æøå and other international letters") is easy to under-implement by hand-adding only the Norwegian-specific characters.
**How to avoid:** Use `\p{L}` (Unicode "Letter" property) with the `u` regex flag: `/^[\p{L}\s-]{1,12}$/u`. Verified locally in this session against Zod 4.4.3: accepts "Müller", "Åge-Sørensen", "José", "Şahin"; rejects "Name123" (digits) and strings over 12 chars.
**Warning signs:** Any regex literal in the codebase containing a hand-typed list of accented characters (`æøåÆØÅ`, `éèê`, etc.) instead of a Unicode property escape.

### Pitfall 4: Trusting `<input type="number">` alone for the number-print field
**What goes wrong:** The native number input's `min`/`max` attributes are advisory, not enforcing — some browsers/input methods allow typing/pasting `"1.5"`, `"05"`, `"1e2"`, or scrolling the value out of the declared range. Relying on the HTML attribute alone can let invalid values reach state.
**Why it happens:** `<input type="number" min="0" max="99">` looks like it fully enforces the constraint, but HTML spec only requires *validity-state flagging*, not input prevention, in all cases.
**How to avoid:** Treat the number input's raw value as untrusted string input and always re-validate through the Zod schema (integer, 0–99 inclusive) before accepting it into `draft` state, exactly the same as the name field (D-23 already requires live on-blur/on-change validation for both fields — this is the mechanism that closes the gap).
**Warning signs:** A number field whose only validation is the HTML `min`/`max` attributes, with no corresponding Zod check in the change/blur handler.

### Pitfall 5: Displaying this phase's total as if it were the trusted, final price
**What goes wrong:** Because this phase's order summary is the *only* pricing UI a developer sees while building it, it's easy to forget PAY-03 (Phase 3) requires the server to recompute the total independently at Checkout Session creation and never trust a client-submitted amount.
**Why it happens:** This phase has no payment integration yet, so there's no immediate feedback loop forcing the distinction between "display price" and "trusted price."
**How to avoid:** Keep the cart's committed shape (jersey configs, no price fields — see Pitfall 2) so that whatever Phase 3 reads from this phase's output is *always* recomputed from `config/pricing-tiers.ts` on the server, never read as a number the client sent.
**Warning signs:** Any code path in this phase that stores a total price *value* (as opposed to deriving it live) anywhere that might later get serialized and sent to a server trustingly.

### Pitfall 6: Naive independent checkbox handlers for "Ingen" mutual exclusivity
**What goes wrong:** Wiring each of the 4 patch checkboxes with its own `onChange` that mutates a shared `patchIds` array independently can, depending on click/render timing, leave both "Ingen" and another patch checked simultaneously, or leave the array empty with nothing checked.
**Why it happens:** Mutual exclusivity across *N* independent checkboxes is inherently a cross-cutting concern that per-checkbox handlers don't naturally express.
**How to avoid:** Implement as a single `togglePatch(patchId)` function that: if toggling "ingen" on → set `patchIds = ["ingen"]`; if toggling any other patch on → remove "ingen" and add the new id; if toggling a non-"ingen" patch off and no patches remain selected → default back to `["ingen"]` (per UI-SPEC: "Ingen" pre-checked by default, form always valid).
**Warning signs:** Multiple separate `useState` calls (one per patch) instead of one `patchIds: string[]` array with one update function.

## Code Examples

### Zod schema for name/number (verified locally against Zod 4.4.3)
```typescript
// lib/validation/jersey-schema.ts
// Source: locally verified against installed zod@4.4.3 (node -e test, this session)
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
  .or(z.literal("")); // D-22: name is optional; empty string is valid (no validation runs)

export const jerseyNumberSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(/^\d{1,2}$/, "Må være et helt tall mellom 0 og 99.")
      .refine((val) => Number(val) >= 0 && Number(val) <= 99, "Må være et helt tall mellom 0 og 99."),
  ])
  .optional();

// Verified locally (node -e, this session):
//   jerseyNameSchema: "Müller" -> valid, "Åge-Sørensen" -> valid,
//                     "José" -> valid, "Şahin" -> valid, "Name123" -> INVALID (rejected)
```

**Note on D-21 (number as integer 0–99):** validating the *string* form with a digit-only regex before coercing to a number (rather than `z.coerce.number().int().min(0).max(99)` directly on raw input) avoids the classic `z.coerce.number()` pitfall where strings like `"1e1"`, `"0x10"`, or `" 5 "` coerce to unexpected numeric values via JS's native `Number()` coercion rules. Regex-then-coerce is stricter and safer for a print field where a wrong number is a real production error (wrong shirt printed).

### Native `<dialog>` size-guide modal
```typescript
// Source: MDN HTMLDialogElement docs (Baseline since 2022), verified via WebSearch this session
"use client";
import { useRef } from "react";

function SizeGuideModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button onClick={() => dialogRef.current?.showModal()}>
        Se størrelsesguide
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-zinc-200 p-6 backdrop:bg-black/50 dark:border-zinc-800"
      >
        <h2 className="text-xl font-semibold">Størrelsesguide</h2>
        {/* placeholder S–3XL table per D-17 */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Foreløpig størrelsesguide — kan bli oppdatert senere.
        </p>
        <button onClick={() => dialogRef.current?.close()}>Lukk</button>
      </dialog>
    </>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Hand-rolled modal overlay (div + manual focus trap + keyboard listeners) | Native `<dialog>` + `showModal()` | Baseline widely available since March 2022 | Removes an entire class of accessibility bugs (focus trap, Escape handling) for free |
| Hardcoded diacritic character-class regex for international names | Unicode property escapes (`\p{L}` with `u` flag) | Standard since ES2018 (`u` flag Unicode property escapes), broadly supported in all evergreen engines well before this project's timeframe | Correctly validates any Unicode letter, not just a manually enumerated subset |

**Deprecated/outdated:** none directly relevant to this phase's scope — no legacy APIs are involved.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `useReducer` + page-scoped Context is the right call over `zustand` for this phase's cart state | Architecture Patterns / Alternatives Considered | Low — both are legitimate, low-risk choices (zustand passed the Package Legitimacy Audit); if the planner disagrees, swapping to zustand later is a small refactor since the `useCart`/`useCartDispatch` hook interface can stay identical |
| A2 | Recommending installation of `jsdom` + React Testing Library for component-level tests this phase | Standard Stack / Validation Architecture | Medium — CONTEXT.md does not explicitly require component-level test coverage for Phase 2; Phase 1's precedent is heavy on pure-logic unit tests (`config/*.test.ts`), not component rendering tests. If the owner prefers lighter test scope, the planner can scope Wave 0 down to pure-logic tests only (cart reducer, Zod schemas, pricing integration) under the *existing* `vitest.config.ts` "node" environment, skipping the jsdom/RTL install entirely. See Validation Architecture below for both options. |
| A3 | `<dialog>` element's `showModal()` behavior (focus trap, `::backdrop`) works acceptably without additional polyfill for this project's target browsers | Don't Hand-Roll / Code Examples | Low — Baseline "widely available" status was confirmed via a 2026-dated WebSearch summary of MDN, not a raw MDN fetch in this session; if the owner's actual customer base skews toward unusually old browsers, native `<dialog>` styling (`::backdrop`) may need graceful degradation, but core open/close functionality is safe |

## Open Questions

1. **Should the cart persist across a page refresh (e.g., `sessionStorage`)?**
   - What we know: CONTEXT.md doesn't require this; D-13/D-16 only require the panel to be visible on the same page, not to survive a reload.
   - What's unclear: Whether losing an in-progress cart on accidental refresh is an acceptable UX gap for a real customer.
   - Recommendation: Out of scope for this phase's locked decisions — build in-memory only (Pattern 1) to keep the phase minimal; flag to the owner as a cheap future enhancement (`sessionStorage` sync on the reducer, zero new dependencies) if refresh-loss turns out to bother real customers.

2. **Exact size-guide placeholder measurement values (D-17)**
   - What we know: A standard adult S–3XL chest/length table is expected, clearly labeled as a placeholder.
   - What's unclear: No real supplier measurements exist yet (explicitly deferred per D-17) — any numbers used are invented placeholders, not sourced from the China contact.
   - Recommendation: Use generic, plausible football-jersey measurements (chest circumference and garment length in cm, roughly: S ~96/70, M ~100/72, L ~104/74, XL ~110/76, XXL ~116/78, 3XL ~122/80) purely as illustrative placeholder content — these are **not verified against any real supplier spec** and must be tagged as such in the UI (already required by D-17/UI-SPEC's disclaimer copy).

## Environment Availability

No external service/CLI dependencies are introduced by this phase (no new database tables, no new API integrations, no payment/WhatsApp/email providers touched). All work is local npm package installation and application code.

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js (for npm installs / `node -e` regex verification) | Local dev, tests | ✓ | (project already running Next 16 / Vitest 4 successfully) | — |
| npm registry access | Installing `lucide-react`, test-tooling packages | ✓ (verified this session via `npm view`) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 (already installed and used in Phase 1) |
| Config file | `vitest.config.ts` — currently `test.environment: "node"`, no jsdom, includes only `config/**/*.test.ts` and `tests/**/*.test.ts` |
| Quick run command | `npx vitest run <path-to-file>` (note: **`package.json` has no `test` script yet** — only `dev`/`build`/`start`/`lint`; adding one is a Wave 0 gap, see below) |
| Full suite command | `npx vitest run` |

**Two viable scopes for this phase's test coverage — planner must pick one explicitly:**

**Option A — Logic-only (no new dev dependencies, matches Phase 1's existing pattern exactly):**
Test the cart reducer, the Zod schemas, and the pricing-integration glue as pure functions under the *existing* `node` environment. No component rendering tests. Zero new devDependencies.

**Option B — Component-level (requires jsdom + RTL install, listed under Standard Stack):**
Additionally render `<ConfiguratorForm>`/`<CartPanel>` with React Testing Library to assert on-screen behavior (live validation messages appearing, cart card rendering, total updating). Requires either a second Vitest project/workspace (to keep `node` environment for `config/*.test.ts` and `jsdom` for component tests) or a per-file `// @vitest-environment jsdom` docblock override — do **not** blanket-switch the existing `vitest.config.ts` to `jsdom`, since that would slow down/complicate the existing pure-logic Phase 1 tests unnecessarily.

### Phase Requirements → Test Map (Option A minimum; Option B rows marked)
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|--------------|
| PROD-01 | Team options correctly filtered by selected league/"Landslag" | unit | `npx vitest run lib/cart/team-options.test.ts` | ❌ Wave 0 |
| PROD-03 | "Ingen" mutual exclusivity reducer produces valid `patchIds` for every input sequence | unit | `npx vitest run lib/cart/patch-selection.test.ts` | ❌ Wave 0 |
| PROD-04 | Zod name/number schemas accept international letters, reject invalid input, enforce D-20/D-21 bounds | unit | `npx vitest run lib/validation/jersey-schema.test.ts` | ❌ Wave 0 |
| PROD-05 | `cartReducer` add/update/remove produce correct state; order summary derives correct price from `cart.length` via Phase 1's `getUnitPriceOre`/`getOrderTotalOre` | unit | `npx vitest run lib/cart/cart-reducer.test.ts` | ❌ Wave 0 |
| PROD-02, PROD-06, PROD-07 | Size selection, size-guide modal open/close, checkout explainer text render | component (Option B only) | `npx vitest run components/storefront/*.test.tsx` | ❌ Wave 0 (only if Option B chosen) |

### Sampling Rate
- **Per task commit:** `npx vitest run <changed-file>.test.ts`
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add a `"test": "vitest run"` script to `package.json` — currently absent; every existing Phase 1 test is run via bare `npx vitest run`.
- [ ] `lib/cart/cart-reducer.test.ts` — covers PROD-05 (add/update/remove correctness)
- [ ] `lib/validation/jersey-schema.test.ts` — covers PROD-04 (Zod schema edge cases: max length, Unicode letters, 0–99 range, optional/empty)
- [ ] `lib/cart/team-options.test.ts` — covers PROD-01 (cascading derivation correctness, including the "Landslag" pseudo-league path)
- [ ] `lib/cart/patch-selection.test.ts` — covers PROD-03 (mutual-exclusivity function correctness)
- [ ] If Option B is chosen: install `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `vite-tsconfig-paths`; add a second Vitest project config (or per-file environment docblocks) so `config/**/*.test.ts` keeps running under `node` while new `components/**/*.test.tsx` files run under `jsdom`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | This phase has no auth surface — storefront is public, no login |
| V3 Session Management | No | No session state introduced this phase |
| V4 Access Control | No | No protected resources this phase |
| V5 Input Validation | Yes | Zod schemas for name/number (client-side this phase); **must be re-validated server-side in Phase 3** before any DB write or supplier notification — this phase's validation is a UX convenience, not a trust boundary |
| V6 Cryptography | No | No crypto/secrets touched this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Client-submitted price/quantity tampering (browser devtools editing cart state before "Gå til betaling") | Tampering | Not exploitable *in this phase* since no payment/order-creation happens yet — but this phase's cart data shape must not include a client-trusted price field, so Phase 3 is structurally forced to recompute server-side (PAY-03) rather than reading a submitted total |
| XSS via unsanitized name-print field rendered elsewhere (e.g., later in an admin panel or WhatsApp message) | Tampering / Information Disclosure | React's default JSX escaping handles this for any on-page rendering in this phase; Zod's character-class restriction (letters/spaces/hyphens only, no `<`, `>`, quotes) further reduces the field's usefulness as an injection vector for any downstream consumer (Phase 4's WhatsApp message, Phase 5's admin panel) |

## Sources

### Primary (HIGH confidence)
- Direct file reads: `config/leagues-teams-seasons.ts`, `config/pricing-tiers.ts`, `config/patches.ts`, `config/leagues-teams-seasons.test.ts`, `package.json`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/(admin)/admin/login/page.tsx`, `app/(admin)/admin/page.tsx` — confirmed exact existing shapes and conventions, this session
- `npm view <package> version / time.created / repository.url / scripts.postinstall` — confirmed for `lucide-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `zustand` — this session
- `slopcheck scan --pkg npm <package> --json` — all 8 packages returned `"status": "OK"`, no flags — this session
- Next.js official Vitest testing guide — https://nextjs.org/docs/app/guides/testing/vitest (fetched this session, `lastUpdated: 2026-02-11`) — confirms required packages, config shape, and the known limitation that Vitest doesn't support async Server Components
- Local Node verification of Zod 4.4.3 regex behavior (`\p{L}` Unicode property escape) against test strings "Müller"/"Åge-Sørensen"/"José"/"Şahin"/"Name123" — this session

### Secondary (MEDIUM confidence)
- MDN `<dialog>` Baseline support status, via WebSearch summary this session — https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- 2026 community consensus on zustand vs. Context for cart state in Next.js App Router — via WebSearch, cross-referenced across multiple 2026-dated sources (pronextjs.dev, dev.to) — used to inform the Alternatives Considered analysis, not as the basis for the final recommendation (which is derived from this project's own locked CONTEXT.md decisions instead)

### Tertiary (LOW confidence)
- None retained as authoritative claims — all WebSearch findings above were either cross-verified (MDN citation, official docs) or explicitly flagged as informing an alternatives comparison rather than a direct recommendation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against live npm registry and slopcheck this session; core stack (Next/React/Zod/Tailwind) already installed and confirmed via `package.json`
- Architecture: HIGH — cart-state recommendation is derived directly from this phase's own locked CONTEXT.md decisions (single page, single form, no cross-route requirement), not from general-purpose research alone
- Pitfalls: HIGH — every pitfall listed was either verified locally (Zod regex behavior, `config/leagues-teams-seasons.ts`'s actual shape) or is a direct consequence of an explicit UI-SPEC/CONTEXT.md requirement (whole-order pricing recompute, mutual exclusivity)

**Research date:** 2026-07-07
**Valid until:** 30 days (stable domain — no fast-moving external APIs involved in this phase; next research pass should re-verify only if Next.js/React/Zod major versions change before planning executes)
