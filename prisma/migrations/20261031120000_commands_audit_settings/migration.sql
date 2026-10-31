-- AD-3, AD-12, AD-15: tenant tables read and written by core's defineCommand.

-- Modules and Subscription state per School (AD-12). Mirrored by platform commands later.
create table "school_settings" (
  "school_id" uuid not null,
  "modules" text[] not null default array['fees', 'report_cards']::text[],
  "subscription_state" text not null default 'trial',
  "updated_at" timestamptz(6) not null default now(),
  constraint "school_settings_pkey" primary key ("school_id"),
  constraint "school_settings_modules_check" check ("modules" <@ array['fees', 'report_cards', 'whatsapp']::text[]),
  constraint "school_settings_subscription_state_check" check ("subscription_state" in ('trial', 'active', 'suspended'))
);

alter table "school_settings" add constraint "school_settings_school_id_fkey"
  foreign key ("school_id") references "schools" ("id") on delete cascade on update cascade;

select app_enable_tenant_rls('school_settings');

-- Audit log (FR-55): ids and changed field names only, never names or phone numbers.
create table "audit_log" (
  "school_id" uuid not null,
  "id" uuid not null default gen_random_uuid(),
  "at" timestamptz(6) not null default now(),
  "actor_kind" text not null,
  "actor_id" uuid,
  "command" text not null,
  "entity" text not null,
  "entity_id" uuid not null,
  "fields" text[] not null,
  constraint "audit_log_pkey" primary key ("school_id", "id"),
  constraint "audit_log_actor_check" check (
    ("actor_kind" = 'user' and "actor_id" is not null) or ("actor_kind" = 'system' and "actor_id" is null)
  )
);

alter table "audit_log" add constraint "audit_log_school_id_fkey"
  foreign key ("school_id") references "schools" ("id") on delete restrict on update cascade;

create index "audit_log_school_at_idx" on "audit_log" ("school_id", "at" desc);

select app_enable_tenant_rls('audit_log');

-- Insert-only: no grant for the app role, and a trigger that stops every role, owner included.
revoke update, delete, truncate on "audit_log" from eskool_app;

create function audit_log_reject_change() returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is insert-only';
end
$$;

create trigger "audit_log_insert_only"
  before update or delete on "audit_log"
  for each row execute function audit_log_reject_change();

create trigger "audit_log_no_truncate"
  before truncate on "audit_log"
  for each statement execute function audit_log_reject_change();

-- Idempotency (AD-15): a repeat (School, command, requestId) returns the stored result,
-- only to the same actor with the same input (actor_id null for system, input_hash sha256).
create table "command_requests" (
  "school_id" uuid not null,
  "command" text not null,
  "request_id" uuid not null,
  "actor_id" uuid,
  "input_hash" text not null,
  "result" jsonb not null,
  "created_at" timestamptz(6) not null default now(),
  constraint "command_requests_pkey" primary key ("school_id", "command", "request_id")
);

alter table "command_requests" add constraint "command_requests_school_id_fkey"
  foreign key ("school_id") references "schools" ("id") on delete cascade on update cascade;

select app_enable_tenant_rls('command_requests');
