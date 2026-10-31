- source_plan: `_bmad-output/initiative-eskool-erp/epic-platform-baseline/story-archive-the-old-code-and-deploy-a-new-scaffold-end-to-end-plan.md`
  summary: Add a shared structured logger before modules copy ad-hoc console.error JSON.
  evidence: db.ts logs hand-built JSON; settle in entry 1.4 (defineCommand) when the second log site appears.
- source_plan: `_bmad-output/initiative-eskool-erp/change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md`
  summary: Parent portal and parent sign-in (former epic 6, FR-17, FR-49 to FR-52).
  evidence: removed from the MVP 2026-10-30; parents get paper receipts and WhatsApp messages instead.
- source_plan: same change proposal
  summary: Mobile Money and bank Payments, recorded only by the Director after checking the statement.
  evidence: pilot parents pay cash; Odoo/bank pattern keeps the cashier away from transfers.
- source_plan: same change proposal
  summary: Full school calendar (holidays, events, exam windows) with a read-only iCal feed for Google Calendar and Outlook.
  evidence: Toddle and Veracross publish one-way subscribable feeds; MVP only shows key dates (FR-5).
- source_plan: same change proposal
  summary: Exam management: timetables, rooms and seating, invigilation rosters, question papers drafted by teachers with a marking scheme, reviewed and approved, then printed; marking scheme could feed the mark grid.
  evidence: OpenEduCat exam module and Academia ERP cover these; no approval workflow found in their docs; university moderation chains (UTS, Essex).
- source_plan: same change proposal
  summary: Teams and Google Classroom roster sync.
  evidence: Microsoft School Data Sync reads SIS rosters through OneRoster or CSV; Google Classroom needs a third-party sync.
- source_plan: same change proposal
  summary: Competency-grid report cards (A / ECA / NA) for francophone primary; Secretary role; nursery levels.
  evidence: standard mark-based template chosen for the MVP; revisit when a school asks.
- source_plan: `_bmad-output/initiative-eskool-erp/epic-platform-baseline/spike-prove-rls-with-set-config-under-prisma-7-plan.md`
  summary: Restrict the global `schools` table at the database level (separate platform role or policy) so the app role cannot list or update every School.
  evidence: migration grants select/insert/update on schools to eskool_app with no RLS; AD-2 relies on code (platform module only). Decide with entry 1.7 (Platform admin creates Schools).
- source_plan: `_bmad-output/initiative-eskool-erp/epic-platform-baseline/story-clock-language-and-formatting-foundations-plan.md`
  summary: Verify `npm run build` and the language switch (EN/FR, reload keeps it) in a running app.
  evidence: this Windows host's SWC native cache rejects every folder (BUILTIN\Users full control), so build and dev cannot start locally; CI build on first push, or a host permission fix, settles it.
- source_plan: `_bmad-output/initiative-eskool-erp/epic-platform-baseline/story-definecommand-audit-permissions-and-module-guards-plan.md`
  summary: Build the AD-1 check that a module's data/ only touches Prisma models it owns (prisma/ownership.ts).
  evidence: 1.4 only checks that every model has an owner; build it when the first non-core module adds a table (epic 2 or 3).
- source_plan: same plan
  summary: Purge old command_requests rows (retention, e.g. 30 days).
  evidence: idempotency rows grow without bound; add when the first cron lands (epic 7).
- source_plan: `_bmad-output/initiative-eskool-erp/epic-platform-baseline/story-staff-sign-in-memberships-and-school-picker-plan.md`
  summary: Settle the core/platform import direction: platform/data imports `getDb` and types from `core`, against the spine (core -> platform) and AGENTS.md (DB only from core/data).
  evidence: `src/modules/platform/data/*.ts`, `application/sign-in.ts` import from `../../core`; fix is either an AGENTS.md policy edit or moving db.ts and shared types into platform.
- source_plan: same plan
  summary: HMAC the auth_events identifier hash with a server secret.
  evidence: plain sha256 of a +237 phone is brute-forceable; intent pins sha256, so it needs the owner.
- source_plan: same plan
  summary: Grant UPDATE on memberships to eskool_app.
  evidence: migration grants select/insert only; 1.7 edits Roles and scope.
- source_plan: same plan
  summary: Retention purge for auth_events vs its insert-only trigger.
  evidence: rows grow without bound; purge needs an owner-role job or a trigger exception. Decide with the first cron (epic 7).
- source_plan: same plan
  summary: Add BETTER_AUTH_SECRET and BETTER_AUTH_URL to `.env.example`.
  evidence: file blocked by a deny rule for the agent; README and ci.yml already list them.
- source_plan: same plan
  summary: Make the tenancy check compare `manifest.global` against AD-2's fixed list of global tables.
  evidence: `src/modules/core/data/tenancy-check.ts` exempts any table marked global.
