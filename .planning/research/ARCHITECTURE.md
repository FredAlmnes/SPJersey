# Architecture Research

**Domain:** Custom-product e-commerce storefront with payment-triggered supplier notification and manual admin fulfillment (dropshipping)
**Researched:** 2026-07-07
**Confidence:** HIGH (core pattern is a well-established webhook-driven order pipeline; MEDIUM on WhatsApp Business API specifics, see Integration Points)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │ Order Builder  │  │ Checkout UI    │  │ Admin Panel (auth'd)   │ │
│  │ (liga/lag/     │  │ (Stripe/Vipps  │  │ order list, status,    │ │
│  │  size/patch/   │  │  redirect or   │  │  tracking entry        │ │
│  │  name+number)  │  │  embedded)     │  │                        │ │
│  └───────┬────────┘  └───────┬────────┘  └───────────┬────────────┘ │
├──────────┼───────────────────┼───────────────────────┼──────────────┤
│          ▼                   ▼                       ▼               │
│                    NEXT.JS APP (Vercel, serverless)                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Route Handlers / Server Actions                             │    │
│  │  - POST /api/checkout/session   (create Stripe/Vipps session)│    │
│  │  - POST /api/webhooks/stripe    (payment confirmed)          │    │
│  │  - POST /api/webhooks/vipps     (payment confirmed)          │    │
│  │  - POST /api/admin/orders/:id   (status/tracking update)     │    │
│  │  - GET  /api/admin/orders       (auth'd list)                │    │
│  └───────────┬───────────────────────────────┬──────────────────┘    │
├──────────────┼───────────────────────────────┼───────────────────────┤
│              ▼                               ▼                       │
│     ┌─────────────────┐            ┌───────────────────────┐        │
│     │ Supabase (DB +   │            │  Notification Layer    │        │
│     │ Auth + RLS)      │◄──────────►│  - WhatsApp (Cloud API)│        │
│     │ orders, order_   │            │  - Transactional email │        │
│     │ items, status_   │            │    (Resend/Postmark)   │        │
│     │ history, admin   │            │                        │        │
│     │ user             │            │                        │        │
│     └─────────────────┘            └───────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
              ▲                                       ▲
              │                                       │
      ┌───────┴────────┐                    ┌─────────┴─────────┐
      │ Stripe / Vipps  │                    │  China supplier    │
      │ (external, PCI  │                    │  contact (WhatsApp) │
      │  scope stays    │                    │  Customer (email)   │
      │  with provider)  │                    │                      │
      └────────────────┘                    └─────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Order Builder (storefront) | Collects league/team/season, size, patches, name+number, quantity; computes bundle price client-side for display | Next.js pages/components, React state or URL-driven form, pricing config as static data (not DB-driven in v1) |
| Checkout/Payment layer | Creates a payment session/intent with Stripe or Vipps, redirects/embeds checkout, does **not** write order rows itself | Server route creates session, stores a "pending" reference (cart payload) — order row created only after webhook confirms payment |
| Payment Webhooks | Verify signature, confirm payment success, create the durable order record, trigger WhatsApp notification | Next.js Route Handlers, one per provider, idempotent by payment/session ID |
| Order Management (Admin) | Auth'd owner view of orders; mark confirmed; enter tracking number; triggers email side-effects | Next.js `/admin` route group behind Supabase Auth, server actions writing to `orders`/`order_status_history` |
| Notification Layer — WhatsApp | Send order details to fixed supplier number on payment confirmation | WhatsApp Cloud API (Meta) or BSP (e.g. 360dialog/Twilio), triggered from webhook handler, not from client |
| Notification Layer — Email | Send customer transactional emails at order-confirmed and tracking-added events | Resend/Postmark/SendGrid, triggered from admin actions (and initial "order received" from webhook if desired) |
| Data store (Supabase Postgres) | Single source of truth: orders, order items/customization, status history, webhook event log | Supabase Postgres + RLS; service-role key used only in trusted server context (webhooks, admin routes) |

## Recommended Project Structure

```
src/
├── app/
│   ├── (storefront)/            # public order builder + checkout
│   │   ├── page.tsx              # landing / entry into builder
│   │   ├── bestill/               # "order" flow: league→team→size→patch→name/number→cart
│   │   └── checkout/              # review + pay (Stripe/Vipps)
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx         # auth guard (Supabase session check)
│   │       ├── page.tsx           # order list/dashboard
│   │       └── ordre/[id]/        # order detail: confirm, add tracking
│   ├── api/
│   │   ├── checkout/
│   │   │   ├── stripe/route.ts    # create Checkout Session
│   │   │   └── vipps/route.ts     # create ePayment session
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts    # verify + handle payment events
│   │   │   └── vipps/route.ts     # verify + handle payment events
│   │   └── admin/
│   │       └── orders/[id]/route.ts  # status/tracking mutations
├── lib/
│   ├── supabase/                  # server + client Supabase clients
│   ├── pricing/                   # bundle price rules (pure functions)
│   ├── notifications/
│   │   ├── whatsapp.ts            # send order to supplier
│   │   └── email.ts               # transactional email templates/sends
│   └── orders/
│       ├── createFromPayment.ts   # idempotent order creation from webhook payload
│       └── types.ts
└── config/
    ├── leagues-teams-seasons.ts   # structured catalog (static data, v1)
    └── pricing-tiers.ts           # bundle discount steps
```

### Structure Rationale

- **`app/(storefront)` vs `app/(admin)`:** Route groups give a hard boundary — different layouts, different auth requirements — without needing separate apps/deployments. Keeps this a single Next.js project (appropriate at <50 orders/month).
- **`api/webhooks/*` separate from `api/checkout/*`:** Session creation (client-triggered, unauthenticated) and payment confirmation (provider-triggered, signature-verified) are different trust boundaries and must not share a handler.
- **`lib/orders/createFromPayment.ts` as a single choke point:** Both Stripe and Vipps webhook handlers call the same function to create the order + order items + initial status history row. This is where idempotency and the WhatsApp trigger live, so the two payment providers don't duplicate logic or diverge in behavior.
- **`config/` as static data, not DB tables (v1):** League/team/season catalog and pricing tiers are low-churn and owner-only. Static config avoids building a CMS/admin-catalog UI that's out of scope for v1 (per PROJECT.md: no per-team pricing).

## Architectural Patterns

### Pattern 1: Payment-first, order-second (webhook-driven order creation)

**What:** The order row is created only when a payment-confirmed webhook is received — never when the customer submits the form or reaches checkout.
**When to use:** Any flow where an external payment provider is the source of truth for "did money actually move."
**Trade-offs:** Requires temporarily holding the customer's cart/customization payload (in the payment session's metadata, or a short-lived `pending_orders` table) until the webhook arrives. Slightly more moving parts than "create order, then redirect to pay," but eliminates an entire class of bugs (abandoned/failed payments creating phantom orders, customers refreshing and double-submitting, WhatsApp messages going out for unpaid orders).

**Example:**
```typescript
// api/checkout/stripe/route.ts — create session, encode cart in metadata
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  metadata: { cartPayload: JSON.stringify(compactCart) }, // small: item refs, not full form
  success_url, cancel_url,
});

// api/webhooks/stripe/route.ts — only place an order is ever created
const event = stripe.webhooks.constructEvent(rawBody, sig, secret);
if (event.type === "checkout.session.completed") {
  await createOrderFromPayment({
    provider: "stripe",
    providerRef: event.data.object.id, // idempotency key
    cart: JSON.parse(event.data.object.metadata.cartPayload),
    amountTotal: event.data.object.amount_total,
  });
}
```

### Pattern 2: Idempotent webhook → order creation

**What:** `createOrderFromPayment` upserts on a unique `provider + provider_ref` constraint, so a retried webhook delivery (both Stripe and Vipps retry on non-2xx or timeout) never creates a duplicate order or sends WhatsApp/email twice.
**When to use:** Every payment webhook handler, no exceptions — providers guarantee at-least-once delivery, not exactly-once.
**Trade-offs:** Adds a small amount of DB schema (unique constraint + a check-then-insert or `ON CONFLICT DO NOTHING`), but this is cheap insurance against duplicate supplier orders — the single most damaging failure mode in this system (double-ordering from the Kina-kontakt is a real cost, not just a UX glitch).

**Example:**
```typescript
const { data, error } = await supabase
  .from("orders")
  .insert({ provider: "stripe", provider_ref: sessionId, ...orderFields })
  .select()
  .single();

if (error?.code === "23505") {
  // unique violation: already processed this payment, skip side effects
  return;
}
// only reached on first successful insert:
await sendWhatsAppOrderNotification(data);
await sendCustomerEmail(data, "order_received");
```

### Pattern 3: Server-triggered notifications, never client-triggered

**What:** WhatsApp and email sends happen only from trusted server code (webhook handlers, admin server actions) — never from a client-callable endpoint that just "sends a message."
**When to use:** Any notification tied to a business event (payment, status change) rather than a user action like "resend confirmation."
**Trade-offs:** Slightly less flexible than exposing a generic notify endpoint, but prevents a customer (or bot) from triggering arbitrary WhatsApp messages to the supplier or spamming emails.

## Data Flow

### Request Flow (order → payment → notification → fulfillment)

```
Customer fills order builder (league/team/season, size, patches, name+number, qty)
    ↓
Client computes bundle price (display only) → "Betal" (pay) button
    ↓
POST /api/checkout/{stripe|vipps} → creates payment session, cart payload
    stored in session metadata (Stripe) or a short-lived pending record (Vipps,
    which has smaller metadata limits — see Pitfalls)
    ↓
Customer redirected to Stripe Checkout / Vipps payment page (PCI/payment
    compliance stays entirely with the provider — app never touches card data)
    ↓
Provider processes payment → fires webhook to /api/webhooks/{stripe|vipps}
    ↓
Webhook handler: verify signature → check idempotency (provider+ref) →
    createOrderFromPayment()
    ↓                                              ↓
INSERT orders + order_items                 INSERT order_status_history
(status = "received")                       (status = "received", ts=now)
    ↓
Trigger: sendWhatsAppOrderNotification(order)  → China supplier contact
Trigger: sendCustomerEmail(order, "received")  → customer (optional in v1;
                                                   PROJECT.md only requires
                                                   email at confirmed + tracking)
    ↓
Customer redirected to success page (order already exists in DB by the time
    they land there, or shortly after — success page should poll/refresh,
    not assume synchronous creation)

--- separately, asynchronously, owner-driven ---

Owner opens /admin, sees order (status "received")
    ↓
Owner hears back from supplier via WhatsApp (manual, out of system) →
    clicks "Bekreft bestilling" in admin
    ↓
UPDATE orders.status = "confirmed" + INSERT order_status_history row
    ↓
Trigger: sendCustomerEmail(order, "confirmed")
    ↓
(later) Owner enters tracking number in admin
    ↓
UPDATE orders.tracking_number, status = "shipped" + INSERT status_history row
    ↓
Trigger: sendCustomerEmail(order, "shipped_with_tracking")
```

### Why webhook-driven (post-payment) order creation is safer than pre-payment

- **No phantom/abandoned orders:** If the order row were created when the customer starts checkout, every abandoned cart, back-button, or failed card would leave a "real" order in the admin panel and could even trigger a premature WhatsApp message to the supplier before money has moved.
- **No duplicate supplier orders:** The supplier notification is the highest-cost side effect in this system (Kina-kontakt starts producing on it). It must fire exactly once, and only for payments that actually succeeded — which only the payment provider can confirm authoritatively. The app's own "did payment succeed" belief before the webhook arrives is not trustworthy (client-side redirects can be spoofed, interrupted, or replayed).
- **Provider is the source of truth:** Stripe/Vipps webhooks are signed and retried until acknowledged — this is the only channel where "payment succeeded" is a verified fact rather than a client claim.
- **Idempotency is native to this design:** Because the order doesn't exist until the webhook creates it, "has this payment already produced an order" is a single unique-constraint check, not a distributed state-reconciliation problem.

### Where webhooks vs. direct calls are used

| Interaction | Mechanism | Why |
|---|---|---|
| Storefront → payment session creation | Direct server call (Route Handler invoked by client fetch) | Synchronous, needs to return a redirect URL/client secret immediately |
| Stripe/Vipps → order creation | Webhook (provider → app) | Only the provider knows definitively that payment succeeded; must be push, not poll, and must be signature-verified |
| Webhook handler → WhatsApp send | Direct server-to-server API call, made synchronously inside the webhook handler (with retry/backoff) | Low volume (<50/month) makes a queue unnecessary; a simple retry-with-logging is sufficient. If WhatsApp send fails, log to `notification_failures` and let admin panel show "supplier not notified" so owner can resend manually — don't fail the whole webhook (order must still be created even if WhatsApp is down) |
| Admin action → email send | Direct server call from the same server action/route that updates status | Single admin user, no concurrency concerns; no queue needed at this volume |
| Admin panel → orders data | Direct Supabase query (server-side, service role or RLS-scoped) | No need for a public API; admin is a trusted, authenticated context |

## Data Store Shape (Supabase / Postgres)

High-level schema — not exhaustive DDL, but shape and relationships:

```
orders
  id                  uuid pk
  provider            text            -- 'stripe' | 'vipps'
  provider_ref        text            -- checkout session id / vipps orderId — UNIQUE with provider
  status              text            -- 'received' | 'confirmed' | 'shipped'
  customer_name       text
  customer_email      text
  amount_total_ore    integer         -- store NOK in øre (integer) to avoid float issues
  currency             text default 'NOK'
  tracking_number     text null
  created_at          timestamptz
  updated_at          timestamptz
  UNIQUE (provider, provider_ref)     -- idempotency guard

order_items
  id                  uuid pk
  order_id            uuid fk -> orders.id
  league              text
  team                text
  season              text
  size                text
  patches             text[]          -- or jsonb array of patch codes
  custom_name         text null
  custom_number       text null
  unit_price_ore      integer
  quantity            integer

order_status_history
  id                  uuid pk
  order_id            uuid fk -> orders.id
  status              text            -- mirrors orders.status transitions
  note                text null       -- e.g. "tracking added: XXXX"
  created_at          timestamptz

notification_log                       -- optional but recommended
  id                  uuid pk
  order_id            uuid fk -> orders.id
  channel             text            -- 'whatsapp' | 'email'
  event               text            -- 'order_received' | 'confirmed' | 'shipped'
  status              text            -- 'sent' | 'failed'
  error               text null
  created_at          timestamptz
```

**Idempotency handling in detail:**
- `UNIQUE (provider, provider_ref)` on `orders` is the core guard. Webhook handler does an insert; on unique-violation, it treats the event as already-processed and returns 200 without re-sending notifications.
- Because Stripe/Vipps retry webhooks on any non-2xx response (or timeout), the handler must return 2xx quickly once the DB write is durable — do the WhatsApp/email sends best-effort (catch and log failures to `notification_log`, don't let a slow WhatsApp API call cause a webhook timeout/retry that then hits the same idempotency path pointlessly).
- Bundle/package pricing is computed and stored as `amount_total_ore` at order-creation time (from the trusted payment amount, not recomputed from `order_items` client input) — the payment provider's captured amount is the financial source of truth; order_items are for fulfillment detail, not billing recomputation.
- Admin status transitions (`received → confirmed → shipped`) should be enforced server-side (e.g., can't set tracking on a `received` order) to prevent accidental out-of-order emails.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| <50 orders/month (target v1) | Everything above is already right-sized: single Next.js app, direct synchronous notification calls, no queue, no separate services. Don't build more than this. |
| 100s of orders/month | Move WhatsApp/email sends to a lightweight background job (Supabase Edge Function triggered by DB insert, or a queue like Vercel Cron + a `pending_notifications` table) so webhook response time stays fast and a slow WhatsApp API doesn't risk webhook timeouts. |
| 1000s of orders/month / multiple admin staff | Introduce role-based access in admin (currently single owner), consider moving catalog (league/team/season/pricing) from static config into DB-managed tables for self-service updates, add proper job queue for notification retries. |

### Scaling Priorities

1. **First likely bottleneck:** Not scale at all at this volume — it's WhatsApp/email delivery reliability (a webhook handler blocked on a flaky third-party API). Mitigate early with try/catch + `notification_log`, not with premature queueing infrastructure.
2. **Second (only relevant post-v1):** Static league/team/season/pricing config becomes a deploy-to-change bottleneck once the catalog needs frequent updates — that's the trigger to move it into Supabase tables with a small admin catalog UI, not before.

## Anti-Patterns

### Anti-Pattern 1: Creating the order row at checkout-start instead of at payment-confirmation

**What people do:** Insert an `orders` row with status `pending` when the customer clicks "pay", then update it to `paid` when the webhook arrives.
**Why it's wrong:** Every abandoned/failed checkout leaves clutter in the admin panel that the owner has to mentally filter out; worse, it creates a temptation to fire the WhatsApp supplier notification on `pending` (e.g., "to save time"), which risks notifying the supplier before payment is real. It also creates a race: client-side "success" redirect can render before the webhook has landed, causing UI to show a wrong state.
**Instead:** Don't create the order at all until the webhook fires. Hold cart data in the payment session's own metadata (Stripe) or a short-lived, unauthenticated-safe `checkout_intents` staging table (Vipps, whose order metadata is more limited) keyed by the session/order reference.

### Anti-Pattern 2: Parsing the supplier's WhatsApp replies to auto-update order status

**What people do:** Try to watch the WhatsApp thread with the China contact and auto-advance status based on keywords in their reply.
**Why it's wrong:** Explicitly called out as out-of-scope in PROJECT.md and correctly so — free-text WhatsApp replies from a human supplier are unstructured and unreliable to parse; a false-positive status change (e.g., misreading "not yet" as confirmation) directly misleads the customer via automated email.
**Instead:** Keep the human-in-the-loop admin action as the only way `status` advances past `received`. This is a deliberate, correct simplification for v1 — do not "improve" it into an integration during implementation.

### Anti-Pattern 3: Trusting client-submitted price/cart data at order-creation time

**What people do:** Read quantity/patches/pricing straight from the webhook's cart-payload metadata and use it as the billed amount.
**Why it's wrong:** Metadata round-tripped through the client (even via a payment session) shouldn't be treated as authoritative for money — the actual charged amount lives on the payment object itself (`amount_total` in Stripe, the captured amount in Vipps).
**Instead:** Use the *provider's* confirmed amount for `orders.amount_total_ore`; use the cart payload only for fulfillment detail (what jerseys/sizes/patches to tell the supplier), and validate that the provider amount matches what the server-side pricing function would compute for that cart before creating the order (log a mismatch rather than silently trusting either side).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Stripe | Checkout Sessions + webhook (`checkout.session.completed` / `payment_intent.succeeded`) | Well-documented, signature verification via `stripe.webhooks.constructEvent`. HIGH confidence — standard, stable pattern. |
| Vipps (ePayment API + Webhooks API) | Create payment via ePayment API, receive confirmation via registered Webhooks API endpoint (events like `epayments.payment.captured.v1`) | Requires TLS 1.2 on the webhook endpoint (Vercel satisfies this by default); up to 5 webhooks can be registered per event type. Confirmed via official docs (developer.vippsmobilepay.com). HIGH confidence on the webhook mechanism, MEDIUM on exact metadata size limits for cart payload — verify during Vipps integration phase. |
| WhatsApp (Cloud API or BSP) | Server-to-server send of a pre-approved **template message** to the fixed supplier number, triggered from the payment webhook handler | Meta's Business Platform requires business-initiated messages to use pre-approved templates (this includes notifying a supplier who hasn't messaged first in the last 24h) — this needs a template submitted for approval before launch, which has lead time. This is a MEDIUM-confidence flag: recommend flagging this specific integration for its own focused research/spike early in the roadmap, since template approval lead time and exact API choice (direct Meta Cloud API vs. a BSP like Twilio/360dialog vs. a simpler unofficial client) materially affects timeline. |
| Transactional email (Resend/Postmark/similar) | Triggered server-side from webhook (optional "received" email) and from admin server actions (`confirmed`, `shipped`) | Standard, low-risk integration; any mainstream provider with a Node/Next.js SDK works. HIGH confidence. |
| Supabase Auth | Single admin user, email/password or magic link, session-gated `(admin)` route group | Low complexity given single-user constraint; RLS policies mainly need to protect `orders`/`order_items` from public read/write (only service-role/server context and the authenticated admin should touch them; storefront writes happen only via the webhook's service-role client, never client-side). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Storefront ↔ Checkout API | Client fetch → Route Handler (server) | Storefront never talks to Supabase directly for order writes; only reads static catalog config |
| Payment provider ↔ App | Signed webhook POST → Route Handler | Must verify signature before trusting payload; must be idempotent |
| Webhook handler ↔ Supabase | Server-side client with service-role key | Never expose service-role key to client; RLS still applies as defense-in-depth even for server code where feasible |
| Webhook handler ↔ Notification layer | Direct in-process function call (`lib/notifications/*`) | Not an HTTP call — same deployment, just a function boundary, kept separate for testability and single-responsibility |
| Admin panel ↔ Supabase | Server actions using the authenticated admin's session (RLS-scoped) or service-role from trusted server context | Admin UI never calls Stripe/Vipps/WhatsApp directly from the client — always via server actions |

## Sources

- [Webhooks | Vipps MobilePay Developer Docs](https://developer.vippsmobilepay.com/docs/knowledge-base/webhooks/) — HIGH confidence, official docs
- [Introduction to the Webhooks API | Vipps MobilePay Developer Docs](https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/) — HIGH confidence, official docs
- [Webhooks API Event types | Vipps MobilePay Developer Docs](https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/events/) — HIGH confidence, official docs
- [ePayment API guide | Vipps MobilePay Developer Docs](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/api-guide/) — HIGH confidence, official docs
- [Quick start for the ePayment API | Vipps MobilePay Developer Docs](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/quick-start/) — HIGH confidence, official docs
- [WhatsApp Business Platform Node.js SDK Quickstart (Meta)](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/) — MEDIUM confidence, official SDK docs but template-approval workflow needs its own spike
- [.template message reference, WhatsApp Node.js SDK](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/template/) — MEDIUM confidence
- Stripe Checkout Sessions + webhooks pattern is standard, well-known HIGH-confidence industry pattern from training knowledge; recommend confirming current event names (`checkout.session.completed`) against Stripe's own docs at implementation time.

---
*Architecture research for: Norwegian custom-jersey dropshipping storefront (Next.js/Vercel/Supabase/Stripe/Vipps/WhatsApp)*
*Researched: 2026-07-07*
