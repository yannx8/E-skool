---
status: draft
created: 2026-10-20
updated: 2026-10-20
sources:
  - ../prd-eskool/prd-eskool.md
name: E-skool
description: Calm banking-counter design system for a school fee ledger. Computer first, light mode only, French UI.
colors:
  primary: '#0f5e5b'
  primary-hover: '#0b4846'
  primary-soft: '#d7ebe9'
  on-primary: '#ffffff'
  background: '#eef3f3'
  surface: '#ffffff'
  text: '#0c1f1e'
  text-muted: '#3d5a58'
  border: '#6f8c8a'
  success: '#256b3a'
  warning: '#8a4b08'
  danger: '#b42318'
  info: '#155e75'
typography:
  body:
    fontFamily: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.5'
  heading-lg:
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
  heading-md:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  amount-lg:
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
rounded:
  sm: 6px
  DEFAULT: 8px
  md: 8px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  touch-target: 44px
  sidebar: 240px
  page-margin: 24px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label}'
    rounded: '{rounded.DEFAULT}'
    height: '{spacing.touch-target}'
    padding: '0 {spacing.4}'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.on-primary}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    borderColor: '{colors.border}'
    typography: '{typography.label}'
    rounded: '{rounded.DEFAULT}'
    height: '{spacing.touch-target}'
  button-danger:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.danger}'
    borderColor: '{colors.danger}'
    typography: '{typography.label}'
    rounded: '{rounded.DEFAULT}'
    height: '{spacing.touch-target}'
  input-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    borderColor: '{colors.border}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    height: '{spacing.touch-target}'
  input-amount:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    borderColor: '{colors.border}'
    typography: '{typography.amount-lg}'
    rounded: '{rounded.sm}'
    height: '{spacing.touch-target}'
  nav-sidebar:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    borderColor: '{colors.border}'
    width: '{spacing.sidebar}'
  nav-item-active:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    height: '{spacing.touch-target}'
  table-row:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    borderColor: '{colors.border}'
    typography: '{typography.body}'
    height: '{spacing.touch-target}'
  status-ok:
    textColor: '{colors.success}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
  status-due:
    textColor: '{colors.warning}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
  status-broken:
    textColor: '{colors.danger}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
  status-info:
    textColor: '{colors.info}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
  kpi-tile:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    borderColor: '{colors.border}'
    typography: '{typography.amount-lg}'
    rounded: '{rounded.DEFAULT}'
    padding: '{spacing.5}'
  receipt-sheet:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    borderColor: '{colors.text}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
---

## Brand & Style

E-skool is a counter, not a dashboard. The register is the one the theme names, "Calme bancaire": the calm of a bank teller's window, neutral and reassuring. A parent, a secretary and a founder should each feel that the numbers are being handled carefully by someone with nothing to hide. The product is a shadow ledger; its look must make the figures trusted, not impressive.

Surfaces are white on a pale cool grey. Teal is the only brand colour and it is used for actions and selection, never for decoration. Numbers are the hero: balances, amounts and totals carry the most weight on screen. There are no illustrations in the core flows and no gradients.

The Director and Founder views may be denser than the daily-entry screens (PRD 6.3). Density never reduces the 16 px text floor or the 44 px target size.

## Colors

The palette is the "Calme bancaire" theme, chosen by the owner. Every text pair passes WCAG AA; the border colour reaches 3.6:1 against the white surface, enough for input outlines.

- **primary `#0f5e5b`**: the one action colour. Primary buttons, active navigation, links and the focus ring. Never used for a status.
- **primary-hover `#0b4846`**: hover and pressed state of primary buttons only.
- **primary-soft `#d7ebe9`**: selected rows, the active sidebar item, and the highlight of a row a user just acted on. Text on it uses `primary`.
- **on-primary `#ffffff`**: text on primary buttons (AA-checked in the theme file).
- **background `#eef3f3`**: the app canvas behind the sidebar and content.
- **surface `#ffffff`**: cards, tables, forms, sidebar, dialogs and the on-screen receipt preview.
- **text `#0c1f1e`**: all body text, amounts and labels.
- **text-muted `#3d5a58`**: helper text and metadata such as "Relancé le {date}". Muted text is never the only carrier of an amount or a status.
- **border `#6f8c8a`**: input outlines, table dividers and card outlines.
- **success `#256b3a`**, **warning `#8a4b08`**, **danger `#b42318`**, **info `#155e75`**: status meaning only. Each one is always paired with a text label and an icon. Danger is reserved for voids, broken Promises and refused actions.

Not used for: decoration, hero areas, large fills behind text, or the primary action in a colour other than primary. [ASSUMPTION: charts, if any, use primary and neutrals only; no chart palette exists in the sources.]

## Typography

One family: the system UI stack, inherited from the built app (memlog: "system font stack"). No web font is loaded.

- **body** 16 px / 1.5, weight 400: all running text, table cells, form help.
- **label** 16 px / weight 600: buttons, field labels, status labels, navigation items.
- **heading-md** 20 px / weight 600: section titles inside a page.
- **heading-lg** 24 px / weight 700: page titles.
- **amount-lg** 24 px / weight 700: totals on the Founder overview and the amount field on the payment form.

The floor is 16 px for every text element, including table cells, helper text, badges and printed receipts. There is no caption size. Amounts use tabular figures (the existing `.tabular` utility) so columns line up.

Amounts are integer FCFA with a space as thousands separator: `45 000 FCFA`. [ASSUMPTION: a non-breaking space is used so an amount never wraps between its digits and "FCFA".] Dates follow Douala time in French: `20 oct. 2026`. [ASSUMPTION: short month names with a dot, consistent with French typesetting; no source fixes the format.] No all-caps labels.

## Layout & Spacing

Spacing is a 4 px base: 4, 8, 12, 16, 24, 32. Related elements sit 8 or 12 px apart; sections are separated by 24 or 32 px. Page margin is 24 px.

The design target is 1366 px desktop width (memlog decision). The left sidebar is 240 px wide and fixed. Content fills the remaining width with a single column for forms and a table or grid for lists. Every interactive element is at least 44 px high (`{spacing.touch-target}`), including table rows. [ASSUMPTION: 44 px also applies to table rows on the Director and Founder views, so density comes from fewer columns and not smaller targets.]

Below 768 px the sidebar collapses into a top bar with a menu button. [ASSUMPTION: breakpoint chosen by the designer; the PRD only requires that the Founder overview works at 360 px without horizontal scrolling (FR-25).]

## Elevation & Depth

Flat. Hierarchy comes from the canvas (`background`) versus the surface (`surface`), and from `border` outlines. Shadows are not used to rank content. [ASSUMPTION: the built app's subtle card shadow may be kept on dialogs only, for the overlay edge.]

## Shapes

Two radii. Inputs and status labels use `{rounded.sm}` (6 px). Buttons, cards, tables and dialogs use `{rounded.DEFAULT}` (8 px). Nothing is pill-shaped except a status label if one is chosen later. [ASSUMPTION: buttons at 8 px rather than 6 px, within the memlog range of 6 to 8 px.] Printed artifacts use square corners, because paper is cut square.

## Components

Anatomy and tokens are in the frontmatter. Behaviour is in `EXPERIENCE.md`.

- **button-primary**: one per screen for the main action ("Enregistrer le paiement", "Relancer", "Imprimer"). Hover uses `button-primary-hover`. Height `{spacing.touch-target}`.
- **button-secondary**: every other safe action, on `surface` with a `border` outline.
- **button-danger**: Void and other destructive confirmations. Text and outline in `danger`, never a filled red button; the confirmation dialog repeats the label.
- **input-field / input-amount**: label always visible above the field. The amount field is right-aligned, uses `amount-lg`, accepts digits only and shows the `FCFA` suffix outside the input.
- **nav-sidebar / nav-item-active**: school vocabulary, 240 px, `primary-soft` background on the active item with `primary` text.
- **table-row**: `text` on `surface`, `border` dividers, the whole row is the tap target. Money columns use `.tabular` and right alignment.
- **status-ok / status-due / status-broken / status-info**: text label plus icon, colour secondary. Mapping: kept Promise and paid balance use ok; partially kept and open Promise use due; broken Promise and refused action use broken; a neutral event such as "Relancé" uses info. [ASSUMPTION: this status-to-colour mapping is inferred; the sources name the statuses (open, kept, partially kept, broken) but not their colours.]
- **kpi-tile**: one total per tile, `amount-lg`, whole tile is a link to the list behind the number (memlog: every total drills to a list).
- **receipt-sheet**: the on-screen preview of the printed Receipt. Same tokens as paper, see Printed Artifacts in `EXPERIENCE.md`.

Focus ring: 3 px outline in `primary` at 55% opacity, already in the built app (`:focus-visible`). It is never removed.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `primary` for the one main action on a screen | Use teal as decoration or for a status |
| Show every status with a word and an icon | Rely on `success`, `warning` or `danger` colour alone |
| Keep amounts in `{typography.amount-lg}` or tabular body with `FCFA` | Show decimals, or write amounts without the FCFA unit |
| Keep every text at 16 px or more | Use captions, small grey print or all-caps labels |
| Drill from every total to the list behind it | Show a total with no way to see its rows |
| Use borders and surface contrast for hierarchy | Add shadows or gradients to rank content |
| Keep Founder screens free of write buttons, or hide them | Show a disabled "Enregistrer" button on the Founder view |

## Open items

- PRD 6.3 and the NFR still say "phone first" for daily entry. The memlog says computer-first. The PRD must be updated before this design is final.
- Icon set is not chosen. Status labels need one; pick it at build time.
- Status colour mapping and the chart palette need a visual check with the pilot school.
- The receipt and avertissement paper formats (A4, A5, 80 mm) need a stamped sample from the pilot school (PRD Q9).
- Logo: none yet. The wordmark is text only in `heading-lg`.
- Font stack depends on the Windows and Android fonts available at the school; test on the office computer.
