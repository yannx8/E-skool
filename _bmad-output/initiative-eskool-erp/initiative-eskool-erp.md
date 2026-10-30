---
type: initiative
title: "Private primary schools collect more of their fees, on time, with E-skool"
parent: none
covers: [FR-1..FR-64]
after: []
assignee: ""
risk: high
---

# Private primary schools collect more of their fees, on time, with E-skool

## Description

The E-skool MVP for private primary schools in Cameroon, narrowed on 2026-10-30 to the school's painful problems rather than a general ERP: one shared, bilingual online platform with the core (structure, people, roles), cash fees with stamped receipts, a daily send-home list, payment delays and blind cash closing, standard report cards, and WhatsApp payment records for parents. The PRD owns the requirements (FR-1 to FR-64) and the release order (§6.2); the architecture spine owns the invariants (AD-1 to AD-18). All UI is designed in Claude Design.

## Outcome

The pilot school's promoter sees a higher Collection rate than last year's Baseline at the term-2 Checkpoint and pays for it (PRD SM-1), any cash taken but not recorded is caught within a school day (SM-8), and five schools pay after the July–August 2027 window (SM-2).

## Done when

1. The pilot school runs every fee Payment of term 2 through E-skool, each with a printed numbered Receipt (SM-7).
2. The Send-home list is confirmed by the Director every school day and a planted unrecorded receipt is caught the next morning (FR-60, SM-8).
3. The term-2 Collection rate at its Checkpoint is measured against a checked Baseline and shown in a Term report (SM-1, FR-40).
4. Every capability in FR-1 to FR-64 not listed as removed in PRD §6.3 is live in production for the pilot school, in French and English.
5. A test proves no data crosses between two Schools on every tenant table (FR-2, AD-2), and a single-School restore has been rehearsed (FR-58).

## Boundaries

Capability epics in PRD release order, one owner (the builder). Not parents signing in, secondary schools, payroll, attendance, calendar, exams or Mobile Money (PRD §6.3). Tracer path: a School is created, one Pupil with a Guardian is imported, a cash Payment is recorded in an open Cash session with its printed Receipt, and the promoter dashboard shows it.

- Touch point: managed Postgres and Vercel — provisioned and configured, no code; owner: epic-platform-baseline
- Touch point: WhatsApp Business Platform (Meta business verification, display name, utility templates) — configured per School; owner: epic-whatsapp-records
- Touch point: Claude Design — every screen designed there before its ticket is built; owner: each epic for its screens

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md (FR-1..FR-64, §6.2 release order)
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md (AD-1..AD-18, Operations)
- change — _bmad-output/initiative-eskool-erp/change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md
- brief — _bmad-output/initiative-eskool-erp/brief-eskool-erp/brief-eskool-erp.md
- research — _bmad-output/research/erp-cameroon-analysis.md, erp-education-ux/rapport-erp-education-ux.md

## Notes

- Decision: epics follow the PRD's capability areas and release order R1–R4; user chose speed and delegated the split (2026-10-29).
- Decision: 2026-10-30 — MVP narrowed (approved change proposal): epic 6 parent portal dropped, epic 7 WhatsApp records added, epic 3 owns Cash sessions so every Payment needs one, epic 4 rescoped to the send-home list, payment delays and blind closing, epic 5 uses standard templates.
- Decision: 2026-10-30 — all UI and visual design is done in Claude Design.
- Assumption: one builder works the epics in order; no parallel owners.
- Open question: pilot school Baseline source (PRD Q2) gates FR-37 in epic-collection-control.
- Open question: whose WhatsApp Business number sends the messages (PRD Q3); verification can start during R1.
- Unknown: RLS under Prisma 7; spike 1.2 settles it.
