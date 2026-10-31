---
title: "Product Brief: E-skool"
status: final
created: 2026-10-29
updated: 2026-10-29
---

# Product Brief: E-skool

_Answers to the coaching questions were drafted by the BMad room at the user's request. Every `[ASSUMPTION]` needs the user's or the pilot school's confirmation._

## Executive Summary

E-skool is a school management platform (ERP) for private schools in Cameroon. It is built like clast.io: one shared online platform, one core, and modules each school switches on. It starts with **private primary schools** (francophone SIL–CM2 and anglophone Class 1–6), in French and English.

At least 15 local vendors already sell "all-in-one" software with report cards and Mobile Money. None of them can say how much money it brings the school. E-skool sells one promise and measures it every day: **"This term you collect more of your fees, on time, and you see every franc your staff took in."** Report cards and the parent portal are the daily habit that keeps the school in; fee collection is the number the promoter pays for.

Why now: Mobile Money is the normal way to pay, the State now runs official secondary-school fees through `cartescolaire.cm` with a single pupil ID (the "matricule unique"), the data-protection law (2024/017) is in force since June 2026, and no local vendor has more than about 120 schools.

## The Problem

- **Fees come in late, partly, or never.** Directors know who owes, but chasing parents face to face is awkward, moratoires (payment delays a parent negotiates) live in a notebook, and nobody owns the follow-up. Telling them "you lose money" does not sell: they already know (pilot interviews, 2026-10).
- **Cash leaks between the cashier and the promoter.** The promoter (the school's owner) cannot tell what was collected today, by whom, and where it went.
- **Report cards eat days every term.** Teachers hand-write marks, secretaries copy them, averages are computed by hand. The francophone primary format moved to competency grids (A / ECA / NA) that parents find confusing. `[ASSUMPTION: format and evaluation rhythm to confirm on real cards]`
- **Parents chase the school** for their balance and report cards by phone and WhatsApp.

## The Solution

1. **Fees that collect themselves:** a fee plan by class (registration + tranches with due dates), cash or MTN/Orange Money payments recorded with their transaction reference, receipts showing the balance left, moratoires as tracked instalment plans the director approves, and a daily "remind today" list sent through WhatsApp.
2. **Promoter view:** expected vs collected vs late vs under moratoire, per class and per tranche, compared with last year; a daily cash closing per cashier with the gap shown.
3. **Report cards in hours:** teachers enter evaluations on their phone; the school prints bilingual report cards in the official format for its subsystem, each with a QR code anyone can scan to check it is genuine.
4. **Parent portal:** each family sees its balance, receipts, instalment plan and report cards, and can ask for a moratoire.

## What Makes This Different

Honest version: no technical moat. The edge is a measurable promise plus a way to sell it that rivals do not use.

- **Collection rate is the headline number.** Collected ÷ expected, at each tranche deadline. It shows on the first screen, is compared with the same tranche last year, and goes into a term report the promoter can forward. No rival markets an outcome; they market features.
- **"Pay when it works" offer:** the first term is free; from term 2 the school pays only if its collection rate beat its own baseline. `[ASSUMPTION: needs a baseline taken from the school's notebooks before go-live]`
- **Moratoires and cash closing done properly.** Only 2 of about 15 rivals even mention moratoires; none markets cash control for the promoter.
- **One school done deeply before many done badly.** A pilot school in Douala is reachable now: a relative works there and the founder knows the family.

## Who This Serves

- **Promoter / founder (buyer):** owns the school, often runs nursery + primary. Wants to trust the numbers without asking. Success: sees the collection rate and today's cash on a phone.
- **Director:** runs the school day to day. Grants moratoires, chases parents, signs report cards. Success: one list of who to chase today; report cards done in a day.
- **Bursar / cashier:** takes payments at the counter. Success: a payment and its receipt in under a minute.
- **Teacher:** enters evaluations. Success: marks on a phone, no recopying.
- **Parent:** pays and follows their child. Success: knows the balance and gets report cards without calling.

## Success Criteria

| Signal | Target | By |
|---|---|---|
| Pilot school live with real pupils and fees | 1 school | Jan 2027 (term 2) |
| Collection rate at the term-2 tranche deadline vs the same tranche last year | +10 points `[ASSUMPTION]` | Mar 2027 |
| Daily cash closing done | ≥ 90% of school days | term 2 |
| Report cards for a whole term | produced in ≤ 1 working day | term 2 |
| Parents who opened the portal | ≥ 40% of families `[ASSUMPTION]` | term 3 |
| Paying schools after the summer pitch window (Jul–Aug 2027) | 5 | Oct 2027 |
| Schools that renew the next term | ≥ 80% | Jan 2028 |

## Scope

**In (MVP, primary schools):**
- **Core:** school setup (years, terms, levels, classes, and subsystem per class), pupils and families, staff list, users and roles, Excel import, audit log, FR/EN interface. One shared online platform, with each school's data kept apart.
- **Fees:** fee plans, payments (cash, MTN, Orange, with reference), receipts (A5 / 80 mm), voiding instead of deleting, moratoires with approval, WhatsApp reminders through pre-filled links, cash closing, promoter dashboard.
- **Academics:** evaluations, competency or mark grids per subsystem, report cards as PDF with a QR check.
- **Parent portal:** balance, receipts, instalments, report cards, moratoire request.

**Out (MVP):** payroll and HR beyond the staff list, attendance, timetable, transport, canteen, library, inventory, online courses (LMS), AI, Mobile Money and SMS APIs, secondary schools, universities (LMD), vocational centres (MINEFOP), native apps, multi-campus groups.

**Open:** stack (default Next.js + Postgres), exact report-card format per subsystem (collect real cards), whether a school may hold report cards back while fees are unpaid (a setting decided by a person, never automatic), data-protection authorisation for minors' data (get legal advice).

## Vision

In 2–3 years E-skool is the platform Cameroonian school groups run on, from nursery to secondary, then training centres. Promoters compare their collection rate with schools like theirs, and Mobile Money payments reconcile themselves. Every module (secondary sequences, payroll, attendance, transport, LMD) plugs into the same core the primary MVP proves.
