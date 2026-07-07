# Project Research Summary

**Project:** SpJersey
**Domain:** Norwegian custom football-jersey dropshipping storefront (solo operator, <50 orders/month, card + Vipps payment, automated WhatsApp order relay to a China supplier contact)
**Researched:** 2026-07-07
**Confidence:** MEDIUM-HIGH overall (stack, architecture, and pitfalls are well-grounded in official docs and established patterns; two decisions — Vipps integration path and WhatsApp API path — remain open and need an explicit owner choice before Phase 1 build work starts)

## Executive Summary

SpJersey is a low-volume, made-to-order e-commerce storefront that replaces an existing manual WhatsApp-ordering business with a self-service web flow: a customer picks a league/team/season, size, a small fixed set of patches, and name+number personalization, pays via card (Stripe) or Vipps, and the paid order is automatically relayed via WhatsApp to a fixed China-based supplier contact. A single admin (the store owner) then manually confirms the order once the supplier responds and later adds a tracking number, each action triggering a customer email. This is a well-understood category — the architecture is a standard **webhook-driven order pipeline** (payment provider is the sole source of truth for "paid"; the order row and all downstream side-effects are created only from a verified webhook, never from a client redirect), built on Next.js (App Router) + Supabase (Postgres/Auth/RLS) + Vercel, which is the path of least resistance given the user's own proposed stack and matches how comparable custom-apparel/dropshipping stores are built in 2026.

The single biggest technical risk is not the storefront UX (that's straightforward CRUD/form work) but the **payment-to-notification chain**: any order creation or WhatsApp send triggered by anything other than a signed, idempotent webhook handler risks phantom orders, duplicate supplier notifications (the most costly failure mode here — a human in China acts on every message received), or silently-failed WhatsApp sends because business-initiated messages require a pre-approved template outside the 24-hour session window. A second real risk is that neither Stripe/Vipps production payments nor WhatsApp Business messaging can go live without a business-verification/certification process (KYC for Vipps, Meta Business verification + template approval for WhatsApp) that takes days to weeks and is entirely outside the owner's technical control — this administrative track must start on day one, in parallel with coding, not after the code is "done."

Two decisions are flagged as needing the owner's input before detailed roadmap planning: (1) whether Stripe's native (private-preview) Vipps support is accessible on the owner's account, which would collapse payments into a single integration versus two independent ones; and (2) confirming the WhatsApp Cloud API (direct via Meta) as the notification mechanism, since it requires Meta Business verification and a pre-approved message template. Both are flagged as parallel administrative/spike tracks that should start as early as possible rather than blocking the rest of development.

## Key Findings

### Recommended Stack

Full details in [STACK.md](./STACK.md). The recommended stack largely confirms the user's own proposal: **Next.js 16 (App Router) on Vercel**, **Supabase (Postgres + Auth + RLS)** as the single backend, **TypeScript** and **Zod** throughout (critical for money-handling code), **Tailwind + shadcn/ui** for storefront and admin UI, **Stripe Checkout** for card payments, **Resend + react-email** for transactional customer emails, and **WhatsApp Cloud API (Meta, direct)** for the automated supplier notification. A single Next.js app serves the public storefront, the admin panel, and all payment/messaging webhook handlers — no separate backend service is justified at this scale.

**Core technologies:**
- Next.js 16 (App Router): storefront + admin + API/webhook routes in one codebase, native Vercel deploy
- Supabase (Postgres + Auth + RLS): relational order/line-item data, single-admin auth, DB-enforced access control
- Stripe Checkout + webhooks: card payments; fulfillment must happen in `checkout.session.completed` webhook, never on client redirect
- WhatsApp Cloud API (Meta direct): cheapest, most controllable path for a single fixed recipient; requires Meta Business verification + pre-approved template
- Resend + react-email: transactional emails (order confirmed, tracking added), generous free tier well covers volume

**Two open decisions flagged in STACK.md, needing owner action before Phase 1:**
- **Vipps:** check whether Stripe's native Vipps support (private preview, `vipps_preview=v1`) is enabled on the account; if not, fall back to the direct Vipps ePayment API (well-documented, HIGH confidence, but requires org number + a 1–3 week certification/checklist process with Vipps — start this in parallel early).
- **WhatsApp:** confirm Meta Cloud API direct as the mechanism (recommended); Twilio WhatsApp API is a viable fallback if the owner wants a managed BSP relationship instead of direct Meta verification. `wa.me` deep links are explicitly NOT sufficient as the sole mechanism (no server-side trigger).

### Expected Features

Full details in [FEATURES.md](./FEATURES.md). The feature set in PROJECT.md is essentially already right-sized — research confirms nearly the full P1 list is table stakes for this product category, with almost nothing that should be cut further.

**Must have (table stakes) — P1:**
- Structured league/team/season picker, size selection, fixed patch checklist, name+number fields with validation
- Live order summary with automatic bundle/quantity pricing recalculation
- Stripe (card) + Vipps payment — Vipps absence would read as "not a real Norwegian store"
- Automatic WhatsApp hand-off to supplier on successful payment (the core value proposition)
- Admin login, order list, "mark confirmed" and "add tracking" actions with corresponding customer emails
- Norwegian language, NOK pricing throughout

**Should have (differentiators, add early since cheap):**
- Automatic bundle pricing (removes manual price negotiation, industry data shows 15–25% AOV lift from visible tiered pricing)
- Fixed short patch list (deliberately simpler than free-text competitors — reduces order errors)
- "What happens after you pay" explainer copy near checkout (near-zero cost, high trust payoff)
- Size guide / fit chart (cheap, reduces the #1 cause of custom-apparel support issues)

**Defer (v2+):**
- Customer accounts/order history, multi-language/multi-currency, per-team dynamic pricing, real-time carrier tracking, multi-admin roles, and any automated parsing of the supplier's WhatsApp replies (explicitly and correctly out of scope — free-text human replies are unreliable to parse and risk misleading customers).

### Architecture Approach

Full details in [ARCHITECTURE.md](./ARCHITECTURE.md). The system is a single Next.js app with three route groups — `(storefront)`, `(admin)`, and `api/` — backed by Supabase Postgres. The core architectural rule, repeated across both ARCHITECTURE.md and PITFALLS.md, is **payment-first, order-second**: the order row is created only when a signed, idempotent payment webhook confirms money has moved, never when the customer submits the form or reaches checkout. Cart data is held transiently in the payment session's metadata (Stripe) or a short-lived staging table (Vipps) until the webhook fires.

**Major components:**
1. **Order Builder (storefront)** — collects league/team/season/size/patches/name+number, computes bundle price client-side for display only (never trusted as the charged amount)
2. **Checkout/Payment layer + Webhooks** — creates payment sessions; a single choke-point function (`lib/orders/createFromPayment.ts`) is called by both Stripe and Vipps webhook handlers to idempotently create the order + trigger the WhatsApp/email side effects
3. **Admin panel** — auth'd owner view (Supabase Auth, single manually-created user) for order list, "mark confirmed," and "add tracking" actions, each triggering a customer email
4. **Notification layer** — WhatsApp (Cloud API, server-triggered only, never client-triggered) and transactional email (Resend), both invoked only from trusted server code
5. **Data store** — `orders`, `order_items`, `order_status_history`, and a `notification_log`/processed-events table for idempotency, with `UNIQUE(provider, provider_ref)` as the core dedup guard

### Critical Pitfalls

Full details in [PITFALLS.md](./PITFALLS.md). Ranked by cost of failure:

1. **Order created from the payment success redirect instead of the webhook** — customers closing the tab before redirect means payment succeeds but no order/WhatsApp message is ever created, or refreshes/double-fires create duplicates. Fix: webhook is the *only* writer; redirect page only reads.
2. **Duplicate WhatsApp sends from webhook retries** — Stripe/Vipps retry on any non-2xx/timeout; if the WhatsApp send isn't idempotent, the China contact gets the same order 2-3x, causing real duplicate production/shipping. Fix: dedupe on event ID + a `whatsapp_sent_at` guard, and don't block the webhook response on the WhatsApp HTTP call.
3. **WhatsApp message silently fails due to 24h session-window/template rules** — since the business always initiates (supplier never messages first), every notification must be a pre-approved Utility template, not free-form text; unchecked API responses can make the owner believe a message sent when it didn't. Fix: pre-approved template, explicit delivery-status checking.
4. **Vipps/Stripe production gated behind business verification that takes longer than expected** — KYC/certification is separate from and can outlast the coding effort; must start in parallel with day-one development, not after checkout is built.
5. **Bundle pricing trusted from the client** — the charged amount must always be recomputed server-side from the authoritative tier table at checkout-session-creation time; never trust a client-submitted total.
6. **Solo operator misses a new order silently** — no automatic escalation between "paid" and "confirmed" means an order can stall for days unnoticed; owner-facing notifications and a staleness indicator should be in the admin panel's initial scope, not deferred.

A secondary, non-technical flag: selling reproductions of officially-licensed club crests via an unlicensed manufacturer is a known risk category for this product type (payment-processor account risk, not just legal) — worth the owner's conscious awareness, not something for this roadmap to resolve.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation & Data Model
**Rationale:** Everything else (storefront, admin, payments) depends on the Supabase schema, auth setup, and static catalog config existing first; this is also where the parallel administrative tracks (Vipps merchant onboarding, Stripe business activation, Meta Business verification) should be *kicked off* even though the phase's coding work is small.
**Delivers:** Supabase project + `orders`/`order_items`/`order_status_history`/`notification_log` schema with RLS policies, single admin auth user, static league/team/season/pricing-tier config, Next.js project scaffold with route groups.
**Addresses:** Underpins the structured product picker and admin login (FEATURES.md P1 items).
**Avoids:** Sets up the `UNIQUE(provider, provider_ref)` idempotency guard from day one (Pitfall 1/2), rather than retrofitting it later.

### Phase 2: Order Builder & Storefront
**Rationale:** The customer-facing configurator is independent of payment plumbing and can be built/tested with mock pricing before wiring in real checkout; also the natural place to build input validation and the live pricing preview, which research flags as cheap-but-critical (Pitfall 5, 6).
**Delivers:** League→team→season picker, size selection, fixed patch checklist, name+number fields with server-side validation and a pre-payment preview, live order summary with client-displayed bundle pricing (backed by the same tier logic that will later run server-side).
**Addresses:** FEATURES.md P1 table-stakes items (structured picker, size, patches, personalization, live summary) plus the cheap P2 wins (size guide, "what happens after payment" copy) if time allows.
**Uses:** Static `config/leagues-teams-seasons.ts` and `config/pricing-tiers.ts` from Phase 1.

### Phase 3: Payments — Checkout & Webhook-Driven Order Creation
**Rationale:** This is the highest-risk phase per PITFALLS.md and must be built with the payment-first/webhook-driven pattern as the architecture from day one, not retrofitted. It also depends on Phase 1's schema and Phase 2's order/pricing data shape.
**Delivers:** Stripe Checkout session creation (server-side, price recomputed from the tier table, never client-trusted), signed webhook handler with idempotent `createOrderFromPayment`, and — pending the Vipps decision spike — either Stripe's native Vipps flag or a parallel direct Vipps ePayment API integration.
**Implements:** `lib/orders/createFromPayment.ts` choke point, `UNIQUE(provider, provider_ref)` dedup, `order_status_history` writes.
**Avoids:** Pitfall 1 (redirect-driven order creation), Pitfall 2 (duplicate webhook sends), Pitfall 6 (client-trusted pricing).
**Note:** This phase's Vipps sub-track has a hard external dependency (certification lead time 1–3 weeks if native Stripe Vipps isn't available) — should be spiked/decided at the very start of this phase, with the option to soft-launch Stripe-only if Vipps approval lags.

### Phase 4: WhatsApp Supplier Notification
**Rationale:** Depends on Phase 3's webhook infrastructure existing (the notification is triggered from the same webhook handler) but has its own independent, slow external dependency (Meta Business verification + template approval) that should have been kicked off as early as Phase 1's administrative track.
**Delivers:** WhatsApp Cloud API integration sending a pre-approved Utility template with order details to the fixed supplier number, triggered server-side only from the payment webhook, decoupled from the webhook's response cycle (log-and-retry rather than inline blocking call) so a slow WhatsApp API never causes a webhook timeout/retry loop.
**Addresses:** The core differentiator/value proposition from FEATURES.md (automatic WhatsApp hand-off).
**Avoids:** Pitfall 2 (duplicate sends) and Pitfall 3 (silent template/session-window failures) — explicit test cases required: fire the same webhook twice and confirm one message; send cold (no prior inbound message) and confirm template delivery.

### Phase 5: Admin Panel — Order Management & Owner Notifications
**Rationale:** Can be built in parallel with/after Phase 3–4 since it consumes the same `orders` data but doesn't block the customer-facing payment flow; research strongly recommends owner-facing notifications and staleness escalation ship with this phase's initial scope rather than being deferred.
**Delivers:** Auth'd order list (default sorted to "needs attention"), "mark confirmed" and "add tracking number" actions each triggering a customer email (Resend), owner-facing new-order notification, and a staleness/escalation indicator for orders unconfirmed past ~24–48h.
**Addresses:** FEATURES.md P1 admin items and directly avoids Pitfall 7 (silent order stalls).

### Phase Ordering Rationale

- Foundation must come first because the schema/RLS/auth model is a dependency for every later phase, and the slowest external dependencies (Vipps KYC, Meta Business verification, Stripe business activation) have multi-day-to-multi-week lead times that should run in parallel with all subsequent coding — starting them in Phase 1 (even though the phase's own code is light) is the single highest-leverage sequencing decision from this research.
- Order Builder before Payments because the pricing/customization data shape needs to be settled before it's threaded through checkout session creation and the webhook's server-side price recomputation.
- Payments before WhatsApp because the notification is triggered from inside the payment webhook handler — there's no meaningful way to build/test the WhatsApp send without the webhook infrastructure existing first, even though the WhatsApp business-verification *paperwork* should have started much earlier.
- Admin Panel is architecturally independent of Payments/WhatsApp internals (it only reads/writes `orders`) and could in principle run in parallel, but is sequenced last here since it depends on real order data existing to be useful to test against, and its "critical" pieces (owner notification, staleness escalation) are cheap enough to not need dedicated early-phase risk-reduction the way payments and WhatsApp do.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Payments):** Needs a research-phase / spike specifically on the Vipps integration decision (Stripe native preview availability vs. direct ePayment API) before implementation — this is explicitly flagged as unresolved in STACK.md and has real timeline consequences (1–3 week certification if going direct).
- **Phase 4 (WhatsApp):** Needs a research-phase / spike on WhatsApp Cloud API template registration and Meta Business verification specifics — MEDIUM confidence in STACK.md/ARCHITECTURE.md, and the exact template-approval workflow and lead time should be confirmed early, in parallel with Phase 1–3 work, not discovered during Phase 4 itself.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** Supabase/Next.js/RLS setup is HIGH confidence, extensively documented by official sources.
- **Phase 2 (Order Builder):** Standard React/Next.js form + state patterns; no niche integration risk.
- **Phase 5 (Admin Panel):** Standard authenticated CRUD admin pattern using Supabase Auth/RLS; HIGH confidence, well-trodden pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH for framework/backend/email (Next.js, Supabase, Resend); MEDIUM for Stripe/Vipps integration pattern; MEDIUM-LOW for WhatsApp approach specifically because it depends on an owner decision, not a technical unknown |
| Features | MEDIUM | Corroborated across 3+ independent WebSearch sources per topic (custom-jersey configurators, POD fulfillment, bundle pricing), but this is a market/UX question without a single authoritative primary source |
| Architecture | HIGH for the core webhook-driven order pipeline (well-established, cross-verified pattern); MEDIUM specifically on WhatsApp Business API integration mechanics (template workflow, exact metadata limits) |
| Pitfalls | MEDIUM-HIGH | Payment webhook and WhatsApp API mechanics verified against official docs; Vipps approval timelines and licensed-merchandise risk are less precisely documented and flagged as such |

**Overall confidence:** MEDIUM-HIGH — the technical architecture and stack choices are solid and low-risk; the two genuine open questions (Vipps integration path, WhatsApp API path/verification timeline) are owner-decision/external-dependency gaps, not architectural gaps, and are already flagged with clear fallback options.

### Gaps to Address

- **Vipps integration path unresolved:** Owner must check the Stripe Dashboard for native Vipps availability (private preview) before Phase 3 planning locks in a single-vs-dual payment integration approach. Handle via a short spike at the start of Phase 3.
- **WhatsApp API path and Meta verification timeline unconfirmed:** Owner should begin Meta Business verification and template submission as early as possible (ideally Phase 1, in parallel with other work) since this is the least controllable, longest-lead-time external dependency in the whole project. Handle via an early research-phase / spike ahead of Phase 4.
- **Vipps test-environment gaps:** Card/Freestanding-card payments are not testable in Vipps' sandbox — full production behavior can only be confirmed with a real, small live transaction before relying on the date for launch. Flag this explicitly in Phase 3 planning as a pre-launch verification step, not just a coding task.
- **Licensed-merchandise risk (non-technical):** Not resolvable by this research process; recommend the owner explicitly acknowledge this known risk category for the replica-jersey dropshipping model before investing further in a public-facing, branded storefront — revisit only if a payment processor ever restricts the account.

## Sources

### Primary (HIGH confidence)
- Next.js 16 / App Router official docs — https://nextjs.org/docs/app/guides/upgrading/version-16
- Supabase Auth server-side guidance — https://supabase.com/docs/guides/auth/server-side/nextjs
- Stripe Checkout fulfillment/webhook best practices — https://docs.stripe.com/checkout/fulfillment, https://docs.stripe.com/webhooks
- Vipps ePayment API, Webhooks API, checklist — https://developer.vippsmobilepay.com/docs/APIs/epayment-api/, https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/, https://developer.vippsmobilepay.com/docs/APIs/epayment-api/checklist/
- WhatsApp Business Platform Node.js SDK / template reference — https://whatsapp.github.io/WhatsApp-Nodejs-SDK/

### Secondary (MEDIUM confidence)
- Stripe native Vipps support (private preview) — https://docs.stripe.com/payments/vipps (content HIGH, practical availability unconfirmed)
- WhatsApp Cloud API 2026 pricing and 24h template-window rules — cross-verified across multiple industry/BSP sources (uptail.ai, blueticks.co, chatarmin.com, Meta developer docs)
- Custom-jersey configurator and print-on-demand feature landscape — Custom Ink, owayo, spized, Printful, Printify, Shopify blog sources (feature research, MEDIUM across the board — market/UX question, not API question)
- Resend vs Postmark comparison — https://www.suprsend.com/post/resend-vs-postmark
- Mollie as a Vipps PSP alternative — https://docs.mollie.com/docs/vipps

### Tertiary (LOW confidence)
- Licensed-merchandise/IP risk framing for replica-jersey dropshipping — training-data knowledge, not independently re-verified; flagged as an awareness item only, not a resolved finding

---
*Research completed: 2026-07-07*
*Ready for roadmap: yes*
