---
phase: 01-foundation-data-model
plan: 04
subsystem: auth
tags: [nextjs, supabase-auth, rls, middleware, server-actions, vitest]

# Dependency graph
requires: ["01-01", "01-02"]
provides:
  - "Double-gated (getUser() in middleware + layout) /admin/* auth wall, never getSession()"
  - "Norwegian email+password login form wired to a signInWithPassword server action"
  - "scripts/seed-admin.ts — one-off, re-runnable admin creation + admin_users allowlist upsert"
  - "app/(admin)/admin/page.tsx — real RLS-scoped orders count read behind the auth gate"
  - "tests/auth.integration.test.ts + tests/rls-admin.integration.test.ts — auth wiring and positive authenticated-admin RLS proof"
affects: ["01-05", "phase-02", "phase-03", "phase-04"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "middleware forwards current pathname via x-pathname request header so a Server Component layout can read it (headers() has no built-in pathname API)"
    - "one-off seed scripts run via plain tsx/Node must NOT import server-only-guarded modules (lib/supabase/service-role.ts) — construct the service-role client inline instead"
    - "positive RLS proof pattern: sign in on an anon client to get an access_token, then build a second supabase-js client with Authorization: Bearer <access_token> to exercise RLS as that authenticated user"

key-files:
  created:
    - middleware.ts
    - lib/supabase/middleware.ts
    - app/(admin)/admin/layout.tsx
    - app/(admin)/admin/login/page.tsx
    - app/(admin)/admin/actions.ts
    - app/(admin)/admin/page.tsx
    - scripts/seed-admin.ts
    - tests/auth.integration.test.ts
    - tests/rls-admin.integration.test.ts
  modified:
    - README.md

key-decisions:
  - "middleware.ts injects an x-pathname request header (read via next/headers in the layout) so app/(admin)/admin/layout.tsx can exempt /admin/login from its own getUser() redirect — without this, the login page (which the plan places under this same layout) would redirect to itself forever."
  - "scripts/seed-admin.ts constructs the service-role client inline rather than importing lib/supabase/service-role.ts, because that module's `import \"server-only\"` guard unconditionally throws outside Next.js's bundler (confirmed via node_modules/server-only/index.js) — plain tsx/Node execution of the script would otherwise crash immediately."
  - "Both new integration tests self-skip (via test.skip + a console.warn) when ADMIN_EMAIL/ADMIN_PASSWORD are not set, per the plan's explicit fallback for an environment where the seeded admin cannot yet exist."

requirements-completed: [ADMIN-01]

# Metrics
duration: 40min
completed: 2026-07-07
---

# Phase 01 Plan 04: Admin Auth Walking Skeleton Summary

**Double-gated Supabase Auth (getUser() in middleware + layout, never getSession()) protecting `/admin/*`, a Norwegian login form, a re-runnable seed script that closes the `is_admin()` RLS loop, and a real RLS-scoped dashboard read — proven by integration tests that self-skip until the admin account is actually seeded.**

## Performance

- **Duration:** ~40 min
- **Tasks:** 2
- **Files modified:** 10 (9 created, 1 modified)

## Accomplishments
- `lib/supabase/middleware.ts` + root `middleware.ts`: session-refreshing middleware that calls `getUser()` and redirects unauthenticated `/admin/*` requests to `/admin/login`
- `app/(admin)/admin/layout.tsx`: server-side `getUser()` re-check (defense-in-depth), with an explicit `/admin/login` exemption to avoid a self-redirect loop
- Norwegian email+password login form (`app/(admin)/admin/login/page.tsx`) wired to a `signInWithPassword` server action (`app/(admin)/admin/actions.ts`)
- `scripts/seed-admin.ts`: one-off, safely re-runnable script creating the single admin auth user AND upserting its email into `admin_users`, which is what makes `is_admin()` grant the real admin RLS access
- `app/(admin)/admin/page.tsx`: real `orders` count query behind the auth gate (Norwegian placeholder dashboard)
- `tests/auth.integration.test.ts`: proves seeded-admin sign-in returns a session and wrong password returns an error
- `tests/rls-admin.integration.test.ts`: positive RLS proof — an authenticated admin JWT-bearer client can SELECT a service-role-seeded row while the plain anon key cannot (differential control), the direct regression guard for an unpopulated `admin_users` allowlist
- `README.md` updated with a full "Run the full stack locally" walkthrough (seed → dev → login)
- `npx tsc --noEmit`, `npx eslint .`, and `npx vitest run` (15 passed, 4 skipped) all clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth gate (middleware + layout) + login form + seed-admin script** - `2424706` (feat)
2. **Task 2: Admin dashboard real DB read + integration tests + run docs** - `b3cda18` (test)

## Files Created/Modified
- `middleware.ts` - root middleware delegating to `updateSession`, matcher `/admin/:path*`
- `lib/supabase/middleware.ts` - `updateSession()`: request-scoped Supabase client, `getUser()` gate, redirect to `/admin/login`, forwards `x-pathname` header
- `app/(admin)/admin/layout.tsx` - server-side `getUser()` re-check; reads `x-pathname` to exempt `/admin/login` from the redirect
- `app/(admin)/admin/actions.ts` - `'use server'` login action calling `signInWithPassword`
- `app/(admin)/admin/login/page.tsx` - Norwegian email+password form (Client Component using `useActionState`)
- `app/(admin)/admin/page.tsx` - real `orders` count read via `createClient()` from `lib/supabase/server.ts`
- `scripts/seed-admin.ts` - creates the admin auth user (re-run-safe) + upserts `admin_users` allowlist row; constructs the service-role client inline (see deviation below)
- `tests/auth.integration.test.ts` - sign-in success/failure assertions, self-skips without `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- `tests/rls-admin.integration.test.ts` - positive authenticated-admin RLS read + anon differential control, self-skips without `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- `README.md` - added "Run the full stack locally" section

## Decisions Made
- Forwarded the current request pathname via an `x-pathname` header from middleware to the admin layout, since Next.js Server Components have no built-in way to read the current pathname — this was required to let the layout's `getUser()` re-check exempt `/admin/login` (which the plan places under the same `layout.tsx`) without an infinite redirect loop.
- Constructed the service-role client inline inside `scripts/seed-admin.ts` instead of importing `lib/supabase/service-role.ts`, because that module's `server-only` import guard throws outside Next.js's bundler.
- Both new integration tests self-skip with a `console.warn` when `ADMIN_EMAIL`/`ADMIN_PASSWORD` are empty, per the plan's explicit "if unreachable, mark pending" instruction — these env vars remain empty placeholders in this environment (no admin has been seeded yet).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a redirect-loop bug in the planned layout-guards-login structure**
- **Found during:** Task 1
- **Issue:** The plan's fixed file paths place both the protected dashboard (`app/(admin)/admin/page.tsx`) and the public login page (`app/(admin)/admin/login/page.tsx`) under the same `app/(admin)/admin/layout.tsx`. A layout that unconditionally calls `getUser()` and redirects to `/admin/login` when there is no user would also wrap the login page itself, causing an unauthenticated visit to `/admin/login` to redirect to `/admin/login` forever.
- **Fix:** Middleware now forwards the current pathname via an `x-pathname` request header; the layout reads it via `next/headers` and skips the `getUser()` redirect when the path starts with `/admin/login`.
- **Files modified:** lib/supabase/middleware.ts, app/(admin)/admin/layout.tsx
- **Verification:** `npx tsc --noEmit` clean; grep gates for `getUser`/`getSession`/`matcher` all pass; manual code trace confirms `/admin/login` short-circuits before the `getUser()` call.
- **Committed in:** `2424706` (Task 1 commit)

**2. [Rule 3 - Blocking] Constructed the service-role client inline in scripts/seed-admin.ts instead of importing lib/supabase/service-role.ts**
- **Found during:** Task 1
- **Issue:** `lib/supabase/service-role.ts` starts with `import "server-only"`, a marker package (`node_modules/server-only/index.js`) that unconditionally throws when loaded outside Next.js's bundler. `vitest.config.ts` already works around this for tests via a `resolve.alias`, but `scripts/seed-admin.ts` is meant to run via plain `npx tsx`, which has no such alias — importing the factory would crash the script immediately.
- **Fix:** `scripts/seed-admin.ts` constructs the service-role Supabase client inline, using the identical construction as `lib/supabase/service-role.ts` (same URL/key/env-var names), documented in a code comment pointing back at the root cause.
- **Files modified:** scripts/seed-admin.ts
- **Verification:** `npx tsc --noEmit` clean; script does not import the `server-only`-guarded module; construction matches `lib/supabase/service-role.ts` field-for-field.
- **Committed in:** `2424706` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking); no architectural changes, no scope creep.

## Issues Encountered
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` remain empty placeholders in `.env.local` in this execution environment (confirmed via `grep -c "^ADMIN_EMAIL=.\+" .env.local` → `0`) — the owner has not yet chosen real admin credentials. `scripts/seed-admin.ts` has therefore not been run, and the two integration tests that depend on a live admin session (`tests/auth.integration.test.ts`, `tests/rls-admin.integration.test.ts`) both self-skip with a `console.warn` rather than failing. This is the plan's documented fallback path, not a defect — `npx vitest run` shows `15 passed | 4 skipped`.
- `tsx` is not a project dependency but resolves via `npx` (confirmed: `npx --no-install tsx --version` → `4.23.0`); no new dependency was added to `package.json` per the package-manager-install exclusion in the deviation rules.

## User Setup Required

**Before the auth flow can be exercised end-to-end (manually, or via the two pending integration tests):**
1. Choose real values for `ADMIN_EMAIL` and `ADMIN_PASSWORD` and set them in `.env.local` (currently empty placeholders).
2. Run `npx tsx scripts/seed-admin.ts` once — creates the Supabase Auth user and upserts the `admin_users` allowlist row.
3. Re-run `npx vitest run tests/auth.integration.test.ts tests/rls-admin.integration.test.ts` — both should then pass (currently skip).
4. Manually visit `/admin` → confirm redirect to `/admin/login` → log in → confirm the dashboard renders the real order count (expected `0`). This manual walkthrough is deferred to Plan 05's checkpoint per the plan's `<verification>` section.

`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already populated (inherited from Plan 01/02) — no action needed for those.

## Known Stubs

None. The dashboard performs a real Supabase query (not a hardcoded/mock value); the `count`/`error` UI branches both reflect the actual query result. The only "pending" state is the two integration tests self-skipping until the admin is seeded (documented above, not a UI stub).

## Threat Flags

None. All auth/RLS surface introduced in this plan (middleware gate, layout re-check, login server action, seed script, dashboard read) is exactly the surface enumerated in the plan's own `<threat_model>` (T-04-01 through T-04-04); no new endpoints, auth paths, or schema changes were added beyond what the plan specified.

## Next Phase Readiness
- The full auth wall (middleware + layout, `getUser()`-only) and the login → dashboard slice are in place and typecheck/lint/test clean.
- Plan 05 can proceed to the manual login-redirect checkpoint walkthrough once the owner seeds real `ADMIN_EMAIL`/`ADMIN_PASSWORD` credentials, per `01-04-PLAN.md`'s `user_setup` block.
- No architectural blockers identified for continuing the wave.

---
*Phase: 01-foundation-data-model*
*Completed: 2026-07-07*

## Self-Check: PASSED

All claimed files verified present (middleware.ts, lib/supabase/middleware.ts, app/(admin)/admin/layout.tsx, app/(admin)/admin/login/page.tsx, app/(admin)/admin/actions.ts, app/(admin)/admin/page.tsx, scripts/seed-admin.ts, tests/auth.integration.test.ts, tests/rls-admin.integration.test.ts, README.md) and both claimed commit hashes (2424706, b3cda18) verified present in git log.
