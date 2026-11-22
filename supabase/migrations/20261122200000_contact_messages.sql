-- Messages from the contact page (server-only, like comments).
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 200),
  topic text not null check (topic in ('general', 'correction', 'suggestion', 'technical', 'partnership', 'other')),
  subject text not null check (char_length(subject) between 4 and 150),
  message text not null check (char_length(message) between 20 and 5000),
  page_url text check (page_url is null or char_length(page_url) <= 300),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index if not exists contact_messages_email_idx on public.contact_messages (email, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
