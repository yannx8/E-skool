---
title: 'defineCommand, audit, permissions and module guards'
type: 'feature'
ticket: '4'
created: '2026-10-31'
status: 'built'
baseline_revision: 'eb394d35ff43d26d484df858f13198b4fefd4fb4'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: [quick, database-reviewer, security-reviewer]
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md', '{project-root}/_bmad-output/initiative-eskool-erp/prd-eskool-erp/addendum.md', '{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every state change must pass the same checks — permission, Module, Subscription, input, idempotency — and leave an Audit row (AD-3, AD-5, AD-12, AD-15, FR-55), or one command will skip a check another enforces; nothing enforces module boundaries or keeps Prisma writes inside `data/` (AD-1).

**Approach:** Build `defineCommand` in `core`, the permission matrix from PRD FR-15 / addendum §A, tenant tables `school_settings`, `audit_log` (insert-only) and `command_requests` (idempotency), one real command (`core.setModuleEnabled`, FR-3), and architecture tests that fail on a cross-module import, a Prisma write outside `data/`, or a model missing from `prisma/ownership.ts`.

## Boundaries & Constraints

**Always:** Order inside `run`: permission → zod input → `withSchool` transaction → Module and Subscription guard read from `school_settings` → `requestId` check → handler → `command_requests` row → Audit row, all in the same transaction. Results are `{ ok: true, data } | { ok: false, error: { code, messageKey, field? } }`; expected failures never throw. Every `writes: true` command needs a uuid `requestId`. Audit rows hold ids and changed field names only, never names or phone numbers; `audit_log` rejects UPDATE and DELETE (trigger + no grant). New tenant tables use `app_enable_tenant_rls` and join `tenantTables`. Error `messageKey`s exist in `messages/fr.json` and `messages/en.json`.

**Never:** No session or sign-in (entry 1.6): `run(ctx, input)` takes `ctx = { schoolId, actor }` from the caller. No Platform admin screens or Subscription commands (entry 1.7). No new npm dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Allowed write | Director runs `setModuleEnabled` fees off, new requestId | `ok: true`; `school_settings` updated; 1 Audit row (command, entity, changed fields) | none |
| No permission | Cashier runs it | `forbidden`; nothing written | result, no throw |
| Bad input | unknown module name | `invalid_input` with `field` | result |
| Module off | command declaring module `fees` while fees is off | `module_off`; nothing written | result |
| Suspended School | any `writes: true` command | `suspended`; reads still allowed | result |
| Repeat request | same requestId twice | second returns the first `data`; still 1 Audit row | none |
| Missing requestId | `writes: true` command without it | `invalid_input`, field `requestId` | result |
| Handler throws | unexpected error | transaction rolled back, no Audit row, error rethrown | thrown |
| Teacher scope | permission scoped `ownClasses`, resource class not in actor's classIds | `forbidden` | result |
| Audit tamper | app role UPDATE/DELETE on `audit_log` | rejected by Postgres | db error |
| Planted cross-module import | `fees/data` imported from outside `fees` | architecture test fails naming file and import | test failure |

</frozen-after-approval>

## Code Map

- `src/modules/core/data/with-school.ts` -- `withSchool(schoolId, fn, db?)`; reuse inside `run`.
- `src/modules/core/data/tenant-tables.ts` -- manifest; add the three new tables.
- `prisma/migrations/20261030120000_tenancy_baseline/migration.sql` -- `eskool_app`, `app_enable_tenant_rls(regclass)`; new migration calls it.
- `prisma/schema.prisma` -- only `School`; add `SchoolSettings`, `AuditLog`, `CommandRequest` with composite `(school_id, id)` style keys and FK to `schools`.
- `tests/db/tenancy.test.ts`, `tests/db/global-setup.ts` -- patterns for owner client, seeding through `withSchool`, cleanup; reuse.
- `src/modules/core/domain/language.ts` -- `parseLanguage` pattern for value lists.
- `messages/*.json` -- add `errors.*` keys; parity test already guards both catalogs.
- `src/modules/core/index.ts` -- public API; export `defineCommand`, `can`, roles/permissions types, `setModuleEnabled`.
- `eslint.config.mjs` -- AD-7 rule block; leave as is.

## Tasks & Acceptance

**Execution:**
- [x] `prisma/migrations/<ts>_commands_audit_settings/migration.sql` + `prisma/schema.prisma` -- `school_settings(school_id pk/fk, modules text[] default {fees,report_cards}, subscription_state text check trial|active|suspended default trial, updated_at)`, `audit_log(school_id, id, at, actor_kind user|system, actor_id, command, entity, entity_id, fields text[])` + trigger rejecting UPDATE/DELETE and revoke update, delete from `eskool_app`, `command_requests(school_id, command, request_id, result jsonb, created_at, pk(school_id, command, request_id))`; each through `app_enable_tenant_rls`.
- [x] `src/modules/core/data/tenant-tables.ts` -- list the three tables.
- [x] `prisma/ownership.ts` -- every Prisma model → owning module (`School` → platform, the three new → core).
- [x] `src/modules/core/domain/permissions.ts` (+ test) -- `ROLES` (promoter, director, cashier, teacher), `MODULES` (fees, report_cards, whatsapp), the matrix (permission → roles, scope `school` | `ownClasses`) covering addendum §A rows, `can(actor, permission, resource?)`.
- [x] `src/modules/core/data/audit.ts`, `src/modules/core/data/command-requests.ts`, `src/modules/core/data/school-settings.ts` -- data access used only by `defineCommand` and core commands.
- [x] `src/modules/core/application/define-command.ts` -- `defineCommand({ name, permission, module, writes, schema, handler })` returning `{ run(ctx, input) }` in the order above; handler gets `(tx, input, ctx)` and returns `{ data, audit: { entity, entityId, fields } }`.
- [x] `src/modules/core/application/set-module-enabled.ts` -- Director only, module `core` (always on), updates `school_settings.modules`.
- [x] `tests/architecture/boundaries.test.ts` + `src/modules/core/domain/architecture-rules.ts` -- pure scanners: cross-module deep imports (`modules/<x>/(domain|data|application)` from outside `<x>`), Prisma write calls (`.create(`, `.update(`, `.upsert(`, `.delete(`, `createMany`, `updateMany`, `deleteMany`, `$executeRaw`) outside `data/` under `src/`, schema models missing from `prisma/ownership.ts`; each scanner unit-tested on a planted fixture and run on the real tree. Include it in `npm run test`.
- [x] `tests/db/commands.test.ts` -- every matrix row except the architecture one, against Postgres as `eskool_app`.
- [x] `messages/fr.json`, `messages/en.json` -- `errors.forbidden`, `errors.module_off`, `errors.suspended`, `errors.invalid_input`.

**Acceptance Criteria:**
- Given the real tree, when `npm run check` runs, then the architecture tests pass; given a planted deep import in a fixture, then the scanner reports it.
- Given a fresh database, when `npm run test:db` runs, then the new migration applies and every command test passes, and `checkTenantTables` on the default manifest still reports only the test probe.

## Implementation Notes

- Migration `20261031120000_commands_audit_settings`. `audit_log` also rejects TRUNCATE and has an actor check (`user` needs `actor_id`, `system` has none).
- `school_settings` is created with SQL defaults on first read (`readSchoolSettings` upsert), so defaults live only in SQL.
- `run` checks the role before parsing input, then the `ownClasses` scope after parsing, through the optional `resource(input)`.
- `requestId` travels in `input`. A concurrent duplicate (P2002 on `command_requests`) re-reads and returns the stored result.
- WhatsApp needs Fees: enforced in `isModuleOn`, not by editing the modules list.
- Architecture scanners cover `src/` only; `tests/` reach into `core/data` on purpose.
- After review patches, on a fresh database: `npm run check` green (48 unit and architecture tests), `npm run test:db` green (29 tests). `npm run build` not run locally (host SWC cache issue, see 1.5); CI covers it.

## Plan Change Log

## Review Triage Log

Pass 1 (lenses: quick, database-reviewer, security-reviewer) — high 1, medium 7, low 4 patched; deferred 2; rejected 11.

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Unknown role like `constructor` resolves through prototype in `grants[role]` (security) | high | patch | Plain-object lookup returns a function; use own-key lookup. |
| Repeat requestId returns stored result to another actor or for different input (security, db) | medium | patch | Key lacks actor and input; store actor_id + input_hash, mismatch → invalid_input. |
| `isDuplicateRequest` treats any P2002 as a repeat (quick, db) | medium | patch | No target check; restrict to command_requests. |
| `readSchoolSettings` upsert on every command: writes on reads, race, row lock (quick, db, security) | medium | patch | Replace with insert … on conflict do nothing + select. |
| Read commands write Audit rows (quick, db) | medium | patch | writeAudit runs regardless of `writes`. |
| `setModuleEnabled` lost update; no-op audited and reorders list (quick, db, security) | medium | patch | Read-then-write without lock; lock row, skip no-op audit. |
| Write scanner flags `Map.delete`, `cookies().delete`, `createHash().update` (quick) | medium | patch | Regex not bound to Prisma receivers; 1.6 sign-out would fail it. |
| `marks.enter` lacks Subject scope (quick, security) | medium | patch | Addendum §A says own Classes and Subjects. |
| `IN_DATA_LAYER` exempts any `data/` folder (quick, security) | low | patch | Restrict to `src/modules/<m>/data/`. |
| Ownership check: prototype keys pass, stale entries unreported (quick, security) | low | patch | Use own keys; report stale entries. |
| No `(school_id, at)` index on audit_log (db) | low | patch | Cheap index for the Audit view. |
| AD-1 "data/ touches a model it does not own" check not built (quick) | medium | defer | Spine rule outside this plan's tasks; build with the first second-module table. |
| command_requests grows without retention (db) | low | defer | Purge rows older than N days once a cron exists (epic 7). |
| `system` actor buildable by any caller, full scope (security) | low | reject | Contexts are built server-side only; imports and cron need it; audited as system. |
| Handler gets raw tx (forge audit, set_config) (security) | low | reject | Handlers are trusted in-repo code; reviewed per command. |
| Denied attempts not audited (security) | low | reject | FR-55 audits changes and sign-in failures, not refused commands. |
| `ctx.schoolId` not validated in defineCommand (security) | false | reject | `withSchool` zod-validates the uuid before any SQL. |
| Guards before repeat check: retry after suspension errors (db) | low | reject | Order is the frozen intent. |
| audit_log FK blocks deleting a School / changing its id (db) | low | reject | Append-only audit is intended; ids never change; offboarding is anonymise (FR-57). |
| Check constraints/triggers invisible to Prisma (db) | low | reject | Expected for hand-written SQL; db tests guard them. |
| Cash session "own" and reprint folded into payments.record (security) | low | reject | Session ownership is a fees data check (epic 3). |
| Scanner misses require/template imports, multi-line calls, `$queryRaw` writes (security, quick) | low | reject | Regex guard is a tripwire; review covers the rest. |
| Session cleanup uses `session_replication_role` (security) | low | reject | Test-only, local superuser. |
| Schema vs migration drift (implementer worry) | false | reject | db reviewer compared column by column: no drift. |

## Design Notes

`ctx` is explicit until sign-in exists: entry 1.6 builds `{ schoolId, actor: { id, roles, classIds } }` from the session and Membership, so `defineCommand`'s signature does not change. A `system` actor (imports, cron) has every permission but is still audited.

Repeat detection runs inside the same transaction as the write, after the guards, keyed by `(school_id, command, request_id)`; a concurrent duplicate hits the primary key, the transaction rolls back, and `run` re-reads and returns the stored result.

## Verification

**Commands:**
- `npm run check` -- expected: lint, typecheck, unit and architecture tests green.
- `npm run db:up && npm run test:db` -- expected: all db tests pass.
