# Phase 1: Foundation & Data Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 1-Foundation & Data Model
**Areas discussed:** Katalog-innhold, Prisstruktur, Patch-liste

---

## Katalog-innhold

| Option | Description | Selected |
|--------|-------------|----------|
| Premier League + Eliteserien | Engelsk toppfotball + norsk toppfotball | ✓ |
| + LaLiga, Serie A, Bundesliga | De største europeiske ligaene i tillegg | ✓ |
| + Kjente landslag | Norge, andre store fotball-nasjoner | ✓ |
| Annet / la meg spesifisere | — | |

**User's choice:** Alle tre alternativer valgt (multiSelect) — Premier League, Eliteserien, LaLiga, Serie A, Bundesliga, samt kjente landslag.

**Follow-up — Lag-utvalg per liga:**

| Option | Description | Selected |
|--------|-------------|----------|
| Alle lag i ligaen | Full liste automatisk | ✓ |
| Kuratert utvalg | Topp 6-8 lag per liga | |

**User's choice:** Alle lag i ligaen.

**Follow-up — Landslag:**

| Option | Description | Selected |
|--------|-------------|----------|
| Norge + store fotballnasjoner | Norge + VM/EM-nasjoner | ✓ |
| Bare Norge | Minimalt til å begynne med | |

**User's choice:** Norge + store fotballnasjoner.

**Follow-up — Sesong:**

| Option | Description | Selected |
|--------|-------------|----------|
| Kun nåværende sesong | Enklest å vedlikeholde | ✓ |
| Nåværende + forrige sesong | Retro-variant mulig | |

**User's choice:** Kun nåværende sesong.

**Notes:** Full rosters for all 5 leagues, no curation needed; national teams limited to Norway + major footballing nations; only current season kits, no retro options in v1.

---

## Prisstruktur

**Follow-up — Grunnpris:**

| Option | Description | Selected |
|--------|-------------|----------|
| Rundt 500 kr | Typisk prisleie for replika | |
| Rundt 600-700 kr | Litt høyere prisleie | |
| Annet beløp / la meg spesifisere | — | ✓ |

**User's choice:** 350 kr (free text).

**Follow-up — Pakketrinn:**

| Option | Description | Selected |
|--------|-------------|----------|
| 3 trinn (1 / 2 / 3+) | F.eks. 350/320/290 kr | ✓ |
| 2 trinn (1 / 2+) | Enklere modell | |
| Annet / la meg spesifisere | — | |

**User's choice:** 3 trinn.

**Follow-up — Beløp:**

| Option | Description | Selected |
|--------|-------------|----------|
| Bruk 350 / 320 / 290 kr | ~9% og 17% rabatt ved 2 og 3+ stk | ✓ |
| Andre beløp / la meg spesifisere | — | |

**User's choice:** 350 / 320 / 290 kr per stk (1 / 2 / 3+), gjelder for hele ordremengden (ikke marginalt).

**Notes:** Prisingstabellen skal være single source of truth server-side, brukt både i live-sammendrag (Fase 2) og server-side ombergening ved betaling (Fase 3, PAY-03).

---

## Patch-liste

| Option | Description | Selected |
|--------|-------------|----------|
| Ligamerke | Standard liga-badge | ✓ |
| Champions League-merke | For CL-lag | ✓ |
| Europa League/Conference League-merke | For EL/ECL-lag | ✓ |
| Annet / la meg spesifisere | — | |

**User's choice:** Ligamerke, Champions League-merke, Europa League/Conference League-merke (multiSelect) — pluss "Ingen" som alltid tilgjengelig alternativ.

**Follow-up — Patch-pris:**

| Option | Description | Selected |
|--------|-------------|----------|
| Inkludert, ingen ekstra kostnad | Samme som navn+nummer | ✓ |
| Fast tillegg per patch | F.eks. 50 kr ekstra | |

**User's choice:** Inkludert, ingen ekstra kostnad.

---

## Claude's Discretion

- Eksakt datastruktur for statisk katalog-config (TypeScript-konstanter vs. Supabase seed-tabeller)
- Admin-kontoens opprettelsesmekanisme (ikke eksplisitt diskutert denne økten — følger STACK.md's anbefaling om én manuelt opprettet admin-bruker uten public signup, med mindre bruker sier noe annet før planlegging)
- Eksakt RLS-policy-utforming (følger ARCHITECTURE.md's anbefalte form)

## Deferred Ideas

Ingen — diskusjonen holdt seg innenfor fasens omfang.
