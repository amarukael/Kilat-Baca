-- Migration 004: tabel session_plays untuk tracking statistik sesi belajar

set search_path to kilat_baca;

-- ── Session plays ────────────────────────────────────────────────────────────
-- Setiap baris = satu kali siswa membuka/memulai sesi belajar.
-- Tidak perlu auth — dipanggil dari public route /api/sessions/[id]/play.

create table if not exists kilat_baca.session_plays (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references kilat_baca.sessions(id) on delete cascade,
  played_at   timestamptz not null default now()
);

create index if not exists session_plays_session_id_idx on kilat_baca.session_plays(session_id);
create index if not exists session_plays_played_at_idx  on kilat_baca.session_plays(played_at);

-- Grant akses ke service_role (sama seperti tabel lain)
grant all on kilat_baca.session_plays to service_role;
