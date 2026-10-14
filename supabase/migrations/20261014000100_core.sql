-- =============================================================================
-- E-skool core schema (V1.0): school years, classes, fees, pupils, enrollments,
-- discounts, payments, receipts, balances, reminders, audit log, roles.
--
-- Conventions
--   * Money is integer FCFA everywhere. No floats.
--   * No hard delete on money or person tables. Corrections go through void.
--   * Every table has RLS enabled and explicit grants (Supabase grants ALL to
--     anon/authenticated by default; we revoke and re-grant on purpose).
--   * Writes on money tables only go through SECURITY DEFINER functions that
--     check the caller's role first.
--   * Error messages raised to the UI are in French (errcode P0001).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'owner', 'secretary');
create type public.payment_method as enum ('cash', 'orange_money', 'mtn_momo', 'bank');
create type public.fee_type as enum ('tuition', 'registration', 'uniform', 'books', 'exam', 'other');

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------

-- The school runs on Douala time (UTC+1). Supabase servers run on UTC, so every
-- "today" in SQL goes through this function.
create function public.app_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Douala')::date
$$;

-- Accent-insensitive, case-insensitive text used for search and name matching.
create function public.normalize_text(p text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(trim(regexp_replace(extensions.unaccent('extensions.unaccent', coalesce(p, '')), '\s+', ' ', 'g')))
$$;

-- Normalizes a Cameroonian mobile number to 2376XXXXXXXX, or returns null.
-- Accepts "6 77 12 34 56", "+237 677123456", "00237677123456", "237677123456".
create function public.normalize_cm_phone(p text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if digits like '00237%' then
    digits := substr(digits, 6);
  elsif digits like '237%' and length(digits) = 12 then
    digits := substr(digits, 4);
  end if;
  if digits ~ '^6[0-9]{8}$' then
    return '237' || digits;
  end if;
  return null;
end;
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.raise_app_error(p_message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = p_message;
end;
$$;

-- -----------------------------------------------------------------------------
-- Roles
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  full_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_roles_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();

-- Role of the calling user, or null when the user has no active role.
create function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid() and ur.is_active
$$;

-- Raises unless the caller has one of the given roles.
create function public.require_role(p_roles public.app_role[])
returns public.app_role
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.app_role := public.auth_role();
begin
  if r is null or not (r = any (p_roles)) then
    raise exception using errcode = '42501', message = 'Action non autorisée pour votre rôle.';
  end if;
  return r;
end;
$$;

-- Never leave the school without an active admin.
create function public.user_roles_keep_one_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'admin' and old.is_active)
     or (tg_op = 'UPDATE' and old.role = 'admin' and old.is_active
         and (new.role <> 'admin' or not new.is_active)) then
    if not exists (
      select 1 from public.user_roles
      where role = 'admin' and is_active and user_id <> old.user_id
    ) then
      perform public.raise_app_error('Il doit rester au moins un administrateur actif.');
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger user_roles_keep_one_admin before update or delete on public.user_roles
  for each row execute function public.user_roles_keep_one_admin();

-- -----------------------------------------------------------------------------
-- Audit log (append-only)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  before jsonb,
  after jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

create function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  j jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  if tg_op = 'UPDATE' and to_jsonb(old) = to_jsonb(new) then
    return new;
  end if;
  insert into public.audit_log (table_name, record_id, action, before, after, user_id)
  values (
    tg_table_name,
    coalesce(j ->> 'id', j ->> 'user_id', j ->> 'month'),
    tg_op,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create function public.block_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001',
    message = format('Les lignes de %s ne peuvent pas être modifiées ni supprimées.', tg_table_name);
end;
$$;

create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function public.block_mutation();

-- -----------------------------------------------------------------------------
-- Counters (receipt numbers, payslip numbers). Never reused.
-- -----------------------------------------------------------------------------
create table public.counters (
  key text primary key,
  last_number integer not null default 0
);

create function public.next_counter(p_key text)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.counters as c (key, last_number) values (p_key, 1)
  on conflict (key) do update set last_number = c.last_number + 1
  returning last_number
$$;

-- -----------------------------------------------------------------------------
-- Date locks. Replaced by the finance migration (cash closings, period locks).
-- -----------------------------------------------------------------------------
create function public.assert_date_open(p_date date)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  return;
end;
$$;

-- -----------------------------------------------------------------------------
-- Settings (single row)
-- -----------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  school_name text not null default 'Mon école',
  address text,
  phone text,
  email text,
  logo_path text,
  receipt_footer text default 'Merci pour votre confiance.',
  receipt_format text not null default 'a5' check (receipt_format in ('a5', 'a4', 'thermal')),
  reminder_template text not null default
    'Bonjour {parent}, nous vous rappelons que {montant} restent à payer pour {eleve} ({classe}), {tranche}. Merci de régulariser dès que possible. {ecole} - {telephone_ecole}',
  term_label text not null default 'Tranche' check (length(trim(term_label)) between 1 and 30),
  terms_count smallint not null default 3 check (terms_count between 1 and 12),
  module_hr boolean not null default false,
  module_finance boolean not null default false,
  module_enrollment boolean not null default false,
  auto_reminders_enabled boolean not null default false,
  auto_reminder_interval_days smallint not null default 7 check (auto_reminder_interval_days between 1 and 60),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (true);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger settings_no_delete before delete on public.settings
  for each row execute function public.block_mutation();

-- -----------------------------------------------------------------------------
-- School years and classes
-- -----------------------------------------------------------------------------
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (label ~ '^[0-9]{4}-[0-9]{4}$'),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create unique index school_years_one_current on public.school_years (is_current) where is_current;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index classes_name_unique on public.classes (public.normalize_text(name));

-- -----------------------------------------------------------------------------
-- Fee schedules: amount due per (year, class, fee type, term). term is null for
-- one-off fees (registration, uniform...).
-- -----------------------------------------------------------------------------
create table public.fee_schedules (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years (id),
  class_id uuid not null references public.classes (id),
  fee public.fee_type not null default 'tuition',
  term smallint check (term between 1 and 12),
  amount integer not null check (amount >= 0),
  due_date date not null,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint fee_schedules_unique unique nulls not distinct (school_year_id, class_id, fee, term)
);
create index fee_schedules_class_idx on public.fee_schedules (class_id);

-- -----------------------------------------------------------------------------
-- Pupils (identity) and enrollments (pupil x school year x class)
-- -----------------------------------------------------------------------------
create table public.pupils (
  id uuid primary key default gen_random_uuid(),
  last_name text not null check (length(trim(last_name)) > 0),
  first_name text not null default '',
  parent_name text,
  parent_phone text check (parent_phone ~ '^2376[0-9]{8}$'),
  parent_phone_alt text check (parent_phone_alt ~ '^2376[0-9]{8}$'),
  notes text,
  is_active boolean not null default true,
  left_on date,
  left_reason text,
  portal_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
create index pupils_search_idx on public.pupils (public.normalize_text(last_name || ' ' || first_name));

create trigger pupils_updated_at before update on public.pupils
  for each row execute function public.set_updated_at();

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils (id),
  school_year_id uuid not null references public.school_years (id),
  class_id uuid not null references public.classes (id),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint enrollments_one_per_year unique (pupil_id, school_year_id)
);
create index enrollments_year_class_idx on public.enrollments (school_year_id, class_id);
create index enrollments_class_idx on public.enrollments (class_id);

-- -----------------------------------------------------------------------------
-- Discounts (sibling discount, staff child, scholarship...). Applied per fee
-- schedule line. fee/term null means "all".
-- -----------------------------------------------------------------------------
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils (id),
  school_year_id uuid not null references public.school_years (id),
  fee public.fee_type,
  term smallint check (term between 1 and 12),
  kind text not null check (kind in ('percent', 'fixed')),
  value integer not null check (value > 0),
  reason text not null check (length(trim(reason)) >= 3),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  check (kind <> 'percent' or value <= 100)
);
create index discounts_pupil_year_idx on public.discounts (pupil_id, school_year_id);

-- -----------------------------------------------------------------------------
-- Payments
-- -----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils (id),
  school_year_id uuid not null references public.school_years (id),
  fee public.fee_type not null default 'tuition',
  term smallint check (term between 1 and 12),
  amount integer not null check (amount > 0),
  method public.payment_method not null,
  reference text,
  paid_at date not null default public.app_today(),
  receipt_number text not null unique,
  note text,
  voided boolean not null default false,
  voided_at timestamptz,
  voided_by uuid,
  void_reason text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (not voided or (void_reason is not null and length(trim(void_reason)) >= 5))
);
create index payments_pupil_year_idx on public.payments (pupil_id, school_year_id);
create index payments_year_term_idx on public.payments (school_year_id, term) where not voided;
create index payments_paid_at_idx on public.payments (paid_at);
create index payments_reference_idx on public.payments (lower(reference)) where reference is not null;

create function public.payments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text;
  v_n integer;
begin
  if new.paid_at > public.app_today() then
    perform public.raise_app_error('La date du paiement ne peut pas être dans le futur.');
  end if;
  perform public.assert_date_open(new.paid_at);

  if not exists (
    select 1 from public.enrollments e
    where e.pupil_id = new.pupil_id and e.school_year_id = new.school_year_id
  ) then
    perform public.raise_app_error('Cet élève n''est pas inscrit pour cette année scolaire.');
  end if;

  if not exists (
    select 1
    from public.enrollments e
    join public.fee_schedules fs
      on fs.school_year_id = e.school_year_id and fs.class_id = e.class_id
    where e.pupil_id = new.pupil_id
      and e.school_year_id = new.school_year_id
      and fs.fee = new.fee
      and fs.term is not distinct from new.term
  ) then
    perform public.raise_app_error('Aucun frais configuré pour cette classe, ce type de frais et cette période.');
  end if;

  new.reference := nullif(trim(new.reference), '');
  new.voided := false;
  new.voided_at := null;
  new.voided_by := null;
  new.void_reason := null;
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.created_at := now();

  select sy.label into v_label from public.school_years sy where sy.id = new.school_year_id;
  v_n := public.next_counter('receipt:' || new.school_year_id::text);
  new.receipt_number := substr(v_label, 1, 4) || '-'
    || case when v_n < 10000 then lpad(v_n::text, 4, '0') else v_n::text end;
  return new;
end;
$$;

create trigger payments_before_insert before insert on public.payments
  for each row execute function public.payments_before_insert();

-- Payments are immutable. The only allowed change is voiding (once).
create function public.payments_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.voided then
    perform public.raise_app_error('Ce paiement est déjà annulé.');
  end if;
  if not new.voided
     or (to_jsonb(new) - array['voided', 'voided_at', 'voided_by', 'void_reason'])
        <> (to_jsonb(old) - array['voided', 'voided_at', 'voided_by', 'void_reason']) then
    perform public.raise_app_error('Un paiement ne peut pas être modifié. Annulez-le puis enregistrez le bon montant.');
  end if;
  perform public.assert_date_open(old.paid_at);
  return new;
end;
$$;

create trigger payments_before_update before update on public.payments
  for each row execute function public.payments_before_update();
create trigger payments_no_delete before delete on public.payments
  for each row execute function public.block_mutation();

-- Fee schedules referenced by payments cannot be deleted.
create function public.fee_schedules_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.payments p
    join public.enrollments e on e.pupil_id = p.pupil_id and e.school_year_id = p.school_year_id
    where p.school_year_id = old.school_year_id
      and e.class_id = old.class_id
      and p.fee = old.fee
      and p.term is not distinct from old.term
  ) then
    perform public.raise_app_error('Des paiements existent pour ce frais : il ne peut pas être supprimé. Modifiez le montant si besoin.');
  end if;
  return old;
end;
$$;

create trigger fee_schedules_before_delete before delete on public.fee_schedules
  for each row execute function public.fee_schedules_before_delete();

-- -----------------------------------------------------------------------------
-- Reminders (click-to-send log and automatic sends)
-- -----------------------------------------------------------------------------
create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils (id),
  school_year_id uuid references public.school_years (id),
  term smallint,
  channel text not null default 'whatsapp_link' check (channel in ('whatsapp_link', 'whatsapp_api')),
  amount_due integer,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index reminder_log_pupil_idx on public.reminder_log (pupil_id, school_year_id, term, created_at desc);

-- -----------------------------------------------------------------------------
-- Balances
--
-- balance_lines: one row per (enrolled pupil, fee schedule line).
--   due      = schedule amount minus discounts (never below 0)
--   paid     = non-voided payments recorded for that exact line
--   carry_in = overpayment carried from the previous term of the same fee (BR5)
--   applied  = what actually covers this line = min(paid + carry_in, due)
--   carry_out= surplus passed to the next term; on the last term it is a credit
-- The carry is a Lindley recursion: carry_n = S_n - min(0, min_{k<=n} S_k) with
-- S_n the running sum of (paid - due). Forward only: a payment recorded for
-- term 2 never fills term 1, because the admin chose term 2.
-- -----------------------------------------------------------------------------
create view public.balance_lines
with (security_invoker = true)
as
with base as (
  select
    e.pupil_id,
    e.school_year_id,
    e.class_id,
    fs.id as fee_schedule_id,
    fs.fee,
    fs.term,
    fs.due_date,
    fs.amount as gross_due,
    least(fs.amount, coalesce((
      select sum(case when d.kind = 'percent'
                      then round(fs.amount * d.value / 100.0)::integer
                      else d.value end)
      from public.discounts d
      where d.pupil_id = e.pupil_id
        and d.school_year_id = e.school_year_id
        and d.is_active
        and (d.fee is null or d.fee = fs.fee)
        and (d.term is null or d.term = fs.term)
    ), 0))::integer as discount,
    coalesce((
      select sum(p.amount)
      from public.payments p
      where p.pupil_id = e.pupil_id
        and p.school_year_id = e.school_year_id
        and p.fee = fs.fee
        and p.term is not distinct from fs.term
        and not p.voided
    ), 0)::integer as paid
  from public.enrollments e
  join public.fee_schedules fs
    on fs.school_year_id = e.school_year_id and fs.class_id = e.class_id
),
running as (
  select
    b.*,
    b.gross_due - b.discount as due,
    sum(b.paid - (b.gross_due - b.discount)) over w as s
  from base b
  window w as (partition by b.pupil_id, b.school_year_id, b.fee
               order by b.term nulls first
               rows between unbounded preceding and current row)
),
carry as (
  select
    r.*,
    (r.s - least(0, min(r.s) over w))::integer as carry_out
  from running r
  window w as (partition by r.pupil_id, r.school_year_id, r.fee
               order by r.term nulls first
               rows between unbounded preceding and current row)
),
lined as (
  select
    c.*,
    coalesce(lag(c.carry_out) over w, 0)::integer as carry_in,
    (row_number() over (partition by c.pupil_id, c.school_year_id, c.fee
                        order by c.term desc nulls last) = 1) as is_last
  from carry c
  window w as (partition by c.pupil_id, c.school_year_id, c.fee order by c.term nulls first)
)
select
  l.pupil_id,
  l.school_year_id,
  l.class_id,
  l.fee_schedule_id,
  l.fee,
  l.term,
  l.due_date,
  l.gross_due,
  l.discount,
  l.due::integer as due,
  l.paid,
  l.carry_in,
  l.carry_out,
  (l.paid + l.carry_in - l.carry_out)::integer as applied,
  (l.due - (l.paid + l.carry_in - l.carry_out))::integer as remaining,
  case
    when l.paid + l.carry_in - l.carry_out >= l.due then 'solvable'
    when l.paid + l.carry_in - l.carry_out > 0 then 'partiel'
    when l.due_date < public.app_today() then 'insolvable'
    else 'pas_encore_du'
  end as status,
  l.is_last
from lined l;

-- One row per (pupil, year, term) with display fields, for the unpaid list and
-- the pupil page. term null groups the one-off fees.
create view public.pupil_term_balance
with (security_invoker = true)
as
select
  bl.pupil_id,
  bl.school_year_id,
  bl.term,
  p.last_name,
  p.first_name,
  p.parent_name,
  p.parent_phone,
  p.is_active,
  p.portal_token,
  c.id as class_id,
  c.name as class_name,
  c.sort_order as class_sort_order,
  sum(bl.due)::integer as due,
  sum(bl.paid)::integer as paid,
  sum(bl.applied)::integer as applied,
  sum(bl.remaining)::integer as remaining,
  min(bl.due_date) as due_date,
  case
    when sum(bl.applied) >= sum(bl.due) then 'solvable'
    when sum(bl.applied) > 0 then 'partiel'
    when min(bl.due_date) < public.app_today() then 'insolvable'
    else 'pas_encore_du'
  end as status,
  (
    select max(rl.created_at)
    from public.reminder_log rl
    where rl.pupil_id = bl.pupil_id
      and rl.school_year_id = bl.school_year_id
      and rl.term is not distinct from bl.term
  ) as last_reminded_at
from public.balance_lines bl
join public.pupils p on p.id = bl.pupil_id
join public.classes c on c.id = bl.class_id
group by bl.pupil_id, bl.school_year_id, bl.term, p.id, c.id;

-- One row per (pupil, year): totals and the credit left after the last term.
create view public.pupil_year_balance
with (security_invoker = true)
as
select
  bl.pupil_id,
  bl.school_year_id,
  bl.class_id,
  sum(bl.due)::integer as due,
  sum(bl.paid)::integer as paid,
  sum(bl.applied)::integer as applied,
  sum(bl.remaining)::integer as remaining,
  coalesce(sum(bl.carry_out) filter (where bl.is_last), 0)::integer as credit,
  sum(bl.due) filter (where bl.due_date <= public.app_today())::integer as due_to_date,
  sum(bl.remaining) filter (where bl.due_date <= public.app_today())::integer as overdue
from public.balance_lines bl
group by bl.pupil_id, bl.school_year_id, bl.class_id;

-- -----------------------------------------------------------------------------
-- RPC: payments
-- -----------------------------------------------------------------------------
create function public.record_payment(
  p_pupil_id uuid,
  p_school_year_id uuid,
  p_fee public.fee_type,
  p_term smallint,
  p_amount integer,
  p_method public.payment_method,
  p_reference text default null,
  p_paid_at date default null,
  p_note text default null,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paid_at date := coalesce(p_paid_at, public.app_today());
  v_ref text := nullif(trim(p_reference), '');
  v_dups jsonb;
  v_payment public.payments;
begin
  perform public.require_role(array['admin', 'secretary']::public.app_role[]);

  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error('Le montant doit être supérieur à zéro.');
  end if;

  -- FR-Y5: same pupil + amount + date + method, or same transaction reference.
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id,
           'receipt_number', p.receipt_number,
           'amount', p.amount,
           'paid_at', p.paid_at,
           'method', p.method,
           'reference', p.reference,
           'pupil_name', trim(pu.last_name || ' ' || pu.first_name)
         ) order by p.created_at desc), '[]'::jsonb)
  into v_dups
  from public.payments p
  join public.pupils pu on pu.id = p.pupil_id
  where not p.voided
    and (
      (p.pupil_id = p_pupil_id and p.amount = p_amount and p.paid_at = v_paid_at and p.method = p_method)
      or (v_ref is not null and lower(p.reference) = lower(v_ref))
    );

  if jsonb_array_length(v_dups) > 0 and not p_force then
    return jsonb_build_object('status', 'duplicate', 'duplicates', v_dups);
  end if;

  insert into public.payments (pupil_id, school_year_id, fee, term, amount, method, reference, paid_at, note)
  values (p_pupil_id, p_school_year_id, p_fee, p_term, p_amount, p_method, v_ref, v_paid_at, nullif(trim(p_note), ''))
  returning * into v_payment;

  return jsonb_build_object(
    'status', 'ok',
    'payment_id', v_payment.id,
    'receipt_number', v_payment.receipt_number
  );
end;
$$;

create function public.void_payment(p_payment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_role(array['admin']::public.app_role[]);
  if p_reason is null or length(trim(p_reason)) < 5 then
    perform public.raise_app_error('Indiquez un motif d''au moins 5 caractères.');
  end if;
  update public.payments
  set voided = true,
      voided_at = now(),
      voided_by = auth.uid(),
      void_reason = trim(p_reason)
  where id = p_payment_id;
  if not found then
    perform public.raise_app_error('Paiement introuvable.');
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: setup helpers
-- -----------------------------------------------------------------------------
create function public.set_current_year(p_school_year_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_role(array['admin']::public.app_role[]);
  if not exists (select 1 from public.school_years where id = p_school_year_id) then
    perform public.raise_app_error('Année scolaire introuvable.');
  end if;
  update public.school_years set is_current = false where is_current and id <> p_school_year_id;
  update public.school_years set is_current = true where id = p_school_year_id;
end;
$$;

-- FR-S4: copy fee schedules from one year to another, shifting due dates by the
-- number of years between the two labels. Existing lines are kept.
create function public.copy_fee_schedules(p_from_year uuid, p_to_year uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shift integer;
  v_count integer;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  select (substr(t.label, 1, 4))::integer - (substr(f.label, 1, 4))::integer
  into v_shift
  from public.school_years f, public.school_years t
  where f.id = p_from_year and t.id = p_to_year;
  if v_shift is null then
    perform public.raise_app_error('Année scolaire introuvable.');
  end if;

  insert into public.fee_schedules (school_year_id, class_id, fee, term, amount, due_date)
  select p_to_year, fs.class_id, fs.fee, fs.term, fs.amount,
         (fs.due_date + make_interval(years => v_shift))::date
  from public.fee_schedules fs
  where fs.school_year_id = p_from_year
  on conflict on constraint fee_schedules_unique do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: pupils
-- -----------------------------------------------------------------------------

-- FR-P3: import rows [{last_name, first_name, class_name, parent_name,
-- parent_phone, notes}] into a school year. Returns inserted count and the
-- rejected rows with a French reason. Valid rows are inserted even if others fail.
create function public.import_pupils(p_school_year_id uuid, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r jsonb;
  i integer := 0;
  v_inserted integer := 0;
  v_rejected jsonb := '[]'::jsonb;
  v_class_id uuid;
  v_phone text;
  v_last text;
  v_first text;
  v_pupil_id uuid;
begin
  perform public.require_role(array['admin', 'secretary']::public.app_role[]);
  if not exists (select 1 from public.school_years where id = p_school_year_id) then
    perform public.raise_app_error('Année scolaire introuvable.');
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 2000 then
    perform public.raise_app_error('Fichier invalide ou trop volumineux (2000 lignes maximum).');
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    v_last := upper(trim(coalesce(r ->> 'last_name', '')));
    v_first := trim(coalesce(r ->> 'first_name', ''));

    if v_last = '' then
      v_rejected := v_rejected || jsonb_build_object('row', i, 'reason', 'Nom manquant');
      continue;
    end if;

    select c.id into v_class_id
    from public.classes c
    where public.normalize_text(c.name) = public.normalize_text(r ->> 'class_name');
    if v_class_id is null then
      v_rejected := v_rejected || jsonb_build_object(
        'row', i, 'reason', format('Classe inconnue : "%s"', coalesce(r ->> 'class_name', '')));
      continue;
    end if;

    v_phone := null;
    if nullif(trim(coalesce(r ->> 'parent_phone', '')), '') is not null then
      v_phone := public.normalize_cm_phone(r ->> 'parent_phone');
      if v_phone is null then
        v_rejected := v_rejected || jsonb_build_object(
          'row', i, 'reason', format('Téléphone invalide : "%s"', r ->> 'parent_phone'));
        continue;
      end if;
    end if;

    if exists (
      select 1
      from public.pupils p
      join public.enrollments e on e.pupil_id = p.id and e.school_year_id = p_school_year_id
      where public.normalize_text(p.last_name) = public.normalize_text(v_last)
        and public.normalize_text(p.first_name) = public.normalize_text(v_first)
        and e.class_id = v_class_id
    ) then
      v_rejected := v_rejected || jsonb_build_object('row', i, 'reason', 'Élève déjà inscrit dans cette classe');
      continue;
    end if;

    insert into public.pupils (last_name, first_name, parent_name, parent_phone, notes)
    values (v_last, v_first, nullif(trim(r ->> 'parent_name'), ''), v_phone, nullif(trim(r ->> 'notes'), ''))
    returning id into v_pupil_id;

    insert into public.enrollments (pupil_id, school_year_id, class_id)
    values (v_pupil_id, p_school_year_id, v_class_id);

    v_inserted := v_inserted + 1;
  end loop;

  return jsonb_build_object('inserted', v_inserted, 'rejected', v_rejected);
end;
$$;

-- FR-P1: create a pupil and enroll them in one transaction. Runs with the
-- caller's rights, so RLS decides who may do it (admin, secretary).
create function public.create_pupil(
  p_school_year_id uuid,
  p_class_id uuid,
  p_last_name text,
  p_first_name text,
  p_parent_name text default null,
  p_parent_phone text default null,
  p_parent_phone_alt text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if exists (
    select 1
    from public.pupils p
    join public.enrollments e on e.pupil_id = p.id and e.school_year_id = p_school_year_id
    where public.normalize_text(p.last_name) = public.normalize_text(p_last_name)
      and public.normalize_text(p.first_name) = public.normalize_text(p_first_name)
  ) then
    perform public.raise_app_error('Un élève avec ce nom et ce prénom est déjà inscrit cette année.');
  end if;

  insert into public.pupils (last_name, first_name, parent_name, parent_phone, parent_phone_alt, notes)
  values (upper(trim(p_last_name)), trim(coalesce(p_first_name, '')), nullif(trim(p_parent_name), ''),
          p_parent_phone, p_parent_phone_alt, nullif(trim(p_notes), ''))
  returning id into v_id;

  insert into public.enrollments (pupil_id, school_year_id, class_id)
  values (v_id, p_school_year_id, p_class_id);
  return v_id;
end;
$$;

-- FR-P4: decisions = [{pupil_id, class_id}] where class_id null means the pupil
-- leaves the school (deactivated). Pupils already enrolled in the target year
-- are skipped.
create function public.promote_pupils(p_to_year uuid, p_decisions jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d jsonb;
  v_enrolled integer := 0;
  v_skipped integer := 0;
  v_left integer := 0;
  v_pupil uuid;
  v_class uuid;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  if not exists (select 1 from public.school_years where id = p_to_year) then
    perform public.raise_app_error('Année scolaire de destination introuvable.');
  end if;

  for d in select * from jsonb_array_elements(p_decisions) loop
    v_pupil := (d ->> 'pupil_id')::uuid;
    v_class := nullif(d ->> 'class_id', '')::uuid;
    if v_class is null then
      update public.pupils
      set is_active = false, left_on = public.app_today(), left_reason = coalesce(left_reason, 'Départ en fin d''année')
      where id = v_pupil and is_active;
      if found then v_left := v_left + 1; end if;
    else
      insert into public.enrollments (pupil_id, school_year_id, class_id)
      values (v_pupil, p_to_year, v_class)
      on conflict on constraint enrollments_one_per_year do nothing;
      if found then v_enrolled := v_enrolled + 1; else v_skipped := v_skipped + 1; end if;
    end if;
  end loop;

  return jsonb_build_object('enrolled', v_enrolled, 'skipped', v_skipped, 'left', v_left);
end;
$$;

-- Instant search for the payment screen: name, parent name or phone digits.
create function public.search_pupils(p_query text, p_school_year_id uuid, p_limit integer default 10)
returns table (
  pupil_id uuid,
  last_name text,
  first_name text,
  parent_name text,
  parent_phone text,
  class_id uuid,
  class_name text,
  is_active boolean,
  remaining integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select public.normalize_text(p_query) as t,
           regexp_replace(coalesce(p_query, ''), '\D', '', 'g') as digits
  )
  select p.id, p.last_name, p.first_name, p.parent_name, p.parent_phone,
         c.id, c.name, p.is_active,
         coalesce(yb.remaining, 0)
  from public.pupils p
  join public.enrollments e on e.pupil_id = p.id and e.school_year_id = p_school_year_id
  join public.classes c on c.id = e.class_id
  left join public.pupil_year_balance yb on yb.pupil_id = p.id and yb.school_year_id = p_school_year_id
  cross join q
  where length(q.t) >= 1
    and (
      public.normalize_text(p.last_name || ' ' || p.first_name) like '%' || q.t || '%'
      or public.normalize_text(p.first_name || ' ' || p.last_name) like '%' || q.t || '%'
      or public.normalize_text(coalesce(p.parent_name, '')) like '%' || q.t || '%'
      or (length(q.digits) >= 4 and (coalesce(p.parent_phone, '') like '%' || q.digits || '%'
                                     or coalesce(p.parent_phone_alt, '') like '%' || q.digits || '%'))
    )
  order by p.is_active desc, p.last_name, p.first_name
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
$$;

create function public.regenerate_portal_token(p_pupil_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  perform public.require_role(array['admin']::public.app_role[]);
  update public.pupils set portal_token = v_token where id = p_pupil_id;
  if not found then
    perform public.raise_app_error('Élève introuvable.');
  end if;
  return v_token;
end;
$$;

-- -----------------------------------------------------------------------------
-- Dashboard figures for one school year
-- -----------------------------------------------------------------------------
create function public.dashboard_stats(p_school_year_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lines as (
    select bl.*, p.is_active
    from public.balance_lines bl
    join public.pupils p on p.id = bl.pupil_id
    where bl.school_year_id = p_school_year_id
  ),
  terms as (
    select ptb.term,
           sum(ptb.due)::integer as due,
           sum(ptb.applied)::integer as applied,
           sum(ptb.remaining)::integer as remaining,
           min(ptb.due_date) as due_date,
           count(*) filter (where ptb.status = 'solvable' and ptb.is_active)::integer as solvable,
           count(*) filter (where ptb.status = 'partiel' and ptb.is_active)::integer as partiel,
           count(*) filter (where ptb.status = 'insolvable' and ptb.is_active)::integer as insolvable,
           count(*) filter (where ptb.status = 'pas_encore_du' and ptb.is_active)::integer as pas_encore_du
    from public.pupil_term_balance ptb
    where ptb.school_year_id = p_school_year_id
    group by ptb.term
  )
  select jsonb_build_object(
    'due', coalesce((select sum(due) from lines), 0),
    'paid', coalesce((select sum(paid) from lines), 0),
    'applied', coalesce((select sum(applied) from lines), 0),
    'remaining', coalesce((select sum(remaining) from lines), 0),
    'due_to_date', coalesce((select sum(due) from lines where due_date <= public.app_today()), 0),
    'applied_to_date', coalesce((select sum(applied) from lines where due_date <= public.app_today()), 0),
    'pupils', (select count(*) from public.enrollments e join public.pupils p on p.id = e.pupil_id
               where e.school_year_id = p_school_year_id and p.is_active),
    'classes', (select count(*) from public.classes where is_active),
    'fee_schedules', (select count(*) from public.fee_schedules where school_year_id = p_school_year_id),
    'today_count', (select count(*) from public.payments
                    where school_year_id = p_school_year_id and not voided and paid_at = public.app_today()),
    'today_amount', coalesce((select sum(amount) from public.payments
                    where school_year_id = p_school_year_id and not voided and paid_at = public.app_today()), 0),
    'terms', coalesce((select jsonb_agg(to_jsonb(t) order by t.term nulls first) from terms t), '[]'::jsonb)
  )
$$;

-- -----------------------------------------------------------------------------
-- Audit triggers
-- -----------------------------------------------------------------------------
create trigger audit_user_roles after insert or update or delete on public.user_roles
  for each row execute function public.audit_trigger();
create trigger audit_settings after insert or update or delete on public.settings
  for each row execute function public.audit_trigger();
create trigger audit_school_years after insert or update or delete on public.school_years
  for each row execute function public.audit_trigger();
create trigger audit_classes after insert or update or delete on public.classes
  for each row execute function public.audit_trigger();
create trigger audit_fee_schedules after insert or update or delete on public.fee_schedules
  for each row execute function public.audit_trigger();
create trigger audit_pupils after insert or update or delete on public.pupils
  for each row execute function public.audit_trigger();
create trigger audit_enrollments after insert or update or delete on public.enrollments
  for each row execute function public.audit_trigger();
create trigger audit_discounts after insert or update or delete on public.discounts
  for each row execute function public.audit_trigger();
create trigger audit_payments after insert or update or delete on public.payments
  for each row execute function public.audit_trigger();

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
alter table public.user_roles enable row level security;
alter table public.audit_log enable row level security;
alter table public.counters enable row level security;
alter table public.settings enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.fee_schedules enable row level security;
alter table public.pupils enable row level security;
alter table public.enrollments enable row level security;
alter table public.discounts enable row level security;
alter table public.payments enable row level security;
alter table public.reminder_log enable row level security;

-- Any active staff member can read; writers are listed per table.
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.auth_role()) is not null);

create policy audit_log_select on public.audit_log for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));

create policy settings_select on public.settings for select to authenticated
  using ((select public.auth_role()) is not null);
create policy settings_update on public.settings for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');

create policy school_years_select on public.school_years for select to authenticated
  using ((select public.auth_role()) is not null);
create policy school_years_insert on public.school_years for insert to authenticated
  with check ((select public.auth_role()) = 'admin');
create policy school_years_update on public.school_years for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');
create policy school_years_delete on public.school_years for delete to authenticated
  using ((select public.auth_role()) = 'admin');

create policy classes_select on public.classes for select to authenticated
  using ((select public.auth_role()) is not null);
create policy classes_insert on public.classes for insert to authenticated
  with check ((select public.auth_role()) = 'admin');
create policy classes_update on public.classes for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');
create policy classes_delete on public.classes for delete to authenticated
  using ((select public.auth_role()) = 'admin');

create policy fee_schedules_select on public.fee_schedules for select to authenticated
  using ((select public.auth_role()) is not null);
create policy fee_schedules_insert on public.fee_schedules for insert to authenticated
  with check ((select public.auth_role()) = 'admin');
create policy fee_schedules_update on public.fee_schedules for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');
create policy fee_schedules_delete on public.fee_schedules for delete to authenticated
  using ((select public.auth_role()) = 'admin');

create policy pupils_select on public.pupils for select to authenticated
  using ((select public.auth_role()) is not null);
create policy pupils_insert on public.pupils for insert to authenticated
  with check ((select public.auth_role()) in ('admin', 'secretary'));
create policy pupils_update on public.pupils for update to authenticated
  using ((select public.auth_role()) in ('admin', 'secretary'))
  with check ((select public.auth_role()) in ('admin', 'secretary'));

create policy enrollments_select on public.enrollments for select to authenticated
  using ((select public.auth_role()) is not null);
create policy enrollments_insert on public.enrollments for insert to authenticated
  with check ((select public.auth_role()) in ('admin', 'secretary'));
create policy enrollments_update on public.enrollments for update to authenticated
  using ((select public.auth_role()) in ('admin', 'secretary'))
  with check ((select public.auth_role()) in ('admin', 'secretary'));

create policy discounts_select on public.discounts for select to authenticated
  using ((select public.auth_role()) is not null);
create policy discounts_insert on public.discounts for insert to authenticated
  with check ((select public.auth_role()) = 'admin');
create policy discounts_update on public.discounts for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');

create policy payments_select on public.payments for select to authenticated
  using ((select public.auth_role()) is not null);

create policy reminder_log_select on public.reminder_log for select to authenticated
  using ((select public.auth_role()) is not null);
create policy reminder_log_insert on public.reminder_log for insert to authenticated
  with check ((select public.auth_role()) in ('admin', 'secretary') and created_by = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Grants. Supabase default privileges grant ALL to anon and authenticated; we
-- reset that and grant only what the app needs. service_role keeps full access.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.user_roles, public.audit_log, public.settings, public.school_years,
  public.classes, public.fee_schedules, public.pupils, public.enrollments, public.discounts,
  public.payments, public.reminder_log, public.balance_lines, public.pupil_term_balance,
  public.pupil_year_balance
to authenticated;

grant update (school_name, address, phone, email, logo_path, receipt_footer, receipt_format,
  reminder_template, term_label, terms_count, module_hr, module_finance, module_enrollment,
  auto_reminders_enabled, auto_reminder_interval_days)
  on public.settings to authenticated;
grant insert, update, delete on public.school_years, public.classes, public.fee_schedules to authenticated;
grant insert, update on public.pupils, public.enrollments, public.discounts to authenticated;
grant insert (pupil_id, school_year_id, term, channel, amount_due) on public.reminder_log to authenticated;

grant execute on function
  public.app_today(),
  public.raise_app_error(text),
  public.normalize_text(text),
  public.normalize_cm_phone(text),
  public.auth_role(),
  public.record_payment(uuid, uuid, public.fee_type, smallint, integer, public.payment_method, text, date, text, boolean),
  public.void_payment(uuid, text),
  public.set_current_year(uuid),
  public.copy_fee_schedules(uuid, uuid),
  public.import_pupils(uuid, jsonb),
  public.create_pupil(uuid, uuid, text, text, text, text, text, text),
  public.promote_pupils(uuid, jsonb),
  public.search_pupils(text, uuid, integer),
  public.regenerate_portal_token(uuid),
  public.dashboard_stats(uuid)
to authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from public, anon;
