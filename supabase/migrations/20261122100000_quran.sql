-- Quran: Arabic text (Tanzil, Uthmani) + Bengali translation (Abu Bakr Zakaria, QuranEnc).
-- Data is imported by supabase/content/quran_import.sql; the app only reads.

create table if not exists public.quran_surahs (
  number      smallint primary key check (number between 1 and 114),
  name_ar     text not null,
  name_bn     text not null,
  name_translit text not null,
  meaning_bn  text not null,
  revelation  text not null check (revelation in ('meccan', 'medinan')),
  ayah_count  smallint not null,
  revelation_order smallint,
  rukus       smallint
);

create table if not exists public.quran_ayahs (
  surah       smallint not null references public.quran_surahs (number),
  ayah        smallint not null,
  juz         smallint,
  text_ar     text not null,
  text_bn     text,
  footnotes_bn text,
  primary key (surah, ayah)
);

-- Attribution and version of each imported text (shown on the site, required by the licences).
create table if not exists public.content_sources (
  key         text primary key,
  title_bn    text not null,
  attribution text not null,
  url         text not null,
  license     text not null,
  version     text,
  imported_at timestamptz not null default now()
);

alter table public.quran_surahs enable row level security;
alter table public.quran_ayahs enable row level security;
alter table public.content_sources enable row level security;
create policy "quran_surahs: public read" on public.quran_surahs for select using (true);
create policy "quran_ayahs: public read" on public.quran_ayahs for select using (true);
create policy "content_sources: public read" on public.content_sources for select using (true);
grant select on public.quran_surahs, public.quran_ayahs, public.content_sources to anon, authenticated;
