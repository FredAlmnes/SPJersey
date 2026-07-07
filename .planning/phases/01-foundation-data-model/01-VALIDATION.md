---
phase: 01
slug: foundation-data-model
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-07
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (installed in Plan 01 Wave 0 — no test framework existed, greenfield project) |
| **Config file** | `vitest.config.ts` (created in Plan 01, Task 1) |
| **Quick run command** | `npx vitest run <file>` (per changed file) |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant Vitest file (or perform the manual auth check) for the task just completed
- **After every plan wave:** Run `npx vitest run` + the RLS integration tests
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds (per-task inner loop). The Plan 01 Task 1 scaffold gate (`next build` + `eslint` + `vitest`) is an explicitly-documented one-time exemption — see 01-01-PLAN.md `<latency-note>`.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-1 | 01 | 1 | ADMIN-01 | T-01-01 | Scaffold builds/lints; Vitest installed (one-time gate, latency-exempt) | setup | `npx next build && npx eslint . && npx vitest run --passWithNoTests` | ✅ Plan 01 | ⬜ pending |
| 01-04-2 | 04 | 3 | ADMIN-01 | T-04-01 Spoofing (getUser vs getSession) | Unauthenticated request to `/admin/*` redirects to login; seeded admin can sign in | integration + manual | `npx vitest run tests/auth.integration.test.ts` (+ manual redirect walkthrough) | ✅ Plan 04 | ⬜ pending |
| 01-04-2 | 04 | 3 | ADMIN-01 | T-04-04 / T-02-01 | Authenticated seeded admin (is_admin() email allowlist) CAN SELECT a seeded orders row; anon cannot — closes the RLS wiring loop | integration | `npx vitest run tests/rls-admin.integration.test.ts` | ✅ Plan 04 | ⬜ pending |
| 01-02-2 | 02 | 2 | schema idempotency | T-02-02 Tampering/Repudiation | Duplicate `(provider, provider_ref)` insert rejected with Postgres `23505` | integration | `npx vitest run tests/idempotency.integration.test.ts` | ✅ Plan 02 | ⬜ pending |
| 01-02-2 | 02 | 2 | schema RLS | T-02-01 Information Disclosure | Anon-key client cannot SELECT/INSERT/UPDATE `orders` | integration | `npx vitest run tests/rls.integration.test.ts` | ✅ Plan 02 | ⬜ pending |
| 01-03-X | 03 | 2 | catalog loadable | N/A | `config/leagues-teams-seasons.ts` and `config/pricing-tiers.ts` import without error, correct shape/tier boundaries | unit | `npx vitest run config/*.test.ts` | ✅ Plan 03 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 requirements are satisfied by the plans as written (Plan 01 installs the runner; Plans 02/04 author the integration tests; Plan 03 authors the config unit tests). Boxes checked reflect coverage in the plan set, not yet execution.

- [x] Install Vitest (`npm install -D vitest`) and a minimal `vitest.config.ts` — no test framework exists yet → **Plan 01, Task 1**
- [x] `tests/rls.integration.test.ts` — anon-key negative-access checks against `orders` → **Plan 02, Task 2**
- [x] `tests/rls-admin.integration.test.ts` — positive authenticated-admin (is_admin() allowlist) SELECT check → **Plan 04, Task 2** (closes the RLS wiring loop)
- [x] `tests/idempotency.integration.test.ts` — duplicate `(provider, provider_ref)` insert rejection check → **Plan 02, Task 2**
- [x] `config/pricing-tiers.test.ts`, `config/leagues-teams-seasons.test.ts` — shape/tier-boundary unit tests → **Plan 03**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin login redirect flow | ADMIN-01 | No E2E (Playwright) framework installed this phase — deferred to Phase 5 (admin panel) when more admin UI exists to justify the investment | Visit `/admin` unauthenticated → expect redirect to login. Log in with seeded admin credentials → expect access to `/admin`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s (Plan 01 scaffold gate is a documented one-time exemption)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (plan-checker findings addressed — RLS admin wiring closed via is_admin() email allowlist + positive integration test; scaffold latency exemption documented)
</content>
