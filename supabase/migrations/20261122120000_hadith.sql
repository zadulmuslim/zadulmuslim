-- Hadith & du'a: Bengali translations from HadeethEnc.com (republished unmodified with credit).

create table if not exists public.hadith_categories (
  id              int primary key,
  title_bn        text not null,
  parent_id       int references public.hadith_categories (id),
  hadeeths_count  int not null default 0
);

create table if not exists public.hadiths (
  id              int primary key,
  title_bn        text not null,
  hadeeth_bn      text not null,
  hadeeth_ar      text,
  attribution_bn  text,
  attribution_ar  text,
  grade_bn        text,
  grade_ar        text,
  explanation_bn  text,
  hints_bn        jsonb not null default '[]',
  categories      int[] not null default '{}',
  imported_at     timestamptz not null default now()
);
create index if not exists hadiths_categories_idx on public.hadiths using gin (categories);

alter table public.hadith_categories enable row level security;
alter table public.hadiths enable row level security;
create policy "hadith_categories: public read" on public.hadith_categories for select using (true);
create policy "hadiths: public read" on public.hadiths for select using (true);
grant select on public.hadith_categories, public.hadiths to anon, authenticated;

-- Data: imported from https://hadeethenc.com/api/v1 (categories/list, hadeeths/list per root
-- category, hadeeths/one per id, language=bn) with the http extension; see PR description.
