---
title: 'Archive the old code and deploy a new scaffold end to end'
type: 'chore'
ticket: '1'
created: '2026-10-29'
status: 'built'
baseline_revision: 'd9546a9b5f955cf3151ad22a8607a0e7466e6c77'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick', 'ecc-typescript-reviewer']
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository holds an abandoned finance prototype; the new ERP needs a clean tree at the pinned stack that builds, tests and deploys before any feature work.

**Approach:** The old tree is already committed on `archive/finance-prototype` (d9546a9). On `erp/platform-baseline`, remove the old app code, scaffold the new app per the spine's Stack and Structural Seed, add local Postgres 17 and CI, and deploy one page that reads the database to Vercel EU backed by managed EU Postgres.

## Boundaries & Constraints

**Always:** exact versions from the spine Stack (Prisma 7.10.1 exact, TypeScript 5.9.3, Next.js 16.4.3, React 19.3.1); environment read only in `src/config.ts` and validated with zod; database access only from `src/modules/core/data/`; Vercel region set explicitly; keep `_bmad/`, `_bmad-output/`, `.claude/`, `AGENTS.md`, `CLAUDE.md`.

**Never:** reuse old `src/` or `prisma/` code; create domain tables (identity, schools, tenancy belong to entries 2–7); auth, i18n or RLS work; push to a remote or create accounts without the user.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DB reachable | `DATABASE_URL` valid | Home page shows Postgres version and server time (Douala-formatted later; raw ISO now) | No error expected |
| DB down | Postgres stopped | Page renders "Database unreachable" status, HTTP 503 | Error logged as structured JSON, no stack shown |
| Env missing | `DATABASE_URL` unset | App refuses to start with one clear message naming the variable | zod error at startup |

**Decisions (2026-10-29):** deploy by pushing `erp/platform-baseline` to GitHub `origin` and importing the repo in Vercel (previews per branch, production on `main`), asking before every push; database is Neon Frankfurt on a plan with 30-day point-in-time restore, paired with Vercel region `fra1`.

</frozen-after-approval>

## Code Map

- `src/`, `prisma/`, `prisma.config.ts`, `public/`, `docs/`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.mts`, `package.json`, `package-lock.json`, `E-skool.code-workspace` -- old prototype; delete (kept in `archive/finance-prototype`).
- `.github/workflows/ci.yml` -- old Supabase CI with a `migrate` job; replace entirely.
- `README.md` -- Supabase setup guide; rewrite.
- `AGENTS.md` (E-skool section after the next.js block) and `CLAUDE.md` (Current state, Decisions) -- describe the Supabase app; rewrite to the new initiative. Keep the generated next.js block untouched.
- `.gitignore` -- keep; already ignores `.env*`, `/src/generated/`, `.claude/work/`, `/_bmad/render/`.
- `.claude/launch.json` -- `eskool-dev` on port 3000; keep.
- Docker 29.7 available locally; no `psql` (use the container).

## Tasks & Acceptance

**Execution:**
- [ ] repo root -- `git rm -r` the Code Map's old files -- clean tree.
- [ ] `package.json` -- scripts `dev`, `build` (`prisma generate && next build`), `start`, `lint`, `typecheck`, `test` (unit), `test:db`, `check`, `db:up`; pinned deps; `engines.node >=24` -- one entry point for every check.
- [ ] `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.db.config.ts` -- standard Next 16 setup, read `node_modules/next/dist/docs/` first -- per AGENTS.md.
- [ ] `docker-compose.yml` -- `postgres:17` on 5432 with a named volume -- local DB.
- [ ] `.env.example` -- `DATABASE_URL`, `DIRECT_URL` with comments -- documents config.
- [ ] `src/config.ts` -- zod-parsed env, exported once; unit test for missing variable -- AD conventions.
- [ ] `prisma/schema.prisma`, `prisma.config.ts` -- generator + datasource only, adapter-pg, output `src/generated/prisma` -- no domain models yet.
- [ ] `src/modules/core/data/db.ts`, `src/modules/core/index.ts` -- Prisma client singleton and `databaseStatus()` query (`select version(), now()`) -- first module API.
- [ ] `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` -- page showing status or 503 -- tracer bullet.
- [ ] `tests/db/database.test.ts` -- `databaseStatus()` returns a version against real Postgres -- db test lane.
- [ ] `.github/workflows/ci.yml` -- Node 24; job `app` (lint, typecheck, test, build); job `db` with `postgres:17` service running `test:db` -- CI.
- [ ] `vercel.json` -- `regions: ["fra1"]` -- explicit EU region.
- [ ] `README.md`, `AGENTS.md`, `CLAUDE.md` -- new run, verify and deploy instructions; drop Supabase rules -- docs match reality.

**Acceptance Criteria:**
- Given a fresh clone, when `npm ci && npm run check` runs, then lint, typecheck and unit tests pass.
- Given `docker compose up -d` and `DATABASE_URL` set, when `npm run test:db` runs, then it passes.
- Given CI on a pushed branch, when it runs, then both jobs are green.
- Given the production URL, when opened, then it shows the managed EU database's Postgres 17 version.

## Implementation Notes

- Old tree removed with `git rm`; it stays on `archive/finance-prototype` (d9546a9).
- Local Postgres maps to host port 5433: a native Windows Postgres service already listens on 5432 and took host connections (password errors). CI keeps 5432.
- `postinstall: prisma generate` added: CI typecheck and db tests need the generated client, which only `build` produced.
- `src/instrumentation.ts` parses config at server start; verified `next start` with an empty `DATABASE_URL` fails with "DATABASE_URL: Invalid URL".
- Deviation from the matrix: a Next.js page cannot set HTTP 503. The page shows "Database unreachable"; `GET /health` returns 503 when the database is down (for uptime checks, entry 9). Test covers `databaseStatus` returning `{ ok: false }` on an unreachable database and `/health` 200 when up; the 503 branch is not exercised by a test.
- `readDatabaseStatus(db = getDb())` takes an injectable client so the down path is testable.
- Vitest configs alias `@` to `src`. `next.config.ts` sets `outputFileTracingRoot` (a stray `package-lock.json` in the home folder was taken as the root).
- Self-pinned devDeps checked on npm: eslint 9.39.5, @types/node 24.19.2, @types/react 19.3.0, @types/react-dom 19.3.0; typescript-eslint and postcss come through eslint-config-next and @tailwindcss/postcss.
- Not done: `.env.example` (path blocked by a read-deny rule; variables documented in README.md); deploy (needs the user's accounts and a push).

## Plan Change Log

## Review Triage Log

Pass 1 (lenses: quick, ecc-typescript-reviewer) — high 0, medium 2, low 4 patched; false 5; rejected/deferred 9.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| db.ts default `getDb()` outside try (both lenses) | medium | patch | Invalid config would throw from the page instead of "Database unreachable"; resolve inside try. |
| next.config.ts dropped security headers and poweredByHeader | medium | patch | Old config had them; app will hold person and money data; restore basic headers, CSP later. |
| README points to missing `.env.example` | low | patch | File is blocked by a deny rule; show variables inline. |
| CLAUDE.md says test:db fails | low | patch | Stale: passes since port moved to 5433. Factual fix to this diff's own text. |
| eslint ignores drop out/build | low | patch | Trivial add. |
| CI runs on push and pull_request | low | patch | Double runs per PR branch. |
| Home page shows Postgres version to anonymous users | false | reject | The frozen intent asks the tracer page to show it; revisit when auth lands (entry 6). |
| `<html lang="en">` fixed, metadata untyped, viewport removed | low | reject | Language handling is entry 1.5 (AD-8). |
| Test and vitest.db config read env / build a client outside core/data | low | reject | Test tooling, not app code; rule targets app code. |
| `type: module` in package.json | false | reject | All configs are .ts/.mjs. |
| engines >=24 vs AGENTS.md >=22.9 | false | reject | AGENTS.md now says Node >=24. |
| package-lock.json not in diff | false | reject | Excluded from the review diff on purpose; it exists and matches (npm install). |
| prisma.config.ts has no datasource URL; DIRECT_URL unused | low | reject | Documented decision: URL arrives with first migration (entry 2). |
| tsconfig includes generated client; no noUncheckedIndexedAccess | low | reject | Typecheck passes; strictness tightening can wait for real code. |
| `rows[0]` unguarded | false | reject | `select version(), now()` always returns one row; inside try anyway. |
| No shared structured logger | maybe-false | defer | Medium if every module copies console.error JSON; settle at entry 1.4 (defineCommand). |
| /health 503 branch untested; page cannot 503 | low | reject | Documented deviation; covered by unreachable-db test of databaseStatus. |
| CI/production acceptance not verified | — | open | Needs push and deploy (user). |

## Design Notes

`databaseStatus()` uses `$queryRaw` so no table exists before entry 2 decides tenancy. Region `fra1` pairs with Neon Frankfurt (spine Operations assumption).

## Verification

**Commands:**
- `npm run check` -- expected: all green
- `docker compose up -d && npm run test:db` -- expected: pass
- `npm run build` -- expected: success

**Manual checks (if no CLI):**
- Production URL shows the Postgres version; `vercel.json` region is `fra1` in the deployment's function region.
