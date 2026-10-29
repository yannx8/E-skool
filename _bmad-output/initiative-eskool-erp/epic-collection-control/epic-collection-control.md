---
type: epic
title: "Moratoires, reminders and cash closing raise the collection rate"
parent: initiative-eskool-erp
covers: [FR-27, FR-28, FR-29, FR-30, FR-31, FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-39]
after: []
assignee: ""
risk: high
---

# Moratoires, reminders and cash closing raise the collection rate

## Description

Moratoire rules, requests at the counter, decisions with counter-proposal and follow-up statuses; the Reminder schedule, the "To remind today" list with WhatsApp links, printed Notices; Cash sessions and closings with gaps; the Collection rate headline with Checkpoint and checked Baseline (UJ-3, UJ-4, UJ-7). Release R2.

## Outcome

The promoter sees this year's Collection rate against a checked Baseline, and every cash gap by cashier (SM-1, SM-3).

## Done when

1. A Moratoire goes Requested → Counter-proposed → Active → Honoured or Broken, and its Charges stay in the Collection rate denominator (FR-30, FR-36).
2. The "To remind today" list matches the Reminder schedule on a fixture school, and invalid phones are flagged (FR-32).
3. A Cash closing shows the gap, and a later Void appears on the next closing (FR-35).
4. The dashboard compares a Tranche at its Checkpoint with a checked Baseline and refuses an unchecked one for billing (FR-36, FR-37).

## Boundaries

`fees` module only. Parent-side Moratoire requests are epic-parent-portal.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.7 to §4.10, UJ-3, UJ-4, UJ-7
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-6, AD-7, AD-14, AD-15
- research — _bmad-output/research/erp-education-ux/rapport-erp-education-ux.md, §4.2 moratoire flow

## Notes

- Open question: where the pilot school's Baseline comes from (PRD Q2); FR-37 waits on it.
