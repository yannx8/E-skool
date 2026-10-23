# Reconciliation: source intent vs PRD

Compared: `prd-eskool/prd-eskool.md` + `prd-eskool/addendum.md` against `brainstorm-eskool-next-and-adoption/brainstorm-eskool-next-and-adoption.md` (memlog 2026-10-18). Read-only; PRD not edited.

Legend: DROPPED = in source, absent from PRD. SOFTENED = present but weakened or retagged. CONTRADICTED = PRD says the opposite. UNTAGGED = PRD claim with no source support and no `[ASSUMPTION]`.

## 1. Decisions and out-of-scope

| Source item | PRD status |
|---|---|
| Single-school only [user] | Kept (6.2 adds "founder hook 'across your schools' is parked", not in source; see UNTAGGED) |
| No parent app [user] | Kept, plus removal of token page (decided 2026-10-20, not in source) |
| No approvals, no blocking, no in-app questions [user] | Kept (section 5) |
| No wage payment; payroll tracked not paid [user] | Kept (FR-21, section 5) |
| No grades / report cards [user] | Kept (section 5) |
| Not ERP, not replacement for Excel/paper [coach, adopted] | Kept in Vision (section 1) |
| Shadow ledger "fed by register photo or Excel upload" [coach, adopted] | SOFTENED: PRD says "fed by an Excel import and daily payment entry". Register photo intake is DROPPED (grep "photo": 0 hits). |
| Rule: "every feature must map to a real pain founders would pay for" [user] | DROPPED. PRD puts all features in MVP (6.1) with no pain/willingness-to-pay test. Asset register (FR-19) and consumable stock (FR-20) have no source pain evidence beyond "asset tracking [user]". |

## 2. User quotes and qualitative ideas

| Source item | PRD status |
|---|---|
| "Transparency is the core strength" [user] | SOFTENED: Vision reframes it as a competitive "wedge" (tagged ASSUMPTION). The word "strength" does not appear. |
| "A 'show them the number' pitch will not sell" [user] | DROPPED. PRD has no warning against this pitch; Vision leads with the number-visibility framing. |
| "Awareness is not the gap" [user] | Partly kept (Section 1 "they can see but do not chase"). Not stated as a pitch constraint. |
| Low-level staff digital-literacy gap; director and founder comfortable with computers [user] | CONTRADICTED: UJ-1 persona Mado is "comfortable with Excel, not with new software" and secretary is treated as a normal user. Gap appears nowhere in PRD. |
| FR with simple vocabulary; one-page printed cheat sheet; 15-min training script; "paper receipt book still works" fallback [coach] | DROPPED (grep "cheat", "training" (only in UJ-4 wording), "fallback" (WhatsApp only), "vocabulary" (only in Section 0 header text)). Only 3-tap flow and 44 px targets kept. |
| Per-row import errors in plain French, preview, safe re-import, sample file; "import quality is the adoption gate" [coach] | Kept (FR-1 to FR-4, SM-2). Gate framing kept only implicitly. |

## 3. Market, competition, go-to-market

| Source item | PRD status |
|---|---|
| Competitors lead with grades/report cards and MoMo collection; "cannot win on price" [coach] | Kept in addendum; "will not win on price" kept (6.4). |
| Inferred gap (founder transparency, moratoires, in-kind, one view) needs 5-10 director interviews [inferred] | SOFTENED: tagged ASSUMPTION in Section 1, interview step kept only in addendum. |
| "1-2 pilot schools" before pitch [coach] | SOFTENED to "one pilot school" (6.4). |
| Pilot via a relative at a school and founder as user's mother's friend [user] | Generalized to "reached through family" (6.4). Acceptable. |
| Pitch Jul-Aug 2027 unless mid-year pilot [coach] | Kept. |
| Before pitch: first E2E against live Supabase, 1-2 pilots [coach] | Partly kept (E2E gate in 6.4; pilot count reduced). |

## 4. Risks

Source has four risks. PRD has no risks section.
- Digital literacy of secretary = "main death risk, not politics" [user]: DROPPED entirely (no mitigation, no SM).
- Never run E2E against live Supabase [coach]: kept (6.4).
- Willingness to pay unvalidated; pricing not decided [user, coach]: kept (6.4, Q8).
- Programmed wage payment moves money [coach]: kept as non-goal (FR-21).

## 5. Open questions

Source priority: Q1 founder's first check, Q3 where fee records are kept, Q4 why pay for transparency [user, "Priority"].
- Q1 kept (PRD Q1). "Priority" tag lost.
- Source Q3 (fee records) = PRD Q2; source Q4 (why pay) = PRD Q3. Renumbered, priority marker lost.
- DROPPED: "How much a school loses per term to unpaid fees." Only SM-6 touches it, as a post-pilot answer, not a question.
- DROPPED: "Who chases parents and how often."
- Kept: moratoire handling (Q4), in-kind counting (Q5), pricing (Q8), real role split (Q6).

## 6. Unsupported PRD claims without [ASSUMPTION] tag

- UJ-1 to UJ-6 personas and quotes: Mado, Mrs Nkeng, Mr Essomba, Mme Biya, Mr Tchoumi, M. Fotso. Names, scenes and climaxes (e.g., "212 élèves, 0 erreur", "trusts no single person", founder "on his phone") are invented.
- Founder JTBD (2.1): "so I trust the numbers my director gives me": untagged; source only has Q4 "why would a founder pay", which is open.
- Section 1: "parents and schools already trust (stamped receipts, stamped avertissements)": parent trust not in source.
- 6.2: "the founder hook 'across your schools' is parked, not rejected": source has no such hook.
- FR-9: "Siblings sharing a parent phone are grouped": from CLAUDE.md project decision, not source.
- 4.2: payment methods "cash, Orange Money, MTN MoMo, bank": from code, not source; not marked as inventory.
- FR-19: Asset register role "Administrator or Store keeper": source gives no role.
- 6.2: mobile-money collection "decide after pilot": source has no decision on online collection.
- 6.3: RLS, explicit grants, audit triggers, role-checked DB functions, 1000-row limit: technical, from CLAUDE.md, not source.
- 6.1: "Remove existing token parent page (decided 2026-10-20)": date and decision are PRD-author, not source.

## Gaps summary (for handback)

1. No risks section: secretary digital-literacy risk ("main death risk") dropped; UJ-1 persona contradicts it.
2. MVP prioritization dropped: day-one must-haves (import, payment, owing list) and the "pain founders would pay for" rule are not applied; all features in MVP.
3. Adoption tooling dropped: cheat sheet, 15-min training, paper-receipt-book fallback, register-photo intake; pilot count cut from 1-2 to one.
4. Open questions dropped: loss per term from unpaid fees; who chases parents and how often.
5. Untagged invented claims: personas/quotes, "founder hook across your schools", parent trust, sibling grouping.
