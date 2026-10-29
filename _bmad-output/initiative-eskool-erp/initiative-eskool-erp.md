---
type: initiative
title: "Private primary schools collect more of their fees, on time, with E-skool"
parent: none
covers: [FR-1..FR-58]
after: []
assignee: ""
risk: high
---

# Private primary schools collect more of their fees, on time, with E-skool

## Description

The E-skool MVP for private primary schools in Cameroon: one shared, bilingual online platform with the core (structure, people, roles), fees with moratoires, reminders and cash control, report cards, and a parent portal. The PRD owns the requirements (FR-1 to FR-58) and the release order (§6.2); the architecture spine owns the invariants (AD-1 to AD-17).

## Outcome

The pilot school's promoter sees a higher Collection rate than last year's Baseline at the term-2 Checkpoint and pays for it (PRD SM-1), and five schools pay after the July–August 2027 window (SM-2).

## Done when

1. The pilot school runs every fee Payment of term 2 through E-skool (SM-7).
2. The term-2 Collection rate at its Checkpoint is measured against a checked Baseline and shown in a Term report (SM-1, FR-40).
3. Every capability in FR-1 to FR-58 is live in production for the pilot school, in French and English.
4. A test proves no data crosses between two Schools on every tenant table (FR-2, AD-2).
5. A single-School restore has been rehearsed in production conditions (FR-58).

## Boundaries

Capability epics in PRD release order, one owner (the builder). Not secondary schools, payroll, attendance, messaging or Mobile Money APIs (PRD §6.3). Tracer path: a School is created, one Family is imported, a Payment is recorded with its Receipt, and the promoter dashboard shows it.

- Touch point: managed Postgres and Vercel — provisioned and configured, no code; owner: epic-platform-baseline
- Touch point: WhatsApp — `wa.me` links only, no integration; owner: epic-collection-control

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md (FR-1..FR-58, §6.2 release order)
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md (AD-1..AD-17, Operations)
- brief — _bmad-output/initiative-eskool-erp/brief-eskool-erp/brief-eskool-erp.md
- research — _bmad-output/research/erp-cameroon-analysis.md, erp-education-ux/rapport-erp-education-ux.md

## Notes

- Decision: epics follow the PRD's capability areas and release order R1–R4; user chose speed and delegated the split (2026-10-29).
- Assumption: one builder works the epics in order; no parallel owners.
- Open question: real report cards (PRD Q1) gate epic-report-cards (FR-41 gate).
- Open question: pilot school Baseline source (PRD Q2) gates FR-37 in epic-collection-control.
- Unknown: parent-code sign-in and RLS under Prisma 7; spikes in epic-platform-baseline.
