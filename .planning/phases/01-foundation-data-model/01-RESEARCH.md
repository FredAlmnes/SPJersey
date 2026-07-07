# Phase 1: Foundation & Data Model - Research

**Researched:** 2026-07-07
**Domain:** Next.js 16 + Supabase project scaffolding, Postgres schema design with RLS, single-admin auth, static catalog data modeling
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Katalog-innhold (leagues/teams/seasons)

- **D-01:** v1 leagues: Premier League, Eliteserien, LaLiga, Serie A, Bundesliga.
- **D-02:** All teams within each of those 5 leagues are selectable (not a curated subset) — full league rosters, easier to maintain and avoids leaving out a team a customer wants.
- **D-03:** National teams included: Norway plus major football nations (e.g. Brazil, France, Germany, Spain, England, Argentina, and similar World Cup/Euro-caliber teams).
- **D-04:** Only the current season is selectable per team (home/away kit for the current season) — no historical/retro seasons in v1.

#### Prisstruktur (pricing tiers)

- **D-05:** Base price per jersey: **350 NOK**.
- **D-06:** Bundle discount uses 3 tiers by quantity in a single order:
  - 1 jersey → 350 NOK/unit
  - 2 jerseys → 320 NOK/unit
  - 3+ jerseys → 290 NOK/unit
- **D-07:** These per-unit prices apply to the whole order quantity (not marginal/incremental pricing) — e.g. 3 jerseys = 3 × 290 = 870 NOK, not 350+320+290.
- **D-08:** This pricing-tier table must be the single server-side source of truth used both for the live client-side order summary (Phase 2) and the server-side recomputation at payment time (Phase 3, PAY-03) — never trust a client-submitted total.

#### Patch-liste

- **D-09:** Fixed patch options (checkbox, single or multi-select as appropriate): **Ligamerke** (matches the team's league — e.g. Premier League/Serie A badge), **Champions League-merke**, **Europa League/Conference League-merke**, plus **"Ingen"** (none).
- **D-10:** Patches are included in the base price — no extra cost, same principle as name+number personalization (GEN pricing stays flat per PROJECT.md's "lik pris for alle drakter" decision).

### Claude's Discretion

- Exact data structure/format for the static catalog config (e.g. TypeScript const objects vs. Supabase seed tables) — implementation detail, not discussed with user.
- Admin account creation mechanism (manually created Supabase Auth user, no signup flow) — not explicitly discussed this session; follow STACK.md's recommendation (single manually-created admin, no public signup) unless the user specifies otherwise before planning.
- Exact RLS policy wording/structure — follows ARCHITECTURE.md's recommended shape (public insert restricted appropriately, admin-only read/update via service role or authenticated admin role).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. Admin-account discussion (exact login credentials) was intentionally not opened this session; flagged under Claude's Discretion above to follow STACK.md's default unless the user raises it before planning.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIN-01 | Eier kan logge inn i et admin-panel (én fast admin-bruker) | Supabase Auth email+password with a single manually-created admin user; `@supabase/ssr` cookie-based session; `getUser()`-based middleware + layout auth gate on `/admin/*` — see Architecture Patterns 1 & 2, Code Examples, and Security Domain sections |
</phase_requirements>

## Summary

Phase 1 is a walking-skeleton foundation phase: scaffold a Next.js 16 App Router project deployed to Vercel, wire up Supabase (Postgres + Auth), build the full `orders` / `order_items` / `order_status_history` / notification-log schema with RLS from day one (even though later phases populate it), gate a real `/admin` route behind Supabase Auth with one manually-created admin user, and define the static league/team/season catalog plus the pricing-tier table as loadable TypeScript config. Nothing customer-facing beyond the admin login is built here — Phase 2 builds the storefront on top of this catalog, Phase 3 builds checkout on top of this schema.

The core technical risk in this phase is not "does Supabase Auth work" (it's a well-trodden path) — it's getting the **schema shape right the first time**, particularly the `UNIQUE(provider, provider_ref)` idempotency guard and RLS policies, since Phase 3/4 build directly on top of these without revisiting them. Getting RLS wrong (e.g., allowing public read on `orders`) is a real customer-PII leak, not just a bug. The other genuine gotcha is that `@supabase/ssr` has evolved past the `getUser()`-only guidance CLAUDE.md/STACK.md describe — Supabase now also offers `getClaims()` for cheaper local JWT verification — but CLAUDE.md explicitly locks in `getUser()` for server-side route protection, which is followed here as a project constraint, not a research recommendation.

**Primary recommendation:** Use `create-next-app` with the new (Next.js 16) TypeScript + Tailwind v4 + App Router + Turbopack defaults; use the Supabase CLI for local Postgres + migrations + generated types from the start (not the dashboard SQL editor) so the schema is versioned in git; enable RLS on every table in the same migration that creates it; and treat the static catalog as plain TypeScript modules under `config/`, not Supabase tables, per the Claude's Discretion note in CONTEXT.md.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Admin authentication (login, session) | Frontend Server (SSR) | Database (Supabase Auth) | Supabase Auth issues/validates the session; Next.js middleware/Server Components enforce the gate before rendering `/admin/*` |
| Orders / order_items / order_status_history schema | Database / Storage | API / Backend | Postgres is the single source of truth; no phase-1 API surface writes to it yet (that's Phase 3/4), but the schema + RLS must exist now |
| Idempotency guard (`UNIQUE(provider, provider_ref)`) | Database / Storage | — | Must be a hard DB constraint, not application-level dedup — this is what Phase 3/4's webhook handlers rely on |
| Notification/idempotency log (webhook event dedup) | Database / Storage | — | Same rationale — a `processed_webhook_events` (or equivalent) table with a unique constraint on the provider event ID |
| Static league/team/season catalog | Browser / Client (read) | Frontend Server (SSR, imports at build/render time) | Plain TS config bundled with the app — no DB round-trip needed for read-only, low-churn reference data |
| Pricing-tier table | Frontend Server (SSR) / API | Browser / Client (display only) | Must be a single server-side-importable source of truth (per D-08) — client Order Builder in Phase 2 imports the same function/table for live display, but Phase 3's server-side checkout recomputation is the authoritative caller |
| RLS policy enforcement | Database / Storage | — | Enforced at the Postgres level regardless of which app layer queries it — defense-in-depth even though only server code touches `orders` in this project |

## Project Constraints (from CLAUDE.md)

These are locked directives from the project's CLAUDE.md and MUST be honored by the plan:

- **Framework:** Next.js 16.x, App Router only (Pages Router forbidden for new code).
- **Language:** TypeScript 5.x/6.x across the whole app — no untyped JS files.
- **Styling:** Tailwind CSS 4.x.
- **Backend:** Supabase (Postgres, Auth, RLS) — `@supabase/ssr` for cookie-based session handling, `@supabase/supabase-js` for the client SDK. Do **not** use the deprecated `@supabase/auth-helpers-nextjs`.
- **Admin auth:** Supabase Auth email+password, exactly **one** manually-created admin user (dashboard or one-off seed script) — **no public sign-up flow**, ever.
- **Auth verification method:** Protect `/admin/*` using `supabase.auth.getUser()` in Next.js middleware/Server Components — **never** trust `getSession()` alone in server code (CLAUDE.md is explicit and unambiguous on this point; see Open Questions for the `getClaims()` nuance).
- **RLS:** Enabled on `orders` (and `order_items`, by extension) — "public can insert, only authenticated admin can read/update all orders" is the documented target shape.
- **Order status:** Modeled as a Postgres **enum** (`pending`, `paid`, `confirmed`, `shipped`), not free text.
- **Money:** No float-based currency — CLAUDE.md's payment section implies integer minor-unit storage (øre) is expected practice for this domain; ARCHITECTURE.md confirms `amount_total_ore integer`.
- **What NOT to use (explicit forbids):** Pages Router; public sign-up/multi-tenant admin scaffolding; client-side-only order fulfillment (not relevant to Phase 1 directly, but the schema must not make this easy later).
- **GSD workflow:** All file-changing work must go through a GSD command (`/gsd-execute-phase` etc.) — not a research constraint per se, but noted since it governs how this phase's plan will actually be executed.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.10 [VERIFIED: npm registry] | Full-stack framework (storefront + admin + API routes) | Confirmed current on npm; App Router + Turbopack is the stable default for new projects as of Next.js 16 [CITED: nextjs.org/blog/next-16] |
| `react` / `react-dom` | 19.2.x (bundled by `create-next-app@latest`) [ASSUMED — not independently pinned/verified via npm view in this session] | UI runtime | Required peer of Next.js 16; version compatibility documented in STACK.md |
| `typescript` | 6.0.3 [VERIFIED: npm registry] | Type safety | CLAUDE.md requires TypeScript across the whole app, explicitly for payment/webhook-adjacent code correctness |
| `tailwindcss` | 4.3.2 [VERIFIED: npm registry] | Styling | CSS-first config (`@theme` directive), no `tailwind.config.js` needed, automatic content detection [CITED: tailwindcss.com/docs/guides/nextjs] |
| `@supabase/supabase-js` | 2.110.0 [VERIFIED: npm registry] | Supabase client SDK | Official SDK, required for both server (service-role) and browser (anon-key) clients |
| `@supabase/ssr` | 0.12.0 [VERIFIED: npm registry] | Cookie-based session handling in Next.js Server Components/Route Handlers/middleware | Official replacement for the deprecated `@supabase/auth-helpers-nextjs` [CITED: supabase.com/docs/guides/auth/server-side/nextjs] — **note:** STACK.md cites "0.9.x", but the registry-current version is 0.12.0; the API used below (`createServerClient`, `createBrowserClient`) has been stable across this range, no breaking change affects this phase's usage |

**Version note:** STACK.md's version pins (e.g. `@supabase/ssr` 0.9.x, TypeScript 5.x) were written earlier in the research cycle and are slightly stale relative to the registry-verified numbers above. Use the versions in this table (verified 2026-07-07) when scaffolding — they are drop-in compatible with the patterns STACK.md and ARCHITECTURE.md describe.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.4.3 [VERIFIED: npm registry] | Runtime validation | Not strictly required for Phase 1 (no user-facing form yet), but reasonable to add now if the static catalog config is validated at load time (Claude's Discretion — optional, low cost) |
| `supabase` CLI | latest (via `npx supabase` or global install) [ASSUMED — not version-pinned; CLI is typically used unpinned] | Local Postgres, migrations, generated TS types | Use from the very first commit: `supabase init`, `supabase start` (local Docker Postgres stack), `supabase migration new <name>`, `supabase db push` (remote), `supabase gen types typescript --local > lib/supabase/types.ts` [CITED: supabase.com/docs/guides/local-development] |
| `@types/node`, `@types/react` | matches `create-next-app@latest` defaults | Type definitions | Installed automatically by `create-next-app` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase CLI migrations (git-versioned SQL) | Dashboard SQL Editor (ad hoc) | Dashboard edits are not reproducible/versioned and will drift from what Phase 3/4 expect — CONTEXT.md's canonical refs assume a schema Phase 3/4 can rely on, so migrations-in-git is the only defensible choice for a foundation phase |
| Plain TS config for catalog (`config/leagues-teams-seasons.ts`) | Supabase tables for catalog | ARCHITECTURE.md explicitly recommends static config over DB tables at this volume/churn rate — revisit only if catalog needs owner-editable self-service later (post-v1 trigger) |
| `getUser()` for middleware auth check | `getClaims()` (newer, JWT-local, no network call) | `getClaims()` is faster (no network round-trip) and is Supabase's newer recommended default for high-traffic middleware checks, but CLAUDE.md explicitly locks `getUser()` for this project — at <50 orders/month and a single admin, the network-call cost of `getUser()` is immaterial, so there's no practical reason to deviate from the locked constraint |

**Installation:**
```bash
npx create-next-app@latest . --typescript --tailwind --app --turbopack --eslint --import-alias "@/*"
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase   # Supabase CLI as a dev dependency (or use npx supabase directly)
npm install zod           # optional, if validating catalog config at load
```

**Version verification:** Confirmed 2026-07-07 via `npm view <pkg> version`: `next@16.2.10`, `@supabase/supabase-js@2.110.0`, `@supabase/ssr@0.12.0`, `typescript@6.0.3`, `tailwindcss@4.3.2`, `zod@4.4.3`.

## Package Legitimacy Audit

`slopcheck` (Python, `pip3 install slopcheck --break-system-packages`) was successfully installed and run against every package this phase installs, using `slopcheck scan --pkg npm <name> --json`.

| Package | Registry | slopcheck | Disposition |
|---------|----------|-----------|-------------|
| `next` | npm | OK | Approved |
| `react` | npm | OK | Approved |
| `react-dom` | npm | OK | Approved |
| `typescript` | npm | OK | Approved |
| `tailwindcss` | npm | OK | Approved |
| `@supabase/supabase-js` | npm | OK | Approved |
| `@supabase/ssr` | npm | OK | Approved |
| `zod` | npm | OK | Approved |
| `date-fns` | npm | OK (flagged `NO_REPO` info-level) | Approved — not used in Phase 1, kept here for reference since STACK.md lists it for later phases; no source repo linked in registry metadata but package is extremely well-known, info-level only, not a block |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No packages required an [ASSUMED] fallback tag for this phase — all were verified both via `npm view` and `slopcheck scan` against the correct (npm) ecosystem registry.

## Architecture Patterns

### System Architecture Diagram (Phase 1 scope only)

```
┌────────────────────────────────────────────────────────────────┐
│                    Browser (Admin only, Phase 1)                 │
│   /admin/login  →  email+password form  →  POST to Supabase Auth │
└───────────────────────────┬──────────────────────────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────────┐
│              Next.js 16 App (Vercel, App Router)                 │
│                                                                    │
│  middleware.ts                                                    │
│    └─ updateSession() — refreshes/validates cookie session        │
│       via supabase.auth.getUser() on every request to /admin/*    │
│                                                                    │
│  app/(admin)/admin/layout.tsx                                     │
│    └─ server-side re-check: getUser() → redirect to /admin/login  │
│       if no valid user                                            │
│                                                                    │
│  app/(admin)/admin/page.tsx  (placeholder dashboard, walking      │
│       skeleton — proves the auth gate + one real DB read work)    │
│                                                                    │
│  config/leagues-teams-seasons.ts, config/pricing-tiers.ts         │
│    └─ static TS modules, imported directly (no network call)      │
└───────────────────────────┬──────────────────────────────────────┘
                             ▼ (service-role or RLS-scoped client)
┌────────────────────────────────────────────────────────────────┐
│                Supabase (Postgres + Auth + RLS)                   │
│                                                                    │
│  auth.users            — 1 manually-created admin row             │
│  public.orders                  (RLS: public insert only via      │
│  public.order_items              service-role in later phases;    │
│  public.order_status_history     admin-authenticated read/update) │
│  public.notification_log / processed_webhook_events               │
│    (UNIQUE(provider, provider_ref) idempotency guard)             │
└────────────────────────────────────────────────────────────────┘
```

A reader can trace: admin submits login form → middleware/layout validate via `getUser()` → on success, admin dashboard renders and performs one real Supabase read (walking-skeleton slice) → schema underneath is fully provisioned with RLS even though no customer-facing writes happen yet in this phase.

### Recommended Project Structure

```
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx        # server-side auth guard (getUser check + redirect)
│   │       ├── page.tsx          # placeholder dashboard — walking-skeleton DB read
│   │       └── login/
│   │           └── page.tsx      # email+password form, calls a server action
│   ├── layout.tsx
│   └── page.tsx                  # public placeholder landing page (walking skeleton)
├── lib/
│   └── supabase/
│       ├── client.ts             # browser client (createBrowserClient)
│       ├── server.ts             # server client (createServerClient, cookies())
│       ├── middleware.ts         # updateSession() helper
│       └── types.ts              # generated via `supabase gen types typescript`
├── config/
│   ├── leagues-teams-seasons.ts  # static catalog: leagues, teams, current season
│   └── pricing-tiers.ts          # bundle discount tiers (D-05..D-08), single source of truth
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20260707000000_init_schema.sql   # orders, order_items, order_status_history,
│                                             # processed_webhook_events, RLS policies
├── middleware.ts                 # top-level, delegates to lib/supabase/middleware.ts
└── .env.local                    # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
                                   # SUPABASE_SERVICE_ROLE_KEY (server-only, never exposed to client)
```

### Pattern 1: Three-client Supabase setup for Next.js App Router

**What:** Separate `createBrowserClient` (client components), `createServerClient` (Server Components/Route Handlers, cookie-bound), and a service-role client (webhook/admin-privileged server code only) — never share one client across trust boundaries.
**When to use:** Always, in any Next.js App Router + Supabase project.
**Example:**
```typescript
// lib/supabase/server.ts — Source: pattern per https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // called from a Server Component — safe to ignore if middleware refreshes sessions
          }
        },
      },
    }
  )
}
```

### Pattern 2: Middleware-based session refresh + `getUser()` gate

**What:** `middleware.ts` calls a helper that creates a request-scoped Supabase client, calls `supabase.auth.getUser()` (per CLAUDE.md's explicit lock — never `getSession()` alone in server code), and redirects unauthenticated requests to `/admin/login` before any `/admin/*` page renders.
**When to use:** Every request matching `/admin/:path*`.
**Example:**
```typescript
// middleware.ts — Source: pattern per https://supabase.com/docs/guides/auth/server-side/nextjs
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/admin/:path*'],
}
```
```typescript
// lib/supabase/middleware.ts (updateSession) — calls getUser(), redirects if null,
// per CLAUDE.md: "never trust getSession() alone in server code"
const { data: { user } } = await supabase.auth.getUser()
if (!user && request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  return NextResponse.redirect(url)
}
```

### Pattern 3: RLS with a `is_admin()` security-definer helper (or direct `auth.uid()` check)

**What:** Enable RLS on `orders`/`order_items`/`order_status_history`/`processed_webhook_events`; write an admin-read/write policy that checks the authenticated user matches the single known admin, and an insert policy scoped to the service-role context (i.e., no public/anon insert policy at all — order creation only ever happens server-side via the service-role key in Phase 3/4, bypassing RLS by design).
**When to use:** From the very first migration.
**Example:**
```sql
-- Source: pattern per https://supabase.com/docs/guides/database/postgres/row-level-security
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.processed_webhook_events enable row level security;

-- Only the authenticated admin can read/update orders.
-- No INSERT policy is defined for anon/authenticated roles — order rows are
-- only ever created by server code using the service_role key (Phase 3/4
-- webhook handlers), which bypasses RLS entirely and intentionally.
create policy "admin can read all orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = '00000000-0000-0000-0000-000000000000'); -- replace with actual admin user id, or a lookup

create policy "admin can update orders"
  on public.orders for update
  to authenticated
  using (auth.uid() = '00000000-0000-0000-0000-000000000000');
```

**Important nuance (verified):** "Adding `service_role` in RLS policies does nothing" — a client authenticated with the service-role key **always bypasses RLS**, regardless of policies defined [CITED: supabase.com/docs/guides/database/postgres/row-level-security via WebSearch cross-verification]. This means: (1) do not write a policy targeting `service_role` expecting it to restrict that key — restriction of the service-role key is an application-code discipline (never expose it to the client), not an RLS concern; (2) the admin policies above only govern the `authenticated` (anon-key-but-logged-in) role, which is what the `/admin` panel's server actions should generally use in later phases — reserve the service-role client for the payment webhooks specifically.

### Anti-Patterns to Avoid
- **Editing schema via the Supabase Dashboard SQL Editor as the source of truth:** Creates schema drift no later phase's migrations can build on cleanly. Use `supabase migration new` + `supabase db push` from day one, per ARCHITECTURE.md's git-versioned-schema expectation.
- **Defining a public/anon INSERT policy on `orders` "for later phases to use":** Phase 3/4's own research (ARCHITECTURE.md, PITFALLS.md Pitfall 1/6) is explicit that orders are only ever created from a verified server-side webhook handler using the service-role key — a public insert policy is unnecessary attack surface and directly contradicts ORDER-01. Phase 1 should NOT create this policy even preemptively.
- **Skipping RLS "because there's no data yet":** CONTEXT.md's success criterion #2 explicitly requires RLS policies to exist as part of this phase's definition of done, not deferred to Phase 3.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing/storage for the admin login | Custom bcrypt/argon2 + sessions table | Supabase Auth (built-in email+password provider) | CLAUDE.md explicitly mandates this; hand-rolled auth is a well-known high-risk-surface mistake for exactly one credential pair that guards all customer PII |
| Session/cookie refresh logic | Custom JWT refresh middleware | `@supabase/ssr`'s `createServerClient` + `updateSession()` pattern | Handles httpOnly cookie sync between middleware/Server Components correctly; this is fiddly to get right by hand (well-documented class of bugs around Next.js server/client cookie boundaries) |
| Schema versioning / drift tracking | Manual "remember what I changed" discipline | Supabase CLI migrations (`supabase migration new`, `supabase db push`) + `supabase gen types typescript` | Guarantees the TypeScript types used in later phases' code never silently drift from the actual deployed schema |
| Idempotency dedup logic in application code | A custom "have I seen this order before" cache/lookup | A `UNIQUE(provider, provider_ref)` Postgres constraint (+ a `UNIQUE` event-id constraint on the webhook-event log) | Database-level uniqueness constraints are atomic and race-condition-proof in a way that any application-level check-then-insert is not, especially under retried/concurrent webhook delivery (see PITFALLS.md Pitfall 2) |

**Key insight:** Phase 1's entire job is to put the *hard-to-retrofit* primitives in place correctly once (auth, RLS, unique constraints, typed schema) so that Phases 2-5 are pure feature work on top of a trustworthy foundation — every one of the "don't hand-roll" items above is specifically flagged in PITFALLS.md as a class of bug that's expensive to fix after orders/payments are live, and cheap to get right now while there's no real data.

## Common Pitfalls

### Pitfall 1: Building the schema without the idempotency guard from day one
**What goes wrong:** Phase 3/4 needs `UNIQUE(provider, provider_ref)` on `orders` and a unique constraint on a processed-webhook-events table to make webhook handling safely idempotent (per ARCHITECTURE.md Pattern 2 and PITFALLS.md Pitfall 2). If Phase 1 ships a schema without these, Phase 3 either has to do a disruptive migration on a semi-live table or — worse — someone builds application-level dedup instead, which is the exact anti-pattern research explicitly warns against.
**Why it happens:** Phase 1 has no actual webhook code yet, so it's tempting to defer the constraint "until it's needed."
**How to avoid:** Add `UNIQUE (provider, provider_ref)` on `orders` and a `processed_webhook_events` (or `notification_log`) table with a unique constraint on the provider's event ID, in the very first migration — this is explicitly CONTEXT.md's success criterion #3.
**Warning signs:** A migration file for `orders` that doesn't include a `UNIQUE` constraint spanning `provider` + a provider-reference column.

### Pitfall 2: RLS policies that accidentally allow public read of `orders`/`order_items`
**What goes wrong:** A permissive policy (e.g., `using (true)` left over from testing, or a policy scoped to `anon` instead of `authenticated`) exposes customer name/email/address to any unauthenticated visitor via the public Supabase REST/PostgREST endpoint.
**Why it happens:** RLS policy syntax is easy to get subtly wrong (role scoping, `using` vs `with check`, forgetting `to authenticated`), and there's no data yet in Phase 1 to make a leak "visible" during testing.
**How to avoid:** Explicitly scope every policy `to authenticated` (never leave role unscoped, which defaults to `public` = anyone including anon); write a quick verification query using the anon key from a test script and confirm it returns zero rows from `orders` even after a manual test insert.
**Warning signs:** A policy without an explicit `to <role>` clause; a policy using `using (true)`.

### Pitfall 3: Confusing `getSession()` and `getUser()` in the auth guard
**What goes wrong:** `getSession()` reads the JWT from cookies without revalidating against the Auth server — it can return a stale/tampered session in server code. Using it as the actual authorization gate (rather than just `getUser()`) means a forged or stale cookie could pass the check.
**Why it happens:** `getSession()` is synchronous/cheaper and shows up first in a lot of tutorials and even some of Supabase's own older example code (flagged as a real, ongoing doc-inconsistency issue in the Supabase GitHub repo, not just a hypothetical).
**How to avoid:** Follow CLAUDE.md's explicit instruction: use `supabase.auth.getUser()` for the actual protection check in both `middleware.ts` and the `admin` layout's server-side re-check. `getSession()` may still be read for the token itself if needed, but never as the authorization decision.
**Warning signs:** Any `if (session) { ...allow access... }` check where `session` came from `getSession()` rather than the `user` object from `getUser()`.

### Pitfall 4: Treating the static catalog as trivial and skipping structure planning
**What goes wrong:** Ad hoc nested objects/arrays for leagues → teams → seasons without a consistent shape make Phase 2's Order Builder (PROD-01) harder to render generically, and make adding "current season" rollover (next year, teams get a new season) a manual find-and-replace across the codebase rather than a config change in one place.
**Why it happens:** It's "just static data," so it's tempting to hardcode without a schema/type.
**How to avoid:** Define TypeScript types/interfaces for `League`, `Team`, `Season` up front (even though the data itself is not user-editable in v1), and keep "current season" as a single exported value/config point (e.g., `CURRENT_SEASON = "2025/26"`) that all team entries reference, not a hardcoded string repeated per team.
**Warning signs:** Season strings duplicated inline for every team instead of derived from one constant.

### Pitfall 5: Environment variable / service-role key exposure
**What goes wrong:** Accidentally prefixing the service-role key with `NEXT_PUBLIC_`, or importing a service-role client into a file that's part of a Client Component bundle, ships the all-access key to every visitor's browser.
**Why it happens:** Next.js's `NEXT_PUBLIC_` convention is easy to reach for out of habit, and Next.js doesn't error at build time if a server-only module gets bundled client-side unless using the `server-only` package.
**How to avoid:** Name the key `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix); add the `server-only` npm package import at the top of any file that constructs a service-role client, so an accidental client-side import fails the build loudly instead of shipping the key.
**Warning signs:** Any `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` env var name; a service-role client constructed in a file without `'use server'` or without a `server-only` import guard.

## Code Examples

### Supabase browser client
```typescript
// lib/supabase/client.ts — Source: pattern per https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Service-role client (server-only, webhook/admin-privileged code)
```typescript
// lib/supabase/service-role.ts
import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // never NEXT_PUBLIC_-prefixed
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

### Pricing-tier single source of truth (D-05..D-08)
```typescript
// config/pricing-tiers.ts
// Whole-order unit pricing, per D-07: 3 jerseys = 3 x 290, NOT 350+320+290.
export const PRICING_TIERS = [
  { minQty: 1, maxQty: 1, unitPriceOre: 35000 },  // 350 NOK
  { minQty: 2, maxQty: 2, unitPriceOre: 32000 },  // 320 NOK
  { minQty: 3, maxQty: Infinity, unitPriceOre: 29000 }, // 290 NOK
] as const

export function getUnitPriceOre(quantity: number): number {
  const tier = PRICING_TIERS.find(t => quantity >= t.minQty && quantity <= t.maxQty)
  if (!tier) throw new Error(`No pricing tier for quantity ${quantity}`)
  return tier.unitPriceOre
}

export function getOrderTotalOre(quantity: number): number {
  return getUnitPriceOre(quantity) * quantity
}
```
This module is imported by both Phase 2's client-side cart display and Phase 3's server-side checkout recomputation (D-08) — it must live in `config/` or `lib/pricing/`, importable from both a Client Component (for display) and a Route Handler (for authoritative recomputation), with no server-only dependencies inside it.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Deprecated in favor of `@supabase/ssr`, no longer receiving features [CITED: supabase.com/docs] | Do not install or reference the old package |
| `getSession()` as the server-side auth gate | `getUser()` (revalidates against Auth server) | Long-documented Supabase guidance | CLAUDE.md already encodes this correctly — no deviation needed |
| Tailwind v3 `tailwind.config.js` content-path config | Tailwind v4 CSS-first `@theme` config, automatic content detection | Tailwind v4 release | No config file needed for basic setup; simpler scaffold |

**Emerging, not yet a hard requirement:** Supabase's `getClaims()` API (introduced to avoid a network round-trip on every `getUser()` call, verifying the JWT locally via cached JWKS for projects using asymmetric signing keys) is now Supabase's own recommended default for high-traffic middleware checks [MEDIUM confidence, WebSearch cross-verified across supabase.com/docs/reference/javascript/auth-getclaims and community sources, not independently confirmed via Context7 in this session]. This project's CLAUDE.md explicitly locks `getUser()`, and at single-admin/<50-orders-a-month volume the performance difference is immaterial — flagged here only so the planner/discuss-phase knows this is a deliberate, documented deviation from Supabase's newest guidance, not an oversight.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `react`/`react-dom` versions bundled by `create-next-app@latest` are 19.2.x | Standard Stack | Low — `create-next-app` always installs a compatible React version automatically; not independently pinned in this research |
| A2 | Supabase CLI has no meaningful version-pinning concern (used via `npx supabase` or as an unpinned dev dependency) | Standard Stack | Low — CLI commands used (`init`, `start`, `migration new`, `db push`, `gen types`) have been stable across recent CLI versions |
| A3 | `getClaims()` is Supabase's newer recommended default for middleware, superseding blanket `getUser()`-everywhere guidance | State of the Art | Low — this is explicitly flagged as an aside, not adopted; CLAUDE.md's `getUser()` lock is followed regardless of whether this claim is fully accurate |

## Open Questions

1. **Should the admin auth check use `getUser()` everywhere, or `getClaims()` in middleware + `getUser()` only for high-trust actions?**
   - What we know: CLAUDE.md explicitly locks `getUser()` for server-side `/admin/*` protection. Supabase's newer docs suggest `getClaims()` for middleware (cheaper, local JWT verification) and reserve `getUser()` for cases needing guaranteed-fresh server state.
   - What's unclear: Whether the CLAUDE.md instruction was written with `getClaims()` in mind and rejected it, or predates its prominence in Supabase's docs.
   - Recommendation: Follow CLAUDE.md as written (`getUser()` everywhere in the auth gate) for Phase 1 — it is correct, just not maximally optimized, and at this volume the tradeoff is irrelevant. Do not silently substitute `getClaims()`; if the owner wants the optimization later, that's a deliberate, separate decision.

2. **Exact admin-account creation mechanism (dashboard vs. seed script)?**
   - What we know: CONTEXT.md flags this as Claude's Discretion, defaulting to STACK.md's "manually create one Supabase Auth user" via dashboard or one-off script.
   - What's unclear: Whether the project owner wants a repeatable seed script (useful if the Supabase project is ever recreated) or a pure one-time dashboard action (simpler, less code to maintain).
   - Recommendation: A small one-off seed script (`scripts/seed-admin.ts`, not run automatically, documented as a manual command) is slightly more robust for environment recreation (e.g., new Supabase project for staging) without meaningfully increasing scope — but a plain dashboard-created user is also fully acceptable and is what CLAUDE.md's example phrasing leans toward. Either is fine for the planner to choose; flag as a low-stakes implementation detail.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Next.js dev/build | ✓ (npm confirmed functional in this session) | npm 11.9.0 | — |
| Supabase CLI | Local Postgres, migrations, type generation | Not verified in this sandboxed research session (no Docker daemon check performed) | — | If Docker/local Supabase stack isn't available on the target dev machine, fall back to a hosted Supabase free-tier project for all local development (slower iteration, but fully functional) — document this fallback in the plan's Wave 0 if `supabase start` fails |
| Docker | Required by `supabase start` for the local Postgres/Auth/Storage stack | Not verified in this session | — | Same fallback as above — develop directly against a hosted Supabase dev project |
| Vercel CLI / account | Deployment target (mentioned in phase description as part of MVP walking-skeleton "dev deployment") | Not verified in this session — assumed available since it's the user's stated existing deployment target | — | If unavailable, `next dev` locally still satisfies the "one real UI interaction" walking-skeleton requirement; Vercel deploy can be a follow-up task within the same phase rather than a blocker |

**Missing dependencies with no fallback:** none identified — all external dependencies have a documented fallback path.

**Missing dependencies with fallback:** Supabase CLI/Docker local stack (fallback: hosted Supabase project), Vercel deploy (fallback: defer actual `vercel deploy` to end of phase, local dev still proves the walking skeleton).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none detected — greenfield project, no test framework installed yet |
| Config file | none — see Wave 0 |
| Quick run command | n/a until Wave 0 installs a framework |
| Full suite command | n/a until Wave 0 installs a framework |

Given this is a walking-skeleton/foundation phase with heavy emphasis on schema + auth correctness (not business logic yet), recommend **Vitest** for unit-level tests (pricing-tier function, catalog config shape) — lightweight, fast, standard pairing with Next.js/Turbopack projects, no need for a heavier framework like Jest given the App Router + Turbopack stack. RLS policy correctness is better verified via a scripted integration check (a small Node script using the anon key attempting forbidden reads/writes and asserting they're rejected) rather than a unit test — Postgres RLS behavior isn't meaningfully unit-testable without a real database.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | Admin can log in with the single fixed account; unauthenticated requests to `/admin/*` redirect to login | integration/manual | Manual: attempt `/admin` unauthenticated → expect redirect; log in with seeded credentials → expect access. No automated E2E framework installed in Phase 1 (Playwright/E2E is reasonable to defer to a later phase or Wave 0 gap below) | ❌ Wave 0 |
| (schema) `UNIQUE(provider, provider_ref)` guard | Duplicate insert with same `provider`+`provider_ref` is rejected by Postgres | integration | A small Vitest/Node script inserting two rows with identical `(provider, provider_ref)` via the service-role client and asserting the second insert throws a unique-violation (`23505`) | ❌ Wave 0 |
| (schema) RLS restricts anon access | Anon-key client cannot SELECT/INSERT/UPDATE `orders` | integration | Script using the anon key attempting a read/write against `orders`, asserting zero rows / permission error | ❌ Wave 0 |
| (catalog) Static catalog loadable | `config/leagues-teams-seasons.ts` and `config/pricing-tiers.ts` import without error and match expected shape (5 leagues, correct tier boundaries) | unit | `vitest run config/*.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** run the relevant Vitest file / manual auth check for the task just completed.
- **Per wave merge:** full `vitest run` + the RLS integration script.
- **Phase gate:** All of the above green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Install Vitest (`npm install -D vitest`) and a minimal `vitest.config.ts` — no test framework exists yet.
- [ ] `scripts/verify-rls.ts` (or `tests/rls.integration.test.ts`) — anon-key negative-access checks against `orders`/`order_items`/`order_status_history`.
- [ ] `tests/idempotency.integration.test.ts` — duplicate `(provider, provider_ref)` insert rejection check.
- [ ] `config/pricing-tiers.test.ts`, `config/leagues-teams-seasons.test.ts` — shape/tier-boundary unit tests.
- [ ] No automated E2E (Playwright) framework installed for the login-redirect flow in Phase 1 — acceptable to verify manually this phase; flag for a later phase if E2E coverage becomes a priority (Phase 5 admin panel is the natural point to revisit, given it builds substantially more admin UI).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth email+password, single admin account, `getUser()`-based server-side verification (per CLAUDE.md) |
| V3 Session Management | yes | `@supabase/ssr` cookie-based session, httpOnly cookies managed via `createServerClient`, session refresh via `middleware.ts` |
| V4 Access Control | yes | Postgres RLS policies scoping `orders`/`order_items`/`order_status_history`/`processed_webhook_events` to the authenticated admin only; no public insert policy in Phase 1 |
| V5 Input Validation | yes (limited scope this phase) | `zod` recommended for any config-loading validation; full form input validation belongs to Phase 2's order builder, not this phase |
| V6 Cryptography | n/a this phase | No custom cryptography — password hashing delegated entirely to Supabase Auth; do not hand-roll |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| RLS policy misconfiguration exposing customer PII (orders table readable by anon) | Information Disclosure | Explicit `to authenticated` role scoping on every policy; no `using (true)`; verified via a scripted anon-key negative-access test (see Validation Architecture) |
| Service-role key leaked to client bundle | Information Disclosure / Elevation of Privilege | `server-only` import guard on any file constructing a service-role client; env var never prefixed `NEXT_PUBLIC_` |
| Stale/forged session accepted via `getSession()` instead of `getUser()` | Spoofing | CLAUDE.md-mandated `getUser()` for all server-side auth checks (middleware + admin layout) |
| Missing idempotency guard allowing duplicate order rows later (schema-level root cause, though exploited in Phase 3/4) | Tampering / Repudiation | `UNIQUE(provider, provider_ref)` constraint established now, in Phase 1's initial migration, per CONTEXT.md success criterion #3 |

## Sources

### Primary (HIGH confidence)
- `npm view <pkg> version` — direct registry queries for `next`, `@supabase/supabase-js`, `@supabase/ssr`, `typescript`, `tailwindcss`, `zod`, run 2026-07-07
- `slopcheck scan --pkg npm <name> --json` — package legitimacy verification for every dependency listed above, run 2026-07-07
- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — App Router/Turbopack default status
- [Supabase Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy shape, service-role bypass behavior
- [Supabase server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` setup pattern, `getUser()` guidance
- [Supabase local development overview](https://supabase.com/docs/guides/local-development/overview) — CLI migration/type-generation workflow

### Secondary (MEDIUM confidence)
- [Supabase getClaims reference](https://supabase.com/docs/reference/javascript/auth-getclaims) and community discussion (WebSearch, cross-verified across supabase.com/docs and GitHub issues) — `getClaims()` vs `getUser()` nuance, flagged as an Open Question, not adopted over the CLAUDE.md lock
- [Tailwind CSS + Next.js setup guide](https://tailwindcss.com/docs/guides/nextjs) — v4 CSS-first config confirmation, cross-verified with WebSearch summaries of `create-next-app` defaults

### Tertiary (LOW confidence)
- None — all findings above were cross-verified against at least one official/authoritative source or a direct tool check (`npm view`, `slopcheck`) in this session.

### Reused from existing project research (not re-verified in this session, carried forward as-is)
- `.planning/research/ARCHITECTURE.md` — schema shape, RLS shape, idempotency pattern, Data Store Shape section
- `.planning/research/PITFALLS.md` — Pitfall 1, 2, 6 (order/webhook/pricing pitfalls, relevant as forward-looking context for schema design even though webhooks aren't built until Phase 3/4)
- `.planning/research/STACK.md` — original stack recommendation and installation list (version numbers refreshed in this document)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions independently verified via `npm view` and `slopcheck` in this session
- Architecture: HIGH — schema/RLS/auth patterns confirmed against official Supabase docs and cross-checked with existing project ARCHITECTURE.md research
- Pitfalls: HIGH for RLS/auth/idempotency pitfalls (directly sourced from official docs + existing PITFALLS.md research); MEDIUM for the `getClaims()`-vs-`getUser()` nuance (flagged explicitly as not fully resolved, deferred to CLAUDE.md's lock)

**Research date:** 2026-07-07
**Valid until:** ~30 days (stable stack — Next.js/Supabase/Tailwind move at a moderate pace; re-verify package versions if planning is delayed more than a month)
