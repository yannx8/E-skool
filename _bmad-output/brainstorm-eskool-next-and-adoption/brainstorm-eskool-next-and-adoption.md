# E-skool Next Steps and Douala Adoption: Intent

Source: brainstorm memlog (2026-10-18). Tags: [user] = user decision or insight, [coach] = coach idea or research, [inferred] = not verified by the log.

## Intent

E-skool is a school finance transparency and accountability system for private primary schools in Douala. It is not a full school ERP. It tracks everything that touches money in a primary school (pupil fees, moratoires, in-kind supplies, payroll, expenses, school assets) so the founder, director and specialized staff can see the exact state of the money. It stays Excel- and paper-compatible and sends WhatsApp messages out only. [user, decided]

## Problem and root cause

- Schools already use Excel sheets, physical registers and notebooks. Their tools are "good enough", and switching costs more than it saves: every pupil and fee must be re-keyed. [user]
- The losses are real but unseen: unpaid fees nobody chases. Nobody owns tracking who owes what. Chasing parents face to face is socially awkward, so it is skipped. Data sits in scattered notebooks, so nobody can add it up. [user]
- Directors already know about the losses. Awareness is not the gap. A "show them the number" pitch will not sell. [user]

## Buyer and users

- Buyer: the founder (decides to buy). Founder is read-only for visibility. [user]
- Users: director, founder, specialized staff, app administrator. Parents are NOT users; they only receive WhatsApp reminders. [user]
- Roles are provisional. Role model stays flexible until tested in a real school. [user]
- Candidate roles (coach proposal, untested): Founder, Director, Bursar/Accountant, Collections officer, HR/payroll officer, Store keeper, Secretary, App admin. [coach]
- Low-level staff (secretary/intake) have the digital literacy gap. Director and founder are comfortable with computers. [user]

## Core value

- Transparency is the core strength. [user]
- Founder sees a full overview of all school money in the app, and whether there is a monetary problem, where money goes and how staff manage it. [user]
- Moratoire as a tracked promise: parent commits a payment date, system flags broken promises and escalates to the director. [coach]
- Printable stamped receipt and printable "avertissement" (with stamp and signature space) as paper twins of WhatsApp reminders. Today the school uses stamped receipts and pupil-relayed avertissements on official paper. [user insight, coach design]
- Dedicated staff get the exact owing list per pupil and monitor all debts. [user]
- In-kind supplies ledger: per-class supply list (A4 ream, chalk, toilet paper), per pupil expected vs received; shortfall convertible to FCFA or carried forward. [coach, user scope]
- Payroll tracking (HR/payroll officer monitors wages). Tracks money, does not move it. [user]
- Asset and consumable tracking. [user]

## Day-one must-haves and onboarding

- Must-haves for a first real school: (1) import existing Excel of pupils and fees, (2) record a payment, (3) show the director the exact who-owes-what list. [user]
- Secretary imports alone from a provided template, no on-site help assumed. [user]
- Implication (coach): import must give clear per-row errors in plain French, a preview before commit, safe re-import, a sample file. Import quality is the adoption gate. [coach]
- Phone-first screens, big buttons, 3-tap payment flow, FR with simple vocabulary, one-page printed cheat sheet, 15-min training script, "paper receipt book still works" fallback. [coach]

## Decisions and out of scope

Decided [user]:
- Single-school only. Multi-tenant / multi-school out of scope.
- No parent app. Parents are not active users.
- No founder approvals, no blocking payments, no in-app questions, no approve/refuse powers.
- No wage payment from a school account. Payroll is tracked, not paid.
- No grades or report cards.
- Not a full ERP. Not a replacement for Excel or paper: the secretary keeps the notebook; E-skool is a shadow ledger fed by register photo or Excel upload. [coach proposal, adopted in vertical decision]
- Rule for the session: every feature must map to a real pain founders would pay for.

## Market and competition

- Private primary = 26.9% of primary enrollment (~1.38M pupils). Internet use 43.9%. MoMo ~7M users, Orange Money ~5M. [coach research, not re-verified]
- No count of private primary schools found. [gap]
- Competitors (Cameroon): SchoolMboa, Akademise, EduCam Pro, Kalara, Ubora Ecoles, Skoulou, EduManager Pro, Akademi. All lead with grades/report cards and mobile-money fee collection. [coach research]
- Pricing seen: SchoolMboa 250k FCFA one-time (+50k stock module); EduCam Pro 16k/month (200 pupils), 35k/month (500); Kalara 500 FCFA/pupil/year. Cannot win on price. [coach research]
- Cameroon private primary cost context: tuition 150k-800k FCFA/yr; back-to-school total 250k-900k. [coach research]
- Inferred gap, unverified, no user complaints found: founder-level transparency, moratoires as tracked promises, per-pupil in-kind ledger, payroll + expenses + fees in one view. Needs 5-10 director interviews. [inferred]

## Risks

- Digital literacy of low-level staff (secretary/intake) is the main death risk, not politics. [user]
- Never run end-to-end against a live Supabase. First real login is the first E2E test. [coach, from code state]
- Willingness to pay unvalidated. Pricing model (per term, per year, per pupil) not decided. [user, coach]
- Programmed wage payment would move real money (payout APIs, compliance). Kept out of scope. [coach]

## Open questions to validate in pilot

Priority [user]:
- Q1: What does the founder check first when opening the app?
- Q3: Where do schools keep fee records today (one Excel, many, notebook)?
- Q4: Why would a founder pay for transparency instead of trusting the director?

Also open:
- How much a school loses per term to unpaid fees.
- How moratoires are handled today (verbal, written, nothing).
- Who chases parents and how often.
- How in-kind items are counted and by whom.
- Pricing model and in-kind counting: not decided.
- Real role split.

## Go-to-market

- Pilot school: a relative works at a primary school and the founder is a friend of the user's mother, so a test school is available. [user]
- Timing: school year started Oct 2026. Founder pitch lands in holidays ~Jul-Aug 2027, unless a school accepts a mid-year pilot. [coach]
- Before the pitch: first E2E run against live Supabase, 1-2 pilot schools. [coach]
