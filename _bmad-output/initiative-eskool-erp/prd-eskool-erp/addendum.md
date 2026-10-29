# Addendum: E-skool PRD

Detail that belongs to architecture and UX, kept out of the PRD body.

## A. Role permissions (FR-15)

| Capability | Promoter | Director | Bursar | Secretary | Teacher | School admin | Parent |
|---|---|---|---|---|---|---|---|
| Read dashboard, Term report | ✓ | ✓ | — | — | — | ✓ | — |
| School structure, Fee plans, Modules, rules | — | — | — | — | — | ✓ | — |
| Pupils, Guardians, Families, import | read | ✓ | read | ✓ | own Classes, read | ✓ | own Family |
| Record Payment, Cash session | — | ✓ | ✓ | — | — | — | — |
| Void Payment | option | ✓ | — | — | — | — | — |
| Discounts | read | ✓ | — | propose | — | — | — |
| Moratoire request | — | ✓ | ✓ | — | — | — | ✓ |
| Moratoire decision | option | ✓ | within rules, option | — | — | — | accept counter-proposal |
| Reminders, Notices | — | ✓ | ✓ | — | — | — | — |
| Enter Evaluations | — | ✓ | — | — | own Classes | — | — |
| Sign off, reopen, hold Report cards | — | ✓ | — | — | — | — | — |
| Audit log | ✓ | ✓ | — | — | — | ✓ | — |
| Users and Roles | — | — | — | — | — | ✓ | — |

"Option" = a School setting, off by default.

## B. Technical direction (to confirm in bmad-architecture)

- Default stack: Next.js (App Router, server actions) + PostgreSQL + Prisma, deployed as one multi-tenant app. Every tenant-owned table carries `school_id`; isolation enforced in one data-access layer and backed by Postgres row-level security `[to decide]`.
- i18n: message catalogs FR/EN, build fails on a missing key (FR-53).
- PDFs (Receipts, Report cards, Notices, Term report) rendered server-side; QR Verification codes point to a public `/v/<code>` route.
- WhatsApp: `wa.me/<number>?text=` links, no API (FR-32).
- Mobile Money: manual reference entry; aggregator integration later (no aggregator chosen).
- Hosting: managed Postgres with daily backups and per-School restore (FR-58); data location to settle with the data-protection advice.
- Nothing from the previous code base is reused; the old Prisma schema and routes are reference only.

## C. Source pointers

- Ministry rules and confidence levels: `_bmad-output/research/erp-cameroon-analysis.md` §2.
- Competitor set and pricing: same file §1.
- Screen references (Mercury, Square, Asana, Kitchen, Lemon Squeezy, Klarna, Copilot): `_bmad-output/research/erp-education-ux/rapport-erp-education-ux.md` §3 and `captures/`.
- Moratoire flow and statuses: same report §4.2.
