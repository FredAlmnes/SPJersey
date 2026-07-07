# Feature Research

**Domain:** Custom/made-to-order apparel dropshipping storefront (football jerseys), Norwegian market, solo operator, low volume (<50 orders/month)
**Researched:** 2026-07-07
**Confidence:** MEDIUM (WebSearch-verified across multiple custom-jersey configurators, print-on-demand vendors, and OMS/admin-panel sources; no Context7-eligible libraries apply to this domain research — feature landscape is a market/UX question, not an API question)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for a customizable physical good storefront. Missing these makes the store feel broken or untrustworthy — especially important since this involves prepayment for a made-to-order item with a multi-week supply chain.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Structured product picker (league → team → season) | Every custom-jersey competitor (Custom Ink, spized, Printful, owayo) leads with a guided selector rather than free text — reduces ambiguity and errors | MEDIUM | Matches PROJECT.md's chosen approach; needs a maintained catalog/taxonomy |
| Size selection | Universal for apparel; without it the order is unfulfillable | LOW | Standard S–XXL or similar; consider a size guide link (see below) |
| Size guide / fit chart | Jersey sizing varies wildly by brand/manufacturer; #1 cause of custom-apparel returns and support messages | LOW | Even a static image/table reduces wrong-size orders and support burden — cheap to add, high payoff |
| Personalization fields (name + number) | Standard on every jersey configurator reviewed; explicitly in PROJECT.md scope | LOW–MEDIUM | Needs input validation (see Anti-Features/Pitfalls overlap: max length, allowed characters, numeric-only number field) |
| Live order summary / price recalculation | Users expect to see exactly what they're paying for and why before checkout, especially with patches + bundle pricing changing the total | MEDIUM | Recalculate on every option change; show per-jersey and order total |
| Clear total price before payment (incl. any fees) | Baseline trust requirement; hidden costs at checkout are the top cause of cart abandonment industry-wide | LOW | NOK, VAT-inclusive display is Norwegian consumer-law expectation |
| Multiple payment methods incl. local method (Vipps) | Norwegian consumers strongly expect Vipps alongside cards; its absence reads as "not a real Norwegian store" | MEDIUM | Already in PROJECT.md scope; card via Stripe, Vipps as second option |
| Order confirmation (on-screen + email) immediately after payment | Universal e-commerce expectation; especially critical here since fulfillment is manual/delayed by design | LOW | Must fire automatically right after successful Stripe/Vipps payment |
| Order status visibility to customer over time | Because there's a real gap between payment and shipping (manual China confirmation + production), customers need to know the order didn't vanish | LOW–MEDIUM | PROJECT.md covers this via "confirmed" and "tracking added" emails — sufficient given <50 orders/mo, no need for a customer-facing order-tracking page in v1 |
| Tracking number provided once shipped | Baseline for any physical goods e-commerce; explicit in scope | LOW | Manual entry by admin, triggers email |
| Basic input validation on custom fields | Prevents garbage/impossible orders (empty name+number combos, oversized text, invalid characters) reaching the supplier | LOW–MEDIUM | Validate before allowing payment, not just client-side cosmetic checks |
| Mobile-responsive configurator | Majority of apparel/fan purchases happen on mobile; broken mobile flow is disqualifying | MEDIUM | Framework choice should default to responsive layout |
| Clear "what happens after you pay" messaging | Because there's no instant automated confirmation from the China contact, setting expectations (production/shipping time) upfront prevents support anxiety and chargebacks | LOW | Simple explainer text near checkout — high leverage, near-zero cost |
| Contact/support channel (email or similar) | Any store selling prepaid custom goods needs a visible way to reach a human for order questions | LOW | Even just a support email address is sufficient at this scale |

### Differentiators (Competitive Advantage)

Not required for launch, but where this product can meaningfully outperform generic competitors or justify itself over ad hoc WhatsApp-ordering (the realistic alternative the owner is replacing).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Automatic quantity-based bundle pricing | Removes manual price negotiation the owner currently does by hand over WhatsApp; industry data shows tiered/quantity pricing measurably increases average order value (typically cited 15–25% AOV lift) and reduces cart abandonment from "I need to ask for a group price" friction | MEDIUM | Core to PROJECT.md; needs clearly displayed tiers so the *incentive* to add more jerseys is visible before checkout, not just applied silently at the end |
| Automatic WhatsApp hand-off to supplier on payment | This is the actual core value proposition per PROJECT.md — eliminates the owner's current manual relay step entirely | MEDIUM–HIGH | Depends on Payment Success feature; is the single biggest differentiator vs. "any generic Shopify custom-product store" |
| Fixed short patch list (checkboxes, not free text) | Faster, more predictable checkout than free-text customization forms seen on some competitor sites; reduces order errors reaching the China contact | LOW | Deliberately constrained scope per PROJECT.md — a differentiator specifically because it's *simpler* than rivals, not because it's more powerful |
| Same-owner quality control step before dispatch (package via owner) | A trust/quality differentiator vs. pure direct-from-China dropshipping — the owner can visually inspect before forwarding, which competitors doing direct-ship cannot offer | N/A (operational, not software) | Worth reflecting in customer-facing copy ("kvalitetssjekket av oss før forsendelse") even though it's not a software feature per se |
| Norwegian-language, NOK-only, Vipps-first experience | Removes all currency/language friction for the specific target audience versus international jersey sites (owayo, spized, Custom Ink) that are English/EUR/USD-first | LOW | This "narrow but deep" localization is itself the competitive wedge against larger international competitors for this audience |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good for a "real" e-commerce store but would add disproportionate cost/risk for this solo, low-volume, made-to-order operation. Several are already explicitly excluded in PROJECT.md; others are anticipated scope-creep risks worth flagging now.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Real inventory/stock management | "Feels like a real store should track stock" | Pure dropshipping has no owned inventory to track; building stock logic adds complexity with zero payoff | Explicitly out of scope per PROJECT.md — no SKU/stock counters at all |
| Free-text / image-upload custom jersey requests | China contact "can make almost anything," so why not let customers ask for anything? | Explodes form complexity, opens door to unfulfillable/ambiguous requests, makes WhatsApp hand-off message unpredictable and harder to price via bundle rules | Structured league/team/season + fixed patch list, as already scoped |
| Automatic parsing of WhatsApp replies from the China contact | Would "fully close the loop" automatically | WhatsApp free-text replies are unstructured and unreliable to parse; false-positive status changes would mislead customers about a paid order | Manual "mark confirmed" action in admin panel, as already scoped |
| Multi-admin roles / permissions system | "What if the business grows and hires help?" | Pure speculative scaling for a single-owner business with <50 orders/month; adds auth/authorization complexity with no near-term user | Single admin login; revisit only if a second employee is actually hired |
| Customer accounts / login / order history dashboard | Standard on big e-commerce platforms | At this volume, guest checkout + email notifications fully cover the "where's my order" need; account system adds auth, password reset, GDPR data-handling surface for no real benefit | Guest checkout with email confirmations/tracking; use order lookup via email+order number if ever needed |
| Live/automatic order-status webpage with real-time tracking events | "Feels modern," seen on Amazon/large retailers | Requires either carrier API integration or polling infrastructure disproportionate to <50 orders/month and a manual fulfillment process anyway | Email at each of the two meaningful transitions (confirmed, tracking added) — matches PROJECT.md scope |
| Per-team/per-season/per-quality dynamic pricing | Competitors like owayo/spized do premium tiering by kit type | Adds a pricing-rules engine and content-maintenance burden (keeping per-team prices current) disproportionate to a single flat-price catalog at this stage | Flat base price for all jerseys; only bundle-quantity discount varies, as already scoped |
| Multi-language / multi-currency support | "Could sell to other Nordic countries later" | Every additional locale/currency multiplies translation, legal (VAT), and support workload for a market not yet validated | Norwegian-only, NOK-only v1; revisit only after demonstrated demand from outside Norway |
| In-house 3D jersey design/preview configurator (like spized) | Larger competitors offer real-time 3D visualization | High engineering cost (3D asset pipeline, per-team texture mapping) for marginal conversion benefit at this volume and with a fixed, curated team/league catalog | Static reference images per team/kit is sufficient; customers are choosing an existing team kit, not designing an original one |
| Automated refund/dispute/chargeback handling workflow | "Real payment processors need this" | Stripe and Vipps already provide dashboards for manual refund/dispute handling; building custom logic in the admin panel duplicates what the payment processor already offers | Handle refunds/disputes directly in Stripe/Vipps merchant dashboards; no custom logic needed in v1 |

## Feature Dependencies

```
[Structured league/team/season picker]
    └──requires──> [Maintained team/league catalog data]

[Bundle/quantity pricing]
    └──requires──> [Live order summary / price recalculation]
                       └──requires──> [Structured product picker + size + patches + personalization inputs]

[Automatic WhatsApp hand-off to supplier]
    └──requires──> [Successful payment event (Stripe or Vipps)]
                       └──requires──> [Live order summary with final validated price]

[Admin "mark confirmed" action]
    └──requires──> [Order record created at payment time]
    └──enables──> [Customer "order confirmed" email]

[Admin "add tracking number" action]
    └──requires──> [Order marked confirmed] (logically prior step, though not necessarily enforced in software)
    └──enables──> [Customer "tracking added" email]

[Basic input validation on personalization fields] ──enhances──> [WhatsApp hand-off message quality]

[Size guide] ──enhances──> [Size selection] (reduces wrong-size orders without adding new order-flow steps)
```

### Dependency Notes

- **Bundle pricing requires live order summary:** customers must see the discount apply as they add jerseys, or the bundle discount's incentive value (encouraging larger orders) is lost — a silent end-of-checkout discount doesn't drive behavior the same way.
- **WhatsApp hand-off requires successful payment event:** this is the core automation and must trigger only on confirmed payment (not on cart abandonment or failed payment), to avoid sending unpaid/phantom orders to the supplier.
- **Admin confirm/tracking actions and customer emails are tightly coupled but should be built as two independent triggers**, not one combined status enum step, since the real-world flow (confirm now, tracking days/weeks later) has an indeterminate gap between them.
- **Input validation enhances (not blocks) the WhatsApp hand-off:** validation should happen at order-creation/payment time, not as a separate feature bolted on later — building it in from the start avoids un-parseable or nonsensical text ever reaching the supplier via WhatsApp.
- **Size guide and structured picker are independent** of each other and can be built/shipped in either order — no hard dependency, but pairing them in the same phase is efficient since both touch the same product-configuration screen.

## MVP Definition

### Launch With (v1)

Minimum viable product — matches PROJECT.md's Active requirements almost exactly; nothing here should be trimmed further without undermining the core value proposition.

- [ ] Structured league/team/season picker — the entire order can't start without it
- [ ] Size selection — unfulfillable order without it
- [ ] Fixed short patch checklist — core scoped customization option
- [ ] Name + number personalization fields with validation — core scoped customization option
- [ ] Live order summary with automatic bundle pricing for multiple jerseys — core value proposition (removes manual price negotiation)
- [ ] Stripe (card) + Vipps payment — required for Norwegian market trust and to trigger the automation
- [ ] Automatic WhatsApp message to China contact on successful payment — the core value proposition of the whole project
- [ ] Admin login + order list view — owner needs to see what came in
- [ ] Admin "mark confirmed" action + customer confirmation email — closes the loop on the manual supplier-confirmation step
- [ ] Admin "add tracking number" action + customer tracking email — closes the loop on shipping
- [ ] Norwegian language, NOK pricing throughout — matches target market, non-negotiable per PROJECT.md

### Add After Validation (v1.x)

Features to add once the core flow is proven with real orders.

- [ ] Size guide / fit chart image — add once real wrong-size complaints or support questions surface (or preemptively if cheap, since it's LOW complexity)
- [ ] "What happens after payment" explainer copy near checkout — add if support inquiries about order status appear frequently
- [ ] Basic order search/filter in admin (by name, status, date) — add once order volume makes scrolling a flat list cumbersome (rough trigger: >30–40 total historical orders)
- [ ] Order lookup for customers via email + order number (no full account system) — add if customers frequently ask "where's my order" between the two email touchpoints

### Future Consideration (v2+)

Features to defer until product-market fit and volume growth justify the cost.

- [ ] Multi-language / multi-currency (e.g., Swedish/Danish market) — defer until there's demonstrated demand outside Norway
- [ ] Per-team/per-quality dynamic pricing — defer until the flat-price model is proven insufficient or supplier costs vary meaningfully by team/league
- [ ] Customer accounts with order history — defer unless repeat-purchase behavior and volume make guest checkout genuinely inconvenient
- [ ] Real-time carrier tracking integration (auto-updating shipment status) — defer until volume/manual tracking-number entry becomes a bottleneck
- [ ] Multi-admin roles — defer until the business actually hires a second person

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Structured league/team/season picker | HIGH | MEDIUM | P1 |
| Size selection | HIGH | LOW | P1 |
| Patch checklist | HIGH | LOW | P1 |
| Name + number personalization + validation | HIGH | MEDIUM | P1 |
| Live order summary + bundle pricing | HIGH | MEDIUM | P1 |
| Stripe + Vipps payment | HIGH | MEDIUM | P1 |
| Automatic WhatsApp hand-off | HIGH | MEDIUM-HIGH | P1 |
| Admin order list + confirm/tracking actions | HIGH | LOW-MEDIUM | P1 |
| Customer email notifications (confirmed, tracking) | HIGH | LOW | P1 |
| Size guide / fit chart | MEDIUM | LOW | P2 |
| "After payment" explainer copy | MEDIUM | LOW | P2 |
| Admin order search/filter | LOW-MEDIUM | LOW | P2 |
| Customer order lookup (no account) | LOW-MEDIUM | MEDIUM | P3 |
| Multi-language/currency | LOW (for current audience) | HIGH | P3 |
| Per-team dynamic pricing | LOW (unvalidated need) | MEDIUM-HIGH | P3 |
| Customer accounts + order history | LOW (at this volume) | HIGH | P3 |
| Multi-admin roles | LOW (no second user exists) | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Custom Ink / owayo / spized (international custom jersey sites) | Generic print-on-demand (Printful, Printify) | Our Approach |
|---------|---|---|---|
| Product selection scope | Fully open design (any color/logo/text) or full team catalogs with 3D preview | Open designer for any print-on-demand product | Deliberately narrow: fixed league/team/season catalog only — trades flexibility for simplicity and reliable China-contact fulfillment |
| Personalization | Name/number fields with placement, font, color options; roster CSV upload for teams | Varies by product; usually simple text/image upload | Simple name+number fields, no placement/font choices — matches "pro" supplier who doesn't need granular instructions, keeps form fast |
| Pricing | Often per-item with team/kit-tier pricing; bulk/team order discounts common | Per-item, sometimes volume discounts via store apps | Flat per-jersey price + fixed bundle-quantity discount tiers — simpler to build and to explain to customers |
| Fulfillment automation | Backed by their own production or print partners with integrated order pipelines | Automated via API to POD provider, no manual human relay | Manual supplier relay, but automated via WhatsApp message trigger — a lighter-weight automation suited to a single overseas contact rather than an API-integrated fulfillment network |
| Order status for customer | Order tracking dashboards, sometimes real-time production status | Automated tracking sync from POD provider | Two email touchpoints (confirmed, tracking) instead of a live dashboard — appropriate given manual, lower-volume fulfillment |
| Local payment methods | Typically card/PayPal only, not localized to Norway | Card/PayPal only | Stripe (card) + Vipps — direct differentiator for the Norwegian audience these larger sites don't serve |

## Sources

- [Custom Ink - Team Jerseys](https://www.customink.com/products/team-jerseys/425) — personalization and roster-based ordering patterns (MEDIUM confidence, WebSearch-derived summary)
- [RareCustom Blog - Adding Names, Numbers & Logos](https://rarecustom.com/blog/custom-jersey-names-numbers-logos-roster-guide) — roster/personalization workflow conventions (MEDIUM)
- [owayo - Custom Jerseys](https://www.owayo.com/) — full open-design competitor reference (LOW-MEDIUM, not directly fetched)
- [Jersix](https://jersix.com/en/) — customized team uniform competitor (LOW, listing only)
- [spized - 3D Jersey Configurator](https://www.spized.com/en/design-your-own-jersey) — 3D real-time configurator as a high-end differentiator example (MEDIUM)
- [Printful - Custom Jerseys](https://www.printful.com/custom-jerseys) — print-on-demand fulfillment automation baseline (MEDIUM)
- [Printify - Successful POD stores 2026](https://printify.com/blog/successful-print-on-demand-stores/) — POD table-stakes and store examples (MEDIUM)
- [Shopify - Print on Demand guide](https://www.shopify.com/blog/print-on-demand) — POD table stakes overview (MEDIUM)
- [Self Employed - Affordable Order Management Systems](https://www.selfemployed.com/affordable-order-management-systems-for-self-employed-sellers/) — solo-seller admin panel feature expectations (MEDIUM)
- [Shopify - Order management and fulfillment help docs](https://help.shopify.com/en/manual/fulfillment) — baseline OMS feature set reference (MEDIUM, general platform not solo-specific)
- [ConvertCart - Tiered Discounts in eCommerce](https://www.convertcart.com/blog/tiered-discount-ecommerce) — quantity/bundle pricing tier structures and AOV impact data (MEDIUM)
- [Shopify - Product Bundling strategies 2026](https://www.shopify.com/blog/bundling-for-retail) — bundle pricing UX and checkout placement best practices (MEDIUM)

All confidence levels are MEDIUM: findings are corroborated across 3+ independent WebSearch results per topic (custom-jersey configurators, POD fulfillment, solo-operator OMS, bundle pricing), but not verified against Context7 or a single authoritative primary source, since this is a market/UX feature-landscape question rather than an SDK/API capability question.

---
*Feature research for: Custom/made-to-order football-jersey dropshipping storefront (Norway, solo operator)*
*Researched: 2026-07-07*
