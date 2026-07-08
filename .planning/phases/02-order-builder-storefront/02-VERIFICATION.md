---
phase: 02-order-builder-storefront
verified: 2026-07-08T17:10:00Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Resize browser to a mobile width (<1024px) after CR-01's fix (commit 1dff826). Add at least one jersey to the cart. Confirm the cart collapses to a fixed bottom bar showing item count + total + chevron, that tapping it expands to a full bottom sheet, and that the collapsed bar never covers the configurator form's own 'Legg i handlekurv' submit button at any scroll position."
    expected: "Collapsed bar is a fixed h-16 (~64px) strip; expanding/collapsing works via the chevron; the form's submit button is always fully visible and clickable, never hidden behind the bar."
    why_human: "This is a responsive/visual layout fix (CR-01) applied AFTER the Wave-4 human-verify checkpoint (02-07) already closed. Code review's 're-verified live via dev server' note documents the reviewer's own check, not an independent human confirmation on a real/emulated mobile viewport — visual layout correctness cannot be fully confirmed by reading Tailwind classes alone."
  - test: "Click 'Rediger' on a cart item to open it for editing, then click 'Fjern' on that same item (or let its 5s 'Angre' undo window lapse without clicking it) while the form is still showing that item's data. Then click 'Oppdater'."
    expected: "Per the CR-02 fix, removing the item currently open for editing should reset the form to empty ('Legg i handlekurv' state) rather than leaving stale data in a form whose 'Oppdater' would silently no-op. Confirm no data is lost silently and the form's state make sense to a customer (no confusing 'Oppdater' on a phantom item)."
    why_human: "CR-02 (silent data loss on edit-then-remove) was found by static code review, not exercised by a human in a browser, and its fix was likewise never walked through by the owner after the original 02-07 checkpoint closed. This is exactly the kind of interactive, stateful UI behavior that grep/code-reading can trace but not experientially confirm."
gaps: []
---

# Phase 2: Order Builder & Storefront — Verification Report

**Phase Goal:** A customer can configure and preview a complete custom-jersey order end-to-end before paying
**Verified:** 2026-07-08T17:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Process Note (MVP mode goal format)

Phase 2 is marked `mode: mvp` in ROADMAP.md, but its goal ("A customer can configure and preview a complete custom-jersey order end-to-end before paying") is not in the `As a [role], I want to [capability], so that [outcome].` format required for the MVP-mode User-Flow-Coverage framing (confirmed via `gsd-sdk query user-story.validate`, `valid: false`). The same discrepancy exists for Phase 1's goal, and Phase 1's own `01-VERIFICATION.md` proceeded with the standard goal-backward format rather than refusing — this report follows that established precedent for consistency rather than blocking on a roadmap-authoring convention that predates the mvp-phase user-story convention. Recommend running `/gsd mvp-phase 2` (and Phase 1) to backfill proper user-story goals if the team wants the narrower MVP UAT framing going forward; this is process hygiene, not a phase-goal defect, and does not gate this report's status.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Customer can pick league, team, and season from a structured set of major leagues and well-known national teams (Roadmap SC1 / PROD-01) | ✓ VERIFIED | `components/storefront/league-team-select.tsx` renders `LEAGUES` + synthetic `Landslag` option in the first select; second select derives options via `getTeamOptions(leagueId)` (`lib/cart/team-options.ts`, unit-tested: Premier League → 20 teams incl. Arsenal, Landslag → NATIONAL_TEAMS incl. Norge, null/unknown → `[]`); `season-display.tsx` renders read-only `CURRENT_SEASON` from `config/leagues-teams-seasons.ts`, only shown once `draft.teamId !== null` (`configurator-form.tsx:135`) |
| 2 | Customer can select a size, with a size guide/fit chart available at the point of selection (Roadmap SC2 / PROD-02, PROD-06) | ✓ VERIFIED | `size-selector.tsx` renders exactly S/M/L/XL/XXL/3XL as 44px (`min-h-11 min-w-11`) buttons, emerald accent on selection; `size-guide-modal.tsx` uses a native `<dialog>` (`showModal()`/`close()`), placeholder S–3XL table with the exact UI-SPEC disclaimer copy, composed inline next to the size selector in `configurator-form.tsx:137-145` |
| 3 | Customer can check off patches from a fixed, short list, including "none" (Roadmap SC3 / PROD-03) | ✓ VERIFIED | `patch-checkboxes.tsx` maps `PATCHES` from `config/patches.ts` to chip buttons, every click routed through `togglePatch` (`lib/cart/patch-selection.ts`); post-human-verify gap fix (commit `0cb52d1`) makes all options, including "ingen", fully single-select/mutually exclusive: `togglePatch(current, id) = current.includes(id) ? ["ingen"] : [id]`, confirmed by reading the current file and its test (`lib/cart/patch-selection.test.ts`) |
| 4 | Customer can enter name and number for the print, with validation feedback on length/allowed characters (Roadmap SC4 / PROD-04) | ✓ VERIFIED | `name-number-fields.tsx` runs `jerseyNameSchema`/`jerseyNumberSchema.safeParse` on every change and blur, rendering the schema's exact error string + a `border-red-600`/`dark:border-red-400` border on invalid input, no error on empty (D-22); schemas (`lib/validation/jersey-schema.ts`) use `\p{L}` Unicode-letter regex (accepts Müller/José/Şahin/Åge-Sørensen per test), max 12 chars, integer 0–99 via regex-then-refine (never `z.coerce.number`); re-validated again on submit in `configurator-form.tsx:82-86` before dispatch |
| 5 | Customer sees a live order summary that updates automatically, including bundle discount, when adding multiple jerseys (Roadmap SC5 / PROD-05) | ✓ VERIFIED | `order-summary.tsx` derives `unitPriceOre`/`totalOre` fresh from `getUnitPriceOre(cart.length)`/`getOrderTotalOre(cart.length)` (`config/pricing-tiers.ts`: 350/320/290 kr tiers) on every render, never reading a stored price; shows "Pakkerabatt aktivert" once `quantity >= 2`; `CartItem` type (`lib/cart/cart-types.ts`) has no price field at all (grep-confirmed); `cart-panel.tsx` recomputes `unitPriceOre` once per render and passes it to every `CartItemCard` so all lines reflect the current whole-order tier |
| 6 | Customer sees a short explainer near checkout describing what happens after payment (Roadmap SC6 / PROD-07) | ✓ VERIFIED | `checkout-explainer.tsx` renders the exact locked copy ("Etter betaling får du en ordrebekreftelse på e-post. Sporingsnummer sender vi så snart varene er sendt fra leverandøren."); composed directly above the cart's "Gå til betaling" CTA in `storefront-client.tsx:77-80` |
| 7 | The complete configure → add-to-cart → live-total → edit-in-place flow works end-to-end on a single page at the site homepage, and the app builds cleanly (Plan 06 must-have / overarching phase goal) | ✓ VERIFIED | `app/(storefront)/storefront-client.tsx` mounts `CartProvider`, owns `draft`/`editingId`, wires `CartPanel.onEditItem`/`onRemoveItem`; `configurator-form.tsx` composes all six field components top-to-bottom, submit label toggles "Legg i handlekurv"/"Oppdater" on `editingId`, dispatches `add`/`update` accordingly, `crypto.randomUUID()` only in the submit handler; `app/page.tsx` confirmed deleted, `app/(storefront)/page.tsx` renders `StorefrontClient` as a thin server shell; `npx next build` run directly in this verification succeeds with `/` as the only static route (no duplicate-route error) |

**Score:** 7/7 truths verified in code. Two of the truths above (2 and 7, specifically the mobile-responsive and edit/remove-interaction fixes layered on afterward) still need a human eyes-on re-check — see Human Verification Required.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/cart/cart-types.ts` | CartItem/CartAction/CartState/JerseySize, no price field | ✓ VERIFIED | Present, exports match, grep confirms no price/Ore field |
| `lib/cart/cart-reducer.ts` | pure add/update/remove reducer | ✓ VERIFIED | Present, no React import, 34/34 relevant Vitest tests pass |
| `lib/cart/cart-context.tsx` | CartProvider/useCart/useCartDispatch | ✓ VERIFIED | `"use client"` first line, split state/dispatch contexts |
| `lib/cart/team-options.ts` | getTeamOptions/LANDSLAG_ID | ✓ VERIFIED | Pure, tested (null/unknown/Landslag/Premier League cases) |
| `lib/cart/patch-selection.ts` | togglePatch mutual exclusivity | ✓ VERIFIED | Post-fix single-select version present and tested |
| `lib/validation/jersey-schema.ts` | jerseyNameSchema/jerseyNumberSchema | ✓ VERIFIED | `\p{L}` regex, regex-then-refine number schema, exact UI-SPEC error strings |
| `components/storefront/league-team-select.tsx` | cascading selects | ✓ VERIFIED | Uses getTeamOptions in useMemo, Landslag synthetic option |
| `components/storefront/season-display.tsx` | read-only season label | ✓ VERIFIED | Renders CURRENT_SEASON, no dropdown |
| `components/storefront/size-selector.tsx` | 6-button size group | ✓ VERIFIED | S/M/L/XL/XXL/3XL, 44px targets, emerald accent |
| `components/storefront/size-guide-modal.tsx` | native dialog size guide | ✓ VERIFIED | showModal/close, placeholder table + disclaimer |
| `components/storefront/patch-checkboxes.tsx` | patch chip group | ✓ VERIFIED | Routes through togglePatch, renders PATCHES |
| `components/storefront/name-number-fields.tsx` | live-validated inputs | ✓ VERIFIED | safeParse on change/blur, dual error signal |
| `components/storefront/order-summary.tsx` | live price summary | ✓ VERIFIED | Derives from pricing-tiers, empty-state + error-fallback copy |
| `components/storefront/cart-item-card.tsx` | cart line w/ edit/remove | ✓ VERIFIED | onEdit/onRemove callbacks, resolves patch labels, destructive Fjern |
| `components/storefront/cart-panel.tsx` | responsive persistent panel | ✓ VERIFIED | Sticky desktop / collapsed-bar-to-sheet mobile (post CR-01 fix), 5s undo |
| `components/storefront/configurator-form.tsx` | single-page form, draft/dispatch | ✓ VERIFIED | Composes all fields, add/update dispatch, submit re-validation |
| `components/storefront/checkout-explainer.tsx` | PROD-07 static copy | ✓ VERIFIED | Exact locked copy, no logic |
| `app/(storefront)/storefront-client.tsx` | client root | ✓ VERIFIED | CartProvider + draft/editingId + CR-02 remove-clears-editing fix |
| `app/(storefront)/page.tsx` | storefront route shell | ✓ VERIFIED | Thin server component rendering StorefrontClient |
| `app/page.tsx` (should NOT exist) | old placeholder removed | ✓ VERIFIED | Confirmed absent on disk; `next build` shows `/` as a single route |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `cart-context.tsx` | `cart-reducer.ts` | `useReducer(cartReducer, [])` | ✓ WIRED | Confirmed in source |
| `team-options.ts` | `config/leagues-teams-seasons.ts` | LEAGUES/NATIONAL_TEAMS import | ✓ WIRED | Confirmed in source |
| `league-team-select.tsx` | `lib/cart/team-options.ts` | `getTeamOptions(leagueId)` in useMemo | ✓ WIRED | Confirmed in source |
| `season-display.tsx` | `config/leagues-teams-seasons.ts` | `CURRENT_SEASON` import | ✓ WIRED | Confirmed in source |
| `patch-checkboxes.tsx` | `lib/cart/patch-selection.ts` | `togglePatch(value, id)` | ✓ WIRED | Confirmed in source |
| `name-number-fields.tsx` | `lib/validation/jersey-schema.ts` | `safeParse` on change/blur | ✓ WIRED | Confirmed in source |
| `order-summary.tsx` | `config/pricing-tiers.ts` | `getUnitPriceOre`/`getOrderTotalOre` | ✓ WIRED | Confirmed in source, no stored price read |
| `cart-panel.tsx` | `lib/cart/cart-context.tsx` | `useCart`/`useCartDispatch` | ✓ WIRED | Confirmed in source |
| `configurator-form.tsx` | `lib/cart/cart-context.tsx` | `useCartDispatch` add/update | ✓ WIRED | Confirmed in source |
| `storefront-client.tsx` | `cart-panel.tsx` | `onEditItem`/`onRemoveItem` props | ✓ WIRED | Confirmed post-CR-02-fix source; `handleRemoveItem` clears editingId/draft when the removed item matches the one being edited |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `order-summary.tsx` | `unitPriceOre`/`totalOre` | `getUnitPriceOre(cart.length)`/`getOrderTotalOre(cart.length)` from `config/pricing-tiers.ts` (real tier table: 350/320/290 kr) | Yes | ✓ FLOWING |
| `cart-item-card.tsx` | `item` (CartItem) | Passed from `cart-panel.tsx`'s `cart.map(...)`, which reads `useCart()` (live Context state, not mocked) | Yes | ✓ FLOWING |
| `league-team-select.tsx` | `teamOptions` | `getTeamOptions(leagueId)` reading real `LEAGUES`/`NATIONAL_TEAMS` from Phase 1's `config/leagues-teams-seasons.ts` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase 2 unit/logic tests (cart reducer, team-options, patch-selection, jersey-schema, config) all pass | `npx vitest run lib/cart lib/validation config` | 7 test files, 34/34 tests passed | ✓ PASS |
| TypeScript compiles cleanly across the whole repo | `npx tsc --noEmit` | Exit 0, no output | ✓ PASS |
| ESLint clean on all Phase 2 files | `npx eslint components/storefront lib/cart lib/validation "app/(storefront)"` | Exit 0, no output | ✓ PASS |
| Production build succeeds, `/` is the storefront homepage, no duplicate route | `npx next build` | Compiled successfully; route table shows `○ /` (static), no error | ✓ PASS |
| No price field ever appears on CartItem | `grep -n "price\|Ore\|Price" lib/cart/cart-types.ts` | Only a comment referencing the rule, no field | ✓ PASS |
| 2-weight typography rule (no `font-medium`) holds across all Phase 2 files | `grep -rn "font-medium" components/storefront lib/cart "app/(storefront)"` | No matches | ✓ PASS |
| No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER-as-stub) in Phase 2 files | `grep -rn -E "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER\|coming soon\|not yet implemented" lib/cart lib/validation components/storefront "app/(storefront)"` | No matches (the size-guide's "placeholder" measurement table is an explicit, disclaimed, in-UI design decision per D-17 — not a hidden stub) | ✓ PASS |

**Note:** Full-repo `npm test` shows 3 failures (`tests/auth.integration.test.ts` x2, `tests/idempotency.integration.test.ts` x1) — these are Phase 1 integration tests that time out reaching the live hosted Supabase instance in this sandbox (no network/live-DB access here), already flagged as a known Phase 1 issue in `01-VERIFICATION.md`. They touch no Phase 2 file and are unrelated to this phase's goal; excluded from this report's pass/fail determination.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| PROD-01 | 02-01, 02-03, 02-06 | Kunde kan velge liga, lag og sesong | ✓ SATISFIED | Truth #1 |
| PROD-02 | 02-03, 02-06, 02-07 | Kunde kan velge størrelse | ✓ SATISFIED | Truth #2 |
| PROD-03 | 02-01, 02-04, 02-06 | Kunde kan hake av patcher inkl. "ingen" | ✓ SATISFIED | Truth #3 |
| PROD-04 | 02-02, 02-04, 02-06 | Navn/nummer på trykk med validering | ✓ SATISFIED | Truth #4 |
| PROD-05 | 02-01, 02-05, 02-06, 02-07 | Live ordresammendrag m/ pakkerabatt | ✓ SATISFIED | Truth #5 |
| PROD-06 | 02-03, 02-07 | Størrelsesguide/fit chart | ✓ SATISFIED | Truth #2 |
| PROD-07 | 02-06, 02-07 | Kort forklaringstekst nær checkout | ✓ SATISFIED | Truth #6 |

No orphaned requirements — all 7 requirement IDs mapped to Phase 2 in `.planning/REQUIREMENTS.md` are claimed by at least one plan's `requirements` frontmatter, and every claim is backed by working, wired code.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/storefront/configurator-form.tsx` | 66-86 | `canSubmit` doesn't account for invalid name/number; failed submit is a silent no-op if the invalid field's error isn't currently visible | ⚠️ Warning (documented as WR-01 in 02-REVIEW.md) | UX: customer can click "Legg i handlekurv" and see nothing happen with no feedback in an edge case; does not block the core flow (live validation already shows inline as the customer types), but is real, un-fixed polish debt |
| `components/storefront/cart-panel.tsx` | ~63-69 (`handleUndo`) | "Angre" always re-appends the restored item to the end of the array, not its original position | ⚠️ Warning (documented as WR-02) | Cosmetic list-order surprise, not a data-loss or blocking bug |
| `components/storefront/name-number-fields.tsx` | 54-89 | No `aria-invalid`/`aria-describedby`/`role="alert"` on the live-validated inputs | ⚠️ Warning (documented as WR-03) | Accessibility gap for screen-reader users; not a functional blocker for the phase goal |
| `lib/validation/jersey-schema.test.ts` | 22-24 | Max-length test string contains digits, so it could pass even if `.max(12)` regressed (character-class check would still fail it) | ⚠️ Warning (documented as WR-04) | Test-quality gap, not a runtime defect — the actual schema is correctly implemented and independently confirmed by reading the regex |
| `components/storefront/order-summary.tsx` + `cart-item-card.tsx` | — | `formatOre` helper duplicated in two files | ℹ️ Info (documented as IN-01) | Minor duplication, no functional impact |
| `lib/validation/jersey-schema.ts` | 14-20 | `.optional().or(z.literal(""))` on `jerseyNameSchema` is redundant given the regex already accepts `""` | ℹ️ Info (documented as IN-02) | No functional impact, slightly wider inferred type |
| `lib/validation/jersey-schema.ts` | 18 | `\p{L}` doesn't match combining-mark Unicode categories (NFD-decomposed input edge case) | ℹ️ Info (documented as IN-03) | Narrow edge case, no fix required for phase closure |

All four Warnings and three Info items above were already found and documented by `02-REVIEW.md`'s own code-review pass, independently re-confirmed here by direct inspection of current source (not just trusting the REVIEW document's text). None are debt markers (no bare TBD/FIXME/XXX), and none block the phase goal — the two REVIEW **Critical** findings (CR-01 mobile layout, CR-02 edit/remove data loss) that WOULD have blocked the goal were confirmed fixed in commit `1dff826` by direct source inspection (see Truths #2 and #7, and Key Link Verification).

### Human Verification Required

### 1. Mobile collapsed cart bar does not cover the submit button (CR-01 fix)

**Test:** Resize the browser (or use device emulation) to a mobile width (<1024px). Add at least one jersey to the cart. Confirm the cart panel appears as a collapsed fixed bottom bar (badge + total + chevron), that tapping it expands to a full-height bottom sheet, and that at no point does the bar/sheet overlap or hide the configurator form's own "Legg i handlekurv" submit button.
**Expected:** Collapsed bar is a small, fixed-height (~64px) strip; expand/collapse works via the chevron button; the form's submit button remains fully visible and clickable underneath.
**Why human:** This fix (commit `1dff826`) was applied after the Wave-4 blocking human-verify checkpoint (Plan 02-07) had already closed and been approved. The code review's "re-verified live via dev server" note documents the reviewer's own pass, not an independent owner confirmation on a real/emulated mobile viewport — CSS/responsive layout correctness is not fully provable by reading Tailwind class strings alone.

### 2. Edit-then-remove no longer silently discards the customer's edit (CR-02 fix)

**Test:** Click "Rediger" on a cart item to open it in the form. While the form still shows that item's data, click "Fjern" on that same cart item (or let its 5-second "Angre" undo window lapse). Then observe the form state and try clicking "Oppdater".
**Expected:** Per the fix, removing the item currently open for editing should clear `editingId` and reset the form to empty ("Legg i handlekurv" state) rather than leaving a stale, submittable "Oppdater" form bound to an item that no longer exists in the cart.
**Why human:** CR-02 (silent data loss) was found by static code review, not exercised by a human in a browser, and the fix itself has likewise never been walked through by the owner since the original 02-07 checkpoint closed before this bug was even found. This is exactly the class of interactive, stateful UI behavior that source-reading can trace logically (and this report did trace it — see Truth #7 and Key Link Verification) but cannot experientially confirm behaves correctly to a real user clicking through it.

### Gaps Summary

No code-level gaps found. All 7 must-have truths (the 6 ROADMAP success criteria plus the Plan 06 end-to-end/homepage assembly truth) are verified directly against current source: every artifact exists, is substantive (no stubs, no placeholder logic — the one "placeholder" table in the size-guide modal is an intentional, UI-disclaimed design decision, not hidden debt), and is correctly wired (cart Context → reducer → components → live pricing, all traced by direct grep/read, not assumed from SUMMARY.md prose). `npx tsc --noEmit`, `npx eslint`, `npx next build`, and the Phase-2-scoped Vitest suite (34/34) all pass when re-run directly in this verification pass, not merely quoted from a prior SUMMARY. The two Critical issues found by `02-REVIEW.md` (mobile cart panel covering the submit button; silent data loss on edit-then-remove) are confirmed fixed in the current codebase by direct source inspection of commit `1dff826`'s result.

The reason this report's status is `human_needed` rather than `passed` is procedural, not code-level: those same two Critical fixes were applied to the codebase *after* the phase's one blocking human-verify checkpoint (Plan 02-07) had already been walked through and approved by the owner. The `02-REVIEW.md` "Resolution" section's claim that both fixes were "re-verified live via dev server" documents the reviewer/executor's own check, not a fresh, independent confirmation by the person who will actually judge whether the mobile experience feels right and whether the edit/remove interaction reads sensibly to a real customer — exactly the category of check (visual appearance, interactive user-flow completion) this verification methodology always routes to a human rather than accepting from an agent's self-report. Both items above are narrowly scoped (not a full re-run of the entire Plan 02-07 walkthrough) and should take only a couple of minutes to confirm.

---

*Verified: 2026-07-08T17:10:00Z*
*Verifier: Claude (gsd-verifier)*
