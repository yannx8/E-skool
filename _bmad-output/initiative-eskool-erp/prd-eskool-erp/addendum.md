# Addendum: E-skool PRD

Detail that belongs to architecture and UX, kept out of the PRD body. Updated 2026-10-30 for the narrowed MVP (`../change-narrow-mvp-cash-control/change-narrow-mvp-cash-control.md`).

## A. Role permissions (FR-15)

| Capability | Promoter | Director | Cashier | Teacher |
|---|---|---|---|---|
| Dashboard, Term report, Audit log | ✓ | ✓ | — | — |
| School year, key dates, structure, Fee plans, Modules, rules, Users | — | ✓ | — | — |
| Pupils, Guardians, import, promotion | read | ✓ | read (no phone edits) | own Classes, names only |
| Record cash Payment, print and reprint Receipt, own Cash session | — | ✓ | ✓ | — |
| Void Payment | — | ✓ | — | — |
| Discounts | read | ✓ | — | — |
| Payment delays | read | ✓ | read | — |
| Send-home list: confirm, exclude | read | ✓ | — | — |
| Send-home list: view confirmed | ✓ | ✓ | ✓ | own Classes, no amounts |
| Approve Cash closing above Gap threshold | — | ✓ | — | — |
| Enter Marks and comments | — | ✓ | — | own Classes and Subjects |
| Sign off, reopen, hold, print Report cards | — | ✓ | — | — |
| WhatsApp messages: view, send `wa.me` fallback, edit wording | read | ✓ | read | — |

Patterns: cancel as a separate privilege (Fedena "Revert Transaction", MyClassBoard), restricted discounts (Loyverse), closing approval above a maximum difference (Odoo POS), defaulter list flagged to the principal (Schoolites, Entab, EdPrime).

## B. Technical direction

- Stack and invariants: `../architecture-eskool-erp/architecture-eskool-erp.md`.
- PDFs (Receipts, Report cards, Term report) rendered server-side; QR Verification codes point to a public `/v/<code>` route.
- WhatsApp: WhatsApp Business Platform Cloud API with approved utility templates, sent from an outbox (AD-18); `wa.me` text fallback.
- No Mobile Money or bank integration in the MVP.
- All screens are designed in Claude Design.

## C. Source pointers

- Ministry rules and confidence levels: `_bmad-output/research/erp-cameroon-analysis.md` §2.
- Competitor set and pricing: same file §1.
- Proven-software evidence for the 2026-10-30 changes (send-home list, separation of duties, WhatsApp records, parked ideas): the change proposal §1 and its sources.
