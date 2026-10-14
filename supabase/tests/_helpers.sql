-- Test helpers, loaded after the migrations. Tests run inside a transaction
-- that is rolled back, switching roles with set_config like PostgREST does.

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create or replace function tests.create_user(p_email text, p_role public.app_role)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into auth.users (email) values (p_email) returning id into v_id;
  if p_role is not null then
    insert into public.user_roles (user_id, role, full_name) values (v_id, p_role, p_email);
  end if;
  return v_id;
end $$;

create or replace function tests.user_id(p_email text)
returns uuid language sql stable security definer as $$ select id from auth.users where email = p_email $$;

create or replace function tests.login_as(p_email text)
returns void language plpgsql as $$
declare v_id uuid := tests.user_id(p_email);
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function tests.login_anon()
returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
end $$;

create or replace function tests.logout()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Runs p_sql and asserts it raises an error whose message contains p_fragment.
create or replace function tests.assert_fails(p_sql text, p_fragment text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(lower(p_fragment) in lower(sqlerrm)) = 0 then
      raise exception 'Expected error containing "%" but got "%" for: %', p_fragment, sqlerrm, p_sql;
    end if;
    return;
  end;
  raise exception 'Expected failure ("%") but statement succeeded: %', p_fragment, p_sql;
end $$;

create or replace function tests.assert_eq(p_actual anyelement, p_expected anyelement, p_label text)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'ASSERT FAILED [%]: expected %, got %', p_label, p_expected, p_actual;
  end if;
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;
