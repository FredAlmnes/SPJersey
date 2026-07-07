---
phase: 01-foundation-data-model
verified: 2026-07-07T19:26:29Z
status: gaps_found
score: 8/9 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Full automated test suite is green (VALIDATION.md sign-off requirement: 'Before /gsd:verify-work: Full suite must be green')"
    status: failed
    reason: "tests/auth.integration.test.ts and tests/rls-admin.integration.test.ts both throw at runtime once real ADMIN_EMAIL/ADMIN_PASSWORD credentials exist (they were previously self-skipping when the SUMMARY was written, masking the bug). Both use lib/supabase/client.ts's createBrowserClient() inside a Node/Vitest process; @supabase/ssr's browser client requires document-based cookie storage and throws 'createBrowserClient in non-browser runtimes ... was not initialized [with] getAll and setAll functions' when signInWithPassword tries to persist the session. This is a genuine, currently-reproducible regression, not a flake."
    artifacts:
      - path: "tests/auth.integration.test.ts"
        issue: "Uses lib/supabase/client.ts createClient() (browser client) — throws in Vitest/Node instead of asserting sign-in success"
      - path: "tests/rls-admin.integration.test.ts"
        issue: "Same browser-client bug in the sign-in step before the positive-RLS assertion can even run"
    missing:
      - "Rewrite both test files to sign in via a plain @supabase/supabase-js createClient(url, anonKey) (as rls-admin.integration.test.ts already correctly does for its second/admin-bearer client), not lib/supabase/client.ts's createBrowserClient()"
      - "Re-run `npx vitest run` and confirm 0 failures with real ADMIN_EMAIL/ADMIN_PASSWORD populated"
---

# Phase 1: Foundation & Data Model — Verification Report

**Phase Goal:** The technical foundation exists so every later phase can build on a real schema, real auth, and real catalog data instead of placeholders — proven by a walking skeleton: scaffold → routing → Supabase Auth → RLS-protected DB access all work together.

**Verified:** 2026-07-07T19:26:29Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Next.js 16 app builds and lints with zero errors | ✓ VERIFIED | `npx next build` exits 0 (Turbopack, all 4 routes compiled); `npx eslint .` exits 0 with no output |
| 2 | Three trust-boundary Supabase client factories exist and typecheck | ✓ VERIFIED | `npx tsc --noEmit` exits 0; `lib/supabase/{server,client,service-role}.ts` present, service-role.ts starts with `import "server-only"` |
| 3 | orders/order_items/order_status_history/processed_webhook_events + admin_users exist with RLS, enum, integer-øre money, both UNIQUE idempotency guards, is_admin() (no hardcoded UUID) | ✓ VERIFIED | Read `supabase/migrations/20260707000000_init_schema.sql` directly: `create type order_status as enum ('pending','paid','confirmed','shipped')`, both tables' `unique(...)` constraints, `amount_total_ore`/`unit_price_ore` declared `integer`, `is_admin()` is SECURITY DEFINER keyed on `admin_users.email`, no `auth.uid() = '<uuid>'` literal anywhere |
| 4 | Duplicate (provider, provider_ref) insert rejected with Postgres 23505 | ✓ VERIFIED | Ran `npx vitest run tests/idempotency.integration.test.ts` directly against the live hosted DB — passes |
| 5 | Anon key cannot SELECT/INSERT orders | ✓ VERIFIED | Ran `npx vitest run tests/rls.integration.test.ts` — both assertions pass; independently reproduced with a standalone script: anon `select` on `orders` returns `[]` |
| 6 | Static catalog (5 leagues, national teams, CURRENT_SEASON) and 3-tier whole-order pricing are loadable and correct | ✓ VERIFIED | `npx vitest run config/*.test.ts` — 12/12 pass, including `getOrderTotalOre(3) === 87000` (whole-order, not marginal) |
| 7 | Unauthenticated `/admin` redirects to `/admin/login`; double-gated via `getUser()` (never `getSession()`) | ✓ VERIFIED | Code trace of `middleware.ts` → `lib/supabase/middleware.ts` (getUser + redirect) and `app/(admin)/admin/layout.tsx` (second getUser + redirect); grep confirms no `getSession(` anywhere in the auth path; human checkpoint (Plan 05) confirmed this in a real browser |
| 8 | Seeded admin can sign in and the authenticated admin (via `is_admin()`) can read `orders` while anon cannot | ✓ VERIFIED (by independent reproduction, NOT by the committed test suite) | Wrote a standalone Node script using the real `.env.local` credentials: `admin_users` contains the seeded email; `signInWithPassword` for the seeded admin succeeds; a bearer-token client using the admin's access token reads `orders` with no RLS error, while a plain anon client returns `[]`. This is the same behavior Plan 04's `tests/rls-admin.integration.test.ts` was written to prove — but that test file itself is currently broken (see Gap below) |
| 9 | Admin dashboard performs a real RLS-scoped read against `orders` and renders it | ✓ VERIFIED | `app/(admin)/admin/page.tsx` calls `createClient()` (server, cookie-bound) then `.from('orders').select('id', {count:'exact', head:true})`, renders `count`/`error` — no hardcoded/mock value; human checkpoint confirmed the dashboard rendered a real count (0) in a browser |

**Score:** 8/9 truths verified directly; 1 additional truth (#8) verified only by independent out-of-band reproduction because its designated automated test is broken — see Gap.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/supabase/{server,client,service-role}.ts` | 3 trust-boundary client factories | ✓ VERIFIED | Correct exports, `server-only` guard present, typechecks |
| `supabase/migrations/20260707000000_init_schema.sql` | full schema + RLS + idempotency + admin allowlist | ✓ VERIFIED | Applied to the live hosted Supabase project (confirmed via direct query) |
| `lib/supabase/types.ts` | generated types matching schema | ✓ VERIFIED | Contains `orders` type |
| `config/{pricing-tiers,leagues-teams-seasons,patches}.ts` | catalog + pricing source of truth | ✓ VERIFIED | All exports present, all unit tests pass |
| `middleware.ts` + `lib/supabase/middleware.ts` + `app/(admin)/admin/layout.tsx` | double `getUser()` gate | ✓ VERIFIED | Wired correctly, no `getSession(` |
| `scripts/seed-admin.ts` | creates admin user + `admin_users` row | ✓ VERIFIED | Confirmed live: `admin_users` table has exactly one seeded row matching `ADMIN_EMAIL` |
| `app/(admin)/admin/page.tsx` | real DB read dashboard | ✓ VERIFIED | Not a stub — queries `orders`, renders error or count |
| `tests/idempotency.integration.test.ts`, `tests/rls.integration.test.ts` | idempotency + anon-lockout proof | ✓ VERIFIED (passing) | Both green against the live DB |
| `tests/auth.integration.test.ts`, `tests/rls-admin.integration.test.ts` | seeded-admin sign-in + positive-RLS proof | ⚠️ BROKEN | Exist, substantively written, correctly wired to real factories — but throw at runtime due to a browser-client-in-Node bug (see Gap) |

### Behavioral Spot-Checks / Automated Command Re-Run

| Command | Result | Status |
|---------|--------|--------|
| `npx tsc --noEmit` | exit 0 | ✓ PASS |
| `npx eslint .` | exit 0, no output | ✓ PASS |
| `npx next build` | exit 0, all 4 routes compiled (`/`, `/admin`, `/admin/login`, middleware) | ✓ PASS |
| `npx vitest run` (full suite) | **2 failed, 5 passed (7 files) / 17 passed, 2 failed (19 tests)** | ✗ FAIL |
| `npx vitest run tests/idempotency.integration.test.ts tests/rls.integration.test.ts` | 3/3 pass | ✓ PASS |
| `npx vitest run config/*.test.ts` | 12/12 pass | ✓ PASS |
| Direct DB check (service-role script): `admin_users`, anon `select`, admin sign-in, admin bearer read | admin_users seeded; anon blocked; admin sign-in succeeds; admin bearer read succeeds with no error | ✓ PASS (out-of-band) |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| ADMIN-01 | Eier kan logge inn i et admin-panel (én fast admin-bruker) | ✓ SATISFIED | Double-gated auth, seed script, human checkpoint sign-off, independent DB reproduction |

No orphaned requirements — ADMIN-01 is the only requirement mapped to Phase 1 in REQUIREMENTS.md, and it is claimed by Plans 01-04.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/auth.integration.test.ts` | 19 | Uses browser Supabase client outside a browser runtime | ⚠️ Warning | Test throws instead of asserting; masks/breaks the phase's own "full suite green" validation gate now that real credentials exist |
| `tests/rls-admin.integration.test.ts` | 62 | Same browser-client bug in the sign-in step | ⚠️ Warning | Same as above; the positive-RLS regression guard this test exists to provide is currently non-functional |
| `next build` output | — | "middleware" file convention deprecated in Next.js 16 in favor of "proxy" | ℹ️ Info | Non-blocking; app still builds and runs correctly, but will need a rename in a future Next.js major |

No TBD/FIXME/XXX debt markers found in phase-modified files (the two grep hits are explanatory prose comments, not unresolved debt markers).

### Human Verification Required

None outstanding. Plan 05's `checkpoint:human-verify` (blocking) was already executed: the owner ran the full stack locally, confirmed the unauthenticated `/admin` → `/admin/login` redirect, successful login with seeded credentials rendering the dashboard with a real order count, and rejection of a wrong password. This verifier cannot re-exercise a live browser, so this sign-off is accepted as recorded in `01-05-SUMMARY.md`, corroborated by the independent DB-level reproduction of the same auth/RLS behavior in this report.

### Gaps Summary

The phase's core walking-skeleton goal **is** achieved — scaffold, schema/RLS/idempotency, catalog/pricing, and double-gated auth with a real DB read are all real, wired, and independently confirmed against the live hosted Supabase project (not mocked). However, the phase is not spotless: two of the five Vitest integration test files it produced (`tests/auth.integration.test.ts`, `tests/rls-admin.integration.test.ts`) are currently broken and fail when run with real seeded credentials, because they instantiate the browser-only Supabase client (`lib/supabase/client.ts`) inside Node/Vitest instead of a plain `@supabase/supabase-js` client. This was hidden previously because `ADMIN_EMAIL`/`ADMIN_PASSWORD` were empty at authoring time (tests self-skipped, "15 passed | 4 skipped" reported clean). Now that the owner has seeded real credentials (required for the Plan 05 checkpoint to even happen), `npx vitest run` is red — directly contradicting 01-VALIDATION.md's own sign-off gate ("Before /gsd:verify-work: Full suite must be green"). This is a small, mechanical fix (swap the client construction, mirroring the pattern the same test file already uses correctly for its admin-bearer client), but it is a real defect in delivered code, not a documentation nit, and should be closed before the phase is considered fully clean.

---

*Verified: 2026-07-07T19:26:29Z*
*Verifier: Claude (gsd-verifier)*
