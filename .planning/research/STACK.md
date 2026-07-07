# Stack Research

**Domain:** Low-volume custom-order e-commerce storefront (Norwegian football jersey dropshipping) with card + Vipps payment and automated WhatsApp order relay
**Researched:** 2026-07-07
**Confidence:** HIGH (framework/backend/email), MEDIUM (Stripe/Vipps integration pattern), MEDIUM-LOW (WhatsApp notification approach — depends on a decision only the owner can make)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (App Router, Turbopack default) | Full-stack framework: customer storefront + admin panel + API routes/webhooks | Deploys natively on Vercel with zero config, App Router is the stable default in 2026 (Pages Router is in maintenance mode), and a single Next.js app can serve the public storefront, the `/admin` panel, and the Stripe/Vipps webhook handlers from one codebase — no separate backend service needed for this scale. Confirms the user's proposed Vercel deployment. |
| Supabase | Postgres 15/16 (managed), `@supabase/supabase-js` 2.110.x | Database, auth, RLS | Good fit here: Postgres gives you a real relational schema for orders/line-items (needed for bundle pricing math and later reporting), built-in Auth handles the single admin login without hand-rolling password storage, and Row Level Security lets you enforce "public can insert an order, only the authenticated admin can read/update all orders" directly in the database rather than trusting application code. Confirms the user's proposed backend. |
| Vercel | N/A (platform) | Hosting, edge/serverless functions, cron | Matches Next.js natively (same vendor), free tier covers <50 orders/month easily, built-in cron (Vercel Cron) is useful later if you ever poll a tracking API. Confirms the user's proposed deployment target. |
| TypeScript | 5.x | Type safety across storefront, admin, and payment/webhook code | Payment and webhook code is exactly where silent `any`-typed bugs (wrong currency unit, wrong amount, missing field) cause real money problems. Non-negotiable for this domain. |
| Tailwind CSS | 4.x | Styling | Standard pairing with Next.js/Vercel; fast to build a simple Norwegian storefront + minimalist admin panel without a design system overhead. |

### Payments

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Stripe (Checkout Sessions + webhooks) | `stripe` npm package (latest, pinned `apiVersion`) | Card payments | Use **Stripe Checkout** (hosted payment page), not raw Payment Intents/Elements. Checkout is purpose-built for "new to Stripe" builders: it handles 3D Secure, card validation, and mobile UI for you, cutting integration to hours not days. Fulfillment (marking order paid, notifying China contact, sending confirmation email) MUST happen in a `checkout.session.completed` **webhook handler**, never on the client-side redirect — customers can close the tab before the redirect fires, and Stripe explicitly documents this failure mode. Webhook handlers must verify the `Stripe-Signature` header and be idempotent (store processed `event.id`s with a unique DB constraint), since Stripe redelivers events. |
| Vipps — via **Stripe's native Vipps support** (private preview) OR direct **Vipps ePayment API** | Stripe: `vipps_preview=v1` header; Vipps: ePayment API (current, not legacy eCom API) | Norwegian mobile wallet payment | See "Vipps Integration Decision" below — this needs a concrete choice before Phase 1, flagged as a research item for the roadmap. |

### Messaging / Notifications

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| WhatsApp Cloud API (Meta, direct) | Graph API v21+ | Send automated order notification to the fixed China-contact phone number | Cheapest and most controllable path for a single, fixed recipient at low volume (see "WhatsApp Notification Decision" below). Requires Meta Business verification (2–10 business days) and pre-approved message **templates** for anything sent outside a 24h customer-initiated window — since the China contact never messages your bot first, effectively **every** order notification must be a pre-approved template message. This is a one-time setup cost, not a per-order blocker. |
| Resend | `resend` npm package (latest) + React Email | Transactional emails to customer (order confirmed, tracking added) | Best DX fit for Next.js: write email templates as React components (`react-email`), send via a typed SDK, generous free tier (3,000 emails/month) comfortably covers <50 orders/month × 2 emails each. Supabase's own team recommends Resend for swapping in as custom SMTP/email sender alongside Supabase Auth. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/ssr` | 0.9.x | Cookie-based Supabase session handling in Next.js Server Components/Route Handlers | Always, for the admin auth flow — replaces the deprecated `@supabase/auth-helpers-nextjs`. |
| `zod` | 3.x/4.x | Validate order form input and webhook payloads | Use on both the order-creation API route (customer input: size, patches, name/number) and inside Stripe/Vipps webhook handlers before trusting any field. |
| `react-email` | latest | Compose HTML emails as React components | Pairs directly with Resend; use for the two transactional email templates (confirmed, tracking added). |
| `stripe` (Node SDK) | latest 18.x | Server-side Stripe API + webhook signature verification | Any Stripe Checkout Session creation and webhook route. |
| shadcn/ui + Radix primitives | latest | Admin panel UI (tables, forms, badges for order status) | Use for the admin order list/detail views — faster than hand-building tables/dialogs, no heavy runtime cost for a single-user internal tool. |
| `date-fns` | 3.x/4.x | Formatting dates in Norwegian locale for order timestamps/emails | Whenever a human-readable Norwegian date is shown (order list, emails). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Stripe CLI | Forward webhooks to `localhost` during development | `stripe listen --forward-to localhost:3000/api/webhooks/stripe`; also lets you trigger test events (`checkout.session.completed`) without a real card. |
| Supabase CLI | Local Postgres + migrations + generated TypeScript types | Run `supabase db diff` / `supabase gen types typescript` so the orders schema and app types never drift. |
| ngrok (or Vercel preview URL) | Expose local server for Vipps/WhatsApp webhook testing | Vipps' ePayment API and Meta's WhatsApp webhooks need a public HTTPS callback URL even in test mode. |

## Installation

```bash
# Core
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js @supabase/ssr
npm install stripe
npm install resend react-email @react-email/components
npm install zod date-fns

# UI
npx shadcn@latest init
npm install -D tailwindcss @tailwindcss/postcss postcss

# Dev dependencies
npm install -D typescript @types/node @types/react @types/react-dom
npm install -g supabase   # Supabase CLI
```

## Vipps Integration Decision (needs explicit choice before Phase 1)

Two credible paths exist. **Recommendation: start by evaluating Stripe's native Vipps support first; fall back to direct Vipps ePayment API if it's unavailable or unsuitable.**

**Option A — Stripe native Vipps (MEDIUM confidence, unverified availability)**
Stripe added Vipps as a payment method (docs at `docs.stripe.com/payments/vipps`), supported through Stripe Checkout, Payment Links, and Elements. It's currently in **private preview**: every API request needs a `vipps_preview=v1` header, and it is NOK-only, Norway-customer-only. This would let you accept both card and Vipps through **one** Stripe integration — one webhook handler, one dashboard, one settlement — which is a meaningfully simpler build than integrating two separate payment providers.
- Risk: "private preview" status is not something we could confirm is self-service-enabled — it may require Stripe to grant access to your account, and there's no publicly documented waitlist/application process found during research. **Action for the user:** log into the Stripe Dashboard and check Settings → Payment methods for a Vipps option, or contact Stripe support, before committing to this path in the roadmap.
- If available: this collapses "Stripe integration" and "Vipps integration" into a single phase.

**Option B — Direct Vipps ePayment API (HIGH confidence, well-documented, more setup work)**
The **ePayment API** is Vipps MobilePay's current recommended API (the older "eCom API" is legacy/maintenance-mode — do not build against it). Direct integration requires:
1. A Norwegian organization number (`organisasjonsnummer`) for the main legal entity — sole proprietorships (enkeltpersonforetak) qualify once registered in Brønnøysundregistrene. Confirm the store owner's business is registered before starting Vipps onboarding.
2. Sandbox/test credentials are typically available within ~24 hours of applying.
3. Before going live, you must complete an official **checklist + certification process**: submit the filled-in ePayment checklist, request/response examples from your test environment (must be <1 month old), and a short video of your payment flow, to `developer@vippsmobilepay.com`. Vipps also runs KYC/AML/PEP checks on the merchant. Budget **1–3 weeks of calendar time** for this approval loop, separate from actual coding time.
4. This is a second, independent payment integration alongside Stripe — separate webhook endpoint, separate order-status reconciliation logic, separate settlement/payout to reconcile in bookkeeping.

**Do not build against:** the legacy Vipps "eCom API" (maintenance mode, no longer where new integrations should go), or Vipps "Checkout API" (an all-in-one bundled product aimed at merchants who want Vipps to also handle order management/recurring — unnecessary complexity for this project's scope; ePayment API alone is sufficient).

**Roadmap implication:** flag "Vipps integration" as a phase needing a spike/decision early — check Stripe Dashboard for native Vipps availability on day one of that phase, and only fall back to the ~1–3 week direct-Vipps certification timeline if native support isn't accessible. This certification lead time should be started as early as possible in parallel with other development, since it is a waiting-on-a-third-party bottleneck, not an engineering task.

## WhatsApp Notification Decision (needs explicit choice before Phase 1)

Three realistic options for "send one automated message per completed order to one fixed China-contact number":

**Option A — WhatsApp Cloud API direct from Meta (RECOMMENDED, MEDIUM-HIGH confidence)**
- Free to apply, no reseller markup. Since July 2025 Meta bills per delivered template message rather than per 24h conversation; utility-category messages (which an order notification is) are the cheapest tier, often well under $0.01/message. At <50 orders/month this is effectively negligible cost (low single-digit dollars per month at most).
- Setup friction: create a Meta Business app, verify the business (upload org number / business docs, 2–10 business days), register the recipient's WhatsApp Business Account, and get one **message template** pre-approved (e.g. "New order #{{1}}: {{2}}, size {{3}}, patches: {{4}}, qty {{5}}. Total {{6}} NOK."). Since the China contact will not have messaged the bot first, the 24-hour free-form window essentially never applies — plan to send **only pre-approved templates**, not free-form text. Template approval is usually fast (minutes to 24h) once the business is verified.
- This is a one-time setup investment (a few days of calendar time waiting on Meta approval), then effectively free and fully automatable per order — matches "on successful payment, automatically send WhatsApp message" requirement exactly.

**Option B — Twilio WhatsApp API (fallback if Meta’s direct onboarding proves too slow/painful)**
- Twilio adds ~$0.005/message on top of Meta's own per-message fee, but manages the business-verification/BSP relationship for you and gives a simpler SDK. For <50 messages/month the markup is trivial (cents). Reasonable fallback if the owner wants to skip Meta's direct verification flow, at the cost of a small recurring Twilio bill and a dependency on a second vendor.

**Option C — `wa.me` deep link (NOT sufficient as the automated mechanism, but useful as a manual-fallback/testing aid)**
- A `https://wa.me/<number>?text=...` link only *opens* WhatsApp with a pre-filled message for a human to press send — it cannot be triggered server-side on payment success without a human in the loop, so it does not satisfy the "sendes automatisk" requirement. Reasonable only as a manual "resend to WhatsApp" button in the admin panel as a backup if the API notification ever fails, not as the primary path.

**Recommendation:** build on **Option A (Meta Cloud API direct)** as the primary automated path; do not use `wa.me` as the only mechanism since it isn't truly automatic. Start the Meta Business verification process early (it's a waiting-on-third-party step like Vipps certification) — this can run in parallel with all other development.

## Supabase Auth & Data Modeling for a Single Admin User

- **Auth approach:** Use Supabase Auth's built-in email+password provider. Create exactly one user (the store owner) manually in the Supabase dashboard or via a one-off seed script — do not build a public sign-up flow at all, since there is only ever one admin. Protect `/admin/*` routes in Next.js middleware/Server Components using `supabase.auth.getUser()` (which revalidates against the Supabase Auth server) — never trust `getSession()` alone in server code, since it can return a stale/unverified session.
- **RLS modeling:** Model `orders` (and `order_items` if you normalize jersey lines) as tables with RLS **enabled**. Two policies suffice:
  - `insert` policy allowing the `anon` role to insert new orders (so the storefront checkout flow, which runs unauthenticated, can create a pending order row) — but restrict which columns/values are writable (e.g. status must default to `pending`, never customer-supplied).
  - `select`/`update` policies restricted to `authenticated` role AND matching the one known admin `auth.uid()` (or simply `authenticated` since there is only one possible authenticated user in this system) — this is what the admin panel uses to list orders, mark confirmed, and add tracking numbers.
  - Payment/webhook writes (marking an order `paid`, storing the Stripe/Vipps payment reference) should go through the **service role key** in a server-only Route Handler (webhook endpoint), which bypasses RLS by design — never expose the service role key to the client.
- **Order status** as a Postgres enum (`pending`, `paid`, `confirmed`, `shipped`) rather than free text, so admin panel and email-trigger logic can branch reliably on it.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Supabase | Firebase | If the team strongly prefers NoSQL/document modeling or already knows Firebase — but Postgres + RLS is a better fit here because order/line-item/pricing data is inherently relational (bundle pricing tiers, patches as line items). |
| Next.js on Vercel | Remix / SvelteKit | If the team already has deep expertise elsewhere — but Next.js + Vercel is the path of least resistance the user already proposed, and it's the best-documented combination for this kind of project. |
| Stripe Checkout | Stripe Elements (custom payment form) | Only if you need a fully custom-branded in-page checkout UI instead of Stripe's hosted page — adds significant integration complexity (manual 3DS handling, PCI scope) that isn't justified for <50 orders/month. |
| Direct Vipps ePayment API | Mollie / Adyen (PSP aggregators that also offer Vipps) | If the owner wants a **single PSP for both card and Vipps** and Stripe's native Vipps preview turns out to be inaccessible — Mollie explicitly supports Vipps via its own Payments API with its own (lighter-weight) onboarding, which could replace both the Stripe and direct-Vipps integrations. Worth a quick spike if Option A above is a dead end. |
| Resend | Postmark | If email deliverability becomes business-critical at higher volume (Postmark's Message Streams isolate transactional mail from any future marketing sends) — not needed at <50 orders/month, but keep in mind if volume grows 10x+. |
| WhatsApp Cloud API (Meta direct) | Twilio WhatsApp API | If the owner is uncomfortable managing Meta Business verification/templates directly and prefers paying a small per-message markup for a managed experience. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Vipps legacy "eCom API" | In maintenance mode; Vipps explicitly directs all new integrations to the ePayment API | Vipps ePayment API |
| Client-side-only order fulfillment (marking order paid based on the post-checkout redirect page) | Customer can close the browser before the redirect completes, silently losing the order | Stripe/Vipps webhook handlers as the single source of truth for payment status |
| `wa.me` link as the *only* WhatsApp mechanism | Requires a human to manually press "send" — does not satisfy "sends automatically" requirement | WhatsApp Cloud API (Meta) with pre-approved templates; keep `wa.me` only as a manual backup button |
| Public sign-up / multi-tenant auth scaffolding for the admin panel | Unnecessary complexity — there is exactly one admin user in v1 per PROJECT.md scope | One manually-created Supabase Auth user, simple email/password login gate |
| Free-text WhatsApp messages sent outside the 24h window without a template | Meta will block/reject non-template messages sent outside a customer-initiated 24h window — the China contact never messages first, so this path will simply fail in production | Pre-approved WhatsApp message template for order notifications |
| Pages Router (`pages/`) for a new Next.js project | Officially in maintenance mode as of Next.js 16; App Router is the supported default for new projects | Next.js App Router |

## Stack Patterns by Variant

**If Stripe's native Vipps support (private preview) is confirmed available on the owner's account:**
- Use a single Stripe Checkout Session per order, with both `card` and `vipps` in `payment_method_types` (with the required `vipps_preview=v1` header).
- One webhook endpoint, one settlement source, simplest possible payments architecture.

**If Stripe Vipps preview is not available / not accessible in time:**
- Run two independent payment integrations: Stripe Checkout for cards, direct Vipps ePayment API for Vipps.
- Store a `payment_provider` column (`stripe` | `vipps`) on the order so both webhook handlers can update the same order status enum consistently.
- Budget the Vipps certification lead time (1–3 weeks) as a parallel track starting as early as possible.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.x | React 19.2 | Next.js 16 ships with React 19.2 support and Turbopack as the default bundler for dev/build. |
| `@supabase/ssr` 0.9.x | `@supabase/supabase-js` 2.110.x | Use together; do not mix with the deprecated `@supabase/auth-helpers-nextjs`, which is no longer receiving features. |
| `stripe` Node SDK (latest) | Pin `apiVersion` explicitly in code | Stripe's API evolves continuously; pinning avoids silent breaking changes to webhook payload shapes. |
| WhatsApp Cloud API | Meta Graph API v21+ | Use the current Graph API version; older WhatsApp Business API versions (pre-Cloud API, the on-premises API) are deprecated by Meta. |

## Sources

- Next.js 16 release / App Router status — https://nextjs.org/docs/app/guides/upgrading/version-16 (HIGH — official docs)
- Supabase Auth server-side guidance (`getUser()` vs `getSession()`) — https://supabase.com/docs/guides/auth/server-side/nextjs (HIGH — official docs)
- `@supabase/ssr`, `@supabase/supabase-js` current versions — https://www.npmjs.com/package/@supabase/ssr, https://www.npmjs.com/package/@supabase/supabase-js (HIGH — npm registry)
- Stripe Checkout fulfillment / webhook best practices — https://docs.stripe.com/checkout/fulfillment, https://docs.stripe.com/webhooks (HIGH — official docs)
- Stripe native Vipps support (private preview) — https://docs.stripe.com/payments/vipps (HIGH for content, MEDIUM for practical availability — private preview access process unconfirmed)
- Vipps ePayment API vs legacy eCom API, certification checklist — https://developer.vippsmobilepay.com/docs/APIs/epayment-api/, https://developer.vippsmobilepay.com/docs/APIs/epayment-api/checklist/ (HIGH — official docs)
- Vipps organization number / Brønnøysundregistrene requirement — https://developer.vippsmobilepay.com/docs/knowledge-base/applying-for-services/ and Norwegian business registration sources (MEDIUM — synthesized from multiple sources)
- WhatsApp Cloud API 2026 pricing (per-template billing since July 2025) — multiple industry sources (uptail.ai, blueticks.co, chatarmin.com) (MEDIUM — WebSearch, cross-verified across 3+ independent sources, not Meta's own pricing page directly)
- WhatsApp 24-hour window / template requirement — Meta Business Messaging policy and multiple BSP docs (MEDIUM — cross-verified across sources, aligns with well-known WhatsApp Business Platform rules)
- Twilio WhatsApp pricing ($0.005/msg markup) — https://www.twilio.com/en-us/whatsapp/pricing (HIGH — official pricing page referenced in search)
- Resend vs Postmark for Next.js/Supabase — https://www.suprsend.com/post/resend-vs-postmark and related comparisons (MEDIUM — WebSearch, cross-verified across multiple independent comparison sources)
- Mollie Vipps support as PSP alternative — https://docs.mollie.com/docs/vipps (MEDIUM — official Mollie docs, not deeply cross-verified for onboarding speed vs direct Vipps)

---
*Stack research for: Norwegian custom football-jersey dropshipping storefront*
*Researched: 2026-07-07*
