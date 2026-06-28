-- Migration: tambah kolom status pada tabel teachers
-- Status: 'pending' (belum dikonfirmasi), 'active' (disetujui), 'rejected' (ditolak)

alter table kilat_baca.teachers
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected'));

-- Teacher yang sudah ada sebelum migration ini dianggap sudah aktif
update kilat_baca.teachers set status = 'active' where status = 'pending';

create index if not exists teachers_status_idx on kilat_baca.teachers(status);
