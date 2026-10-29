---
title: E-skool
status: final
created: 2026-10-29
updated: 2026-10-29
---

# PRD: E-skool
*Working title: confirm.*

## 0. Document Purpose

This PRD defines the first version (MVP) of E-skool, a school management platform for private primary schools in Cameroon, built so that secondary schools, training centres and universities can plug into the same core later. It is for the builder, the pilot school's promoter and director, and the next workflows (UX, architecture, tickets). It builds on the approved brief (`../brief-eskool-erp/brief-eskool-erp.md`) and the research in `_bmad-output/research/` (competitors and ministry rules in `erp-cameroon-analysis.md`, UX references and the moratoire flow in `erp-education-ux/rapport-erp-education-ux.md`). It replaces the 2026-10-20 PRD in `_bmad-output/prd-eskool/`, which was finance-only.

Vocabulary is fixed in the Glossary (§3). Features are grouped in §4 with requirements (FR-1 to FR-58) numbered across the whole document. Inferences are tagged `[ASSUMPTION]` inline and listed in §11. Technical choices live in `addendum.md`, not here.

## 1. Vision

E-skool runs a private primary school's money and report cards from one place, in French and English, on the phones and the office computer the school already has. Its promise to the promoter is a number, not a feature list: **this term you collect more of your fees, on time, and you see every franc your staff took in.**

The fee side makes that promise measurable. Fee plans by tranche, payments in cash or Mobile Money with their reference, moratoires tracked as instalment plans, a daily list of parents to remind on WhatsApp, a cash closing per cashier, and a collection rate the promoter compares with last year. The report-card side brings teachers and parents into the app every month. Marks go in on the teacher's phone, report cards come out in the layout schools of each subsystem actually use, with a QR code anyone can check, and parents see them in the portal next to their balance.

Every school is a tenant of one shared online platform. The core (school, year, terms, levels, classes, people, roles) is the same for every school type; modules switch on per school. Primary is the first type the core proves.

## 2. Target User

### 2.1 Jobs To Be Done

- **Promoter (buyer):** "Know, without asking anyone, how much of the fees came in, who took the cash, and whether this term is better than last year, so I trust my director and my numbers."
- **Director:** "Keep parents paying on time without awkward face-to-face chasing, grant delays fairly and have a record, and sign the report cards on time."
- **Bursar:** "Take a payment and hand a receipt in under a minute, and close my cash at the end of the day without a fight."
- **Teacher:** "Enter my pupils' evaluations once, on my phone, and never copy them again."
- **Parent:** "Know what I owe and by when, ask for more time without queueing, and see my child's report card."
- **School administrator:** "Set the school up from my Excel sheets and keep it correct."

### 2.2 Non-Users (MVP)

- Pupils: they never log in.
- Public schools, secondary schools, universities, training centres: later modules (§6.3).
- School groups needing a consolidated view across several schools: later.
- Government bodies: no reporting to ministries in the MVP.

### 2.3 Key User Journeys

Names are illustrative `[ASSUMPTION: personas not interview-based; confirm with the pilot school]`.

- **UJ-1. Mme Ngo sets up her school from Excel.**
  - **Persona + context:** Mme Ngo, school administrator (often the secretary), knows Excel, not new software. First week of term 2.
  - **Entry state:** the platform admin created the school and her account; she signs in on the office computer.
  - **Path:** picks the school year and the 3 terms; ticks the levels the school runs (SIL to CM2 francophone, Class 1 to 6 anglophone) and names the classes; enters the fee plan per level; downloads the pupil template, pastes her sheet, uploads; reads the preview with row errors in French; fixes two rows; confirms.
  - **Climax:** "348 élèves, 211 familles, 0 erreur", and the promoter dashboard shows the expected fees for the year.
  - **Resolution:** she prints the parent portal codes per family for the next parents' meeting.
  - **Edge case:** two children share a mother's phone but have different surnames; the preview proposes one family and she confirms or splits it.

- **UJ-2. Mr Mbappe pays tranche 2 for two children and leaves with a receipt.**
  - **Persona + context:** Brice, bursar, at the counter; Mr Mbappe pays 60,000 FCFA by Orange Money for two children.
  - **Entry state:** Brice's cash session is open on the office computer.
  - **Path:** types "mbap", picks the family; the screen shows both children's balances by tranche and proposes the amount left on tranche 2; he enters 60,000, chooses Orange Money, types the transaction ID, confirms.
  - **Climax:** "Paiement enregistré", the family's balance is updated, and the receipt shows each child, the tranche paid and the balance left.
  - **Resolution:** he prints the receipt (80 mm) or sends it by WhatsApp, then searches the next parent.
  - **Edge case:** the same Orange Money transaction ID was already recorded yesterday; the system warns and asks for confirmation before saving.

- **UJ-3. M. Essomba approves a moratoire with a counter-proposal.**
  - **Persona + context:** the director; a mother asked in the parent portal to pay the 45,000 FCFA of tranche 2 in 4 instalments.
  - **Entry state:** the dashboard shows "1 demande de moratoire".
  - **Path:** opens the request; beside it sees the family's payment history, past moratoires (one honoured last year), siblings, and the school's limits (3 instalments maximum, last date 15 March); counter-proposes 3 instalments of 15,000 FCFA and writes a comment.
  - **Climax:** the mother accepts in the portal; the pupil moves from "En retard" to "Sous moratoire".
  - **Resolution:** reminders now follow the instalment dates, not the tranche date.
  - **Edge case:** the second instalment is 10 days late; the moratoire turns "Rompu" and appears on the director's list.

- **UJ-4. Monday reminders in ten minutes.**
  - **Persona + context:** the director (or the bursar) on Monday morning, on a phone.
  - **Entry state:** signed in; opens "À relancer aujourd'hui".
  - **Path:** the list shows families whose tranche is due in 3 days, overdue by 1, 7 or 15 days, or with a moratoire instalment due; she filters CM2; opens each row, which opens WhatsApp with a pre-filled message in the family's language; sends; marks done.
  - **Climax:** each family shows "Relancé le 03/02 par WhatsApp".
  - **Resolution:** families without WhatsApp get a printed notice for the child to take home.
  - **Edge case:** a phone number is invalid; the row is flagged, not silently skipped.

- **UJ-5. Mme Fon enters marks and the report cards come out the same day.**
  - **Persona + context:** teacher of CE2 B, francophone; end of term 1.
  - **Entry state:** signed in on her phone.
  - **Path:** opens her class and the evaluation period; for each subject goes pupil by pupil and taps the grade for each competency (A, ECA, NA) or types a mark; saves as she goes; marks the class complete.
  - **Climax:** the director checks completeness for the whole school, signs off, and prints all report cards as PDF in one batch, each with a QR code.
  - **Resolution:** report cards appear in the parent portal; a parent scans the QR and sees the card is genuine.
  - **Edge case:** the network drops while she is entering marks; nothing she already saved is lost and she continues when it returns.

- **UJ-6. Mme Atangana checks her balance and the report card from her phone.**
  - **Persona + context:** a mother of two, gets a WhatsApp reminder with a link.
  - **Entry state:** opens the link; signs in with her phone number and the code the school gave her.
  - **Path:** sees "Reste à payer: 45,000 FCFA / Déjà payé: 105,000 FCFA", one card per child with the next due date; opens a receipt; opens the term 1 report card; taps "Demander un délai" and proposes 3 instalments within the school's limits.
  - **Climax:** "Demande envoyée. Vous serez notifiée de la décision."
  - **Resolution:** she pays at the counter or by Mobile Money as usual.
  - **Edge case:** the school holds this child's report card until a decision on the balance; the portal says the card is available at the office, without the amount owed shown to anyone else.

- **UJ-7. The promoter reads the school at 6 pm.**
  - **Persona + context:** M. Tchoumi, promoter, away from the school most days, on his phone.
  - **Entry state:** signed in as Promoter, read-only.
  - **Path:** opens the dashboard: collected today and this term; collection rate of tranche 2 at 61% today, against last year's 48% at its Checkpoint; late vs under moratoire; cash closings with one gap of 15,000 FCFA by cashier A; collection rate by class.
  - **Climax:** he taps the gap and sees who closed, what was counted and what was expected.
  - **Resolution:** he calls the director; at the end of term he forwards the term report to his partner.
  - **Edge case:** today's closing is missing; the dashboard says "Clôture manquante" instead of showing a reassuring number.

## 3. Glossary

- **Platform** — the single online E-skool service hosting every School.
- **Platform admin** — E-skool staff who create Schools and manage Subscriptions. Never sees school data unless a School grants support access.
- **School** — one establishment and tenant of the Platform. Owns all its data. MVP: one School = one site.
- **Subscription** — a School's plan and billing state on the Platform (trial, active, suspended).
- **School type** — primary in the MVP; secondary, training centre, university later. Decides which Modules exist.
- **Module** — a feature set a School switches on (Fees, Report cards, Parent portal in the MVP).
- **School year** — e.g. 2026-2027. Holds Terms.
- **Term** — a part of the School year (default 3 "trimestres"). Holds Evaluation periods and Tranche due dates.
- **Evaluation period** — the unit marks are entered for (e.g. monthly evaluation or sequence). Count and dates per Term are configurable.
- **Subsystem** — francophone or anglophone. Set per Class. Decides Level names, Report card template and Grading scale.
- **Level** — a grade (SIL, CP, CE1, CE2, CM1, CM2; Class 1 to Class 6; nursery levels later).
- **Class** — a group of Pupils at one Level in one School year (e.g. CM1 A).
- **Pupil** — a child known to the School. Identity persists across School years.
- **Guardian** — an adult responsible for a Pupil (parent or other), with a phone number and a preferred Language.
- **Family** — the paying unit: one or more Guardians and the Pupils they pay for. Siblings share a Family.
- **Enrolment** — a Pupil in a Class for a School year. Promotion creates a new Enrolment and keeps history.
- **Staff member** — a person employed by the School (teacher, bursar, director...). May have a User.
- **User** — anyone who signs in: Staff member with a Role, or Guardian with Parent access.
- **Role** — Promoter, Director, Bursar, Secretary, Teacher, School administrator, Parent. A User may hold several Roles.
- **Fund** — a separate stream of money (tuition, registration, APE contribution, uniform, canteen...). Totals never mix Funds.
- **Fee plan** — what each Level owes for a School year: Fee items, their Fund, and their Tranches.
- **Fee item** — one fee in a Fee plan (registration, tuition, uniform...), mandatory or optional.
- **Tranche** — an instalment of a Fee item with an amount and a due date (label and count configurable).
- **Charge** — what one Enrolment owes for one Tranche after Discounts.
- **Discount** — a reduction on Charges (sibling, staff child, bursary, case by case), with a reason and an author.
- **Payment** — money received from a Family: amount, Payment method, reference, date, cashier. Never edited or deleted; only Voided.
- **Payment method** — cash, MTN MoMo, Orange Money, bank transfer.
- **Allocation** — the part of a Payment applied to a Charge (oldest due first unless the cashier chooses).
- **Receipt** — the numbered proof of a Payment.
- **Void** — the cancellation of a Payment by an authorised Role, with a reason; stays visible.
- **Balance** — Charges due minus Allocations, per Enrolment and per Family. Charges are already net of Discounts, so Discounts are never subtracted a second time. An overpayment carries forward as credit.
- **Due status** — per Enrolment: Paid up, Not yet due, Late, Under moratoire.
- **Moratoire** — an approved Instalment plan that replaces the due dates of one or more Charges, without changing the amount owed.
- **Instalment** — one dated amount inside a Moratoire.
- **Moratoire request** — a Guardian's or Staff member's proposal for a Moratoire, before the decision.
- **Moratoire rules** — the School's limits: maximum Instalments, last allowed date, minimum first Instalment, who may approve.
- **Reminder** — a message to a Guardian about a coming or missed due date, sent by WhatsApp link or printed Notice.
- **Reminder schedule** — the days relative to a due date when a Family appears on the reminder list (default −3, +1, +7, +15).
- **Notice** — the printable paper version of a Reminder ("avertissement").
- **Cash session** — one cashier's handling of cash for one day: opened, Payments in cash, closed with a counted amount.
- **Cash closing** — the end of a Cash session: expected cash, counted cash, Cash gap, amount handed over.
- **Cash gap** — counted minus expected cash at a Cash closing.
- **Collection rate** — Allocations ÷ Charges due, for a set of Charges, at a date. Charges Under moratoire stay in the denominator at their original due date, so granting a Moratoire never raises the rate. The headline number.
- **Checkpoint** — the date a Tranche's Collection rate is measured for comparison: its due date + 30 days `[ASSUMPTION]`.
- **Baseline** — the School's Collection rate for the same Tranche at its Checkpoint in the previous School year: one figure per Tranche, entered at setup with its source, or computed once a year has run on E-skool.
- **Subject** — a taught discipline for a Level (e.g. Français, Mathematics).
- **Competency** — an assessed skill within a Subject, for competency-based Report cards.
- **Grading scale** — how a result is expressed: competency scale (A / ECA / NA) or a mark out of a maximum (e.g. /20, /10).
- **Evaluation** — one Pupil's result for one Subject or Competency in one Evaluation period.
- **Report card** — the official document of a Pupil's results for a Term or the year ("bulletin").
- **Report card template** — the layout and rules of a Report card for a Subsystem and Level.
- **Verification code** — the QR code and short code on a Report card or Receipt that opens a public check page.
- **Parent portal** — the Guardians' web space: Balance, Receipts, Moratoires, Report cards.
- **Language** — French or English, per User and per Guardian, for screens and documents.
- **Audit log** — the record of who did what and when on money, people and results.

## 4. Features

### 4.1 Platform and schools

**Description:** One online Platform hosts every School. A Platform admin creates a School, its first School administrator and its Subscription. Each School only ever sees its own data. Modules switch on per School. MVP has one School type (primary) and three Modules (Fees, Report cards, Parent portal) on top of the core.

#### FR-1: Create a School
Platform admin can create a School with its name, School type, Subsystems, Language, contact, logo and stamp image, and its first School administrator. Realizes UJ-1.

**Consequences (testable):**
- The School administrator receives a sign-in link.
- A new School starts with no Pupils, no Users other than the School administrator, and a trial Subscription.

#### FR-2: Data separation between Schools
Every User sees and changes only the data of the Schools they belong to.

**Consequences (testable):**
- An automated test signed in as a User of School A gets "not found" for every record of School B, through every screen and every export.
- Platform admins cannot open school data unless the School administrator granted support access, and every such access is in the Audit log.

#### FR-3: Switch Modules on and off
School administrator can switch Fees, Report cards and Parent portal on or off.

**Consequences (testable):**
- A switched-off Module disappears from menus and its pages return "not available".
- Switching a Module off never deletes its data.

#### FR-4: Subscription state
Platform admin can set a School's Subscription to trial, active or suspended.

**Consequences (testable):**
- A suspended School can sign in and read and export its data but cannot record new Payments or Evaluations.
- The School administrator sees the trial end date.

### 4.2 School structure

**Description:** The School administrator describes the School year once: Terms, Evaluation periods, Levels, Classes with their Subsystem, Subjects and Competencies. Nothing about structure is hard-coded; defaults come from the ministry rules for primary, and the School can adjust them. Realizes UJ-1.

#### FR-5: School year and Terms
School administrator can create a School year with its Terms and their dates.

**Consequences (testable):**
- Default: 3 Terms with dates prefilled from the national calendar for that year `[ASSUMPTION: the MINEDUB/MINESEC calendar is published before each rentrée and entered by the Platform admin]`.
- Only one School year is current; past years stay readable.

#### FR-6: Evaluation periods
School administrator can set how many Evaluation periods each Term holds and their dates.

**Consequences (testable):**
- Default for primary: 3 per Term (monthly) `[ASSUMPTION: from a 2018 press account of 9 monthly evaluations; confirm with real report cards]`.
- Changing the count is blocked once Evaluations exist for that Term.

#### FR-7: Levels and Classes per Subsystem
School administrator can pick the Levels the School runs for each Subsystem and create Classes for the School year.

**Consequences (testable):**
- Francophone Levels SIL, CP, CE1, CE2, CM1, CM2 and anglophone Levels Class 1 to Class 6 are offered; Level labels can be renamed.
- Each Class has exactly one Subsystem and one Level.

#### FR-8: Subjects and Competencies
School administrator can define Subjects per Level and, for competency-based templates, the Competencies under each Subject, with an order and optional coefficients.

**Consequences (testable):**
- The Platform ships a default Subject and Competency list per Subsystem and Level that the School can copy and edit `[ASSUMPTION: built from official curricula and the pilot school's report cards]`.
- A Subject with Evaluations cannot be deleted, only hidden from new periods.

### 4.3 People and enrolment

**Description:** Pupils, Guardians, Families and Staff members, entered by hand or imported from Excel. Families are the paying unit. Enrolment ties a Pupil to a Class for a year; promotion keeps history. Realizes UJ-1.

#### FR-9: Pupil and Guardian records
Secretary can create and edit a Pupil (names, sex, date of birth, photo optional, a School matricule generated by the system, and an optional national pupil ID for later secondary use) and their Guardians (name, relation, phone numbers, WhatsApp yes/no, Language).

**Consequences (testable):**
- Phone numbers are stored in international form (+237...) and validated.
- A Pupil with Payments or Evaluations cannot be deleted; they can leave (FR-13).

#### FR-10: Families
Secretary can group Pupils into a Family and choose which Guardian is the payer contact.

**Consequences (testable):**
- The system proposes merging Pupils whose Guardians share a phone number; the Secretary confirms or rejects.
- Family Balance is the sum of its Enrolments' Balances.

#### FR-11: Excel import with preview
School administrator can import Pupils, Guardians, Families, Classes and opening Balances from an Excel or CSV file built from a downloadable template. Realizes UJ-1.

**Consequences (testable):**
- Nothing is saved before the preview is confirmed; the preview shows counts and every invalid row with row number, column and a reason in the User's Language.
- Re-importing the same file creates zero new records (matching key: Pupil names + date of birth + Class) `[ASSUMPTION: confirm the matching key with the pilot school's sheets]`.
- Opening Balances import as paid-to-date amounts per Pupil and are marked as such in the Audit log.

#### FR-12: Promote to the next School year
School administrator can promote Classes to the next School year, choosing per Pupil: promoted, repeating or leaving.

**Consequences (testable):**
- Promotion creates new Enrolments; last year's Enrolments, Charges and Evaluations are unchanged.
- Unpaid Balances from last year stay visible on the Family as a separate line.

#### FR-13: Pupil leaves the School
Director can mark a Pupil as left with a date and reason.

**Consequences (testable):**
- The Pupil disappears from class lists and Evaluation entry but their Balance stays on the Family and in the reminder list `[ASSUMPTION: debt stays visible after leaving]`.

#### FR-14: Staff list
School administrator can keep a list of Staff members (name, function, phone, Classes taught) and give any of them a User with Roles.

**Consequences (testable):**
- A Teacher is linked to the Classes and Subjects they enter Evaluations for.

### 4.4 Users, roles and access

**Description:** Staff members sign in with a phone number or email and a password; Guardians sign in to the Parent portal with their phone number and a code the School gives them. Roles decide what each User sees and does.

#### FR-15: Role permissions
School administrator can give Roles to Users; each Role has a fixed permission set (table in `addendum.md`).

**Consequences (testable):**
- Promoter can read everything in the School and change nothing.
- Only Bursar and Director can record Payments; only Director (and Promoter if the School allows it) can Void a Payment or approve a Moratoire.
- Teachers see only their Classes' Pupils and Evaluations, never Balances.

#### FR-16: Staff sign-in
Staff Users can sign in, reset their password through the School administrator or a link, and sign out of all devices.

**Consequences (testable):**
- Five failed attempts lock sign-in for 15 minutes.
- Sessions end after 30 days without use.

#### FR-17: Parent access codes
Secretary can generate a Parent portal code per Guardian, print the codes per Class, and reset a code. Realizes UJ-1, UJ-6.

**Consequences (testable):**
- A Guardian signs in with their phone number and code; the code can be changed by the Guardian.
- A reset code invalidates the old one at once.

### 4.5 Fee plans and charges

**Description:** The School administrator defines what each Level owes: Fee items, each in a Fund, split into Tranches with due dates. Charges are created for each Enrolment. Discounts reduce Charges with a reason. Realizes UJ-1, UJ-2.

#### FR-18: Funds
School administrator can define Funds (default: Tuition, Registration, APE contribution, Other).

**Consequences (testable):**
- Every Fee item belongs to exactly one Fund; dashboards and exports show totals per Fund and never add APE contributions into tuition totals.

#### FR-19: Fee plan per Level
School administrator can define a Fee plan per Level for the School year: Fee items, amounts in whole FCFA, mandatory or optional, and Tranches with amount and due date.

**Consequences (testable):**
- The sum of a Fee item's Tranches equals the Fee item amount, or the plan cannot be saved.
- Amounts accept integers only.

#### FR-20: Charges for each Enrolment
System creates the Charges of an Enrolment from its Level's Fee plan when the Pupil is enrolled; optional Fee items are added per Pupil.

**Consequences (testable):**
- A Pupil enrolled after a Tranche's due date gets that Tranche as due at once, unless the Secretary waives it with a reason.
- Changing the Fee plan after Charges exist asks whether to apply to existing Enrolments and records the choice in the Audit log.

#### FR-21: Discounts
Director can apply a Discount (amount or percentage) to one or several Charges, with a type (sibling, staff child, bursary, other) and a reason; Secretary can propose one.

**Consequences (testable):**
- A sibling rule can be set once (e.g. 10% from the 3rd child) and applies automatically to new Enrolments of the Family.
- Each Discount shows who granted it and when; the dashboard lists Discounts granted this Term.

### 4.6 Payments and receipts

**Description:** Recording a Payment and handing over a Receipt must be faster than the paper receipt book. Payments are never edited or deleted. Realizes UJ-2.

#### FR-22: Record a Payment
Bursar can record a Payment for a Family: amount, Payment method, reference (mandatory for Mobile Money and bank), date. Realizes UJ-2.

**Consequences (testable):**
- The screen proposes the amount left on the earliest due Tranche of the Family.
- Recording takes at most 3 steps (find Family, enter amount and method, confirm): under 30 seconds for a trained Bursar, under 60 seconds the first week.
- A Mobile Money reference already used in the School triggers a warning and a confirmation.

#### FR-23: Allocation
System allocates a Payment to the Family's Charges, oldest due first, unless the Bursar chooses the Charges.

**Consequences (testable):**
- A Payment larger than what is due leaves a credit that the next Charges consume.
- Allocations never mix Funds silently: the Bursar sees which Fund each part goes to before confirming.

#### FR-24: Receipt
System produces a numbered Receipt for each Payment, in the Guardian's Language, printable in A5, A4 or 80 mm and shareable by WhatsApp. Realizes UJ-2, UJ-6.

**Consequences (testable):**
- After confirming, the Bursar sees "Paiement enregistré / Payment recorded" with three actions: next Payment (primary), print Receipt, send by WhatsApp.
- The WhatsApp message carries a Parent portal link; the full Receipt, with the Balance, opens only after the Guardian signs in (§5.3).
- The Receipt shows School, logo, stamp area, Family, each Pupil and Class, Tranches paid, Payment method and reference, cashier, date and time, and the Balance left after the Payment.
- Receipt numbers are sequential per School with no gaps; a Voided Payment keeps its number, marked "Annulé / Void".
- Each Receipt carries a Verification code.

#### FR-25: Void a Payment
Director can Void a Payment with a reason.

**Consequences (testable):**
- The Payment stays visible with who Voided it, when and why; Balances and dashboards update.
- A Payment inside a closed Cash session can still be Voided, and the Void shows on the next Cash closing as an adjustment.

#### FR-26: Family account
Any finance Role can open a Family account showing Charges, Payments, Discounts, Moratoires and Reminders on one timeline, with the Balance per Pupil and per Tranche. Realizes UJ-2, UJ-3.

**Consequences (testable):**
- The Balance shown equals Charges due (net of Discounts) minus Allocations, checked by an automated test on sample data.
- The account can be exported as a statement PDF.

### 4.7 Moratoires

**Description:** A Moratoire is a first-class object: a request, a decision, an Instalment plan, follow-up, and an end state. The amount owed never changes; only the dates do. Realizes UJ-3, UJ-6. Pattern references: Square payment schedule, Asana approval (research report §3).

#### FR-27: Moratoire rules
School administrator can set the Moratoire rules: maximum Instalments, last allowed date, minimum first Instalment, maximum Moratoires per Family per year, and an amount above which only the Director may approve.

**Consequences (testable):**
- Defaults: 3 Instalments, last date = end of the current Term, no minimum first Instalment, minimum 5,000 FCFA per Instalment, 2 per year, and no new Moratoire in the School year after a Broken one without the Director's override `[ASSUMPTION]`.

#### FR-28: Request a Moratoire
A Guardian (in the Parent portal) or a Bursar or Director (at the counter) can create a Moratoire request for one or more unpaid Charges: reason, proposed Instalments, optional photo of a document. Realizes UJ-3, UJ-6.

**Consequences (testable):**
- The form shows a one-line summary, e.g. "45 000 FCFA en 3 versements : 15 000 le 10/11, 15 000 le 10/12, 15 000 le 10/01".
- The sum of Instalments equals the unpaid amount of the chosen Charges.
- A request outside the Moratoire rules can still be sent but is marked "Hors règle / Outside rules".

#### FR-29: Decide on a request
Director can approve, counter-propose or refuse a Moratoire request; a Bursar can approve requests within the rules if the School allows it. Realizes UJ-3.

**Consequences (testable):**
- The decision screen shows, next to the request, the Family's Balance, payment history, past Moratoires and their outcome, and the number of Pupils in the Family.
- Refusal and counter-proposal require a comment.
- A counter-proposal becomes active only when the Guardian accepts it in the portal or the Director records the Guardian's acceptance.

#### FR-30: Moratoire follow-up and end states
System follows each active Moratoire Instalment by Instalment.

**Consequences (testable):**
- Statuses: Requested, Counter-proposed, Active, Refused, Late, Honoured, Broken, Cancelled.
- While Active and on time, the Pupils' Due status is "Under moratoire", not "Late".
- An Instalment unpaid N days after its date (default 7) turns the Moratoire Broken; the original due dates apply again and the Director's list shows it.
- A partial payment reduces the current Instalment; the remainder stays due on the same date.
- When all Instalments are paid, the Moratoire is Honoured.
- Every decision and status change appears in the Parent portal and on the "To remind today" list, so the Guardian can be told by WhatsApp the same day.

### 4.8 Reminders

**Description:** A daily list of Families to remind, built from the Reminder schedule and Moratoire Instalments, sent one by one through WhatsApp links with pre-filled bilingual messages, or printed as Notices. No paid messaging API in the MVP. Realizes UJ-4.

#### FR-31: Reminder schedule and templates
School administrator can set the Reminder schedule and edit message templates in French and English with fields (Guardian name, Pupil names, Class, amount, due date, portal link).

**Consequences (testable):**
- Default schedule −3, +1, +7, +15 days around each Tranche due date, and −2, +1 around each Instalment `[ASSUMPTION]`.
- A preview shows the exact message a given Family will receive.

#### FR-32: "To remind today" list
Director or Bursar can open the list of Families due for a Reminder today, filter by Class, Due status and amount, and open each in WhatsApp with the message in the Guardian's Language. Realizes UJ-4.

**Consequences (testable):**
- A Family with an Active, on-time Moratoire appears only for its Instalment dates.
- Marking a Reminder sent records date, channel and User; the row then shows "Relancé le ... / Reminded on ...".
- An invalid or missing phone number flags the row instead of hiding it.

#### FR-33: Printed Notices
Director can print Notices for selected Families, one per page or two per A4, with the stamp area.

**Consequences (testable):**
- A printed Notice is recorded as a Reminder with channel "Notice".

### 4.9 Cash closing

**Description:** Each cashier opens a Cash session, takes cash Payments, and closes it with a counted amount. The gap is visible to the Director and the Promoter. Locks prevent back-dating. Realizes UJ-7.

#### FR-34: Cash sessions
Bursar can open and close a Cash session per day; every cash Payment belongs to the open session of its cashier.

**Consequences (testable):**
- A cash Payment cannot be recorded without an open Cash session.
- Mobile Money and bank Payments are listed in the closing but do not count in the cash expected.

#### FR-35: Cash closing with gap
Bursar can close a Cash session by entering the counted cash and the amount handed to the Director or bank.

**Consequences (testable):**
- The Bursar can record cash paid out during the session (amount, reason, recipient); it lowers expected cash. Full expense tracking stays out of the MVP (§6.3).
- The closing shows opening cash, cash Payments, cash paid out, Voids, expected cash, counted cash and the Cash gap.
- After closing, no Payment can be recorded with a date on or before the closing date in that session; Voids show as adjustments on the next closing.
- A Cash session left open past midnight shows as "Clôture manquante / Missing closing" on the dashboard.

### 4.10 Promoter dashboard and collection rate

**Description:** The first screen for Promoter and Director. One headline number, its comparison, and the few figures that explain it. Light on a phone. Realizes UJ-7. Pattern references: Mercury KPIs above a filtered table, GlossGenius hero number (research report §3).

#### FR-36: Collection rate headline
Promoter and Director see the Collection rate of the current Tranche today and of the School year to date; once a Tranche reaches its Checkpoint, they see its rate next to its Baseline.

**Consequences (testable):**
- The Collection rate equals Allocations ÷ Charges due at that date for the same set of Charges, checked by an automated test.
- Charges Under moratoire count in the denominator at their original due date.
- Before the Checkpoint, the screen shows last year's Checkpoint figure as a target, not as a same-date comparison.
- When no Baseline exists, the screen says so instead of showing a comparison.

#### FR-37: Baseline entry
School administrator can enter, at setup, last year's expected and collected amounts per Tranche at its Checkpoint, from the School's own records, with a photo or file of the source.

**Consequences (testable):**
- The Baseline is stored with who entered it, its source file, and a "checked by E-skool" flag the Platform admin sets after reviewing the source with the School.
- It cannot be edited after the first Tranche due date of the current year without a reason in the Audit log.
- A Baseline that is not checked is shown on the dashboard but not used for billing (§7).

#### FR-38: Money breakdown
Promoter and Director see: expected, collected, Late and Under moratoire amounts per Fund, per Tranche and per Class; collected today and this week by cashier and by Payment method (cash, MTN, Orange, bank); Discounts granted; Voids.

**Consequences (testable):**
- Late and Under moratoire amounts are shown separately and add up, with Not yet due and collected, to expected.
- Each figure opens the list of Families behind it.

#### FR-39: Cash closings on the dashboard
Promoter and Director see each day's Cash closings with their Cash gap and cashier, and any missing closing. Realizes UJ-7.

**Consequences (testable):**
- A non-zero Cash gap is highlighted and opens the closing detail.

#### FR-40: Term report
Promoter can download a one-page Term report (PDF): Collection rate vs Baseline per Tranche, totals per Fund, Moratoires honoured and broken, Cash gaps, Discounts.

**Consequences (testable):**
- The figures in the Term report equal the dashboard figures at the report date.

### 4.11 Evaluations and report cards

**Description:** Teachers enter Evaluations per Evaluation period on their phone. The Director checks completeness, signs off, and prints Report cards in the official layout for the Class's Subsystem and Level, each with a Verification code. Realizes UJ-5.

#### FR-41: Report card templates
Platform admin maintains the Report card templates per Subsystem and Level (francophone competency-based, anglophone), and a School can choose and adjust header, logo, signatures and comment fields.

**Consequences (testable):**
- **Gate:** no template is built before at least 3 real report cards per Subsystem (pilot school + two others) and the current MINEDUB circular, if one is found, are collected and filed in `_bmad-output/research/`. If the gate is not met by the end of release R2 (§6.2), report cards slip and the PRD is updated `[ASSUMPTION: official MINEDUB templates not found; real cards are the reference]`.
- Competency-based Report cards print a short legend in the card's Language (e.g. "A = Acquis, ECA = En cours d'acquisition, NA = Non acquis").
- A School cannot change the rules of a template (Grading scale, averages), only its presentation fields.

#### FR-42: Grading scales
Each Report card template uses a Grading scale: competency scale (A / ECA / NA) or a mark out of a maximum, with the rule that turns marks into averages and, where the template requires, a rank in the Class.

**Consequences (testable):**
- Averages and ranks are computed by the system, never typed; an automated test checks them on sample Classes for each template.
- Rank is shown only if the template includes it `[ASSUMPTION: ranking is still common on primary report cards; confirm]`.

#### FR-43: Enter Evaluations
Teacher can enter Evaluations for their Classes and Subjects, pupil by pupil or subject by subject, on a phone. Realizes UJ-5.

**Consequences (testable):**
- Each Evaluation is saved as soon as it is entered; a dropped connection loses nothing already saved and the screen shows what is not yet saved.
- Values outside the Grading scale are refused.
- A Teacher can mark a Class and Subject complete for the Evaluation period.

#### FR-44: Completeness and sign-off
Director can see, for each Class and Evaluation period, which Subjects are complete, and sign off a Term for a Class.

**Consequences (testable):**
- After sign-off, Evaluations of that Term are locked; changing one requires the Director to reopen it, with a reason in the Audit log.

#### FR-45: Teacher and Director comments
Teacher can write a comment per Pupil per Term; Director can write the final decision (e.g. promoted) at the end of the year.

**Consequences (testable):**
- Comment length is limited to what fits the template.

#### FR-46: Print Report cards
Director can generate Report cards as PDF for one Pupil, a Class or the whole School in one batch, in the Class's Subsystem Language.

**Consequences (testable):**
- A whole School of 350 Pupils generates in under 5 minutes `[ASSUMPTION]`.
- Each Report card carries a Verification code.

#### FR-47: Public verification page
Anyone scanning a Verification code sees a page with the School, Pupil name, Class, Term and the issue date, and whether the document is valid or was replaced.

**Consequences (testable):**
- The page shows no marks and no Balance.
- A reissued Report card invalidates the earlier code.

#### FR-48: Hold a Report card
Director can mark a Pupil's Report card as "held at the office" for a Term. Realizes UJ-6.

**Consequences (testable):**
- Holding is a manual decision per Pupil with a reason; the system never holds a card automatically because of a Balance.
- A held card does not appear in the Parent portal; the portal says to contact the School and shows no reason.

### 4.12 Parent portal

**Description:** A light mobile web space for Guardians, reached from the WhatsApp link in Reminders and Receipts. Realizes UJ-6. Pattern references: Copilot "left to pay", Klarna instalment calculator, Square payment request page (research report §3).

#### FR-49: Family overview
Guardian can see, for each of their Pupils: Class, Balance, next due date and Due status, with a header "Reste à payer / Left to pay" and "Déjà payé / Paid so far".

**Consequences (testable):**
- A Guardian sees only the Pupils of their own Family.
- The page loads in under 3 seconds on a 3G connection `[ASSUMPTION]`.

#### FR-50: Receipts and statement
Guardian can open and download every Receipt and the Family statement.

**Consequences (testable):**
- Voided Payments show as voided.

#### FR-51: Moratoire request and answer
Guardian can request a Moratoire within the Moratoire rules, see its status, and accept or decline a counter-proposal. Realizes UJ-3, UJ-6.

**Consequences (testable):**
- The request screen only offers Instalment plans inside the rules, shown as dates and amounts.

#### FR-52: Report cards in the portal
Guardian can open their Pupils' signed-off Report cards that are not held.

**Consequences (testable):**
- Report cards appear only after Director sign-off (FR-44).

### 4.13 Bilingual interface and documents

**Description:** Every screen and document exists in French and English. Each User picks a Language; each Guardian has one; documents follow the Class's Subsystem or the Guardian's Language.

#### FR-53: Interface Language
Every User can switch the interface between French and English at any time.

**Consequences (testable):**
- No screen shows untranslated text; an automated check fails the build when a text key is missing in either Language.

#### FR-54: Document Language
Receipts, Notices and messages use the Guardian's Language; Report cards use the Language of the Class's Subsystem.

**Consequences (testable):**
- Amounts are written as whole FCFA with a space as thousands separator ("45 000 FCFA") in both Languages; dates as DD/MM/YYYY.

### 4.14 Audit, exports and data protection

**Description:** The School must be able to prove who did what, take its data out, and protect minors' data under Law 2024/017.

#### FR-55: Audit log
System records every create, change, Void, approval, sign-off, reopen and sign-in failure on money, people and Evaluations, with User, time and before/after values.

**Consequences (testable):**
- Director and Promoter can filter the Audit log by User, date and type.
- No User, including School administrators, can edit or delete Audit log entries.

#### FR-56: Exports
School administrator can export Pupils, Families, Charges, Payments, Moratoires and Evaluations to Excel at any time.

**Consequences (testable):**
- Exports include every row (no page limit) and their totals equal the dashboard totals.

#### FR-57: Guardian consent and data requests
Secretary records, for each Guardian, consent to the School processing the Family's data on E-skool and to receiving WhatsApp Reminders; School administrator can export or anonymise a Family's data on request.

**Consequences (testable):**
- A Guardian without WhatsApp consent never appears with a WhatsApp action, only with a Notice.
- Anonymising keeps money totals and Audit log intact but removes names and phone numbers.

#### FR-58: Backups
Platform keeps daily backups of every School's data for at least 30 days and can restore one School without affecting others.

**Consequences (testable):**
- A restore of one School is tested before the pilot goes live.

## 5. Cross-Cutting Requirements

### 5.1 Platform and devices
- Mobile-first web app: every screen works on a 360 px wide phone and on the office computer; no native app in the MVP.
- Touch targets at least 44 px; body text at least 16 px.
- Works on slow and unstable connections: pages under 3 seconds on 3G for the Parent portal and the Bursar's payment screen `[ASSUMPTION]`; forms keep what was typed when a request fails.

### 5.2 Money rules
- All amounts are whole FCFA (no decimals).
- Dates and "today" use Douala time, never the server's clock.
- Payments are never edited or deleted; corrections go through Void.
- Every money total on any screen equals the sum of its rows, checked by automated tests.

### 5.3 Security
- Each School's data is isolated (FR-2); permission checks run on the server for every action, never only in the interface.
- Passwords and Parent codes are stored hashed; sign-in attempts are rate-limited.
- Verification pages and WhatsApp links never expose Balances or marks to someone who is not signed in.

### 5.4 Onboarding and support
- Distribution is the main risk (research §3.2), so onboarding is part of the product: a filled sample import file, a one-page printed guide per Role in French and English, and a first on-site setup session with the School.
- Staff with little software experience (secretary, bursar) must complete their first import and first Payment without help after that session.
- Support by WhatsApp during school hours `[ASSUMPTION]`.

### 5.5 Reliability
- Target availability 99.5% during school hours (7:00–18:00 Douala time) `[ASSUMPTION]`.
- No data loss beyond the last 24 hours in a disaster (daily backups, FR-58).

## 6. MVP Scope

### 6.1 In Scope
- Platform with School creation, data separation, Modules and Subscription state (§4.1).
- School structure, people, Excel import, promotion (§4.2, §4.3).
- Users, Roles, Parent access codes (§4.4).
- Fees: Funds, Fee plans, Charges, Discounts, Payments, Receipts, Voids, Family account (§4.5, §4.6).
- Moratoires with rules, requests, decisions, follow-up (§4.7).
- Reminders by WhatsApp link and printed Notice (§4.8).
- Cash sessions and closings (§4.9).
- Promoter dashboard, Baseline, Term report (§4.10).
- Evaluations and Report cards for francophone and anglophone primary, with Verification codes (§4.11).
- Parent portal (§4.12).
- French and English everywhere (§4.13).
- Audit log, exports, consent, backups (§4.14).

### 6.2 Build order and cut line

One builder; each release ships to the pilot school before the next starts `[ASSUMPTION: dates]`.

| Release | Content | Target |
|---|---|---|
| R1 | Platform, structure, people, import, roles (§4.1–4.4), fee plans, Payments, Receipts, Family account (§4.5–4.6), dashboard without Baseline (FR-38), French and English (§4.13), Audit log (FR-55) | pilot live, Jan 2027 |
| R2 | Cash closing (§4.9), Moratoires at the counter (FR-27 to FR-30), Reminders (§4.8), Baseline and Checkpoint comparison (FR-36, FR-37) | Feb 2027 |
| R3 | Report cards (§4.11), only if the FR-41 gate is met | end of term 2, Mar 2027 |
| R4 | Parent portal (§4.12) incl. Moratoire requests from parents, Term report (FR-40), consent and exports (FR-56, FR-57) | before the Jul–Aug 2027 sales window |

**Cut line:** if time runs short, R4 moves to after the sales window and is sold as "coming"; R1 and R2 are never cut, because they carry SM-1 and the offer in §7.

### 6.3 Out of Scope for MVP
- Payroll, contracts and leave: the staff list only. Next module after the pilot.
- Expenses beyond cash paid out in a Cash session (FR-35): a later Module with categories and budgets.
- In-kind supplies ledger (reams, chalk brought by parents): a real practice in Douala schools, deferred to a later Module.
- "Payment being confirmed" statuses: Mobile Money Payments are recorded after the School sees the money, so they are never pending in the MVP.
- Attendance: cheap and daily, but not why a school pays. First candidate after payroll.
- Timetable, transport, canteen, library, inventory, maintenance requests: later Modules.
- Online payment initiated from the portal (Mobile Money API) and automatic reconciliation: Payments are recorded with their reference. Revisit once a school asks parents to pay remotely.
- SMS and WhatsApp Business API: WhatsApp links only. Revisit when reminder volume per school passes about 30 a week.
- Nursery levels: likely asked for by "complexes scolaires" running nursery + primary. `[NOTE FOR PM: cheap to add as Levels with a different template; revisit right after the pilot]`
- Secondary schools (sequences, coefficients, series, `cartescolaire.cm` matricule unique), universities (LMD), training centres (MINEFOP): later School types on the same core.
- School groups with several sites and a consolidated view.
- Online courses (LMS), AI features, biometrics, native apps.
- Reporting to ministries.

## 7. Monetization

- Price per Pupil per Term, payable by Mobile Money or transfer; target below local rivals (20,000–75,000 FCFA a month): about 300 FCFA per Pupil per Term `[ASSUMPTION]`.
- **"Pay when it works" offer:** the first Term is free; from the second Term, the School pays only if its Collection rate for the Term's Tranche at the Checkpoint beat its checked Baseline. To keep the trigger honest:
  - the rate uses Charges before Discounts granted after the Tranche's due date, and Charges Under moratoire stay in the denominator;
  - only a Baseline marked "checked by E-skool" counts (FR-37); without one, the School pays the normal price after the free Term;
  - the Term report (FR-40) shows the computation.
- No ads, no selling of data, no charge to parents.

## 8. Success Metrics

**Primary**
- **SM-1 Collection rate uplift:** Collection rate at the term-2 Tranche due date + 30 days vs the Baseline for the same Tranche; target +10 points at the pilot school `[ASSUMPTION]`. Validates FR-22 to FR-40.
- **SM-2 Paying schools:** Schools with an active paid Subscription after the July–August 2027 sales window; target 5 by October 2027. Validates the whole MVP.

**Secondary**
- **SM-3 Cash discipline:** share of school days with every Cash session closed; target ≥ 90% from week 3. Validates FR-34, FR-35.
- **SM-4 Report card time:** working days from the end of the last Evaluation period of a Term to all Report cards printed; target ≤ 1. Validates FR-43 to FR-46.
- **SM-5 Parent reach:** share of Families with at least one Parent portal sign-in per Term; target ≥ 40% by term 3 `[ASSUMPTION]`. Validates FR-49 to FR-52.
- **SM-6 Renewal:** share of paying Schools that pay the next Term; target ≥ 80%.
- **SM-7 Adoption:** share of the pilot school's fee money recorded in E-skool rather than the paper receipt book; target 100% from week 4. Validates FR-22, FR-24.

**Counter-metrics (do not optimize)**
- **SM-C1 Moratoires granted:** more Moratoires can make the Collection rate look better on paper (fewer "Late") while money comes later. Watch Broken Moratoires and amounts Under moratoire alongside SM-1. Counterbalances SM-1.
- **SM-C2 Reminders sent:** sending more messages is not the goal; a rising number of reminders per Family with a flat Collection rate means harassment, not progress. Counterbalances SM-1.
- **SM-C3 Report cards held:** holding cards pressures parents but harms trust and may breach rules; any rise is a red flag. Counterbalances SM-1.

## 9. Compliance and Regulatory

- **Personal data (Law 2024/017, reported in force 23 June 2026):** Pupils are minors; processing their data may need prior authorisation from the data protection authority. Each School is the data controller; E-skool is the processor. FR-2, FR-55 to FR-58 are the technical side. `[NOTE FOR PM: get legal advice before the pilot on who files the authorisation and what the processor contract must say]`
- **Ministry formats:** Report cards follow the layouts schools actually use under MINEDUB rules; E-skool claims no ministry endorsement.
- **Fee rules:** no national fee schedule for private primary tuition was found; APE contributions stay a separate Fund (FR-18), in line with the 2026 rentrée circular's demand to separate them (that circular is MINESEC's; applying it to primary is `[ASSUMPTION]`).

## 10. Open Questions

1. What do real francophone and anglophone primary report cards look like today at the pilot school and two others (layout, Evaluation periods per Term, ranks, averages)?
2. What was the pilot school's Collection rate per Tranche last year, and can it be rebuilt from its notebooks?
3. Who files the data-protection authorisation: each School, or E-skool on their behalf?
4. Will the pilot school accept "first Term free, pay if it works", and what price per Pupil does the promoter find fair?
5. Who sets Moratoire decisions in a real school: the director alone, or the promoter for large amounts?
6. Do parents in the pilot school use WhatsApp widely enough for links to work, and in which Language?
7. Does the pilot school run nursery classes that must be in the MVP?
8. Which Roles merge in a real school (e.g. Secretary = Bursar = School administrator)?
9. Should a Reminder link open a light page without sign-in (amount and due date only), as the UX research suggests, or always require the Parent code? Trade-off: reach vs privacy of the Balance.

## 11. Assumptions Index

- §2.3 Personas are illustrative, not interview-based.
- FR-5 National calendar entered by the Platform admin before each rentrée.
- FR-6 Primary has 3 Evaluation periods per Term (monthly).
- FR-8 Default Subject and Competency lists built from curricula and real cards.
- FR-11 Matching key for re-import: names + date of birth + Class.
- FR-13 Debt stays visible after a Pupil leaves.
- FR-27 Default Moratoire rules (3 Instalments, end of Term, 5,000 FCFA minimum, 2 per year, none after a Broken one).
- FR-31 Default Reminder schedule (−3, +1, +7, +15; −2, +1 for Instalments).
- FR-41 No official template found; real cards are the reference.
- FR-42 Ranking still common on primary report cards.
- FR-46 Whole-School generation under 5 minutes.
- FR-49, §5.1 Pages under 3 seconds on 3G.
- §5.5 Availability 99.5% in school hours.
- §3 Checkpoint = Tranche due date + 30 days.
- §5.4 Support by WhatsApp during school hours.
- §6.2 Release dates R1–R4.
- §7 Price about 300 FCFA per Pupil per Term.
- §8 SM-1 +10 points; SM-5 40% portal reach.
- §9 APE separation applied to primary.
