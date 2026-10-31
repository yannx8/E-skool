---
title: All-in-one education ERP for Cameroon — competitors, ministry rules, product lens
date: 2026-10-29
inputs: erp-education-ux/rapport-erp-education-ux.md (user research, 34 captures), web research 2026-10-29
status: draft for bmad-product-brief
---

# All-in-one education ERP for Cameroon

Labels: **[Fact]** sourced on the date above (vendor pages are self-reported marketing), **[User]** from the user's research, **[Inference]** my reading, **[Rec]** recommendation.

## 0. Product as stated by the user (2026-10-29)

An all-in-one education ERP modelled on clast.io (ERP + SIS + LMS, one database, many roles, modules on/off), tailored to Cameroonian and African ministries (MINEDUB, MINESEC, GCE Board, MINESUP, MINEFOP), their rules, legacies and practices. Everything built before is discarded: new data model, routes and UI.

## 1. Competitive set

### 1.1 Positioning brief (derived from the user's words, to confirm)
- **Offer:** one platform for every school type (nursery to university and training centres), all modules.
- **Target:** private schools in Cameroon first, then Central/West Africa.
- **Differentiator claimed:** clast.io breadth + local ministry compliance + local payments.
- **Scoping consequence:** weight competitors by *local compliance depth and traction*, not feature count. Feature breadth is already common locally (see 1.3).

### 1.2 Tiered set

| Player | Tier | Segment | Ministry fit claimed | Payments | Price (FCFA) | Traction claimed | Source |
|---|---|---|---|---|---|---|---|
| Akademise School (Yaoundé) | Direct | nursery → university, training | none named | OM/MTN (top plan) | 20k/month ≤200 pupils, 50k ≤500 | 120+ schools, 20k+ families | [site](https://school.akademise.com/) |
| Kalara | Direct | nursery → university, LMD, public/private, FR/EN subsystems | MINESEC + MINEDUB reporting, LMD deliberations | OM/MTN auto-linked to pupil file | quote | none | [site](https://kalara-app.com/) |
| EduCam Pro (2024) | Direct | nursery → higher ed, training centres | not named; QR anti-fraud report cards | cash, MTN, OM | 20k–75k/month + 90–100/pupil | 20+ schools, 10k pupils | [site](https://www.educampro.cm/) |
| SchoolMboa (NSAD Consulting) | Direct | primary + secondary | MINESEC | bank, mobile money | 250k one-off, modules 25–50k | none | [site](https://schoolmboa.com/) |
| Sicolo (GEDEON, Yaoundé) | Direct | nursery → lycée | APC report cards, bilingual classes | e-payments via parent app | quote | 8 logos, 5+ years | [site](https://www.gedeon.cm/sicolo/) |
| BlingsEdu | Direct | secondary, MINESEC + GCE, all series | CBA report cards with QR, subject codes preloaded | not named | plans, no amounts | none | [site](https://blingsedu.com/cameroon-mastery) |
| Yadiko (Clerisy Ventures) | Direct | nursery → university | none named | parent app pays | from 500/pupil | 11 schools, 12k pupils | [site](https://yadiko.com/) |
| EduIgnite | Direct | schools | bilingual official report cards, coefficients, QR | not named | offline app free year 1 | 3 schools | [site](https://www.eduignite.online/) |
| Fasma | Direct | multi-tenant, FR/EN secondary tracks, GCE | GCE tracking | — | — | — (site down 2026-10-29) | [site](https://fasma-edu.link/) |
| EduManager Pro, EcoTech (free), ProsoftAfrica, Ubora Écoles (Douala), Samia | Direct (not profiled) | schools | CBA, /20, 6 sequences claimed | MTN/OM | free → yearly | EcoTech 10+ | [EduManager](https://edumanagerpro.app/), [EcoTech](https://www.ecotech-solutions.net/), [Prosoft](https://www.prosoftafrica.com/school-management-software-for-cameroon-africa/), [Ubora](https://uboraecoles.com/), [Samia](https://www.samia-edu.com/) |
| EducGest, KiboERP, Lakoli, EDUC GO ON, EcoleSaaS | Adjacent (West Africa) | schools | country-specific (FNE, SYSCOHADA) | Wave, OM, MTN, Moov auto | Lakoli 75/pupil/month | — | [EducGest](https://educgest.com/), [Kibo](https://kiboerp.com/erp/ecole), [Lakoli](https://lakoli.com/) |
| clast.io | Aspirational | K-12 → university, 18+ modules, 11 roles | configurable per type | Stripe/PayPal | USD 80–150/month/branch | — | [User] report §2 |
| Fedena, OpenEduCat, Classter | Aspirational (data model) | multi-type | configurable terminology, fee plans | gateways | — | — | [User] report §5 |
| Substitutes | Threat | Excel, notebooks, WhatsApp groups, Pronote-style desktop tools | — | cash | free | majority [Inference] | — |

### 1.3 What the set shows
- **[Fact]** At least 15 Cameroonian vendors already sell "all-in-one" with report cards, Mobile Money, SMS, payroll, transport and parent apps, at 20k–75k FCFA/month or 250k one-off.
- **[Fact]** Highest claimed traction is ~120 schools (Akademise). Most claim 3–20 schools or nothing. **[Inference]** The market is fragmented with no winner; features are table stakes and distribution (sales, onboarding, trust) decides.
- **[Inference]** clast.io breadth is not a differentiator here. Copying it gives you vendor #16.
- **[Fact]** Gaps visible on vendor pages (absence, not proof):
  - Moratoire as a tracked object: only SchoolMboa ("family-level moratoria") and Sicolo ("deferral requests") mention it.
  - `cartescolaire.cm` / matricule unique: no vendor mentions syncing with it.
  - Data protection (Law 2024/017): no vendor mentions it.
  - Founder/promoter anti-fraud view (cash leakage, cashier closing, who collected what): not marketed by anyone.
  - Verified official report-card templates: everyone claims "MINESEC-compliant", nobody shows the arrêté they follow.

## 2. Ministry rules (research-ops note)

QUESTION TYPE: comparison / decision memo.

| Rule area | Finding | Evidence | Confidence |
|---|---|---|---|
| School year (MINEDUB + MINESEC) | 6 sequences; report card every 2 sequences (= 3 terms); annual average = sum of 6 sequence averages / 6; last card carries the end-of-year class council decision; harmonised tests per level | [Fact] calendar decree on [kamerpower](https://kamerpower.com/?p=6912) (year label inconsistent) | Medium |
| Nursery, primary, teacher training | "Particular texts" govern continuous assessment, so the 6-sequence rule may not apply | [Fact] same decree | Medium |
| Primary report card (francophone, APC) | Since ~2018: competency grid with A / ECA / NA instead of marks; monthly evaluations (9/year) reported | [Fact] [Cameroon Tribune](https://www.cameroon-tribune.cm/article.html/23544/fr.html/ecole-primaire-comprendre-le-nouveau-bulletin-de-notes), single teacher account | Low — needs current MINEDUB circular + real cards |
| Secondary coefficients | Coefficient column per subject; set by school | [Fact] commercial template only | Low |
| Anglophone subsystem | Form 1–5, Lower/Upper Sixth; GCE Board sets O/A Level exams; CBA report cards claimed by vendors | [Fact] [Wikipedia GCE Board](https://EN.wikipedia.com/wiki/Cameroon_GCE_Board), BlingsEdu | Medium (structure) / Low (card format) |
| Official fees (public + private secondary) | Paid only through `cartescolaire.cm` with the pupil's matricule unique (6e–Terminale, public and private, since 2024-25); 5 operators (MTN, Orange, Express Union, Campost, Afriland); only platform receipts are valid | [Fact] [cameroun-online](https://www.cameroun-online.com/blog/frais-scolaires-paiement-en-ligne-cartescolaire-matricule-unique-rentree-2026-2027), [Cameroon Tribune](https://www.cameroon-tribune.cm/article.html/66390/fr.html/paiement-frais-de-scolarite-voici-le-matricule) | High |
| APEE | Voluntary APEE contributions must be kept strictly separate from other school revenue (circular 005/26/C/MINESEC/SG/CELSUI, 4 Sept 2026); older cap 25,000 F | [Fact] [237online](https://www.237online.com/rentree-scolaire-2026-minesec-instructions/) | Medium |
| Private tuition (pension) | No national fee schedule found for private schools | gap | — |
| Higher ed (MINESUP) | LMD since ~2007; 250–415 private institutes (IPES), most under tutelle of a state university; no doctorate in private IPES | [Fact] [Campus France](https://ressources.campusfrance.org/publications/focus_pays/fr/focus_cameroun_fr.pdf), [MINESUP register](https://minesup.gov.cm/2022/R%c3%a9pertoire%20des%20IPES,%20%c3%a9dtion%202022.pdf) | Medium; transcript/deliberation rules not found |
| Vocational (MINEFOP) | CQP valid only from MINEFOP-approved centres; DQP has a fixed curriculum and ministry-run exams (DQP-BEPC/Prob/BAC levels) | [Fact] [GoAfrica](https://www.goafricaonline.com/cm/articles/199-type-formation-professionnelle-cameroun), [INS](https://ins-cameroun.cm/wp-content/uploads/2023/06/RAPPORT-DANALYSE-FOP-2021-FINAL.pdf) | Low–Medium |
| Data protection | Law 2024/017 (23 Dec 2024), reported in force 23 June 2026; processing minors' data needs prior authorisation from the authority; implementing decree status unclear | [Fact] [DLA Piper](https://www.dlapiperdataprotection.com/?c=CM&t=law), [droitmediasfinance](https://droitmediasfinance.com/index.php/actualites/droit-tech-fintech/1297-cameroun-la-loi-sur-la-protection-des-donnees-a-caractere-personnel-entre-en-vigueur-ce-23-juin-2026) | Medium — get legal advice |

**Inference**
- Grading must be a configurable engine (per subsystem, level and year), not hard-coded: sequences/terms for secondary, competency grids for primary, credits/semesters for LMD, module/session for MINEFOP.
- Matricule unique belongs on the pupil identity from day one.
- APEE must be its own fund in the ledger (separate revenue stream).
- Pupil data is minors' data: plan consent, access logs and data export/deletion from the start.

**Recommendation:** before the PRD, collect 3–5 real report cards per target level (francophone primary, anglophone primary, francophone and anglophone secondary) and the current MINEDUB/MINESEC circulars. Treat those as the spec, not vendor pages. Re-check `cartescolaire.cm` and the data-protection decree every rentrée (a good candidate for a yearly monitor).

## 3. Product lens

### 3.1 Diagnostic
1. **Who:** promoter/founder of a private school in Douala or Yaoundé with 200–800 pupils, often running nursery + primary (+ secondary). [Inference; validate]
2. **Pain:** (a) fees not collected and cash leaking, (b) report cards eat days of staff time every term, (c) no visibility for the promoter. Today: Excel, notebooks, WhatsApp, or one of the vendors above.
3. **Why now:** matricule unique + cartescolaire.cm push digitisation; MoMo is normal; the data-protection law is now in force; no dominant vendor yet. [Fact + Inference]
4. **10-star:** clast.io for Africa: every school type, every ministry format official-grade, MoMo reconciled automatically, parents on WhatsApp, offline, works for a 5-campus group.
5. **MVP:** the smallest thing a school pays for over Excel *and* over 15 local vendors. Features alone do not do that.
6. **Anti-goals (for the first 12 months):** university LMD, MINEFOP, AI tutor, biometrics, GPS transport, LMS content, native apps.
7. **Metric:** paying schools that come back next term; % of fees collected vs expected; hours to produce a term's report cards.

### 3.2 Risks
- **Distribution over features.** Rivals sell at 20k FCFA/month with sales teams in Douala and Yaoundé. A solo dev with no field team is the biggest risk.
- **Scope.** clast.io has 18+ modules; a solo dev cannot build them to "official-grade" depth. The ERP must be broad in *architecture* but narrow in *what ships first*.
- **Unverified compliance.** If our report cards are wrong once, the school drops us. Real cards first.

### 3.3 Prioritisation (ICE = impact × confidence ÷ effort, 1–5)

| Module | I | C | E | ICE | Note |
|---|---|---|---|---|---|
| Core: institution, years, levels/classes, people, enrolment, roles, audit | 5 | 5 | 3 | 8.3 | Everything depends on it |
| Fees: plan by tranches, payments (cash/MoMo ref), receipts, moratoires, reminders, cash closing | 5 | 5 | 3 | 8.3 | The pain measured in FCFA; your prior domain knowledge |
| Grades + report cards (secondary FR/EN, primary APC) | 5 | 3 | 4 | 3.8 | Why schools buy locally; needs real cards |
| Promoter dashboard (anti-fraud) | 4 | 4 | 2 | 8.0 | Differentiator nobody markets |
| Attendance (manual roll call) | 3 | 4 | 2 | 6.0 | Cheap, daily use |
| Staff + payroll (simple) | 3 | 4 | 3 | 4.0 | Later |
| Parent WhatsApp / portal | 3 | 3 | 3 | 3.0 | Links first, portal later |
| Timetable | 2 | 3 | 4 | 1.5 | Later |
| Library, inventory, transport, canteen | 2 | 3 | 3 | 2.0 | Modules later |
| LMD / MINEFOP | 3 | 2 | 5 | 1.2 | After the core is proven |
| AI | 1 | 2 | 4 | 0.5 | Out |

### 3.4 Verdict
**Conditional go.** Build the clast.io-style *architecture* (one core, modules switched on per institution, structure and vocabulary configurable per ministry). Ship in this order: core → fees + promoter dashboard → grades/report cards → attendance → the rest.

Conditions:
1. Pick the first segment (recommend: private nursery + primary + secondary "complexes scolaires" in Douala, both subsystems).
2. Get 3 pilot schools, and real report cards from them, before building grades.
3. Price at or under local rivals (20k–50k FCFA/month, payable by term in MoMo).

## 4. Open questions for the user
1. First segment: primary only, primary + secondary complexes, or everything at once?
2. Interface language: bilingual FR/EN now (needed for the anglophone subsystem) instead of the 2026-10-27 English-only rule?
3. Parents: allow a parent portal/app now (clast.io has one; the old rule banned it)?
4. Hosting: multi-tenant SaaS (many schools, one deployment) or per-school install / offline?
5. Stack: keep Next.js + Prisma + Postgres, or reopen it in `bmad-architecture`?
