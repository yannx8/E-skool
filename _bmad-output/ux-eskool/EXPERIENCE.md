---
status: draft
created: 2026-10-20
updated: 2026-10-20
sources:
  - ../prd-eskool/prd-eskool.md
name: E-skool
---

# E-skool: Experience Spine

Visual tokens are in `DESIGN.md` and referenced here as `{colors.primary}`, `{components.button-primary}`, and so on. Where this file and `DESIGN.md` disagree on a visual value, `DESIGN.md` wins.

## Foundation

- **Computer first.** The primary surface is an office desktop or laptop at 1366 px wide (memlog decision). The phone is a secondary surface, used mainly by the Founder and by the Secretary on occasion (PRD UJ-2, UJ-5).
- **Web app, French UI, light mode only.** Keyboard and mouse first; every action is reachable without a hover.
- **Frontline users are not computer natives** (PRD 6.5, main risk). Each screen has one primary action, short French labels, and a visible next step.
- **A shadow ledger.** E-skool records, reports and reminds. It never blocks a payment, never approves, never pays wages, and sends WhatsApp messages outward only (PRD section 5).
- **One ledger.** A payment shows the same amount, date and balance on the pupil, the owing list, the cash book and the Founder overview (memlog: single ledger, after the split-ledger failure seen in competitors).

## Information Architecture

Left sidebar, `{spacing.sidebar}` wide, in school vocabulary. Paiements and Impayés come first (memlog).

| Section | Shown to | Purpose | Build tier |
|---|---|---|---|
| Accueil | Every role | Role home (see Role Homes) | Core |
| Paiements | Secretary, Administrator | Enregistrer un paiement, recent payments, voids | Tier 1 |
| Impayés | Secretary, Collections staff, Director, Founder | Owing list per class and school-wide | Tier 1 |
| Élèves | Secretary, Administrator | Pupils, classes, import (template, preview, errors) | Tier 1 |
| Moratoires | Director | Moratoires, Promises, broken and soon-due list | Tier 2 |
| Relances | Collections staff, Director | Reminders sent, Avertissements printed | Tier 2 |
| Tableau de bord | Founder (and Director, Administrator) | Read-only overview with drill-down | Tier 2 |
| Fournitures, Stock | Store keeper | Supply lists, In-kind items, Consumables, Assets | Tier 3 |
| Personnel et paie, Dépenses et caisse | HR-payroll officer, Administrator | Payroll, expenses, cash book, daily closing | Built, off by default |
| Administration | Administrator | Users and roles, configuration, backup, audit log | Built |

- Modules marked "off by default" are enabled per school (PRD 4.8).
- Tier 3 sections stay hidden until the pilot confirms the need (PRD 6.1). [ASSUMPTION: hidden, not greyed out, until enabled.]
- Every total drills to the list behind it (PRD FR-23). A figure that cannot be opened is a defect.

## Voice and Tone

Simple French. No accounting jargon (memlog). Short, complete sentences. Address the user as "vous". [ASSUMPTION: "vous" form; no source fixes the register.]

| Do | Don't |
|---|---|
| "Enregistrer le paiement" | "Comptabiliser l'encaissement" |
| "Reste à payer : 45 000 FCFA" | "Solde débiteur" |
| "Classe inconnue ligne 14 : CM3 B" | "Erreur 0x14 : classe" |
| "Clôture manquante" | "Données incomplètes" |
| "212 élèves, 0 erreur" | "Import réussi !" |
| "Aucun élève en retard" | Exclamation marks, congratulations, streak language |

Glossary terms are used verbatim in the French UI where a French word exists in the PRD: Élève (Pupil), Tranche, Moratoire, Promesse (Promise), Avertissement, Relance (Reminder), Impayés (Owing list), Clôture (closing). [ASSUMPTION: French labels for Pupil, Balance ("Reste à payer") and Receipt ("Reçu") are proposed here; the PRD gives English glossary terms only.]

Error messages say what happened and what is still true: "Le paiement n'a pas été enregistré. Rien n'a été écrit." [ASSUMPTION: wording pattern; no source specifies it.]

## Component Patterns

Behaviour only. Visual specs are in `DESIGN.md` Components.

| Component | Used in | Behavioural rules |
|---|---|---|
| Payment form | Paiements | Find the Élève by name, pick a Tranche or Fee, type the amount in integer FCFA (decimals refused), pick a method (Espèces, Orange Money, MTN MoMo, Banque; PRD 4.2), confirm. Confirmation shows the amount and the new Balance. The receipt step follows. |
| Owing table | Impayés | Columns: Élève, Classe, Reste à payer, Moratoire, Dernière relance. Filters: class, "sans moratoire active". Multi-select with a count on the bulk action. Totals row equals the sum of the rows (PRD FR-9). |
| Bulk relance bar | Impayés | Sticky bar after selection: "Relancer par WhatsApp (n)". On send, a result list shows sent and failed rows; invalid phone numbers are listed, never skipped silently (PRD FR-13). |
| Promise row | Moratoire form | Date and amount per Promise; add a row for each instalment. Status chip shows open, kept, partially kept or broken. |
| Status chip | Everywhere | `{components.status-ok}`, `{components.status-due}`, `{components.status-broken}`, `{components.status-info}`. Icon and label always shown. |
| Import preview | Élèves | Count cards (élèves, classes, frais, paiements), then an error table: ligne, colonne, raison. Nothing is written until "Confirmer l'import" (PRD FR-2). |
| Void dialog | Paiements | Administrator only. Requires a reason. `{components.button-danger}` on confirm. The voided payment stays visible with who, when and why (PRD FR-8). |
| KPI tile | Tableau de bord | Amount, label, and the whole tile is a link to the list (`{components.kpi-tile}`). |
| Event list | Tableau de bord | Recent voids, adjustments, uncategorised expenses, "clôture manquante". Each line shows who and when from the audit log (PRD FR-24). |

## State Patterns

| State | Where | Treatment |
|---|---|---|
| Loading | Owing list, dashboard | Text "Chargement des élèves…" with the table frame in place. No spinner alone. [ASSUMPTION] |
| Empty owing list | Impayés | "Aucun élève en retard." Not a celebration. |
| Empty promise list | Moratoires | "Aucune promesse à suivre." with a link to the Impayés list. |
| Import with row errors | Élèves | Preview stays, error table lists each row. Fixing and re-uploading does not restart (PRD FR-3). |
| Partially kept Promise | Moratoire | Shows the remainder and "Reste : n FCFA". Stays due until the grace ends (PRD FR-11). |
| Broken Promise | Moratoire, Director's list | Shows the date, the amount and "Non tenue". Flag only, no block (PRD FR-12). |
| Clôture manquante | Tableau de bord | Replaces the cash figure with "Clôture manquante" and a link to the closing. Never a reassuring number (PRD UJ-5). |
| Invalid phone | Bulk relance | Row flagged "Numéro invalide", kept in the list (PRD UJ-4). |
| Save failed | Any money write | "Le paiement n'a pas été enregistré. Rien n'a été écrit." Nothing is half-saved. [ASSUMPTION: failure copy.] |
| Read-only | Tableau de bord | No write control rendered at all for the Founder (PRD FR-24). |
| Negative stock refused | Stock | Message explains the refusal and the current quantity (PRD FR-20). |

## Interaction Primitives

- **One primary action per screen.** The main button is `{components.button-primary}`; everything else is secondary.
- **Confirm before money moves.** Payments, relances in bulk and closings ask for a confirmation that repeats the amount or count.
- **No undo for money.** A wrong payment is corrected by Administrator Void with a reason, not by editing (PRD FR-8, immutable except Void).
- **Destructive actions are two steps.** Void, asset disposal and conversion undo: a dialog with the reason field and a `button-danger` confirm.
- **Sorting and filtering on lists.** Sort by amount or date. Promises can be sorted by amount or date (PRD FR-12).
- **Keyboard.** Enter submits the payment form; Escape closes a dialog. [ASSUMPTION: shortcut behaviour; not in the PRD.]
- **Double submit is blocked.** A money button is disabled while its request is in flight. [ASSUMPTION.]
- **Links, not modals, for drill-down.** A total opens its list in the same screen with a filter applied.

## Accessibility Floor

- **Text:** 16 px minimum everywhere (PRD 6.3). No text is set in an image except the printed artifacts' fixed labels.
- **Targets:** 44 px minimum on every control and table row (`{spacing.touch-target}`).
- **Contrast:** all text pairs in `DESIGN.md` pass WCAG AA. Input outlines use `{colors.border}` at 3.6:1.
- **Status:** never by colour alone. Icon plus text on every status (`{components.status-ok}` etc.).
- **Focus:** the 3 px focus ring is never removed. Tab order follows the reading order, top to bottom and left to right.
- **Labels:** every field has a visible label. Errors are announced in text next to the field.
- **Keyboard:** every action reachable without a mouse on the desktop surface.
- **Print:** printed artifacts are black on white, with no information carried by tint.

## Responsive & Platform

- **Primary:** desktop web at 1366 px. The owing list and payment form fit without horizontal scrolling. [ASSUMPTION: 1280 px is the lowest supported width.]
- **Secondary:** phone. Below 768 px the sidebar becomes a top bar with a menu. The Founder overview is readable at 16 px at 360 px width with no horizontal scrolling (PRD FR-25). The payment flow on the phone keeps the "three taps" goal of PRD FR-6.
- **Conflict:** PRD FR-6 and 6.3 say "phone first". The memlog says computer first. The PRD must be updated; until then the phone goal is kept as secondary.
- **Platform:** browser only. Chrome or Edge on Windows is the reference [ASSUMPTION]. Printing uses the browser print dialog; the built app already hides `.no-print` elements in print.
- **Connectivity:** the office connection is assumed acceptable (PRD 6.2, offline out of scope). Pages should still load on a slow mobile connection (PRD 6.3).

## Role Homes

Each role lands on its own home. Names are the PRD glossary roles.

| Role | Home shows | First action | Cannot do |
|---|---|---|---|
| Secretary (Mado) | "Enregistrer un paiement" button, today's payments, shortcut to Impayés | Record a payment | Void, configure, delete |
| Collections staff (Mme Biya) | Impayés filtered "sans moratoire active", relance bar | Select and relance | Grant a Moratoire |
| Director (M. Essomba) | Promises broken and due within 3 days, then Impayés | Open a broken Promise | Void payments [ASSUMPTION: void is Administrator only, PRD FR-8] |
| Founder (M. Tchoumi) | Tableau de bord: clickable totals with overdue buckets, then event list | Read a total, drill in | Any write (PRD FR-24) |
| Store keeper (M. Fotso) | Fournitures by class, outstanding items | Record items received | Money writes |
| HR-payroll officer | Personnel et paie | Record a payroll entry | Closing |
| Administrator (Mme Ngo) | Clôture du jour, backup status, audit log | Close the cash | Nothing restricted |

[ASSUMPTION: role homes are a design proposal from the research summary and the PRD. The roles are provisional (PRD Q6) and may merge in a real school.]

## Printed Artifacts

Paper is part of the product. The stamp is the trust signal parents already know (PRD Vision).

### Receipt (Reçu)

- **Formats:** A5, A4 and 80 mm thermal, as already built (PRD FR-7).
- **Printing point:** the last step of a payment, after confirmation. Printing is offered; it is not forced.
- **Content, top to bottom:** school header (name, address, phone); receipt number and date (Douala time); Élève and Classe; Tranche or Fee; amount paid in `FCFA` format; method; Reste à payer after this payment; Reçu par (the user who recorded it).
- **QR code:** bottom corner, encodes the receipt reference. [ASSUMPTION: the QR's target is a verification page or the reference text; the sources only say "QR on receipts".]
- **Stamp area:** a clearly boxed empty area marked "Cachet de l'école", bottom right, large enough for a round stamp. [ASSUMPTION: size; confirm with a real stamped receipt, PRD Q9.]
- **Signature:** a line marked "Signature" beside the stamp area.
- **Voided receipt:** the word "ANNULÉ" printed across the sheet with the void reason. [ASSUMPTION.]
- **Colours:** black on white only.

### Avertissement

- **Format:** A4 (PRD FR-15).
- **Content:** school header; Élève and Classe; amount due and date; the same wording as the WhatsApp Reminder (PRD FR-15); the Promise date if a Moratoire is open.
- **Stamp and signature:** same boxed areas as the Receipt.
- **Logging:** printing writes a Reminder entry marked "paper" (PRD FR-15).
- **Use:** handed to the Élève to carry home (PRD UJ-4).

## Key Flows

[ASSUMPTION: pupil names, classes and amounts in these flows are illustrative, not from pilot data.]

### Flow 1: Mado records a payment and prints the receipt (UJ-2)

1. Mado searches "Mbarga" and picks the pupil, Classe CE2.
2. The pupil's card shows Tranche 2, Reste à payer 45 000 FCFA.
3. She types 45 000 in the amount field, picks Orange Money, clicks "Enregistrer le paiement".
4. A confirmation repeats the amount and the new balance; she confirms.
5. The receipt preview opens; she prints it on the A5 printer.
6. **Climax:** the printed receipt shows the stamp box and "Reste à payer : 0 FCFA", and the Impayés list has already dropped the row.

Edge: she typed 54 000 by mistake. Only the Administrator can void; the voided payment stays visible with the reason.

### Flow 2: Mado imports the school on her own (UJ-1)

1. She downloads the template and the filled sample from Élèves.
2. She copies her sheet into the template and uploads it.
3. The preview lists row errors in French: "Classe inconnue ligne 14 : CM3 B", with the valid class list.
4. She fixes three rows in Excel and re-uploads. Nothing is duplicated.
5. **Climax:** the preview reads "212 élèves, 0 erreur". She confirms and the Impayés list fills.

Resolution: she keeps her paper notebook; re-uploads later do not create duplicates (PRD FR-4).

### Flow 3: Mr Essomba grants a Moratoire (UJ-3)

1. He opens Élève "Ndongo" from Impayés.
2. He clicks "Nouvelle moratoire", adds a Promise: 30 000 FCFA on the 15th.
3. He confirms; a WhatsApp confirmation goes to the parent [ASSUMPTION: needs approved WhatsApp templates].
4. Days later, the 15th passes with only 10 000 FCFA received.
5. **Climax:** the Moratoire list shows the Promise "Partiellement tenue, reste 20 000 FCFA", and after the 3-day grace it shows "Non tenue" at the top of his list.

He decides the next step himself: call, new Moratoire or Avertissement. The app does not act.

### Flow 4: Mme Biya works the owing list on Monday (UJ-4)

1. She opens Impayés, filters Classe CM1 and "sans moratoire active".
2. She selects the pupils and clicks "Relancer par WhatsApp (12)".
3. The result list shows 11 sent and one "Numéro invalide": the row stays flagged.
4. For the parents without WhatsApp she prints Avertissements on A4.
5. **Climax:** each pupil row now reads "Relancé le 20 oct. 2026", and the printed Avertissements are stamped and sent home.

### Flow 5: Mr Tchoumi checks the school's money from his phone (UJ-5)

1. He opens the app on his phone; the Tableau de bord loads with the role home.
2. He reads "Encaissé ce trimestre", "Total dû", "Caisse" and the overdue buckets; each tile opens its list.
3. The Caisse tile shows "Clôture manquante" because the day was not closed.
4. He opens the event list and sees an expense with no category.
5. **Climax:** instead of a reassuring cash figure, he sees "Clôture manquante" and the uncategorised expense; he asks the Director about it outside the app.

He never edits anything; the screen has no write control.

## Open items

- PRD "phone first" (FR-6, FR-25, 6.3) conflicts with computer first (memlog). Update the PRD.
- Payment entry on the desktop: the three-tap target is a phone measure. A desktop equivalent (keyboard flow) is not specified.
- Receipt QR target, receipt number format, and the "Reçu par" field need a decision.
- French labels for Pupil, Balance and Receipt are proposals.
- Voice form "vous" and error copy wording need a check with the pilot secretary.
- Role homes depend on the provisional roles (PRD Q6).
- Stamped receipt and avertissement samples from the pilot school (PRD Q9).
- Whether Tier 3 sections stay hidden or show as "bientôt disponible".
