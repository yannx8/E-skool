-- AD-2, AD-5, AD-13: staff identity, Memberships and sign-in events.
-- All global (no RLS); only the platform module reaches them. better-auth core shapes.

create table "users" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "email" text not null,
  "email_verified" boolean not null default false,
  "image" text,
  "phone_number" text,
  "created_at" timestamptz(6) not null default now(),
  "updated_at" timestamptz(6) not null default now(),
  constraint "users_pkey" primary key ("id"),
  constraint "users_email_lower_check" check ("email" = lower("email")),
  constraint "users_phone_number_check" check ("phone_number" ~ '^\+237[0-9]{9}$')
);
create unique index "users_email_key" on "users" ("email");
create unique index "users_phone_number_key" on "users" ("phone_number");

create table "sessions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "token" text not null,
  "expires_at" timestamptz(6) not null,
  "ip_address" text,
  "user_agent" text,
  "active_school_id" uuid,
  "created_at" timestamptz(6) not null default now(),
  "updated_at" timestamptz(6) not null default now(),
  constraint "sessions_pkey" primary key ("id")
);
create unique index "sessions_token_key" on "sessions" ("token");
create index "sessions_user_id_idx" on "sessions" ("user_id");
create index "sessions_active_school_id_idx" on "sessions" ("active_school_id");
alter table "sessions" add constraint "sessions_user_id_fkey"
  foreign key ("user_id") references "users" ("id") on delete cascade on update cascade;
alter table "sessions" add constraint "sessions_active_school_id_fkey"
  foreign key ("active_school_id") references "schools" ("id") on delete set null on update cascade;

create table "accounts" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "account_id" text not null,
  "provider_id" text not null,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz(6),
  "refresh_token_expires_at" timestamptz(6),
  "scope" text,
  "password" text,
  "created_at" timestamptz(6) not null default now(),
  "updated_at" timestamptz(6) not null default now(),
  constraint "accounts_pkey" primary key ("id")
);
create index "accounts_user_id_idx" on "accounts" ("user_id");
alter table "accounts" add constraint "accounts_user_id_fkey"
  foreign key ("user_id") references "users" ("id") on delete cascade on update cascade;

create table "auth_verifications" (
  "id" uuid not null default gen_random_uuid(),
  "identifier" text not null,
  "value" text not null,
  "expires_at" timestamptz(6) not null,
  "created_at" timestamptz(6) not null default now(),
  "updated_at" timestamptz(6) not null default now(),
  constraint "auth_verifications_pkey" primary key ("id")
);
create index "auth_verifications_identifier_idx" on "auth_verifications" ("identifier");

-- A User's Roles and scope in one School. school_id is a reference, not a tenant key:
-- platform reads a User's Memberships across Schools to build the picker.
create table "memberships" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "school_id" uuid not null,
  "roles" text[] not null,
  "class_ids" uuid[] not null default '{}',
  "subject_ids" uuid[] not null default '{}',
  "created_at" timestamptz(6) not null default now(),
  constraint "memberships_pkey" primary key ("id"),
  constraint "memberships_roles_check" check (
    cardinality("roles") > 0 and "roles" <@ array['promoter', 'director', 'cashier', 'teacher']::text[]
  )
);
create unique index "memberships_user_id_school_id_key" on "memberships" ("user_id", "school_id");
create index "memberships_school_id_idx" on "memberships" ("school_id");
alter table "memberships" add constraint "memberships_user_id_fkey"
  foreign key ("user_id") references "users" ("id") on delete cascade on update cascade;
alter table "memberships" add constraint "memberships_school_id_fkey"
  foreign key ("school_id") references "schools" ("id") on delete cascade on update cascade;

-- Every sign-in attempt and sign-out. identifier_hash is sha256 hex; never raw identifiers.
create table "auth_events" (
  "id" uuid not null default gen_random_uuid(),
  "at" timestamptz(6) not null default now(),
  "kind" text not null,
  "identifier_hash" text,
  "user_id" uuid,
  "ip" text,
  constraint "auth_events_pkey" primary key ("id"),
  constraint "auth_events_kind_check" check ("kind" in ('success', 'failure', 'locked', 'sign_out', 'sign_out_all')),
  constraint "auth_events_identifier_hash_check" check ("identifier_hash" ~ '^[0-9a-f]{64}$')
);
create index "auth_events_identifier_at_idx" on "auth_events" ("identifier_hash", "at" desc);
create index "auth_events_ip_at_idx" on "auth_events" ("ip", "at" desc);

grant select, insert, update on "users", "accounts" to eskool_app;
grant select, insert, update, delete on "sessions", "auth_verifications", "memberships" to eskool_app;

-- Insert-only, like audit_log: no update/delete grant, and a trigger that stops every role.
grant select, insert on "auth_events" to eskool_app;

create function auth_events_reject_change() returns trigger
language plpgsql
as $$
begin
  raise exception 'auth_events is insert-only';
end
$$;

create trigger "auth_events_insert_only"
  before update or delete on "auth_events"
  for each row execute function auth_events_reject_change();

create trigger "auth_events_no_truncate"
  before truncate on "auth_events"
  for each statement execute function auth_events_reject_change();
