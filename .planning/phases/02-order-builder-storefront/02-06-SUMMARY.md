---
phase: 02-order-builder-storefront
plan: 06
subsystem: ui
tags: [react, nextjs, cart, form, storefront, homepage]

# Dependency graph
requires:
  - phase: 02-order-builder-storefront
    plan: "02-01"
    provides: "CartProvider/useCart/useCartDispatch, CartItem/JerseySize types"
  - phase: 02-order-builder-storefront
    plan: "02-02"
    provides: "jerseyNameSchema/jerseyNumberSchema Zod validation contract"
  - phase: 02-order-builder-storefront
    plan: "02-03"
    provides: "LeagueTeamSelect, SeasonDisplay, SizeSelector, SizeGuideModal"
  - phase: 02-order-builder-storefront
    plan: "02-04"
    provides: "PatchCheckboxes, NameNumberFields"
  - phase: 02-order-builder-storefront
    plan: "02-05"
    provides: "CartPanel (onEditItem callback), OrderSummary, CartItemCard"
provides:
  - "components/storefront/configurator-form.tsx — ConfiguratorForm + EMPTY_DRAFT + DraftJersey (single-page form, draft-vs-cart separation, add/update dispatch)"
  - "components/storefront/checkout-explainer.tsx — CheckoutExplainer static PROD-07 copy"
  - "app/(storefront)/storefront-client.tsx — StorefrontClient client root (CartProvider + draft/editingId coordination)"
  - "app/(storefront)/page.tsx — storefront route shell, now the site homepage at '/'"
affects: ["02-07"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Draft-vs-cart separation (02-RESEARCH.md Pattern 3): ConfiguratorForm/StorefrontClient own a local DraftJersey, completely separate from the committed CartItem[] in Context; editingId toggles add vs update dispatch"
    - "crypto.randomUUID() called only inside the submit handler, never during render"

key-files:
  created:
    - components/storefront/configurator-form.tsx
    - components/storefront/checkout-explainer.tsx
    - app/(storefront)/storefront-client.tsx
    - app/(storefront)/page.tsx
  modified: []
  deleted:
    - app/page.tsx

key-decisions:
  - "SizeGuideModal trigger is placed via an absolutely-positioned wrapper (top-right of a relative container around SizeSelector) rather than modifying size-selector.tsx, since that file was out of this plan's file scope and already renders its own 'Størrelse' label internally"

patterns-established: []

requirements-completed: [PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-07]

# Metrics
duration: 12min
completed: 2026-07-08
---

# Phase 2 Plan 6: Configurator Form & Storefront Assembly Summary

**The walking-skeleton vertical slice: a single-page configurator form composing every Wave 2/3 field component with add/update dispatch, mounted as the site homepage alongside the cart panel — the complete configure-to-cart customer flow now works end-to-end at '/'.**

## Performance

- **Duration:** 12 min
- **Completed:** 2026-07-08T14:26:30Z
- **Tasks:** 2 completed
- **Files modified:** 5 (4 created, 1 deleted)

## Accomplishments
- `ConfiguratorForm` composes `LeagueTeamSelect → SeasonDisplay → SizeSelector`(+`SizeGuideModal`)`→ PatchCheckboxes → NameNumberFields` in the exact UI-SPEC order, driven entirely by a controlled `DraftJersey` draft object
- Submit is disabled until league, team, and size are all chosen; name/number are re-validated via `jerseyNameSchema`/`jerseyNumberSchema.safeParse` on submit (never trusting only the field component's own live validation), and the button label switches "Legg i handlekurv" ↔ "Oppdater" based on `editingId`
- `crypto.randomUUID()` is called exclusively inside the submit handler; existing `editingId` is reused for updates, `CURRENT_SEASON` is snapshotted onto the `CartItem` at submit time
- `CheckoutExplainer` renders the exact locked PROD-07 copy, no logic
- `StorefrontClient` mounts `CartProvider`, owns `draft`/`editingId` state, defines `itemToDraft()` for the "Rediger" edit path (D-12), and lays out the page hero + two-column (desktop) / stacked (mobile) layout with bottom safe-area padding so the mobile fixed cart bar never overlaps the form's own submit button
- `app/(storefront)/page.tsx` is a thin, non-async Server Component shell rendering `StorefrontClient`; `app/page.tsx` (the "kommer snart" placeholder) was deleted so `/` resolves to exactly one route

## Task Commits

Each task was committed atomically:

1. **Task 1: Checkout explainer + configurator form (compose fields, draft, add/update)** - `18fd6a4` (feat)
2. **Task 2: Client root + storefront route (homepage), remove placeholder page** - `06c71f8` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified
- `components/storefront/configurator-form.tsx` - `ConfiguratorForm`, `EMPTY_DRAFT`, `DraftJersey` type; composes all six field components; add/update dispatch via `useCartDispatch`
- `components/storefront/checkout-explainer.tsx` - `CheckoutExplainer`, static PROD-07 copy block
- `app/(storefront)/storefront-client.tsx` - `StorefrontClient`, `"use client"` root: `CartProvider` + `draft`/`editingId` state + `itemToDraft()` helper + two-column/stacked layout
- `app/(storefront)/page.tsx` - thin Server Component shell rendering `StorefrontClient`, now the homepage at `/`
- `app/page.tsx` - deleted (was the pre-Phase-2 "kommer snart" placeholder; both files resolved to `/`, so leaving both would be a duplicate-route build error)

## Decisions Made
- Since `size-selector.tsx` was outside this plan's file scope and already renders its own "Størrelse" label internally, the `SizeGuideModal` trigger was composed alongside it via a `relative`/`absolute` wrapper in `configurator-form.tsx` (top-right corner of the size-selector block) rather than modifying `size-selector.tsx` to accept a trigger slot — satisfies UI-SPEC's "inline next to the label" requirement without touching a file outside this plan's declared scope.

## Deviations from Plan

None - plan executed exactly as written. All four `must_haves.truths` and all four `must_haves.artifacts` are satisfied verbatim; no Rule 1-4 fixes were needed.

## Issues Encountered
None. `npx tsc --noEmit`, `npx eslint`, `npx next build`, and the full `npx vitest run` suite (41 tests across 11 files) all pass clean on the first pass after these changes.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- The "Gå til betaling" button (in `CartPanel`, from Plan 05) remains a deliberate no-op per UI-SPEC — Phase 3 wires the real Stripe/Vipps redirect. Not a new stub introduced by this plan; already tracked in Plan 05's SUMMARY.md.

No new stubs are introduced by this plan: the configurator form is fully wired to the cart dispatch, and the storefront route renders real component composition with no placeholder data paths.

## Threat Flags

None. Both threat register items for this plan (T-02-10 submit-time tampering, T-02-12 crypto.randomUUID during render) are mitigated exactly as designed: name/number are re-validated via the Zod schemas on submit before a `CartItem` is built, submit is disabled until required selections exist, and `crypto.randomUUID()` is called only inside the submit handler. T-02-11 (public unauthenticated storefront route) is accepted per the threat model — no auth surface is introduced.

## Next Phase Readiness
- The complete customer flow works end-to-end at `/`: configure a jersey across all fields (PROD-01..PROD-04), add it to the cart, see the live bundle-discounted total (PROD-05), edit an item in place (D-12), and read the post-payment explainer near the checkout CTA (PROD-07).
- `npx next build` succeeds with the storefront as the homepage and no duplicate-route error.
- Ready for Plan 07 (or Phase 3) to wire the "Gå til betaling" CTA to real payment integration.

---
*Phase: 02-order-builder-storefront*
*Completed: 2026-07-08*

## Self-Check: PASSED

All 4 created files (`components/storefront/configurator-form.tsx`, `components/storefront/checkout-explainer.tsx`, `app/(storefront)/storefront-client.tsx`, `app/(storefront)/page.tsx`) verified present on disk; `app/page.tsx` confirmed deleted. Both referenced commit hashes (18fd6a4, 06c71f8) verified present in `git log`.
