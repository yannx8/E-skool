---
type: epic
title: "A school is set up from its Excel sheets"
parent: initiative-eskool-erp
covers: [FR-5, FR-6, FR-7, FR-8, FR-9, FR-11, FR-12, FR-13, FR-14]
after: []
assignee: ""
risk: medium
---

# A school is set up from its Excel sheets

## Description

The Director describes the School year with its key dates (Terms, Evaluation periods, Tranche due dates, send-home dates on one screen), Levels and Classes per Subsystem, Subjects with maximum mark and coefficient. Pupils and their Guardians (contacts with phone, WhatsApp consent and Language; one Guardian may be linked to several Pupils) and Staff are entered or imported from Excel with a preview; Pupils are promoted or leave (UJ-1). The Pupil is the account; there are no Families, no Secretary and no parent codes.

## Outcome

M. Essomba imports the pilot school's real sheet alone, with zero duplicates on re-import (UJ-1).

## Done when

1. The pilot school's real pupil sheet imports with a preview and row errors in the User's Language; re-importing it creates zero records, and rows sharing a phone link to one Guardian (FR-11).
2. Francophone and anglophone Classes coexist in one School year, with Subjects carrying a maximum and a coefficient (FR-7, FR-8).
3. The key-dates screen lists Terms, Evaluation periods and Tranche due dates in order (FR-5); its send-home dates appear once epic 4 lands.
4. Promotion to the next School year keeps last year's Enrolments unchanged (FR-12).
5. Only the Director can change a Guardian's phone number, and the change is audited (FR-9).

## Boundaries

`core` structure and people, plus the import and promotion workflows. Charges are created by epic-fees-and-payments through the `enrolPupil` workflow; this epic exposes the hook. Screens designed in Claude Design first.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.2, §4.3, UJ-1
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-2, AD-3, AD-5, AD-14, AD-17
- change — _bmad-output/initiative-eskool-erp/change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md §4.2, §4.6

## Notes

- Decision: 2026-10-30 — Pupil is the account; Guardians are contacts; FR-10 Families and FR-17 Parent codes removed; Director replaces School administrator and Secretary.
