# Rubric review: architecture-eskool-erp.md (draft, 2026-10-29)

Checklist: fixes real divergence points / every AD Rule enforceable / Deferred cannot cause divergence / covers PRD / altitude dimensions decided, deferred or open (deployment, infra, operations, security, data protection).

**Verdict: REVISE before tickets.** Strong skeleton (11 of 12 ADs are real divergence points, PRD map is complete). But the tenant model has an unspecified pre-tenant path, cross-module writes contradict the dependency graph, and several ADs are convention-only. Operations and data protection are thin.

Counts: critical 2, high 12, medium 10, low 4.

---

## Critical

**C1. Pre-tenant access paths are undefined (AD-2, AD-10, FR-2, FR-16, FR-17, FR-55).**
AD-2 forces RLS on every tenant table with no `app.school_id` outside `withSchool`. Yet these run before any school is known: staff sign-in, Parent sign-in (phone + code; one phone can be a Guardian in School A and staff in School B, codes are per Guardian), the public `/v/[code]` lookup, failed sign-in audit rows (FR-55, no school_id yet), platform admin support access (FR-2), and School creation (inserts school-scoped rows for a new school). Each implementer will solve this differently, most likely with a BYPASSRLS role, which voids AD-2.
Fix: add AD-13 "Pre-tenant lookups". Define a small set of `SECURITY DEFINER` functions owned by a separate DB role (`resolve_login(identifier)`, `resolve_verification(code)`, `create_school(...)`), the only code allowed to cross tenants. Decide identity: global `identity` table (platform-level, no school_id) plus `membership(identity_id, school_id, role)`; a session carries one active `school_id`. Failed sign-ins audit to a platform-level auth log, not the tenant Audit log. Support access = time-boxed grant row written by School admin, checked inside `withSchool`.

**C2. Cross-module write orchestration is undefined (AD-1 vs AD-3; FR-11, FR-12, FR-20, FR-21).**
Enrolment lives in `core`, Charges in `fees`, and `fees -> core` only. FR-20 says Charges are created when a Pupil is enrolled; promotion, import (Pupils + opening balances + Charges), sibling Discount auto-apply and "leave" all span both. AD-3 says a server action calls exactly one command in one transaction. Nothing says who calls whom, so each ticket will invent hooks, events or direct imports.
Fix: add to AD-3: commands accept an optional `tx` and compose inside one `withSchool`; orchestrating commands live in the downstream module (`fees.enrolPupil`, `fees.promoteClass`, `fees.importOpeningBalances` call `core` commands with the same `tx`). Core never calls fees. List which orchestrating command owns each of FR-11/12/20/21. No event bus.

---

## High

**H1. AD-12 contradicts AD-1/AD-2.** `requireModule` / `requireWritable` read Module switches and Subscription state, which AD-2 puts in platform-only tables, but `fees`/`academics`/`portal` may not import `platform` (diagram). Fix: store per-School `modules` and `subscription_state` in a tenant table in `core` (written via a core command that `platform` calls), and put both guards in `core`. Also cover queries (FR-3: pages return "not available"), not only commands.

**H2. AD-1 does not prevent its stated divergence.** `withSchool` hands every module the full Prisma `tx`, so `fees/data` can read `tx.pupil` freely; "no Prisma write outside data/" says nothing about reads of another module's tables. Fix: a table-ownership map (`model -> module`) enforced by a lint/CI test that scans each module's `data/` for `tx.<model>` of other modules; cross-module reads only via the owner's `index.ts` queries or declared read-only SQL views (dashboard by class needs this).

**H3. AD-3, AD-5, AD-12 are convention-only.** "Every command starts with requirePermission", validates zod, opens `withSchool`, writes audit, calls `requireModule`/`requireWritable`: nothing fails when a developer forgets one. Fix: a single `defineCommand({name, permission, module, writes, schema, handler})` factory in `core` that performs all steps in fixed order and is the only way to export a command; CI test enumerates registered commands and fails if one lacks permission/audit. Same for queries returning Balances/Evaluations (`defineQuery`).

**H4. AD-5 matrix has no row-level scope.** Teacher sees "own Classes" only, Parent "own Family", Promoter read-only, Secretary "propose" Discount. A capability matrix cannot express these, so each query will filter differently (IDOR risk). Fix: extend AD-5: matrix entries carry a scope (`school | ownClasses | ownFamily`); scope IDs always come from the session (teacher assignments, guardian->family), never from request input; one `scopeFilter(session, entity)` helper; test per scoped query.

**H5. No AD for authentication and session security (§5.3, FR-16, FR-17).** better-auth is email/password oriented; PRD needs phone-or-email staff login, Guardian phone+code, 5-attempt/15-min lockout, 30-day idle expiry, sign-out all devices, rate limiting, hashed codes. Rate-limit state on serverless (Vercel) cannot live in memory. Short printed Parent codes are brute-forceable. Fix: add AD "Identity and sessions": which library owns what (better-auth plugin for phone vs custom Guardian credential), code length/entropy and one-way hash, rate-limit and lockout counters in Postgres keyed by identifier + IP, cookie flags, session TTL, reset flows, and rate limiting on `/v/[code]`.

**H6. Issued Report cards are not stable (AD-6 vs AD-9, FR-44, FR-47).** Results are computed live from Evaluations and template code. After sign-off, a template code change, a coefficient/Subject edit or a reopened Evaluation silently changes a printed card, while its QR still says "valid". Fix: at sign-off/issue, store a snapshot of `computeResults` output plus `template_version` (insert-only row); PDFs and portal render from the snapshot; reissue creates a new snapshot and revokes the old code. Evaluation lock after sign-off must also be enforced in the upsert command (AD-11 currently ignores it; queued offline writes must be rejected with a clear error code).

**H7. Batch work vs serverless with "no jobs" (FR-46, FR-56, FR-11, AD-6).** 350 Report cards in under 5 minutes, unlimited Excel exports and large imports run inside Vercel function limits; `@react-pdf/renderer` is CPU-heavy. No decision on how. Fix: decide explicitly: per-card generation endpoint driven by the client loop and merged/zipped client-side or streamed; exports streamed in chunks; imports parsed in chunks with the staging place for the preview stated. Or accept one minimal job runner and amend AD-6. State function max duration/memory assumed.

**H8. File storage has no security rules (FR-1, FR-9, FR-28, FR-37; deployment diagram).** Pupil photos (minors), moratoire documents, Baseline source files, logos and stamps go to "object storage" with no rule. Units will pick public URLs vs signed URLs differently. Fix: add AD: private bucket, keys prefixed `school_id/`, access only through server-issued short-lived signed URLs after a permission check, allowed types/size limits, no PII in object names, metadata row in a tenant table.

**H9. Money model gaps that change totals (AD-4, AD-6, FR-23, FR-30, FR-36, §7).** Not decided: (a) how a payment maps to Moratoire Instalments (ERD allocates only to Charge; "partial payment reduces the current Instalment" needs a rule); (b) how credit from overpayment is consumed (derived on read, or Allocation rows created when new Charges appear); (c) Charge stored gross with Discount rows, or net (FR-36 vs §7 need gross and discount timestamps); (d) Void representation; (e) opening balances (Payment without Cash session? Allocation without Payment?); (f) rounding when a percentage Discount or Instalment split is not integer. Fix: add AD-4b "Money model" with one worked example each, and make `fees/domain` the only place implementing them; Void as a separate insert-only `payment_voids` row (removes the "update void fields once" trigger edge case).

**H10. AD-4 insert-only conflicts with FR-57 and FR-58.** Audit `before/after` JSON contains names and phones, but FR-57 anonymisation must keep the Audit log intact and remove them, and the UPDATE-rejecting trigger forbids both scrubbing and per-School restore (copying rows back, correcting counters). Fix: Audit rows store ids and changed field names, not PII values (or encrypted PII with a per-Family key destroyed on anonymisation); define a documented restore/anonymise path (a dedicated DB role plus `SET LOCAL app.maintenance`, logged) that the triggers recognise. Also revoke UPDATE/DELETE grants on append-only tables, not only triggers.

**H11. No idempotency for money commands (§5.1, FR-22, AD-3).** Unstable 3G makes double submits likely; two taps create two Receipts with two sequential numbers (cash has no reference, so FR-22's duplicate warning does not catch it). Only Evaluations (AD-11) are idempotent. Fix: Command convention: every state-changing command takes a client-generated `requestId` (uuid) stored with a unique `(school_id, request_id)` constraint; replay returns the original result. Mandatory for recordPayment, voidPayment, decideMoratoire, signOffTerm.

**H12. Operations and observability not decided, deferred or open (§5.5, FR-58).** Only "structured JSON to stdout" exists. Missing: error tracking, uptime/alerting for the 99.5% school-hours target, who is paged (solo dev), release rollback, secrets management, environment promotion, support-access procedure, backup retention (30 days, FR-58, is not in the Deferred provider constraints; only "daily + PITR"), restore rehearsal owner/date, incident runbook. Fix: add an "Operations" subsection: chosen or explicitly deferred with an owner and date; provider constraints must include 30-day retention, pooling compatibility (H-medium M3) and EU/Africa residency pending advice.

---

## Medium

**M1. AD-2 test is per table, by hand.** Easy to forget on a new table. Fix: a catalog test that fails if any `public` table with `school_id` lacks RLS enabled + forced + a policy, or any table without `school_id` is not on an allowlist. Also make the app role's grants explicit (SELECT/INSERT only on append-only tables).

**M2. Platform tables "reachable only from platform" (AD-2) are not DB-enforced.** Fix: separate schema `platform` with grants only to a platform role path, or the SECURITY DEFINER set from C1.

**M3. Connection pooling not decided.** `set_config(..., true)` is safe only with transaction-scoped use; serverless plus Prisma needs a pooler (PgBouncer transaction mode) and `adapter-pg` pool size. Fix: state it in Deployment and as a provider constraint; add an RLS test that runs through the pooler in preview.

**M4. AD-7 gaps.** Prisma maps `date` to JS `Date` (UTC midnight), the classic off-by-one; SQL `CURRENT_DATE`/`now()::date` use the DB timezone; the lint rule only covers TS. Fix: represent business dates as `'YYYY-MM-DD'` strings via a custom mapping/branded type; ban `CURRENT_DATE` in SQL in favour of a passed `as_of` parameter or `app_today()`; set DB timezone UTC.

**M5. Concurrency and isolation unspecified.** The receipt-counter lock serialises payments incidentally, but Voids, Discounts, Moratoire decisions and Charge creation also alter what Allocation can use. Fix: state isolation level (READ COMMITTED + explicit lock) and take a per-Family `FOR UPDATE` (or advisory lock) first in every command touching Charges/Allocations/Discounts/Instalments, fixed lock order (family, then counter).

**M6. Cash lock rules have no enforcing location (FR-34, FR-35).** "No cash Payment without open session" and "no Payment dated on or before last closing" appear in no AD. Fix: put them in `recordPayment` plus a DB check/trigger; add to AD-4 and the money test list.

**M7. AD-11 edge cases.** Offline queue holds marks in `localStorage` (shared phones, not cleared on sign-out); last-write-wins across devices; stale replays after sign-off (H6). Fix: queue per user id, purge on sign-out, send `baseVersion` and reject stale writes, show per-cell error codes.

**M8. AD-10 scope.** Receipt Verification codes exist (FR-24) but FR-47 lists only Report card fields and AD-1 assigns the code table only to `academics`. Pupil name is minors' data on a public page. Fix: one `verification_codes` table in `core` with `document_type`; per-type public field list; rate limit and `noindex`; decide whether Pupil name is shown or initials.

**M9. Stack gaps.** No library for Excel read/write (FR-11, FR-56), phone validation (+237, FR-9), object storage SDK, rate limiting, ESLint boundary plugin. Fix: add rows (e.g. exceljs or similar, libphonenumber-js) or mark as chosen at the first ticket. Pinned versions (Next 16.4.3, React 19.3.1, Vitest 5.0.5, Prisma 7.10.x) look unverified: state "verified against npm on <date>" or lock via lockfile.

**M10. Data protection mapped only to technique (Law 2024/017, PRD §9).** Region is "EU, pending advice", and cross-border transfer of minors' data may need authorisation. Backups outlive anonymisation (30 days). Fix: add open question with owner: residency decision, processor contract, retention periods, erasure-in-backups statement; add TLS/at-rest encryption as provider constraints.

---

## Low

**L1.** ERD omits entities the ADs rely on: User/Identity/Membership, Staff, Audit log, Verification code, Reminder, Baseline, Consent, Cash closing, Fee plan to Level link, Subject/Competency. Add names and links.

**L2.** Index convention missing: lead every tenant index with `school_id`; FK indexes.

**L3.** Deferred "UI component kit" can diverge on §5.1 (16 px, 44 px, forms keep values). Bind a shared `src/ui` primitives folder carrying those constraints, even before visual design.

**L4.** Preview environments: say that preview/CI databases use synthetic seed data only (never a production copy), and which role runs `prisma migrate deploy` vs the app role (owner vs non-BYPASSRLS, needed for FORCE RLS).

---

## Checklist summary

| Item | Result |
| --- | --- |
| Real divergence points fixed | Mostly; missing: pre-tenant paths (C1), cross-module orchestration (C2), money model (H9), idempotency (H11), file storage (H8), auth (H5) |
| AD Rules enforceable | AD-1, AD-3, AD-5, AD-12 not as written (H2, H3, H4); AD-2 weak (M1); AD-4/AD-6/AD-9 conflict with PRD (H6, H10) |
| Deferred safe | Hosting providers deferred without pooling, retention, residency constraints (H12, M3, M10); UI kit low risk (L3) |
| PRD coverage | All FR-1..58 mapped; FR-46, FR-56, FR-57, FR-58 mapped but not feasible as designed (H7, H10) |
| Altitude dimensions | Deployment partial, infra partial, operations missing (H12), security partial (H5, H8), data protection partial (M10) |
