# Adversary review: architecture-eskool-erp spine (AD-1..AD-12)

Method: for each hole, two units one level down (tickets by different agents) that both obey every AD literally yet build incompatibly. Each hole ends with a proposed new or tightened rule. Severity: critical = cross-tenant leak or unbuildable; high = money/result wrong or silent divergence; medium = rework; low = polish.

## Critical

### H1. Auth tables vs RLS: sign-in has no school context (critical)
- Unit A (auth ticket): puts better-auth `user/session/account` in `core` with `school_id` + RLS (AD-2). Sign-in by phone then cannot find the user, because `app.school_id` is unknown before login; better-auth also uses its own pool outside `withSchool`.
- Unit B (portal/users ticket): treats auth tables as platform-level (no RLS, "platform users"), and stores roles on the same row. A teacher who is also a parent (same phone, same school) gets one identity in A, two in B; a Promoter of two schools is impossible in A.
- Why ADs allow it: AD-2 lists only `schools`, `subscriptions`, platform users as non-tenant; staff, Guardians and Parents are not placed.
- Rule AD-13 (Identity): auth tables (`auth_user`, session, credential, rate-limit) are non-tenant and readable only by `core/auth`. Tenant side holds `membership(school_id, auth_user_id, kind staff|guardian, roles[])` with RLS. The session carries `memberships[]` and one active `school_id`; `withSchool` takes `school_id` only from the session, never from input. A phone maps to exactly one `auth_user`; staff password and Parent code are two credentials on that user. A test signs in across two schools.

### H2. `/v/[code]` verification lookup has no school (critical)
- Unit A: queries `verification_codes` under a privileged connection that bypasses RLS (violates AD-2's no-BYPASSRLS).
- Unit B: loops every school with `withSchool` to find the code (leaks timing, O(schools)), or makes `code` unique only per school so the lookup is ambiguous.
- Also: the glossary says Receipts carry a Verification code; AD-10/FR-47 define fields only for Report cards, so Unit A shows Receipt amount and Balance, Unit B shows nothing.
- Rule (tighten AD-10): one global `verification_code(code PK, school_id, doc_type, doc_id, status)` table, non-tenant, reachable only through a SECURITY DEFINER function that returns a fixed field list per `doc_type` (report card: FR-47 list; receipt: school, number, date, valid/void, no amount, no pupil, no Balance), then switches to `withSchool`. Rate-limit the route. Codes are globally unique.

### H3. Parent users span families; row scope missing from AD-5 (critical)
- Unit A (portal overview): scopes by the Guardian's `family_id` taken from the session at sign-in.
- Unit B (receipts/report cards): scopes by Pupils reachable from `guardian_id`. Divorced parents, a Guardian linked to two Families, or a Pupil moved between Families make A and B show different children; B can show a Pupil whose Family the Guardian no longer belongs to.
- Also Teacher "own classes" is data, not a role: AD-5 maps Role to permission only, so one ticket checks class assignment in the command and another only in the UI.
- Rule (tighten AD-5): permission check is `can(session, permission, resource)`. The matrix declares a scope per permission: `school | own_classes | own_family_set`. The session holds `familyIds[]` resolved once at sign-in by one `core` function. Every portal query takes `familyIds` from the session only. Tests: Guardian of Family X cannot read Family Y by id for each portal query.

### H4. Platform admin and support access (critical)
- Unit A (`platform.grantSupport`): admin enters a school via `withSchool(grantedId)` with a platform session, and audit `user_id` points to a platform user that does not exist in the school's `membership` (FK fails, or `user_id` made nullable).
- Unit B: gives the platform admin role a `BYPASSRLS` connection "for support". AD-2 says platform tables reach only from `platform`, but nothing says how `platform` ever reads tenant rows (counts for Subscription, the trial, creating the first admin).
- Rule AD-14: platform code touches tenant data only through `withSchool` with a `support_grant(school_id, platform_user_id, expires_at, scope read-only)` verified inside the transaction; support sessions are read-only and write an Audit row with `actor_kind='platform'`. `platform.createSchool` uses a named bootstrap command that runs `withSchool(newId)`. No second DB role exists.

### H5. Cross-module workflows have no legal home (critical)
- Case: enrol a Pupil creates Charges (FR-20); promotion (FR-12); import creates Pupils and opening Balances (FR-11); createSchool creates a User.
- Unit A (`core.enrolPupil`): imports `fees.createCharges` (breaks the diagram: `fees -> core` only, a cycle).
- Unit B: `fees` creates Charges lazily on first read (a write inside a query, no Audit row), or the server action calls two commands (breaks AD-3 "exactly one command", two transactions, half-enrolled pupil).
- Rule AD-15 (Workflows): a use case spanning modules lives in `src/app/workflows/*` (or a `workflows` layer above the modules), is itself one named command with one `withSchool` transaction, and calls module commands that accept the shared `tx`. Modules never call upward. Charge creation is a fees command invoked by the `enrolPupil` workflow, never on read.

## High

### H6. Charge net vs gross; waiver; Discount double subtraction (high)
- Glossary: Charge is "after Discounts", yet ERD has Discount as a child of Charge, and §7 needs "Charges before Discounts granted after the due date".
- Unit A (charges ticket): stores net `amount`, writes a Discount row for the audit. Unit B (balance query ticket): stores gross, subtracts `sum(discounts)`. Dashboard B double-subtracts or A and B disagree on the denominator of the Collection rate.
- Waiver (FR-20) can be a skipped Charge in A, a 100% Discount in B (pollutes "Discounts granted").
- Rule (tighten AD-4/AD-6): Charge stores gross `amount_gross`, immutable; Discount rows carry `granted_on`. `net(charge, asOf)` is one function in `fees/domain`. A waiver is `waived_on + reason` on the Charge, with a stated denominator rule (excluded from the Collection rate, shown separately). The Collection rate denominator is defined once with its §7 variant as a parameter.

### H7. Balance has several implementations; Void and credit (high)
- AD-6 allows a "pure domain function fed by SQL aggregates", so family account (TS) and dashboard/term report/export (SQL `SUM`) are separately written.
- Unit A `voidPayment`: sets `void_on`; Balance excludes Allocations of void Payments. Unit B (dashboard) sums Allocations without joining the Payment's void state.
- Credit (FR-23): A creates Allocations to future Charges when they appear (a hidden mutation path run by `createCharges`); B computes credit as `payment - sum(allocations)` on read.
- Rule (tighten AD-6/AD-3): a single `fees` module `ledger` (SQL view `charge_ledger` or one query) is the only source of Balance, Due status, rates; dashboard, portal, term report, export and statement all read it. Allocations exist only for Charges that exist at recording time; credit is computed on read and consumed by the same read function, never materialised. A golden dataset test asserts equal totals across all surfaces (FR-26, FR-38, FR-40, FR-56).

### H8. "As of a date" is undefined (high)
- Needed for Checkpoint comparison, Term report "at the report date", Cash closing locks.
- Unit A filters Payments by business date `paid_on`; Unit B by `recorded_at` (timestamptz converted to Douala). Voids made after the Checkpoint: A excludes the Payment from the past figure, B includes it.
- Rule (tighten AD-7): every derived function takes `asOf: DoualaDate`; a Payment counts if `paid_on <= asOf` and not voided with `void_on <= asOf`; Discounts count if `granted_on <= asOf`. Back-dating a Payment is forbidden beyond the last Cash closing (FR-35) and `paid_on` is set by the server, not typed, except by a named permission.

### H9. Cash closing: computed or snapshot (high)
- AD-6 says derived at read time; AD-4 says closings are insert-only. A later Void changes "expected cash" if recomputed, rewriting a past Cash gap the Promoter saw.
- Unit A stores `expected, counted, gap` at closing. Unit B stores only `counted` and recomputes expected live. Voids "as adjustment on the next closing": A selects by `void_on > last_closing.at`, B by the voided Payment's session.
- Also non-cash Payments: ERD links all Payments to a session, FR-34 says cash only.
- Rule (tighten AD-6): a closing row snapshots opening, cash in, paid out, expected, counted, gap (facts). Voids belong to the next closing by `void_on`. `payment.cash_session_id` is required for cash and null for others; non-cash appear in the closing list by date and cashier.

### H10. Payment retry creates duplicate money (high)
- AD-11 makes only Evaluations idempotent. `useCommand` on 3G (a 5.1 requirement) retries or users double-tap.
- Unit A: `recordPayment` has no key (two Payments, two Receipt numbers). Unit B: dedupes by Mobile Money reference only, so cash retries still duplicate.
- Rule (tighten AD-3): every command that creates money or a numbered document takes a client-generated `idempotency_key`, stored with `unique(school_id, command, key)`; a repeat returns the original result. `useCommand` generates it once per form open.

### H11. Report card: snapshot or live (high)
- AD-9 ensures one `computeResults`, but not when it runs.
- Unit A: stores a snapshot at sign-off (results, template version, PDF). Unit B: renders from live Evaluations on every print/portal view. Director reopens a Term (FR-44), edits a mark: B silently changes cards already sent to parents; a template code change alters old cards' averages in B.
- Verification "replaced" status has no data to point to in B.
- Rule (tighten AD-9/AD-10): issuing a Report card inserts an immutable `report_card(results_json, template_id@version, language, issued_at)`; reissue inserts a new row and sets the old code `replaced`. Portal, QR page and PDF read the issued row only. Templates are versioned and old versions stay in the repo.

### H12. AD-1 vs AD-6: cross-module SQL (high)
- Dashboard "by Class" and Family search need Enrolment/Class/Family data in `fees` aggregates.
- Unit A: `fees/data` joins `enrolments`, `classes` directly via Prisma relations (the ERD already links them; Prisma generates one shared client). Unit B: calls `core` queries per row (N+1, 350 pupils x 3 tranches on 3G).
- Rule (tighten AD-1): modules may read another module's data in SQL only through read-only views published in that module's public API (`core.v_enrolment_class`, `core.v_family_payer`), listed in the module's `index.ts`. The lint rule also bans importing generated Prisma model types across modules except those views.

### H13. Conditional permissions inside commands (high)
- Rules: Bursar approves Moratoire "if the School allows"; amount threshold above which only the Director; Promoter may Void "if the School allows"; multi-Role Users; no self-approval.
- `requirePermission(session, permission)` has no resource or settings. Unit A puts the threshold in `application/` code; Unit B in `domain/` of another command; UI hides different buttons.
- Rule (tighten AD-5): the matrix returns `allow | allow_if(setting) | allow_if(predicate)`; predicates are named pure functions in `permissions.ts` (`moratoireApprovable(rules, request, role)`). Session carries the union of Roles. Separation of duties listed: a Payment recorder cannot approve its own Void; a request creator cannot decide it.

### H14. Audit log: ownership, PII, anonymise (high)
- `audit` is `core`'s table; `fees` commands must write it in the same transaction (AD-3).
- Unit A: `fees` inserts into `audit` through the shared Prisma client (breaks AD-1). Unit B: calls `core.audit.record(tx, ...)`.
- FR-57 conflict: Audit `before/after` hold names and phones, the Audit table is append-only (AD-4 trigger), but anonymise must remove names yet keep Audit intact. Unit A mutates audit (trigger blocks); Unit B leaves PII there.
- Rule: only `core.audit.record(tx, entry)` writes the Audit log; entries store field diffs with PII fields replaced by references (`pupil_id`), never raw names/phones/photos. Actor is `{kind: user|guardian|system|platform, id}` so system actions (sibling Discount, import, auto-charge) have a legal author.

### H15. Evaluation upsert vs lock, stale queue, NULL key (high)
- AD-11 key is `(Enrolment, Subject or Competency, period)`.
- Unit A: two nullable columns in one unique index; Postgres treats NULLs as distinct, so duplicates appear. Unit B: single `target_id` polymorphic column with no FK.
- The upsert command does not state it checks sign-off (FR-44) or "complete" flags; an offline queue replayed after Director reopen and re-edit overwrites newer values (last write wins, no version).
- Rule (tighten AD-11): the table has `subject_id` and `competency_id` with a CHECK that exactly one is set and two partial unique indexes; the upsert carries `expected_version` (or `read_at`) and refuses stale writes and writes into a signed-off Term; the queue shows conflicts instead of overwriting. Teacher scope is checked per (Class, Subject) assignment.

### H16. Object storage outside RLS (high)
- Logos, stamps, document photos (Moratoire documents, Baseline source files) live in blob storage; AD-2 covers the DB only.
- Unit A: public bucket URLs with random names. Unit B: keys without `school_id`, served by a route that checks only that the user is signed in.
- Rule AD-16: object key = `{school_id}/{kind}/{uuid}`; no public URLs; every read goes through a route handler that resolves the owning row under `withSchool` and checks permission; portal Guardians see only files of their `familyIds`.

## Medium

### H17. No manifest of tenant tables (medium)
- Exports (FR-56), per-School restore (FR-58), anonymise (FR-57) and the RLS test (AD-2) each enumerate tables. Unit A adds `moratoire_documents`, forgets restore and export; Unit B adds `reminders` to export, forgets RLS. Non-tenant tables beyond the three listed also appear (default curriculum FR-8, national calendar FR-5, better-auth, verification codes, rate limits).
- Rule: one `tenant-tables.ts` manifest (table, restore order, export mapping, PII columns, immutable yes/no) plus the explicit non-tenant list with their readers; CI fails if a table in `schema.prisma` is in neither. The restore script reads the manifest and temporarily disables immutability triggers only for the scratch-copy path.

### H18. RLS policy shape and cross-school FKs (medium)
- `current_setting('app.school_id')::uuid` errors when unset and on a pooled connection returns empty string after the first local `set_config`, so `''::uuid` throws or, if Unit B writes `NULLIF`, silently returns zero rows. Each ticket writes its own policy text.
- A UUID FK does not stop `allocation.charge_id` pointing to another School's Charge (FK checks bypass RLS).
- Rule (tighten AD-2): policies are generated by one SQL helper `enable_tenant_rls(table)` using `current_setting('app.school_id', true)` with `NULLIF`; unset means no rows. Child tables use composite FKs `(school_id, parent_id)`.

### H19. Module switch and suspension scope (medium)
- AD-12: `requireModule` on "commands of fees, academics, portal", `requireWritable` on "every write command".
- Portal command `requestMoratoire` is a portal command that calls `fees` command: Unit A checks `portal` only (works with Fees off), Unit B checks both. FR-4 forbids new Payments and Evaluations on suspension; Unit A blocks all writes, including `core` pupil edits and Void, Unit B only the two named.
- Queries of a switched-off Module are unchecked (portal could still show Balances).
- Rule: a Module dependency table (portal needs fees/academics per screen); `requireModule` is declared on the owning module's commands and queries; a write-class table (`blocked_when_suspended`, `allowed_when_suspended` such as Void, export, sign-in) lives in one file.

### H20. Counters and numbering (medium)
- Receipt number, School matricule, Verification codes: Unit A (fees) builds `receipt_counters`; Unit B (core) builds `matricule_seq`; locking and gap rules differ. Imports allocate matricules for 348 pupils inside one transaction while payments queue behind the same row if shared.
- Rule: `core.nextNumber(tx, schoolId, key)` over one `counters(school_id, key, value)` table; per-key lock; Receipt numbers allocated only by `recordPayment`; opening balances at import (FR-11) are a separate fact type `opening_credit` with no Receipt number and no Cash session, read by the single ledger (H7).

### H21. Settings used by derived state change history (medium)
- Moratoire "Broken after N days", Reminder schedule, Checkpoint offset, Moratoire rules are School settings read by computed state (AD-6).
- Unit A reads current settings; Unit B copies them onto the Moratoire at approval. Changing N from 7 to 14 flips old Moratoires from Broken to Active in A, rewrites past Collection rates.
- "Reminder sent" fact has no key: A keys by (Family, date), B by (Family, Tranche, offset); the list re-shows or hides rows differently.
- Rule: rules that affect derived status are snapshotted on the object they govern (`moratoire.rules_snapshot`, `tranche.checkpoint_on`), and Reminder facts carry `trigger_key = (kind, tranche_id|instalment_id, offset)`.

## Low

### H22. Document Language and Family contact (low)
- FR-54: "Guardian's Language" with several Guardians per Family. Unit A uses the payer contact, Unit B the first Guardian.
- Rule: `core.documentLanguage(family)` = payer contact's Language, the only source; Report cards use the Subsystem Language.

### H23. Second-order checks missing from tests (low)
- AD-2 test covers "School B rows invisible", not the other direction: no test that a command given another School's id in input (e.g. `chargeId`) fails.
- Rule: each command test includes a foreign-id case; ids in input are always re-resolved under RLS.
