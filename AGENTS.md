<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- bmad:context -->
<!-- Verified 2026-10-20 against f8c5e04 (working tree has uncommitted doc deletions). Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## E-skool

ERP for private primary schools in Douala (ticket 1: platform baseline). Next.js 16.4.3 (App Router) on Vercel region `fra1`, managed Postgres 17 in the EU (Neon Frankfurt), Prisma 7.10.1 with `@prisma/adapter-pg`. Architecture spine: `_bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md`. Old finance prototype: branch `archive/finance-prototype`.

## Policy

- Database access only from `src/modules/core/data/`; environment read only in `src/config.ts` (zod-validated).
- Modules expose only their `index.ts`; no domain tables until the owning entry lands (AD-1, AD-2).
- Money is integer FCFA and append-only (AD-4); every tenant table gets RLS when it is added (AD-2).

## Running and verifying

- `docker compose up -d` starts Postgres 17 on `localhost:5433`. Set `DATABASE_URL` and `DIRECT_URL` (see README).
- `npm run check` = lint + typecheck + unit tests. `npm run test:db` needs the container running. CI also runs `npm run build`.
- Node >=24.

## Conventions

- Pinned versions from the spine Stack; do not upgrade Prisma to 8 RC.
- Business dates via `todayDouala()` only (AD-7), once `core/domain/clock.ts` exists.

<!-- /bmad:context -->
