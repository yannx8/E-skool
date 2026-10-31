---
type: change-proposal
title: "Narrow the MVP to cash control and report cards"
initiative: initiative-eskool-erp
created: 2026-10-30
status: approved
mode: batch
scope: moderate
---

# Sprint Change Proposal: narrow the MVP to cash control and report cards

## 1. Issue summary

**Trigger:** strategy change (brainstorm of 2026-10-30, after reviewing clast.io). The user does not want a general school ERP. The MVP must solve the painful problems of one pilot private primary school in Douala, and grow vertically from there.

**What the user established:**
- The cash leak comes from the **cashier**, not the director.
- Parents pay **in cash** at the counter. A pupil who has not paid is **sent home** ("renvoi"); the parent comes back, pays, and the child returns to class.
- The parent already gets a **printed receipt with the school's stamp**. Keep that habit.
- Role separation must copy proven software, not be invented.
- Report cards: grades entered by teachers, averages computed, report cards printed. Use a **standard template**; no real pilot cards will be collected first.
- WhatsApp is welcome for **automatic, smart payment records and reminders** to parents. It must never be a condition for a payment to count.
- Parked ideas: full school calendar, exam management, Google Calendar / Teams links.
- Earlier the same day: "forget about families": the Pupil is the account; Guardians are linked contacts.

**Evidence from proven software** (searched 2026-10-30):
- Send-home list: software builds the list of pupils who owe fees from a rule and flags it to the principal; a person with permission acts on it (Schoolites, Entab, EdPrime "Due report → restrict", Vedmarg permissions). No product lets the cashier edit it.
- Separation of duties: cancel/revert is a separate privilege (Fedena "Revert Transaction", MyClassBoard setting); receipts carry the cashier's name (Fedena); restricted discounts need an access right (Loyverse); cash closing compares expected with counted, and a gap above a threshold needs a manager (Odoo POS closing control).
- WhatsApp: Edunext, OpenEduCat and WhatsApp providers send fee reminders 7/3/1 days before due dates and payment confirmations with the balance, through approved utility templates. Cameroon is in Meta's "Rest of Africa" bucket; third-party calculators list about $0.004 per utility message (unconfirmed on Meta's rate card).

## 2. Impact analysis

### 2.1 Epics

| Epic | Status | Impact |
|---|---|---|
| 1 Platform baseline | entry 1 done (scaffold, commit f2794c6); entries 2–10 not started | Remove entry 3 (parent-code sign-in spike). Keep tenancy (AD-2), defineCommand, audit, i18n, Platform admin. Modules on/off and Subscription states shrink to "Fees" and "Report cards". |
| 2 School setup | not started | Remove Families and Parent codes. Pupil = account; Guardians are contacts (phone, WhatsApp consent, Language). Remove Secretary; Director does enrolment. Add tranche due dates to the school-year screen. |
| 3 Fees and payments | not started | Cash only. Payments per Pupil; several Pupils of one Guardian on one Receipt. Discounts only by Director. Receipt printed and stamped. |
| 4 Collection control | not started | **Rescoped.** Remove parent Moratoire requests, WhatsApp link reminders and printed Notices. Add the daily **send-home list**. Payment delays granted by Director at the counter. Cash closing with blind count and Director approval above a threshold. Baseline and Collection rate stay. |
| 5 Report cards | not started | Replace the FR-41 gate (3 real cards) with **one standard template per Subsystem**, marks out of 10/20 with coefficients, averages and rank. Remove parent-portal display. Verification code kept. |
| 6 Parent portal | not started | **Removed** from the MVP; moved to deferred work. |
| new 7 WhatsApp records | — | **Added**, last in order: automatic payment confirmation and smart reminders by WhatsApp Business Platform utility templates. |

### 2.2 Artifacts

- **PRD:** vision, roles, journeys UJ-1 to UJ-6, glossary (Family, Moratoire request, Reminder, Notice, Parent portal, Payment method), §4.1, §4.3, §4.4, §4.5–4.12, §6, §8 and §10 change. Details in §4.
- **Architecture:** AD-13 (parent sign-in) removed; Family model replaced by Pupil account; one new integration (WhatsApp Business Platform) behind an outbox. Details in §4.
- **UX (DESIGN.md, EXPERIENCE.md, uncommitted in the main checkout):** parent screens removed; new screens: send-home list, counter receipt, cash closing (blind count), mark grid, report card print.
- **Other:** `initiative-eskool-erp.md` (covers, done-when, touch points), `tickets.toml` (epic list), `deferred-work.md` (parked ideas).

### 2.3 Technical impact

No built code to revert. One new external dependency (Meta WhatsApp Business Platform, through the Cloud API) and its business-verification lead time. Fewer auth paths (staff only), which lowers risk.

## 3. Recommended approach

**Hybrid: MVP review (option 3) + direct adjustment of the existing epics (option 1).** No rollback (option 2): only the scaffold exists and it stays valid.

- Effort: low for documents (one pass); build effort drops (one epic and one auth spike removed).
- Risk: lower than before (no parent auth, no Mobile Money). New risk: WhatsApp verification lead time, mitigated by putting that epic last with a `wa.me` link fallback.
- Timeline: R1 (pilot live, Jan 2027) unchanged; former R4 (portal) disappears; report cards no longer wait on real cards.

## 4. Detailed change proposals

### 4.1 Roles (PRD §2.1, §3 Role, FR-15)

OLD: Promoter, Director, Bursar, Secretary, Teacher, School administrator, Parent.

NEW:

| Role | Can | Cannot |
|---|---|---|
| Promoter | read everything | change anything |
| Director | set up the year, fees, subjects, coefficients, users; enrol pupils; grant Discounts and Payment delays; Void a Payment; confirm the send-home list; approve a Cash gap above the threshold; sign off a Term; print report cards | — |
| Cashier | record a cash Payment, print the Receipt, see the send-home list, close the Cash session with a blind count | Void, discount, grant delays, edit the send-home list, edit Guardian phone numbers |
| Teacher | enter marks and comments for own Classes and Subjects | see money |
| Platform admin | create a School and its first Director | read school data without support access |

Rationale: copies Fedena (revert privilege), Loyverse (restricted discounts), Odoo (closing approval). "Bursar" renamed "Cashier"; "School administrator" merged into Director; Secretary and Parent removed.

### 4.2 Pupil is the account (PRD §3, FR-9, FR-10, FR-20–26)

OLD: Family is the paying unit; Payments and Balances per Family.
NEW: the Pupil's Enrolment carries Charges, Payments and Balance. Guardians are contacts of a Pupil (name, relation, phone, WhatsApp consent, Language); siblings may share a Guardian. Remove FR-10 (Families) and the family-merge proposal from FR-11.
Rationale: user decision 2026-10-30 ("forget about families"), matches clast.io's student-centred model.

### 4.3 Fees and payments (PRD §4.5, §4.6)

- FR-19 unchanged (Fee plan per Level, Tranches with due dates, whole FCFA).
- FR-21 Discounts: Director only; remove "Secretary can propose"; keep the sibling rule.
- FR-22 Record a Payment: OLD "amount, Payment method, reference (mandatory for Mobile Money and bank)". NEW "Cashier records a cash Payment for a Pupil; several Pupils of the same Guardian can be paid in one visit and appear on one Receipt". Remove the Mobile Money duplicate-reference warning.
- FR-24 Receipt: numbered sequentially per School with no gaps; shows School, logo, stamp area, Pupil(s) and Class, Tranches paid, amount, cashier name, date and time, Balance left; printed A5/A4/80 mm; the stamp is applied by hand. WhatsApp share and portal link move to epic 7.
- FR-25 Void: Director only, reason required, stays visible as "Annulé / Void" with its number.
- Payment method: cash only in the MVP. Mobile Money and bank deferred; when added, recorded only by the Director after checking the statement (Odoo/bank pattern).

### 4.4 Collection control (PRD §4.7–4.10)

- **New FR "Send-home rule":** Director sets, per Tranche, how many days after its due date unpaid Pupils go on the list and the minimum amount owed (default: due date + 7 days, any amount > 0) `[ASSUMPTION]`.
- **New FR "Daily send-home list":** each school day the system lists, per Class, Pupils past the rule with a Balance, excluding Pupils under an active Payment delay. Director confirms or excludes Pupils with a reason; Cashier and Teachers see the confirmed list read-only; a Payment removes the Pupil from the next list automatically. Every exclusion is audited. Pattern: Schoolites/Entab/EdPrime defaulter list + restriction.
- FR-27 to FR-30 Moratoires → renamed **Payment delay**: Director grants it at the counter (new due dates, same amount); statuses Active, Honoured, Broken. Remove Guardian requests, counter-proposals and portal acceptance.
- FR-31 to FR-33 (WhatsApp link reminders, Notices): removed here; reminders move to epic 7.
- FR-34/35 Cash closing: add a **blind count** (the Cashier enters counted cash before seeing expected) and a **gap threshold** set by the Director (default 0 FCFA) above which the closing waits for Director approval. Pattern: Odoo POS "maximum difference".
- FR-36 to FR-39 dashboard and Baseline: unchanged. FR-40 Term report: kept (Promoter).

### 4.5 Report cards (PRD §4.11)

- FR-41: OLD gate "3 real report cards per Subsystem before any template". NEW: one standard template per Subsystem (francophone and anglophone primary): marks out of 10 or 20 per Subject, coefficients, Term average, rank, teacher comment, Director decision, signature and stamp areas. Presentation fields (header, logo) editable; rules not. Competency grid (A/ECA/NA) deferred until a school asks.
- FR-42 Grading: marks only; averages and ranks computed, never typed.
- FR-43 to FR-46 unchanged (teacher entry on phone, completeness, sign-off lock, batch PDF).
- FR-47 Public verification page: kept for report cards and receipts (cheap anti-forgery, no parent accounts needed).
- FR-48 Hold a report card: kept as a Director's manual decision; portal wording removed.
- FR-52 removed.

### 4.6 School year dates (PRD FR-5, FR-6)

The school-year screen shows Terms, Evaluation periods, Tranche due dates and send-home dates in one view. Full calendar (holidays, events, iCal feed) stays deferred.

### 4.7 New epic 7: WhatsApp payment records (new FRs)

- **Payment confirmation:** after each Payment, the Guardian(s) with WhatsApp consent receive an approved utility template: School, Pupil, amount, Receipt number, Balance left. Sent from the School's WhatsApp Business number through the Cloud API. A failed or missing message never blocks or cancels the Payment.
- **Smart reminders:** before and after each Tranche due date (default −3, +1, +7 days) and before each Payment-delay instalment, the system messages only Guardians whose Pupil still owes on that Tranche, with the exact amount and date; it stops as soon as the Tranche is paid; it never mentions a Pupil to a Guardian not linked to them.
- **Send-home notice:** when the Director confirms the send-home list, linked Guardians receive the amount to pay for the child to return to class.
- **Fallback:** while the WhatsApp Business account is not verified, each message is offered as a `wa.me` link the Director sends by hand.
- **Records:** every message is stored (template, recipient, status sent/delivered/failed, time) and shown on the Pupil's timeline.
- **Consent (part of FR-57):** Director records each Guardian's WhatsApp consent; no consent, no message.
- Pattern: Edunext/OpenEduCat WhatsApp fee reminders, D7 payment-confirmation templates.

### 4.8 Removed / deferred (PRD §6.3, deferred-work.md)

Out of scope: Parent portal (FR-49–52), Parent codes (FR-17), Families (FR-10), Mobile Money and bank Payments, Secretary role, competency report cards, full school calendar with iCal feed (Toddle/Veracross pattern), exam module with question papers, seating and invigilation (OpenEduCat/Academia ERP pattern), Teams/Google Classroom roster sync (Microsoft School Data Sync / OneRoster).

### 4.9 Journeys (PRD §2.3)

- UJ-1: remove families and parent codes; Director imports pupils and guardians.
- UJ-2: Brice the Cashier takes 60,000 FCFA cash for two pupils and prints one stamped receipt; the mother gets a WhatsApp confirmation.
- UJ-3: "Director grants a Payment delay at the counter".
- UJ-4: replaced by "Monday send-home list": Director confirms the list at 7:30, teachers see it, a parent pays at 10:00 and the child is off tomorrow's list.
- UJ-5: marks out of 20 instead of A/ECA/NA; QR kept, portal removed.
- UJ-6: removed.
- UJ-7: unchanged.

### 4.10 Metrics (PRD §8)

Remove SM-5 (parent reach). Add **SM-8 Leak detection:** receipts presented by parents that do not match the system; target 0 after week 4. Keep SM-C3. Replace SM-C2 with "WhatsApp reminders per Pupil per Tranche ≤ 3".

### 4.11 Architecture

- Remove AD-13 Guardian sign-in; staff password sign-in only.
- Replace the Family model with Pupil-owned Charges and Payments; a Guardian–Pupil link table.
- Keep AD-2 tenancy, defineCommand, audit, clock, i18n, verification registry (receipts and report cards).
- Add an integration rule: outbound WhatsApp goes through one `notifications` module with an outbox row written in the same transaction as the Payment, sent by a worker/cron with retries and a delivery-status webhook; never called inside a money transaction.
- Permission table updated to §4.1.

### 4.12 UX

Remove parent screens. Add or update: counter (find pupil → amount → confirm → print), send-home list (Director confirm, read-only view), cash closing with blind count, mark grid per class and subject on phone, report card batch print, Pupil timeline with WhatsApp records.

## 5. Implementation handoff

**Scope: moderate** (backlog reorganisation, no fundamental replan).

Epic changes to apply with `bmad-ticket`:
1. Epic 1: remove entry 3; keep the rest in order.
2. Epic 2: rescope (Pupil account, Guardians as contacts, no Families/Secretary/Parent codes, school-year dates).
3. Epic 3: rescope (cash only, multi-pupil receipt, Director-only discounts and voids).
4. Epic 4: rescope and rename "Send-home list, payment delays and cash closing".
5. Epic 5: rescope (standard template, gate removed).
6. Epic 6: remove (deferred).
7. Add epic 7 "Parents get WhatsApp payment records and reminders", after epics 3 and 4.

Build order: 1 → 2 → 3 → 4 → 5 → 7 (Meta business verification for epic 7 can start early).

**Handoff:** the builder (this session) updates the PRD, architecture, epics and initiative after approval, re-slices tickets with `bmad-ticket`, then builds with `bmad-build` + ECC TDD and reviewers.

**Success criteria:** PRD, architecture and epics agree with §4; every removed FR is deleted or listed as deferred; `tickets.toml` lists epics 1–5 and 7; epic 1 entry 2 (RLS spike) is the next build.

**Where this file lives:** written in session worktree `claude/school-app-features-9ee284` because the planning docs' branch `erp/platform-baseline` is checked out in the main working copy. Before applying the edits, this worktree's branch must move onto `erp/platform-baseline` (or the work moves to a session on that checkout).
