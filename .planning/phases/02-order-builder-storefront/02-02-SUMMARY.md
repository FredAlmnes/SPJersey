---
phase: 02-order-builder-storefront
plan: 02
subsystem: validation
tags: [zod, unicode, form-validation, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-data-model
    provides: TypeScript/Zod conventions, vitest node-environment test setup
provides:
  - "jerseyNameSchema / jerseyNumberSchema Zod contract for the print name/number fields (PROD-04)"
affects: [02-order-builder-storefront (Plan 04 name-number-fields component), 03-payments (server-side re-validation)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Regex-then-refine on raw string input (not z.coerce.number()) for numeric fields where wrong coercion is a real production error"
    - "\\p{L} Unicode property escape (with u flag) for international-letter name validation instead of hardcoded diacritic character classes"

key-files:
  created: [lib/validation/jersey-schema.ts, lib/validation/jersey-schema.test.ts]
  modified: []

key-decisions:
  - "Used RESEARCH.md's locally-verified Zod code example verbatim, since no prior Zod usage exists anywhere in the codebase to pattern-match against"

patterns-established:
  - "Validation error copy is sourced verbatim from 02-UI-SPEC.md's Copywriting Contract, never re-worded by the implementer"

requirements-completed: [PROD-04]

# Metrics
duration: 4min
completed: 2026-07-08
---

# Phase 2 Plan 2: Jersey Name/Number Validation Schemas Summary

**Zod schemas for jersey print name (12-char max, `\p{L}` Unicode letters + space/hyphen) and print number (regex-then-refine integer 0-99), both optional, with error copy locked to the UI-SPEC contract**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-08T15:58:00Z
- **Completed:** 2026-07-08T16:02:11Z
- **Tasks:** 1 completed
- **Files modified:** 2

## Accomplishments
- `jerseyNameSchema`: max 12 chars, accepts any Unicode letter (verified against Müller/José/Şahin/Åge-Sørensen) plus spaces/hyphens, rejects digits/symbols, empty string always valid (D-20, D-22)
- `jerseyNumberSchema`: accepts integer strings 0-99 via regex-then-refine (never `z.coerce.number()`), rejects decimals/negatives/out-of-range/non-numeric, empty string always valid (D-21, D-22)
- Both schemas emit the exact UI-SPEC Copywriting Contract error strings on failure — verified by direct string-equality assertion in tests

## Task Commits

TDD task, three-stage commit sequence:

1. **RED** - `2f3c713` (test): failing tests for jersey name/number validation schemas
2. **GREEN** - `1a9ea3a` (feat): implement jersey name/number validation schemas

No refactor commit needed — implementation matched the RESEARCH.md-verified pattern on the first pass.

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `lib/validation/jersey-schema.ts` - Exports `jerseyNameSchema` and `jerseyNumberSchema`, the tested Zod validation contract for PROD-04
- `lib/validation/jersey-schema.test.ts` - Vitest coverage of every `<behavior>` bullet from the plan, including exact error-message equality checks

## Decisions Made
None beyond what CONTEXT.md/RESEARCH.md already locked — implementation followed the RESEARCH.md Code Example verbatim since it was already locally verified against the installed Zod 4.4.3 version.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The validation contract is ready for Plan 04's `name-number-fields.tsx` component to consume via `.safeParse(value)` for live on-blur/on-change feedback (D-23)
- Ready for Phase 3 to re-import and re-validate server-side before any DB write or supplier WhatsApp send (defense-in-depth, ASVS V5 — this phase's validation is client-side UX convenience only)
- No blockers

---
*Phase: 02-order-builder-storefront*
*Completed: 2026-07-08*

## Self-Check: PASSED

- FOUND: lib/validation/jersey-schema.ts
- FOUND: lib/validation/jersey-schema.test.ts
- FOUND: 2f3c713 (test commit)
- FOUND: 1a9ea3a (feat commit)
