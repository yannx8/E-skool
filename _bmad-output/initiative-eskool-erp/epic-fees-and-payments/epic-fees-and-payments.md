---
type: epic
title: "The cashier takes cash and hands a stamped receipt"
parent: initiative-eskool-erp
covers: [FR-18, FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-34, FR-38]
after: []
assignee: ""
risk: high
---

# The cashier takes cash and hands a stamped receipt

## Description

Funds, Fee plans by Level with Tranches and due dates, Charges per Enrolment, Director-only Discounts, Cash sessions, cash Payments for one Pupil or several siblings in one visit, Allocation, one numbered printed Receipt per visit with the Balance left (stamped by hand), Director-only Voids, the Pupil account timeline, and the promoter dashboard money breakdown (UJ-2, part of UJ-7). Release R1.

## Outcome

The pilot school records every term-2 Payment in E-skool from week 4, each with a printed numbered Receipt (SM-7).

## Done when

1. A cash Payment for two siblings is recorded in an open Cash session in at most 3 steps and prints one Receipt listing both, under 30 s for a trained Cashier (FR-22, FR-24, FR-34).
2. A Payment without an open Cash session is refused; Receipt numbers have no gaps; a Voided Payment stays visible and keeps its number (FR-24, FR-25, FR-34).
3. A Cashier calling Void or Discount gets "forbidden" from the server (FR-15, FR-21, FR-25).
4. Automated tests prove Balance, credit and every dashboard total equal the sum of their rows (FR-26, FR-38, §5.2).
5. A double-submitted Payment creates one Payment (AD-15).

## Boundaries

`fees` module up to Payments, Cash session open/close (without the blind closing) and the dashboard, plus the `recordPayment` workflow. Send-home list, Payment delays, blind Cash closing and Baseline are epic-collection-control; WhatsApp confirmation is epic-whatsapp-records, which plugs into `recordPayment`. Screens designed in Claude Design first.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.5, §4.6, FR-34, FR-38, UJ-2, UJ-7
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-4, AD-5, AD-6, AD-14, AD-15
- change — _bmad-output/initiative-eskool-erp/change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md §4.1, §4.3

## Notes

- Decision: 2026-10-30 — cash only; Mobile Money and bank deferred; FR-34 Cash sessions moved here from epic 4 so every Payment belongs to a session (resolves the earlier source conflict).
