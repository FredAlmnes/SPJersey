# Pitfalls Research

**Domain:** Norwegian custom sports-jersey dropshipping storefront (Stripe + Vipps + WhatsApp Business API notification + manual admin fulfillment)
**Researched:** 2026-07-07
**Confidence:** MEDIUM-HIGH (payment webhook and WhatsApp API mechanics are well-documented and verified against official docs; Vipps approval timelines and licensed-merchandise risk are less precisely documented and flagged accordingly)

## Critical Pitfalls

### Pitfall 1: Order created directly in the payment success redirect/response instead of from the webhook

**What goes wrong:**
The order (and the WhatsApp message to the China contact) gets created when the browser hits a `/success` page after Stripe/Vipps redirects the customer back, or synchronously in the "confirm payment" API response. Customers close the tab, lose connectivity, or the browser crashes before the redirect completes — payment succeeds on the provider side but no order/WhatsApp message is ever created. Conversely, if a customer refreshes the success page or the mobile Vipps app return-flow fires twice, the order (and WhatsApp send) gets created twice.

**Why it happens:**
It "works" in every manual test because the developer always sees the full happy-path redirect. Webhooks feel like unnecessary extra plumbing for a low-volume solo project — until the first customer's connection drops on a train.

**How to avoid:**
- The webhook (`checkout.session.completed` / `payment_intent.succeeded` for Stripe; the equivalent server-to-server callback for Vipps ePayment API) is the *only* source of truth for "payment succeeded → create order → notify supplier." The redirect page only reads order state to show the customer a nice confirmation; it never writes.
- Store the provider's event ID (Stripe `event.id`, Vipps equivalent) in a `processed_webhook_events` table with a unique constraint, and no-op if already processed.
- Use the order's own ID (created at checkout-session-creation time, in a `pending` state) as the Stripe idempotency key for any mutating Stripe API calls, and as the natural dedupe key for the WhatsApp send.

**Warning signs:**
- Any code path that creates an order or sends WhatsApp messages from a page component / client-triggered route rather than from a signed server-to-server webhook handler.
- No `processed_events` / `webhook_events` table in the schema.
- Manual testing only ever exercises the full-page redirect, never "kill the tab after payment before redirect."

**Phase to address:**
Checkout & payment phase (whichever phase implements Stripe/Vipps integration) — this must be the architecture from day one, not a retrofit.

---

### Pitfall 2: Duplicate WhatsApp order messages to the China contact from webhook retries

**What goes wrong:**
Stripe (and Vipps) webhooks are "at-least-once" delivery — they retry on timeout, 5xx, or slow response, and Stripe explicitly warns your endpoint may receive the same event more than once. If the WhatsApp send isn't idempotent, the China contact receives the same order 2-3 times, causing real-world confusion (duplicate production, double shipping) that is far more costly here than in a typical SaaS webhook bug, because a human on WhatsApp acts on every message received.

**Why it happens:**
Webhook handler does: verify signature → create order row → send WhatsApp message → return 200. If the WhatsApp API call is slow (WhatsApp send can take 1-2s) and Stripe's response timeout fires before the `return`, Stripe retries the whole webhook, and the handler runs again from the top.

**How to avoid:**
- Record the webhook event ID and mark it processed **inside the same transaction** that creates the order, before triggering the WhatsApp send.
- Make WhatsApp-send itself idempotent: check `order.whatsapp_sent_at IS NULL` immediately before sending, set it immediately after (or use a `sending` lock state), so even a retried webhook that slips past event-ID dedup won't double-send.
- Respond to the webhook fast (verify + write DB row + enqueue send) rather than doing the WhatsApp HTTP call synchronously inside the webhook handler — decouple with a simple queue/job (even a Supabase-triggered function or a `pending_notifications` table polled by a cron) so slow WhatsApp API latency never causes Stripe to time out and retry.

**Warning signs:**
- No `whatsapp_sent_at` / `whatsapp_message_id` column on the order.
- WhatsApp API call happens inline inside the webhook request/response cycle.
- No local webhook-replay test (Stripe CLI `stripe trigger` fired twice) done before launch.

**Phase to address:**
Checkout & payment phase, WhatsApp notification phase — should be verified together with an explicit test case "send the same webhook event twice, assert one WhatsApp message."

---

### Pitfall 3: WhatsApp message fails silently because the 24-hour session window / template rules aren't respected

**What goes wrong:**
The WhatsApp Business Platform (Cloud API) only allows free-form ("session") messages within 24 hours of the *last inbound message from that recipient*. Because this app always **initiates** the conversation (business → China contact, not customer-initiated), every single order notification is a business-initiated message outside any open session — unless the China contact happens to have messaged first that day. Sending a plain free-form text message in this situation will be rejected by the API, not silently swallowed, but if the code doesn't check the response, the owner will believe the order was sent when it wasn't.

**Why it happens:**
Developers unfamiliar with WhatsApp Business API assume "send a WhatsApp message" is like sending an SMS. In testing, the developer's own WhatsApp number is often manually messaging back and forth with the test business number, keeping a session window open — masking the problem until go-live with the real, mostly-silent China contact.

**How to avoid:**
- Register and get Meta approval for a **template message** (category: Utility, since this is an order notification, not marketing) that formats the order details (league/team/season, size, patches, name+number, quantity, order ID). Template approval takes minutes to ~24 hours per Meta's review, but plan for iteration — a rejected template (wrong category, malformed variables, includes something Meta reads as marketing) needs re-submission, so this must happen in a phase before the go-live date, not the day of.
- Always send the initial "new order" notification via the approved template, regardless of session state. Free-form follow-ups (if any) are only safe within 24h of the contact's last reply.
- Explicitly check the WhatsApp API response/status webhook for delivery failures (e.g., error code for "re-engagement message outside allowed window") and surface that failure state in the admin panel — do not assume "API call returned 200" means "message was delivered"; WhatsApp's own delivery-status webhooks (sent/delivered/read/failed) are the authoritative signal.
- Use the official Cloud API (Meta) or a reputable BSP (e.g., Twilio, 360dialog) with a verified production number — not the free sandbox/test number, which expires test recipients every 24h and is unusable for a real supplier contact.

**Warning signs:**
- Code sends free-form `text` messages instead of a `template` message type for the very first supplier notification.
- No handling of WhatsApp delivery-status webhooks — the admin panel has no visibility into "message failed to deliver."
- Template not yet submitted/approved by the time payment integration is being built (approval should be requested early, in parallel with other phases, since Meta business verification for the WhatsApp Business Account itself can also take days).

**Phase to address:**
WhatsApp integration phase — template registration and Meta Business verification should start as early as possible (even before the phase where it's wired to checkout), since approval and business verification lead time is the least controllable part of the whole project.

---

### Pitfall 4: Vipps/Stripe going live is gated on business verification that takes longer than expected

**What goes wrong:**
Both Stripe and Vipps require KYC/business verification (organization number, bank account, in Vipps' case AML/PEP checks) before production keys/production payments work — this is separate from, and can take longer than, the technical integration checklist. A solo/non-technical operator may not have this paperwork ready, and discovering it late blocks the whole launch even if all code is done.

**Why it happens:**
Sandbox/test environments work immediately with no verification, so the team builds and tests the full flow assuming production will "just work" when they flip an environment variable, then discovers production API keys are gated behind a business-verification step that hasn't been started.

**How to avoid:**
- Kick off Vipps merchant onboarding (organization number registration, agreement, KYC) and Stripe account activation (business details, bank account) in parallel with the first phase of development, not after the checkout flow is built.
- Note Vipps-specific test-environment gaps that don't mirror production: card payments (CARD) and Freestanding cards are not testable in the Vipps test environment, so parts of the "pay by card via Stripe / pay via Vipps" flow can only be fully verified against production or Stripe's own (separate, well-supported) test mode — don't conflate "Vipps test env passed" with "production will behave identically."
- Budget calendar time (days to weeks, not hours) between "code complete" and "can accept real payments" for both providers.

**Warning signs:**
- Business verification / KYC process not started until after the checkout UI is built.
- Assuming Vipps test-environment card behavior matches production.
- No fallback plan if Vipps production approval is delayed relative to launch date (e.g., can the store soft-launch Stripe-only?).

**Phase to address:**
Should be flagged as a parallel/administrative task starting in the earliest phase (project setup / payment phase), independent of code work.

---

### Pitfall 5: Free-text name+number personalization breaks downstream formatting or introduces bad data into the WhatsApp message and print pipeline

**What goes wrong:**
Name and number for jersey printing is free text with no real "correct" answer (any name, diacritics, emoji, extremely long strings, or someone pasting an entire sentence). Left unvalidated, this can: overflow the WhatsApp template's character limits or break template variable formatting rules (WhatsApp rejects/mangles messages where variables contain certain characters or excessive length), look unprofessional to the China contact, or in the worst case be exploited (e.g., someone pastes control characters, extremely long text, or content unrelated to a name attempting a prompt/formatting injection into the message body).

**Why it happens:**
It's tempting to treat name+number as a trivial `<input>` with no constraints since "it's just for printing." But this field flows directly, unmoderated, into a message sent to a real business contact and (eventually) onto physical merchandise — there's no human review step before the WhatsApp send in this architecture (the owner only reviews *after* it's already been sent, per the "Kunde betaler → automatisk sendes til Kina" flow).

**How to avoid:**
- Constrain input at the form level: max length appropriate for a jersey (e.g., ~12-15 chars name, per real jersey printing conventions), allow letters (including Norwegian/international diacritics) and spaces/hyphens only, number field numeric-only with a sane digit range (0-99 or similar, matching real jersey numbering).
- Sanitize/escape when interpolating into the WhatsApp template payload (strip control characters, normalize whitespace, hard-truncate as a defense-in-depth backstop even if the form validation is somehow bypassed via direct API calls).
- Show the customer an explicit preview ("Trykk: RONALDO 7") before payment so mistakes are caught by the customer, not discovered after the order is already in the supplier's hands.
- Since there's no automated parsing of the China contact's WhatsApp replies (correctly out of scope per PROJECT.md), the admin panel should let the owner see and re-verify exactly what free text was sent per order, in case a correction needs to be relayed manually.

**Warning signs:**
- No max-length or character-set validation on name/number fields, either client- or server-side.
- The exact string sent to WhatsApp isn't stored/visible anywhere for the owner to double check against what the China contact confirms.
- No customer-facing order summary/preview step before final payment confirmation.

**Phase to address:**
Order/customization form phase — validation rules and preview step should ship with the initial form, not bolted on later.

---

### Pitfall 6: Bundle/package pricing calculated only on the client, or recalculated inconsistently between cart display and checkout

**What goes wrong:**
Bundle pricing based on quantity tiers (e.g., 1 jersey = X kr, 2 = Y kr/each, 3+ = Z kr/each) is easy to get right in the cart UI and wrong at the moment of charge if the price sent to Stripe/Vipps is computed client-side and trusted, or if a customer modifies the cart (adds/removes an item) in one tab while checkout is being created in another, causing the charged amount and the tier the customer saw to diverge. This is a common e-commerce bug class: client trusts its own math, server charges whatever the client says.

**Why it happens:**
For a low-volume single-operator store it's tempting to compute total price once in the frontend and pass a total amount straight into Stripe Checkout Session creation, especially since there's no complex cart/session state library. This is fine until concurrent tabs, back-button navigation, or a bug in the tier-boundary math (off-by-one on "3 or more" thresholds) causes a mismatch.

**How to avoid:**
- Always recompute the bundle price **server-side**, from the authoritative tier table and the actual line items, at the moment the Stripe Checkout Session / Vipps payment is created — never trust a client-submitted total. Stripe Checkout Sessions should be built from `price_data` computed server-side per request, not from a client-passed amount.
- Treat the cart as ephemeral client state only; the server is the single source of truth for both "what tier applies" and "what the total is" at checkout-creation time, and that snapshot (not a live recalculation) is what gets charged and what gets stored on the order — so what the customer paid for and what's noted in the order/WhatsApp message can never drift, even if pricing tiers change later.

**Warning signs:**
- Checkout session/payment creation API accepts a `total` or `amount` field from the client request body.
- No shared/single tier-pricing function used by both the cart display and the checkout creation code (i.e., two independent implementations of the pricing math).

**Phase to address:**
Checkout & payment phase — bundle pricing logic should be a single server-side utility, exercised by both cart UI (read-only display) and checkout creation (authoritative).

---

### Pitfall 7: Solo operator misses a new order and it silently stalls with no reminder

**What goes wrong:**
The entire fulfillment loop after payment depends on a human (the owner) noticing a new order in the admin panel, manually messaging/confirming with the China contact off-app, then coming back to mark it confirmed and later add tracking. If the owner is busy, traveling, or simply doesn't check the panel, a paid order can sit unconfirmed for days with the customer receiving no update at all (per PROJECT.md, the customer only gets an email when the owner marks it confirmed) — and the owner has no signal that anything is overdue.

**Why it happens:**
Single-admin, low-volume tools are usually designed around "the owner will just check the dashboard," which is fine for the first week of enthusiasm and fails as soon as normal life intervenes (weekend, illness, forgetting). There is no automatic customer-facing status between "paid" and "confirmed," so silence is invisible to everyone except a customer who's used to Amazon-speed updates increasingly wondering if they got scammed.

**How to avoid:**
- Send the owner (not just the customer) a notification for every new paid order — email at minimum, ideally also relayed as the same WhatsApp message thread or a separate WhatsApp/SMS ping to the owner's own number, since the owner is likely to see WhatsApp faster than a dashboard.
- Add a simple staleness indicator/reminder: if an order has been in "paid, not yet confirmed" for more than e.g. 24-48 hours, escalate — a second reminder email/notification to the owner, and surface it prominently (sorted to top, visually flagged) in the admin panel rather than mixed in with confirmed orders.
- Consider a lightweight customer-facing "we've received your order and are confirming it with our supplier" auto-email immediately on payment (independent of the owner's manual confirmation step) so the customer isn't left wondering during the gap — this also reduces support-question load on the owner.
- Keep the admin panel's default view to "needs attention" (new + stale) rather than a flat chronological list, so the highest-priority items are what the owner sees first, even after not checking for a few days.

**Warning signs:**
- Only the customer gets notified on state changes; the owner has no push/pull mechanism beyond manually opening the admin URL.
- No concept of "time since last status change" tracked or surfaced anywhere.
- Admin panel's default view is a plain list with no attention-needed sorting/highlighting.

**Phase to address:**
Admin panel phase — owner-facing notifications and staleness escalation should be part of the initial admin panel scope, not deferred as a "nice to have," since this directly protects the core value proposition (orders reliably reaching the supplier and customer trust in the interim).

---

### Pitfall 8: Selling officially-licensed club crests/branding reproduced by an unlicensed third-party manufacturer (flag, not a legal opinion)

**What goes wrong:**
Football club crests, names, and kit designs are typically protected trademarks/IP licensed exclusively to official kit manufacturers (Nike, Adidas, Puma, etc.) and the clubs/leagues themselves. A dropshipping operation where a third-party China-based manufacturer reproduces these designs without an official license is a well-known gray/risk area in this exact product category (this is the same pattern behind most "replica jersey" dropshipping stores) — platforms (Stripe, payment processors, ad platforms, marketplaces) and rights holders periodically act against stores in this space (account/payment holds, takedown requests, shipment seizures at customs in some jurisdictions).

**Why it happens:**
It's the entire existing business model the owner is already running informally, so it doesn't feel like a "new" decision being made during this project — but formalizing it into a public webapp with a payment processor and a real business name/brand increases visibility and surface area versus ad-hoc social-media/DM sales.

**How to avoid (flag only — not legal advice):**
- Worth the owner being aware, going in with eyes open, that this is a known risk category for this exact product type, and that Stripe/Vipps terms of service typically prohibit or restrict counterfeit/IP-infringing goods — a payment processor account freeze/termination is a realistic operational risk independent of any legal action, and would break the "automatic payment" flow this whole project is built around.
- Not something for this research/roadmap process to resolve, but worth the owner confirming their own comfort/plan around it (e.g., how the product is marketed/described) before investing in a polished, public-facing storefront.

**Warning signs:**
- Marketing copy/branding on the site explicitly claims "official" or "licensed" merchandise when it isn't.
- No consideration given to how the store's public-facing language describes the product (e.g., "fan-made", "replica" framing vs. implying official endorsement).

**Phase to address:**
Not a technical phase — flag once during initial project scoping/setup for the owner's awareness; revisit if Stripe/Vipps account review or restriction ever occurs.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Client-computed bundle price passed to checkout API | Faster to build cart | Price manipulation / mismatch bugs | Never |
| WhatsApp send happens inline in webhook handler (no queue) | Simpler code, one fewer moving part | Webhook timeout → retry → duplicate sends | OK only if send is made fully idempotent (checked-then-set flag) even without a queue |
| No owner-facing "new order" notification beyond the admin panel | Less to build initially | Orders silently stall, customer trust erodes | Never, given single-admin low-volume design — this is cheap to add and high value |
| Free-text name/number with no length/charset limits | Faster form to build | Broken WhatsApp template messages, bad prints, injection surface | Never — validation is cheap, add from day one |
| Using WhatsApp sandbox/test number through to near-launch | Avoids early Meta business verification hassle | Verification/template-approval delays discovered late, blocking launch | Only in the first 1-2 weeks of prototyping; must switch to real production number+template well before go-live |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|------------------|--------------------|
| Stripe | Creating the order from the success-page redirect instead of the webhook | Order creation/side-effects driven exclusively by verified `checkout.session.completed`/`payment_intent.succeeded` webhook events, deduped by event ID |
| Vipps ePayment API | Assuming test-environment behavior (no CARD/Freestanding testing) matches production | Explicitly test what Vipps test env supports, and plan a controlled first production transaction test before full launch |
| WhatsApp Cloud API | Sending free-form text as the first supplier notification, outside any 24h session | Use a pre-approved Utility template for every business-initiated order notification |
| WhatsApp Cloud API | Using the free sandbox/test number for anything beyond early dev | Provision a real production WhatsApp Business number tied to a verified Meta Business Account before go-live |
| Email (transactional) | Sending from an unverified/default domain, landing in spam | Verify sending domain (SPF/DKIM/DMARC) with the chosen provider before relying on order-confirmation emails |

## Performance Traps

Given explicitly low volume (<50 orders/month, single admin), classic scale-related performance traps (DB connection pooling limits, queue backpressure, etc.) are **not** a near-term concern for this project. The only "performance" consideration worth naming:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Synchronous WhatsApp API call inside the webhook request/response cycle | Occasional webhook timeouts under any latency spike from Meta's API, triggering retries | Decouple: webhook handler writes DB state fast and returns 200; a separate lightweight job/trigger performs the actual WhatsApp send | Not volume-related here — it's a latency/timeout risk from day one, independent of order count |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Not verifying Stripe/Vipps webhook signatures | Anyone can POST a fake "payment succeeded" event and get a free order sent to the supplier | Always verify the webhook signature (Stripe: `stripe.webhooks.constructEvent` with the signing secret) before trusting payload contents |
| Admin panel with weak/no auth for a single-user tool | One compromised login exposes all customer PII (names, addresses, emails) and lets an attacker fabricate/alter orders sent to the supplier | Use Supabase Auth with a strong password + ideally MFA for the single admin account, even though it's "just one user" |
| Storing full customer PII (address, etc.) without considering GDPR (Norway/EEA) | Regulatory exposure for a webapp handling real customer personal data and payments | Standard-practice data minimization, clear privacy notice, and secure storage — not a novel requirement here but worth calling out since this is a real commercial storefront, not a prototype |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| No preview/confirmation of the exact name+number text before payment | Customer discovers a typo only after production has started (unfixable without owner intervention) | Explicit "trykk: NAVN 7" preview step before the pay button |
| No customer-facing status between "paid" and "confirmed" | Customer left wondering if the order went through at all for potentially days | Auto-email "we've received your order" immediately on payment, independent of the manual confirmation step |
| Bundle discount tiers not shown clearly before adding more items | Customer doesn't realize buying one more jersey drops the price — misses the upsell / feels tricked if the price at checkout differs from expectation | Show live "add 1 more for X kr/each" messaging in the cart, driven by the same server-side pricing logic used at checkout |

## "Looks Done But Isn't" Checklist

- [ ] **Payment → order → WhatsApp flow:** Looks done after one manual happy-path test — verify it survives (a) closing the tab before redirect, (b) the webhook being delivered twice (Stripe CLI `stripe trigger checkout.session.completed` fired twice), (c) a failed/abandoned payment (no order/WhatsApp message should be created).
- [ ] **WhatsApp notification:** Looks done when tested against your own WhatsApp number mid-conversation (session window open) — verify it also works cold, via the approved template, against a number with no prior inbound message that day.
- [ ] **Bundle pricing:** Looks done when the cart UI shows the right discounted total — verify the actual Stripe/Vipps charge amount is independently recomputed server-side from the same tier table, not passed through from the client.
- [ ] **Admin "mark confirmed" / tracking number:** Looks done as a CRUD form — verify the corresponding customer email actually fires reliably (test failure/retry path if the email provider call fails) and that there's no way to add a tracking number to an order before it's paid/confirmed.
- [ ] **Free-text name/number field:** Looks done as a plain text input — verify server-side validation exists independent of the frontend (an attacker or bug bypassing the form should not be able to submit an unbounded string).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|-----------------|
| Duplicate WhatsApp message sent to China contact | LOW | Owner manually clarifies via WhatsApp that it's one order, not two; add idempotency guard before next order |
| Order paid but WhatsApp send failed silently | MEDIUM | Add a "resend to supplier" manual action in admin panel as a safety net so the owner can trigger it once noticed |
| Vipps production approval delayed past planned launch | MEDIUM | Soft-launch with Stripe (card) only, add Vipps toggle once approved, since PROJECT.md already treats both as parallel payment options rather than one dependent on the other |
| Owner discovers a stale, unconfirmed order days later | LOW | Manual apology/expedite with customer + supplier; retroactively this validates adding the staleness-escalation feature if not already built |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Order creation must be webhook-driven, not redirect-driven | Checkout & payment phase | Test: kill browser tab immediately after payment, confirm order + WhatsApp message still appear |
| Duplicate WhatsApp sends from webhook retries | Checkout & payment / WhatsApp phase | Test: fire the same webhook event twice, confirm exactly one WhatsApp message and one order row |
| WhatsApp template/session-window compliance | WhatsApp integration phase | Test: send the first notification cold (no prior inbound message that day) using the approved template, confirm delivery status |
| Vipps/Stripe business verification lead time | Project setup / payment phase (parallel administrative track) | Confirm production keys obtained and a real (small) test transaction succeeds before relying on the date for full launch |
| Bundle pricing server-side authority | Checkout & payment phase | Test: tamper with client-submitted amount/tier, confirm server recomputes and ignores it |
| Free-text personalization validation + preview | Order/customization form phase | Test: submit oversized/invalid characters via direct API call (bypassing the form), confirm rejection; confirm preview step shown before payment |
| Owner notification + stale-order escalation | Admin panel phase | Test: leave an order unconfirmed past the threshold, confirm an escalation notification fires and the order surfaces at the top of the admin view |
| Licensed-merchandise gray area | Project setup / scoping (owner awareness only) | N/A — awareness flag, revisit only if a payment processor ever restricts the account |

## Sources

- [Meta for Developers — Service messages / 24-hour customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages)
- [Twilio — Key Concepts and Terms for the WhatsApp Business Platform](https://www.twilio.com/docs/whatsapp/key-concepts)
- [saysimple — WhatsApp Business API: What is a Customer Care Window?](https://www.saysimple.com/blog/whatsapp-business-api-what-is-a-customer-care-window)
- [YCloud — WhatsApp API Template Rejection: 15+ Reasons & Fixes](https://www.ycloud.com/blog/common-whatsapp-api-template-message-rejection-reasons-with-fixes)
- [Vipps MobilePay Developer Docs — Test environment](https://developer.vippsmobilepay.com/docs/knowledge-base/test-environment/)
- [Vipps MobilePay Developer Docs — ePayment API checklist](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/checklist/)
- [Vipps MobilePay Developer Docs — Apply for services](https://developer.vippsmobilepay.com/docs/knowledge-base/applying-for-services/)
- [Hookdeck — How to Implement Webhook Idempotency](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency)
- [pedroalonso.net — Stripe Webhooks: Solving Race Conditions](https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/)
- Training-data knowledge of Stripe webhook signature verification, idempotency key usage, and general dropshipping/replica-merchandise IP risk patterns (flagged MEDIUM/LOW confidence where not independently re-verified above)

---
*Pitfalls research for: Norwegian custom football-jersey dropshipping storefront*
*Researched: 2026-07-07*
