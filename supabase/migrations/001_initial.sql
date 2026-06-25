-- Run this in your Supabase SQL editor to set up the schema.

create extension if not exists "pgcrypto";

-- ── Schema ───────────────────────────────────────────────────────────────────

create schema if not exists kilat_baca;

set search_path to kilat_baca;

-- ── Teachers ────────────────────────────────────────────────────────────────

create table if not exists kilat_baca.teachers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- ── Auth sessions (HTTP-only cookie tokens) ─────────────────────────────────

create table if not exists kilat_baca.auth_sessions (
  token       uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references kilat_baca.teachers(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ── Learning sessions ────────────────────────────────────────────────────────

create table if not exists kilat_baca.sessions (
  id                 uuid primary key default gen_random_uuid(),
  teacher_id         uuid not null references kilat_baca.teachers(id) on delete cascade,
  title              text not null,
  description        text not null default '',
  default_duration   int not null default 5,
  default_gap        int not null default 1,
  shuffle_enabled    boolean not null default false,
  show_seconds_timer boolean not null default true,
  share_token        uuid unique not null default gen_random_uuid(),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Slides ───────────────────────────────────────────────────────────────────

create table if not exists kilat_baca.slides (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references kilat_baca.sessions(id) on delete cascade,
  order_index     int not null default 0,
  type            text not null check (type in ('text', 'image')),
  content_text    text,
  image_url       text,
  image_label     text,
  custom_duration int,
  custom_gap      int,
  created_at      timestamptz not null default now()
);

create index if not exists slides_session_id_idx on kilat_baca.slides(session_id);
create index if not exists sessions_teacher_id_idx on kilat_baca.sessions(teacher_id);
create index if not exists auth_sessions_teacher_id_idx on kilat_baca.auth_sessions(teacher_id);

-- Grant usage to authenticated and service_role
grant usage on schema kilat_baca to service_role;
grant all on all tables in schema kilat_baca to service_role;
grant all on all sequences in schema kilat_baca to service_role;

-- Images are stored in Google Drive (see /api/upload).
-- No Supabase Storage bucket needed.
