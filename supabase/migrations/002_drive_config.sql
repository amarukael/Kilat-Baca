-- Add drive_config table with OAuth credentials stored per-account.
-- client_id and client_secret are stored here instead of env vars
-- so different Google Cloud projects can be used per account.

set search_path to kilat_baca;

create table if not exists kilat_baca.drive_config (
  email          text primary key,
  client_id      text not null,
  client_secret  text not null,
  access_token   text,
  refresh_token  text,
  token_info     jsonb,
  updated_at     timestamptz not null default now()
);

grant all on kilat_baca.drive_config to service_role;
