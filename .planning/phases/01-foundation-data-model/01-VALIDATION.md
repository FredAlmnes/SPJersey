---
phase: 01
slug: foundation-data-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-07
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (to be installed in Wave 0 — no test framework exists yet, greenfield project) |
| **Config file** | none — Wave 0 installs `vitest.config.ts` |
| **Quick run command** | `vitest run <file>` (per changed file) |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant Vitest file (or perform the manual auth check) for the task just completed
- **After every plan wave:** Run `npx vitest run` + the RLS integration script
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-XX | 01 | 0 | ADMIN-01 | V2/V3 | Vitest installed, no test framework existed | setup | `npx vitest --version` | ❌ W0 | ⬜ pending |
| 01-XX-XX | TBD | TBD | ADMIN-01 | V2/V3 Spoofing (getUser vs getSession) | Unauthenticated request to `/admin/*` redirects to login; authenticated admin reaches `/admin` | manual | Manual: curl/browser check of `/admin` unauthenticated vs. logged in | ❌ W0 | ⬜ pending |
| 01-XX-XX | TBD | TBD | schema idempotency | Tampering/Repudiation | Duplicate `(provider, provider_ref)` insert rejected with Postgres `23505` | integration | `tests/idempotency.integration.test.ts` | ❌ W0 | ⬜ pending |
| 01-XX-XX | TBD | TBD | schema RLS | Information Disclosure | Anon-key client cannot SELECT/INSERT/UPDATE `orders`/`order_items`/`order_status_history` | integration | `tests/rls.integration.test.ts` | ❌ W0 | ⬜ pending |
| 01-XX-XX | TBD | TBD | catalog loadable | N/A | `config/leagues-teams-seasons.ts` and `config/pricing-tiers.ts` import without error, correct shape/tier boundaries | unit | `vitest run config/*.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install Vitest (`npm install -D vitest`) and a minimal `vitest.config.ts` — no test framework exists yet
- [ ] `tests/rls.integration.test.ts` — anon-key negative-access checks against `orders`/`order_items`/`order_status_history`
- [ ] `tests/idempotency.integration.test.ts` — duplicate `(provider, provider_ref)` insert rejection check
- [ ] `config/pricing-tiers.test.ts`, `config/leagues-teams-seasons.test.ts` — shape/tier-boundary unit tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin login redirect flow | ADMIN-01 | No E2E (Playwright) framework installed this phase — deferred to Phase 5 (admin panel) when more admin UI exists to justify the investment | Visit `/admin` unauthenticated → expect redirect to login. Log in with seeded admin credentials → expect access to `/admin`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
