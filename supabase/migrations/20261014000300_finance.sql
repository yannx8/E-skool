-- =============================================================================
-- V1.2 Finance: expenses, other income, cash book, daily cash closing, month
-- locks and dated adjustments. All writes go through admin-only functions.
--
-- Locking rule (BR6): a money entry dated on or before the last cash closing,
-- or inside a locked month, cannot be created or voided. Corrections after a
-- lock are recorded as adjustments dated today.
-- =============================================================================

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index expense_categories_name_unique on public.expense_categories (public.normalize_text(name));

insert into public.expense_categories (name) values
  ('Fournitures scolaires'),
  ('Entretien et réparations'),
  ('Électricité et eau'),
  ('Transport'),
  ('Communication'),
  ('Avances sur salaire'),
  ('Divers');

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.expense_categories (id),
  amount integer not null check (amount > 0),
  method public.payment_method not null,
  spent_on date not null,
  description text,
  receipt_path text,
  voided boolean not null default false,
  voided_at timestamptz,
  voided_by uuid,
  void_reason text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (not voided or (void_reason is not null and length(trim(void_reason)) >= 5))
);
create index expenses_spent_on_idx on public.expenses (spent_on);
create index expenses_category_idx on public.expenses (category_id);

create table public.other_income (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) > 0),
  amount integer not null check (amount > 0),
  method public.payment_method not null,
  received_on date not null,
  description text,
  voided boolean not null default false,
  voided_at timestamptz,
  voided_by uuid,
  void_reason text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (not voided or (void_reason is not null and length(trim(void_reason)) >= 5))
);
create index other_income_received_on_idx on public.other_income (received_on);

-- Physical cash drawer closing. opening = previous counted - previous removed.
create table public.cash_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null unique,
  opening_cash integer not null,
  cash_in integer not null,
  cash_out integer not null,
  expected_cash integer not null,
  counted_cash integer not null check (counted_cash >= 0),
  removed_cash integer not null default 0 check (removed_cash >= 0),
  difference integer generated always as (counted_cash - expected_cash) stored,
  note text,
  closed_by uuid default auth.uid(),
  closed_at timestamptz not null default now(),
  check (removed_cash <= counted_cash)
);

create table public.period_locks (
  month date primary key check (extract(day from month) = 1),
  locked_at timestamptz not null default now(),
  locked_by uuid default auth.uid()
);

-- Corrections recorded after a lock. Positive = money in, negative = money out.
create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  adjusted_on date not null default public.app_today(),
  refers_to_month date check (refers_to_month is null or extract(day from refers_to_month) = 1),
  label text not null check (length(trim(label)) >= 3),
  amount integer not null check (amount <> 0),
  method public.payment_method not null default 'cash',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index adjustments_adjusted_on_idx on public.adjustments (adjusted_on);

-- Real implementation of the date lock (the core migration ships a no-op).
create or replace function public.assert_date_open(p_date date)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_last date;
begin
  if exists (select 1 from public.period_locks where month = date_trunc('month', p_date)::date) then
    raise exception using errcode = 'P0001',
      message = format('Le mois de %s est verrouillé. Utilisez un ajustement daté d''aujourd''hui.',
                       to_char(p_date, 'MM/YYYY'));
  end if;
  select max(closing_date) into v_last from public.cash_closings;
  if v_last is not null and p_date <= v_last then
    raise exception using errcode = 'P0001',
      message = format('La caisse est clôturée jusqu''au %s inclus. Choisissez une date postérieure.',
                       to_char(v_last, 'DD/MM/YYYY'));
  end if;
end;
$$;

-- Lock guard shared by expenses and other income (insert, and void on update).
create function public.money_entry_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_date date;
begin
  if tg_op = 'DELETE' then
    perform public.raise_app_error('Une opération ne peut pas être supprimée. Annulez-la avec un motif.');
  end if;
  v_new := to_jsonb(new);
  v_date := coalesce(v_new ->> 'spent_on', v_new ->> 'received_on')::date;
  if tg_op = 'INSERT' then
    if v_date > public.app_today() then
      perform public.raise_app_error('La date ne peut pas être dans le futur.');
    end if;
    perform public.assert_date_open(v_date);
    return new;
  end if;
  v_old := to_jsonb(old);
  if (v_old ->> 'voided')::boolean then
    perform public.raise_app_error('Cette opération est déjà annulée.');
  end if;
  if (v_new - array['voided', 'voided_at', 'voided_by', 'void_reason'])
     <> (v_old - array['voided', 'voided_at', 'voided_by', 'void_reason']) then
    perform public.raise_app_error('Une opération ne peut pas être modifiée. Annulez-la puis ressaisissez-la.');
  end if;
  if (v_new ->> 'voided')::boolean then
    perform public.assert_date_open(coalesce(v_old ->> 'spent_on', v_old ->> 'received_on')::date);
  end if;
  return new;
end;
$$;

create trigger expenses_guard before insert or update or delete on public.expenses
  for each row execute function public.money_entry_guard();
create trigger other_income_guard before insert or update or delete on public.other_income
  for each row execute function public.money_entry_guard();

create function public.adjustments_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    perform public.raise_app_error('Un ajustement ne peut pas être modifié ni supprimé.');
  end if;
  if new.adjusted_on > public.app_today() then
    perform public.raise_app_error('La date ne peut pas être dans le futur.');
  end if;
  perform public.assert_date_open(new.adjusted_on);
  return new;
end;
$$;

create trigger adjustments_guard before insert or update or delete on public.adjustments
  for each row execute function public.adjustments_guard();
create trigger cash_closings_frozen before update or delete on public.cash_closings
  for each row execute function public.block_mutation();
create trigger period_locks_frozen before update or delete on public.period_locks
  for each row execute function public.block_mutation();

-- -----------------------------------------------------------------------------
-- Cash book: every movement of money, one row per entry.
-- -----------------------------------------------------------------------------
create view public.cash_book
with (security_invoker = true)
as
select
  'payment'::text as source,
  p.id as source_id,
  p.paid_at as entry_date,
  p.method,
  p.amount as amount_in,
  0 as amount_out,
  'Paiement ' || p.receipt_number || ' - ' || trim(pu.last_name || ' ' || pu.first_name) as label,
  p.created_at
from public.payments p
join public.pupils pu on pu.id = p.pupil_id
where not p.voided
union all
select 'other_income', o.id, o.received_on, o.method, o.amount, 0, o.label, o.created_at
from public.other_income o
where not o.voided
union all
select 'expense', e.id, e.spent_on, e.method, 0, e.amount,
       c.name || coalesce(' - ' || e.description, ''), e.created_at
from public.expenses e
join public.expense_categories c on c.id = e.category_id
where not e.voided
union all
select 'payroll', pe.id, pe.paid_at, pe.method, 0, pe.net_amount,
       'Salaire ' || to_char(pe.month, 'MM/YYYY') || ' - ' || s.full_name, pe.updated_at
from public.payroll_entries pe
join public.staff s on s.id = pe.staff_id
where pe.status = 'paid' and pe.net_amount > 0
union all
select 'adjustment', a.id, a.adjusted_on, a.method,
       greatest(a.amount, 0), greatest(-a.amount, 0), 'Ajustement - ' || a.label, a.created_at
from public.adjustments a;

-- Expected cash in the drawer at the end of p_date, from the last closing.
create function public.cash_position(p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prev public.cash_closings;
  v_from date;
  v_opening integer := 0;
  v_in integer;
  v_out integer;
begin
  perform public.require_role(array['admin', 'owner']::public.app_role[]);
  select * into v_prev from public.cash_closings
  where closing_date < p_date order by closing_date desc limit 1;
  if found then
    v_opening := v_prev.counted_cash - v_prev.removed_cash;
    v_from := v_prev.closing_date + 1;
  else
    v_from := '1900-01-01';
  end if;

  select coalesce(sum(amount_in), 0), coalesce(sum(amount_out), 0)
  into v_in, v_out
  from public.cash_book
  where method = 'cash' and entry_date between v_from and p_date;

  return jsonb_build_object(
    'date', p_date,
    'since', case when v_from = '1900-01-01' then null else v_from end,
    'opening_cash', v_opening,
    'cash_in', v_in,
    'cash_out', v_out,
    'expected_cash', v_opening + v_in - v_out
  );
end;
$$;

-- FR-F4: close the cash drawer for a day. Locks every entry dated on or before.
create function public.close_day(p_date date, p_counted integer, p_removed integer, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pos jsonb;
  v_row public.cash_closings;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  if p_date > public.app_today() then
    perform public.raise_app_error('Impossible de clôturer une journée future.');
  end if;
  if exists (select 1 from public.cash_closings where closing_date >= p_date) then
    perform public.raise_app_error('Cette journée (ou une journée postérieure) est déjà clôturée.');
  end if;
  if p_counted is null or p_counted < 0 then
    perform public.raise_app_error('Le montant compté est invalide.');
  end if;
  if coalesce(p_removed, 0) < 0 or coalesce(p_removed, 0) > p_counted then
    perform public.raise_app_error('Le montant retiré doit être compris entre 0 et le montant compté.');
  end if;

  v_pos := public.cash_position(p_date);
  insert into public.cash_closings
    (closing_date, opening_cash, cash_in, cash_out, expected_cash, counted_cash, removed_cash, note)
  values (
    p_date,
    (v_pos ->> 'opening_cash')::integer,
    (v_pos ->> 'cash_in')::integer,
    (v_pos ->> 'cash_out')::integer,
    (v_pos ->> 'expected_cash')::integer,
    p_counted,
    coalesce(p_removed, 0),
    nullif(trim(p_note), '')
  )
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

-- FR-F6: lock a past month. Irreversible.
create function public.lock_month(p_month date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_month)::date;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  if v_month >= date_trunc('month', public.app_today())::date then
    perform public.raise_app_error('Seul un mois terminé peut être verrouillé.');
  end if;
  insert into public.period_locks (month) values (v_month)
  on conflict (month) do nothing;
end;
$$;

create function public.record_expense(
  p_category_id uuid,
  p_amount integer,
  p_method public.payment_method,
  p_spent_on date,
  p_description text,
  p_receipt_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  insert into public.expenses (category_id, amount, method, spent_on, description, receipt_path)
  values (p_category_id, p_amount, p_method, coalesce(p_spent_on, public.app_today()),
          nullif(trim(p_description), ''), nullif(trim(p_receipt_path), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.void_expense(p_expense_id uuid, p_reason text)
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
  update public.expenses
  set voided = true, voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
  where id = p_expense_id;
  if not found then
    perform public.raise_app_error('Dépense introuvable.');
  end if;
end;
$$;

create function public.record_other_income(
  p_label text,
  p_amount integer,
  p_method public.payment_method,
  p_received_on date,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  insert into public.other_income (label, amount, method, received_on, description)
  values (trim(p_label), p_amount, p_method, coalesce(p_received_on, public.app_today()),
          nullif(trim(p_description), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.void_other_income(p_income_id uuid, p_reason text)
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
  update public.other_income
  set voided = true, voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
  where id = p_income_id;
  if not found then
    perform public.raise_app_error('Revenu introuvable.');
  end if;
end;
$$;

create function public.record_adjustment(
  p_label text,
  p_amount integer,
  p_method public.payment_method,
  p_refers_to_month date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  insert into public.adjustments (label, amount, method, refers_to_month)
  values (trim(p_label), p_amount, p_method,
          case when p_refers_to_month is null then null else date_trunc('month', p_refers_to_month)::date end)
  returning id into v_id;
  return v_id;
end;
$$;

-- FR-F5: monthly summary for the owner.
create function public.monthly_report(p_month date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from date := date_trunc('month', p_month)::date;
  v_to date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
begin
  perform public.require_role(array['admin', 'owner']::public.app_role[]);
  return jsonb_build_object(
    'month', v_from,
    'locked', exists (select 1 from public.period_locks where month = v_from),
    'fees_by_method', coalesce((
      select jsonb_object_agg(method, total) from (
        select method, sum(amount)::integer as total from public.payments
        where not voided and paid_at between v_from and v_to group by method) t), '{}'::jsonb),
    'fees_by_class', coalesce((
      select jsonb_agg(jsonb_build_object('class_name', class_name, 'total', total) order by sort_order) from (
        select c.name as class_name, c.sort_order, sum(p.amount)::integer as total
        from public.payments p
        join public.enrollments e on e.pupil_id = p.pupil_id and e.school_year_id = p.school_year_id
        join public.classes c on c.id = e.class_id
        where not p.voided and p.paid_at between v_from and v_to
        group by c.id) t), '[]'::jsonb),
    'fees_total', coalesce((select sum(amount) from public.payments
                            where not voided and paid_at between v_from and v_to), 0),
    'payments_count', (select count(*) from public.payments where not voided and paid_at between v_from and v_to),
    'other_income_total', coalesce((select sum(amount) from public.other_income
                                    where not voided and received_on between v_from and v_to), 0),
    'expenses_by_category', coalesce((
      select jsonb_agg(jsonb_build_object('category', name, 'total', total) order by total desc) from (
        select c.name, sum(e.amount)::integer as total from public.expenses e
        join public.expense_categories c on c.id = e.category_id
        where not e.voided and e.spent_on between v_from and v_to group by c.id) t), '[]'::jsonb),
    'expenses_total', coalesce((select sum(amount) from public.expenses
                                where not voided and spent_on between v_from and v_to), 0),
    'payroll_total', coalesce((select sum(net_amount) from public.payroll_entries
                               where status = 'paid' and paid_at between v_from and v_to), 0),
    'adjustments_total', coalesce((select sum(amount) from public.adjustments
                                   where adjusted_on between v_from and v_to), 0),
    'closings_count', (select count(*) from public.cash_closings where closing_date between v_from and v_to),
    'closings_difference', coalesce((select sum(difference) from public.cash_closings
                                     where closing_date between v_from and v_to), 0),
    'in_by_method', coalesce((
      select jsonb_object_agg(method, jsonb_build_object('in', tin, 'out', tout)) from (
        select method, sum(amount_in)::integer as tin, sum(amount_out)::integer as tout
        from public.cash_book where entry_date between v_from and v_to group by method) t), '{}'::jsonb)
  );
end;
$$;

-- Audit
create trigger audit_expense_categories after insert or update or delete on public.expense_categories
  for each row execute function public.audit_trigger();
create trigger audit_expenses after insert or update or delete on public.expenses
  for each row execute function public.audit_trigger();
create trigger audit_other_income after insert or update or delete on public.other_income
  for each row execute function public.audit_trigger();
create trigger audit_cash_closings after insert or update or delete on public.cash_closings
  for each row execute function public.audit_trigger();
create trigger audit_period_locks after insert or update or delete on public.period_locks
  for each row execute function public.audit_trigger();
create trigger audit_adjustments after insert or update or delete on public.adjustments
  for each row execute function public.audit_trigger();

-- RLS: admin and owner read; writes only through the functions above, except
-- categories which the admin manages directly.
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.other_income enable row level security;
alter table public.cash_closings enable row level security;
alter table public.period_locks enable row level security;
alter table public.adjustments enable row level security;

create policy expense_categories_select on public.expense_categories for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));
create policy expense_categories_insert on public.expense_categories for insert to authenticated
  with check ((select public.auth_role()) = 'admin');
create policy expense_categories_update on public.expense_categories for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');

create policy expenses_select on public.expenses for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));
create policy other_income_select on public.other_income for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));
create policy cash_closings_select on public.cash_closings for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));
create policy period_locks_select on public.period_locks for select to authenticated
  using ((select public.auth_role()) is not null);
create policy adjustments_select on public.adjustments for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));

revoke all on public.expense_categories, public.expenses, public.other_income, public.cash_closings,
  public.period_locks, public.adjustments, public.cash_book from anon, authenticated;
grant select on public.expense_categories, public.expenses, public.other_income, public.cash_closings,
  public.period_locks, public.adjustments, public.cash_book to authenticated;
grant insert (name), update (name, is_active) on public.expense_categories to authenticated;

revoke all on function
  public.assert_date_open(date),
  public.money_entry_guard(),
  public.adjustments_guard(),
  public.cash_position(date),
  public.close_day(date, integer, integer, text),
  public.lock_month(date),
  public.record_expense(uuid, integer, public.payment_method, date, text, text),
  public.void_expense(uuid, text),
  public.record_other_income(text, integer, public.payment_method, date, text),
  public.void_other_income(uuid, text),
  public.record_adjustment(text, integer, public.payment_method, date),
  public.monthly_report(date)
from public, anon, authenticated;

grant execute on function
  public.cash_position(date),
  public.close_day(date, integer, integer, text),
  public.lock_month(date),
  public.record_expense(uuid, integer, public.payment_method, date, text, text),
  public.void_expense(uuid, text),
  public.record_other_income(text, integer, public.payment_method, date, text),
  public.void_other_income(uuid, text),
  public.record_adjustment(text, integer, public.payment_method, date),
  public.monthly_report(date)
to authenticated;
