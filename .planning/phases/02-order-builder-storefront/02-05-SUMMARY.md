---
phase: 02-order-builder-storefront
plan: 05
subsystem: ui
tags: [react, tailwind, lucide-react, cart, pricing]

# Dependency graph
requires:
  - phase: 02-order-builder-storefront
    provides: "Plan 01's cart Context (useCart/useCartDispatch, CartItem/CartAction) and Phase 1's config/pricing-tiers.ts single-source pricing functions"
provides:
  - "components/storefront/order-summary.tsx — OrderSummary: live whole-order bundle price display (PROD-05)"
  - "components/storefront/cart-item-card.tsx — CartItemCard: single cart line with Rediger/Fjern actions"
  - "components/storefront/cart-panel.tsx — CartPanel: responsive persistent panel, onEditItem callback, 5s undo-on-remove"
affects: ["02-06", "02-07"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Price is always recomputed live from config/pricing-tiers.ts by cart.length inside OrderSummary/CartPanel — never stored on CartItem (Pitfall 2 / T-02-08)"
    - "Cart line unit price is computed once per render in CartPanel and passed down as a prop to every CartItemCard, so all lines reflect the current whole-order tier"
    - "Transient inline undo state (local useState + setTimeout, cleared on unmount) instead of a confirmation dialog for low-stakes remove actions"

key-files:
  created:
    - components/storefront/order-summary.tsx
    - components/storefront/cart-item-card.tsx
    - components/storefront/cart-panel.tsx
  modified: []

key-decisions:
  - "CartPanel renders CartItemCard list only when cart.length > 0, and always renders OrderSummary (which owns its own empty-state copy) so the panel is visible from first load per D-16"

patterns-established:
  - "Panel-owned undo affordance: CartPanel (not CartItemCard) holds the removed-item snapshot and setTimeout handle, since Rediger/Fjern are pure callbacks passed from the panel"

requirements-completed: [PROD-05]

# Metrics
duration: 6min
completed: 2026-07-08
---

# Phase 2 Plan 5: Cart Panel & Live Order Summary Summary

**Responsive cart panel (sticky desktop / fixed-bottom mobile) composing a live whole-order-bundle price summary and per-item edit/remove cards with 5-second undo, all price math sourced solely from Phase 1's pricing module.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-08T14:14:00Z
- **Completed:** 2026-07-08T14:20:00Z
- **Tasks:** 3 completed
- **Files modified:** 3 (all created)

## Accomplishments
- Live order summary (PROD-05) that recomputes unit price/subtotal/total via `getUnitPriceOre`/`getOrderTotalOre(cart.length)` on every render, with the exact UI-SPEC empty-state and pricing-fallback copy
- Cart item card exposing `onEdit`/`onRemove` callbacks, resolving patch labels via `config/patches.ts`, with 44px destructive/edit icon buttons
- Persistent, responsive cart panel wiring `useCart`/`useCartDispatch`, a whole-cart-recomputed unit price passed to every card, a 5-second inline "Angre" undo (no confirmation dialog), and an enabled no-op "Gå til betaling" CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: Live order summary (price derived from cart length)** - `e680584` (feat)
2. **Task 2: Cart item card with edit/remove actions** - `8ce1307` (feat)
3. **Task 3: Responsive cart panel with 5-second undo-on-remove** - `7878f74` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified
- `components/storefront/order-summary.tsx` - Live price summary; guards pricing calls and renders UI-SPEC fallback copy on error; "Pakkerabatt aktivert" once quantity >= 2
- `components/storefront/cart-item-card.tsx` - Single cart line: team/season/size/patches/name-number display, unit price from props, Rediger/Fjern icon buttons
- `components/storefront/cart-panel.tsx` - Sticky desktop / fixed-bottom mobile panel; item-count badge; 5s "Angre" undo via local state + setTimeout; composes CartItemCard + OrderSummary; enabled no-op "Gå til betaling"

## Decisions Made
- Kept `CartPanel` as the sole owner of the removed-item snapshot and undo timer (rather than lifting it into `CartItemCard` or Context) since `CartItemCard` only receives pure `onRemove` callbacks per the plan's interface contract — this keeps the card a dumb presentational component and matches the interface declared in the plan.
- Rendered `CartItemCard` list conditionally (`cart.length > 0`) while always rendering `OrderSummary` underneath, so the panel shows the UI-SPEC empty-state copy (owned by `OrderSummary`) rather than duplicating empty-state text in the panel itself.

## Deviations from Plan

None - plan executed exactly as written. All four `must_haves.truths` and all three `must_haves.artifacts` are satisfied verbatim; no Rule 1-4 fixes were needed.

## Issues Encountered
None. `npx tsc --noEmit`, `npx eslint`, and the full `npx vitest run` suite (41 tests across 11 files) all pass clean after these changes.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- `cart-panel.tsx`'s "Gå til betaling" button has a deliberate no-op `onClick={() => {}}` handler. This is not a defect — it is explicitly required by the plan and UI-SPEC ("UI-only in Phase 2; Phase 3 wires the actual Stripe/Vipps redirect... do not add a 'coming soon' disabled state"). Phase 3 will wire the real handler.

## Threat Flags

None. Both threat register items (T-02-08 tampering, T-02-09 DoS) were explicitly mitigated per the plan: price is never persisted on `CartItem`, and `OrderSummary` guards its pricing calls with try/catch, falling back to the UI-SPEC error copy instead of throwing.

## Next Phase Readiness
- `CartPanel`'s `onEditItem` callback is ready for Plan 06 to wire to the configurator's draft state (D-12 edit flow).
- `order-summary.tsx`, `cart-item-card.tsx`, and `cart-panel.tsx` are all consumable as-is by Plan 06's `storefront-client.tsx` root composition alongside Plans 03/04's configurator components.
- No blockers for Plan 06.

---
*Phase: 02-order-builder-storefront*
*Completed: 2026-07-08*

## Self-Check: PASSED

All 3 created source files and the SUMMARY.md itself verified present on disk. All 3 referenced commit hashes (e680584, 8ce1307, 7878f74) verified present in git log.
