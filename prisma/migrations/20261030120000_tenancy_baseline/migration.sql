-- AD-2 tenancy baseline.
-- The runtime connects as eskool_app. It has no BYPASSRLS, so a query that forgets
-- withSchool() sees no tenant rows instead of every School's rows.
-- The role is created NOLOGIN: no password lives in git. Each environment sets its
-- login (dev and CI: tests/db/global-setup.ts; Neon: README).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'eskool_app') then
    create role eskool_app nologin nosuperuser nobypassrls;
  end if;
end
$$;

-- A pre-existing eskool_app with SUPERUSER or BYPASSRLS would silently defeat RLS. Refuse.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'eskool_app' and (rolsuper or rolbypassrls)) then
    raise exception 'role eskool_app must be NOSUPERUSER and NOBYPASSRLS';
  end if;
end
$$;

grant usage on schema public to eskool_app;

-- Global table: the first School. No school_id, no RLS. Only the platform module reaches it.
create table "schools" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "created_at" timestamptz(6) not null default now(),
  constraint "schools_pkey" primary key ("id")
);

grant select, insert, update on "schools" to eskool_app;

-- Migration helper: every tenant table calls this once in its own migration.
-- It enables and forces RLS, creates the single tenant_isolation policy, and grants DML
-- to the app role. A missing app.school_id yields NULL, so no row matches and no error is raised.
create function app_enable_tenant_rls(target regclass) returns void
language plpgsql
as $$
begin
  execute format('alter table %s enable row level security', target);
  execute format('alter table %s force row level security', target);
  execute format('drop policy if exists tenant_isolation on %s', target);
  execute format(
    'create policy tenant_isolation on %s '
    || 'using (school_id = nullif(current_setting(''app.school_id'', true), '''')::uuid) '
    || 'with check (school_id = nullif(current_setting(''app.school_id'', true), '''')::uuid)',
    target
  );
  execute format('grant select, insert, update, delete on %s to eskool_app', target);
end
$$;

revoke execute on function app_enable_tenant_rls(regclass) from public;
