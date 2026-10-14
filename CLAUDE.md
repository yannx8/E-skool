# E-skool: project context

@AGENTS.md

## Objective and success metric
School management app for the author's mother's primary school in Douala. Side project, not a business (generalization is gated by the author's bet rules, not by this repo). Success = 30 days after go-live: 100% of fee payments recorded in the app with printed receipts, payment + receipt in < 60 s, "who owes what" in < 10 s, admin uses it unprompted 3 weeks in a row, audit log complete.

## Current state (2026-10-14)
- Built: V1.0 (fees), V1.1 (HR/payroll), V1.2 (finance, owner role, reports), V2 (enrollment pipeline, parent portal, auto reminders, secretary role, discounts). Source spec: `docs/context/plan.md`.
- Verified: SQL tests (4 suites, money rules + RLS + grants), 52 unit tests, lint, typecheck, production build.
- NOT verified: no end-to-end run against a live Supabase (PostgREST/GoTrue unavailable in the build sandbox). First real login is the first E2E test: run the smoke checklist in `docs/context/operations.md`.
- Not deployed. The owner only fills env vars and runs `npm run setup` (README).

## Decisions
- 2026-10-14 Pupils split into `pupils` (identity) + `enrollments` (pupil x year x class), unlike the plan's single table: promotions keep history.
- 2026-10-14 Money writes only through SECURITY DEFINER functions with role checks; payments immutable except void; no deletes on money/person tables; append-only audit log via triggers.
- 2026-10-14 Overpayment carry (BR5) computed in the `balance_lines` view, forward only (Lindley recursion), not a separate credit table.
- 2026-10-14 Cash closing keeps an opening balance (previous counted - removed), and locks every entry dated on or before the last closing.
- 2026-10-14 "Tranche" + 3 terms by default, both configurable (settings.term_label, terms_count) because A1 is unvalidated.
- 2026-10-14 HR/Finance/Enrollment modules off by default (plan gates; adoption risk #2).
- 2026-10-14 Next.js 16 with Cache Components OFF (fully dynamic, authenticated app). Forms submit through `useFormAction` (onSubmit + transition) because React 19 resets form fields after every form action.
- 2026-10-14 Not built: `parents`/`parent_pupils` tables (siblings share a phone instead), statutory payroll contributions, SMS.

## Constraints
- Integer FCFA only. Douala time via `public.app_today()` / `todayISO()`. French UI, 16 px text, 44 px targets.
- Every new table: enable RLS, explicit grants (Supabase grants ALL to anon by default), audit trigger if money/person data, add to `src/lib/backup.ts`.
- Supabase returns max 1000 rows per request: use `fetchAll` for exports and totals.
- Never apply migrations to the existing `school-fees` Supabase project (different prototype schema with data).

## Open assumptions to validate with the admin (plan section 10)
A1 fees per term fixed per class · A2 sibling discounts (supported) · A3 one-off fees · A4 phone + laptop · A5 owner wants read-only visibility · receipt paper format (A5 / A4 / 80 mm all supported) · what happens when a pupil leaves mid-year (debt stays visible) · WhatsApp reminder volume (auto reminders only if > 30/week).

## Next milestone
Phase 1 exit: admin records a real payment in front of the author on production. Then phase 1b: import her real Excel data, 1-week shadow period with paper.

## Topic files
- `docs/context/architecture.md`: code map, data model, security model.
- `docs/context/operations.md`: deploy, backups, smoke checklist, troubleshooting.
- `docs/context/plan.md`: original PRD/SRS (source of truth for requirements).
