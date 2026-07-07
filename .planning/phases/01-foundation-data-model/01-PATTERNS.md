# Phase 1: Foundation & Data Model - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 13 (new; 0 modified)
**Analogs found:** 0 / 13 — **greenfield repository, no prior application code exists**

## Codebase Status

Verified via `find` from repo root (excluding `.git`, `node_modules`): the working directory contains only `.git`, `.claude/`, `.mcp.json`, `.planning/`, and `CLAUDE.md`. There is no `app/`, `lib/`, `config/`, `supabase/`, `package.json`, or any prior source file. **This phase creates the first application code in the project** — there is nothing in-repo to copy patterns from.

Per the pattern-mapping brief for greenfield projects, this document does not invent analogs. Instead it maps each planned file directly to the concrete code excerpts already vetted in RESEARCH.md (`.planning/phases/01-foundation-data-model/01-RESEARCH.md`) and ARCHITECTURE.md (`.planning/research/ARCHITECTURE.md`), which the planner should treat as the "closest analog" source for this phase only. Every subsequent phase (2-5) SHOULD instead point back to files created in this phase as real in-repo analogs.

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|-----------------|---------------|
| `lib/supabase/client.ts` | provider (Supabase browser client factory) | request-response | none (greenfield) | research-pattern |
| `lib/supabase/server.ts` | provider (Supabase server client factory) | request-response | none (greenfield) | research-pattern |
| `lib/supabase/middleware.ts` | middleware | request-response | none (greenfield) | research-pattern |
| `lib/supabase/service-role.ts` | provider (privileged Supabase client) | request-response | none (greenfield) | research-pattern |
| `lib/supabase/types.ts` | model (generated types) | n/a (generated) | none (greenfield) | research-pattern |
| `middleware.ts` (root) | middleware | request-response | none (greenfield) | research-pattern |
| `app/(admin)/admin/layout.tsx` | route (server auth guard) | request-response | none (greenfield) | research-pattern |
| `app/(admin)/admin/page.tsx` | route (placeholder dashboard) | CRUD (read) | none (greenfield) | research-pattern |
| `app/(admin)/admin/login/page.tsx` | route (login form) | request-response | none (greenfield) | research-pattern |
| `config/pricing-tiers.ts` | utility (pure pricing function) | transform | none (greenfield) | research-pattern |
| `config/leagues-teams-seasons.ts` | model (static catalog config) | transform | none (greenfield) | research-pattern |
| `supabase/migrations/<ts>_init_schema.sql` | migration | batch (DDL) | none (greenfield) | research-pattern |
| `scripts/seed-admin.ts` (optional, Claude's Discretion) | utility (one-off script) | batch | none (greenfield) | research-pattern |

## Pattern Assignments

### `lib/supabase/server.ts` (provider, request-response)

**Source:** RESEARCH.md "Pattern 1: Three-client Supabase setup", lines 229-255. No in-repo analog exists.

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

**Notes for planner:** This is the canonical `createServerClient` cookie-bridge pattern. Every Server Component / Route Handler / Server Action reading or writing to `orders` as the authenticated admin should call this factory. Do not share this instance across requests (server-scoped per invocation, per Supabase's own guidance).

---

### `lib/supabase/client.ts` (provider, request-response)

**Source:** RESEARCH.md "Code Examples > Supabase browser client", lines 366-376. No in-repo analog exists.

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

**Notes for planner:** Only for Client Components (e.g. the login form submit handler, if implemented client-side rather than as a Server Action). Phase 1's login flow can likely avoid needing this at all if the login form uses a Server Action exclusively — flag as an open implementation choice, not a hard requirement.

---

### `lib/supabase/service-role.ts` (provider, request-response)

**Source:** RESEARCH.md "Code Examples > Service-role client", lines 378-391. No in-repo analog exists.

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

**Critical constraint (RESEARCH.md Pitfall 5):** Must import `server-only` at the top so an accidental client-bundle import fails the build loudly. Env var must never be prefixed `NEXT_PUBLIC_`. This client is not used for reads/writes in Phase 1 itself (no order writes yet), but should exist now since Phase 3/4 webhook handlers depend on it and RESEARCH.md's "Don't Hand-Roll" table flags this as a foundational primitive to establish early.

---

### `lib/supabase/middleware.ts` + root `middleware.ts` (middleware, request-response)

**Source:** RESEARCH.md "Pattern 2: Middleware-based session refresh + getUser() gate", lines 262-284. No in-repo analog exists.

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

**Hard constraint (CLAUDE.md, RESEARCH.md Pitfall 3):** MUST use `supabase.auth.getUser()`, never `getSession()`, as the actual authorization decision. This is a project-locked constraint, not a suggestion — do not substitute `getClaims()` even though Supabase's newer docs recommend it for middleware (see RESEARCH.md Open Question 1).

---

### `app/(admin)/admin/layout.tsx` (route, request-response — server auth guard)

**Source:** RESEARCH.md "System Architecture Diagram" + "Pattern 2", lines 168-172, 257-284. No in-repo analog exists.

**Core pattern (to be authored, no direct excerpt given in research — synthesize from Pattern 2):**
```typescript
// app/(admin)/admin/layout.tsx — server-side re-check per RESEARCH.md architecture diagram
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }
  return <>{children}</>
}
```

**Notes for planner:** This is a defense-in-depth re-check layered on top of `middleware.ts` — RESEARCH.md's architecture diagram explicitly calls for both the middleware gate AND a server-side re-check in the layout. Do not treat middleware alone as sufficient.

---

### `config/pricing-tiers.ts` (utility, transform)

**Source:** RESEARCH.md "Code Examples > Pricing-tier single source of truth (D-05..D-08)", lines 393-413. No in-repo analog exists. **This is a fully verbatim, ready-to-use excerpt already validated against D-05 through D-08.**

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

**Constraint (D-08):** Must be importable from both a Client Component (Phase 2 live order-summary display) and server-side Route Handler code (Phase 3 authoritative recomputation) — no server-only dependency inside this module. Do not add `import 'server-only'` here (that's for `service-role.ts` only).

---

### `config/leagues-teams-seasons.ts` (model, transform)

**Source:** No verbatim excerpt in RESEARCH.md; RESEARCH.md Pitfall 4 (lines 351-355) and ARCHITECTURE.md's structure rationale (lines 97-99, 107) constrain the shape. No in-repo analog exists — this file's exact data content (5 leagues, full rosters, national teams) must be authored fresh.

**Required shape (synthesized from Pitfall 4's explicit guidance):**
```typescript
// config/leagues-teams-seasons.ts
export const CURRENT_SEASON = '2025/26' as const

export interface Team {
  id: string
  name: string
  // home/away kit availability implied by D-04 — no historical seasons
}

export interface League {
  id: string
  name: string
  teams: Team[]
}

export const LEAGUES: League[] = [
  // Premier League, Eliteserien, LaLiga, Serie A, Bundesliga — per D-01/D-02
]

export const NATIONAL_TEAMS: Team[] = [
  // Norway + major football nations — per D-03
]
```

**Critical constraint (Pitfall 4):** Season must be a single exported constant (`CURRENT_SEASON`) referenced by all entries, never duplicated inline per team — this is explicitly flagged as a warning sign to avoid.

---

### `supabase/migrations/<timestamp>_init_schema.sql` (migration, batch/DDL)

**Source:** ARCHITECTURE.md "Data Store Shape" (lines 236-283) for table shape; RESEARCH.md "Pattern 3: RLS with is_admin() / auth.uid() check" (lines 286-313) for RLS. No in-repo analog exists.

**Schema shape excerpt (ARCHITECTURE.md lines 241-282):**
```
orders
  id, provider, provider_ref, status, customer_name, customer_email,
  amount_total_ore integer, currency default 'NOK', tracking_number,
  created_at, updated_at
  UNIQUE (provider, provider_ref)     -- idempotency guard

order_items
  id, order_id fk, league, team, season, size, patches text[],
  custom_name, custom_number, unit_price_ore, quantity

order_status_history
  id, order_id fk, status, note, created_at

processed_webhook_events / notification_log
  id, order_id fk, channel, event, status, error, created_at
  -- UNIQUE constraint on provider event id, per RESEARCH.md Pitfall 1
```

**RLS excerpt (RESEARCH.md lines 291-311):**
```sql
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

**Hard constraints (RESEARCH.md Anti-Patterns + Pitfalls 1-2):**
1. `status` MUST be a Postgres enum (`pending`/`paid`/`confirmed`/`shipped` per CLAUDE.md — note ARCHITECTURE.md's diagram uses `received`/`confirmed`/`shipped` as text; CLAUDE.md's enum values take precedence, planner should reconcile and pick CLAUDE.md's explicit set).
2. `UNIQUE (provider, provider_ref)` must be present in this very first migration — not deferred.
3. Do NOT create a public/anon INSERT policy on `orders` — explicitly forbidden even preemptively.
4. Every RLS policy must have an explicit `to authenticated` clause — never `using (true)`, never unscoped (defaults to `public` role = includes anon).
5. Money stored as `amount_total_ore integer` (øre, no floats).

---

### `scripts/seed-admin.ts` (utility, batch — optional per Claude's Discretion)

**Source:** RESEARCH.md Open Question 2 (lines 440-443). No concrete code excerpt provided in research; no in-repo analog exists. Planner/implementer should author this as a one-off Node script using `@supabase/supabase-js` with the service-role key to call `supabase.auth.admin.createUser()` — not run automatically, documented as a manual command. Treat as low-stakes; a dashboard-created user is equally acceptable per RESEARCH.md.

## Shared Patterns

### `getUser()`-only auth verification (never `getSession()`)
**Source:** RESEARCH.md Pitfall 3, CLAUDE.md (locked constraint)
**Apply to:** `middleware.ts`, `lib/supabase/middleware.ts`, `app/(admin)/admin/layout.tsx` — every place that decides whether a request is an authenticated admin.
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) { /* deny / redirect */ }
```

### `server-only` import guard for privileged clients
**Source:** RESEARCH.md Pitfall 5, Code Examples (lines 378-391)
**Apply to:** `lib/supabase/service-role.ts` exclusively. Never apply this pattern to `lib/supabase/client.ts`.

### RLS: explicit `to authenticated`, no public insert on `orders`
**Source:** RESEARCH.md Pattern 3 + Anti-Patterns, ARCHITECTURE.md Pattern 2
**Apply to:** The single init migration — governs all four tables (`orders`, `order_items`, `order_status_history`, `processed_webhook_events`).

### Money as integer øre, never float
**Source:** CLAUDE.md, ARCHITECTURE.md Data Store Shape
**Apply to:** `orders.amount_total_ore`, `order_items.unit_price_ore`, `config/pricing-tiers.ts`'s `unitPriceOre` fields — consistent integer-minor-unit convention across schema and config.

### Idempotency via DB unique constraint, not app-level dedup
**Source:** RESEARCH.md Pitfall 1, "Don't Hand-Roll" table
**Apply to:** `orders` (`UNIQUE(provider, provider_ref)`) and the webhook-event log table — this phase only needs the constraints to exist; Phase 3/4 will write the code that relies on them.

## No Analog Found

All 13 files in this phase have no in-repo analog — this is expected and documented, not a gap. Rationale: this is the first phase of a greenfield project (confirmed via filesystem scan: only `.git`, `.claude/`, `.mcp.json`, `.planning/`, `CLAUDE.md` exist prior to this phase). RESEARCH.md and ARCHITECTURE.md's Code Examples/Pattern sections substitute for in-repo analogs throughout this document, as instructed.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| all 13 files listed above | various | various | No prior application source code exists in this repository — nothing to reuse or extend |

**Recommendation for subsequent phases:** Phase 2's pattern-mapper SHOULD find real in-repo analogs (e.g. `config/pricing-tiers.ts` as the analog for any new pure-function config module; `lib/supabase/server.ts` as the analog for any new server-side Supabase read) since Phase 1 will have established the first concrete patterns.

## Metadata

**Analog search scope:** Entire repository root (excluding `.git`, `node_modules` — neither exists yet)
**Files scanned:** 5 pre-existing files (`.mcp.json`, `CLAUDE.md`, and 3 `.planning/` markdown files) — none are application code
**Pattern extraction date:** 2026-07-07
**Extraction source:** `.planning/phases/01-foundation-data-model/01-RESEARCH.md` (primary), `.planning/research/ARCHITECTURE.md` (schema/RLS shape)
