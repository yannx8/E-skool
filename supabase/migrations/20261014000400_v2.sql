-- =============================================================================
-- V2: enrollment pipeline, parent portal link, automatic reminder queue.
-- =============================================================================

create type public.application_status as enum ('new', 'contacted', 'visit', 'accepted', 'enrolled', 'rejected');

create table public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  child_last_name text not null check (length(trim(child_last_name)) > 0),
  child_first_name text not null default '',
  birth_date date,
  desired_class_id uuid references public.classes (id),
  school_year_id uuid references public.school_years (id),
  parent_name text,
  parent_phone text check (parent_phone ~ '^2376[0-9]{8}$'),
  source text,
  status public.application_status not null default 'new',
  notes text,
  pupil_id uuid references public.pupils (id),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enrollment_applications_status_idx on public.enrollment_applications (status, created_at desc);

create trigger enrollment_applications_updated_at before update on public.enrollment_applications
  for each row execute function public.set_updated_at();

-- Turns an application into a pupil enrolled in the given year and class.
create function public.enroll_application(p_application_id uuid, p_school_year_id uuid, p_class_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.enrollment_applications;
  v_pupil_id uuid;
begin
  perform public.require_role(array['admin', 'secretary']::public.app_role[]);
  select * into v_app from public.enrollment_applications where id = p_application_id for update;
  if not found then
    perform public.raise_app_error('Demande introuvable.');
  end if;
  if v_app.pupil_id is not null or v_app.status = 'enrolled' then
    perform public.raise_app_error('Cette demande a déjà été transformée en inscription.');
  end if;

  insert into public.pupils (last_name, first_name, parent_name, parent_phone, notes)
  values (upper(trim(v_app.child_last_name)), trim(v_app.child_first_name), v_app.parent_name,
          v_app.parent_phone, v_app.notes)
  returning id into v_pupil_id;

  insert into public.enrollments (pupil_id, school_year_id, class_id)
  values (v_pupil_id, p_school_year_id, p_class_id);

  update public.enrollment_applications
  set status = 'enrolled', pupil_id = v_pupil_id, school_year_id = p_school_year_id, desired_class_id = p_class_id
  where id = p_application_id;

  return v_pupil_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Automatic reminders (WhatsApp Cloud API). Rows are written by the server
-- cron with the service role only.
-- -----------------------------------------------------------------------------
create table public.message_jobs (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils (id),
  school_year_id uuid references public.school_years (id),
  term smallint,
  channel text not null default 'whatsapp_api',
  to_phone text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index message_jobs_created_at_idx on public.message_jobs (created_at desc);

-- Candidates for an automatic reminder: active pupils of the current year with
-- an overdue amount on a term, a parent phone, and no reminder (manual or
-- automatic) for that term within the configured interval.
create function public.due_auto_reminders(p_limit integer default 50)
returns table (
  pupil_id uuid,
  school_year_id uuid,
  term smallint,
  last_name text,
  first_name text,
  parent_name text,
  parent_phone text,
  class_name text,
  remaining integer,
  due_date date,
  portal_token text
)
language sql
stable
security definer
set search_path = ''
as $$
  select ptb.pupil_id, ptb.school_year_id, ptb.term, ptb.last_name, ptb.first_name,
         ptb.parent_name, ptb.parent_phone, ptb.class_name, ptb.remaining, ptb.due_date,
         p.portal_token
  from public.pupil_term_balance ptb
  join public.school_years sy on sy.id = ptb.school_year_id and sy.is_current
  join public.pupils p on p.id = ptb.pupil_id
  cross join public.settings s
  where ptb.is_active
    and ptb.parent_phone is not null
    and ptb.remaining > 0
    and ptb.due_date < public.app_today()
    and not exists (
      select 1 from public.reminder_log rl
      where rl.pupil_id = ptb.pupil_id
        and rl.school_year_id = ptb.school_year_id
        and rl.term is not distinct from ptb.term
        and rl.created_at > now() - make_interval(days => s.auto_reminder_interval_days)
    )
  order by ptb.remaining desc
  limit least(greatest(coalesce(p_limit, 50), 1), 500)
$$;

-- -----------------------------------------------------------------------------
-- Parent portal: read-only page reachable with an unguessable token (128 bits).
-- Exposes only what a parent needs: names, class, balances and receipts.
-- -----------------------------------------------------------------------------
create function public.parent_portal(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pupil public.pupils;
  v_year public.school_years;
  v_class text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return null;
  end if;
  select * into v_pupil from public.pupils where portal_token = p_token;
  if not found then
    return null;
  end if;

  select sy.* into v_year
  from public.enrollments e
  join public.school_years sy on sy.id = e.school_year_id
  where e.pupil_id = v_pupil.id
  order by sy.is_current desc, sy.label desc
  limit 1;

  select c.name into v_class
  from public.enrollments e join public.classes c on c.id = e.class_id
  where e.pupil_id = v_pupil.id and e.school_year_id = v_year.id;

  return jsonb_build_object(
    'school', (select jsonb_build_object('name', s.school_name, 'phone', s.phone, 'address', s.address,
                                         'term_label', s.term_label, 'logo_path', s.logo_path)
               from public.settings s),
    'pupil', jsonb_build_object('last_name', v_pupil.last_name, 'first_name', v_pupil.first_name,
                                'is_active', v_pupil.is_active),
    'school_year', v_year.label,
    'class_name', v_class,
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'fee', bl.fee, 'term', bl.term, 'due_date', bl.due_date, 'due', bl.due,
               'applied', bl.applied, 'remaining', bl.remaining, 'status', bl.status)
             order by bl.term nulls first, bl.fee)
      from public.balance_lines bl
      where bl.pupil_id = v_pupil.id and bl.school_year_id = v_year.id), '[]'::jsonb),
    'credit', coalesce((
      select yb.credit from public.pupil_year_balance yb
      where yb.pupil_id = v_pupil.id and yb.school_year_id = v_year.id), 0),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'paid_at', p.paid_at, 'receipt_number', p.receipt_number, 'amount', p.amount,
               'method', p.method, 'fee', p.fee, 'term', p.term)
             order by p.paid_at desc, p.created_at desc)
      from public.payments p
      where p.pupil_id = v_pupil.id and p.school_year_id = v_year.id and not p.voided), '[]'::jsonb)
  );
end;
$$;

-- Audit
create trigger audit_enrollment_applications after insert or update or delete on public.enrollment_applications
  for each row execute function public.audit_trigger();

-- RLS
alter table public.enrollment_applications enable row level security;
alter table public.message_jobs enable row level security;

create policy enrollment_applications_select on public.enrollment_applications for select to authenticated
  using ((select public.auth_role()) is not null);
create policy enrollment_applications_insert on public.enrollment_applications for insert to authenticated
  with check ((select public.auth_role()) in ('admin', 'secretary'));
create policy enrollment_applications_update on public.enrollment_applications for update to authenticated
  using ((select public.auth_role()) in ('admin', 'secretary'))
  with check ((select public.auth_role()) in ('admin', 'secretary'));
create policy enrollment_applications_delete on public.enrollment_applications for delete to authenticated
  using ((select public.auth_role()) = 'admin' and status in ('new', 'contacted', 'visit', 'rejected'));

create policy message_jobs_select on public.message_jobs for select to authenticated
  using ((select public.auth_role()) in ('admin', 'owner'));

revoke all on public.enrollment_applications, public.message_jobs from anon, authenticated;
grant select, insert, update, delete on public.enrollment_applications to authenticated;
grant select on public.message_jobs to authenticated;

revoke all on function
  public.enroll_application(uuid, uuid, uuid),
  public.due_auto_reminders(integer),
  public.parent_portal(text)
from public, anon, authenticated;

grant execute on function public.enroll_application(uuid, uuid, uuid) to authenticated;
grant execute on function public.parent_portal(text) to anon, authenticated;
grant execute on function public.due_auto_reminders(integer) to service_role;
