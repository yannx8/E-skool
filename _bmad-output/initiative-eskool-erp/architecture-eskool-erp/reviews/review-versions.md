# Review: versions and technology fit (2026-10-29)

Spine reviewed: `architecture-eskool-erp.md` (not edited). Method: `npm view` against the registry today, vendor docs fetched today, Context7. Status: CONFIRMED / CHANGE / RISKY.

## Summary table

| Item | Status | Evidence |
| --- | --- | --- |
| Next.js 16.4.3 | CONFIRMED | `npm view next version` = 16.4.3, engines node >=20.9 |
| React 19.3.1 | CONFIRMED | latest = 19.3.1; next peer `^19.0.0`, next-intl peer `^19.0.0`, @react-pdf peer `^19.0.0` |
| Prisma 7.10.x + @prisma/adapter-pg | CONFIRMED, with a pinning hazard | `@prisma/client` and `@prisma/adapter-pg` latest = 7.10.1. The `prisma` CLI `latest` dist-tag = 8.0.0-rc.28 (`prev` = 7.10.1), so `npm i prisma` pulls the RC. Pin exact `prisma@7.10.1`. adapter-pg 7.10.1 uses `pg ^8.16.3` (pg 8.23.1 current). CLI engines node `^22.18 \|\| ^24.11 \|\| >=26`. |
| RLS `set_config` per transaction under Prisma 7 | CONFIRMED in principle, must be proven by a spike | Prisma 7 keeps `prisma.$transaction(async tx => ...)` with `maxWait`/`timeout`/`isolationLevel`. Prisma 8 removes `$transaction` and all those options (docs "Coming from Prisma ORM 7"). The adapter binds one pg connection to the tx, so `set_config('app.school_id', x, true)` via `tx.$executeRaw` as first statement is valid. I found no official Prisma doc with an RLS example for adapter-pg; the community pattern is the same. Set `timeout` explicitly (default 5000 ms) because receipt-counter `FOR UPDATE` plus RLS can exceed it. |
| better-auth 1.7.14 | CONFIRMED | latest = 1.7.14; peers `next ^14\|\|^15\|\|^16`, `prisma/@prisma/client ^5\|\|^6\|\|^7`. Separate package `@better-auth/prisma-adapter` 1.7.14 exists (docs install it; import path `better-auth/adapters/prisma`). Prisma 7 needs the driver adapter and a custom generator output (`src/generated/prisma`). |
| better-auth: phone/username + code for parents | RISKY | Phone-number plugin supports phone + password sign-in and OTP (`sendOtp`/`verify`), and `signUpOnVerification` with `getTempEmail` for email-less users. But OTP needs `sendOTP` (SMS/WhatsApp, which the PRD defers). Username plugin docs show `email` required at sign-up. The parent "code" design therefore means: staff create the Parent user server-side with a placeholder email, the code is the credential password, hashed with a custom `password.hash/verify` (argon2). That is custom work, not a plugin feature. Brute force of a short code relies on better-auth rate limiting; needs entropy and lockout spec. Also `advanced.database.generateId` for uuid PKs not verified in docs. |
| better-auth tables vs AD-2 RLS | RISKY (spine gap) | Session/account/user lookups happen before `school_id` is known and go through better-auth's own Prisma client, not `withSchool`. The auth tables must be exempt from the `school_id` RLS policy (or be read by a dedicated role). The spine lists only "schools, subscriptions, platform users" as non-tenant; add auth tables. |
| next-intl 4.14.9 + Next 16 | CONFIRMED | peer `next ^16`. Docs: `proxy.ts` replaces `middleware.ts` in Next 16 (`createMiddleware(routing)` is unchanged). |
| Locale without URL prefix | CONFIRMED | next-intl "without i18n routing" setup reads a `locale` cookie in `getRequestConfig` (`src/i18n/request.ts`); no proxy needed. Spine's "from the User's preference" fits (cookie mirrors the stored preference). |
| @react-pdf/renderer 4.9.0 | CONFIRMED, test on Vercel | peer React `^19`; compat page says React 19 supported since 4.1.0. `@react-pdf/renderer` is in Next's default `serverExternalPackages` list (Next 16.4.3 docs). Only 2 open upstream issues: #3285 (monorepo + App Router crash, Jan 2026), #3247 (Noto Sans weight 700 font error). An earlier report of React 19 reconciler breakage on Vercel production was not found resolved or refuted; run a deploy smoke test with the real fonts early. Use a Node route handler, not Edge. |
| TypeScript 5.9 pin | CHANGE | TS 7.0.2 is `latest`, 6.0.3 is the last JS-based line. Next 16.4 docs now support TS 7 in `next build` by running the project `tsc` CLI, so the spine's "until Next.js supports 7" reason is outdated. Real blockers: TS 7 ships no programmatic API until 7.1 (typescript-eslint 8.72.1 has peer `typescript <6.1.0`, so the AD-1/AD-7 lint rules need TS <=6.0); Prisma needs `>=5.4`. 7.0 also defaults `strict`, `types: []`, and errors on removed options. Recommendation: pin `typescript@6.0.3` (supported by typescript-eslint, Prisma, Next), or keep 5.9.3 if preferred; revisit at 7.1. Rewrite the assumption note. |
| Tailwind 4.3.3 | CONFIRMED | latest = 4.3.3; docs v4.3 use `@tailwindcss/postcss` + `@import "tailwindcss"` with Next. |
| Vitest 5.0.5 | CONFIRMED | latest = 5.0.5; engines node `^22.12 \|\| ^24 \|\| >=26`; peer vite `^6.4 \|\| ^7 \|\| ^8`; better-auth peer allows vitest ^5. |
| zod 4.6.7, qrcode 1.5.4, @node-rs/argon2 2.2.2 | CONFIRMED | all equal registry latest. `@types/node` latest is 26.6.6; pin `@types/node@24`. |
| Node 24 LTS | CHANGE (minor) | nodejs.org lists v26 as LTS (Oct 2026), so v24 "Krypton" is now Maintenance LTS (supported to about Apr 2028, per the Node release schedule; page did not label phases). Still valid: Prisma, Vitest, Next all accept 24. Local machine runs 24.22.1. Keep 24, state "Maintenance LTS, move to 26 in 2027". |
| Vercel EU regions | CONFIRMED | Region list (updated 2026-08-11): `cdg1` Paris, `fra1` Frankfurt, `dub1`, `lhr1`, `arn1`; also `cpt1` Cape Town. Functions default to `iad1`, so set the function region explicitly to the DB region. |
| Managed Postgres 17 EU with PITR | RISKY (still unchosen) | Neon: Frankfurt `aws-eu-central-1` available; PITR window Free 6 h, Launch 7 d, Scale 30 d (history billed $0.20/GB-month); PG17 not confirmed on the regions page. Supabase: PITR is a paid add-on on Pro+ (7/14/28 days, about $100/$200/$400 per month, needs Small compute; replaces daily backups); region/PG17 not stated. Scaleway: product page lists PG 14-17, Paris (`fr-par`); PITR not confirmed in fetched sources (docs returned 403). Spine's `[ASSUMPTION]` stays; must be closed by checking one provider's PG17 + PITR + EU page before pilot. |

## Top risks

1. Parent login design is custom (placeholder email, argon2 code as password, rate limit) because the phone/username plugins assume email or SMS OTP; needs a spike and a security spec.
2. AD-2 versus better-auth: auth tables read outside `withSchool`, so they need an RLS exemption; and the `set_config` pattern must be proven in a real-Postgres test under adapter-pg with a non-BYPASSRLS role.
3. Version drift traps: `prisma` npm `latest` is the 8.0 RC (pin exact 7.10.1; Prisma 8 drops `$transaction`); TS pin reason is stale (use 6.0.x, TS 7 breaks typescript-eslint until 7.1); managed Postgres provider and PITR still unverified.

## Sources
- https://nextjs.org/docs/app/api-reference/config/typescript (TS 7 support, lastUpdated 2026-08-25)
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- https://www.better-auth.com/docs/plugins/phone-number , /plugins/username , /adapters/prisma
- https://next-intl.dev/docs/routing/middleware , /docs/getting-started/app-router/without-i18n-routing
- https://www.prisma.io/docs/orm/prisma-client/queries/transactions (shows Prisma 8 API) and Context7 /prisma/orm
- https://vercel.com/docs/regions ; https://supabase.com/docs/guides/platform/backups ; https://neon.com/docs/postgres/backup-restore/history-window ; https://neon.com/docs/introduction/regions
- https://nodejs.org/en/about/previous-releases ; https://react-pdf.org/compatibility ; npm registry (`npm view`)
