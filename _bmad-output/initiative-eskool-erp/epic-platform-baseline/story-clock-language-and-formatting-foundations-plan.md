---
title: 'Clock, Language and formatting foundations'
type: 'feature'
ticket: '5'
created: '2026-10-30'
status: 'built'
baseline_revision: 'f687684fdc3618fcaeaa9bdef92440b1fd5604c2'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: [quick, typescript-reviewer, react-reviewer]
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md', '{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Business dates must follow Douala time, every screen and document must exist in French and English, and amounts and dates must print one way everywhere (PRD FR-53, FR-54, §5.2; AD-7, AD-8); none of this exists yet.

**Approach:** Add `todayDouala`, next-intl with French and English catalogs and a cookie Language preference (no locale in the URL), `formatFcfa`, `formatDate`, `documentLanguage`, a test that fails when a key is missing in either catalog, and a lint rule against `new Date()` in business code; switch the scaffold page and layout to translated strings with a Language switch.

## Boundaries & Constraints

**Always:** Default Language French. Language values `fr` | `en` only; anything else in the cookie falls back to French. "Today" comes only from `src/modules/core/domain/clock.ts` (timezone `Africa/Douala`). Amounts are integer FCFA; `formatFcfa` refuses non-integers. Dates format as DD/MM/YYYY in both Languages. All UI text lives in `messages/fr.json` and `messages/en.json`. Read `node_modules/next/dist/docs/` before touching Next APIs (AGENTS.md).

**Never:** No locale segment in URLs, no proxy/middleware for i18n; no User or Guardian tables (the preference is a cookie until staff sign-in, entry 1.6); no visual design work beyond the scaffold page (screens are designed in Claude Design later).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Amount | `formatFcfa(45000)` | `45 000 FCFA` (no-break spaces), same in fr and en | none |
| Large / zero / negative | `1250000`, `0`, `-5000` | `1 250 000 FCFA`, `0 FCFA`, `-5 000 FCFA` | none |
| Non-integer amount | `formatFcfa(12.5)` | throws | error names the value |
| Date | `formatDate("2027-03-05")` | `05/03/2027` | invalid string throws |
| Douala day boundary | instant `2026-10-30T23:30:00Z` | `todayDouala` = `2026-10-31` (UTC+1) | none |
| Language cookie | missing, `xx`, `en` | `fr`, `fr`, `en` | none |
| Missing key | a key in fr.json absent from en.json | parity test fails naming the key | test failure |
| Document Language | receipt/WhatsApp with guardian `en`; report card for anglophone class | `en`; `en`; francophone class → `fr` | none |
| Lint | `new Date()` or `Date.now()` in `src/modules/**` outside `clock.ts` | lint error | lint failure |

</frozen-after-approval>

## Code Map

- `package.json` -- add `next-intl` `4.14.9` (spine Stack), exact pin.
- `next.config.ts` -- keep headers and `outputFileTracingRoot`; wrap export with `createNextIntlPlugin("./src/i18n/request.ts")`.
- `src/app/layout.tsx` -- `<html lang="en">` hard-coded; becomes `lang={locale}` with `NextIntlClientProvider`.
- `src/app/page.tsx` -- English literals ("Database", "Server time", "Database unreachable"); translate; show today's Douala date via `formatDate(todayDouala())`.
- `eslint.config.mjs` -- flat config; add a `no-restricted-syntax` block for `src/modules/**/*.ts` excluding `clock.ts` and `*.test.ts`.
- `src/modules/core/index.ts` -- public API (AD-1); export the new functions.
- `src/modules/core/data/db.ts` -- uses `rows[0].now.toISOString()` on a returned Date; not `new Date()`, no change.
- `vitest.config.ts` -- unit tests under `src/**/*.test.ts`; `messages/` parity test lives in `src/i18n/`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/modules/core/domain/clock.ts` -- `todayDouala(at?: Date): string` (`YYYY-MM-DD` via `Intl.DateTimeFormat` with `Africa/Douala`), plus `nowInstant()` -- the only clock.
- [ ] `src/modules/core/domain/format.ts` -- `formatFcfa(amount)`, `formatDate(isoDate)` -- one formatter each.
- [ ] `src/modules/core/domain/language.ts` -- `Language`, `LANGUAGES`, `parseLanguage(value)` (fallback `fr`), `documentLanguage(doc)` for `receipt` / `whatsapp` (guardian Language) and `report_card` (class Subsystem: francophone → fr, anglophone → en).
- [ ] `src/modules/core/domain/*.test.ts` -- cover every matrix row except lint.
- [ ] `messages/fr.json`, `messages/en.json` -- keys for the scaffold page and the Language switch.
- [ ] `src/i18n/request.ts` -- `getRequestConfig` reading cookie `lang` through `parseLanguage`, loading the catalog, `timeZone: "Africa/Douala"`.
- [ ] `src/i18n/message-keys.ts` + `src/i18n/messages.test.ts` -- `missingKeys(a, b)` over nested keys; test asserts fr/en parity and that a planted fixture is reported.
- [ ] `src/app/language-action.ts` -- server action `setLanguage(formData)`: parse, set cookie `lang` (1 year, `sameSite: "lax"`, `httpOnly`), refresh.
- [ ] `src/app/layout.tsx`, `src/app/page.tsx` -- translated strings, `lang` attribute, a two-button French/English form.
- [ ] `eslint.config.mjs` -- restrict `new Date(...)` and `Date.now()` in business code.
- [ ] `next.config.ts`, `package.json`, `src/modules/core/index.ts` -- wire and export.

**Acceptance Criteria:**
- Given the scaffold page, when the user presses English then Français, then every visible string, the `lang` attribute and the button state change accordingly, and survive a reload.
- Given a planted `new Date()` in `src/modules/core/data/db.ts`, when `npm run lint` runs, then it fails.

## Implementation Notes

- Code and tests done; `npm run check` green (lint, typecheck, 26 unit tests). Planted `new Date()` in `db.ts` fails lint, then reverted.
- `npm run build` NOT verified: `next.config.ts` load fails on this Windows host because the SWC native binding cache rejects the user profile DACL (`ERR_SWC_NATIVE_CACHE`). `SWC_NATIVE_BINDING_CACHE` override did not help. Environment issue, not app code; verify on Linux CI or after fixing the host cache.
- Manual browser check (`npm run dev`, language switch and reload) not run: needs a working dev server on this host and a database for the health line.

## Plan Change Log

## Review Triage Log

Pass 1 (lenses: quick, typescript-reviewer, react-reviewer) — medium 1, low 3 patched; deferred 1; rejected 9. Patches applied by the orchestrator (small, no implementer re-engagement).

| Finding | Verdict | Route | Evidence / action |
|---|---|---|---|
| Lint misses `Date()`, `new globalThis.Date()`, `globalThis.Date.now()` (ts, quick) | medium | patch | Selectors added; stdin check flags all 5 planted forms. |
| Lint `files` only `.ts` under src/modules (ts, quick) | low | patch | Now `{ts,tsx,mts,cts}`. |
| Language buttons lack `lang` (react) | low | patch | `lang={code}` on each button. |
| Spine AD-8 signature differs from `documentLanguage(doc)` (quick) | low | patch | Spine text updated to the object form. |
| AC1 (switch + reload) and `npm run build` unverified (quick) | medium | defer | Host SWC cache DACL blocks build and dev; user said to ignore locally; CI build on first push settles it. |
| Pages import `@/modules/core` index that also exports the data layer (ts) | low | reject | AD-1 requires imports through index; getDb is lazy, server-only; no DB call from i18n. |
| Full catalog sent to client via provider (react) | low | reject | No client component yet; scope to namespaces when the first one lands. |
| Language cookie without `secure` (ts, react) | low | reject | httpOnly preference cookie, no sensitive data; would need env in config.ts. |
| `revalidatePath` redundant (react) | false | reject | Harmless; keeps intent explicit. |
| `status.now` raw ISO (react, quick) | low | reject | Pre-existing tracer field, an event instant, not a business date. |
| `?? ""` fallback in clock (ts) | false | reject | `en-CA` formatToParts always yields year/month/day. |
| Year 0000 accepted (ts) | low | reject | Not reachable from Postgres `date` input. |
| `t()` keys untyped (ts) | low | reject | Add next-intl AppConfig typing when catalogs grow. |

## Design Notes

`formatFcfa` groups thousands by hand with U+00A0 (no-break space) between groups and before `FCFA`, so receipts never wrap inside an amount and fr/en print the same: `45 000 FCFA` reads as "45 000 FCFA". `Intl.NumberFormat("fr-FR")` is avoided because it uses U+202F, which some 80 mm thermal printers do not render.

`formatDate` works on the `YYYY-MM-DD` business-date string (AD-7: Postgres `date`), never on a `Date`, so no timezone can shift the day.

## Verification

**Commands:**
- `npm run check` -- expected: lint, typecheck, unit tests green.
- `npm run build` -- expected: success.

**Manual checks (if no CLI):**
- `npm run dev`, open `/`, switch English/Français: all strings and `<html lang>` change; reload keeps the choice.
