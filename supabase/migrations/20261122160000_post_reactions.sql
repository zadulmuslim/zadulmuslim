-- Reactions move from comments to the posts themselves.
create table if not exists public.post_reactions (
  target_type text not null check (target_type in ('question', 'article', 'hadith', 'lecture')),
  target_id text not null check (char_length(target_id) between 1 and 64),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('like', 'love', 'care', 'wow', 'sad', 'dua')),
  created_at timestamptz not null default now(),
  primary key (target_type, target_id, user_id)
);
create index if not exists post_reactions_user_idx on public.post_reactions (user_id);

-- Server-only access (admin client after a session check), like comments.
alter table public.post_reactions enable row level security;
revoke all on public.post_reactions from anon, authenticated;

-- Comment reactions are no longer used (the table was empty).
drop table if exists public.comment_reactions;
