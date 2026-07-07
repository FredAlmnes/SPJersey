# Phase 1: Foundation & Data Model - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the technical foundation everything else depends on: Supabase schema (orders, order_items, order_status_history, notification/idempotency log) with RLS, single admin auth, and the static catalog/pricing config (league/team/season, patches, pricing tiers) that Phase 2's storefront will read. No customer-facing UI is built in this phase beyond the admin login gate. Covers requirement ADMIN-01.

</domain>

<decisions>
## Implementation Decisions

### Katalog-innhold (leagues/teams/seasons)

- **D-01:** v1 leagues: Premier League, Eliteserien, LaLiga, Serie A, Bundesliga.
- **D-02:** All teams within each of those 5 leagues are selectable (not a curated subset) — full league rosters, easier to maintain and avoids leaving out a team a customer wants.
- **D-03:** National teams included: Norway plus major football nations (e.g. Brazil, France, Germany, Spain, England, Argentina, and similar World Cup/Euro-caliber teams).
- **D-04:** Only the current season is selectable per team (home/away kit for the current season) — no historical/retro seasons in v1.

### Prisstruktur (pricing tiers)

- **D-05:** Base price per jersey: **350 NOK**.
- **D-06:** Bundle discount uses 3 tiers by quantity in a single order:
  - 1 jersey → 350 NOK/unit
  - 2 jerseys → 320 NOK/unit
  - 3+ jerseys → 290 NOK/unit
- **D-07:** These per-unit prices apply to the whole order quantity (not marginal/incremental pricing) — e.g. 3 jerseys = 3 × 290 = 870 NOK, not 350+320+290.
- **D-08:** This pricing-tier table must be the single server-side source of truth used both for the live client-side order summary (Phase 2) and the server-side recomputation at payment time (Phase 3, PAY-03) — never trust a client-submitted total.

### Patch-liste

- **D-09:** Fixed patch options (checkbox, single or multi-select as appropriate): **Ligamerke** (matches the team's league — e.g. Premier League/Serie A badge), **Champions League-merke**, **Europa League/Conference League-merke**, plus **"Ingen"** (none).
- **D-10:** Patches are included in the base price — no extra cost, same principle as name+number personalization (GEN pricing stays flat per PROJECT.md's "lik pris for alle drakter" decision).

### Claude's Discretion

- Exact data structure/format for the static catalog config (e.g. TypeScript const objects vs. Supabase seed tables) — implementation detail, not discussed with user.
- Admin account creation mechanism (manually created Supabase Auth user, no signup flow) — not explicitly discussed this session; follow STACK.md's recommendation (single manually-created admin, no public signup) unless the user specifies otherwise before planning.
- Exact RLS policy wording/structure — follows ARCHITECTURE.md's recommended shape (public insert restricted appropriately, admin-only read/update via service role or authenticated admin role).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & requirements
- `.planning/PROJECT.md` — core value, constraints, out-of-scope boundaries
- `.planning/REQUIREMENTS.md` — ADMIN-01 (this phase) plus full v1 requirement set for downstream awareness
- `.planning/ROADMAP.md` §Phase 1 — phase goal and success criteria this phase must satisfy

### Research (informs schema/architecture choices for this phase)
- `.planning/research/STACK.md` — Next.js/Supabase/RLS/auth recommendations, Stripe/Vipps/WhatsApp stack decisions
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flow, schema shape (orders/order_items/order_status_history/notification_log), `UNIQUE(provider, provider_ref)` idempotency guard
- `.planning/research/PITFALLS.md` — payment-webhook and idempotency pitfalls this schema must be designed to prevent from day one
- `.planning/research/SUMMARY.md` — synthesized findings and phase build-order rationale

</canonical_refs>

<code_context>
## Existing Code Insights

Greenfield project — no existing codebase yet. Nothing to reuse or integrate with; this phase establishes the first patterns everything else follows.

</code_context>

<specifics>
## Specific Ideas

- Base price: 350 NOK/jersey flat.
- Bundle pricing: 1×350, 2×320/unit, 3+×290/unit (whole-order unit pricing, not marginal).
- Leagues: Premier League, Eliteserien, LaLiga, Serie A, Bundesliga — all teams in each.
- National teams: Norway + major football nations.
- Current season only (no retro/historical seasons).
- Patches: Ligamerke, Champions League, Europa League/Conference League, Ingen — all included in base price, no upcharge.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Admin-account discussion (exact login credentials) was intentionally not opened this session; flagged under Claude's Discretion above to follow STACK.md's default unless the user raises it before planning.

</deferred>

---

*Phase: 1-Foundation & Data Model*
*Context gathered: 2026-07-07*
