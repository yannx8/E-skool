---
title: 'Prove RLS with set_config under Prisma 7'
type: 'feature'
ticket: '2'
created: '2026-10-30'
status: 'built'
baseline_revision: 'bf2019d0d784a95db9f24a7c89ab7df73995fdaf'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: [quick, ecc-database-reviewer, ecc-security-reviewer]
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every tenant table must be invisible across Schools even when code forgets a `where school_id`, and nobody has proven that Postgres RLS driven by `set_config` works inside Prisma 7.10.1 interactive transactions with `@prisma/adapter-pg`.

**Approach:** Add the tenancy baseline (AD-2): a non-BYPASSRLS app role the runtime connects as, a SQL helper that turns RLS on for a tenant table, the TypeScript tenant-table manifest with a checker, and `withSchool(schoolId, fn)`; prove it with db tests on a probe table holding rows of two Schools.

## Boundaries & Constraints

**Always:** Runtime (`DATABASE_URL`) connects as role `eskool_app` (LOGIN, NOSUPERUSER, NOBYPASSRLS); migrations run as the owner through `DIRECT_URL` (`prisma.config.ts` `datasource.url`). Policy expression is `school_id = nullif(current_setting('app.school_id', true), '')::uuid` for USING and WITH CHECK, with ENABLE and FORCE ROW LEVEL SECURITY. `set_config(..., true)` (transaction-local) only. `schoolId` validated as a uuid before it reaches SQL; raw SQL only through tagged templates.

**Never:** No domain tenant tables yet (they arrive with their modules); no `defineCommand`, permissions or audit (entry 1.4); no passwords for production roles in git; no `SET ROLE` workaround that leaves the runtime connection as owner or superuser.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Own rows | `withSchool(A)` selects probe | only School A rows | none |
| Other School | `withSchool(A)` selects by School B row id | no row | none |
| Write into other School | `withSchool(A)` inserts row with `school_id = B` | rejected | Postgres RLS error surfaces as a thrown error |
| No context | query as app role outside `withSchool` | zero rows | none |
| No leak across transactions | pool of 1; `withSchool(A)` then plain query | zero rows | none |
| Bad id | `withSchool("x")` | throws before any SQL | validation error |
| Planted table | table with `school_id`, no policy, not in manifest | checker reports it | check returns problems list |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- generator + datasource only; add model `School` mapped to `schools` (global).
- `prisma.config.ts` -- has no datasource; add `datasource: { url: env("DIRECT_URL") }`.
- `src/config.ts` -- `DATABASE_URL` required, `DIRECT_URL` optional; keep as is.
- `src/modules/core/data/db.ts` -- `getDb()` singleton with `PrismaPg`; reuse, do not change `readDatabaseStatus`.
- `src/modules/core/index.ts` -- public API (AD-1); export `withSchool`, `checkTenantTables`, manifest.
- `vitest.db.config.ts` -- sets only `DATABASE_URL` (owner on 5433); needs `DIRECT_URL`, app-role `DATABASE_URL`, `globalSetup`.
- `tests/db/database.test.ts` -- existing; must keep passing as app role.
- `.github/workflows/ci.yml` -- db job with `postgres:17` service; env must match the new two-URL setup.
- `docker-compose.yml` -- owner `eskool/eskool`, host port 5433; no change.
- `README.md` -- documents env; add the two roles and the Neon setup step.
- No `prisma/migrations/` yet; this is the first migration.

## Tasks & Acceptance

**Execution:**
- [ ] `prisma.config.ts` -- datasource url from `DIRECT_URL` -- CLI uses the owner.
- [ ] `prisma/schema.prisma` -- `School { id uuid default gen_random_uuid(), name, createdAt }` -> `schools` -- first global table.
- [ ] `prisma/migrations/<ts>_tenancy_baseline/migration.sql` -- create `eskool_app` NOLOGIN NOBYPASSRLS if missing; `schools`; grants on schema and `schools`; function `app_enable_tenant_rls(regclass)` (ENABLE + FORCE RLS, one `tenant_isolation` policy, grant select/insert/update/delete to `eskool_app`) -- the migration helper every tenant table calls.
- [ ] `src/modules/core/data/tenant-tables.ts` -- `tenantTables` (empty) and `globalTables` (`schools`) -- the manifest.
- [ ] `src/modules/core/data/tenancy-check.ts` -- `checkTenantTables(db, manifest)` returns problems: table with `school_id` not in manifest; manifest table missing, without ENABLE/FORCE, or without policy -- CI-able guard.
- [ ] `src/modules/core/data/with-school.ts` -- `withSchool(schoolId, fn, db?)`: zod uuid, `$transaction`, `select set_config('app.school_id', ..., true)`, run `fn(tx)` -- the only tenant entry point.
- [ ] `src/modules/core/index.ts` -- export the above.
- [ ] `tests/db/global-setup.ts` -- with `DIRECT_URL`: ensure `eskool_app` LOGIN with dev password (dev/CI only), then `prisma migrate deploy` -- one setup for local and CI.
- [ ] `vitest.db.config.ts` -- `DIRECT_URL` owner default, `DATABASE_URL` app-role default, `globalSetup`.
- [ ] `tests/db/tenancy.test.ts` -- owner creates probe table `rls_probe(school_id, id, label)` with composite PK and calls the helper; seeds two Schools; cover every matrix row; `checkTenantTables` passes on the real schema with the probe added to the manifest, and reports the planted table.
- [ ] `.github/workflows/ci.yml` -- db job env `DIRECT_URL` owner, `DATABASE_URL` app role.
- [ ] `README.md` -- two URLs (no local volume reset needed: global setup creates the role), Neon: create `eskool_app` login role before first deploy.

**Acceptance Criteria:**
- Given the app role, when `select rolbypassrls, rolsuper from pg_roles where rolname = current_user` runs, then both are false.
- Given a fresh database, when `npm run test:db` runs, then migrations apply and all db tests pass.
- Given `npm run check`, then lint, typecheck and unit tests stay green.

## Implementation Notes

- `prisma.config.ts` reads `process.env.DIRECT_URL ?? ""`, not `env()`: `env()` throws at config load and broke `prisma generate` in postinstall.
- Global setup runs `migrate deploy` first, then sets the dev login: the migration creates the role.
- Global setup refuses a non-local `DIRECT_URL` (guard added).
- Seeding uses `withSchool` with the owner client; FORCE RLS makes the owner pass the same policy.
- First `test:db` run hit P1001 while Docker's port forwarding warmed up; rerun passed 12/12.

## Plan Change Log

## Review Triage Log

Pass 1 (lenses: quick, ecc-database-reviewer, ecc-security-reviewer) — high 0, medium 6, low 5 patched; deferred 1; false/rejected 9.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| README local flow: eskool_app stays NOLOGIN, `npm run dev` cannot connect | medium | patch | Only global-setup grants LOGIN; document the dev login step. |
| README: Prisma 7 CLI does not load `.env`, migrate gets empty URL | medium | patch | prisma.config.ts imports no dotenv; pass DIRECT_URL inline. |
| README Neon note: ALTER ROLE "before first deploy" impossible | low | patch | Role exists only after first migrate; reorder steps. |
| Pre-existing eskool_app with SUPERUSER/BYPASSRLS kept silently (db, security, quick) | medium | patch | create-if-missing never checks attributes; raise in migration. |
| Helper EXECUTE granted to PUBLIC (db, security) | low | patch | No escalation (invoker, non-owner fails), but direct revoke is trivial. |
| Checker: manifest table without school_id passes | medium | patch | tenancyProblems never checks has_school_id for manifest tables. |
| Checker: policy name only, `using (true)` passes (db, security, quick) | medium | patch | Query checks polname only; compare polqual/polwithcheck. |
| Production manifest never checked against live catalog | medium | patch | Tests pass only probeManifest; AD-2 wants the real manifest checked. |
| Cross-School insert test accepts any error | low | patch | `rejects.toThrow()` without message; match row-level security. |
| No UPDATE/DELETE or empty-setting tests | low | patch | Matrix covers insert only; cheap tests close the gap. |
| `$executeRawUnsafe` for constant SQL in tests | low | patch | Plan Always says tagged templates; direct replacement. |
| `schools` grants let the app role read/update every School, no RLS | medium | defer | AD-2 relies on code (platform-only); a DB-level fix needs a platform role or policy design. |
| `schools` has no RLS vs CLAUDE.md "every new table: enable RLS" | false | reject | Global by AD-2 and documented in migration and schema; RLS with no policy would deny the app. |
| Global table with school_id not reported | false | reject | Rule flags any school_id table not in tenant list, global or not. |
| Policy has no TO clause; owner also bound | false | reject | Intended: FORCE + PUBLIC policy binds every non-bypass role. |
| `fn(tx)` can call set_config to switch School | low | reject | In-process code is trusted; no input reaches it; code review covers it. |
| Helper does not check school_id/NOT NULL/index | low | reject | Missing column fails loudly at create policy; composite PK convention covers the index. |
| Interactive tx default 5 s timeout | low | reject | AD-17 chunks heavy work; revisit if a command needs longer. |
| Host guard bypassable via tunnel; known dev password | low | reject | Dev/CI only by design; tunnelling prod to localhost is out of normal use. |
| No default privileges / sequence grants | low | reject | uuid keys only; helper grants per table. |
| Empty DIRECT_URL gives unclear Prisma error | low | reject | Prisma names the missing URL; acceptable. |

## Design Notes

The app connects as a role that cannot bypass RLS, so a forgotten `withSchool` returns nothing instead of everything (AD-2 "Prevents"). `nullif(current_setting('app.school_id', true), '')` turns a missing context into NULL, so no row matches and no error is raised. Global tables (`schools`) have no `school_id` and no policy; only `platform` will reach them.

```sql
create policy tenant_isolation on %I
  using (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
  with check (school_id = nullif(current_setting('app.school_id', true), '')::uuid);
```

## Verification

**Commands:**
- `npm run db:up && npm run test:db` -- expected: all db tests pass, including tenancy.
- `npm run check` -- expected: green.
- `npm run build` -- expected: success.
