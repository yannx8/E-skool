# PRD Quality Review — E-skool

## Overall verdict
The PRD is well bounded: Non-Goals are explicit, assumptions are tagged and indexed, FR numbering is contiguous (FR-1 to FR-27), and every FR carries a "Realizes UJ-n" line. Two things are at risk. First, FR-12 states a non-goal ("no automatic message without a person acting") that FR-14 and the built weekday cron directly contradict. Second, several FRs in the new promise and money areas (FR-11, FR-12, FR-14) have consequences an engineer cannot test, and the success metrics leave the primary metric open and the wedge features unmeasured. Grade: Fair (multiple thin dimensions, high-severity findings present).

## Decision-readiness — adequate
Decisions and trade-offs are stated (Vision, Glossary on Enrollment split, §5 Non-Goals, §6.4 rollout). Open Questions are real (Q1 to Q10). The weakness is that §6.1 commits to scope whose basis is still open: moratoires (FR-10 to FR-12) depend on Q4 ("how are moratoires handled today?"), the in-kind ledger (FR-16 to FR-18) depends on Q5, and FR-5 depends on Q10 (flagged "verify in code before building"). §6.1 presents these as in scope with no decision or gate recorded.

### Findings
- **[high]** Scope committed on unanswered questions (§6.1 vs §8 Q4, Q5, Q10) — FR-5, FR-10 to FR-12 and FR-16 to FR-18 are "In Scope" while their inputs are open. *Fix:* mark these as conditional on Q4/Q5/Q10 or record a decision with a date.

## Substance over theater — adequate
Non-Goals (§5) and the Vision's wedge are specific. Persona count is high: seven personas in §3 and §2.1 (Founder, Director, Collections, Secretary, HR-payroll, Store keeper, Administrator) against a single pilot school. HR-payroll officer and Administrator drive no journey (see Downstream usability), so their JTBD lines are close to furniture. The Vision's wedge is flagged as unverified (§1 [ASSUMPTION]), which is honest.

### Findings
- **[medium]** HR-payroll officer and Administrator are personas with no UJ (§2.1, §2.3) — their JTBD lines do no work in the PRD beyond traceability tags. *Fix:* add one UJ for each, or drop the persona and fold the JTBD into Founder/Director.

## Strategic coherence — thin
The thesis is clear (shadow ledger, founder transparency, follow-up ownership). But the primary metric is undefined: SM-1 is "[OPEN]" (§7). MVP scope kind (problem-solving, experience, platform, revenue) is not named, and monetization is undecided (§6.4). SM-C2 counter-metric is written against SM-1, which does not yet exist.

### Findings
- **[high]** SM-1 is open, so the primary success metric is undefined (§7 SM-1; §7 SM-C2 counterbalances it). *Fix:* pick one adoption metric with a target before the PRD is used for story creation.

## Done-ness clarity — thin
Most FRs have testable consequences: FR-2 (nothing written before confirm), FR-4 (zero new records on unchanged re-import), FR-20 (negative stock refused), FR-25 (16 px, 360 px width), FR-26 (role cannot act via API). The gaps are concentrated in the promise and reminder features.

### Findings
- **[high]** FR-11 grace is undefined and incomplete (§4.4). Description says "by its date plus a configurable grace" but the consequences test only "on or before the date" and "past its date". No value or bound for grace. "partially kept" (Glossary Promise status; UJ-3 edge case) has no consequence in FR-11. *Fix:* state the grace value (or its default and range) and add a consequence for partial payment.
- **[medium]** FR-12 "soon-due Promises" has no window (§4.4). Sort is "by amount or date" (either/or, not a decision). *Fix:* define the soon-due window in days and pick one sort key.
- **[medium]** FR-14 frequency cap "configurable interval" has no default or bound (§4.5). *Fix:* state a default and a test (e.g., at most one reminder per parent per N days).
- **[medium]** FR-6 "about three taps" is not counted in any consequence; the testable line is the 60 s timed run, which is tagged as carried from notes. FR-7 "clearly marked stamp area" is an adjective. *Fix:* replace "clearly marked" with a measurable element (e.g., a bordered box of stated mm size), and drop "about three taps" or state the tap count.
- **[low]** FR-22 "close the cash daily" has no consequence for the closing itself (only the missing-closing flag). FR-27 "weekly backup" has no restore test. *Fix:* add one consequence each.

## Downstream usability — thin
Glossary exists and most terms are used consistently. The main problems are traceability and undefined vocabulary.

### Findings
- **[high]** FR-21, FR-22, FR-27 realize UJ-5 (Founder journey), but UJ-5 does not cover payroll entry, expense recording, or backup. FR-19 (Asset register) also realizes UJ-5, yet UJ-5's path lists no assets or stock. The HR-payroll officer and Administrator have no UJ, so FR-21 and FR-27 trace to no actor's journey. *Fix:* add UJ-7 (HR-payroll) and UJ-8 (Administrator: backup, roles), and re-point FR-19 and FR-21 to them.
- **[medium]** FR-26 says permissions are "in section 6". §6 is MVP Scope and contains no permission table; the mapping is in `addendum.md`. Broken cross-reference. *Fix:* "in `addendum.md`, Role mapping".
- **[medium]** "Bursar-level staff" (FR-22) is not a Glossary role; the Glossary roles are Founder, Director, Collections staff, Secretary, Store keeper, HR-payroll officer, Administrator. *Fix:* name the role from the Glossary.
- **[medium]** Success metrics do not cover the wedge: SM list validates FR-1 to FR-15 and FR-23 to FR-24 only. In-kind ledger (FR-16 to FR-18), Asset/stock (FR-19, FR-20), and FR-26/FR-27 have no SM. SM-6 "validates the value claim" with no FR. *Fix:* add one SM for in-kind conversion/shortfall and tie SM-6 to FR-23 or drop the FR tag.

## Shape fit — adequate
Multi-stakeholder school with a daily-entry phone flow and a read-only founder view: UJs with named protagonists fit. Brownfield tagging (built vs new) is explicit and useful. The PRD is somewhat heavy for one pilot school (27 FRs, 6 UJs, 10 Open Questions), but this is a judgment call, not a defect.

## Scope honesty — strong with one contradiction
§5 Non-Goals and §6.2 Out of Scope are explicit. Assumptions are tagged and the index (§9) round-trips with the inline tags (checked: all inline [ASSUMPTION] tags have index entries and vice versa). The problem is that a Non-Goal is contradicted by an FR (see next section).

### Findings
- **[high]** FR-12 non-goal line says "No automatic penalty, block or message is triggered without a person acting" (§4.4). FR-14 says the system sends a WhatsApp confirmation on Promise creation and a Reminder when due, and §4.5 says automatic weekday reminders already exist (cron). The non-goal is false as written. *Fix:* rewrite the FR-12 line to "no automatic penalty or block; automatic WhatsApp reminders are allowed only per FR-14 and are off by default" and add the default-off state to FR-14.
- **[medium]** Non-Goal "No founder approvals, payment blocking" vs FR-22 "closing locks earlier entries" and §4.4 "never blocks anything" vs UJ-4 "filters by no active moratoire" (FR-9 "filter by Moratoire status"). Unclear whether an active Moratoire suppresses a pupil from reminders or the owing total. *Fix:* state that cash-closing locks are not payment blocking, and state whether an active Moratoire changes Reminder eligibility or the owing total.

## Mechanical notes
- **Glossary drift / synonyms:**
  - "Relancer" (FR-14, French for Reminder) and "reminder" are used for the same thing; FR-14 says "manual Relancer".
  - "grace": Moratoire (grace period granted by the Director) and Promise grace (FR-11) are two different things under one word.
  - "owing list" lowercase (UJ-4) vs "Owing list" (Glossary, FR-9); "balance" lowercase (UJ-2) vs "Balance".
  - "Founder view" / "Founder overview" / "Founder transparency view" (§4.9 title, FR-25, FR-23) are not in the Glossary.
  - Undefined terms used as if defined: "expected" (FR-23), "cash on hand", "term" (FR-23, §4.8), "opening balances" (FR-5, §6.1), "closing"/"clôture" (FR-22), "adjustments" (FR-24, UJ-5), "Discount" (Glossary Balance definition, no Discount term), "soon-due".
  - "children" (UJ-2) vs "Pupil".
  - Role name "owner" (addendum) vs "Founder" (Glossary); acceptable only if the mapping stays in the addendum.
- **ID continuity:** FR-1 to FR-27 contiguous, no duplicates. UJ-1 to UJ-6, SM-1 to SM-6, SM-C1/SM-C2, Q1 to Q10 contiguous. Cross-ref breaks: FR-26 "section 6" (see Downstream usability).
- **Assumptions Index:** round-trips with inline tags (§9 vs inline). Two inline items with no assumption tag: "about three taps" (FR-6) and "about July-August 2027" (§6.4); persona details in UJ-1, UJ-5 are invented examples with no tag (acceptable if illustrative, state that).
- **Implementation in FRs** (should be in architecture, not FRs): FR-26 "enforced both in the UI and by row-level security" and "calling the API directly"; FR-14 "approved WhatsApp Business templates" (vendor constraint, acceptable as a noted dependency); FR-4 matching key "pupil name + date of birth + class" (tagged as assumption, acceptable).
- **UJ protagonists:** all six UJs have a named protagonist. UJ-2 has two named people (Mado as secretary, Mrs Nkeng as payer); the protagonist is Mado, which is correct, but say so.
- **Required sections:** Vision, Target User, Glossary, Features, Non-Goals, MVP Scope, Success Metrics, Open Questions, Assumptions Index all present. MVP scope kind not named (see Strategic coherence).
