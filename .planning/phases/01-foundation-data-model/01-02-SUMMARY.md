---
phase: 01-foundation-data-model
plan: 02
subsystem: data
tags: [supabase, postgres, migrations, rls, vitest, integration-tests]

# Dependency graph
requires: ["01-01"]
provides:
  - "Full four-table schema (orders, order_items, order_status_history, processed_webhook_events) with RLS enabled"
  - "order_status Postgres enum (pending/paid/confirmed/shipped), integer-ore money columns"
  - "UNIQUE(provider, provider_ref) and UNIQUE(provider, provider_event_id) idempotency guards"
  - "admin_users email allowlist + public.is_admin() SECURITY DEFINER resolver (no hardcoded UUID)"
  - "Generated lib/supabase/types.ts matching the applied schema"
  - "Idempotency + anon-RLS-lockout integration tests, passing against the real hosted Supabase project"
affects: ["01-03", "01-04", "01-05", "phase-02", "phase-03", "phase-04"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single git-versioned Supabase CLI migration as schema source of truth (no dashboard SQL editor edits)"
    - "Email-keyed admin_users allowlist + is_admin() SECURITY DEFINER function, never a hardcoded auth.uid() placeholder"
    - "RLS: every policy scoped `to authenticated`, no anon/public INSERT policy on orders — order writes only via service-role key"
    - "Vitest integration tests run against the real hosted Supabase project (no local Docker stack); env loaded via Node's built-in process.loadEnvFile"
    - "vitest.config.ts aliases 'server-only' to its no-op build so server-only-guarded modules (service-role.ts) are importable under plain Node/Vitest"

key-files:
  created:
    - supabase/migrations/20260707000000_init_schema.sql
    - lib/supabase/types.ts
    - tests/idempotency.integration.test.ts
    - tests/rls.integration.test.ts
    - tests/setup-env.ts
    - README.md
  modified:
    - vitest.config.ts

key-decisions:
  - "Applied the migration to the already-linked hosted Supabase project via `supabase db push --linked` (Docker unavailable in this environment, consistent with Plan 01's documented fallback), rather than `supabase start` + `db reset`."
  - "Admin identity resolved via a stable `admin_users` email allowlist + `is_admin()` SECURITY DEFINER function reading `auth.jwt() ->> 'email'`, instead of RESEARCH.md's example placeholder `auth.uid() = '<uuid>'` policy — the seeded admin's UUID is unknowable at migration-write time, so a hardcoded UUID would silently deny the real admin."
  - "Added admin-only SELECT policies on order_items, order_status_history, and processed_webhook_events (not explicitly required by the plan's grep gates, but required by the same is_admin() RLS pattern and the plan's stated intent to enable RLS on all four tables with admin-only access) — no additional INSERT/UPDATE/DELETE policies were added beyond what the plan specified for orders."

requirements-completed: [ADMIN-01]

# Metrics
duration: 35min
completed: 2026-07-07
---

# Phase 01 Plan 02: Database Schema, RLS & Idempotency Summary

**Single git-versioned migration establishing the full orders/order_items/order_status_history/processed_webhook_events schema with an email-keyed admin_users allowlist, is_admin() RLS resolver, integer-øre money, and both idempotency unique constraints — proven live against the hosted Supabase project by passing integration tests.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments
- Authored and applied `supabase/migrations/20260707000000_init_schema.sql`: `order_status` enum, four data tables, `admin_users` allowlist, `public.is_admin()` SECURITY DEFINER function, and RLS policies on all five tables
- Applied the migration to the hosted Supabase project (`supabase db push --linked`) since Docker is unavailable in this environment
- Generated `lib/supabase/types.ts` from the live applied schema (`supabase gen types typescript --linked`)
- Wrote and ran `tests/idempotency.integration.test.ts` — proves a duplicate `(provider, provider_ref)` insert is rejected with Postgres error `23505`
- Wrote and ran `tests/rls.integration.test.ts` — proves the anon key can neither SELECT nor INSERT into `orders`, even after a service-role-seeded row exists
- Both integration test files run green against the real hosted database (not mocked)
- Documented the hosted-Supabase dev path in `README.md`

## Task Commits

Each task was committed atomically:

1. **Task 1: Author init_schema migration + apply it + generate types** - `2935d75` (feat)
2. **Task 2: Idempotency + RLS integration tests** - `c067df9` (test)

## Files Created/Modified
- `supabase/migrations/20260707000000_init_schema.sql` - the single source-of-truth schema migration: `order_status` enum; `orders`/`order_items`/`order_status_history`/`processed_webhook_events`/`admin_users` tables; `UNIQUE(provider, provider_ref)` and `UNIQUE(provider, provider_event_id)`; `public.is_admin()` SECURITY DEFINER function; RLS enabled on all five tables with admin-only `to authenticated` policies and no anon/public INSERT policy anywhere
- `lib/supabase/types.ts` - regenerated TypeScript types matching the applied schema (overwrites Plan 01's placeholder-free scaffold state)
- `tests/idempotency.integration.test.ts` - inserts a fixed `(provider='test', provider_ref='dup-1')` order via the service-role client twice, asserts the second insert's error code is `23505`; cleans up via `afterAll`
- `tests/rls.integration.test.ts` - seeds an order via service-role, then asserts the anon client's SELECT returns no rows (or an error) and INSERT is rejected; cleans up via `afterAll`
- `tests/setup-env.ts` - loads `.env.local` into `process.env` via Node's built-in `process.loadEnvFile` so integration tests can reach the real hosted Supabase project
- `vitest.config.ts` - added `resolve.alias` for `@/*` (matches `tsconfig.json`'s import alias, needed for tests to import `lib/supabase/*`) and for `server-only` (aliased to its own no-op build, since the package unconditionally throws outside Next.js's bundler); added `setupFiles: ["./tests/setup-env.ts"]`
- `README.md` - new file; documents the hosted-Supabase-fallback dev path (no Docker in this environment) and how to run migrations, regenerate types, and run tests

## Decisions Made
- Used the hosted Supabase fallback (`supabase db push --linked`) instead of a local Docker stack, consistent with Plan 01's precedent and RESEARCH.md's documented Environment Availability fallback.
- Resolved admin identity via a stable, email-keyed `admin_users` allowlist + `is_admin()` SECURITY DEFINER function rather than RESEARCH.md's example placeholder-UUID policy — this was an explicit plan requirement (see `must_haves.truths` in 01-02-PLAN.md), not a deviation.
- Extended admin-only SELECT RLS policies to `order_items`, `order_status_history`, and `processed_webhook_events` (beyond the plan's explicit grep-gated requirement for `orders`), since the plan's stated goal ("RLS enabled on ALL FOUR data tables") and the `is_admin()` pattern apply equally to all of them, and leaving them RLS-enabled with zero policies would make them permanently unreadable even to the admin — a correctness gap the plan's intent required closing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `@/*` path alias resolution to `vitest.config.ts`**
- **Found during:** Task 2
- **Issue:** `tests/idempotency.integration.test.ts` and `tests/rls.integration.test.ts` import Plan 01's client factories via the project's `@/*` import alias (`tsconfig.json`), but Vitest does not read `tsconfig.json` path mappings automatically — the test run failed with `Cannot find package '@/lib/supabase/service-role'`.
- **Fix:** Added a `resolve.alias` entry for `@` → project root in `vitest.config.ts`.
- **Files modified:** vitest.config.ts
- **Verification:** `npx vitest run tests/idempotency.integration.test.ts` resolves the import and runs.
- **Committed in:** `c067df9` (Task 2 commit)

**2. [Rule 3 - Blocking] Aliased `server-only` to its no-op build in `vitest.config.ts`**
- **Found during:** Task 2
- **Issue:** `lib/supabase/service-role.ts` (from Plan 01) starts with `import "server-only"` as a build-time guard. This package unconditionally throws (`"This module cannot be imported from a Client Component module..."`) when imported outside Next.js's bundler, which normally aliases it to a no-op for server-side code. Under plain Vitest/Node, importing `service-role.ts` therefore crashed the idempotency test.
- **Fix:** Added a `resolve.alias` entry mapping `server-only` → `node_modules/server-only/empty.js` (the package's own no-op build, used by Next.js itself for the equivalent case) in `vitest.config.ts`, scoped only to the Vitest run.
- **Files modified:** vitest.config.ts
- **Verification:** `npx vitest run tests/idempotency.integration.test.ts` no longer throws on import; test passes and still exercises the real service-role client against the hosted database.
- **Committed in:** `c067df9` (Task 2 commit)

**3. [Rule 3 - Blocking] Added `tests/setup-env.ts` to load `.env.local` for Vitest**
- **Found during:** Task 2
- **Issue:** The plan's `<action>` explicitly requires the integration tests to load real Supabase env vars from `.env.local` "via dotenv or Vitest env," but Vitest does not automatically expose `.env.local` values on `process.env` for test files (confirmed via probe: `process.env.NEXT_PUBLIC_SUPABASE_URL` was `undefined` without this fix).
- **Fix:** Added `tests/setup-env.ts`, which calls Node's built-in `process.loadEnvFile('.env.local')` (Node 20.6+, avoids adding a new `dotenv` dependency), wired via `vitest.config.ts`'s `setupFiles`.
- **Files modified:** tests/setup-env.ts (new), vitest.config.ts
- **Verification:** A probe test confirmed `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY` are populated before test execution; both integration test files then connected successfully to the live hosted Supabase project.
- **Committed in:** `c067df9` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking test-infrastructure issues, no application logic or schema changes)
**Impact on plan:** All three fixes were pure test-harness plumbing required to make the plan's own explicitly-specified integration tests runnable and reachable against the real database; no scope creep, no architectural changes, no deviation from the schema/RLS contract itself.

## Issues Encountered
- Docker remains unavailable in this environment (as documented in Plan 01's summary), so the migration was applied via `supabase db push --linked` against the already-linked hosted project rather than a local reset. This matches the plan's own documented fallback instruction, not a deviation.
- `README.md` did not previously exist in the repo; created fresh with the required "Database / local dev" heading documenting the hosted-Supabase path.

## User Setup Required

None — the hosted Supabase project was already linked and its credentials already present in `.env.local` from Plan 01. No new external service configuration was needed for this plan.

## Next Phase Readiness
- The full persistence contract (schema, RLS, idempotency guards, admin allowlist resolver) is live on the hosted Supabase project and proven by passing integration tests — Plan 03 (pricing/catalog config, config/*.ts only, no overlap) and Plan 04 (admin seed script + `tests/rls-admin.integration.test.ts` positive-access test) can now proceed.
- Plan 04's seed script must insert the real admin email into `admin_users` (not just create the `auth.users` row) for `is_admin()` to resolve `true` for the seeded admin — this dependency is called out in the plan's interfaces and remains intact.
- No blockers identified for continuing the wave.

---
*Phase: 01-foundation-data-model*
*Completed: 2026-07-07*

## Self-Check: PASSED

Verified all claimed files exist on disk (supabase/migrations/20260707000000_init_schema.sql, lib/supabase/types.ts, tests/idempotency.integration.test.ts, tests/rls.integration.test.ts, tests/setup-env.ts, README.md, vitest.config.ts) and both claimed commit hashes (2935d75, c067df9) are present in `git log --oneline`.
