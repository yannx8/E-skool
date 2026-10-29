---
type: epic
title: "The bursar takes payments and the promoter sees them"
parent: initiative-eskool-erp
covers: [FR-18, FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-38]
after: []
assignee: ""
risk: high
---

# The bursar takes payments and the promoter sees them

## Description

Funds, Fee plans by Level with Tranches, Charges per Enrolment, Discounts, Payments with Mobile Money reference, Allocation, numbered Receipts with the Balance left, Voids, the Family account, and the promoter dashboard money breakdown (UJ-2, part of UJ-7). With epics 1 and 2 this is release R1.

## Outcome

The pilot school records every term-2 Payment in E-skool from week 4 (SM-7).

## Done when

1. A Payment with its Receipt is recorded in at most 3 steps, under 30 s for a trained Bursar (FR-22).
2. Receipt numbers have no gaps and a Voided Payment stays visible (FR-24, FR-25).
3. Automated tests prove Balance, credit and every dashboard total equal the sum of their rows (FR-26, FR-38, §5.2).
4. A double-submitted Payment creates one Payment (AD-15).

## Boundaries

`fees` module up to Payments and the dashboard. Moratoires, Reminders, Cash sessions and Baseline are epic-collection-control.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.5, §4.6, FR-38, UJ-2, UJ-7
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-4, AD-6, AD-14, AD-15
- research — _bmad-output/research/erp-education-ux/rapport-erp-education-ux.md, §3 screens 1, 2, 5

## Notes

- Source conflict: PRD FR-34 requires an open Cash session for a cash Payment, but Cash sessions ship in epic-collection-control. Assumption: cash Payments need no Cash session until epic 4 lands.
