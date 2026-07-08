# Roadmap: SpJersey

## Overview

SpJersey replaces a manual WhatsApp-ordering business with a self-service Norwegian storefront: a customer configures a custom jersey (league/team/season, size, patches, name+number), pays by card or Vipps, and the paid order is relayed automatically to the China supplier contact on WhatsApp — no manual step by the owner. The roadmap builds this in five phases: first the foundation (schema, auth, static catalog), then the customer-facing order builder, then the highest-risk payment/webhook pipeline, then the WhatsApp hand-off that is the product's core value proposition, and finally the admin panel that closes the loop with order management and customer/owner notifications.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Model** - Supabase schema, RLS, single admin auth, and static catalog config that every later phase depends on (completed 2026-07-07)
- [ ] **Phase 2: Order Builder & Storefront** - Customer can configure a full custom-jersey order with live, correct pricing
- [ ] **Phase 3: Payments — Checkout & Webhook-Driven Order Creation** - Customer can pay by card or Vipps and an order is created only from a verified, idempotent webhook
- [ ] **Phase 4: WhatsApp Supplier Notification** - Paid orders are automatically and duplicate-safely relayed to the China contact on WhatsApp
- [ ] **Phase 5: Admin Panel — Order Management & Notifications** - Owner can manage orders end-to-end (confirm, track) with customer/owner notifications, fully in Norwegian/NOK

## Phase Details

### Phase 1: Foundation & Data Model

**Mode:** mvp
**Goal**: The technical foundation exists so every later phase can build on a real schema, real auth, and real catalog data instead of placeholders
**Depends on**: Nothing (first phase)
**Requirements**: ADMIN-01
**Success Criteria** (what must be TRUE):

  1. Admin (owner) can log in to a protected admin route with the single fixed account
  2. Database schema exists for orders, order_items, order_status_history, and a notification/idempotency log, with RLS policies restricting access appropriately
  3. A `UNIQUE(provider, provider_ref)` (or equivalent) idempotency guard exists on the schema from day one, ready for Phase 3/4 to use
  4. Static league/team/season catalog and pricing-tier config are defined and loadable by the Next.js app

**Plans**: 5 plans (Walking Skeleton)
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold Next.js 16 + Supabase client factories + Vitest (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Schema migration (4 tables + enum + RLS + idempotency guards) + integration tests (wave 2)
- [x] 01-03-PLAN.md — Static catalog + pricing tiers + patch list config + unit tests (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Admin auth walking skeleton: login → getUser-gated dashboard with real DB read + seed-admin (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md — Human-verify checkpoint: end-to-end walking skeleton (wave 4)

### Phase 2: Order Builder & Storefront

**Mode:** mvp
**Goal**: A customer can configure and preview a complete custom-jersey order end-to-end before paying
**Depends on**: Phase 1
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07
**Success Criteria** (what must be TRUE):

  1. Customer can pick league, team, and season from a structured set of major leagues and well-known national teams
  2. Customer can select a size, with a size guide/fit chart available at the point of selection
  3. Customer can check off patches from a fixed, short list (including "none")
  4. Customer can enter name and number for the print, with validation feedback on length/allowed characters
  5. Customer sees a live order summary that updates automatically, including bundle discount, when adding multiple jerseys to one order
  6. Customer sees a short explainer near checkout describing what happens after payment (confirmation and tracking come later)

**Plans**: 7 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Cart state core (types/reducer/context) + cascading team & patch logic + test infra (wave 1)
- [x] 02-02-PLAN.md — Zod name/number print validation schemas (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-03-PLAN.md — Jersey selection fields: league/team selects, read-only season, size selector, size-guide modal (wave 2)
- [x] 02-04-PLAN.md — Patch checkbox group + live-validated name/number print fields (wave 2)
- [x] 02-05-PLAN.md — Persistent cart panel + live order summary with bundle discount + undo-on-remove (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-06-PLAN.md — Assembly: configurator form + client root + storefront homepage + checkout explainer (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-07-PLAN.md — Human-verify checkpoint: end-to-end storefront flow (wave 4)

**UI hint**: yes

### Phase 3: Payments — Checkout & Webhook-Driven Order Creation

**Mode:** mvp
**Goal**: A customer can pay for their configured order, and the order is created only once money has actually moved — never from a client redirect, never duplicated
**Depends on**: Phase 2
**Requirements**: PAY-01, PAY-02, PAY-03, ORDER-01
**Success Criteria** (what must be TRUE):

  1. Customer can pay by card via Stripe and reach a confirmation state after payment
  2. Customer can pay via Vipps and reach a confirmation state after payment
  3. The charged total (including bundle discount) is always recomputed server-side at payment time — the client-submitted price is never trusted directly
  4. An order row is created only by a verified, idempotent payment webhook handler (Stripe/Vipps) — never by the client-side redirect/success page, and re-delivery of the same webhook event never creates a duplicate order

**Plans**: TBD

### Phase 4: WhatsApp Supplier Notification

**Mode:** mvp
**Goal**: Every successfully paid order reaches the China supplier contact on WhatsApp automatically, exactly once
**Depends on**: Phase 3
**Requirements**: ORDER-02, ORDER-03
**Success Criteria** (what must be TRUE):

  1. When a payment succeeds, the order details (jersey configuration, size, patches, name/number, quantity) are sent automatically to the fixed China-contact WhatsApp number
  2. Firing the same payment webhook event twice (e.g. a provider retry) never results in more than one WhatsApp message for that order
  3. A failed or undeliverable WhatsApp send is logged/visible somewhere the owner can notice it, rather than failing silently

**Plans**: TBD

### Phase 5: Admin Panel — Order Management & Notifications

**Mode:** mvp
**Goal**: The owner can run the entire post-payment order lifecycle from one place, customers stay informed by email, and the whole store reads as a native Norwegian experience
**Depends on**: Phase 4
**Requirements**: ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, CUST-01, CUST-02, GEN-01
**Success Criteria** (what must be TRUE):

  1. Owner sees a list of incoming/paid orders in the admin panel
  2. Owner can mark an order as confirmed, which automatically sends the customer a confirmation email
  3. Owner can add a tracking number to an order, which automatically sends the customer an email with the tracking number
  4. Owner receives a notification beyond the panel itself (e.g. email/push) whenever a new paid order arrives
  5. Orders left unconfirmed for 24-48 hours are visibly flagged/highlighted in the admin panel
  6. The entire store — order form, transactional emails, and admin panel — is in Norwegian with prices shown in NOK

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 5/5 | Complete   | 2026-07-07 |
| 2. Order Builder & Storefront | 5/7 | In Progress|  |
| 3. Payments — Checkout & Webhook-Driven Order Creation | 0/TBD | Not started | - |
| 4. WhatsApp Supplier Notification | 0/TBD | Not started | - |
| 5. Admin Panel — Order Management & Notifications | 0/TBD | Not started | - |
