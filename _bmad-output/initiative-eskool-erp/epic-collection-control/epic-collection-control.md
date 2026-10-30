---
type: epic
title: "Send-home list, payment delays and cash closing"
parent: initiative-eskool-erp
covers: [FR-27, FR-28, FR-30, FR-35, FR-36, FR-37, FR-39, FR-40, FR-59, FR-60]
after: []
assignee: ""
risk: high
---

# Send-home list, payment delays and cash closing

## Description

The send-home rule per Tranche and the daily Send-home list built from recorded Payments, confirmed by the Director with audited exclusions and shown read-only to Cashier and Teachers; Payment delays granted by the Director at the counter with Instalment follow-up; the blind Cash closing with a Gap threshold and Director approval; the Collection rate headline with Checkpoint and checked Baseline; cash closings on the dashboard; the Term report (UJ-3, UJ-4, UJ-7). Release R2.

## Outcome

The promoter sees this year's Collection rate against a checked Baseline and every cash gap by Cashier, and a payment taken but not recorded is caught the next school day (SM-1, SM-3, SM-8).

## Done when

1. On a fixture school, the Send-home list matches the rule, excludes Pupils Under delay, drops a Pupil the day after a Payment and brings them back after a Void (FR-59, FR-60).
2. A Payment delay goes Active → Honoured or Broken, and its Charges stay in the Collection rate denominator (FR-28, FR-30, FR-36).
3. A blind closing hides expected cash until the count is saved, and a gap above the threshold waits for Director approval; a later Void appears on the next closing (FR-35).
4. The dashboard compares a Tranche at its Checkpoint with a checked Baseline, and the Term report equals the dashboard (FR-36, FR-37, FR-40).

## Boundaries

`fees` module and the `confirmSendHome` workflow. WhatsApp notices and reminders are epic-whatsapp-records. Screens designed in Claude Design first.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.7 to §4.10, UJ-3, UJ-4, UJ-7
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-5, AD-6, AD-7, AD-14, AD-15
- change — _bmad-output/initiative-eskool-erp/change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md §4.4 (patterns: Schoolites, Entab, EdPrime defaulter lists; Odoo POS closing control)

## Notes

- Decision: 2026-10-30 — rescoped: Moratoire requests, counter-proposals, WhatsApp link reminders and printed Notices removed (FR-29, FR-31 to FR-33); Send-home list (FR-59, FR-60) and blind closing added; FR-34 moved to epic 3.
- Open question: where the pilot school's Baseline comes from (PRD Q2); FR-37 waits on it.
- Open question: the pilot school's current send-home rule (PRD Q5).
