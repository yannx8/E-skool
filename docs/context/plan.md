# School Manager: Full Plan (PRD, SRS, Design, DB, Backend, Implementation)

Status: side project for the author's mother's primary school in Douala. Not a business. V1.0 (fees module) is specified in `school-v1-master-prompt.md`. This document covers the full app, but only V1.0 is detailed to build level. Later modules are specified at the level needed to avoid schema regret, and each is gated (see section 1.4).

Assumptions are marked (A). Facts about Cameroonian labor and tax law are NOT stated here as facts: rates are configurable and must be confirmed with the school's accountant.

---

## 1. PRD

### 1.1 Problem
The administrator (the author's mother) runs most school administration by hand: paper registers and Excel for fees, receipts, enrollment and staff records. She is the central hub because the school lacks staff and trust. Consequences: slow receipts, no instant view of who owes what, chasing parents is manual and inconsistent, and the owner has little visibility into money.

### 1.2 Users and roles
| Role | Who | Access |
|---|---|---|
| admin | Mother (day to day) | Everything except deleting history |
| owner | School founder (A: wants visibility) | Read-only dashboards and finance reports |
| secretary (V2) | Future staff | Pupils and payments only, no HR, no finance reports |

V1.0 ships with one admin account. The owner role is added in V1.2 because visibility is the trust fix.

### 1.3 Goals and success metrics (30 days after V1.0 goes live)
- 100% of fee payments recorded in the app, receipt printed from the app.
- Time to record a payment and print a receipt: under 60 seconds.
- Time to answer "who owes what for term N": under 10 seconds.
- Administrator uses it unprompted for 3 consecutive weeks.
- Zero payments lost or silently altered (audit log complete).

### 1.4 Scope tiers and gates
| Tier | Content | Gate to start |
|---|---|---|
| V1.0 | Pupils, classes, fees, payments, receipts, balances, unpaid list, WhatsApp click-to-send, audit log | Now (2 days capped) |
| V1.1 | Staff and HR basics, payroll register | V1.0 used for 2 weeks by the admin |
| V1.2 | Expenses, cash book, daily cash closing, owner role and reports | V1.1 done or admin asks for finance first |
| V2 | Enrollment pipeline, parent portal link, automatic reminders, secretary role | Admin and owner both asked for it |
| Generalize | Multi-school, pricing, other schools | Only after the bet decision on 2026-11-11 and 3 other directors asking to pay (see bet rules) |

### 1.5 Non-goals
Grades and report cards, attendance, timetables, online payment collection, accounting software replacement, multi-school in V1.x, native mobile app, offline-first.

### 1.6 Key risks
1. Data migration from Excel is messy (highest risk for adoption).
2. Admin stops using it after the first week because it is slower than paper (mitigation: speed targets above).
3. Scope creep eats the time budget of the main business bet (mitigation: tiers and gates).
4. Mobile money references are typed by hand and mistyped (mitigation: optional field, duplicate warning).
5. Single-admin bus factor: one account, one person. (Mitigation: weekly automated backup export.)

### 1.7 Assumptions to validate with the admin
- A1: Fees are charged per term, with a fixed amount per class. (If yearly with installments, adjust `fee_schedules`.)
- A2: Siblings get no discount in V1. (If they do, add `discounts`.)
- A3: Registration fee and other one-off fees (uniform, books) exist. Handled in V1.0 as a `fee_type` on schedules, see DB.
- A4: She uses a phone and a laptop, with unreliable connectivity at times.
- A5: The owner wants read-only visibility.

---

## 2. User journeys

**J1: Record a payment (daily, most important).**
Parent arrives with cash or a mobile money confirmation, admin opens the app, taps "Enregistrer un paiement", searches the pupil by name, term is preselected, amount is prefilled with the remaining balance, she adjusts it, picks the method, saves, the receipt opens, she prints or saves as PDF and hands it over. Target: under 60 s.

**J2: Chase unpaid fees (weekly).**
Admin opens "Impayés", picks the term, filters by class, sees pupils sorted by amount owed, taps "Relancer sur WhatsApp" on a row, WhatsApp opens with the message prefilled, she sends it. The row shows "Relancé le <date>" afterwards (V1.0 logs the click, not delivery).

**J3: Start of school year (yearly).**
Admin creates the new school year, copies classes and fee schedules from last year and edits amounts, imports pupils via CSV or promotes last year's pupils to the next class in bulk, reviews errors, confirms.

**J4: Correct a mistake.**
Admin finds the payment on the pupil page, taps "Annuler ce paiement", enters a reason, confirms, then records the correct payment. Voided payment stays visible, struck through.

**J5: Pay staff (monthly, V1.1).**
Admin opens "Paie", selects the month, the register lists active staff with agreed salary, she enters advances or deductions, marks each as paid with method and date, prints a payslip.

**J6: Owner check (weekly, V1.2).**
Owner logs in, sees collected vs expected, expenses, balance, top debtors by class (read-only), exports a monthly PDF.

**J7: Close the day (daily, V1.2).**
Admin opens "Clôture de caisse", the app shows expected cash (cash payments minus cash expenses), she enters counted cash, the app records the difference and locks that day's entries.

---

## 3. SRS

### 3.1 Functional requirements (IDs for traceability)
**Auth**
- FR-A1 Email/password login. FR-A2 No public sign-up. FR-A3 Session timeout 30 days with re-login. FR-A4 Roles enforced by RLS.

**Setup**
- FR-S1 CRUD school years, one current. FR-S2 CRUD classes. FR-S3 CRUD fee schedules per (year, class, fee type, term). FR-S4 Copy schedules from previous year. FR-S5 School profile (name, address, phone, logo) used on receipts.

**Pupils**
- FR-P1 CRUD pupils with parent contact. FR-P2 Search and filter. FR-P3 CSV import with preview and error report. FR-P4 Bulk promote to next class. FR-P5 Deactivate, never delete. FR-P6 Parent phone validation and normalization.

**Payments**
- FR-Y1 Record payment (pupil, fee, term, amount, method, reference, date). FR-Y2 Sequential receipt number per school year. FR-Y3 Printable receipt with amount in French words. FR-Y4 Void with mandatory reason. FR-Y5 Duplicate warning (same pupil, amount, date, method, or same reference). FR-Y6 Overpayment allowed, shown as credit carried to the next term (A: simplest honest handling).

**Balances and reminders**
- FR-B1 Computed status per pupil and term. FR-B2 Yearly totals. FR-B3 Unpaid list with filters and CSV export. FR-B4 WhatsApp click-to-send with templated message. FR-B5 Log each reminder click (pupil, term, user, time).

**HR (V1.1)**
- FR-H1 CRUD staff (role, contract type, start date, agreed monthly salary, phone). FR-H2 Deactivate, never delete. FR-H3 Monthly payroll register with advances and deductions. FR-H4 Mark salary paid (method, date), printable payslip. FR-H5 Salary change history.

**Finance (V1.2)**
- FR-F1 Record expenses by category with receipt photo upload. FR-F2 Record other income (donations, rentals). FR-F3 Cash book (all money in and out by method). FR-F4 Daily cash closing with difference. FR-F5 Monthly summary and owner dashboard. FR-F6 Period lock (closed months cannot be edited, only corrected by a dated adjustment).

**System**
- FR-X1 Audit log on every money-related and person-related table. FR-X2 Weekly automatic backup export (CSV zip) to the admin's email or storage. FR-X3 Manual export of all data.

### 3.2 Non-functional requirements
- Performance: list pages under 1 s for 500 pupils on a mid-range Android phone on 3G (A).
- Availability: relies on Supabase and Vercel free tiers, no SLA. Backup export (FR-X2) is the safety net.
- Security: RLS on all tables, HTTPS only, no secrets in client, password reset via email, admin must use a strong password. Phone numbers and names are personal data: no analytics trackers, no third-party scripts.
- Auditability: no hard delete on financial or person tables; append-only audit log.
- Usability: French UI, minimum touch target 44 px, text size at least 16 px, status never conveyed by color alone.
- Money: integers in FCFA only, no floats anywhere.
- Maintainability: one repo, migrations in version control, generated TypeScript types from the DB.
- Compliance (A, unverified): Cameroon has a personal data protection law; keep data minimal and in the school's own Supabase project. Confirm obligations before any generalization.

### 3.3 Business rules
- BR1 Status per pupil and term: solvable if paid >= due; partiel if 0 < paid < due; insolvable if paid = 0 and due date passed; pas encore dû otherwise.
- BR2 Voided payments never count.
- BR3 A payment belongs to one pupil, one school year, one term, one fee type.
- BR4 Receipt numbers are never reused, even after voiding.
- BR5 Overpayment: surplus is a credit on the pupil, applied to the next unpaid term automatically in the balance view.
- BR6 Closed periods are immutable (V1.2).
- BR7 Staff salary changes create a new history row, never overwrite.

---

## 4. Database schema (Postgres / Supabase)

All money: `integer` FCFA. All tables: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `created_by uuid references auth.users`.

### 4.1 V1.0 (matches the master prompt, with fee types added)
```sql
create type payment_method as enum ('cash','orange_money','mtn_momo','bank');
create type fee_type as enum ('tuition','registration','uniform','books','other');

create table school_years (
  id uuid primary key default gen_random_uuid(),
  label text unique not null,           -- '2026-2027'
  is_current boolean not null default false,
  created_at timestamptz default now()
);
create unique index one_current_year on school_years (is_current) where is_current;

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null, sort_order int not null default 0
);

create table fee_schedules (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references school_years,
  class_id uuid not null references classes,
  fee fee_type not null default 'tuition',
  term smallint check (term in (1,2,3)),   -- null for one-off fees
  amount integer not null check (amount >= 0),
  due_date date not null,
  unique (school_year_id, class_id, fee, term)
);

create table pupils (
  id uuid primary key default gen_random_uuid(),
  last_name text not null, first_name text not null,
  class_id uuid not null references classes,
  school_year_id uuid not null references school_years,
  parent_name text, parent_phone text check (parent_phone ~ '^2376[0-9]{8}$'),
  notes text, is_active boolean not null default true,
  created_at timestamptz default now()
);
create index on pupils (school_year_id, class_id);
create index on pupils using gin (to_tsvector('simple', last_name || ' ' || first_name));

create table receipt_counters (
  school_year_id uuid primary key references school_years,
  last_number int not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references pupils,
  school_year_id uuid not null references school_years,
  fee fee_type not null default 'tuition',
  term smallint check (term in (1,2,3)),
  amount integer not null check (amount > 0),
  method payment_method not null,
  reference text, paid_at date not null default current_date,
  receipt_number text unique not null,     -- '2026-0001', set by trigger from receipt_counters
  voided boolean not null default false,
  voided_at timestamptz, voided_by uuid, void_reason text,
  created_by uuid references auth.users, created_at timestamptz default now(),
  check (not voided or void_reason is not null)
);
create index on payments (pupil_id);
create index on payments (school_year_id, term) where not voided;
create index on payments (reference) where reference is not null;

create table reminder_log (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references pupils, term smallint,
  channel text not null default 'whatsapp_link',
  amount_due integer, created_by uuid, created_at timestamptz default now()
);

create table settings (            -- single row
  id boolean primary key default true check (id),
  school_name text, address text, phone text, logo_url text,
  reminder_template text
);

create table audit_log (
  id bigint generated always as identity primary key,
  table_name text, record_id uuid, action text,
  before jsonb, after jsonb, user_id uuid, created_at timestamptz default now()
);
```
Rules enforced in SQL: no DELETE grant on `payments`, `pupils`, `audit_log` (RLS policy denies); `audit_log` is insert-only; a trigger assigns `receipt_number` atomically (`update receipt_counters ... returning`); a trigger blocks edits to `amount`, `pupil_id` and `receipt_number` after insert (corrections go through void).

### 4.2 Balance view (V1.0)
```sql
create view pupil_term_balance as
select p.id as pupil_id, fs.school_year_id, fs.term, fs.fee,
       fs.amount as due, fs.due_date,
       coalesce(sum(pay.amount) filter (where not pay.voided), 0) as paid,
       fs.amount - coalesce(sum(pay.amount) filter (where not pay.voided), 0) as remaining,
       case
         when coalesce(sum(pay.amount) filter (where not pay.voided),0) >= fs.amount then 'solvable'
         when coalesce(sum(pay.amount) filter (where not pay.voided),0) > 0 then 'partiel'
         when fs.due_date < current_date then 'insolvable'
         else 'pas_encore_du'
       end as status
from pupils p
join fee_schedules fs on fs.class_id = p.class_id and fs.school_year_id = p.school_year_id
left join payments pay on pay.pupil_id = p.id and pay.school_year_id = fs.school_year_id
     and pay.fee = fs.fee and pay.term is not distinct from fs.term
where p.is_active
group by p.id, fs.id;
```
Overpayment credit (BR5) is computed in a second view layered on this one in V1.1, not in V1.0.

### 4.3 V1.1: HR
```sql
create type contract_type as enum ('permanent','fixed_term','part_time','volunteer');
create table staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, role text not null, contract contract_type not null,
  phone text, start_date date, end_date date, is_active boolean default true,
  notes text, created_at timestamptz default now()
);
create table staff_salary_history (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff, monthly_amount integer not null check (monthly_amount >= 0),
  effective_from date not null, created_by uuid, created_at timestamptz default now()
);
create table payroll_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff, month date not null,   -- first day of month
  base_amount integer not null, advances integer not null default 0,
  deductions integer not null default 0, bonuses integer not null default 0,
  net_amount integer generated always as (base_amount + bonuses - advances - deductions) stored,
  method payment_method, paid_at date, status text not null default 'pending' check (status in ('pending','paid')),
  payslip_number text unique, notes text,
  unique (staff_id, month)
);
```
Statutory contributions (social security, taxes) are intentionally NOT computed (A: confirm with accountant). Add a `payroll_components` table later if needed.

### 4.4 V1.2: Finance
```sql
create table expense_categories (id uuid primary key default gen_random_uuid(), name text unique not null);
create table expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references expense_categories,
  amount integer not null check (amount > 0), method payment_method not null,
  spent_on date not null, description text, receipt_url text,
  voided boolean default false, void_reason text,
  created_by uuid, created_at timestamptz default now()
);
create table other_income (
  id uuid primary key default gen_random_uuid(),
  label text not null, amount integer not null check (amount > 0),
  method payment_method not null, received_on date not null,
  voided boolean default false, void_reason text
);
create table cash_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date unique not null, expected_cash integer not null,
  counted_cash integer not null, difference integer generated always as (counted_cash - expected_cash) stored,
  note text, closed_by uuid, closed_at timestamptz default now()
);
create table period_locks (month date primary key, locked_at timestamptz default now(), locked_by uuid);
create table adjustments (    -- corrections after lock
  id uuid primary key default gen_random_uuid(), month date not null,
  label text not null, amount integer not null, created_by uuid, created_at timestamptz default now()
);
```
Cash book is a view: union of non-voided payments (in), other_income (in), expenses (out), and payroll paid (out), grouped by date and method.

### 4.5 V2 additions (outline)
`enrollment_applications` (status pipeline), `discounts` (per pupil, per fee), `user_roles` (role per auth user), `parents` and `parent_pupils` (if one parent has several children), `message_jobs` (queued automatic reminders with status and provider response).

---

## 5. Backend architecture

- **Stack:** Next.js App Router (server actions and route handlers), Supabase (Postgres, Auth, Storage), Vercel hosting. No separate backend server.
- **Data access:** server actions call Supabase with the user's session so RLS applies. Business-critical writes (record payment, void, close day, lock month) go through Postgres functions (`rpc`) so they are atomic and testable in SQL.
- **Key functions:**
  - `record_payment(pupil_id, fee, term, amount, method, reference, paid_at)` returns the payment row with receipt number; checks duplicates and returns a warning flag.
  - `void_payment(payment_id, reason)`.
  - `import_pupils(rows jsonb)` returns inserted and rejected rows with reasons.
  - `promote_pupils(from_year, to_year, mapping jsonb)`.
  - `close_day(date, counted_cash, note)` (V1.2).
  - `lock_month(month)` (V1.2).
- **RLS pattern:** helper `auth_role()` reads `user_roles`. Policies: admin full read/write (no delete), owner select only on finance and balance views, secretary (V2) select/insert on pupils and payments only.
- **Storage:** private bucket `expense-receipts`, signed URLs, 5 MB limit, images only.
- **Jobs (Supabase scheduled functions or Vercel cron, free tier):** weekly backup export (FR-X2). V2: daily reminder queue.
- **Reminders roadmap:** V1.0 click-to-send. V2 options, to be evaluated with real cost and approval requirements (unverified): WhatsApp Business Cloud API (templates must be approved, paid per conversation), or SMS gateway. Decision criterion: only if the admin sends more than about 30 reminders per week by hand.
- **Observability:** Vercel logs plus Supabase advisors; one error boundary page in French.
- **Environments:** `main` (production) and a Supabase branch or second free project for testing migrations. Never test on production data.
- **Testing:** Vitest for helpers, pgTAP or plain SQL tests for views and functions, one Playwright smoke test for the payment-to-receipt flow.

---

## 6. UI/UX specs

### 6.1 Information architecture
```
Tableau de bord
Paiements        > Nouveau paiement | Historique
Élèves           > Liste | Importer | Promouvoir
Impayés
Personnel (V1.1) > Liste | Paie
Finances (V1.2)  > Dépenses | Autres revenus | Journal de caisse | Clôture | Rapports
Configuration    > Année scolaire | Classes | Frais | École | Utilisateurs (V2)
```
Mobile: bottom nav with 4 items (Accueil, Paiements, Élèves, Impayés), the rest under "Plus". Desktop: left sidebar.

### 6.2 Screen specs (V1.0)
| Screen | Primary content | Primary action | States |
|---|---|---|---|
| Login | Email, password | Se connecter | error, loading |
| Dashboard | KPI cards (attendu, encaissé, reste, taux %), status counts, last 5 payments | Enregistrer un paiement | empty (no setup yet) shows checklist: classes, frais, élèves |
| New payment | Pupil search (Command), term, fee, amount, method, reference, date | Enregistrer | duplicate warning, validation errors, success then receipt |
| Receipt | School header, number, pupil, term, amount in digits and words, method, balance after, signature | Imprimer | voided watermark "ANNULÉ" |
| Pupils list | Search, class filter, status filter, table or cards | Ajouter élève | empty, loading, no results |
| Pupil detail | Info, balance per term, payment history, reminder history | Enregistrer un paiement, Modifier | voided rows struck through |
| Import | Template download, upload, preview table with row errors | Importer les lignes valides | parse error, partial success report |
| Unpaid | Term and class filters, rows with amount owed, last reminded | Relancer, Exporter CSV | empty "Tout est à jour" |
| Fees setup | Grid class x term with amounts and due dates | Enregistrer, Copier de l'an dernier | unsaved changes warning |
| Settings | School info, reminder template editor with variable chips | Enregistrer | preview of the rendered message |

### 6.3 Interaction rules
- Search is instant (debounced 200 ms), matches on last name, first name, parent name, phone.
- Amount field prefilled with remaining balance; typing formats with thin spaces live; negative or zero rejected.
- Saving a payment is a single button; no second confirmation (speed), but the receipt screen has "Annuler ce paiement" within 10 minutes as a safety link.
- Voiding always uses an alert dialog with a reason field (min 5 characters).
- Unsaved form changes trigger a leave-page warning.
- All lists keep filter state in the URL so refresh and back work.
- Toasts for success (3 s), inline messages for errors (persist).
- Receipts print with a dedicated print stylesheet, A5 portrait, no navigation chrome.

### 6.4 Accessibility and context
Text 16 px minimum, contrast ratio 4.5:1, focus rings visible, status badges have text plus icon. Works at 360 px width, usable one-handed on a phone. Slow connection: skeleton loaders, optimistic UI only for non-financial actions.

---

## 7. Design system

| Token | Value (A: adjust to school colors if they have any) |
|---|---|
| Font | System UI stack, 16 px base, scale 14 / 16 / 20 / 24 / 32 |
| Primary | Deep blue `#1E40AF`, hover `#1E3A8A` |
| Neutral | Slate 50 to 900 |
| Success | `#15803D` on `#DCFCE7` (solvable) |
| Warning | `#B45309` on `#FEF3C7` (partiel) |
| Danger | `#B91C1C` on `#FEE2E2` (insolvable, void actions) |
| Muted | `#475569` on `#F1F5F9` (pas encore dû) |
| Radius | 8 px cards and inputs, 9999 px badges |
| Spacing | 4 px base: 4, 8, 12, 16, 24, 32 |
| Shadow | One subtle card shadow only |
| Icons | Lucide, 20 px |

Components (shadcn/ui): Button (primary, secondary, destructive, ghost), Input, Select, Combobox/Command, DatePicker, Table with responsive card fallback, Badge (4 status variants), Card (KPI), Dialog, AlertDialog, Toast (Sonner), Tabs, Skeleton, EmptyState (icon, text, action). Shared helpers: `formatFCFA`, `formatDate`, `normalizeCameroonPhone`, `amountToFrenchWords`, `renderReminderMessage`.

Tone of copy: short, polite, plain French, no jargon (say "Reste à payer", not "Solde débiteur").

---

## 8. Walkthrough (a normal Monday)

1. 08:00 Admin opens the dashboard on her phone: 62% collected for term 1, 14 pupils insolvable.
2. 08:10 A parent pays 15 000 FCFA by Orange Money. She taps "Enregistrer un paiement", types "Mba", picks the pupil, amount prefilled at 25 000, she changes it to 15 000, method Orange Money, pastes the transaction id, saves. Receipt appears with reste 10 000 FCFA. She prints it at the school's printer or shares the PDF. Total: 45 seconds.
3. 10:00 She opens "Impayés", term 1, class CE1: 6 pupils. She taps "Relancer sur WhatsApp" on the first, WhatsApp opens with the message, she sends. Rows show "Relancé aujourd'hui".
4. 16:00 She realizes she typed 15 000 instead of 5 000 for a different pupil. She opens the pupil, voids the payment with the reason "erreur de saisie", records the right one. The audit log keeps both.
5. Friday (V1.2): she closes the cash, the app says 112 500 expected, she counted 112 500, difference 0, day locked. The owner gets his weekly numbers without asking her.

---

## 9. Implementation plan

Time budget rule: this is a side project. Hard cap per phase below; the main business bet keeps its daily hour.

| Phase | Content | Cap | Exit criterion |
|---|---|---|---|
| 0 | Get one real Excel file, confirm A1 to A5 with the admin, confirm school name and fee structure | 1 h | Assumptions confirmed or schema adjusted |
| 1 (V1.0) | Master prompt stages 1 to 5, deployed | 8 to 10 h over 2 days | Admin records a real payment in front of you |
| 1b | Import her real data, shadow period: she keeps paper and app in parallel for 1 week | 2 h | Zero mismatches between paper and app in week 1 |
| 2 (V1.1) | Staff, salary history, payroll register, payslip | 6 h | Admin runs one month of payroll in the app |
| 3 (V1.2) | Expenses, other income, cash book, closing, owner role, monthly report, period lock | 10 h | Owner views a real monthly report |
| 4 (V2) | Only items requested twice by the admin or owner | per item | Written request exists |
| 5 | Generalization | n/a | Gated by the bet rules, not by this plan |

**Release practice:** deploy small, ask the admin for 3 minutes of feedback after each phase, write what she struggled with, fix before adding features. Keep a weekly backup in a place she can access.

**Definition of done per module:** acceptance tests pass, audit log verified, mobile checked at 360 px, README updated, one real user task completed by the admin without help.

---

## 10. Open questions for the admin (ask in one conversation)
1. Fees: per term, per year, or monthly? Fixed per class? Any discounts for siblings?
2. Other fees: registration, uniform, books, exam fees?
3. Who prints receipts, and on what (A5, half A4, thermal)?
4. Does the owner want to see reports, and how often?
5. How many pupils, classes and staff? Any nursery section?
6. How many WhatsApp reminders does she send per week today?
7. What happens when a pupil leaves mid-year (refund, carry balance)?
8. Where is the existing data (Excel, paper) and how clean is it?
