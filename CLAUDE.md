# E-skool: project context

@AGENTS.md

## Objective and success metric
Primary School management app  in Douala. 

## Current state (2026-10-14)
- Built: V1.0 (fees), V1.1 (HR/payroll), V1.2 (finance, owner role, reports), V2 (enrollment pipeline, parent portal (being removed), auto reminders, secretary role, discounts).
- Verified: SQL tests (4 suites, money rules + RLS + grants), 52 unit tests, lint, typecheck, production build.
- NOT verified: no end-to-end run against a live Supabase (PostgREST/GoTrue unavailable in the build sandbox). First real login is the first E2E test.

## Decisions
- 2026-10-14 Pupils split into `pupils` (identity) + `enrollments` (pupil x year x class), unlike the plan's single table: promotions keep history.
- 2026-10-14 Overpayment carry (BR5) computed in the `balance_lines` view, forward only (Lindley recursion), not a separate credit table.
- 2026-10-14 Cash closing keeps an opening balance (previous counted - removed), and locks every entry dated on or before the last closing.
- 2026-10-14 "Tranche" + 3 terms by default, both configurable (settings.term_label, terms_count) because A1 is unvalidated.
- 2026-10-14 HR/Finance/Enrollment modules off by default (plan gates; adoption risk #2).
- 2026-10-14 Not built: `parents`/`parent_pupils` tables (siblings share a phone instead), statutory payroll contributions, SMS.

## Open assumptions to validate with the admin
A1 fees per term fixed per class · A2 sibling discounts (supported) · A3 one-off fees · A4 phone + laptop · A5 owner wants read-only visibility · receipt paper format (A5 / A4 / 80 mm all supported) · what happens when a pupil leaves mid-year (debt stays visible) · WhatsApp reminder volume (auto reminders only if > 30/week).
