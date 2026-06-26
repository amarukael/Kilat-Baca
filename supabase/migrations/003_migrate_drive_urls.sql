-- Migrate image_url dari format drive.google.com ke format proxy internal.
-- Format lama: https://drive.google.com/uc?export=view&id={fileId}
-- Format baru: /api/drive/file/{fileId}

update kilat_baca.slides
set image_url = '/api/drive/file/' || (
  regexp_match(image_url, '[?&]id=([^&]+)$')
)[1]
where image_url like '%drive.google.com/uc%'
  and image_url like '%id=%';
