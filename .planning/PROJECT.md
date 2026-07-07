# SpJersey

## What This Is

En nettbutikk for skreddersydde fotballdrakter, bygget for en kompis som driver dropshipping mot en kontakt i Kina. Kunden bestiller og betaler på nett; bestillingen sendes automatisk til Kina-kontakten på WhatsApp, og eieren følger opp bekreftelse og sporing gjennom et enkelt admin-panel.

## Core Value

Kunden kan legge inn og betale for en skreddersydd drakt-bestilling på nett, og bestillingen når Kina-kontakten på WhatsApp uten at eieren må gjøre det manuelt.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Kunde kan velge liga/lag/sesong fra et strukturert utvalg av store ligaer (f.eks. Premier League, LaLiga, Serie A, Eliteserien) og kjente landslag
- [ ] Kunde kan velge størrelse
- [ ] Kunde kan hake av patcher fra et fast, kort utvalg (evt. "ingen")
- [ ] Kunde kan legge inn navn og nummer på trykk (uten ekstra kostnad)
- [ ] Kunde kan bestille flere drakter i én ordre og få automatisk pakkerabatt basert på faste mengde-trinn
- [ ] Kunde betaler med kort via Stripe eller med Vipps
- [ ] Ved fullført betaling sendes bestillingsdetaljene automatisk til Kina-kontakten på WhatsApp
- [ ] Eier logger inn i et admin-panel og ser innkommende bestillinger
- [ ] Eier kan markere en bestilling som bekreftet (etter å ha hørt fra Kina-kontakten på WhatsApp)
- [ ] Eier kan legge inn sporingsnummer på en bestilling
- [ ] Kunde får e-post når bestillingen er bekreftet
- [ ] Kunde får e-post med sporingsnummer når det er lagt inn
- [ ] Butikken er på norsk med priser i NOK

### Out of Scope

- Automatisk tolkning av WhatsApp-svar fra Kina-kontakten — for skjørt/upålitelig i v1, eier oppdaterer status manuelt i stedet
- Fritekst/bilde-basert draktbestilling utover strukturert liga/lag/sesong-valg — holder skjemaet forutsigbart å bygge og bruke i v1
- Engelsk språk / andre valutaer — målgruppen er norske kunder i v1
- Individuell prising per lag/sesong/kvalitet — lik grunnpris for alle drakter i v1, kun pakkerabatt varierer
- Flere admin-brukere / roller — kompisen er eneste bruker av admin-panelet i v1
- Lagerstyring / varelager — ren dropshipping, ingen egen lagerbeholdning å spore

## Context

- Eieren (kompisen) driver dropshipping av fotballdrakter og har én fast kontakt i Kina som produserer draktene. Kontakten er "pro" og kan lage nesten hva som helst av drakt, patch og trykk — flaskehalsen er at bestillinger i dag formidles manuelt.
- Pakker sendes direkte fra Kina-kontakten til sluttkunden (ren dropshipping, ikke via eieren).
- Forventet volum i starten er lavt (under 50 bestillinger/mnd), så løsningen trenger ikke skalere til høyt volum eller mange samtidige admin-brukere fra dag én.
- Foreslått teknisk retning fra brukeren: Supabase som backend, Vercel som deployment, Stripe for betaling (ny for brukeren), WhatsApp API for varsling til Kina-kontakten. Disse velges endelig i research/planlegging.

## Constraints

- **Marked**: Kun norsk språk og NOK som valuta i v1 — matcher målgruppen
- **Betaling**: Må støtte både kortbetaling (Stripe) og Vipps — norske kunder forventer Vipps
- **Varsling**: Bestilling må nå Kina-kontakten via WhatsApp — eksakt integrasjon (WhatsApp Business API vs. enklere løsning) avklares i research
- **Skala**: Bygges for lavt volum og én admin-bruker i v1, ikke for vekst til mange ansatte/høyt volum ennå

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Strukturert liga/lag/sesong-valg fremfor fritekst | Kina-kontakten kan lage "alt", men et forutsigbart skjema er enklere å bygge og bruke enn fritekst/bilde-opplasting | — Pending |
| Manuelt admin-panel for status/sporing, ikke automatisk WhatsApp-parsing | Automatisk tolkning av frie WhatsApp-svar er skjørt og upålitelig i v1 | — Pending |
| Supabase + Vercel + Stripe + Vipps + WhatsApp API som foreslått stack | Brukerens eget forslag, verifiseres i research | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-07 after initialization*
