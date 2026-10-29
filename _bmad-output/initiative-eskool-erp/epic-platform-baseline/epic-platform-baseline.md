---
type: epic
title: "A tenant-safe, bilingual platform is live"
parent: initiative-eskool-erp
covers: [FR-1, FR-2, FR-3, FR-4, FR-15, FR-16, FR-53, FR-54, FR-55, FR-58]
after: []
assignee: ""
risk: high
---

# A tenant-safe, bilingual platform is live

## Description

The new code base replaces the old one: scaffold, CI, preview and production on Vercel EU with managed Postgres, tenant isolation in the database, identity and Memberships with staff and parent sign-in, the `defineCommand` write path with audit, Roles and permissions, Module and Subscription guards, French and English, private files, and the Platform admin area to create Schools.

## Outcome

The builder can create a School in production and sign in to it as its School administrator in either Language, and a test proves another School's data is invisible.

## Requirements

The PRD's lines, by their ids: FR-1 Create a School; FR-2 Data separation; FR-3 Modules on/off; FR-4 Subscription state; FR-15 Role permissions; FR-16 Staff sign-in; FR-53 Interface Language; FR-54 Document Language; FR-55 Audit log; FR-58 Backups. Constraints: PRD §5 (devices, money rules, security, onboarding, reliability) and spine Operations.

## Done when

1. The old code is on its own archive branch and the new tree builds, lints, typechecks and tests in CI.
2. A Platform admin creates a School in production; its School administrator signs in and switches Language (FR-1, FR-16, FR-53).
3. The cross-school test passes on every tenant table in the manifest (FR-2, AD-2).
4. Every command goes through `defineCommand` and writes an Audit row; the CI checks for AD-1 and AD-3 fail on a planted violation (FR-55).
5. A single-School restore is rehearsed on the production database provider (FR-58).

## Boundaries

Platform and core plumbing only; no school-domain screens beyond School creation and sign-in.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.1, §4.4, §4.13, §4.14, §5
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-1 to AD-5, AD-7, AD-8, AD-10, AD-12, AD-13, AD-16, Operations

## Notes

- Unknown: parent-code sign-in through better-auth, and RLS `set_config` under Prisma 7 interactive transactions; spike entries settle them first.

- Decision: breakdown of 10 entries approved by the user (2026-10-29); builds use ECC skills and agents where useful.
