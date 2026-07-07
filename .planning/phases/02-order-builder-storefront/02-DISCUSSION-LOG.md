# Phase 2: Order Builder & Storefront - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 2-Order Builder & Storefront
**Areas discussed:** Multi-drakt-flyt, Skjema-struktur, Størrelsesguide-innhold, Navn/nummer-validering

---

## Multi-drakt-flyt

| Option | Description | Selected |
|--------|-------------|----------|
| Handlekurv | Configure one jersey, add to cart, start next; cart is editable list before payment | ✓ |
| Gjenta skjema | "Add another jersey" button repeats the form below | |
| Kun én drakt per bestilling | One jersey per order, drop multi-jersey for this phase | |

**User's choice:** Handlekurv

| Option | Description | Selected |
|--------|-------------|----------|
| Full redigering | Click a cart item to reopen the configurator with all fields pre-filled | ✓ |
| Kun fjerning | Cart items can only be removed and re-added from scratch | |

**User's choice:** Full redigering

| Option | Description | Selected |
|--------|-------------|----------|
| Fast sidepanel | Sticky side panel next to the configurator (desktop), collapses to bottom summary (mobile) | ✓ |
| Egen kurv-side | Configurator and cart are separate pages/steps | |

**User's choice:** Fast sidepanel

**Notes:** User accepted all recommended options without deviation.

---

## Skjema-struktur

| Option | Description | Selected |
|--------|-------------|----------|
| Étt skjema | League→team→season→size→patches→name/number all on one page | ✓ |
| Steg-for-steg wizard | One choice at a time with "next" between steps | |

**User's choice:** Étt skjema

| Option | Description | Selected |
|--------|-------------|----------|
| Kaskaderende | Team list filters by league, season list filters by team | ✓ |
| Alle synlige samtidig | All fields independent and always visible | |

**User's choice:** Kaskaderende

| Option | Description | Selected |
|--------|-------------|----------|
| Samme side hele tiden | Form and cart panel visible together from the first moment | ✓ |
| Kurv vises etter første "Legg til" | Cart panel only appears after first item added | |

**User's choice:** Samme side hele tiden

**Notes:** User accepted all recommended options without deviation.

---

## Størrelsesguide-innhold

| Option | Description | Selected |
|--------|-------------|----------|
| Standard placeholder-tabell | Standard football jersey size table (S–3XL, cm measurements), clearly labeled placeholder | ✓ |
| Jeg har et konkret kart | User has real measurements from the China contact to use directly | |

**User's choice:** Standard placeholder-tabell

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/popover ved klikk | A "size guide" link/icon opens a modal with the table | ✓ |
| Alltid synlig inline | Table permanently visible under/beside the size selector | |

**User's choice:** Modal/popover ved klikk

| Option | Description | Selected |
|--------|-------------|----------|
| Standard voksen S–3XL | S, M, L, XL, XXL, 3XL adult sizes only | ✓ |
| Inkluder også barnestørrelser | Add kids' sizes in addition to adult sizes | |

**User's choice:** Standard voksen S–3XL

**Notes:** No real size chart exists yet from the China contact — placeholder is explicitly temporary, owner to swap in real measurements later.

---

## Navn/nummer-validering

| Option | Description | Selected |
|--------|-------------|----------|
| Maks 12 tegn, bokstaver+mellomrom+bindestrek | 12-char max, international letters (æøå etc.), spaces, hyphens | ✓ |
| Maks 15 tegn, samme tegnsett | Slightly longer limit, same character set | |

**User's choice:** Maks 12 tegn, bokstaver+mellomrom+bindestrek

| Option | Description | Selected |
|--------|-------------|----------|
| 0–99, kun heltall | Standard jersey number range, integers only | ✓ |
| 1–99, kun heltall | Excludes 0 as a valid jersey number | |

**User's choice:** 0–99, kun heltall

| Option | Description | Selected |
|--------|-------------|----------|
| Valgfritt | Name/number optional per jersey — plain jersey with no print is valid | ✓ |
| Påkrevd | All jerseys must have name and number | |

**User's choice:** Valgfritt

| Option | Description | Selected |
|--------|-------------|----------|
| Underveis (on blur/change) | Validation errors shown live as the field is used | ✓ |
| Kun ved innsending | Validation errors only shown on "add to cart" submission | |

**User's choice:** Underveis (on blur/change)

**Notes:** User accepted all recommended options without deviation.

---

## Claude's Discretion

- Exact visual layout/styling of the cart side panel and mobile collapse behavior.
- Exact wording of the post-payment explainer text (PROD-07) — Norwegian copy, owner can revise later.
- Whether size guide includes a rough garment-size correspondence in addition to cm measurements.
- Cart state management approach (client-only vs. persisted) — left for research/planning.

## Deferred Ideas

None — discussion stayed within phase scope. Kids' sizes was considered and explicitly decided against for v1 (not deferred as a future idea, just out of scope per the user's choice).
