---
type: epic
title: "Report cards come out in a day"
parent: initiative-eskool-erp
covers: [FR-41, FR-42, FR-43, FR-44, FR-45, FR-46, FR-47, FR-48]
after: []
assignee: ""
risk: high
---

# Report cards come out in a day

## Description

Versioned Report card templates per Subsystem built from real cards, Grading scales, Evaluation entry on a phone that survives dropped connections, completeness and sign-off, comments, batch PDF issue with Verification codes, the public verification page, and holding a card (UJ-5). Release R3.

## Outcome

The pilot school prints a whole term's Report cards in at most one working day (SM-4).

## Done when

1. The FR-41 gate is met: 3 real cards per Subsystem are filed, and each template's fixture test reproduces one of them.
2. A teacher enters a class's Evaluations on a phone with the network cut mid-way and loses nothing saved (FR-43, AD-11).
3. A 350-Pupil School's cards are issued in under 5 minutes of driven batches (FR-46, AD-17).
4. Scanning a Verification code shows only the FR-47 fields, and a reissued card's old code shows "replaced".

## Boundaries

`academics` module plus the verification registry in `platform`. Parent display is epic-parent-portal.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.11, UJ-5
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-9, AD-10, AD-11, AD-14, AD-17

## Notes

- Open question: real report cards (PRD Q1); template entries do not start before the gate is met.
