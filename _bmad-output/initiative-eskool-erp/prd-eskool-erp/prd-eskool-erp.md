---
title: E-skool
status: final
created: 2026-10-29
updated: 2026-10-30
---

# PRD: E-skool
*Working title: confirm.*

## 0. Document Purpose

This PRD defines the first version (MVP) of E-skool, a school management platform for private primary schools in Cameroon. It is for the builder, the pilot school's promoter and director, and the next workflows (architecture, tickets; all UI is designed in Claude Design). It builds on the approved brief (`../brief-eskool-erp/brief-eskool-erp.md`), the research in `_bmad-output/research/`, and the approved change proposal `../change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md` (2026-10-30), which narrowed the MVP to cash control, a send-home list, report cards and WhatsApp payment records.

E-skool is **not a general school ERP**. It solves a few painful problems of a private primary school deeply, copying patterns from software that already succeeds, and grows vertically from there.

Vocabulary is fixed in the Glossary (§3). Requirements are numbered FR-1 to FR-64; numbers removed by the 2026-10-30 change are listed in §6.3 and never reused. Inferences are tagged `[ASSUMPTION]` inline and listed in §11. Technical choices live in `addendum.md`.

## 1. Vision

E-skool stops cash from leaking between the counter and the promoter, and brings report cards out in a day, in French and English, on the phones and the office computer the school already has. Its promise to the promoter is a number: **this term you collect more of your fees, on time, and you see every franc your staff took in.**

The fee side follows what schools already do. Parents pay cash at the counter and leave with a numbered, stamped receipt. Each morning the system builds the list of pupils to send home for unpaid fees; the director confirms it. Because the list comes from what was recorded, a parent who paid but whose payment was not recorded shows up the next morning with a receipt in hand, so a cashier who pockets cash is caught within a day. Cancellations, discounts and payment delays belong to the director, and every day ends with a blind cash count. Parents get each payment confirmed and their due dates reminded on WhatsApp automatically.

The report-card side brings teachers into the app every month: marks go in on the teacher's phone, averages and ranks are computed, and the director prints the whole school's report cards in one batch.

Every school is a tenant of one shared online platform. The core (school, year, terms, levels, classes, people, roles) is the same for every school type; modules switch on per school.

## 2. Target User

### 2.1 Jobs To Be Done

- **Promoter (owner, buyer):** "Know, without asking anyone, how much of the fees came in, who took the cash, and whether this term is better than last year."
- **Director:** "Know each morning who must go home for fees, grant delays fairly with a record, keep the cashier honest, and sign the report cards on time."
- **Cashier:** "Take a payment and hand a stamped receipt in under a minute, and close my cash at the end of the day."
- **Teacher:** "Enter my pupils' marks once, on my phone, and never copy them again."
- **Parent (not a user):** "Get proof of what I paid and know what I still owe and by when." Parents receive receipts on paper and messages on WhatsApp; they do not sign in.

### 2.2 Non-Users (MVP)

- Parents and pupils: they never sign in.
- Public schools, secondary schools, universities, training centres: later School types.
- School groups needing a consolidated view: later.
- Government bodies: no reporting to ministries.

### 2.3 Key User Journeys

Names are illustrative `[ASSUMPTION: personas not interview-based; confirm with the pilot school]`.

- **UJ-1. M. Essomba sets up his school from Excel.**
  - **Persona + context:** the director, knows Excel, not new software. First week of term 2.
  - **Entry state:** the platform admin created the school and his account; he signs in on the office computer.
  - **Path:** picks the school year and the 3 terms; ticks the levels (SIL to CM2, Class 1 to 6) and names the classes; enters the fee plan per level with tranche due dates and the send-home rule; downloads the pupil template, pastes his sheet (pupils and guardians' phones), uploads; reads the preview with row errors; fixes two rows; confirms; creates accounts for the cashier and the teachers.
  - **Climax:** "348 élèves, 0 erreur", and the promoter dashboard shows the expected fees for the year.
  - **Edge case:** two pupils share a mother's phone; both are linked to the same guardian.

- **UJ-2. Mme Mbappe pays tranche 2 for two children and leaves with a stamped receipt.**
  - **Persona + context:** Brice, cashier, at the counter; Mme Mbappe hands over 60,000 FCFA cash for her two children.
  - **Entry state:** Brice's cash session is open on the office computer.
  - **Path:** types "mbap", picks the first child, adds the sibling; the screen shows each child's balance by tranche and proposes the amounts left on tranche 2; he confirms 60,000 FCFA.
  - **Climax:** "Paiement enregistré"; one receipt prints with both children, the tranche paid, the balance left, his name and the receipt number; he stamps it and hands it over. A minute later Mme Mbappe receives the WhatsApp confirmation.
  - **Edge case:** the printer is out of paper; the payment is already recorded and the receipt can be reprinted, marked "Duplicata".

- **UJ-3. The director grants a payment delay at the counter.**
  - **Persona + context:** M. Essomba; a father asks to pay the 45,000 FCFA of tranche 2 in 3 instalments.
  - **Path:** opens the pupil; sees payment history and past delays (one honoured last year) and the school's limits; grants 3 instalments of 15,000 FCFA with dates.
  - **Climax:** the pupil moves from "En retard" to "Délai accordé" and leaves the send-home list.
  - **Edge case:** the second instalment is 7 days late; the delay turns "Rompu" and the pupil is back on the next send-home list.

- **UJ-4. Monday send-home list.**
  - **Persona + context:** the director at 7:30 on Monday, on his phone.
  - **Path:** opens "À renvoyer aujourd'hui": 23 pupils by class, each with the amount owed; excludes one pupil whose mother called the promoter, with a reason; confirms.
  - **Climax:** teachers see the confirmed list for their class; guardians of the 22 pupils receive a WhatsApp message with the amount to pay for the child to return.
  - **Resolution:** at 10:00 a mother pays at the counter; the child is not on Tuesday's list.
  - **Edge case:** a mother arrives Tuesday with a stamped receipt but her child is still on the list; the receipt number does not exist in the system; the director has the cashier's name and the date (SM-8).

- **UJ-5. Mme Fon enters marks and the report cards come out the same day.**
  - **Persona + context:** teacher of CE2 B, francophone; end of term 1.
  - **Path:** opens her class and the evaluation period; for each subject types the mark out of 20 pupil by pupil; saves as she goes; marks the subject complete.
  - **Climax:** the director checks completeness for the whole school, signs off, and prints all report cards as PDF in one batch, each with a QR code.
  - **Edge case:** the network drops while she is entering marks; nothing already saved is lost.

- **UJ-7. The promoter reads the school at 6 pm.**
  - **Persona + context:** M. Tchoumi, promoter, on his phone, read-only.
  - **Path:** collected today and this term; collection rate of tranche 2 at 61% against last year's 48%; late vs under delay; today's cash closing with a gap of 15,000 FCFA by Brice; pupils sent home today.
  - **Climax:** he taps the gap and sees the counted amount, the expected amount and who approved the closing.
  - **Edge case:** today's closing is missing; the dashboard says "Clôture manquante".

(UJ-6, the parent portal journey, was removed on 2026-10-30.)

## 3. Glossary

- **Platform** — the single online E-skool service hosting every School.
- **Platform admin** — E-skool staff who create Schools and manage Subscriptions. Never sees school data unless a School grants support access.
- **School** — one establishment and tenant of the Platform. MVP: one School = one site.
- **Subscription** — a School's plan and billing state (trial, active, suspended).
- **Module** — a feature set a School switches on: Fees, Report cards, WhatsApp messages.
- **School year** — e.g. 2026-2027. Holds Terms.
- **Term** — a part of the School year (default 3 "trimestres"). Holds Evaluation periods and Tranche due dates.
- **Evaluation period** — the unit marks are entered for (e.g. monthly evaluation). Count and dates per Term are configurable.
- **Subsystem** — francophone or anglophone. Set per Class. Decides Level names, Report card template and Language of the Report card.
- **Level** — a grade (SIL, CP, CE1, CE2, CM1, CM2; Class 1 to Class 6).
- **Class** — a group of Pupils at one Level in one School year (e.g. CM1 A).
- **Pupil** — a child known to the School and the paying account. Identity persists across School years.
- **Guardian** — an adult contact of one or more Pupils: name, relation, phone, WhatsApp consent, Language. Not a User.
- **Enrolment** — a Pupil in a Class for a School year. Carries Charges, Payments and Balance.
- **Staff member** — a person employed by the School. May have a User.
- **User** — a Staff member who signs in, with one or more Roles.
- **Role** — Promoter, Director, Cashier, Teacher (§4.4).
- **Fund** — a separate stream of money (tuition, registration, APE contribution, other). Totals never mix Funds.
- **Fee plan** — what each Level owes for a School year: Fee items, their Fund, and their Tranches.
- **Fee item** — one fee in a Fee plan, mandatory or optional.
- **Tranche** — an instalment of a Fee item with an amount and a due date.
- **Charge** — what one Enrolment owes for one Tranche after Discounts.
- **Discount** — a reduction on Charges with a type, a reason and the Director who granted it.
- **Payment** — cash received for one Enrolment: amount, date, cashier. Never edited or deleted; only Voided.
- **Receipt** — the numbered printed proof of one or more Payments made in one visit (siblings together), stamped by hand.
- **Allocation** — the part of a Payment applied to a Charge (oldest due first unless the Cashier chooses).
- **Void** — the cancellation of a Payment by the Director, with a reason; stays visible.
- **Balance** — Charges due minus Allocations, per Enrolment. An overpayment carries forward as credit.
- **Due status** — per Enrolment: Paid up, Not yet due, Late, Under delay.
- **Payment delay** — new dates for one or more unpaid Charges granted by the Director, without changing the amount (formerly "Moratoire").
- **Instalment** — one dated amount inside a Payment delay.
- **Delay rules** — the School's limits: maximum Instalments, last allowed date, maximum delays per Pupil per year.
- **Send-home rule** — per Tranche, how many days after the due date unpaid Pupils go on the Send-home list, and the minimum amount owed.
- **Send-home list** — the daily list of Pupils to send home for unpaid fees, built by the system and confirmed by the Director.
- **Cash session** — one cashier's handling of cash for one day.
- **Cash closing** — the end of a Cash session: blind counted cash, expected cash, Cash gap, amount handed over.
- **Cash gap** — counted minus expected cash.
- **Gap threshold** — the largest Cash gap a closing accepts without Director approval (default 0 FCFA).
- **Collection rate** — Allocations ÷ Charges due, for a set of Charges, at a date. Charges Under delay stay in the denominator at their original due date. The headline number.
- **Checkpoint** — the date a Tranche's Collection rate is measured: due date + 30 days `[ASSUMPTION]`.
- **Baseline** — the School's Collection rate for the same Tranche at its Checkpoint last year.
- **Subject** — a taught discipline for a Level, with a coefficient.
- **Mark** — one Pupil's result for one Subject in one Evaluation period, out of the Subject's maximum (10 or 20).
- **Report card** — the document of a Pupil's results for a Term ("bulletin").
- **Report card template** — the standard layout and computation rules for a Subsystem.
- **Verification code** — the QR code and short code on a Report card or Receipt that opens a public check page.
- **WhatsApp message** — an automatic message to a Guardian from the School's WhatsApp Business number: Payment confirmation, Reminder or Send-home notice.
- **Reminder** — a WhatsApp message about a coming or missed due date.
- **Language** — French or English, per User and per Guardian.
- **Audit log** — the record of who did what and when on money, people and marks.

## 4. Features

### 4.1 Platform and schools

**Description:** One online Platform hosts every School. A Platform admin creates a School and its first Director. Each School only sees its own data. Modules switch on per School.

#### FR-1: Create a School
Platform admin can create a School with its name, Subsystems, Language, contact, logo and stamp image, and its first Director. Realizes UJ-1.

**Consequences (testable):**
- The Director receives a sign-in link.
- A new School starts with no Pupils, no Users other than the Director, and a trial Subscription.

#### FR-2: Data separation between Schools
Every User sees and changes only the data of the Schools they belong to.

**Consequences (testable):**
- An automated test signed in as a User of School A gets "not found" for every record of School B, through every screen and every export.
- Platform admins cannot open school data unless the Director granted support access, and every such access is in the Audit log.

#### FR-3: Switch Modules on and off
Director can switch Fees, Report cards and WhatsApp messages on or off.

**Consequences (testable):**
- A switched-off Module disappears from menus and its pages return "not available".
- Switching a Module off never deletes its data.

#### FR-4: Subscription state
Platform admin can set a School's Subscription to trial, active or suspended.

**Consequences (testable):**
- A suspended School can sign in, read and export its data but cannot record new Payments or Marks.

### 4.2 School structure

**Description:** The Director describes the School year once: Terms, Evaluation periods, Tranche due dates, Levels, Classes with their Subsystem, Subjects with coefficients. Realizes UJ-1.

#### FR-5: School year, Terms and key dates
Director can create a School year with its Terms, and see on one screen the Terms, Evaluation periods, Tranche due dates and the dates each Send-home rule starts.

**Consequences (testable):**
- Default: 3 Terms.
- Only one School year is current; past years stay readable.
- The key-dates screen lists every date in order, each linked to what it controls.

#### FR-6: Evaluation periods
Director can set how many Evaluation periods each Term holds and their dates.

**Consequences (testable):**
- Default for primary: 3 per Term (monthly) `[ASSUMPTION]`.
- Changing the count is blocked once Marks exist for that Term.

#### FR-7: Levels and Classes per Subsystem
Director can pick the Levels the School runs for each Subsystem and create Classes for the School year.

**Consequences (testable):**
- Francophone Levels SIL to CM2 and anglophone Levels Class 1 to Class 6 are offered; labels can be renamed.
- Each Class has exactly one Subsystem and one Level.

#### FR-8: Subjects and coefficients
Director can define Subjects per Level with an order, a maximum mark (10 or 20) and a coefficient.

**Consequences (testable):**
- The Platform ships a default Subject list per Subsystem and Level that the School can copy and edit `[ASSUMPTION]`.
- A Subject with Marks cannot be deleted, only hidden from new periods.

### 4.3 People and enrolment

**Description:** Pupils, Guardians and Staff members, entered by hand or imported from Excel. The Pupil is the paying account; Guardians are contacts. Realizes UJ-1.

#### FR-9: Pupil and Guardian records
Director can create and edit a Pupil (names, sex, date of birth, optional photo, a School matricule generated by the system) and link Guardians (name, relation, phone numbers, WhatsApp consent, Language). A Guardian can be linked to several Pupils.

**Consequences (testable):**
- Phone numbers are stored in international form (+237...) and validated.
- Only the Director can change a Guardian's phone number; the change is in the Audit log.
- A Pupil with Payments or Marks cannot be deleted; they can leave (FR-13).

#### FR-11: Excel import with preview
Director can import Pupils, Guardians, Classes and opening Balances from an Excel or CSV file built from a downloadable template. Realizes UJ-1.

**Consequences (testable):**
- Nothing is saved before the preview is confirmed; the preview shows counts and every invalid row with row number, column and a reason in the User's Language.
- Re-importing the same file creates zero new records (matching key: Pupil names + date of birth + Class) `[ASSUMPTION]`.
- Rows sharing a Guardian phone number link to one Guardian.
- Opening Balances import as paid-to-date amounts per Pupil and are marked as such in the Audit log.

#### FR-12: Promote to the next School year
Director can promote Classes to the next School year, choosing per Pupil: promoted, repeating or leaving.

**Consequences (testable):**
- Promotion creates new Enrolments; last year's Enrolments, Charges and Marks are unchanged.
- Unpaid Balances from last year stay visible on the Pupil as a separate line.

#### FR-13: Pupil leaves the School
Director can mark a Pupil as left with a date and reason.

**Consequences (testable):**
- The Pupil disappears from class lists, Mark entry and the Send-home list, but the Balance stays visible on the Pupil `[ASSUMPTION: debt stays visible after leaving]`.

#### FR-14: Staff list
Director can keep a list of Staff members (name, function, phone, Classes and Subjects taught) and give any of them a User with Roles.

**Consequences (testable):**
- A Teacher is linked to the Classes and Subjects they enter Marks for.

### 4.4 Users, roles and access

**Description:** Staff members sign in with a phone number or email and a password. Roles have fixed permissions copied from proven software: cancelling is a separate right (Fedena "Revert Transaction"), discounts are restricted (Loyverse), closing gaps need a manager (Odoo POS).

#### FR-15: Role permissions
Director can give Roles to Users; each Role has a fixed permission set.

| Role | Can | Cannot |
|---|---|---|
| Promoter | read everything in the School | change anything |
| Director | everything below, plus set up the year, fees, subjects, users and Guardian phones; enrol Pupils; grant Discounts and Payment delays; Void a Payment; confirm the Send-home list; approve a Cash closing above the Gap threshold; sign off a Term; print Report cards | — |
| Cashier | record cash Payments, print and reprint Receipts, see the confirmed Send-home list, close their Cash session with a blind count | Void, Discount, grant delays, edit the Send-home list, edit Guardian phones |
| Teacher | enter Marks and comments for their own Classes and Subjects; see the confirmed Send-home list for their Classes | see Balances or Payments |

**Consequences (testable):**
- Every permission is checked on the server; a test calls each forbidden action for each Role and gets "forbidden".
- A School may give the Promoter the Director's rights by also giving them the Director Role.

#### FR-16: Staff sign-in
Users can sign in, reset their password through the Director or a link, and sign out of all devices.

**Consequences (testable):**
- Five failed attempts lock sign-in for 15 minutes.
- Sessions end after 30 days without use.

### 4.5 Fee plans and charges

**Description:** The Director defines what each Level owes: Fee items, each in a Fund, split into Tranches with due dates. Charges are created for each Enrolment. Discounts reduce Charges with a reason.

#### FR-18: Funds
Director can define Funds (default: Tuition, Registration, APE contribution, Other).

**Consequences (testable):**
- Every Fee item belongs to exactly one Fund; dashboards and exports show totals per Fund and never add APE contributions into tuition totals.

#### FR-19: Fee plan per Level
Director can define a Fee plan per Level for the School year: Fee items, amounts in whole FCFA, mandatory or optional, and Tranches with amount and due date.

**Consequences (testable):**
- The sum of a Fee item's Tranches equals the Fee item amount, or the plan cannot be saved.
- Amounts accept integers only.

#### FR-20: Charges for each Enrolment
System creates the Charges of an Enrolment from its Level's Fee plan when the Pupil is enrolled; optional Fee items are added per Pupil.

**Consequences (testable):**
- A Pupil enrolled after a Tranche's due date gets that Tranche as due at once, unless the Director waives it with a reason.
- Changing the Fee plan after Charges exist asks whether to apply to existing Enrolments and records the choice in the Audit log.

#### FR-21: Discounts
Director can apply a Discount (amount or percentage) to one or several Charges, with a type (sibling, staff child, bursary, other) and a reason.

**Consequences (testable):**
- A sibling rule can be set once (e.g. 10% from the 3rd child of the same Guardian) and applies automatically to new Enrolments.
- Each Discount shows who granted it and when; the dashboard lists Discounts granted this Term.

### 4.6 Payments and receipts

**Description:** Recording a cash Payment and handing over a stamped Receipt must be faster than the paper receipt book. Payments are never edited or deleted. Realizes UJ-2.

#### FR-22: Record a cash Payment
Cashier can record a cash Payment for one Pupil, or for several Pupils sharing a Guardian in one visit. Realizes UJ-2.

**Consequences (testable):**
- The screen proposes, per Pupil, the amount left on the earliest due Tranche.
- Recording takes at most 3 steps (find Pupil and add siblings, enter amounts, confirm): under 30 seconds for a trained Cashier, under 60 seconds the first week.
- A Payment cannot be recorded without the Cashier's open Cash session.

#### FR-23: Allocation
System allocates a Payment to the Pupil's Charges, oldest due first, unless the Cashier chooses the Charges.

**Consequences (testable):**
- A Payment larger than what is due leaves a credit that the next Charges consume.
- The Cashier sees which Fund each part goes to before confirming.

#### FR-24: Receipt
System produces one numbered Receipt per visit, in the Guardian's Language, printable in A5, A4 or 80 mm. Realizes UJ-2.

**Consequences (testable):**
- After confirming, the Cashier sees "Paiement enregistré / Payment recorded" with two actions: print Receipt (primary), next Payment.
- The Receipt shows School, logo, stamp area, each Pupil and Class, Tranches paid, amounts, total, cashier name, date and time, and the Balance left per Pupil.
- Receipt numbers are sequential per School with no gaps; a Voided Payment keeps its number, marked "Annulé / Void".
- A reprint is marked "Duplicata" and logged.
- Each Receipt carries a Verification code.

#### FR-25: Void a Payment
Director can Void a Payment with a reason.

**Consequences (testable):**
- The Payment stays visible with who Voided it, when and why; Balances, the Send-home list and dashboards update.
- A Payment inside a closed Cash session can still be Voided, and the Void shows on the next Cash closing as an adjustment.

#### FR-26: Pupil account
Director, Cashier and Promoter can open a Pupil account showing Charges, Payments, Discounts, Payment delays, Send-home days and WhatsApp messages on one timeline, with the Balance per Tranche. Realizes UJ-2, UJ-3.

**Consequences (testable):**
- The Balance shown equals Charges due (net of Discounts) minus Allocations, checked by an automated test on sample data.
- The account can be exported as a statement PDF.

### 4.7 Payment delays

**Description:** The Director grants a Payment delay at the counter: new dates, same amount, followed Instalment by Instalment. Realizes UJ-3.

#### FR-27: Delay rules
Director can set the Delay rules: maximum Instalments, last allowed date, minimum Instalment, maximum delays per Pupil per year.

**Consequences (testable):**
- Defaults: 3 Instalments, last date = end of the current Term, minimum 5,000 FCFA per Instalment, 2 per year, none after a Broken one without the Director's override `[ASSUMPTION]`.

#### FR-28: Grant a Payment delay
Director can grant a Payment delay for one or more unpaid Charges of a Pupil, with Instalments and a reason.

**Consequences (testable):**
- The form shows a one-line summary, e.g. "45 000 FCFA en 3 versements : 15 000 le 10/11, 15 000 le 10/12, 15 000 le 10/01".
- The sum of Instalments equals the unpaid amount of the chosen Charges.
- A delay outside the Delay rules needs a written override reason.
- The decision screen shows the Pupil's Balance, payment history and past delays with their outcome.

#### FR-30: Delay follow-up and end states
System follows each Payment delay Instalment by Instalment.

**Consequences (testable):**
- Statuses: Active, Late, Honoured, Broken, Cancelled.
- While Active and on time, the Pupil's Due status is "Under delay", and the Pupil is excluded from the Send-home list.
- An Instalment unpaid 7 days after its date (configurable) turns the delay Broken; the original due dates apply again.
- A partial payment reduces the current Instalment.
- When all Instalments are paid, the delay is Honoured.

### 4.8 Send-home list

**Description:** Schools already send pupils home for unpaid fees. The system builds that list from recorded Payments, so a Payment that was taken but not recorded surfaces the next morning. Pattern: defaulter lists flagged to the principal and acted on by a permitted user (Schoolites, Entab, EdPrime). Realizes UJ-4.

#### FR-59: Send-home rule
Director can set, per Tranche, how many days after its due date unpaid Pupils go on the Send-home list and the minimum Balance on that Tranche.

**Consequences (testable):**
- Default: due date + 7 days, any amount above 0 `[ASSUMPTION]`.
- The rule's start date appears on the key-dates screen (FR-5).

#### FR-60: Daily Send-home list
System builds each school day, per Class, the list of Pupils past a Send-home rule with a Balance on that Tranche, excluding Pupils Under delay and Pupils who left; Director confirms it.

**Consequences (testable):**
- Each row shows Pupil, Class, Tranche, amount owed and days late.
- Director can exclude a Pupil for the day with a reason; every exclusion is in the Audit log and shown to the Promoter.
- Only the confirmed list is visible to Cashier and Teachers; Teachers see their own Classes only, without amounts `[ASSUMPTION]`.
- A Payment recorded before the next list is built removes the Pupil from it; a Void puts them back.
- The list is built with Douala dates; days without school (set in the School year) produce no list.

### 4.9 Cash closing

**Description:** Each Cashier opens a Cash session, takes cash Payments, and closes it with a blind count. Pattern: Odoo POS closing control with a maximum difference. Realizes UJ-7.

#### FR-34: Cash sessions
Cashier can open and close a Cash session per day; every Payment belongs to the open session of its Cashier.

**Consequences (testable):**
- A Payment cannot be recorded without an open Cash session.
- A Cash session left open past midnight shows as "Clôture manquante / Missing closing" on the dashboard.

#### FR-35: Blind cash closing with gap approval
Cashier closes a Cash session by entering the counted cash before seeing the expected amount, and the amount handed to the Director.

**Consequences (testable):**
- The expected amount and the Cash gap are shown only after the counted amount is saved; the counted amount cannot be changed afterwards.
- The Cashier can record cash paid out during the session (amount, reason, recipient); it lowers expected cash.
- The closing shows opening cash, Payments, cash paid out, Voids, expected cash, counted cash and the Cash gap.
- A gap above the Gap threshold (default 0 FCFA) leaves the closing "Awaiting approval" until the Director approves it with a comment.
- After closing, no Payment can be recorded in that session; later Voids show as adjustments on the next closing.

### 4.10 Promoter dashboard and collection rate

**Description:** The first screen for Promoter and Director. One headline number, its comparison, and the few figures that explain it. Realizes UJ-7.

#### FR-36: Collection rate headline
Promoter and Director see the Collection rate of the current Tranche today and of the School year to date; once a Tranche reaches its Checkpoint, they see its rate next to its Baseline.

**Consequences (testable):**
- The Collection rate equals Allocations ÷ Charges due at that date for the same set of Charges, checked by an automated test.
- Charges Under delay count in the denominator at their original due date.
- When no Baseline exists, the screen says so instead of showing a comparison.

#### FR-37: Baseline entry
Director can enter, at setup, last year's expected and collected amounts per Tranche at its Checkpoint, from the School's own records, with a photo or file of the source.

**Consequences (testable):**
- The Baseline is stored with who entered it, its source file, and a "checked by E-skool" flag the Platform admin sets after reviewing the source.
- It cannot be edited after the first Tranche due date of the current year without a reason in the Audit log.

#### FR-38: Money breakdown
Promoter and Director see expected, collected, Late and Under delay amounts per Fund, per Tranche and per Class; collected today and this week by Cashier; Discounts granted; Voids; Pupils sent home today.

**Consequences (testable):**
- Late and Under delay amounts are shown separately and add up, with Not yet due and collected, to expected.
- Each figure opens the list of Pupils behind it.

#### FR-39: Cash closings on the dashboard
Promoter and Director see each day's Cash closings with their Cash gap, Cashier and approver, and any missing closing. Realizes UJ-7.

**Consequences (testable):**
- A non-zero Cash gap is highlighted and opens the closing detail.

#### FR-40: Term report
Promoter can download a one-page Term report (PDF): Collection rate vs Baseline per Tranche, totals per Fund, delays honoured and broken, Cash gaps, Discounts, Send-home days.

**Consequences (testable):**
- The figures equal the dashboard figures at the report date.

### 4.11 Marks and report cards

**Description:** Teachers enter Marks per Evaluation period on their phone. The Director checks completeness, signs off, and prints Report cards from one standard template per Subsystem, each with a Verification code. Realizes UJ-5.

#### FR-41: Standard Report card templates
The Platform ships one standard Report card template per Subsystem (francophone primary, anglophone primary); a School can adjust header, logo, signatures and comment fields.

**Consequences (testable):**
- The template shows, per Subject: Marks per Evaluation period, Term average, coefficient, weighted points; then the Term average, rank in the Class, Class average, teacher comment, Director decision, signature and stamp areas.
- A School cannot change the computation rules, only presentation fields.
- Competency-grid report cards (A / ECA / NA) are out of the MVP (§6.3).

#### FR-42: Averages and ranks
System computes Subject averages, the weighted Term average and the rank in the Class.

**Consequences (testable):**
- Term average = Σ(Subject average × coefficient) ÷ Σ coefficients, on a /20 scale; Subjects marked /10 are scaled to /20 `[ASSUMPTION]`.
- Ties share a rank ("ex aequo").
- Averages and ranks are computed, never typed; an automated test checks them on a sample Class.

#### FR-43: Enter Marks
Teacher can enter Marks for their Classes and Subjects, pupil by pupil, on a phone. Realizes UJ-5.

**Consequences (testable):**
- Each Mark is saved as soon as it is entered; a dropped connection loses nothing already saved and the screen shows what is not yet saved.
- Values outside 0 and the Subject's maximum are refused; "Absent" is a valid entry and excluded from the average.
- A Teacher can mark a Class and Subject complete for the Evaluation period.

#### FR-44: Completeness and sign-off
Director can see, for each Class and Evaluation period, which Subjects are complete, and sign off a Term for a Class.

**Consequences (testable):**
- After sign-off, Marks of that Term are locked; changing one requires the Director to reopen it, with a reason in the Audit log.

#### FR-45: Teacher and Director comments
Teacher can write a comment per Pupil per Term; Director can write the decision at the end of the year.

**Consequences (testable):**
- Comment length is limited to what fits the template.

#### FR-46: Print Report cards
Director can generate Report cards as PDF for one Pupil, a Class or the whole School in one batch, in the Class's Subsystem Language.

**Consequences (testable):**
- A whole School of 350 Pupils generates in under 5 minutes `[ASSUMPTION]`.
- Each Report card carries a Verification code.

#### FR-47: Public verification page
Anyone scanning a Verification code sees the School, Pupil name, Class, Term (or Receipt number and date) and whether the document is valid, voided or replaced.

**Consequences (testable):**
- The page shows no Marks and no Balance.
- A reissued Report card invalidates the earlier code.

#### FR-48: Hold a Report card
Director can mark a Pupil's Report card as "held at the office" for a Term, with a reason.

**Consequences (testable):**
- Holding is a manual decision per Pupil; the system never holds a card automatically because of a Balance.
- A held card is left out of batch printing and listed separately.

### 4.12 WhatsApp payment records

**Description:** Parents get automatic, accurate messages from the School's WhatsApp Business number: each payment confirmed with the balance left, reminders only when they still owe, and the amount to pay when their child is sent home. Messages are approved utility templates sent through the WhatsApp Business Platform (Cloud API). A message never decides whether a Payment counts. Pattern: Edunext and OpenEduCat WhatsApp fee reminders, payment-confirmation templates from WhatsApp providers.

#### FR-61: Payment confirmation
System sends, after each Receipt, a WhatsApp message to each linked Guardian with WhatsApp consent: School, Pupil(s), amount, Receipt number, Balance left.

**Consequences (testable):**
- The message is queued in the same transaction as the Payment and sent afterwards; a failed send never blocks, delays or cancels the Payment.
- A Voided Payment sends a correction message.

#### FR-62: Smart reminders
System sends Reminders around each Tranche due date (default −3, +1, +7 days) and before each Payment-delay Instalment (default −2 days) to Guardians whose Pupil still owes on that Tranche or Instalment.

**Consequences (testable):**
- The message carries the exact amount owed and the date, in the Guardian's Language.
- No Reminder goes for a Tranche already paid, a Pupil Under delay (except for its Instalments) or a Pupil who left.
- A Guardian linked to several Pupils gets one message listing them.
- At most 3 Reminders per Pupil per Tranche (SM-C2).

#### FR-63: Send-home notice
When the Director confirms the Send-home list, the Guardians of each Pupil on it receive a message with the amount to pay for the child to return to class.

**Consequences (testable):**
- A Pupil excluded by the Director gets no notice.

#### FR-64: Message records and fallback
System stores every WhatsApp message (type, recipient, template, status queued/sent/delivered/failed, time) and shows it on the Pupil account.

**Consequences (testable):**
- Delivery statuses come from the WhatsApp delivery webhook.
- While the School's WhatsApp Business account is not connected, or for a failed message, the Director can open the same text as a `wa.me` link and send it by hand; it is recorded as "sent manually".
- The Director can edit template wording within the fields approved by WhatsApp.

### 4.13 Bilingual interface and documents

#### FR-53: Interface Language
Every User can switch the interface between French and English at any time.

**Consequences (testable):**
- No screen shows untranslated text; an automated check fails the build when a text key is missing in either Language.

#### FR-54: Document Language
Receipts and WhatsApp messages use the Guardian's Language; Report cards use the Language of the Class's Subsystem.

**Consequences (testable):**
- Amounts are written as whole FCFA with a space as thousands separator ("45 000 FCFA") in both Languages; dates as DD/MM/YYYY.

### 4.14 Audit, exports and data protection

#### FR-55: Audit log
System records every create, change, Void, Discount, delay, Send-home confirmation and exclusion, closing approval, sign-off, reopen and sign-in failure, with User, time and before/after values.

**Consequences (testable):**
- Director and Promoter can filter the Audit log by User, date and type.
- No User can edit or delete Audit log entries.

#### FR-56: Exports
Director can export Pupils, Guardians, Charges, Payments, Payment delays and Marks to Excel at any time.

**Consequences (testable):**
- Exports include every row and their totals equal the dashboard totals.

#### FR-57: Guardian consent and data requests
Director records, for each Guardian, consent to the School processing the data on E-skool and to receiving WhatsApp messages; Director can export or anonymise a Pupil's data on request.

**Consequences (testable):**
- A Guardian without WhatsApp consent never receives a message.
- Anonymising keeps money totals and the Audit log intact but removes names and phone numbers.

#### FR-58: Backups
Platform keeps daily backups of every School's data for at least 30 days and can restore one School without affecting others.

**Consequences (testable):**
- A restore of one School is tested before the pilot goes live.

## 5. Cross-Cutting Requirements

### 5.1 Platform and devices
- Mobile-first web app: every screen works on a 360 px wide phone and on the office computer; no native app.
- Touch targets at least 44 px; body text at least 16 px.
- Works on slow and unstable connections: the Cashier's payment screen under 3 seconds on 3G `[ASSUMPTION]`; forms keep what was typed when a request fails.
- All screens are designed in Claude Design before they are built.

### 5.2 Money rules
- All amounts are whole FCFA (no decimals).
- Dates and "today" use Douala time, never the server's clock.
- Payments are never edited or deleted; corrections go through Void.
- Every money total on any screen equals the sum of its rows, checked by automated tests.

### 5.3 Security
- Each School's data is isolated (FR-2); permission checks run on the server for every action.
- Passwords are stored hashed; sign-in attempts are rate-limited.
- Verification pages never expose Balances or Marks; WhatsApp messages only go to a Guardian linked to the Pupil.

### 5.4 Onboarding and support
- A filled sample import file, a one-page printed guide per Role in French and English, and a first on-site setup session.
- The Cashier records a first Payment without help after that session.
- Support by WhatsApp during school hours `[ASSUMPTION]`.

### 5.5 Reliability
- Target availability 99.5% during school hours (7:00–18:00 Douala time) `[ASSUMPTION]`.
- No data loss beyond the last 24 hours (FR-58).

## 6. MVP Scope

### 6.1 In Scope
- Platform, data separation, Modules, Subscription state (§4.1).
- School structure with key dates, people, Excel import, promotion (§4.2, §4.3).
- Staff Users and Roles (§4.4).
- Fees: Funds, Fee plans, Charges, Discounts, cash Payments, Receipts, Voids, Pupil account (§4.5, §4.6).
- Payment delays (§4.7), Send-home list (§4.8), Cash closing (§4.9).
- Promoter dashboard, Baseline, Term report (§4.10).
- Marks and standard Report cards with Verification codes (§4.11).
- WhatsApp payment records (§4.12).
- French and English everywhere (§4.13).
- Audit log, exports, consent, backups (§4.14).

### 6.2 Build order and cut line

One builder; each release ships to the pilot school before the next starts `[ASSUMPTION: dates]`.

| Release | Content | Target |
|---|---|---|
| R1 | Platform, structure, people, import, roles (§4.1–4.4), fee plans, cash Payments, Receipts, Pupil account (§4.5–4.6), dashboard without Baseline (FR-38), French and English (§4.13), Audit log (FR-55) | pilot live, Jan 2027 |
| R2 | Send-home list (§4.8), Cash closing (§4.9), Payment delays (§4.7), Baseline and Checkpoint comparison (FR-36, FR-37) | Feb 2027 |
| R3 | Marks and Report cards (§4.11) | end of term 2, Mar 2027 |
| R4 | WhatsApp payment records (§4.12), Term report (FR-40), consent and exports (FR-56, FR-57) | Apr 2027; WhatsApp Business verification starts in R1 |

**Cut line:** R1 and R2 are never cut, because they carry SM-1, SM-8 and the offer in §7. If R4 runs late, the `wa.me` fallback (FR-64) ships first.

### 6.3 Out of Scope for MVP
- **Removed on 2026-10-30 (numbers not reused):** FR-10 Families; FR-17 Parent access codes; FR-29 decisions on parent Moratoire requests; FR-31 to FR-33 WhatsApp link reminders and printed Notices (replaced by FR-61 to FR-64); FR-49 to FR-52 Parent portal.
- Parent portal and parent sign-in.
- Mobile Money and bank Payments; when added, recorded only by the Director after checking the statement.
- Secretary role (the Director enrols).
- Competency-grid Report cards (A / ECA / NA).
- Full school calendar (holidays, events) with an iCal feed for Google Calendar and Outlook (Toddle, Veracross pattern).
- Exam management: exam timetables, rooms and seating, invigilation, question papers drafted by teachers and approved (OpenEduCat, Academia ERP pattern).
- Teams and Google Classroom roster sync (Microsoft School Data Sync, OneRoster).
- Payroll, expenses beyond cash paid out in a session, attendance, timetable, transport, canteen, library, inventory.
- Nursery levels `[NOTE FOR PM: cheap to add as Levels; revisit after the pilot]`.
- Secondary schools, universities, training centres; school groups; LMS, AI features, native apps; reporting to ministries.

## 7. Monetization

- Price per Pupil per Term, payable by Mobile Money or transfer; target below local rivals (20,000–75,000 FCFA a month): about 300 FCFA per Pupil per Term `[ASSUMPTION]`. WhatsApp message costs (about $0.004 per utility message in Cameroon per third-party calculators, unconfirmed) are included.
- **"Pay when it works" offer:** the first Term is free; from the second Term, the School pays only if its Collection rate for the Term's Tranche at the Checkpoint beat its checked Baseline. The rate uses Charges before Discounts granted after the due date, Charges Under delay stay in the denominator, and only a checked Baseline counts (FR-37).
- No ads, no selling of data, no charge to parents.

## 8. Success Metrics

**Primary**
- **SM-1 Collection rate uplift:** Collection rate at the term-2 Tranche Checkpoint vs the Baseline; target +10 points at the pilot school `[ASSUMPTION]`.
- **SM-2 Paying schools:** Schools with an active paid Subscription after the July–August 2027 sales window; target 5 by October 2027.
- **SM-8 Leak detection:** receipts presented by parents that do not match a recorded Payment; every case found within one school day, and 0 cases after week 4.

**Secondary**
- **SM-3 Cash discipline:** share of school days with every Cash session closed; target ≥ 90% from week 3.
- **SM-4 Report card time:** working days from the end of the last Evaluation period of a Term to all Report cards printed; target ≤ 1.
- **SM-6 Renewal:** share of paying Schools that pay the next Term; target ≥ 80%.
- **SM-7 Adoption:** share of the pilot school's fee money recorded in E-skool rather than the paper receipt book; target 100% from week 4.

**Counter-metrics (do not optimize)**
- **SM-C1 Payment delays granted:** more delays make "Late" look smaller while money comes later. Watch Broken delays alongside SM-1.
- **SM-C2 WhatsApp reminders:** at most 3 per Pupil per Tranche; more messages with a flat Collection rate means harassment.
- **SM-C3 Pupils sent home and cards held:** pressure on parents harms trust; any sharp rise is a red flag.

## 9. Compliance and Regulatory

- **Personal data (Law 2024/017, reported in force 23 June 2026):** Pupils are minors. Each School is the data controller; E-skool is the processor. Guardians' phone numbers are shared with Meta only to deliver consented WhatsApp messages. `[NOTE FOR PM: get legal advice before the pilot on the authorisation filing and the processor contract]`
- **WhatsApp Business Platform:** the School (or E-skool on its behalf) needs a verified business, an approved display name and approved utility templates.
- **Ministry formats:** standard Report cards; E-skool claims no ministry endorsement.
- **Sending pupils home for fees:** a School practice; E-skool records the School's decision and does not take it.

## 10. Open Questions

1. Does the pilot school's report card match the standard template (periods per Term, ranks, coefficients)? Adjust after the first print.
2. What was the pilot school's Collection rate per Tranche last year?
3. Who files the data-protection authorisation, and whose WhatsApp Business account sends the messages (each School's number, or one E-skool number)?
4. Will the pilot school accept "first Term free, pay if it works"?
5. Which send-home rule does the pilot school apply today (days after the due date, minimum amount)?
6. Does the promoter also approve large delays, or only the director?
7. Does the pilot school run nursery classes that must be in the MVP?

## 11. Assumptions Index

- §2.3 Personas are illustrative.
- FR-6 Primary has 3 Evaluation periods per Term.
- FR-8 Default Subject lists.
- FR-11 Matching key for re-import: names + date of birth + Class.
- FR-13 Debt stays visible after a Pupil leaves.
- FR-27 Default Delay rules.
- FR-42 /10 Subjects scaled to /20.
- FR-46 Whole-School generation under 5 minutes.
- FR-59 Default send-home rule: due date + 7 days, any amount.
- FR-60 Teachers see the list without amounts.
- §3 Checkpoint = due date + 30 days.
- §5.1 Payment screen under 3 seconds on 3G.
- §5.4 Support by WhatsApp; §5.5 availability 99.5%.
- §6.2 Release dates R1–R4.
- §7 Price about 300 FCFA per Pupil per Term; WhatsApp price.
- §8 SM-1 +10 points.
