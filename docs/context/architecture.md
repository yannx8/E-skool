# Architecture

## Code map
- `supabase/migrations/` schema in 5 files: `core` (V1.0), `hr` (V1.1), `finance` (V1.2), `v2`, `storage`. Applied by `supabase db push`.
- `supabase/tests/*.test.sql` SQL tests; `_supabase_stub.sql` imitates Supabase roles/auth/storage/default grants on plain Postgres; run with `scripts/test-db.sh`.
- `src/app/(auth)` login, password reset, no-access page. `src/app/auth/callback` email link landing.
- `src/app/(app)` authenticated screens (French routes): `tableau-de-bord`, `paiements`, `eleves`, `impayes`, `inscriptions`, `personnel`, `finances`, `configuration`, `compte`, `plus` (mobile menu). Each feature folder has its `actions.ts` (server actions).
- `src/app/(print)` printable documents without chrome: `recu/[id]`, `bulletin/[id]`, `rapport-mensuel`.
- `src/app/p/[token]` public parent portal. `src/app/api/export/*` CSV/zip exports. `src/app/api/cron/*` scheduled jobs (CRON_SECRET).
- `src/proxy.ts` (Next 16 name for middleware): session refresh, login redirect, 30-day session cap.
- `src/lib`: `auth.ts` (user, role, settings, active year), `permissions.ts` (UI role matrix), `format.ts` (FCFA, Douala dates), `french-words.ts`, `phone.ts`, `reminder*.ts`, `fetch-all.ts`, `backup.ts`, `database.types.ts` (generated).

## Data model (key tables)
school_years (one `is_current`) · classes (`sort_order` drives promotion) · fee_schedules (year x class x fee x term; term null = one-off) · pupils · enrollments (pupil x year → class) · discounts · payments (receipt `YYYY-NNNN` per year via `counters`) · reminder_log · staff · staff_salary_history (append-only) · payroll_entries (payslip `BP-YYYYMM-NNN`) · expense_categories · expenses · other_income · cash_closings · period_locks · adjustments · enrollment_applications · message_jobs · settings (single row) · user_roles · audit_log.

Views (security_invoker): `balance_lines` (per pupil x fee line: due after discount, paid, carry, applied, remaining, status BR1), `pupil_term_balance` (per pupil x term, with display fields and last reminder), `pupil_year_balance` (totals, credit), `cash_book` (all money movements), `staff_current_salary`.

## Security model
- Roles in `user_roles`: admin (everything, no deletes of history), owner (read-only everything incl. audit), secretary (pupils, payments, reminders, enrollment; no void, no HR/finance/config).
- RLS on every table; `auth_role()` helper. anon has no table access; only `parent_portal(token)` is executable by anon.
- Money tables have no INSERT/UPDATE grants: writes go through role-checked SECURITY DEFINER functions (`record_payment`, `void_payment`, `pay_payroll_entry`, `record_expense`, `close_day`, `lock_month`…). Triggers enforce immutability and date locks even for the service role.
- Service-role key used only in: user management page, backups page, cron routes, setup script.

## Business rules where they live
BR1 statuses: `balance_lines` · BR2 voided never count: views filter `not voided` · BR4 receipts never reused: `counters` + trigger · BR5 credit carry: `balance_lines` · BR6 locks: `assert_date_open()` · BR7 salary history: append-only trigger · FR-Y5 duplicates: `record_payment` returns `status: duplicate`.
