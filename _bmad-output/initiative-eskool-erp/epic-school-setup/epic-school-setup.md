---
type: epic
title: "A school is set up from its Excel sheets"
parent: initiative-eskool-erp
covers: [FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-17]
after: []
assignee: ""
risk: medium
---

# A school is set up from its Excel sheets

## Description

The School administrator describes the School year, Terms, Evaluation periods, Levels and Classes per Subsystem, Subjects and Competencies. Pupils, Guardians, Families and Staff are entered or imported from Excel with a preview; Pupils are promoted or leave; Parent codes are generated and printed (UJ-1).

## Outcome

Mme Ngo imports the pilot school's real sheet alone, with zero duplicates on re-import (UJ-1).

## Done when

1. The pilot school's real pupil sheet imports with a preview and row errors in the User's Language; re-importing it creates zero records (FR-11).
2. Francophone and anglophone Classes coexist in one School year (FR-7).
3. Promotion to the next School year keeps last year's Enrolments unchanged (FR-12).
4. Parent codes print per Class and a reset code stops the old one (FR-17).

## Boundaries

`core` structure and people, plus the import and promotion workflows. Charges are created by epic-fees-and-payments through the `enrolPupil` workflow; this epic exposes the hook.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.2, §4.3, FR-17, UJ-1
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-2, AD-3, AD-14, AD-17
