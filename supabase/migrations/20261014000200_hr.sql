-- =============================================================================
-- V1.1 HR: staff, salary history (append-only), monthly payroll register.
-- Statutory contributions (CNPS, taxes) are intentionally NOT computed: confirm
-- the rules with the school's accountant before adding them.
-- =============================================================================

create type public.contract_type as enum ('permanent', 'fixed_term', 'part_time', 'volunteer');

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  job_title text not null check (length(trim(job_title)) > 0),
  contract public.contract_type not null default 'permanent',
  phone text check (phone ~ '^2376[0-9]{8}$'),
  start_date date,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create trigger staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();

-- BR7: a salary change is a new row, never an overwrite.
create table public.staff_salary_history (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id),
  monthly_amount integer not null check (monthly_amount >= 0),
  effective_from date not null,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint staff_salary_history_unique unique (staff_id, effective_from)
);

create trigger staff_salary_history_append_only before update or delete on public.staff_salary_history
  for each row execute function public.block_mutation();

create view public.staff_current_salary
with (security_invoker = true)
as
select distinct on (h.staff_id)
  h.staff_id,
  h.monthly_amount,
  h.effective_from
from public.staff_salary_history h
where h.effective_from <= public.app_today()
order by h.staff_id, h.effective_from desc;

create table public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id),
  month date not null check (extract(day from month) = 1),
  base_amount integer not null check (base_amount >= 0),
  advances integer not null default 0 check (advances >= 0),
  deductions integer not null default 0 check (deductions >= 0),
  bonuses integer not null default 0 check (bonuses >= 0),
  net_amount integer generated always as (base_amount + bonuses - advances - deductions) stored,
  method public.payment_method,
  paid_at date,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  payslip_number text unique,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_entries_one_per_month unique (staff_id, month),
  check (base_amount + bonuses - advances - deductions >= 0),
  check (status = 'pending' or (method is not null and paid_at is not null and payslip_number is not null))
);
create index payroll_entries_month_idx on public.payroll_entries (month);
create index payroll_entries_paid_at_idx on public.payroll_entries (paid_at) where status = 'paid';

create trigger payroll_entries_updated_at before update on public.payroll_entries
  for each row execute function public.set_updated_at();

-- Paid entries are frozen; pending ones can be edited and deleted.
create function public.payroll_entries_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'paid' then
    perform public.raise_app_error('Ce salaire est déjà payé : il ne peut plus être modifié.');
  end if;
  if tg_op = 'UPDATE' and new.status = 'paid' then
    if new.paid_at > public.app_today() then
      perform public.raise_app_error('La date de paiement ne peut pas être dans le futur.');
    end if;
    perform public.assert_date_open(new.paid_at);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger payroll_entries_guard before update or delete on public.payroll_entries
  for each row execute function public.payroll_entries_guard();

-- Monthly salary of a staff member for a given month: latest salary effective
-- on or before the last day of that month.
create function public.salary_for_month(p_staff_id uuid, p_month date)
returns integer
language sql
stable
set search_path = ''
as $$
  select h.monthly_amount
  from public.staff_salary_history h
  where h.staff_id = p_staff_id
    and h.effective_from <= (date_trunc('month', p_month) + interval '1 month - 1 day')::date
  order by h.effective_from desc
  limit 1
$$;

-- FR-H3: create pending payroll lines for every active staff member with a
-- salary. Existing lines for the month are kept. Returns the number created.
create function public.prepare_payroll(p_month date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_month)::date;
  v_count integer;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  insert into public.payroll_entries (staff_id, month, base_amount)
  select s.id, v_month, public.salary_for_month(s.id, v_month)
  from public.staff s
  where s.is_active
    and (s.start_date is null or s.start_date <= (v_month + interval '1 month - 1 day')::date)
    and public.salary_for_month(s.id, v_month) is not null
  on conflict on constraint payroll_entries_one_per_month do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.update_payroll_entry(
  p_entry_id uuid,
  p_advances integer,
  p_deductions integer,
  p_bonuses integer,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_role(array['admin']::public.app_role[]);
  update public.payroll_entries
  set advances = coalesce(p_advances, 0),
      deductions = coalesce(p_deductions, 0),
      bonuses = coalesce(p_bonuses, 0),
      notes = nullif(trim(p_notes), '')
  where id = p_entry_id;
  if not found then
    perform public.raise_app_error('Ligne de paie introuvable.');
  end if;
end;
$$;

create function public.delete_payroll_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_role(array['admin']::public.app_role[]);
  delete from public.payroll_entries where id = p_entry_id;
end;
$$;

-- FR-H4: mark a salary paid and give it a payslip number BP-YYYYMM-NNN.
create function public.pay_payroll_entry(p_entry_id uuid, p_method public.payment_method, p_paid_at date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.payroll_entries;
  v_number text;
begin
  perform public.require_role(array['admin']::public.app_role[]);
  select * into v_entry from public.payroll_entries where id = p_entry_id for update;
  if not found then
    perform public.raise_app_error('Ligne de paie introuvable.');
  end if;
  if v_entry.status = 'paid' then
    perform public.raise_app_error('Ce salaire est déjà payé.');
  end if;
  v_number := 'BP-' || to_char(v_entry.month, 'YYYYMM') || '-'
    || lpad(public.next_counter('payslip:' || to_char(v_entry.month, 'YYYYMM'))::text, 3, '0');
  update public.payroll_entries
  set status = 'paid',
      method = p_method,
      paid_at = coalesce(p_paid_at, public.app_today()),
      payslip_number = v_number
  where id = p_entry_id;
  return v_number;
end;
$$;

-- Audit
create trigger audit_staff after insert or update or delete on public.staff
  for each row execute function public.audit_trigger();
create trigger audit_staff_salary_history after insert or update or delete on public.staff_salary_history
  for each row execute function public.audit_trigger();
create trigger audit_payroll_entries after insert or update or delete on public.payroll_entries
  for each row execute function public.audit_trigger();

-- RLS: admin writes, owner reads, secretary has no access to HR.
alter table public.staff enable row level security;
alter table public.staff_salary_history enable row level security;
alter table public.payroll_entries enable row level security;

create policy staff_select on public.staff for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));
create policy staff_insert on public.staff for insert to authenticated
  with check ((select public.auth_role()) = 'admin');
create policy staff_update on public.staff for update to authenticated
  using ((select public.auth_role()) = 'admin') with check ((select public.auth_role()) = 'admin');

create policy staff_salary_history_select on public.staff_salary_history for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));
create policy staff_salary_history_insert on public.staff_salary_history for insert to authenticated
  with check ((select public.auth_role()) = 'admin');

create policy payroll_entries_select on public.payroll_entries for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));

revoke all on public.staff, public.staff_salary_history, public.payroll_entries,
  public.staff_current_salary from anon, authenticated;
grant select on public.staff, public.staff_salary_history, public.payroll_entries,
  public.staff_current_salary to authenticated;
grant insert, update on public.staff to authenticated;
grant insert (staff_id, monthly_amount, effective_from, note) on public.staff_salary_history to authenticated;

revoke all on function
  public.payroll_entries_guard(),
  public.salary_for_month(uuid, date),
  public.prepare_payroll(date),
  public.update_payroll_entry(uuid, integer, integer, integer, text),
  public.delete_payroll_entry(uuid),
  public.pay_payroll_entry(uuid, public.payment_method, date)
from public, anon, authenticated;

grant execute on function
  public.salary_for_month(uuid, date),
  public.prepare_payroll(date),
  public.update_payroll_entry(uuid, integer, integer, integer, text),
  public.delete_payroll_entry(uuid),
  public.pay_payroll_entry(uuid, public.payment_method, date)
to authenticated;
