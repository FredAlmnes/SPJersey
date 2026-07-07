---
phase: 01-foundation-data-model
plan: 03
subsystem: config
tags: [pricing, catalog, config, vitest, tdd]

# Dependency graph
requires: ["01-01"]
provides:
  - "config/pricing-tiers.ts — client-and-server-importable whole-order bundle pricing (PRICING_TIERS, getUnitPriceOre, getOrderTotalOre)"
  - "config/leagues-teams-seasons.ts — static 5-league catalog with full rosters, national teams, single CURRENT_SEASON constant"
  - "config/patches.ts — fixed 4-option patch list (Ligamerke, Champions League, Europa/Conference League, Ingen), no price field"
affects: [phase-02, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["plain-TypeScript config modules with no server-only guard so pricing can be imported client-side (Phase 2) and server-side (Phase 3 authoritative recompute)"]

key-files:
  created:
    - config/pricing-tiers.ts
    - config/pricing-tiers.test.ts
    - config/leagues-teams-seasons.ts
    - config/leagues-teams-seasons.test.ts
    - config/patches.ts
    - config/patches.test.ts
  modified: []

key-decisions:
  - "Rosters authored fresh for the 2025/26 season for all 5 leagues (Premier League, Eliteserien, LaLiga, Serie A, Bundesliga) per D-01/D-02, referencing widely-known current-season club membership (promotions/relegations reflected, e.g. Leeds/Burnley/Sunderland up in the Premier League, Fredrikstad/Bryne/KFUM Oslo/Rakkestad in Eliteserien)."
  - "NATIONAL_TEAMS includes Norway plus 11 major football nations (Brazil, France, Germany, Spain, England, Argentina, Portugal, Netherlands, Italy, Belgium, Croatia) — exceeds the plan's minimum 6 named nations."
  - "CURRENT_SEASON kept as the sole exported season constant; Team interface intentionally has no season field, enforced by a test asserting no team object carries a `season` property (Pitfall 4)."

patterns-established:
  - "Pattern: config/*.ts — plain data + pure-function modules with zero `server-only` import, safe to import from both Client Components and Route Handlers. Reserve `server-only` guard exclusively for lib/supabase/service-role.ts-style privileged clients."

requirements-completed: [ADMIN-01]

# Metrics
duration: 15min
completed: 2026-07-07
---

# Phase 01 Plan 03: Pricing Tiers, Catalog & Patch List Summary

**Client-and-server-importable pricing/catalog/patch config modules (D-01..D-10), each locked by unit tests asserting the exact decision values, most notably the whole-order (not marginal) 3-jersey total of 870 NOK.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files created:** 6

## Accomplishments
- `config/pricing-tiers.ts` implements the verbatim PATTERNS.md excerpt: 3-tier bundle pricing (350/320/290 NOK per unit for qty 1/2/3+) with whole-order total math (`getOrderTotalOre(3) === 87000`, explicitly not the marginal 96000). No `server-only` import — verified importable from both client and server contexts (D-08).
- `config/leagues-teams-seasons.ts` defines the 5-league catalog (Premier League, Eliteserien, LaLiga, Serie A, Bundesliga) with full current-season rosters, a `NATIONAL_TEAMS` list (Norway + 11 major nations), and a single `CURRENT_SEASON = '2025/26'` constant referenced nowhere else per-team (Pitfall 4).
- `config/patches.ts` defines the fixed 4-option patch list (Ligamerke, Champions League-merke, Europa League/Conference League-merke, Ingen) with stable ids and Norwegian labels, no price field (D-10: included in base price).
- All three modules followed the plan-level TDD gate: RED (failing test committed) → GREEN (implementation committed) for both tasks.

## Task Commits

Each task followed RED → GREEN and was committed atomically:

1. **Task 1 RED: pricing-tiers failing test** - `2303146` (test)
2. **Task 1 GREEN: pricing-tiers implementation** - `7266e45` (feat)
3. **Task 2 RED: catalog + patches failing tests** - `07d0ce5` (test)
4. **Task 2 GREEN: catalog + patches implementation** - `2633598` (feat)

## Files Created/Modified
- `config/pricing-tiers.ts` - `PRICING_TIERS`, `getUnitPriceOre`, `getOrderTotalOre`; whole-order pricing per D-07
- `config/pricing-tiers.test.ts` - locks all D-05..D-08 values including the 87000 vs 96000 distinction and the qty-0 throw
- `config/leagues-teams-seasons.ts` - `CURRENT_SEASON`, `Team`, `League`, `LEAGUES` (5 leagues, full rosters), `NATIONAL_TEAMS`
- `config/leagues-teams-seasons.test.ts` - locks league count/names, non-empty rosters, national-team coverage, single-season-constant invariant
- `config/patches.ts` - `PATCHES` fixed list, no price field
- `config/patches.test.ts` - locks the 4 required options (Ligamerke, Champions League, Europa/Conference League, Ingen), unique ids, no price field

## Decisions Made
- Authored full 2025/26-season rosters fresh for all 5 leagues (no verbatim source existed for this data) rather than a curated subset, per D-02.
- Extended `NATIONAL_TEAMS` beyond the plan's minimum 6 nations to 12, since D-03 calls for "major football nations" generally and a slightly larger list better serves the storefront without added complexity.

## Deviations from Plan

None — plan executed exactly as written, including the TDD RED/GREEN gate sequence for both tasks.

## TDD Gate Compliance

Both tasks followed the RED → GREEN sequence with a `test(...)` commit strictly preceding its corresponding `feat(...)` commit:
- Task 1: `2303146` (test) → `7266e45` (feat)
- Task 2: `07d0ce5` (test) → `2633598` (feat)

No REFACTOR commits were needed — implementations matched the PATTERNS.md-specified/plan-specified shape on first pass.

## Issues Encountered

None.

## User Setup Required

None — these are static, loadable TypeScript modules with no external service configuration.

## Next Phase Readiness
- `config/pricing-tiers.ts`, `config/leagues-teams-seasons.ts`, and `config/patches.ts` are in place, typecheck clean (`npx tsc --noEmit`), and pass all unit tests (`npx vitest run config/*.test.ts` — 12/12 passing).
- Phase 1 success criterion #4 (static catalog + pricing-tier config defined and loadable) is satisfied.
- Phase 2 (storefront) can import `pricing-tiers.ts` from Client Components for a live order summary; Phase 3 (payment webhook) can import the same module server-side for authoritative recomputation, with no server-only barrier.

---
*Phase: 01-foundation-data-model*
*Completed: 2026-07-07*

## Self-Check: PASSED

All claimed files verified present (config/pricing-tiers.ts, config/pricing-tiers.test.ts, config/leagues-teams-seasons.ts, config/leagues-teams-seasons.test.ts, config/patches.ts, config/patches.test.ts) and all claimed commit hashes (2303146, 7266e45, 07d0ce5, 2633598) verified present in git log.
