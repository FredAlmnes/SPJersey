---
phase: 02-order-builder-storefront
plan: 01
subsystem: ui
tags: [react, useReducer, context, vitest, tdd, cart, zod-adjacent]

# Dependency graph
requires:
  - phase: 01-foundation-data-model
    provides: "config/leagues-teams-seasons.ts, config/patches.ts, config/pricing-tiers.ts (catalog + pricing single sources of truth)"
provides:
  - "lib/cart/cart-types.ts — CartItem/CartAction/CartState/JerseySize contract (no price field)"
  - "lib/cart/cart-reducer.ts — pure cartReducer(add/update/remove)"
  - "lib/cart/cart-context.tsx — CartProvider + useCart + useCartDispatch"
  - "lib/cart/team-options.ts — getTeamOptions cascading league/Landslag derivation"
  - "lib/cart/patch-selection.ts — togglePatch 'ingen' mutual-exclusivity"
  - "package.json test script + vitest.config.ts lib/**/*.test.ts glob + lucide-react dependency"
affects: ["02-02", "02-03", "02-04", "02-05", "02-06", "02-07"]

# Tech tracking
tech-stack:
  added: [lucide-react@1.23.x]
  patterns:
    - "Page-scoped React Context (not global store) with split state/dispatch contexts for cart"
    - "Pure, framework-free lib/cart/*.ts modules unit-tested under existing Vitest node environment"
    - "TDD RED/GREEN commit pairs for each behavioral unit (reducer, then team-options+patch-selection)"

key-files:
  created:
    - lib/cart/cart-types.ts
    - lib/cart/cart-reducer.ts
    - lib/cart/cart-reducer.test.ts
    - lib/cart/cart-context.tsx
    - lib/cart/team-options.ts
    - lib/cart/team-options.test.ts
    - lib/cart/patch-selection.ts
    - lib/cart/patch-selection.test.ts
  modified:
    - package.json
    - vitest.config.ts

key-decisions:
  - "Placed 'use client' as the literal first line of cart-context.tsx, header comment after — matches Next.js directive convention and the plan's explicit acceptance criteria over the general repo header-comment-first convention"

patterns-established:
  - "Cart state lives in useReducer + page-scoped Context (not zustand, not a global store) — matches D-13/D-14/D-16 single-page cart requirement"
  - "CartItem carries no price field ever; price is always derived live from config/pricing-tiers.ts by cart.length (Pitfall 2 / Phase 3 handoff safety)"

requirements-completed: [PROD-01, PROD-03, PROD-05]

# Metrics
duration: 5min
completed: 2026-07-08
---

# Phase 2 Plan 1: Cart Core & Catalog Derivation Summary

**Pure, unit-tested cart reducer + page-scoped React Context, plus cascading team-derivation and patch mutual-exclusivity helpers — the tested behavioral core every Wave 2/3 storefront component will import.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-08T13:50:40Z
- **Completed:** 2026-07-08T13:55:35Z
- **Tasks:** 3 completed
- **Files modified:** 10 (2 modified, 8 created)

## Accomplishments
- Test infrastructure closed: `npm test` script, `lib/**/*.test.ts` Vitest glob, `lucide-react` installed
- Tested pure cart core: `cartReducer` (add/update/remove, no mutation, new array reference) + `CartProvider`/`useCart`/`useCartDispatch` Context wiring
- Tested cascading catalog derivation (`getTeamOptions`) and patch mutual-exclusivity (`togglePatch`) — the exact algorithms PROD-01 and PROD-03 depend on
- Full TDD RED→GREEN commit pairs for both behavioral tasks, verified against the plan's `<behavior>` blocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Test infra — test script, Vitest include, lucide-react dependency** - `37919a7` (chore)
2. **Task 2: Cart types + reducer + Context (with tests)** - `aca07fd` (test/RED) → `2ca47f9` (feat/GREEN)
3. **Task 3: Cascading team-options + patch mutual-exclusivity (with tests)** - `1577515` (test/RED) → `7037cdb` (feat/GREEN)

**Plan metadata:** committed separately after this summary.

## TDD Gate Compliance

Both TDD tasks followed the mandatory RED → GREEN sequence, verified in git log:

- Task 2: `aca07fd test(02-01): add failing tests for cart reducer and types` → `2ca47f9 feat(02-01): implement cart reducer and page-scoped Context`. RED confirmed via `Cannot find module './cart-reducer'` failure before implementation existed.
- Task 3: `1577515 test(02-01): add failing tests for team-options and patch-selection` → `7037cdb feat(02-01): implement cascading team-options and patch mutual-exclusivity`. RED confirmed via `Cannot find module` failures for both `./team-options` and `./patch-selection` before implementation existed.

No REFACTOR commits were needed — GREEN implementations matched the RESEARCH.md-verified patterns on the first pass with no cleanup required.

## Files Created/Modified
- `package.json` - added `"test": "vitest run"` script and `lucide-react` dependency
- `vitest.config.ts` - extended `test.include` with `"lib/**/*.test.ts"`
- `lib/cart/cart-types.ts` - `CartItem`/`CartAction`/`CartState`/`JerseySize` contract, no price field (Pitfall 2)
- `lib/cart/cart-reducer.ts` - pure `cartReducer(state, action)`, no React import
- `lib/cart/cart-reducer.test.ts` - add/update/remove/no-op-remove/no-mutation assertions
- `lib/cart/cart-context.tsx` - `"use client"` `CartProvider` + `useCart`/`useCartDispatch`, split state/dispatch contexts
- `lib/cart/team-options.ts` - `getTeamOptions(leagueOrNationalId)` cascading derivation, `LANDSLAG_ID` constant
- `lib/cart/team-options.test.ts` - null/unknown/Landslag/Premier-League assertions
- `lib/cart/patch-selection.ts` - `togglePatch(current, clickedId)` 'ingen' mutual-exclusivity
- `lib/cart/patch-selection.test.ts` - all four behavior-block assertions

## Decisions Made
- Ordered `cart-context.tsx` with `"use client"` as the literal first line (header comment follows), rather than header-comment-first as PATTERNS.md's general convention suggests — the plan's own acceptance criteria explicitly requires the file to "begin with `use client`", and this also matches Next.js's directive-must-be-first convention seen in `app/(admin)/admin/login/page.tsx`.

## Deviations from Plan

None - plan executed exactly as written. All five `must_haves.truths` and all five `must_haves.artifacts` are satisfied verbatim; no Rule 1-4 fixes were needed.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. This plan delivers pure logic modules with no rendered UI and no placeholder data paths — nothing to stub.

## Next Phase Readiness
- `lib/cart/*` contract (types, reducer, Context, team-options, patch-selection) is fully tested and ready for Wave 2/3 UI components (`configurator-form.tsx`, `cart-panel.tsx`, `league-team-select.tsx`, `patch-checkboxes.tsx`, etc.) to import without further exploration.
- `lucide-react` is installed and available for icon usage in upcoming UI plans.
- No blockers for the next plan in Wave 1/2.

---
*Phase: 02-order-builder-storefront*
*Completed: 2026-07-08*

## Self-Check: PASSED

All 8 created source files and the SUMMARY.md itself verified present on disk. All 6 referenced commit hashes (37919a7, aca07fd, 2ca47f9, 1577515, 7037cdb, 2124619) verified present in git log.
