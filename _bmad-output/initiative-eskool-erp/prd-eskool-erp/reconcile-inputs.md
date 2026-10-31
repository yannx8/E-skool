# Reconcile: PRD vs its inputs

PRD = `prd-eskool-erp.md` + `addendum.md`. Gaps only: what an input decided or recommended and the PRD drops, contradicts or weakens. Items the PRD puts out of scope with a reason are skipped. Severity: H (change the PRD), M (decide and note), L (nit).

Note: the brief's memlog is at `brief-eskool-erp/.memlog.md` (dot-prefixed), not `brief-eskool-erp.memlog.md`.

## 1. Approved brief + memlog

| # | Sev | Gap | PRD location | Suggested fix |
|---|---|---|---|---|
| B1 | H | Brief promise: "you see every franc your staff took in". Dashboard shows collected today/week, closings and gaps, but no collected-by-cashier and by-method breakdown. Mobile Money and bank are excluded from the cash expected (FR-34), so only cash is controlled. | FR-38, FR-39, UJ-7 | Add "collected by cashier and by method" and a Mobile Money references list to FR-38. |
| B2 | H | The Collection rate definition is ambiguous when a Moratoire moves due dates. FR-30 says the Moratoire "replaces the due dates", and the rate is Allocations / Charges due. If moratoire amounts leave the denominator the rate rises with no money in. That rate sets whether the school pays under "pay when it works". SM-C1 only says "watch" it. | Glossary "Collection rate", "Moratoire"; FR-30, FR-36, §7, SM-C1 | State that Charges under Moratoire stay in the denominator, or that the Term report shows the rate with and without them. |
| B3 | M | Brief per-tranche view: "expected vs collected vs late vs under moratoire, per class and per tranche". FR-38 gives per Fund and per Class only. The per-tranche split exists only in the headline. | FR-36, FR-38 | Add "per Tranche". |
| B4 | M | Brief problem: parents find the A / ECA / NA competency grids confusing. No requirement for a plain-language legend or explanation on the report card or in the portal. | FR-41, FR-42, FR-52 | Add a legend line to the template and portal. |
| B5 | L | Brief timeline: pilot live Jan 2027 (term 2). The PRD has no pilot date or milestone. | §8, §6 | Optional one line. |
| B6 | L | Memlog: parent portal "overrides old AGENTS.md ban". The repo `AGENTS.md` and `CLAUDE.md` still ban parent features. The PRD does not say those files must be rewritten. | §0, addendum B | Note in the addendum or a handoff item. |
| B7 | L | Memlog: stack "unconfirmed". The addendum says Next.js + Prisma while repo policy says Supabase. It is marked "to confirm", so this is fine. | addendum B | None. |

Kept and consistent: collection-rate headline, baseline and pay-when-it-works, moratoire as object, cash closing, hold-card as a human decision (FR-48), QR verification, bilingual, audit, 1-minute receipt.

## 2. Research analysis (`erp-cameroon-analysis.md`)

| # | Sev | Gap | PRD location | Note |
|---|---|---|---|---|
| R1 | M | §2 Inference: "matricule unique belongs on the pupil identity from day one". PRD §6.2 parks the matricule with secondary, but FR-9 has no national or school ID field. Adding it later means a migration, and it also blocks the UX §4.3 "search by name or matricule". | FR-9, §6.2 | Add an optional pupil ID field (school matricule, national ID later). |
| R2 | H | Conditions and Rec: collect 3-5 real report cards before building grades; the ICE ordering is core, then fees and dashboard, then grades. The PRD ships all in one MVP with no release order or gate. It only has assumptions on FR-41 and OQ1. Report cards were scored C=3 (low confidence). | §6.1, FR-41, §10 OQ1 | Add a build order and a gate: "report-card templates are not built before real cards from the pilot and two other schools are in hand". |
| R3 | M | Risk "distribution over features": the solo dev has no field team, and the Rec says onboarding and trust decide. The PRD has no onboarding, training, migration-help or support requirement. | §6, §7, §8 | See the old-PRD adoption kit (section 4, O1). |
| R4 | M | Parent portal ICE 3.0 ("links first, portal later"). The PRD builds a full portal in the MVP. This follows the user decision in the memlog, so it is intentional. | §4.12 | The scope risk is not recorded. Add a "descope first" order, e.g. FR-52 before FR-50/51. |
| R5 | L | Naming: the research says APEE (circular 005/26/C/MINESEC/SG/CELSUI, older cap 25,000 F). The PRD says "APE contribution" and cites the circular without a reference. The cap is dropped. | FR-18, §9 | Use "APEE" or confirm the primary naming. |
| R6 | L | Data-protection Inference: "access logs". FR-55 logs changes and sign-in failures, not reads of pupil data. | FR-55 | Optional. |
| R7 | L | "Re-check cartescolaire.cm and the decree every rentrée" (yearly monitor). Not in the PRD. | §9 | One line. |
| R8 | L | Grading engine "per subsystem, level and year". Templates are per Subsystem and Level only. | FR-41 | Add year versioning. |
| R9 | L | Conditional go: price at or under 20-50k FCFA/month, payable by term in MoMo. The PRD gives about 300 FCFA per pupil per term (about 35k/month at 350 pupils). Consistent. | §7 | None. |

## 3. UX report (`rapport-erp-education-ux.md`)

### §3 screen references

| # | Sev | Gap | PRD location |
|---|---|---|---|
| U1 | H | Screen 1 (Mercury, PayPal, Teachable) and §4.4 item 4 call for a pupil/family list with balance and status, KPI above a table, status tabs with counters (all / late / under moratoire / paid), a "Filtered by" chip, saved filters, multi-select with grouped actions (remind, print receipts, export) and export. The PRD has no such list. It has the Family account (FR-26), the reminder list (FR-32, filter by class, status, amount) and drill-downs from dashboard figures (FR-38). The old PRD had an Owing list (FR-9). There is no explicit export of the filtered list: FR-56 exports raw tables. | FR-26, FR-32, FR-38, FR-56 |
| U2 | H | Screen 2 (Square "Payment recorded"): one confirmation screen with the next likely action as primary (record next payment) and send / print receipt as secondary. Only UJ-2 mentions it. FR-22 and FR-24 do not require it. The counter speed feel is lost. The GoFundMe phrase "receipt sent to +237..." (confirming the channel) is also missing. | FR-22, FR-24, UJ-2 |
| U3 | H | Screen 4 (Square request page) and Screen 8 (Dribbble payment portal): the link from a WhatsApp reminder should land on a light page, no login, "X asks for a payment of ... due ...", ending at the receipt. The PRD forces phone + printed code sign-in (FR-17, UJ-6), and §5.3 says links never expose balances. This is a security decision but it is made without the trade-off written down. Parents on 3G must find a printed code first. | FR-17, FR-49, UJ-6, §5.3 |
| U4 | H | Pattern 12 and screen 8 (UITOP): honest payment statuses, "being confirmed, do not pay again". The PRD has no pending or unconfirmed payment state and no parent-facing wording. The only guard is the duplicate-reference warning at the counter. Parents who paid by Mobile Money and wait for the bursar see nothing. | FR-22, FR-49, FR-50, Glossary "Due status" |
| U5 | M | Screen 8 (PayPal): a "Pay" panel with MTN MoMo, Orange Money and "pay at the counter". The portal shows the balance but gives no payment instructions (merchant number, which reference to quote). UJ-6 says only "as usual". | FR-49 |
| U6 | M | Screen 5: a hero number with a composition bar by tranche and a projected end-of-term figure (collected + moratoire instalments); at most 4 tiles, each "vs same period last year"; a Paid / Partial / Unpaid pupil block (Panze). The PRD compares only the headline to the baseline (FR-36). It has no projection, and Due status has no "Partial", so Paid / Partial / Unpaid counts are not possible. | FR-36, FR-38, Glossary "Due status" |
| U7 | L | Screen 7 (Mangomint): a side panel for simple creations and imports. Not mentioned. Quota-by-plan visible (Teachable) is also absent. | Not in PRD |
| U8 | L | Receipt (Square): the discount line is shown. FR-24 does not list discounts. | FR-24 |

### §4.1 patterns
Present: KPI above a table (partly), timeline (FR-26), schedule lines and summary sentence (FR-28), 3-outcome decision (FR-29), preview of the message (FR-31).
Missing or weak: status tabs with counters, multi-select grouped actions, side panel, confirmation with next actions, honest statuses (see U1, U2, U4). The summary sentence appears only in FR-28; it is not used in allocation, the portal or the Notice.

### §4.2 moratoire flow and rules

| # | Sev | Gap | PRD location |
|---|---|---|---|
| M1 | M | Notification of the parent on decision, with the new schedule and a link (step 6). UJ-6 says "you will be notified", but no FR says how, with no API. | FR-29, FR-51 |
| M2 | M | Rules missing: minimum amount per instalment, and eligibility ("no new moratoire if one was Rompu this year"). FR-27 has only a max count per year. Optional penalties (default off) are not mentioned. | FR-27 |
| M3 | M | Partial payment of an instalment is not defined. The old PRD had "partially kept". The new statuses are only Late / Honoured / Broken. | FR-30 |
| M4 | L | Statuses: "En instruction" (under review) and "Brouillon" are absent. The reminder cadence for instalments is -2, +1 against the report's J-2, J+1, J+5. | FR-30, FR-31 |
| M5 | L | The reason is a list plus free text in the report; the PRD says "reason". | FR-28 |
| M6 | L | Lemon Squeezy final action replaced by "director alert / summons". The PRD has the broken-moratoire list but no wording or tone guidance. | FR-30 |

### §4.3 Cameroon adaptations

| # | Sev | Gap | PRD location |
|---|---|---|---|
| C1 | H | Entry speed: the report says under 30 seconds, search by name or matricule, shortcuts, proposed amount. The PRD sets 60 seconds (copied from the old PRD) and drops shortcuts. Name search and the proposed amount are present. | FR-22 |
| C2 | M | Tone of reminders: "no threats; a school-appropriate tone". The PRD has no tone rule or default message wording. | FR-31, FR-33 |
| C3 | M | Reminders as a scheduled setting, bulk sending. The PRD is a manual list opened one by one (wa.me constraint). That is consistent with the no-API scope, but the report's "bulk of 40 parents" and SMS fallback are gone with no note on how a list of 40 is worked in ten minutes. | FR-32, UJ-4 |
| C4 | L | Receipt on 58/80 mm thermal paper: the PRD has 80 mm only. | FR-24 |
| C5 | L | Offline for payment entry "if field tests justify". The PRD covers only retained input (§5.1) and saved marks (FR-43). | §5.1 |
| C6 | L | Vocabulary configuration (pupil / student / learner) and receipt template configuration. Not needed in the MVP. | None |

### §4.4 MVP
- Item 4 (list with balance, status, filters, export): dropped (see U1).
- Item 6 (grouped reminders, WhatsApp and SMS, templates with variables): partly (FR-31/32).
- "Cut: report cards and grades" contradicts the PRD. This is the brief's decision, so intentional. The report's [Challenge] (validate that schools pay for collection before building more) has no matching gate in the PRD.

## 4. Old PRD (`prd-eskool/prd-eskool.md`), obsolete scope, real practice

| # | Practice | In new PRD? | Intentional? |
|---|---|---|---|
| O1 | **Adoption kit and rollout**: one-page cheat sheet, 15-minute secretary training script, paper receipt book kept as fallback, about one week of shadow period with the notebook, coexistence with Excel and the notebook. Main risk named: digital literacy of frontline staff. Daily-entry screens designed for people not used to computers. | Absent. No rollout, no risk section. | Looks unintentional. The new PRD has no section for it. |
| O2 | **Adoption metrics**: SM-1 "zero paper-book payments missing from the app"; SM-2 "secretary completes first import alone in one session"; SM-6 "founder names a loss in FCFA made visible". | Absent. SM-1..SM-6 are outcome metrics. Collection-rate uplift is meaningless if payments stay on paper. | Likely oversight. |
| O3 | **In-kind supplies** (per-class supply list, expected vs received per pupil, shortfall converted to FCFA, surplus to stock) and asset / consumables register. | Silent. §6.2 lists "inventory" but not the per-pupil supplies ledger that sits on the pupil balance. | Plausibly deferred (old Tier 3, gated by Q5), but not recorded. Add to §6.2 with a reason. |
| O4 | **Expenses, other income, cash book** (payroll is out; expenses are not named). The old founder view had expenses by category and an "uncategorized expense" flag. FR-35 computes expected cash as opening + cash payments - voids; cash paid out of the till for small expenses cannot be recorded, so closings will show false gaps. | Silent | Probably unintentional for expenses; payroll out is explicit. |
| O5 | **Stamp and signature**: the old receipt had a stamp and signature area; the avertissement was stamped, signed by hand and sent home, with the same wording as the WhatsApp text. New: stamp area only on receipt (FR-24) and Notice (FR-33); no signature area, no "same wording". | Mostly kept | Signature drop is minor, likely unintentional. |
| O6 | **Avertissement for parents without WhatsApp, logged as a Reminder "paper"** | Kept (FR-33, UJ-4) | n/a |
| O7 | **Sibling phones**: siblings share a phone, grouped for contact | Kept and extended (FR-10, UJ-1) | n/a |
| O8 | **Opening balances** as paid-to-date totals, audit-marked | Kept (FR-11). But the old import also carried each pupil's fees; the new import has no per-pupil fee or negotiated-discount column, so these must be re-entered as Discounts. The "filled sample file" is gone. | Partly dropped; the sample file is likely an oversight. |
| O9 | **Promise "partially kept"** and a 3-day grace | Replaced by Moratoire statuses and a 7-day Broken threshold. Partial handling is lost (M3). | Redesign is intentional; partial is not covered. |
| O10 | **Reminder frequency cap per parent** (anti-spam) | Absent; only SM-C2 | Mild; the manual list partly mitigates. |
| O11 | **Moratoire never blocks anything** | Kept (FR-48: manual hold only) | n/a |
| O12 | **Founder events feed**: recent voids, adjustments, uncategorized items, who and when | Partial: Voids and Discounts as figures (FR-38), missing closing (FR-39), audit log (FR-55). No "recent money events" view. | Mild gap. |
| O13 | **Performance targets**: 500-pupil owing list under 10 s, 300-row import under 30 s | Replaced by 3 s on 3G (FR-49, §5.1). Import and list speed untested. | Likely oversight. |
| O14 | **Void by Administrator only**; typo correction traceable | Changed to Director (FR-25, addendum A). A bursar's typo needs the director, which slows the counter. | Intentional (role redesign), cost not noted. |
| O15 | **Open questions dropped**: Q4 (how moratoires are handled today), Q9 (real stamped receipt of the pilot school), Q12 (who chases parents today and how often). Q11 (loss per term) is covered by OQ2. | Dropped | Q9 matters for the FR-24 layout. |
| O16 | **Computer-first for daily entry** (old NFR) vs new "mobile-first" (§5.1). UJ-2 still uses the office computer. | Changed | Probably intentional (teacher and promoter on phones), but the counter should say desktop-first. |
| O17 | Parent page ban, no multi-tenant, French first | Reversed deliberately (memlog) | Intentional |
| O18 | Register-photo intake, budget vs actual, depreciation | Not carried | Old PRD already deferred them. |

## Top gaps to fix first
1. U1 pupil/family list with status tabs, bulk actions and export (UX, old Owing list).
2. U3/U4 no-login reminder landing page and honest payment statuses (UX).
3. B2 Collection rate definition with moratoires (brief, billing risk).
4. O1/O2 adoption kit and adoption metrics (old PRD).
5. R2 build order and gate for report cards (research).
6. B1 + O4 collected by cashier and method, and cash expenses in the closing.
