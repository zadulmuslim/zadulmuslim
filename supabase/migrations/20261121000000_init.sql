-- ─────────────────────────────────────────────────────────────────────
-- Zadulmuslim (যাদুল মুসলিম) — initial schema
-- Supabase PostgreSQL = relational data + Supabase Auth users.
-- Files live in Cloudflare R2; this database stores only their metadata
-- (object key, URL, MIME type, size, owner, visibility). No binary data,
-- and Supabase's own file-storage service is not used.
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── Types ──────────────────────────────────────────────────────────────
create type public.user_role        as enum ('member', 'editor', 'admin');
create type public.media_visibility as enum ('public', 'authenticated', 'private');
create type public.media_status     as enum ('pending', 'ready', 'deleted');
create type public.content_status   as enum ('draft', 'published', 'archived');
create type public.question_status  as enum ('pending', 'in_review', 'answered', 'rejected');
create type public.lecture_kind     as enum ('video', 'audio', 'nasheed');

-- ── Helpers ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Profiles (1:1 with auth.users) ────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text,
  role            public.user_role not null default 'member',
  avatar_media_id uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.app_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'member'::public.user_role)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.app_role() in ('editor', 'admin')
$$;

-- New auth user → profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins (or the service role) may change roles
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and public.app_role() <> 'admin' then
    raise exception 'only admins can change roles';
  end if;
  return new;
end $$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_role_change();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Media: metadata for objects stored in Cloudflare R2 ───────────────
create table public.media (
  id                uuid primary key default gen_random_uuid(),
  category          text not null check (category in (
                      'article-featured', 'article-inline', 'quran', 'hadith', 'book',
                      'lecture-thumbnail', 'lecture-video', 'audio', 'document',
                      'profile', 'site-asset')),
  visibility        public.media_visibility not null default 'public',
  bucket            text not null,                     -- R2 bucket name
  object_key        text not null,                     -- e.g. articles/2026/11/<uuid>-name.webp
  public_url        text,                              -- set only for public objects
  mime_type         text not null,
  size_bytes        bigint not null check (size_bytes > 0),
  original_filename text not null,
  alt_text          text,
  width             integer,
  height            integer,
  duration_seconds  integer,
  status            public.media_status not null default 'pending',
  owner_id          uuid references auth.users (id) on delete set null,
  replaces_id       uuid references public.media (id) on delete cascade,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (bucket, object_key),
  check ((visibility = 'public') = (public_url is not null))
);

create index media_owner_idx    on public.media (owner_id);
create index media_category_idx on public.media (category) where status = 'ready';
create index media_pending_idx  on public.media (created_at) where status <> 'ready';

create trigger media_updated_at before update on public.media
  for each row execute function public.set_updated_at();

alter table public.profiles
  add constraint profiles_avatar_fk foreign key (avatar_media_id)
  references public.media (id) on delete set null;

-- ── Articles (প্রবন্ধ) ─────────────────────────────────────────────────
create table public.article_categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name_bn        text not null,
  description_bn text,
  sort_order     integer not null default 0
);

create table public.articles (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  excerpt           text,
  body              text not null default '',
  category_id       uuid references public.article_categories (id) on delete set null,
  author_id         uuid references auth.users (id) on delete set null,
  author_name       text,
  featured_media_id uuid references public.media (id) on delete set null,
  reading_minutes   integer,
  status            public.content_status not null default 'draft',
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index articles_published_idx on public.articles (published_at desc) where status = 'published';
create trigger articles_updated_at before update on public.articles
  for each row execute function public.set_updated_at();

-- Inline images used in an article body
create table public.article_media (
  article_id uuid not null references public.articles (id) on delete cascade,
  media_id   uuid not null references public.media (id) on delete cascade,
  position   integer not null default 0,
  primary key (article_id, media_id)
);

-- ── Q&A (প্রশ্নোত্তর) ──────────────────────────────────────────────────
create table public.question_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_bn    text not null,
  sort_order integer not null default 0
);

create table public.questions (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  title        text not null,
  question     text not null,
  answer       text,
  category_id  uuid references public.question_categories (id) on delete set null,
  asker_id     uuid references auth.users (id) on delete set null,
  asker_email  text,                      -- for answer notification; staff-only
  status       public.question_status not null default 'pending',
  is_public    boolean not null default true,
  answered_by  uuid references auth.users (id) on delete set null,
  answered_at  timestamptz,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index questions_public_idx on public.questions (published_at desc) where status = 'answered' and is_public;
create trigger questions_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

-- ── Lectures (বয়ান ও ভিডিও) ───────────────────────────────────────────
create table public.lectures (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  description        text,
  speaker            text,
  kind               public.lecture_kind not null default 'video',
  thumbnail_media_id uuid references public.media (id) on delete set null,
  video_media_id     uuid references public.media (id) on delete set null,
  audio_media_id     uuid references public.media (id) on delete set null,
  external_video_url text,                -- e.g. YouTube, when the video is not self-hosted
  duration_seconds   integer,
  status             public.content_status not null default 'draft',
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger lectures_updated_at before update on public.lectures
  for each row execute function public.set_updated_at();

-- ── Library (লাইব্রেরি: PDF/EPUB books & resources) ───────────────────
create table public.books (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  author_name    text,
  description    text,
  subject        text,                   -- quran | hadith | fiqh | seerah | ...
  cover_media_id uuid references public.media (id) on delete set null,
  file_media_id  uuid references public.media (id) on delete set null,
  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger books_updated_at before update on public.books
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.media               enable row level security;
alter table public.article_categories  enable row level security;
alter table public.articles            enable row level security;
alter table public.article_media       enable row level security;
alter table public.question_categories enable row level security;
alter table public.questions           enable row level security;
alter table public.lectures            enable row level security;
alter table public.books               enable row level security;

-- profiles
create policy "profiles: read own or staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin manage" on public.profiles
  for all using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- media: read according to visibility; ALL writes go through the server
-- (service role) after the app's own permission checks.
create policy "media: read by visibility" on public.media
  for select using (
    status = 'ready' and (
      visibility = 'public'
      or (visibility = 'authenticated' and auth.uid() is not null)
      or owner_id = auth.uid()
      or public.is_staff()
    )
  );

-- published content is public; staff can read and write everything
create policy "article_categories: read" on public.article_categories for select using (true);
create policy "article_categories: staff write" on public.article_categories for all using (public.is_staff()) with check (public.is_staff());

create policy "articles: read published" on public.articles
  for select using (status = 'published' or public.is_staff());
create policy "articles: staff write" on public.articles for all using (public.is_staff()) with check (public.is_staff());

create policy "article_media: read" on public.article_media
  for select using (exists (select 1 from public.articles a where a.id = article_id and (a.status = 'published' or public.is_staff())));
create policy "article_media: staff write" on public.article_media for all using (public.is_staff()) with check (public.is_staff());

create policy "question_categories: read" on public.question_categories for select using (true);
create policy "question_categories: staff write" on public.question_categories for all using (public.is_staff()) with check (public.is_staff());

create policy "questions: read answered or own" on public.questions
  for select using ((status = 'answered' and is_public) or asker_id = auth.uid() or public.is_staff());
create policy "questions: staff write" on public.questions for all using (public.is_staff()) with check (public.is_staff());
-- Public reads must not expose asker contact details: grant every column
-- except asker_email (staff read it through the server / service role).
revoke select on public.questions from anon, authenticated;
grant select (id, slug, title, question, answer, category_id, asker_id, status, is_public,
              answered_by, answered_at, published_at, created_at, updated_at)
  on public.questions to anon, authenticated;

create policy "lectures: read published" on public.lectures
  for select using (status = 'published' or public.is_staff());
create policy "lectures: staff write" on public.lectures for all using (public.is_staff()) with check (public.is_staff());

create policy "books: read published" on public.books
  for select using (status = 'published' or public.is_staff());
create policy "books: staff write" on public.books for all using (public.is_staff()) with check (public.is_staff());
