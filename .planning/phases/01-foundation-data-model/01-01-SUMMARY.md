---
phase: 01-foundation-data-model
plan: 01
subsystem: infra
tags: [nextjs, supabase, tailwind, typescript, vitest, ssr]

# Dependency graph
requires: []
provides:
  - "Buildable/lintable Next.js 16 App Router scaffold (Turbopack, Tailwind 4, TypeScript 6.0.3, ESLint)"
  - "Locked dependency set installed: @supabase/supabase-js@2.110.0, @supabase/ssr@0.12.0, zod@4.4.3, server-only, vitest, supabase CLI"
  - "Local supabase/config.toml (project already linked to a hosted Supabase project)"
  - "Three trust-boundary-scoped Supabase client factories: lib/supabase/server.ts, lib/supabase/client.ts, lib/supabase/service-role.ts"
  - "vitest.config.ts test runner wired to config/**/*.test.ts and tests/**/*.test.ts"
  - ".env.example / .env.local with the five required env keys"
affects: [01-02, 01-03, 01-04, 01-05, phase-02, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: ["next@16.2.10", "react@19.2.4", "typescript@6.0.3", "tailwindcss@4", "@supabase/supabase-js@2.110.0", "@supabase/ssr@0.12.0", "zod@4.4.3", "server-only", "vitest@4.1.10", "supabase CLI@2.100.1"]
  patterns: ["three-client Supabase factory split (server/browser/service-role) per trust boundary", "server-only import guard on privileged clients"]

key-files:
  created:
    - lib/supabase/server.ts
    - lib/supabase/client.ts
    - lib/supabase/service-role.ts
    - vitest.config.ts
    - .env.example
    - supabase/config.toml
  modified:
    - package.json
    - app/page.tsx
    - .env.local
    - .gitignore

key-decisions:
  - "Scaffolded create-next-app into a temp scratch directory (spjersey-app) instead of the repo root directly, because npm rejects package names containing capital letters ('SpJersey'); copied only the plan's declared files_modified into the repo root, deliberately excluding the scaffold's generated CLAUDE.md/AGENTS.md so they would not clobber the project's existing CLAUDE.md."
  - "Pinned typescript to 6.0.3 (verified to exist on npm registry) per RESEARCH.md's interfaces block, overriding create-next-app's default ^5 devDependency."
  - "Reused the already-linked hosted Supabase project (supabase/.temp/linked-project.json pre-existed) rather than starting a local Docker stack, since Docker is unavailable in this environment — matches RESEARCH.md's documented hosted-Supabase fallback."

patterns-established:
  - "Pattern: lib/supabase/{server,client,service-role}.ts — every future Supabase read/write must go through one of these three factories, chosen by trust boundary, never instantiate the SDK ad hoc."
  - "Pattern: privileged clients (service-role) start with `import 'server-only'` as their first line so an accidental client-bundle import fails the build."

requirements-completed: [ADMIN-01]

# Metrics
duration: 20min
completed: 2026-07-07
---

# Phase 01 Plan 01: Foundation Scaffold Summary

**Next.js 16 App Router scaffold with locked Supabase/Vitest dependency set and three trust-boundary Supabase client factories (server, browser, service-role).**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-07T18:00:00Z (approx, prior to first Bash call)
- **Completed:** 2026-07-07T18:21:25Z
- **Tasks:** 2
- **Files modified:** 24 (21 in Task 1 commit, 3 in Task 2 commit, 1 in a follow-up chore commit)

## Accomplishments
- Next.js 16.2.10 App Router project scaffolded with Turbopack, Tailwind 4, TypeScript 6.0.3, ESLint — builds, lints, and typechecks clean
- Locked dependency versions installed exactly as specified in RESEARCH.md's interfaces block
- Local `supabase/config.toml` initialised via `npx supabase init`, layered on top of an already-linked hosted Supabase project
- Vitest wired up and passing with `--passWithNoTests`
- Three Supabase client factories created, each scoped to its correct trust boundary and typechecking clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 app + install dependencies + init Supabase + Vitest** - `1e2bd68` (feat)
2. **Task 2: Create three trust-boundary Supabase client factories** - `0130294` (feat)
3. **Follow-up: ignore generated tsconfig.tsbuildinfo** - `c4cda35` (chore)

**Plan metadata:** committed as part of this workflow's final commit (see below)

## Files Created/Modified
- `package.json` / `package-lock.json` - Next.js 16 + Supabase + Vitest dependency manifest at pinned versions
- `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `next-env.d.ts` - scaffold config
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/favicon.ico` - App Router shell; `page.tsx` replaced with a minimal Norwegian placeholder ("Skreddersydde fotballdrakter — kommer snart.")
- `public/*.svg` - default scaffold assets (unreferenced after placeholder page swap, kept as harmless scaffold output)
- `vitest.config.ts` - Node environment, `config/**/*.test.ts` + `tests/**/*.test.ts` includes
- `.env.example` - five required keys (empty placeholders), `.env.local` - added `ADMIN_EMAIL`/`ADMIN_PASSWORD` placeholders alongside pre-existing hosted Supabase URL/anon/service-role keys
- `.gitignore` - already covered `.env*.local` and `/node_modules`; added `*.tsbuildinfo`
- `supabase/config.toml`, `supabase/.gitignore` - local Supabase project init output
- `lib/supabase/server.ts` - `createServerClient` cookie-bound factory (async, Server Components/Route Handlers)
- `lib/supabase/client.ts` - `createBrowserClient` factory (Client Components)
- `lib/supabase/service-role.ts` - service-role client, `import 'server-only'` guarded, reads `SUPABASE_SERVICE_ROLE_KEY`

## Decisions Made
- Scaffolded into a scratch temp directory and copied only plan-declared files into the repo root, to work around npm's rejection of the capitalized directory name `SpJersey` as a package name, and to avoid the scaffold's generated `CLAUDE.md`/`AGENTS.md` overwriting the project's real `CLAUDE.md`.
- Pinned `typescript@6.0.3` (confirmed to exist on the npm registry as of 2026-07-07) instead of accepting create-next-app's default `^5`.
- Left the pre-existing hosted Supabase link (`supabase/.temp/linked-project.json`) in place rather than attempting a local Docker-based `supabase start` (Docker unavailable in this environment) — consistent with RESEARCH.md's documented fallback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worked around npm package-name restriction for `create-next-app .`**
- **Found during:** Task 1
- **Issue:** `npx create-next-app@latest . ...` failed immediately with "Could not create a project called 'SpJersey' because ... name can no longer contain capital letters" — the plan's literal command as written cannot succeed in this repo.
- **Fix:** Ran `create-next-app` in a scratch temp directory using a valid lowercase project name (`spjersey-app`), then copied only the plan's declared `files_modified` (plus `public/`, `next-env.d.ts`, `app/favicon.ico`, `supabase/.gitignore` as necessary scaffold companions) into the repo root, explicitly excluding the scaffold's own generated `CLAUDE.md`/`AGENTS.md` so the project's existing `CLAUDE.md` was never touched.
- **Files modified:** package.json, package-lock.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs, next-env.d.ts, app/*, public/*
- **Verification:** `npx next build`, `npx eslint .`, `npx vitest run --passWithNoTests` all pass; `package.json` name field (`spjersey-app`) is a valid npm name.
- **Committed in:** `1e2bd68` (Task 1 commit)

**2. [Rule 1 - Bug] Added `*.tsbuildinfo` to `.gitignore`**
- **Found during:** Task 2 (post-verification)
- **Issue:** `tsconfig.json`'s `incremental: true` causes `npx tsc --noEmit` to emit a `tsconfig.tsbuildinfo` file, which appeared as an untracked generated artifact after verification.
- **Fix:** Added `*.tsbuildinfo` to `.gitignore` and removed the stray file before committing.
- **Files modified:** .gitignore
- **Verification:** `git status --short` shows no untracked generated files after the fix.
- **Committed in:** `c4cda35` (follow-up chore commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes were necessary to complete the task as intended; no scope creep, no architectural changes, no functional deviation from the plan's client factory contracts.

## Issues Encountered
- Docker is not installed in this environment, so `supabase start` was correctly skipped per the plan's own instruction; the repo already had a hosted Supabase project linked (`supabase/.temp/linked-project.json`) from prior setup, and `.env.local` already contained real (non-placeholder) `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` values pointing at it — this plan only added the missing `ADMIN_EMAIL`/`ADMIN_PASSWORD` placeholder keys.

## User Setup Required

None - no external service configuration required for this plan. (Note: `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env.local` are currently empty placeholders; a later plan/phase that implements the admin auth seed script will need real values.)

## Next Phase Readiness
- The scaffold, dependency set, and three Supabase client factories are in place and typecheck/build/lint/test clean — Plans 02-05 in this phase (schema, catalog config, auth) can now proceed.
- No blockers identified for continuing the wave.

---
*Phase: 01-foundation-data-model*
*Completed: 2026-07-07*
