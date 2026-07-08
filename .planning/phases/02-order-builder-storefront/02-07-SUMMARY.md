---
phase: 02-order-builder-storefront
plan: 07
subsystem: ui
tags: [nextjs, react, vitest, manual-verification]

requires:
  - phase: 02-order-builder-storefront
    provides: assembled configurator form and storefront homepage (Plan 06)
provides:
  - Human-confirmed end-to-end storefront flow (configure -> add -> live total -> edit -> checkout CTA)
  - Gap-closure fix: patch selection is now fully mutually exclusive
affects: [phase-03-payments]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - lib/cart/patch-selection.ts
    - lib/cart/patch-selection.test.ts

key-decisions:
  - "Patch checkboxes are single-select (radio-like), not multi-select: a real jersey carries at most one competition patch, so selecting any patch (including 'ingen') now replaces the current selection entirely."

patterns-established: []

requirements-completed: [PROD-02, PROD-05, PROD-06, PROD-07]

duration: 25min
completed: 2026-07-08
---

# Phase 2 Plan 07: Manual Storefront Verification Summary

**Human walkthrough of the full storefront flow found and closed one gap: patch selection allowed multiple real patches (e.g. Ligamerke + Champions League) simultaneously, which is invalid on a real jersey — now fully single-select.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2/2 (automated pre-checks + human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Confirmed `npm test` (41/41) and `npx next build` both green before handing off to manual verification
- Ran the full 10-step browser walkthrough (league/team cascading select, size selector + size-guide modal, patch group, name/number live validation, bundle pricing at 350/640/870 kr, edit-in-place, 5s undo-on-remove, checkout explainer, mobile responsive cart panel)
- Found and fixed a real gap: `togglePatch` allowed multiple real patches selected at once; fixed to make all patch options (including "ingen") mutually exclusive
- Re-verified the fix live via hot reload; owner approved the full checklist on second pass

## Task Commits

1. **Task 1: Automated pre-checks (test + build + dev server)** - no commit (verification-only, no file changes)
2. **Task 2: Human-verify checkpoint** - gap-closure commit `0cb52d1` (fix)

## Files Created/Modified
- `lib/cart/patch-selection.ts` - `togglePatch` now returns a single-element array for every click; selecting an already-selected patch falls back to `["ingen"]`
- `lib/cart/patch-selection.test.ts` - replaced the "adds another real patch alongside an existing one" test with one asserting the new patch replaces the old one

## Decisions Made
- Patches are mutually exclusive (single-select), overriding the original Plan 01/02-CONTEXT reading of D-09 ("checkbox, single or multi-select as appropriate") in favor of the owner's real-world constraint that a jersey carries at most one competition patch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Gap found during human-verify] Patch selection allowed multiple real patches**
- **Found during:** Task 2 (human-verify checkpoint, step 4 of the walkthrough)
- **Issue:** `togglePatch` only enforced "ingen" mutual exclusivity; two or more real patches (e.g. Ligamerke + Champions League-merke) could be selected together, which isn't valid on a real jersey
- **Fix:** Simplified `togglePatch` to single-select: `current.includes(clickedId) ? ["ingen"] : [clickedId]`
- **Files modified:** `lib/cart/patch-selection.ts`, `lib/cart/patch-selection.test.ts`
- **Verification:** Full suite (41/41) and `tsc --noEmit` green; owner re-verified live via dev server hot reload and approved
- **Committed in:** `0cb52d1` (fix)

---

**Total deviations:** 1 auto-fixed (product-behavior gap caught by manual verification)
**Impact on plan:** Necessary correctness fix caught exactly by the Option A manual-only verification this plan exists to run. No scope creep — `patch-checkboxes.tsx` needed no changes since it already delegated all logic to `togglePatch`.

## Issues Encountered
None beyond the patch-selection gap above, which was fixed and re-verified within this checkpoint.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 2 storefront is complete and human-verified end-to-end. The cart data shape (jerseys + total price) is ready for Phase 3 to read when creating the Stripe/Vipps Checkout Session. No blockers.

---
*Phase: 02-order-builder-storefront*
*Completed: 2026-07-08*
