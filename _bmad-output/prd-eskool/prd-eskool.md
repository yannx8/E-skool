---
title: E-skool
status: final
created: 2026-10-20
updated: 2026-10-20
---

# PRD: E-skool
*Working title: confirm.*

## 0. Document Purpose

This PRD defines the next version of E-skool, a finance transparency and accountability system for private primary schools in Douala. It is for the builder (product owner), the pilot school's founder and director, and downstream workflows (UX, architecture, tickets). Vocabulary is anchored in the Glossary (section 3). Features are grouped with FRs nested and globally numbered. Inferences are tagged `[ASSUMPTION]` inline and indexed in section 9. Inputs: the brainstorm intent doc (`_bmad-output/brainstorm-eskool-next-and-adoption/brainstorm-eskool-next-and-adoption.md`) and an inventory of the built code (V1.0 to V2). Features marked **(built)** exist today and are specified here to fix their intended behavior; **(new)** features do not exist. Overflow detail (roles, market data) lives in `addendum.md`.

## 1. Vision

E-skool shows a private primary school's founder, in one read-only view, exactly where the school's money is, where it goes, and who owes it. It is not a school ERP and it does not replace the secretary's notebook or Excel sheet: it is a shadow ledger that gets fed by an Excel import and daily payment entry, and it sends WhatsApp messages out only.

Schools already lose money they can see but do not chase. Directors know about unpaid fees; nobody owns the follow-up, chasing parents face to face is awkward, and the data is scattered across notebooks so nobody can add it up. E-skool gives the follow-up an owner, a list, and a paper-and-WhatsApp trail that parents and schools already trust (stamped receipts, stamped avertissements).

The wedge competitors do not cover, as far as we can tell [ASSUMPTION: unverified, no user complaints found]: moratoires as tracked promises, a per-pupil in-kind supplies ledger, and founder-level transparency across fees, payroll and expenses. Grades and report cards are explicitly not the product.

## 2. Target User

### 2.1 Jobs To Be Done
- **Founder (buyer):** "See, without asking anyone, whether the school's money is healthy and where it went, so I trust the numbers my director gives me."
- **Director:** "Keep parents in order on fees, grant grace periods fairly, and have a record when a parent says 'I already paid' or 'you agreed to wait'."
- **Collections staff:** "Know exactly which pupils owe what, and who promised to pay when, without digging through notebooks."
- **Secretary:** "Record a payment and hand over a stamped receipt in under a minute, on the office computer."
- **HR/payroll officer:** "Know what each staff member is owed and has been paid."
- **Store keeper:** "Know which supplies parents brought and what is left on the shelf."
- **Administrator:** "Set up the school, users and fees, and trust that backups exist."

### 2.2 Non-Users (v1)
- Parents and pupils. Parents only receive WhatsApp reminders.
- Multi-school groups and their consolidated owners (single-school only).
- Teachers as teachers: no grades, attendance or timetable.

### 2.3 Key User Journeys

- **UJ-1. The secretary imports the school on her own.**
  - **Persona + context:** Mado, secretary, used to paper registers and a little Excel, not to new software; works alone on the office computer before the term `[ASSUMPTION: illustrative persona, not interview-based]`.
  - **Entry state:** account created by the administrator; she has her existing pupil-and-fees sheet.
  - **Path:** downloads the template and the filled sample; copies her columns in; uploads; sees a preview with row errors in plain French; fixes three rows in Excel; re-uploads.
  - **Climax:** the preview shows "212 élèves, 0 erreur"; she confirms and sees the owing list filled.
  - **Resolution:** she keeps her paper notebook for now; re-uploading the corrected sheet later does not duplicate anyone.
  - **Edge case:** a class name in her sheet does not exist; the preview says "Classe inconnue ligne 14: CM3 B" and offers the list of valid classes.

- **UJ-2. A parent pays and gets a stamped receipt.**
  - **Persona + context:** Mado at the counter; Mrs Nkeng pays a tranche in cash for two children.
  - **Entry state:** signed in on the office computer.
  - **Path:** searches the pupil, picks the tranche, enters the amount and method, confirms; prints the receipt.
  - **Climax:** the receipt prints with the school stamp area, and the balance shown is up to date.
  - **Resolution:** the owing list drops that pupil's balance immediately.
  - **Edge case:** Mado typed the wrong amount; only the Administrator can void it, which leaves a visible trace.

- **UJ-3. The director grants a moratoire, and it is tracked.**
  - **Persona + context:** Mr Essomba, director, meets a parent who cannot pay before the 15th.
  - **Entry state:** signed in as Director.
  - **Path:** opens the pupil, records a moratoire with the promised date and amount; the parent gets a WhatsApp confirmation.
  - **Climax:** on the promised date plus grace, if no payment arrived, the promise shows as broken on the director's list.
  - **Resolution:** he decides the next step himself (call, new moratoire, avertissement).
  - **Edge case:** the parent pays part of the amount; the promise shows "partially kept" with the remainder.

- **UJ-4. Collections staff works the owing list and sends avertissements.**
  - **Persona + context:** Mme Biya, collections officer, Monday morning.
  - **Entry state:** signed in; owing list open.
  - **Path:** filters by class and by "no active moratoire"; selects pupils; sends WhatsApp reminders in one action; prints avertissements for parents without WhatsApp.
  - **Climax:** each pupil row shows "reminded on {date}".
  - **Resolution:** printed avertissements are stamped and signed by hand and go home with the pupil.
  - **Edge case:** a parent's phone number is invalid; the row is flagged instead of silently skipped.

- **UJ-5. The founder checks the school's money.**
  - **Persona + context:** Mr Tchoumi, founder of one school, away from the office most days `[ASSUMPTION: illustrative]`.
  - **Entry state:** signed in as Founder, usually on a computer, sometimes on his phone; read-only.
  - **Path:** opens the overview; sees collected vs expected this term, total owed, cash on hand, expenses by category, payroll paid, and the latest voids and adjustments.
  - **Climax:** he sees that a large expense has no category [ASSUMPTION: the "first thing the founder checks" is open question Q1] and asks the director about it outside the app.
  - **Resolution:** he returns next week and compares; he never edits anything.
  - **Edge case:** the day's cash closing is missing; the view shows "clôture manquante" instead of a reassuring number.

- **UJ-6. Parents bring supplies and the store keeper tracks them.**
  - **Persona + context:** M. Fotso, store keeper, rentrée week.
  - **Entry state:** signed in; class supply lists are configured.
  - **Path:** records what a parent handed in for a pupil (e.g., 1 ream of A4, 2 chalk boxes); the ledger shows expected vs received.
  - **Climax:** the class view lists pupils with outstanding items.
  - **Resolution:** received items add to school stock; a shortfall stays open or converts to FCFA on the pupil's balance.
  - **Edge case:** a parent brings more than required; the surplus is recorded as stock, not as credit.

- **UJ-7. The Administrator closes the month.** Mme Ngo, Administrator, records the month's salaries and advances per staff member, categorizes the remaining expenses, closes the cash, and checks that the latest backup exists; the Founder sees the result the next time he opens the overview. **Edge case:** an expense has no category; it stays visible as uncategorized instead of being hidden. `[ASSUMPTION: illustrative; the HR-payroll officer may be the same person]`

## 3. Glossary

- **Pupil**: a child known to the school. Identity is separate from Enrollment.
- **Enrollment**: a Pupil in a Class for a school year. Promotions keep history.
- **Class**: a grade group (e.g., CM1 A) in a school year.
- **Fee**: an amount a Pupil owes (tuition, registration, uniform, books, exam, other), split into Tranches.
- **Tranche**: a configurable instalment of tuition (default three per year; label configurable).
- **Payment**: money received from a parent (or a paid-to-date total imported as an opening balance), immutable except Void.
- **Void**: Administrator-only cancellation of a Payment, always traceable.
- **Receipt**: the printable proof of a Payment, with school stamp and signature area.
- **Balance**: what a Pupil owes after Payments, Discounts and carried overpayment.
- **Owing list**: the list of Pupils with a positive Balance, per class and school-wide.
- **Moratoire**: a grace period the Director grants to a parent; it holds one or more Promises.
- **Promise**: a parent's committed payment date and amount inside a Moratoire. Status: open, kept, partially kept, broken.
- **Reminder**: a WhatsApp message to a parent about a Balance or Promise.
- **Avertissement**: the printable, stampable paper twin of a Reminder, handed to the Pupil to relay.
- **Supply list**: the in-kind items a Class requires per Pupil.
- **In-kind item**: a physical item (e.g., A4 ream, chalk box, toilet paper) parents bring instead of money.
- **Shortfall**: expected minus received for an In-kind item per Pupil.
- **Consumable**: a stocked item that gets used up (chalk, paper).
- **Asset**: a durable item the school bought (furniture, computers).
- **Founder / Director / Collections staff / Secretary / Store keeper / HR-payroll officer / Administrator**: user roles; roles are provisional (section 8, Q6) and may merge in a real school.
- **Pilot school**: the first real school using the product.

## 4. Features

### 4.1 Onboarding and Excel import (built, extend)
**Description:** The adoption gate. The Secretary imports the school's existing sheet alone from a template. Today pupil, class and parent columns import with French row errors; this feature extends the import to cover fees, balances and past payments and adds preview and safe re-import. Realizes UJ-1. `[ASSUMPTION: today's import does not cover fees or prior payments, does not preview, and is not duplicate-safe; the code inventory could not confirm any of these.]`

**Functional Requirements:**

#### FR-1: Template and sample file
Secretary can download an import template and a pre-filled sample in French. Realizes UJ-1.

**Consequences (testable):**
- The template columns match the importer's expected headers exactly.
- The sample imports with zero errors.

#### FR-2: Preview before commit
Secretary can see a preview of what the import will create or change before anything is saved. Realizes UJ-1.

**Consequences (testable):**
- Nothing is written to the database until the Secretary confirms.
- The preview shows counts (pupils, classes, fees, payments) and the first error rows.

#### FR-3: Row-level errors in plain French
Secretary sees every invalid row with its row number, the column and a plain-French reason. Realizes UJ-1.

**Consequences (testable):**
- Messages are of the form "Classe inconnue ligne 14: CM3 B", not codes.
- A file with errors can be fixed and re-uploaded without starting over.

#### FR-4: Safe re-import
Secretary can re-upload a corrected file without duplicating pupils, fees or payments. Realizes UJ-1.

**Consequences (testable):**
- Re-importing an unchanged file creates zero new records.
- Matching uses a documented key (e.g., pupil name + date of birth + class) `[ASSUMPTION: matching key to be confirmed with the pilot school's data]`.

#### FR-5: Fees and opening balances in the import
Secretary can import each Pupil's fees and the amounts already paid, so the Owing list is correct on day one. Realizes UJ-1. `[ASSUMPTION: opening balances come as paid-to-date totals, not itemized payments]`

**Consequences (testable):**
- After import, each Pupil's Balance equals fees minus the imported paid amount (Discounts apply as for any Balance).
- Imported opening payments are marked as such in the audit log.

**Feature-specific NFRs:**
- A 300-pupil file imports and previews in under 30 seconds on a typical office computer `[ASSUMPTION]`.

### 4.2 Payments and receipts (built, extend)
**Description:** Recording a Payment and giving the parent a stamped Receipt must be faster than the paper receipt book. Realizes UJ-2. Methods today: cash, Orange Money, MTN MoMo, bank. Payments are immutable except Void.

#### FR-6: Record a payment in three steps on a computer
Secretary can record a Payment for a Pupil (pupil, tranche or fee, amount, method) in three steps on the office computer: find the Pupil, enter the amount and method, confirm. Realizes UJ-2.

**Consequences (testable):**
- Payment plus Receipt in under 60 seconds in a timed run with an untrained Secretary `[ASSUMPTION: 60 s target carried from earlier project notes]`.
- Amounts are integer FCFA; no decimals accepted.

#### FR-7: Printable receipt with stamp and signature area
Secretary can print a Receipt with space for the school stamp and signature. Realizes UJ-2.

**Consequences (testable):**
- A5, A4 and 80 mm formats are supported (built).
- The Receipt layout has a clearly marked stamp area `[ASSUMPTION: confirm with a real stamped receipt from the pilot school]`.

#### FR-8: Void only by Administrator, always traceable
Administrator can void a Payment; nobody else can. Realizes UJ-2.

**Consequences (testable):**
- The voided Payment stays visible, showing who voided it, when and why.
- The Balance and the Founder view reflect the void.

### 4.3 Owing list (built, extend)
**Description:** The exact list of who owes what, usable without training. Realizes UJ-4.

#### FR-9: Owing list per class and school-wide
Collections staff can see every Pupil with a positive Balance, filter by class and by Moratoire status, and export it. Realizes UJ-4.

**Consequences (testable):**
- The list opens in under 10 seconds for a 500-pupil school `[ASSUMPTION: target carried from earlier project notes]`.
- Totals on the list equal the sum of Balance across rows.
- Siblings sharing a parent phone are grouped for contact (existing behavior: siblings share a phone).

### 4.4 Moratoires and promises (new)
**Description:** The Director records a grace period as one or more dated Promises. The system tracks whether each is kept and flags broken ones to the Director. It tracks and flags; it never blocks anything. Realizes UJ-3.

#### FR-10: Director records a Moratoire with Promises
Director can create a Moratoire for a Pupil with one or more Promises (date, amount). Realizes UJ-3.

**Consequences (testable):**
- The Moratoire is visible on the Pupil, the Owing list and the audit log.

#### FR-11: Promise status updates from payments
System marks a Promise kept, partially kept or broken based on Payments received by its date plus a configurable grace. Realizes UJ-3.

**Consequences (testable):**
- A Payment equal to or above the Promise amount on or before the date marks it kept.
- A Payment below the amount on or before the date marks it partially kept; it stays partially kept while the grace runs, and once the grace has passed the unpaid remainder shows broken.
- A Promise with no sufficient Payment after its date plus the grace (default 3 days, configurable `[ASSUMPTION]`) shows broken on the Director's list.

#### FR-12: Broken-promise list for the Director
Director can see all broken and soon-due Promises. Realizes UJ-3.

**Consequences (testable):**
- The list is sorted by amount or date and links to the Pupil; soon-due means due within 3 days (configurable `[ASSUMPTION]`).
- The system applies no block or penalty; the Director decides the next step. Automatic Reminders follow section 4.5 only `[NON-GOAL for MVP: no escalation actions]`.

### 4.5 Reminders and avertissements (built, extend)
**Description:** WhatsApp is outbound only. Automatic reminders already exist (off by default, cron on weekdays); manual sending exists. New: Reminders reference Promises, and a printable Avertissement replaces the paper that today travels in the pupil's bag. Realizes UJ-3, UJ-4.

#### FR-13: Send reminders in bulk from the Owing list
Collections staff can select Pupils and send WhatsApp Reminders in one action. Realizes UJ-4.

**Consequences (testable):**
- Each Pupil row shows "reminded on {date}".
- Invalid phone numbers are listed as failures, not skipped silently.

#### FR-14: Promise confirmation and due-date reminders
System can send a WhatsApp confirmation when a Promise is created and a Reminder when it is due. Realizes UJ-3. `[ASSUMPTION: needs approved WhatsApp Business templates; manual Relancer stays as fallback]`

**Consequences (testable):**
- Reminders use the editable template with parent, pupil and amount fields.
- Frequency is capped per parent (configurable interval) to avoid spam.

#### FR-15: Printable avertissement
Collections staff can print an Avertissement for a Pupil with school header, amount, date, and stamp and signature area. Realizes UJ-4.

**Consequences (testable):**
- It prints on A4 with the same wording as the WhatsApp Reminder.
- Printing logs a Reminder entry marked "paper".

### 4.6 In-kind supplies ledger (new)
**Description:** Per-class Supply lists; per-Pupil expected vs received; received items feed school stock; a Shortfall stays open or converts to FCFA. Realizes UJ-6. `[ASSUMPTION: conversion price per item set by the Director; no pilot data yet on how supplies are counted today]`

#### FR-16: Configure Supply lists
Administrator can define In-kind items and quantities per Class. Realizes UJ-6.

**Consequences (testable):**
- Items have name, unit and quantity required per Pupil.
- Changes apply to the current school year only.

#### FR-17: Record items received per pupil
Store keeper can record items received for a Pupil. Realizes UJ-6.

**Consequences (testable):**
- The class view lists each Pupil's expected, received and Shortfall.
- Received quantities add to Consumable stock.

#### FR-18: Convert a Shortfall to FCFA
Director can convert a Shortfall to an amount added to the Pupil's Balance, or leave it open. Realizes UJ-6.

**Consequences (testable):**
- A conversion creates a Fee line and an audit entry; it can be undone only by Administrator.
- Open Shortfalls appear on the class view but not in the Owing list totals unless converted.

### 4.7 Assets and consumables stock (new)
**Description:** A simple register of Assets bought and Consumables on hand with entries and exits. It records; it does not order or approve. `[ASSUMPTION: asset depreciation and budget vs actual are out of MVP]`

#### FR-19: Asset register
Administrator or Store keeper can record an Asset (name, date, cost, location, condition). Realizes UJ-5, UJ-6.

**Consequences (testable):**
- Total Asset value appears in the Founder view.
- Assets cannot be deleted, only marked disposed with a reason.

#### FR-20: Consumable stock movements
Store keeper can record Consumable entries (including In-kind receipts) and exits with a reason. Realizes UJ-6.

**Consequences (testable):**
- Stock on hand equals entries minus exits.
- Negative stock is refused.

### 4.8 Payroll tracking, expenses and cash book (built)
**Description:** HR-payroll officer tracks salaries and what was paid; expenses, other income, the cash book and daily closing exist. E-skool tracks money; it never pays wages or moves money. Realizes UJ-5. Modules are off by default and enabled per school.

#### FR-21: Track salaries and wages paid
HR-payroll officer can record salaries, advances and payments per staff member. Realizes UJ-7.

**Consequences (testable):**
- Each payroll entry shows who recorded it.
- No integration with bank or mobile-money payouts exists `[NON-GOAL]`.

#### FR-22: Record expenses and close the cash daily
Administrator can record expenses by category and close the cash daily; closing locks every entry dated on or before the closing. Realizes UJ-7. `[ASSUMPTION: only the admin role manages finance today; a separate accounts role waits for Q6]`

**Consequences (testable):**
- An uncategorized expense is visible in the Founder view.
- A missing closing is visible as "clôture manquante".

### 4.9 Founder transparency view (new view over built data)
**Description:** One read-only view showing the school's money across fees, payroll, expenses, cash, assets and stock. It answers: is there a monetary problem, where does money go, and how do staff handle it. It does not edit, approve or message. Realizes UJ-5. `[ASSUMPTION: today the owner role has read-only access to finance and HR screens but no single overview; Q1 asks what the founder checks first.]`

#### FR-23: Founder overview
Founder can see, for the current term and year: collected vs expected, total owed, cash on hand, expenses by category, payroll paid, Asset value and stock summary. Realizes UJ-5.

**Consequences (testable):**
- Every figure drills down to the underlying list.
- Figures reconcile with the Owing list, cash book and payroll screens to the franc.

#### FR-24: Founder sees money events and gaps
Founder can see recent Voids, adjustments, uncategorized expenses and missing closings. Realizes UJ-5.

**Consequences (testable):**
- Each event shows who and when from the audit log.
- Founder has no write action anywhere in the app.

#### FR-25: Founder view also works on a phone
Founder can read the overview on a phone as a secondary surface; the computer is the primary one. Realizes UJ-5.

**Consequences (testable):**
- All overview figures are readable at 16 px without horizontal scrolling at 360 px width.

### 4.10 Roles, audit and backup (built)
**Description:** Today roles are admin, owner (read-only finance and HR) and secretary. The PRD roles are provisional and mapped onto these until the pilot shows how people really split work.

#### FR-26: Role-based access matches the role mapping
Administrator can assign each user a role whose permissions (provisional mapping in `addendum.md`) are enforced both in the UI and by row-level security. Realizes UJ-1 to UJ-6.

**Consequences (testable):**
- A role cannot perform an action outside its permissions even by calling the API directly.
- Money and person records cannot be deleted by any role.

#### FR-27: Audit log and weekly backup
System records every money or person change in an append-only audit log and takes a weekly backup. Realizes UJ-5, UJ-7.

**Consequences (testable):**
- The audit log cannot be edited or deleted from the app.
- Administrator can download the latest backup.

## 5. Non-Goals (Explicit)

- Not a school ERP: no grades, report cards, attendance, timetable or teacher tooling.
- No parent app, parent login or parent page. Parents only receive WhatsApp messages; the existing token parent page is removed.
- No multi-school or multi-tenant features in v1.
- No founder approvals, payment blocking or in-app messaging between staff. The Founder view is read-only.
- No wage payment, payouts or any movement of money by E-skool. It tracks, it does not pay.
- No replacement of the secretary's notebook or Excel: coexistence is a design goal.
- No SMS channel and no online payment collection (mobile-money collection is a possible later integration).

## 6. MVP Scope

### 6.1 In Scope
Every feature must map to a pain a founder would pay for; order below is the build priority `[ASSUMPTION: tiering proposed by the PRD author]`.

- **Tier 1, pilot gate (the day-one trio):** import with fees and opening balances, template, preview, plain-French errors and safe re-import (FR-1 to FR-5); payment entry and stamped Receipt, Void (FR-6 to FR-8); Owing list (FR-9). Without these the pilot school cannot start.
- **Tier 2, founder pitch:** founder read-only overview (FR-23 to FR-25); Reminders and printable Avertissement (FR-13 to FR-15); Moratoires with Promises, gated by Q4 (FR-10 to FR-12).
- **Tier 3, after the pilot confirms the pain:** in-kind supplies ledger, gated by Q5 (FR-16 to FR-18); Asset register and Consumable stock (FR-19, FR-20).
- **Already built, kept as is:** payroll tracking, expenses, cash book and closing, roles, audit and backup (FR-21, FR-22, FR-26, FR-27).
- Remove the existing token-based parent page (decided 2026-10-20).

### 6.2 Out of Scope for MVP
- Budget vs actual and asset depreciation (deferred; revisit after the pilot) `[NOTE FOR PRODUCT OWNER: not discussed in the brainstorm; decide if the founder pitch needs it]`.
- Mobile-money collection and payment links (competitors already offer it; decide after the pilot).
- Multi-school consolidation (the brainstorm idea "financial transparency across your schools" is parked: out of scope for now, not rejected).
- Offline mode `[ASSUMPTION: connectivity at the office is acceptable; no offline requirement]`.
- Register-photo intake (feeding the ledger from a photo of the paper register): an idea from the brainstorm, deferred until the Excel import is proven.
- Any new parent-facing feature.

### 6.3 Cross-Cutting NFRs
- Integer FCFA only; Douala time for all dates.
- French UI first (existing bilingual UI stays), 16 px text, 44 px click targets, computer first (office desktop or laptop) for daily-entry screens; phone is a secondary, read-mostly surface.
- Daily-entry screens (payment, receipt, import) designed for users not used to computers; Director and Founder views may be denser.
- Every table has row-level security and explicit grants; every money or person table has an audit trigger.
- Money changes only through role-checked database functions.
- Pages usable on a slow mobile connection `[ASSUMPTION: no formal budget until pilot measurement]`.
- Weekly backup; the Supabase 1000-row limit handled for exports and totals.

### 6.4 Constraints and Rollout
- The application has never run end to end against a live Supabase. The first real login is the first E2E test and gates everything else.
- Rollout: one pilot school, reached through family; the paper notebook stays in use during a shadow period `[ASSUMPTION: about one week]`; the founder pitch happens in the next school holidays (about July-August 2027) unless a school accepts a mid-year pilot.
- Adoption kit (not software): a one-page printed cheat sheet, a 15-minute training script for the Secretary, and the paper receipt book kept as fallback during the shadow period `[ASSUMPTION: from brainstorm coach ideas]`.
- Monetization is undecided (per term, per year or per pupil). Observed competitor prices are in the addendum; E-skool will not win on price.

### 6.5 Risks and Mitigations

- **Digital literacy of frontline staff (main risk):** the Secretary and other intake staff are not used to computers. If they do not use the daily-entry screens, the Founder view stays empty. Mitigations: a three-step payment, plain French, adoption kit (6.4), and daily-entry screens kept deliberately simple.
- **Switching cost:** re-keying pupils and fees. Mitigation: forgiving import (FR-1 to FR-5) and coexistence with paper.
- **Unproven E2E:** the app has never run against a live Supabase (6.4). Mitigation: first real login is the first test, before any other work.
- **Willingness to pay unvalidated:** mitigation is the pilot and Q3, Q8.
- **Reminder fatigue and WhatsApp template rejection:** mitigation is the per-parent frequency cap (FR-14) and SM-C1.

## 7. Success Metrics

**Primary**
- **SM-1**: Pupil fees are managed entirely in E-skool at the pilot school: after the shadow period, every Payment, Moratoire and Balance exists in the app, and the Director works from the app's Owing list, not from the paper book. Measured by a spot check where zero paper-book payments are missing from the app `[ASSUMPTION: measurement method and the shadow-period length to confirm with the pilot school]`. Validates FR-1 to FR-12.
- **SM-2**: The Secretary completes the first import alone, without help, in one session. Validates FR-1 to FR-5.
- **SM-3**: The Owing list opens in under 10 seconds, and its total reconciles to the franc with the cash book and payments. Validates FR-9, FR-23.
- **SM-4**: The Founder opens the overview at least weekly during the pilot `[ASSUMPTION]`. Validates FR-23, FR-24.

**Secondary**
- **SM-5**: Share of broken Promises followed by a Reminder, Avertissement or new Moratoire within 7 days `[ASSUMPTION: target to be set from pilot baseline]`. Validates FR-12 to FR-15.
- **SM-6**: Pilot Founder states a loss in FCFA that E-skool made visible (answer to "what did you lose last term that you could not see?"). Validates the value claim.

- **SM-7**: A Store keeper spot count of three Consumables matches the ledger at the pilot school `[ASSUMPTION: target to confirm]`. Validates FR-17, FR-20.

**Counter-metrics (do not optimize)**
- **SM-C1**: Number of Reminders sent. Do not maximize it: more messages risk parent irritation and WhatsApp template rejection. Counterbalances SM-5.
- **SM-C2**: Number of records in the app. Do not maximize it; duplicate or ghost records hide real balances. Counterbalances SM-1.

## 8. Open Questions

1. **Q1.** What does the Founder check first when opening the app? (Drives FR-23 layout.)
2. **Q2.** Where does the pilot school keep fee records today (one Excel, many, notebook)? (Drives FR-4, FR-5.)
3. **Q3.** Why would a founder pay for transparency instead of trusting the Director? (Drives pricing and pitch.)
4. **Q4.** How are moratoires handled today (verbal, written, nothing)? Who grants them?
5. **Q5.** Who counts In-kind items, and how does a shortfall get handled today?
6. **Q6.** Which roles are separate people in a real school? Until answered, keep admin/owner/secretary and map new roles as permissions.
7. **Q7.** Does anything else (receipts, reminders) link to the existing parent page, which is being removed?
8. **Q8.** Pricing model: per term, per year or per pupil, and what a founder would pay.
9. **Q9.** Does the existing printed receipt have a stamp and signature area, and what does the pilot school's real stamped receipt look like?
10. **Q10.** What does the importer cover today beyond pupil, class and parent columns? (Verify in code before building FR-5.)
11. **Q11.** How much does the pilot school lose per term to unpaid fees? (Baseline for SM-6.)
12. **Q12.** Who chases parents today and how often? (Drives FR-13 and who the Collections staff are.)
## 9. Assumptions Index

- Section 1: the wedge (moratoires, in-kind ledger, founder transparency) is unoccupied; unverified.
- FR-5 and 4.1: today's import lacks fees, preview and duplicate safety; unconfirmed in code.
- FR-4: matching key for safe re-import.
- FR-5: opening balances arrive as paid-to-date totals.
- 4.1 NFR: 300-pupil import under 30 seconds.
- FR-6: 60-second payment-plus-receipt target carried from earlier notes.
- FR-7: receipt layout needs a stamp area; confirm with a real receipt.
- FR-9: 10-second Owing list target.
- FR-14: WhatsApp templates approved; manual fallback.
- 4.6: conversion price of In-kind items is set by the Director.
- 4.7: depreciation and budget vs actual out of MVP.
- UJ-5: the first Founder check is open (Q1).
- 4.9: the owner role has no overview today.
- 6.2: offline mode not required.
- 6.3: no formal page-weight budget.
- 6.4: shadow period about one week; pitch in July-August 2027.
- SM-1: the spot-check measurement and the shadow-period length. SM-4, SM-5, SM-7: targets set after pilot baseline.
- FR-11 grace of 3 days and FR-12 soon-due window of 3 days.
- Section 6.1 tiering is the PRD author's proposal.
- UJ personas (Mado, Mr Tchoumi, Mme Ngo) are illustrative, not interview-based.
- FR-22: the Administrator performs finance work until Q6 is answered.
- Section 6.4: the adoption kit comes from brainstorm coach ideas.
