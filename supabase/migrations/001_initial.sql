-- Run this in your Supabase SQL editor to set up the schema.

create extension if not exists "pgcrypto";

-- ── Teachers ────────────────────────────────────────────────────────────────

create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- ── Auth sessions (HTTP-only cookie tokens) ─────────────────────────────────

create table if not exists auth_sessions (
  token       uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references teachers(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ── Learning sessions ────────────────────────────────────────────────────────

create table if not exists sessions (
  id                 uuid primary key default gen_random_uuid(),
  teacher_id         uuid not null references teachers(id) on delete cascade,
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

create table if not exists slides (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete cascade,
  order_index     int not null default 0,
  type            text not null check (type in ('text', 'image')),
  content_text    text,
  image_url       text,
  image_label     text,
  custom_duration int,
  custom_gap      int,
  created_at      timestamptz not null default now()
);

create index if not exists slides_session_id_idx on slides(session_id);
create index if not exists sessions_teacher_id_idx on sessions(teacher_id);
create index if not exists auth_sessions_teacher_id_idx on auth_sessions(teacher_id);

-- ── Storage bucket for slide images ─────────────────────────────────────────
-- Run in Supabase dashboard → Storage → New bucket, or via the SQL below.
-- NOTE: Bucket policies are managed in the dashboard or via the API.

insert into storage.buckets (id, name, public)
  values ('slide-images', 'slide-images', true)
  on conflict (id) do nothing;

-- Allow service role (used by API routes) to read/write all objects.
-- Public read is enabled via bucket.public = true above.
