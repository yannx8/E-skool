# E-skool PRD addendum

## Role mapping (provisional, until the pilot)

Built roles: `admin` (all), `owner` (read-only audit, HR, finance, enrollment, exports), `secretary` (record payments, edit/import pupils, send reminders, enrollment). Only `admin` voids payments, promotes pupils, manages discounts, setup, users, HR and finance.

PRD actors mapped as permissions, to be split into roles only if the pilot shows separate people:

| Actor | Starting role | Notes |
|---|---|---|
| Founder | owner | read-only overview |
| Director | admin | moratoires, in-kind conversion |
| Administrator | admin | users, setup, void, backup |
| Secretary | secretary | import, payments, receipts |
| Collections staff | secretary | reminders, avertissements, owing list |
| HR-payroll officer | admin or new role | payroll tracking |
| Store keeper | new permission | in-kind, stock, assets |

## Market and competition (sourced from the brainstorm research; not re-verified)

- Private primary is 26.9% of primary enrollment (about 1.38M pupils); internet use 43.9%; MoMo about 7M and Orange Money about 5M users. No count of private primary schools found.
- Cameroon competitors: SchoolMboa, Akademise, EduCam Pro, Kalara, Ubora Ecoles, Skoulou, EduManager Pro, Akademi. They lead with grades and report cards, plus mobile-money fee collection. Payment rails: Schooly Payment (skulpay.cm), Ecobank EDUC.
- Prices seen: SchoolMboa 250,000 FCFA one-time (stock module +50,000); EduCam Pro 16,000 FCFA/month (200 pupils) or 35,000 (500); Kalara 500 FCFA per pupil per year.
- Cameroon private tuition: 150,000 to 800,000 FCFA per year; back-to-school total 250,000 to 900,000.
- No user complaints about competitors were found; "where they fail" is inferred. Interview 5 to 10 Douala directors.

## Built vs new (from code inventory, 2026-10-20)

Built: fees and discounts, payments with receipts (A5/A4/80 mm), void, owing list and export, manual and automatic WhatsApp reminders (off by default, weekday cron), enrollment pipeline, token parent page (to be removed), HR and payroll, expenses, other income, cash book, closing and period locks, monthly report, Excel import (pupil, class, parent), promotion, weekly backup, audit log, module flags.
New: moratoires and promises, in-kind ledger, stock and assets, printable avertissement, founder overview, fees and opening balances in import, import preview and safe re-import.
