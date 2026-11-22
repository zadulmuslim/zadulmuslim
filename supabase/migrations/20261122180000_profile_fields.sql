-- Richer member profiles.
alter table public.profiles
  add column if not exists bio text check (bio is null or char_length(bio) <= 300),
  add column if not exists location text check (location is null or char_length(location) <= 80),
  add column if not exists occupation text check (occupation is null or char_length(occupation) <= 80),
  add column if not exists phone text check (phone is null or char_length(phone) <= 20);
