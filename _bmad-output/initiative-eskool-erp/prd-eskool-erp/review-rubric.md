# PRD Quality Review — E-skool (prd-eskool-erp)

## Overall verdict
A disciplined, unusually concrete draft. Glossary, FR/UJ/SM IDs, per-FR testable consequences, explicit counter-metrics and an indexed assumption list all hold up, and the thesis (collect more fees, see every franc) is real. The risk is that the headline promise and the revenue model both hang on a "Baseline" that is internally inconsistent and may not exist, and that the MVP (58 FRs, fees plus a second product, report cards, plus multi-tenancy, bilingual, parent portal) is sized with no cut line, order or date for a solo builder. A few money and privacy definitions also contradict each other and must be fixed before tickets are cut.

## Decision-readiness — adequate
Decisions are stated as decisions (one School = one site, WhatsApp links not API, void-only corrections, moratoire never changes the amount owed). Counter-metrics SM-C1 to SM-C3 name what was given up. Weak spots: the load-bearing unknowns are Open Questions without owner, date or "blocks which FR", and several are not really open (Q8 "Which Roles merge" and Q5 are already answered by FR-15 "option" settings and FR-29). The PRD also never says whether the pilot school has actually agreed (§0 "the pilot school's promoter and director" vs Q4 "Will the pilot school accept...").

### Findings
- **critical** Headline promise rests on a Baseline that is inconsistent and may not exist (§1 "a number, not a feature list"; FR-36; FR-37; §7; SM-1; Q2). FR-36 compares against "the Baseline for the same date last year" and UJ-7 shows "61% against 48% at the same date last year", but FR-37 stores only "last year's collected and expected amounts per Tranche", a single end-point figure, so a same-date comparison cannot be computed. Q2 asks whether it "can be rebuilt from its notebooks" at all; no behavior is defined for §7 billing or SM-1 when it cannot. The School that is billed on the result also enters the number. *Fix:* define Baseline as a checkpoint (e.g. cumulative collected at Tranche due date +30 days, matching SM-1) and make FR-36, UJ-7, SM-1 and §7 use that same checkpoint; state the fallback when no Baseline exists (e.g. compare to the School's own previous Term, or extend the free Term); make Q2 a dated blocker.
- **medium** Rebuild and reversal of earlier direction not recorded (§0 "replaces the 2026-10-20 PRD"; addendum B "Nothing from the previous code base is reused"). The repo already has fees, payroll, cash closing, and a stated policy "add no parent-facing features"; this PRD adds a Parent portal and drops payroll without saying what is given up. *Fix:* 3 lines in §0: what changed from the previous direction and why.
- **medium** Pilot school unconfirmed (§0, Q4, Q7). SM-1, FR-37 and FR-41 (real cards) all depend on it. *Fix:* state status (committed / verbal / none) and the plan if none.
- **medium** Open Questions lack owner, deadline and impact (§10 Q1-Q8). *Fix:* per question, "blocks FR-x, default if unanswered, by when"; drop Q5/Q8 or convert to assumptions.
- **medium** Unit economics unexamined (§7, SM-2). ~300 FCFA per Pupil per Term on a 350-pupil school is ~105,000 FCFA a Term, at risk under "pay only if it beat Baseline"; five schools is roughly 525,000 FCFA a Term (my arithmetic). No break-even or hosting-cost line. *Fix:* one line of break-even and what SM-2 revenue means.

## Substance over theater — strong
Six JTBD, seven named UJs, and every Role in the addendum matrix drives a real permission difference; the personas earn their place. Vision is specific to this product. NFRs carry numbers (§5.1, §5.4, FR-46) and are tagged as assumptions rather than posed as facts. Little furniture.

### Findings
- **low** Platform generality for one School type (Glossary "School type", "Module"; FR-3, FR-4). Module toggles and School type exist to serve later types; keep only if cheap, else defer the toggle UI.
- **low** Vision states "brings teachers and parents into the app every month" as fact, but monthly Evaluation periods come only from "a 2018 press account" (FR-6). *Fix:* soften Vision or tag it.

## Strategic coherence — adequate
The thesis is clear and the fee side follows from it (tranches, moratoires, reminders, cash closing, collection rate). SM-1 validates the thesis and the counter-metrics are good practice. But the report-card half (FR-41 to FR-48, FR-52) is a second product with no stated link to the collection thesis, and it is the part with the most unknowns.

### Findings
- **high** MVP scope has no priority order, cut line or timeline for a solo builder (§6.1; 58 FRs; SM-1 "term-2 Tranche"; SM-2 "July-August 2027"). Nothing says which FRs ship for the pilot's term-2 collection test versus later; nothing dates the pilot go-live. *Fix:* split §6.1 into "pilot-critical" (needed to test SM-1) and "before sale" (report cards, portal polish), with target dates.
- **high** Report-card half is specified on unverified inputs with no gate (FR-41, FR-42, FR-6, FR-8; Q1; §1 "official format for each subsystem"). FR-41 admits "official MINEDUB templates not found" and §9 claims no endorsement, yet Vision promises the official format; averages, ranks and Competency scales are assumptions. *Fix:* state why report cards are in the MVP (adoption lever?), a go/no-go gate ("if pilot cards need X, then..."), and an acceptance test for template fidelity (pilot director signs a printed sample).
- **high** "Pay when it works" trigger is gameable and under-defined (§7; FR-36; FR-37; SM-C1). Collection rate is Allocations ÷ Charges due, and a Charge is "after Discounts" (Glossary), so Discounts shrink the denominator without cash; only Moratoires get a counter-metric. The School enters its own Baseline. No rule for ties, partial uplift, pupil-mix change, or disputes. *Fix:* write the billing formula and dispute path; compute the rate on pre-Discount Charges or show both; add a Discounts counter-metric.
- **medium** SM-1 is n=1, uncontrolled and confounded with last year's cohort, calendar and reminder effort (SM-1 "+10 points at the pilot school"). Fine as a pilot signal; do not present it as proof for sales. *Fix:* label it a pilot signal and add what you will conclude from a miss.

## Done-ness clarity — strong
Every FR has a "Consequences (testable)" block, and many are crisp (FR-19 tranches sum to the fee, FR-24 gap-free numbering, FR-22 "3 steps ... under 60 seconds", FR-56 totals equal dashboard). Problems are mostly definitional contradictions in money and privacy, not vague adjectives.

### Findings
- **high** Balance formula contradicts the Charge definition (Glossary "Charge ... after Discounts" and "Balance — Charges due minus Allocations" vs FR-26 "Charges minus Allocations minus Discounts"). Subtracting Discounts twice is exactly the bug an automated test on "sample data" would encode. Related: FR-36's rate with carried credit (FR-23 "leaves a credit that the next Charges consume") is undefined for credit allocated to Charges not yet due. *Fix:* one formula in the Glossary; FR-26 and FR-36 cite it; say whether credit counts in the numerator.
- **high** Receipt shared as a WhatsApp link contradicts the security rule (FR-24 "shareable as a WhatsApp link" and shows "the Balance left after the Payment"; UJ-2 "sends it by WhatsApp"; §5.3 "WhatsApp links never expose Balances ... to someone who is not signed in"). The core counter flow breaks one or the other. *Fix:* send the Receipt as a PDF attachment or a signed-in link, or drop the Balance from the shared version.
- **medium** Verification pages undefined or enumerable (FR-47; FR-24 "Verification code ... QR code and short code"). The page shows Pupil name, Class and School to anyone with a code; a short code may be guessable, and FR-47 only describes Report cards, not the Receipt page. *Fix:* require unguessable codes and rate limiting, and specify the Receipt check page.
- **medium** Cash lock rule ambiguous (FR-35 "no Payment can be recorded with a date on or before the closing date in that session"). Unclear for two cashiers on the same day, and whether Mobile Money Payments are blocked too. *Fix:* state the lock scope (per cashier vs School) and the payment types it covers.
- **medium** Out-of-rules Moratoire contradicts itself (FR-28 "outside the Moratoire rules can still be sent"; FR-51 portal "only offers Instalment plans inside the rules"; UJ-3 mother asks the portal for 4 Instalments with a limit of 3). *Fix:* decide whether Guardians can go outside the rules; adjust UJ-3 or FR-51.
- **medium** "Late" is undefined for Moratoires (FR-30 lists status "Late"; Broken happens after N=7 days; Due status also has "Late"). *Fix:* define the Late window, rename one of the two.
- **medium** Offline behavior under-specified (FR-43 "loses nothing already saved"; UJ-5 "continues when it returns"; §5.1 "forms keep what was typed"). Unsaved marks after a reload are not covered. *Fix:* state whether unsaved entries persist locally.
- **medium** Cross-tenant identity undefined (FR-2 "the Schools they belong to"; FR-16, FR-17 sign-in by phone). A Guardian or teacher with two Schools has one login or two? *Fix:* state the identity model.
- **low** Thin consequences: FR-14 (only a link), FR-33, FR-45 "limited to what fits the template", FR-41 "reproduce real report cards" (no acceptance procedure).

## Scope honesty — adequate
Declared omissions are explicit and reasoned (§6.2 with revisit triggers, e.g. "volume ... passes about 30 a week"), and the 16-line Assumptions Index round-trips. For a launch-stakes doc the open-item load is heavy: 18 inline assumptions, 8 Open Questions, 2 PM notes, with several being facts about Cameroonian rules rather than tunable defaults.

### Findings
- **medium** Targets and thresholds are untagged yet are inferences (SM-2 "5 by October 2027", SM-3 "≥ 90%", SM-4 "≤ 1", SM-6 "≥ 80%", FR-16 "Five failed attempts ... 15 minutes", FR-30 "default 7"). *Fix:* tag them or mark them as set by the builder.
- **medium** Open items are not triaged (§10, §11). *Fix:* group into "blocks build / blocks pilot / tune later"; Q1, Q2, Q3 and the FR-6/FR-41/FR-42 assumptions are the build-blockers.
- **medium** Data lifecycle absent (FR-4 only "suspended"; §9). Nothing on trial expiry outcome, cancellation, retention or deletion of minors' data when a School leaves. *Fix:* requirement or explicit NON-GOAL.
- **low** Platform-admin tooling (school creation, support access, restore) is in scope via FR-1/2/4/58 but not named in §6.2 as "minimal, no UI".

## Downstream usability — strong
Standalone-extractable: a full Glossary, contiguous IDs (FR-1 to FR-58, UJ-1 to UJ-7, SM-1 to SM-6, SM-C1 to C3), "Realizes UJ-x" links, and SM-to-FR ranges. UJ protagonists are named with context.

### Findings
- **low** Addendum matrix drifts from FR text: dashboard and Audit log open to School admin (matrix) vs Promoter/Director (FR-36, FR-55); Director enters Evaluations (matrix) vs Teacher (FR-43); Parent codes (FR-17) and consent (FR-57) have no matrix row; "Promoter can read everything" vs matrix rows without it.
- **low** Term drift: Level "Class 1" vs entity Class; "Late" (Due status vs Moratoire status); "cashier" used but not a Role; "Platform admin" absent from Role/User.

## Shape fit — adequate
Multi-stakeholder B2B with a consumer-facing parent side, so UJs are load-bearing and the count (7) is right. Under-covered: money-correction and operator flows. Launch-stakes but no launch-readiness section.

### Findings
- **medium** No UJs for Void/correction, the Bursar's cash closing (UJ-7 is the Promoter's view only), or Platform admin operations (FR-1, FR-2, FR-4, FR-58). These are the audit-critical and operational paths. *Fix:* add one UJ for Void plus closing, one for school onboarding by the Platform admin.
- **medium** No rollout or go-live criteria (only FR-58 "restore ... tested before the pilot goes live"). *Fix:* a short section: go-live checklist, training, support channel, data migration from pilot spreadsheets, rollback.

## Mechanical notes
- IDs: FR-1 to FR-58, UJ-1 to UJ-7, SM-1 to SM-6, SM-C1 to SM-C3 contiguous, no duplicates; section and FR cross-refs resolve (FR-13 to FR-9, FR-52 to FR-44, FR-36/37 to §7). The brief path in §0 was not checked.
- Assumptions Index: every inline `[ASSUMPTION]` is indexed (FR-5, 6, 8, 11, 13, 27, 31, 41, 42, 46, 49, §5.1, §5.4, §7, SM-1, SM-5, §9, §2.3) and every index line appears inline. FR-27's tag is bare; the index carries the content.
- Not tagged: see Scope honesty finding.
- Counts: critical 1, high 5, medium 16, low 6.
