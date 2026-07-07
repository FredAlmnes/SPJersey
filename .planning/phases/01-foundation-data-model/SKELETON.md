# Walking Skeleton — SpJersey

**Phase:** 1
**Generated:** 2026-07-07

## Capability Proven End-to-End

The store owner can log in at `/admin/login` with the single fixed admin account and land on a protected `/admin` dashboard that performs a real, RLS-scoped Postgres read against the live `orders` table — proving scaffold → routing → Supabase Auth → RLS-protected DB access all work together on a deployed/local-runnable stack.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.2.x, App Router, Turbopack, TypeScript 6.x | Locked by CLAUDE.md/STACK.md; one app serves storefront + `/admin` + future webhook Route Handlers; native Vercel deploy |
| Styling | Tailwind CSS 4.x (CSS-first, no `tailwind.config.js`) | Locked by CLAUDE.md; `create-next-app` default |
| Data layer | Supabase (Postgres 15/16) via Supabase CLI migrations in git | Relational orders/line-items model + RLS; schema versioned so Phase 3/4 build on a stable contract (no dashboard-editor drift) |
| DB access | Three-client split: `createBrowserClient` (client), `createServerClient` (SSR, cookie-bound), service-role client (`server-only`) | Never share a client across trust boundaries; service-role reserved for Phase 3/4 webhooks |
| Auth | Supabase Auth email+password, ONE manually-seeded admin, no public sign-up ever; server-side gate via `supabase.auth.getUser()` in both middleware and admin layout | Locked by CLAUDE.md; `getSession()` forbidden as an authorization decision |
| Money | Integer øre only (`amount_total_ore`, `unit_price_ore`, `unitPriceOre`) — no floats | Payment-domain correctness; locked by CLAUDE.md/ARCHITECTURE.md |
| Order status | Postgres enum `pending` \| `paid` \| `confirmed` \| `shipped` | Locked by CLAUDE.md (takes precedence over ARCHITECTURE.md's text values) |
| Idempotency | Hard DB constraint `UNIQUE(provider, provider_ref)` on `orders` + unique provider-event-id on `processed_webhook_events` — established day one | Race-safe dedup Phase 3/4 rely on; retrofitting onto a live table is disruptive |
| Static catalog | Plain TypeScript modules under `config/` (not DB tables) | Read-only, low-churn reference data; no DB round-trip; single `CURRENT_SEASON` constant |
| Pricing | `config/pricing-tiers.ts` — single server-importable source of truth (D-05..D-08), whole-order unit pricing | Same module feeds Phase 2 client display AND Phase 3 authoritative server recomputation; never trust client total |
| Deployment target | Vercel (dev/preview) with a documented `supabase start` + `next dev` full-stack local run as the guaranteed fallback | STACK.md target; local run proves the skeleton even if Vercel/Docker unavailable |
| Directory layout | `app/(admin)/admin/*`, `lib/supabase/*`, `config/*`, `supabase/migrations/*`, `scripts/*`, `tests/*` | Per RESEARCH.md recommended structure |
| Test runner | Vitest (installed Wave 0) | Lightweight, fast, standard with Next.js/Turbopack; RLS/idempotency via scripted integration tests, unit tests for pricing/catalog |

## Stack Touched in Phase 1

- [x] Project scaffold (Next.js 16, Turbopack build, ESLint, Vitest test runner)
- [x] Routing — real routes `/`, `/admin/login`, `/admin`
- [x] Database — real WRITE (seed-admin creates `auth.users` row via service role; integration tests insert into `orders`; login writes a session) AND real READ (admin dashboard RLS-scoped `orders` query)
- [x] UI — interactive login form wired to a server action that calls Supabase Auth
- [x] Deployment — Vercel dev/preview OR documented `supabase start` + `next dev` full-stack run command (README)

## Out of Scope (Deferred to Later Slices)

- Any customer-facing storefront UI (order builder is Phase 2)
- Any order-writing code paths / webhook handlers (Phase 3/4 — schema exists now, but nothing writes `orders` in app code this phase except tests/seed)
- WhatsApp / email notification sending (Phase 4/5 — `processed_webhook_events`/notification-log table exists, unused)
- Admin order list/detail/confirm/track UI (Phase 5 — dashboard is a placeholder proving the auth+DB slice only)
- Playwright / browser E2E framework (deferred to Phase 5; login redirect verified manually + via auth integration test this phase)
- Public sign-up, password reset, multi-admin roles (permanently out of v1 scope)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Customer configures + previews a full custom-jersey order (reads `config/` catalog + pricing)
- Phase 3: Customer pays (Stripe/Vipps); order row created only by verified idempotent webhook (uses `UNIQUE(provider, provider_ref)` + service-role client)
- Phase 4: Paid order relayed to China contact on WhatsApp exactly once (uses `processed_webhook_events`)
- Phase 5: Owner manages order lifecycle (list/confirm/track) + customer/owner emails, full Norwegian/NOK
