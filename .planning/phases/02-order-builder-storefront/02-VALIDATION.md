---
phase: 2
slug: order-builder-storefront
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 (already installed and used in Phase 1) |
| **Config file** | `vitest.config.ts` — currently `test.environment: "node"`, no jsdom, includes only `config/**/*.test.ts` and `tests/**/*.test.ts` |
| **Quick run command** | `npx vitest run <path-to-file>` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds (logic-only scope) |

**Scope decision: Option A — logic-only testing.** Tests cover the cart reducer, Zod validation schemas, and pricing-integration glue as pure functions under the existing `node` Vitest environment. No component-rendering tests, no new devDependencies (jsdom/RTL). This matches Phase 1's precedent exactly and avoids introducing a second test environment for a v1, low-volume storefront. If the planner determines component-level rendering tests are necessary for a specific behavior, it should note the deviation in that plan's frontmatter and update this file's scope decision accordingly — Option B (component tests via jsdom + React Testing Library) is documented in `02-RESEARCH.md` §Validation Architecture as the fallback path.

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed-file>.test.ts`
- **After every plan wave:** Run `npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-xx-xx | TBD | TBD | PROD-01 | — | Team options correctly filtered by selected league/"Landslag" | unit | `npx vitest run lib/cart/team-options.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-xx-xx | TBD | TBD | PROD-03 | — | "Ingen" mutual exclusivity reducer produces valid `patchIds` for every input sequence | unit | `npx vitest run lib/cart/patch-selection.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-xx-xx | TBD | TBD | PROD-04 | — | Zod name/number schemas accept international letters, reject invalid input, enforce D-20/D-21 bounds | unit | `npx vitest run lib/validation/jersey-schema.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-xx-xx | TBD | TBD | PROD-05 | — | `cartReducer` add/update/remove produce correct state; order summary derives correct price via Phase 1's pricing-tiers functions | unit | `npx vitest run lib/cart/cart-reducer.test.ts` | ❌ Wave 0 | ⬜ pending |

*Exact plan/wave/task IDs are filled in by the planner once tasks are assigned. PROD-02/PROD-06/PROD-07 (size selection, size-guide modal, checkout explainer) are covered by manual verification below since Option A excludes component rendering tests.*

---

## Wave 0 Requirements

- [ ] Add a `"test": "vitest run"` script to `package.json` — currently absent; every existing Phase 1 test is run via bare `npx vitest run`.
- [ ] `lib/cart/cart-reducer.test.ts` — covers PROD-05 (add/update/remove correctness)
- [ ] `lib/validation/jersey-schema.test.ts` — covers PROD-04 (Zod schema edge cases: max length, Unicode letters, 0–99 range, optional/empty)
- [ ] `lib/cart/team-options.test.ts` — covers PROD-01 (cascading derivation correctness, including the "Landslag" pseudo-league path)
- [ ] `lib/cart/patch-selection.test.ts` — covers PROD-03 (mutual-exclusivity function correctness)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Size guide opens/closes correctly, shows placeholder table | PROD-06 | Option A excludes component rendering tests; no E2E framework installed this phase | Run `npm run dev`, open configurator, click size-guide trigger, confirm modal opens with S–3XL table and closes on Escape/backdrop click |
| Live order summary updates visibly as cart changes | PROD-05 | Visual/interactive confirmation beyond what a reducer unit test proves | Add 1, 2, then 3+ jerseys to cart in browser; confirm displayed total matches bundle-discount math (350/320/290 per unit) |
| Checkout explainer text renders near checkout | PROD-07 | Static copy rendering, not worth a component test | Visually confirm explainer text appears above/near the "Gå til betaling" button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
