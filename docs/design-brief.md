# E-skool design brief: Brightwheel billing, adapted

Designing the fee office of one private primary school in Douala (secretary and bursar on phone and laptop, owner read-only).
Goal: see who owes, take a payment, follow up. Clarity over beauty.

## References

| Ref | What it gives | Why |
|-----|---------------|-----|
| Brightwheel billing dashboard art (`.claude/work/refs/bw-billing-dashboard.png`) | Summary cards: title, muted period line, big amount, stacked bar, legend chips (dot + label + amount); billing activity feed (date, bold amount + text, chevron) | Same job: money owed vs received for a school, read at a glance |
| Brightwheel billing laptop shot (`refs/bw-billing-feature.png`) | Periwinkle sidebar with white icons, white canvas, page title left + search right, cards on top, student table below with avatar, red balance, blue "Actions ▾" | Shows the full screen order: summary first, list second |
| Brightwheel help center (`_bmad-output/research/billing-patterns.md`) | Billing > At a glance, Students tab, Unpaid balances with row action "Send a reminder", per-child Statements tab | Verified screen names and row actions |

Copied: structure, layout, colour roles. Not copied: logo, illustrations, marketing copy, coral CTA.

## Tokens (sampled from the refs)

| Token (CSS name) | Value | Source | Role, only this |
|---|---|---|---|
| `rail` | #4a5aeb | sidebar #6476ff, darkened so white is 5.3:1 and muted #eef0ff is 4.7:1 | sidebar and phone header background |
| `rail-2` | #3f4ed8 | rail, one step darker | active nav item |
| `sun` (action) | #5864cc | "Actions ▾" blue #5d6ad2, darkened to 4.8:1 on the canvas | primary button, links, focus ring, selected tab |
| `sun-soft` | #e6e8fd | track #edeef7 tinted | selected-row and "due today" background |
| `late` | #c8353c text / #fb5a5f bars | past-due #fb5a5f | past due only (text darkened to 5.2:1) |
| `later` | #d5d9df bars, track #edeef7 | not-yet-due grey | not yet due |
| `paid` | #057577 text, ramp #cbeaea / #09b8b1 / #03a29c / #057577 | payments teal bar | money received, by method |
| `ink` | #0d0d0d | big amounts | figures, titles |
| `ink-2` | #5d5b5d | card titles | labels |
| `ink-3` | #6e6c70 | muted lines, raised from #bcb9bb for 5.2:1 | period lines ("As of today") |
| canvas / cards | #f6f7fb / #ffffff, 1px #e7e8f0, radius 12, shadow 0 1px 2px | white cards on white in ref; soft grey canvas to separate cards on phone | |

Type: Figtree (chosen 2026-10-29 over Atkinson, Public Sans, IBM Plex; closest to Brightwheel's rounded sans). 16 px base, amounts in Figtree tabular figures (no monospace). Card title 17/500, big amount 32/600.

## Layout per screen (one primary action each)

- **Shell**: rail sidebar 248 px, white icons and labels; "Receive payment" white button at top of rail. Top bar on the page: title left, search pill right (`/families?q=`). Phone: rail header + bottom tabs with the round action.
- **Overview = Billing at a glance**: row 1 = "Open fees" card (late / not yet due bar + chips) and "Payments" card (last 35 days, teal ramp by method); right column = "Billing activity" feed (payments, voids, cash differences, broken promises). Below: who owes most (table with Actions ▾), by class. Primary: Receive payment.
- **Families**: search + class filter, then the Brightwheel student table: initials avatar, family + guardian, pupils with fee strip, due now (red when late), balance, Actions ▾ (Receive payment, Send reminder, Statement). Primary: New family.
- **Family page**: header (avatar, name, phone), balance summary card, tabs Summary / Payments / Statement. Primary: Receive payment.
- **Collections = Unpaid balances**: aging summary card (bar + chips per bucket), tabs (Who owes, Promises, By class), table with reminder action per row. Primary: Send reminder per row.

## Decision ledger

| Decision | Source | Rule | Why |
|---|---|---|---|
| Periwinkle sidebar | bw-billing-feature | rail = navigation surface only | Brightwheel's signature; darkened for 4.5:1 |
| Blue actions, never coral | "Actions ▾" blue | sun = actions only | coral in ref is marketing CTA; red here means late |
| Summary card with stacked bar + chips | bw-billing-dashboard | bar colours = status roles | owed vs late at a glance |
| Activity feed | bw-billing-dashboard | date, bold amount, text, chevron | owner sees what happened without a report |
| Actions ▾ per row | bw-billing-feature + help center "Send a reminder" | one menu, native `<details>` | keeps rows short on phone |
| Status always with text | research avoid #14 | colour never alone | low-literacy and colour-blind users |
| Buckets 1-30/31-60/61-90/90+ kept | src/lib/money.ts | UI-only scope | Brightwheel's 1-7…22+ needs a logic change |
