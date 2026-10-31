---
title: 'Staff sign-in, Memberships and school picker'
type: 'feature'
ticket: '6'
created: '2026-10-31'
status: 'built'
baseline_revision: '4b3f7950f980b7e4f7e870526fd6793d87747af5'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick', 'security-reviewer', 'database-reviewer']
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md', '{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent â€” do not modify unless human renegotiates">

## Intent

**Problem:** Nobody can sign in, so `defineCommand` gets its `CommandContext` from the caller instead of a session and Membership (FR-16, AD-13, AD-5).

**Approach:** better-auth 1.7.14 (email + password core, `nextCookies`) on Prisma 7 with global identity tables, a `platform` module that owns sign-in, lockout, `auth_events`, Memberships and the active School on the session, and `getCommandContext()` that builds the Actor from them.

## Boundaries & Constraints

**Always:** Identity tables, `memberships`, `auth_events` are global (no `school_id`, no RLS), listed in `tenant-tables.ts` and `prisma/ownership.ts` as `platform`, with explicit grants to `eskool_app`. One sign-in path: a server action â†’ `platform.signIn`; the better-auth HTTP catch-all route is NOT mounted, so lockout cannot be bypassed. Identifier = email (lowercased) or Cameroon phone normalised to `+237XXXXXXXXX`. Lock after 5 failures in 15 min per identifier (since last success); IP cap 20 failures / 15 min. Every attempt (success, failure, locked) and every sign-out writes `auth_events` with `identifier_hash` (sha256), `user_id` when known, IP â€” never the raw phone/email or password. Session: 30-day expiry, sliding (`updateAge` 1 day). Active School lives on the session row; set only when the User has a Membership there. A suspended School can still sign in. Scope IDs (classIds, subjectIds) come only from the Membership. Time windows computed in SQL (`now()`), not `Date` (AD-7 lint). FR/EN strings for every screen.

**Never:** No public sign-up, no OTP/SMS, no email sending, no parent sign-in, no user-management UI (Director creates users, resets passwords, assigns Roles in 1.7), no visual design beyond plain forms (Claude Design later), no change to `defineCommand`'s signature, no `@node-rs/argon2` (it was for the removed parent codes; better-auth's default scrypt hashes staff passwords).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Phone sign-in | `6 77 12 34 56` / `00237677123456` + right password | session cookie; `auth_events` success | none |
| Email sign-in | `Dir@School.cm` | matches `dir@school.cm` | none |
| Bad password Ã—5 | 5 failures within 15 min | 6th attempt (even correct password) â†’ `locked`, logged `locked` | generic `auth.locked` message |
| Lock expiry | 15 min after 5th failure | correct password signs in | none |
| Unknown identifier | no user | same `auth.invalid` message as wrong password; failure logged | no user enumeration |
| One Membership | sign-in | active School set, go to `/` | none |
| Two Memberships | sign-in | `/choose-school` lists both; pick sets active School | none |
| Forged pick | schoolId without Membership | refused, active School unchanged | `errors.forbidden` |
| No Membership | valid password | signed in, page says no School access | none |
| Context | session + active School | `CommandContext{schoolId, actor{user, roles, classIds, subjectIds}}` | no session/School â†’ `null` |
| Sign out all | from device A | all the User's sessions deleted; event logged | none |
| Expired session | `expires_at` past | treated as signed out | none |

</frozen-after-approval>

## Code Map

- `package.json` -- add `better-auth` `1.7.14` exact.
- `src/config.ts` -- add `BETTER_AUTH_SECRET` (min 32), `BETTER_AUTH_URL`; `.env.example`, README, `ci.yml` env.
- `prisma/schema.prisma`, `prisma/ownership.ts`, `src/modules/core/data/tenant-tables.ts` -- new global models.
- `prisma/migrations/20261101120000_identity_memberships/migration.sql` -- tables, grants, indexes.
- `src/modules/core/data/db.ts` -- reuse its Prisma client for the adapter.
- `src/modules/core/application/define-command.ts` -- `CommandContext` comment updated only.
- `tests/architecture/boundaries.test.ts` -- must stay green with the new module.

## Tasks & Acceptance

**Execution:**
- [ ] `prisma/schema.prisma` + migration -- `users` (email unique, `phone_number` unique nullable, name), `sessions` (+ `active_school_id` uuid null FK schools), `accounts`, `auth_verifications` (better-auth shapes, snake_case via `@map`), `memberships(user_id, school_id, roles text[] check âŠ† promoter/director/cashier/teacher, class_ids uuid[], subject_ids uuid[], unique(user_id, school_id))`, `auth_events(id, at, kind check, identifier_hash, user_id null, ip)` insert-only like `audit_log`; index `(identifier_hash, at desc)`, `(ip, at desc)`.
- [ ] `src/modules/platform/domain/identifier.ts` + test -- `normaliseIdentifier(raw)` â†’ `{kind: email|phone, value}` or `null`.
- [ ] `src/modules/platform/data/auth.ts` -- `betterAuth({ database: prismaAdapter, emailAndPassword: {enabled, disableSignUp}, session: {expiresIn 30d, updateAge 1d, additionalFields.activeSchoolId}, user.additionalFields.phoneNumber, plugins: [nextCookies()] })`.
- [ ] `src/modules/platform/data/auth-events.ts` -- `recordAuthEvent`, `isLocked(identifierHash, ip)` (SQL window).
- [ ] `src/modules/platform/data/memberships.ts` -- `listMemberships(userId)`, `findMembership(userId, schoolId)`, `setActiveSchool(sessionId, schoolId)`, `createStaffUser(...)` (hash via better-auth, insert user + credential account; used by tests and 1.7).
- [ ] `src/modules/platform/application/sign-in.ts` -- `signIn({identifier, password, ip, headers})`, `chooseSchool`, `signOut`, `signOutEverywhere`, `getCommandContext(headers)`.
- [ ] `src/modules/platform/index.ts` -- public API.
- [ ] `src/app/sign-in/{page.tsx,actions.ts}`, `src/app/choose-school/{page.tsx,actions.ts}`, `src/app/page.tsx` -- forms; home shows signed-in User, active School, sign out / sign out everywhere; redirect to `/sign-in` when no session.
- [ ] `messages/{fr,en}.json` -- `auth.*` keys.
- [ ] `tests/db/sign-in.test.ts` -- every matrix row against Postgres, plus two-School isolation: context for School A inside `withSchool` sees only A's `school_settings`.

**Acceptance Criteria:**
- Given a User with Memberships in two Schools, when they sign in and pick School B, then `getCommandContext` returns School B and a `withSchool` read sees no School A rows.
- Given `/api/auth/*`, when requested, then 404 (handler not mounted).

## Implementation Notes

## Plan Change Log

## Review Triage Log

| # | Finding (lens) | Severity | Route | Note |
|---|---|---|---|---|
| 1 | Unknown identifier skips hashing: timing reveals which accounts exist (security) | medium | patch | dummy `password.hash` on the miss path |
| 2 | Sign-out events written without IP; intent says every sign-out logs IP (quick) | low | patch | `clientIp()` helper in actions, passed to `signOut`/`signOutEverywhere` |
| 3 | `isLocked` comment and Design Notes misstate when a lock lifts (quick) | low | patch | comment and note corrected |
| 4 | `sessions.active_school_id` FK has no index (database) | low | patch | `@@index([activeSchoolId])` + migration line |
| 5 | platform imports `core` (types, `getDb`); spine says core -> platform, AGENTS.md says DB only from core/data (quick) | medium | defer | needs an architecture call and an AGENTS.md edit |
| 6 | `identifier_hash` is plain sha256; phones are brute-forceable, HMAC with a secret is stronger (security) | low | defer | intent pins sha256 |
| 7 | memberships has no UPDATE grant (database) | low | defer | 1.7 edits Roles and scope |
| 8 | auth_events insert-only trigger blocks a retention purge (database) | low | defer | decide with the first cron |
| 9 | `.env.example` lacks BETTER_AUTH_* (quick) | low | defer | file blocked by a deny rule; owner writes it |
| 10 | tenancy check trusts `manifest.global` without checking AD-2's fixed list (quick) | low | defer | harden when the next global table lands |
| 11 | XFF spoofable / null locally (security) | low | reject | Vercel edge sets XFF; null only on localhost |
| 12 | Attacker can lock a victim out (security) | low | reject | accepted by the intent (per-identifier lock) |
| 13 | Check-then-act race on the lock (security) | low | reject | a few extra tries at most; ponytail note in code |
| 14 | Lock counts per identifier, not per User (quick) | low | reject | matches intent wording |
| 15 | `/api/auth` 404 tested by proxy only (quick) | low | reject | no route file exists; test asserts it |
| 16 | `setActiveSchool` failure leaves session with no School (quick) | low | reject | picker recovers it |
| 17 | Fixed test phone number (quick) | low | reject | test reuses it via findUnique, idempotent |

## Design Notes

Phone sign-in without the phoneNumber plugin: `platform.signIn` resolves a phone to its User's email, then calls `auth.api.signInEmail`. Users without an email get `<+237â€¦>@staff.invalid` (`.invalid` is reserved, never deliverable). One code path, no OTP sender stub.

Lockout lives in our action because better-auth's `rateLimit` counts HTTP requests per IP, not failures per account, and does not apply to `auth.api` calls. Locked attempts are logged as `locked`, not `failure`, so a lock lifts once fewer than 5 failures remain in the last 15 min.

Before writing Next code, read the Next 16 authentication / server-actions guides (`node_modules/next/dist/docs/`, or context7 `/vercel/next.js`).

## Verification

**Commands:**
- `npm run check` -- expected: lint, typecheck, unit tests green.
- `docker compose down -v; npm run db:up; npm run test:db` -- expected: all DB tests green incl. `sign-in.test.ts`.
- `npm run build` -- expected: success (host SWC cache issue known; CI settles it).

**Manual checks (if no CLI):**
- `npm run dev`: sign in by phone, pick a School, sign out everywhere from a second browser.
