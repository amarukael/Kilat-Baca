-- Migration: remove email column from drive_config, replace with single-row constraint
-- Run this against any existing database that has the old drive_config schema.

alter table kilat_baca.drive_config
  drop column if exists email;

alter table kilat_baca.drive_config
  add column if not exists id integer not null default 1;

-- Re-create primary key on id if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'kilat_baca.drive_config'::regclass
      and contype = 'p'
  ) then
    alter table kilat_baca.drive_config add primary key (id);
  end if;
end$$;

alter table kilat_baca.drive_config
  add constraint if not exists drive_config_single_row check (id = 1);
