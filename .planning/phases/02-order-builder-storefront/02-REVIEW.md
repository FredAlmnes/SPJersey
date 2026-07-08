---
phase: 02-order-builder-storefront
reviewed: 2026-07-08T14:48:09Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - app/(storefront)/page.tsx
  - app/(storefront)/storefront-client.tsx
  - app/page.tsx (deleted)
  - components/storefront/cart-item-card.tsx
  - components/storefront/cart-panel.tsx
  - components/storefront/checkout-explainer.tsx
  - components/storefront/configurator-form.tsx
  - components/storefront/league-team-select.tsx
  - components/storefront/name-number-fields.tsx
  - components/storefront/order-summary.tsx
  - components/storefront/patch-checkboxes.tsx
  - components/storefront/season-display.tsx
  - components/storefront/size-guide-modal.tsx
  - components/storefront/size-selector.tsx
  - lib/cart/cart-context.tsx
  - lib/cart/cart-reducer.ts
  - lib/cart/cart-reducer.test.ts
  - lib/cart/cart-types.ts
  - lib/cart/patch-selection.ts
  - lib/cart/patch-selection.test.ts
  - lib/cart/team-options.ts
  - lib/cart/team-options.test.ts
  - lib/validation/jersey-schema.ts
  - lib/validation/jersey-schema.test.ts
  - package.json
  - package-lock.json
  - vitest.config.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-07-08T14:48:09Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Phase 2's storefront (cascading league/team/season selection, size selector + size-guide modal, patch chips, live-validated name/number fields, cart Context/reducer, cart panel, live order summary) is well-tested at the pure-logic layer (cart reducer, team-options, patch-selection, Zod schemas all have unit tests) and generally follows the locked architecture from RESEARCH.md/UI-SPEC.md: no price is ever persisted on `CartItem`, pricing math is always imported from `config/pricing-tiers.ts`, patch mutual-exclusivity and Unicode-aware name validation are implemented as prescribed, and `crypto.randomUUID()` is only called inside the submit handler.

However, two real correctness/UX defects were found by tracing state across files: (1) the mobile cart panel does not implement the UI-SPEC's mandated collapsed-bar/expand-to-sheet behavior and, combined with a hardcoded safe-area padding value, can visually cover the configurator's own submit button on phones; and (2) editing a cart item whose underlying row gets removed (deliberately or via undo-timeout) silently discards the edit on "Oppdater" with no error shown to the customer, because the cart reducer's `update` action is a silent no-op when the target `id` no longer exists and the caller never checks. Several smaller validation/accessibility/test-quality gaps are listed below as warnings and info.

## Critical Issues

### CR-01: Mobile cart panel does not implement the required collapsed bar and can cover the form's submit button

**File:** `components/storefront/cart-panel.tsx:60`, `app/(storefront)/storefront-client.tsx:52`

**Issue:** 02-UI-SPEC.md's Component & Interaction Notes require, on mobile (`<lg`): "cart panel collapses to a fixed bottom bar ... showing item count badge + running total + a chevron/handle to expand into a full-height bottom sheet. Bottom bar must not overlap the form's own CTA button — reserve safe-area padding at the bottom of the scrollable form content equal to the bottom bar's height."

The shipped implementation has no collapsed/expanded state at all. `CartPanel` always renders its full content — heading, item-count badge, the undo banner, every `CartItemCard`, `OrderSummary`, and the "Gå til betaling" button — inside a `fixed inset-x-0 bottom-0 ... max-h-[70vh] overflow-y-auto` container on mobile. There is no chevron/handle and no compact "badge + total only" state.

Separately, `StorefrontClient` reserves a *fixed* `pb-32` (128px) safe-area at the bottom of the scrollable form content, on the assumption that the mobile bar is a small, constant-height strip. But the actual panel height is content-driven and can grow up to `70vh` (e.g., ~560px on an 800px-tall phone viewport) as soon as the cart has one or more items with any name/number/patches populated. Once the panel's real height exceeds 128px — which will happen for almost any non-empty cart — it physically overlaps and hides the configurator form's own "Legg i handlekurv" submit button and other form content behind the fixed panel, on any real device.

This is both a locked UI-SPEC contract violation and a functional bug that blocks the core "add to cart" flow on mobile once at least one jersey has been configured.

**Fix:** Implement a real collapsed/expanded toggle state in `CartPanel` (e.g. `useState<boolean>` for `expanded`), rendering only the item-count badge + running total + a chevron button when collapsed (matching the UI-SPEC's bar), and the full item list/summary/CTA only when expanded (or always on `lg+`). Size the reserved safe-area padding in `storefront-client.tsx` to the actual collapsed-bar height (e.g. a fixed, small height class shared between both files as a constant), not a guessed 128px that has no relationship to the panel's real rendered size.

### CR-02: Editing a removed cart item silently discards the edit (no error, false success)

**File:** `lib/cart/cart-reducer.ts:10-11`, `app/(storefront)/storefront-client.tsx:33-45`, `components/storefront/cart-panel.tsx:39-47`, `components/storefront/configurator-form.tsx:104-110`

**Issue:** `cartReducer`'s `update` case does `state.map((item) => (item.id === action.id ? action.item : item))` — if no item in `state` matches `action.id`, this returns a *new array reference containing the exact same items*, silently dropping the update with no error and no indication of failure.

`StorefrontClient` owns `editingId`, and `ConfiguratorForm.handleSubmit` dispatches `{ type: "update", id: editingId, item }` whenever `editingId` is non-null, then unconditionally calls `onSubmitDone()` (which clears `editingId` and resets the draft) regardless of whether the dispatched update actually matched anything in the cart.

`CartPanel.handleRemove` (which dispatches `{ type: "remove", id: item.id }`) has no awareness of `editingId` and never notifies `StorefrontClient` to clear it. This means the following ordinary (non-adversarial) customer flow silently loses data:
1. Customer clicks "Rediger" on a cart item → form is populated, `editingId` is set to that item's id.
2. Customer clicks "Fjern" on that same item (or any item, if they get confused about which line is open) — dispatches `remove`, item leaves the cart (visually replaced by the 5s "Angre" banner).
3. Customer keeps editing fields in the still-open form, and either lets the 5-second undo window expire or dismisses it, then clicks "Oppdater".
4. `dispatch({ type: "update", id: editingId, item })` is a no-op (no matching id in state) — the customer's edited jersey is never added back to the cart.
5. `onSubmitDone()` still fires, clearing `editingId` and resetting the form to `EMPTY_DRAFT` as if the update succeeded. The customer sees the form clear and has no reason to believe their jersey was lost.

**Fix:** Either (a) make `cartReducer`'s `update` case fall back to appending the item when no existing id matches (self-healing), or (b) — preferable, since (a) can mask other bugs — lift removal through `StorefrontClient` (pass an `onRemoveItem` callback into `CartPanel` instead of letting it dispatch directly) so that removing the item currently being edited also clears `editingId`/resets the draft, and/or disable the "Fjern" action on a card while it is the one currently open for editing.

## Warnings

### WR-01: Submitting the configurator form with an invalid name/number is a silent no-op

**File:** `components/storefront/configurator-form.tsx:66-86`

**Issue:** `canSubmit` (which gates the submit button's `disabled` state) only checks `leagueId`/`teamId`/`size` — it does not consider whether the name/number fields currently hold invalid values. `handleSubmit` re-validates name/number via `safeParse` and, on failure, simply `return`s with no dispatch and no user-facing feedback beyond whatever `NameNumberFields`' own local error state already happened to be showing. If the customer has scrolled the invalid field out of view, or the field currently shows no error because they haven't blurred/changed it since editing another field, clicking "Legg i handlekurv" appears to do nothing at all.

**Fix:** Track field validity in the parent (or expose a `hasErrors` callback from `NameNumberFields`) and disable the submit button when name/number are invalid, or scroll/focus the first invalid field and surface a summary error on failed submit.

### WR-02: "Angre" (undo) re-adds the item at the end of the cart, not its original position

**File:** `components/storefront/cart-panel.tsx:49-57`

**Issue:** `handleUndo` dispatches `{ type: "add", item: pendingRemoval }`, and `cartReducer`'s `add` case always appends (`[...state, action.item]`). If a customer removes the second item of three and then clicks "Angre", the restored item reappears at the end of the list instead of its original middle position — a surprising result for an "undo" action that implies exact restoration.

**Fix:** Either use an `update`-style reducer action that re-inserts at a stored index, or accept this as a known/documented simplification if position stability isn't considered important for the product.

### WR-03: Live validation errors are not exposed to assistive technology

**File:** `components/storefront/name-number-fields.tsx:54-89`

**Issue:** D-23 requires live validation feedback, and the UI-SPEC requires a visible error message + red border. Neither the error `<p>` elements nor the `<input>` elements carry `aria-invalid`, `aria-describedby`, or `role="alert"`/`aria-live`. A screen-reader user typing an invalid name/number gets no announcement that an error appeared or changed — the only feedback is visual.

**Fix:** Add `aria-invalid={nameError !== null}` and `aria-describedby` (pointing at the error `<p>`'s `id`) to each input, and mark the error `<p>` with `role="alert"` (or wrap in an `aria-live="polite"` region) so assistive tech users get the same "live" feedback sighted users do.

### WR-04: Zod schema test for max-length doesn't actually isolate the length check

**File:** `lib/validation/jersey-schema.test.ts:22-24`

**Issue:** The test "rejects strings over 12 characters (D-20)" uses the string `"Toolongname12"`, which contains the digits `1` and `2` at the end. This string fails `jerseyNameSchema` because of the `\p{L}` character-class regex (digits aren't letters), not necessarily because of the `.max(12)` check — `safeParse(...).success` is `false` either way, so the test passes regardless of which validator actually rejected it. A regression that silently removed or widened the `.max(12)` constraint (while the character-class check remained) would not be caught by this test.

**Fix:** Add (or replace with) a test using a pure-letter 13+ character string, e.g. `"Abcdefghijklm"`, to isolate and actually exercise the length constraint.

## Info

### IN-01: `formatOre` is duplicated between `order-summary.tsx` and `cart-item-card.tsx`

**File:** `components/storefront/order-summary.tsx:14-18`, `components/storefront/cart-item-card.tsx:19-21`

**Issue:** Both components independently define an identical `formatOre(ore: number): string` helper. Small today, but a future change to price formatting (currency symbol, thousands separator, etc.) would require remembering to update it in two places.

**Fix:** Extract to a shared `lib/format-price.ts` (or similar) and import it from both components.

### IN-02: `jerseyNameSchema`'s `.optional().or(z.literal(""))` suffix is redundant

**File:** `lib/validation/jersey-schema.ts:14-20`

**Issue:** The regex `/^[\p{L}\s-]*$/u` already uses `*` (zero-or-more), so an empty string already satisfies both `.max(12)` and the regex on its own — the trailing `.optional().or(z.literal(""))` is dead weight that adds no additional accepted values but does add a `string | undefined` union to the inferred output type, which could confuse a future consumer of this schema's inferred type.

**Fix:** Simplify to just the `.string().trim().max(12, ...).regex(..., ...)` chain, or keep the current form but add a comment noting it's intentionally defensive/vestigial from the original RESEARCH.md code example.

### IN-03: Name validation may reject legitimately valid decomposed-Unicode input

**File:** `lib/validation/jersey-schema.ts:18`

**Issue:** `\p{L}` matches Unicode category "Letter" but not combining marks (category `Mn`), which some accented characters decompose into under NFD normalization (e.g., certain macOS clipboard/file-system sources produce NFD text where "é" is `e` + a separate combining acute-accent codepoint). Input arriving in decomposed form could fail the regex even though it's a legitimate name, despite passing for the same visual character typed directly via a composed-form IME/keyboard.

**Fix:** Call `.trim().normalize("NFC")` (via a `.transform()`) before applying the regex, to normalize decomposed input to its composed form first. Low priority given this is a narrow input-source edge case, but cheap to fix.

---

_Reviewed: 2026-07-08T14:48:09Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
