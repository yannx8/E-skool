# E-skool: project context

@AGENTS.md

## Objective
ERP for private primary schools in Douala. Ticket 1 (platform baseline): clean tree, pinned stack, local Postgres 17, CI, one page reading the database.

## Current state (2026-10-29)
- Built: scaffold, `src/config.ts` (zod env), `core.databaseStatus()`, home page, unit test (config), DB test (`tests/db`), CI, `vercel.json` (fra1), security headers and `poweredByHeader: false` in `next.config.ts`, `/health` route (`src/app/health/route.ts`), startup config check (`src/instrumentation.ts`).
- Verified locally: `npm run check`, `npm run build`. `npm run test:db` targets the Docker container on host port 5433 (a native Windows Postgres holds 5432); last run failed because Docker Desktop was not running.
- NOT verified: CI run, Vercel deploy, production URL.

## Decisions
- 2026-10-29 Old prototype removed from `main` of this branch; kept on `archive/finance-prototype`.
- 2026-10-29 `prisma.config.ts` reads no environment variables; the datasource URL arrives with the first migration.
- 2026-10-29 Database is Neon Frankfurt with 30-day point-in-time restore; Vercel region `fra1`.
- 2026-10-29 Deploy by pushing `erp/platform-baseline` to GitHub and importing into Vercel; each push needs the owner's approval.
