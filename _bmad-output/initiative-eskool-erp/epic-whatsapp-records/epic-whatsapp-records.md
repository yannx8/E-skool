---
type: epic
title: "Parents get WhatsApp payment records and reminders"
parent: initiative-eskool-erp
covers: [FR-56, FR-57, FR-61, FR-62, FR-63, FR-64]
after: []
assignee: ""
risk: medium
---

# Parents get WhatsApp payment records and reminders

## Description

The `notifications` module and its outbox (AD-18): each Payment confirmed to the linked Guardians with the Balance left, smart Reminders around Tranche due dates and Payment-delay Instalments that stop once paid, a Send-home notice when the Director confirms the list, delivery statuses from the WhatsApp webhook, message records on the Pupil account, and the `wa.me` fallback while the School's WhatsApp Business number is not connected. Also Guardian consent and data requests, and Excel exports. Release R4; Meta business verification starts during R1.

## Outcome

Every Guardian with consent receives a confirmation within minutes of each Payment and at most 3 accurate Reminders per Tranche, and no message ever blocks a Payment (SM-C2).

## Done when

1. A Payment enqueues one confirmation per consenting linked Guardian in the same transaction; with the WhatsApp API down, the Payment still succeeds and the message ends `failed` after retries and is offered as a `wa.me` link (FR-61, FR-64, AD-18).
2. On a fixture school, the daily job enqueues Reminders only for Pupils still owing on the Tranche or Instalment, a rerun enqueues nothing new, and a Guardian of two Pupils gets one message (FR-62).
3. Confirming the Send-home list enqueues a notice for each listed Pupil's Guardians and none for excluded Pupils (FR-63).
4. A delivery-status webhook with a bad signature is rejected and a valid one updates the message status shown on the Pupil account (FR-64, AD-10).
5. A Guardian without consent never gets a message; anonymising a Pupil keeps totals and the Audit log; exports match dashboard totals (FR-56, FR-57).

## Boundaries

`notifications` module, its cron and webhook routes, and the hooks in the `recordPayment` and `confirmSendHome` workflows. Touch point owned here: WhatsApp Business Platform setup (verified business, display name, approved utility templates in French and English) — a hitl step on the first entry that sends. Screens designed in Claude Design first.

## References

- prd — _bmad-output/initiative-eskool-erp/prd-eskool-erp/prd-eskool-erp.md, §4.12, FR-56, FR-57, §9
- architecture — _bmad-output/initiative-eskool-erp/architecture-eskool-erp/architecture-eskool-erp.md, AD-10, AD-18
- change — _bmad-output/initiative-eskool-erp/change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md §4.7 (patterns: Edunext and OpenEduCat WhatsApp fee reminders, provider payment-confirmation templates)

## Notes

- Decision: 2026-10-30 — added by the approved change proposal; WhatsApp never decides whether a Payment counts.
- Open question: one WhatsApp Business number per School or one E-skool number (PRD Q3).
- Unknown: current Meta utility-template price for Cameroon (third-party calculators say about $0.004); confirm on Meta's rate card before pricing.
