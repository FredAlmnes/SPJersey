# Requirements: SpJersey

**Defined:** 2026-07-07
**Core Value:** Kunden kan legge inn og betale for en skreddersydd drakt-bestilling på nett, og bestillingen når Kina-kontakten på WhatsApp uten at eieren må gjøre det manuelt.

## v1 Requirements

### Produktbestilling (PROD)

- [x] **PROD-01**: Kunde kan velge liga, lag og sesong fra et strukturert utvalg av store ligaer og kjente landslag
- [x] **PROD-02**: Kunde kan velge størrelse
- [x] **PROD-03**: Kunde kan hake av patcher fra et fast, kort utvalg (inkl. "ingen")
- [x] **PROD-04**: Kunde kan legge inn navn og nummer på trykk, uten ekstra kostnad, med validering (lengde, tillatte tegn)
- [x] **PROD-05**: Kunde ser live oppdatert ordresammendrag med automatisk pakkerabatt når flere drakter legges til
- [x] **PROD-06**: Kunde har tilgang til en størrelsesguide/fit chart ved størrelsesvalg
- [ ] **PROD-07**: Kunde ser en kort forklaringstekst nær checkout om hva som skjer etter betaling (bekreftelse og sporing kommer senere)

### Betaling (PAY)

- [ ] **PAY-01**: Kunde kan betale med kort via Stripe
- [ ] **PAY-02**: Kunde kan betale med Vipps
- [ ] **PAY-03**: Totalpris (inkl. pakkerabatt) beregnes på nytt server-side ved betaling — klientens pris stoles aldri på direkte

### Bestilling & leverandørvarsling (ORDER)

- [ ] **ORDER-01**: Ordre opprettes kun fra en verifisert, idempotent betalings-webhook (Stripe/Vipps) — aldri fra klient-redirect
- [ ] **ORDER-02**: Ved vellykket betaling sendes bestillingsdetaljene automatisk til Kina-kontakten på WhatsApp
- [ ] **ORDER-03**: WhatsApp-sending er duplikatsikker — samme ordre sender aldri flere WhatsApp-meldinger selv om webhooken kalles på nytt

### Admin-panel (ADMIN)

- [ ] **ADMIN-01**: Eier kan logge inn i et admin-panel (én fast admin-bruker)
- [ ] **ADMIN-02**: Eier ser en liste over innkommende bestillinger
- [ ] **ADMIN-03**: Eier kan markere en bestilling som bekreftet
- [ ] **ADMIN-04**: Eier kan legge inn sporingsnummer på en bestilling
- [ ] **ADMIN-05**: Eier får et varsel (utover selve panelet) når en ny betalt bestilling kommer inn
- [ ] **ADMIN-06**: Bestillinger som har stått ubekreftet i 24–48 timer markeres tydelig i panelet

### Kundevarsling (CUST)

- [ ] **CUST-01**: Kunde får e-post når bestillingen markeres som bekreftet
- [ ] **CUST-02**: Kunde får e-post med sporingsnummer når det legges inn

### Generelt (GEN)

- [ ] **GEN-01**: Hele butikken (skjema, e-poster, admin) er på norsk med priser i NOK

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Kundeopplevelse

- **CUSTX-01**: Kunde kan slå opp ordrestatus selv via e-post + ordrenummer (uten fullt kontosystem)
- **CUSTX-02**: Ordresøk/filter i admin-panelet (navn, status, dato)

### Marked

- **MARK-01**: Engelsk språk / andre valutaer for internasjonale kunder
- **MARK-02**: Individuell prising per lag/sesong/kvalitet

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automatisk tolkning av WhatsApp-svar fra Kina-kontakten | For skjørt/upålitelig — frie tekstsvar er ikke trygt å parse automatisk, risikerer å villede kunden om ordrestatus |
| Fritekst/bilde-basert draktbestilling | Ville sprenge skjemakompleksiteten og gjøre WhatsApp-meldingen til leverandøren uforutsigbar; strukturert valg holder feilraten lav |
| Engelsk språk / andre valutaer | Målgruppen er norske kunder i v1; hvert nytt språk/valuta multipliserer oversettelse/support-arbeid |
| Individuell prising per lag/sesong/kvalitet | Lik grunnpris for alle drakter er enklere å bygge og forklare; kun pakkerabatt varierer i v1 |
| Flere admin-brukere / roller | Spekulativ skalering for en enkeltmanns-drift; revurderes kun hvis en ansatt faktisk kommer inn |
| Kundekontoer / innlogging / ordrehistorikk | Gjestehandel + e-postvarsler dekker behovet ved dette volumet; unngår unødvendig auth/GDPR-flate |
| Lagerstyring / varelager | Ren dropshipping — ingen egen lagerbeholdning å spore |
| Sanntids fraktsporing (automatisk oppdatering fra fraktselskap) | Krever API-integrasjon disproporsjonal i forhold til volumet; manuell sporingsnummer-e-post er tilstrekkelig |
| Automatisert refusjons-/tvisteflyt | Stripe og Vipps har egne dashboards for dette; ingen egen logikk trengs i v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROD-01 | Phase 2 | Complete |
| PROD-02 | Phase 2 | Complete |
| PROD-03 | Phase 2 | Complete |
| PROD-04 | Phase 2 | Complete |
| PROD-05 | Phase 2 | Complete |
| PROD-06 | Phase 2 | Complete |
| PROD-07 | Phase 2 | Pending |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Pending |
| PAY-03 | Phase 3 | Pending |
| ORDER-01 | Phase 3 | Pending |
| ORDER-02 | Phase 4 | Pending |
| ORDER-03 | Phase 4 | Pending |
| ADMIN-01 | Phase 1 | Pending |
| ADMIN-02 | Phase 5 | Pending |
| ADMIN-03 | Phase 5 | Pending |
| ADMIN-04 | Phase 5 | Pending |
| ADMIN-05 | Phase 5 | Pending |
| ADMIN-06 | Phase 5 | Pending |
| CUST-01 | Phase 5 | Pending |
| CUST-02 | Phase 5 | Pending |
| GEN-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-07*
*Last updated: 2026-07-07 after initial definition*
