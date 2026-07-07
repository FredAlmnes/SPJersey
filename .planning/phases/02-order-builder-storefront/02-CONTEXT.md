# Phase 2: Order Builder & Storefront - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the customer-facing order builder/storefront: a configurator where a customer picks league/team/season, size, patches, and name+number, adds one or more jerseys to a cart, sees a live order summary with automatic bundle pricing, and reads a short explainer near checkout about what happens after payment. No payment integration is built in this phase (Phase 3) — the phase ends at "ready to check out." Covers requirements PROD-01 through PROD-07.

</domain>

<decisions>
## Implementation Decisions

### Multi-drakt-flyt (cart behavior)

- **D-11:** Customer builds a cart — configure one jersey, add it to the cart, then start configuring the next. Not a repeating form, not single-jersey-per-order.
- **D-12:** Jerseys already in the cart can be fully re-opened and edited (all fields pre-filled), not just removed and re-added from scratch.
- **D-13:** The cart/order summary is a persistent panel shown alongside the configurator at all times (sticky side panel on desktop, collapses to a bottom summary on mobile) — not a separate cart page/step.

### Skjema-struktur (form structure)

- **D-14:** The configurator is a single page/form (league → team → season → size → patches → name/number), not a multi-step wizard.
- **D-15:** League → team → season selection is cascading/dependent (team list filters by league, season list filters by team) — matches the existing shape of `config/leagues-teams-seasons.ts`. Invalid combinations are structurally impossible, not caught by validation after the fact.
- **D-16:** The cart panel (D-13) is visible from the very first moment on the same page as the form — not something that only appears after the first "add to cart."

### Størrelsesguide (size guide, PROD-06)

- **D-17:** No real size chart/measurements exist yet from the China contact. Build a standard placeholder football-jersey size table (S/M/L/XL/XXL/3XL with chest/length cm measurements), clearly labeled as a placeholder the owner can swap out later. Not a blocker for this phase.
- **D-18:** Size guide is shown via a modal/popover triggered by a link/icon next to the size selector — not permanently inline.
- **D-19:** Selectable sizes: standard adult S–3XL only. No kids' sizes in v1 (matches PROJECT.md's adult-focused scope; revisit only if the owner explicitly asks to add a kids' line).

### Navn/nummer-validering (name/number validation, PROD-04)

- **D-20:** Name: max 12 characters, allowing letters (including Norwegian æøå and other international letters), spaces, and hyphens (for double-barreled names).
- **D-21:** Number: valid range 0–99, integers only (no decimals, no negative numbers).
- **D-22:** Name and number are both optional per jersey — a customer can order a plain jersey with no print. Validation only runs on non-empty input.
- **D-23:** Validation feedback appears live (on blur/change), not only on form submission — matches PROD-05's "live" feel already established for the order summary.

### Claude's Discretion

- Exact visual layout/styling of the cart side panel and mobile collapse behavior — implementation detail, follow existing Tailwind conventions from Phase 1's admin UI.
- Exact wording of the post-payment explainer text (PROD-07) — draft Norwegian copy consistent with PROJECT.md's tone; owner can revise later.
- Whether size guide numbers use metric-only or also include a rough garment-size correspondence (e.g., "fits like a regular L t-shirt") — draft reasonable placeholder content since it's explicitly a placeholder (D-17).
- State management approach for the cart (client state vs. persisted somewhere) — technical implementation detail for research/planning to resolve, not discussed with user.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & requirements
- `.planning/PROJECT.md` — core value, constraints, Norwegian-only/NOK-only v1 scope
- `.planning/REQUIREMENTS.md` — PROD-01..PROD-07 (this phase) plus full v1 requirement set for downstream awareness
- `.planning/ROADMAP.md` §Phase 2 — phase goal and success criteria this phase must satisfy

### Prior phase context (Phase 1 established these — reuse, don't re-decide)
- `.planning/phases/01-foundation-data-model/01-CONTEXT.md` — pricing tiers (D-05..D-08), catalog content (D-01..D-04), patch list (D-09..D-10) decisions this phase's UI must reflect exactly
- `config/pricing-tiers.ts` — single source of truth for bundle pricing math; the live order summary (PROD-05) MUST import and use this, not reimplement pricing logic
- `config/leagues-teams-seasons.ts` — league/team/season catalog data structure for the cascading selectors (D-15)
- `config/patches.ts` — fixed patch list for the patch checkboxes (D-09/D-10)

### Research (informs schema/architecture choices for this phase)
- `.planning/research/STACK.md` — Next.js/Tailwind/shadcn recommendations
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `config/pricing-tiers.ts`, `config/leagues-teams-seasons.ts`, `config/patches.ts` — all built in Phase 1 with unit tests; this phase's UI is a consumer of these, not a redefiner.
- `lib/supabase/client.ts` — browser Supabase client factory, available if any client-side data fetching is needed (unlikely for this phase since catalog data is static config, not DB-backed).

### Established Patterns
- Next.js 16 App Router with Tailwind 4 (Phase 1 scaffold) — storefront routes should follow the same App Router conventions as the existing `app/(admin)/admin/*` routes.
- TypeScript strict typing and Zod validation are the established convention (per CLAUDE.md) — name/number validation (D-20/D-21) should use Zod schemas consistent with how Phase 1 validated inputs.

### Integration Points
- The storefront's final cart state (jerseys + total price) is what Phase 3 will read to create a Stripe/Vipps Checkout Session — this phase does not need to build that handoff, but the cart data shape should be planner-friendly for Phase 3 to consume.

</code_context>

<specifics>
## Specific Ideas

- Cart-based flow: configure → add to cart → repeat → persistent side panel showing all jerseys and running total with bundle discount applied live.
- Single-page cascading form (league→team→season locks down invalid combos structurally).
- Size guide is a placeholder table (S–3XL, cm measurements) shown in a modal, swappable later with real data from the China contact.
- Name print: max 12 chars, letters+space+hyphen, optional. Number print: 0–99 integer, optional. Both validate live on blur/change.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Kids' sizes (raised implicitly as an alternative in the size-selection question) was decided against for v1 (D-19), not deferred as a separate idea, since it wasn't something the user proposed adding.

</deferred>

---

*Phase: 2-Order Builder & Storefront*
*Context gathered: 2026-07-07*
