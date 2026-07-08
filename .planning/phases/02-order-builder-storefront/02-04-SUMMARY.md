---
phase: 02-order-builder-storefront
plan: 04
subsystem: ui
tags: [react, forms, zod, client-component, storefront]

# Dependency graph
requires:
  - phase: 02-order-builder-storefront
    plan: "02-01"
    provides: "togglePatch pure mutual-exclusivity function (lib/cart/patch-selection.ts)"
  - phase: 02-order-builder-storefront
    plan: "02-02"
    provides: "jerseyNameSchema / jerseyNumberSchema Zod validation contract"
provides:
  - "components/storefront/patch-checkboxes.tsx — PatchCheckboxes controlled component (PROD-03)"
  - "components/storefront/name-number-fields.tsx — NameNumberFields controlled component (PROD-04)"
affects: ["02-06 (configurator-form.tsx composition)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single togglePatch-routed onChange handler for chip/checkbox groups (no per-checkbox useState)"
    - "Live Zod safeParse on both onChange and onBlur, storing per-field error string in local useState, lifting raw string to parent draft regardless of validity"

key-files:
  created:
    - components/storefront/patch-checkboxes.tsx
    - components/storefront/name-number-fields.tsx
  modified: []

key-decisions:
  - "Matched Plan 03's size-selector.tsx established chip convention (min-h-11, font-semibold selected, emerald accent) for patch-checkboxes.tsx rather than inventing new styling, since both are sibling files in the same directory"
  - "Number input uses type=\"text\" with inputMode=\"numeric\" (not type=\"number\") so the raw string is never silently coerced by the browser before reaching the Zod schema, consistent with Pitfall 4"

patterns-established: []

requirements-completed: [PROD-03, PROD-04]

# Metrics
duration: 6min
completed: 2026-07-08
---

# Phase 2 Plan 4: Patch Checkboxes & Name/Number Fields Summary

**Two controlled "print details" form components — a patch chip group enforcing "Ingen" exclusivity via the tested togglePatch function, and live Zod-validated name/number inputs with a dual (border + text) destructive error signal.**

## Performance

- **Duration:** 6 min
- **Tasks:** 2 completed
- **Files modified:** 2 (both created)

## Accomplishments
- `PatchCheckboxes`: renders all four `PATCHES` entries (including "Ingen") from `config/patches.ts` as chip buttons; every click routes through a single `onChange(togglePatch(value, patch.id))` call — no independent per-checkbox state, so the "Ingen" mutual-exclusivity invariant from Plan 01's tested reducer can never be violated (PROD-03).
- `NameNumberFields`: two labeled optional inputs (name, number-as-string) that run `jerseyNameSchema`/`jerseyNumberSchema.safeParse` on every change and blur (D-23), storing a per-field error message in local state. Invalid input renders the schema's exact error copy below the field AND a destructive-color (`border-red-600`/`dark:border-red-400`) border on the input itself — the dual signal UI-SPEC requires. Empty input produces no error (D-22). The number field is `type="text"`/`inputMode="numeric"`, never relying on native `<input type="number">` min/max alone (Pitfall 4).
- Both components use `font-semibold` for emphasis and never `font-medium`, matching the phase's 2-weight typography rule; both use the emerald accent / destructive red tokens exactly as specified in 02-UI-SPEC.md.

## Task Commits

Each task was committed atomically:

1. **Task 1: Patch checkbox/chip group with "Ingen" exclusivity** - `b1202bd` (feat)
2. **Task 2: Live-validated print name/number inputs** - `e90452c` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified
- `components/storefront/patch-checkboxes.tsx` - `PatchCheckboxes({ value, onChange })`, maps `PATCHES` to chip buttons, single `togglePatch`-routed handler, 44px touch targets (`min-h-11`)
- `components/storefront/name-number-fields.tsx` - `NameNumberFields({ name, number, onNameChange, onNumberChange })`, live `safeParse` validation on change/blur, dual error signal (border + text), number kept as untrusted draft string

## Decisions Made
- Followed Plan 03's `size-selector.tsx` chip styling convention (`min-h-11`, `border-emerald-600 bg-emerald-600 text-white` selected / `border-zinc-300` unselected, `font-semibold` on the button label) for `patch-checkboxes.tsx` verbatim, since it is the closest real sibling-file precedent already in the repo for a chip/button-group control, and it satisfies every UI-SPEC constraint (accent, touch target, weight discipline) without introducing a second competing chip style.
- Used `type="text"` + `inputMode="numeric"` for the number field instead of `type="number"`, per Pitfall 4 — this keeps the raw value a plain string that flows straight into `jerseyNumberSchema.safeParse` with zero browser-side coercion to fight against.

## Deviations from Plan

None - plan executed exactly as written. All three `must_haves.truths` and both `must_haves.artifacts` are satisfied verbatim; no Rule 1-4 fixes were needed.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Both components are fully wired controlled components with no placeholder data paths — they read live config (`PATCHES`) and live validation schemas, and lift every keystroke to the parent via the props contract. The parent's default `patchIds: ["ingen"]` seeding and draft-state wiring belongs to Plan 06 (`configurator-form.tsx`), as documented in the plan's interface contract — not a stub, an explicit out-of-scope boundary for this plan.

## Threat Flags

None. Both threats in this plan's `<threat_model>` (T-02-06 print-field tampering, T-02-07 patch-selection tampering) are fully mitigated as designed: every keystroke is Zod-validated before being lifted to the parent draft, and every patch toggle routes exclusively through the pure `togglePatch` function. No new security-relevant surface was introduced beyond what the threat register already anticipated.

## Next Phase Readiness
- `PatchCheckboxes` and `NameNumberFields` are ready for Plan 06's `configurator-form.tsx` to compose directly via their documented prop contracts (`PatchCheckboxesProps`, `NameNumberFieldsProps`).
- No blockers for the next plan.

---
*Phase: 02-order-builder-storefront*
*Completed: 2026-07-08*

## Self-Check: PASSED

- FOUND: components/storefront/patch-checkboxes.tsx
- FOUND: components/storefront/name-number-fields.tsx
- FOUND: b1202bd (Task 1 commit)
- FOUND: e90452c (Task 2 commit)
