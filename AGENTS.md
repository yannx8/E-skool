<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- bmad:context -->
<!-- Verified 2026-10-20 against f8c5e04 (working tree has uncommitted doc deletions). Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## E-skool

Finance and accountability app for private primary schools in Douala: pupil fees, moratoires, payroll, expenses, cash book. Next.js 16 (App Router, server actions) on Vercel, Supabase (Postgres, Auth, Storage), no other backend. Product direction and requirements: `_bmad-output/brainstorm-eskool-next-and-adoption/brainstorm-eskool-next-and-adoption.md` and `_bmad-output/prd-eskool/prd-eskool.md`.

## Policy

- Never apply migrations to the existing `school-fees` Supabase project (different prototype schema with data).
- Money writes only through SECURITY DEFINER functions with role checks; payments are immutable except void; no deletes on money or person tables.
- Every new table: enable RLS, add explicit grants (Supabase grants ALL to anon by default), add an audit trigger if it holds money or person data, add it to `src/lib/backup.ts`.
- Parents only receive WhatsApp reminders; add no parent-facing features (the token parent page is being removed).

## Where things are

- Migrations: `supabase/migrations/`; SQL tests: `supabase/tests/*.test.sql`.

## Running and verifying

- `npm run check` is lint + typecheck + unit tests. CI also runs `npm run build` and `npm run test:db`, which `check` skips.
- `npm run test:db` needs local Postgres 15+ with a superuser (PG* vars) and drops and recreates `TEST_DB` (default `eskool_test`); never point it at production.
- Node >=22.9.
- A push to `main` runs `supabase db push` on production when `SUPABASE_DB_URL` is set; finalize migrations before merging.
- Nothing has run end to end against a live Supabase; treat auth and PostgREST paths as unverified until the first real login.

## Conventions that differ from defaults

- Integer FCFA only. Douala time via `public.app_today()` (SQL) / `todayISO()` (`src/lib/format.ts`), never the server clock.
- Supabase returns max 1000 rows per request: use `fetchAll` (`src/lib/fetch-all.ts`) for exports and totals.
- Forms submit through `useFormAction` (onSubmit + transition), because React 19 resets form fields after every form action.
- Next.js Cache Components are off; the app is fully dynamic and authenticated.
- Bilingual UI, 16 px text, 44 px touch targets, phone first.

<!-- /bmad:context -->
