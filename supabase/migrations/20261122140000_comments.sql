-- Comments with replies, reactions and reports on public content.
-- Accessed only through the app's server (service role) after auth checks, so the
-- tables have RLS on with no policies; the API exposes only display name + avatar.

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('question', 'article', 'hadith', 'lecture')),
  target_id   text not null,
  parent_id   uuid references public.comments (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 3000),
  status      text not null default 'visible' check (status in ('visible', 'hidden')),
  edited_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists comments_target_idx on public.comments (target_type, target_id, created_at desc) where parent_id is null;
create index if not exists comments_parent_idx on public.comments (parent_id, created_at);
create index if not exists comments_author_idx on public.comments (author_id, created_at desc);

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('like', 'love', 'care', 'wow', 'sad', 'dua')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.comment_reports (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  reason     text,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.comment_reports enable row level security;
revoke all on public.comments, public.comment_reactions, public.comment_reports from anon, authenticated;
