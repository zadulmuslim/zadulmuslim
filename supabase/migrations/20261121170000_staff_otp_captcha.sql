-- Staff two-step login (email OTP) and captcha replay protection.
--
-- A staff member's (editor/admin/super_admin) Supabase session only carries
-- staff powers after it has been verified with an emailed one-time code.
-- Verification is stored per session (the JWT's session_id claim), so a
-- password alone — even used directly against the Supabase API — only ever
-- yields member-level access. Rows disappear automatically when the
-- session ends (FK to auth.sessions with ON DELETE CASCADE).

create table if not exists public.staff_sessions (
  session_id  uuid primary key references auth.sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now()
);
create index if not exists staff_sessions_user_idx on public.staff_sessions (user_id);

create table if not exists public.login_otps (
  session_id   uuid primary key references auth.sessions (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     smallint not null default 0,
  sends        smallint not null default 1,
  last_sent_at timestamptz not null default now()
);

create table if not exists public.captcha_used (
  nonce      text primary key,
  expires_at timestamptz not null
);

-- Server-only tables: RLS on, no policies, no grants for API roles.
alter table public.staff_sessions enable row level security;
alter table public.login_otps     enable row level security;
alter table public.captcha_used   enable row level security;
revoke all on public.staff_sessions, public.login_otps, public.captcha_used from anon, authenticated;

-- Effective role: staff roles count only on a verified session.
create or replace function public.app_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  with r as (
    select coalesce((select role from public.profiles where id = auth.uid()), 'member'::public.user_role) as role
  )
  select case
    when r.role = 'member' then r.role
    when exists (
      select 1 from public.staff_sessions s
      where s.user_id = auth.uid()
        and s.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    ) then r.role
    else 'member'::public.user_role
  end
  from r
$$;

-- Lets the app ask "is my current session verified?" without table access.
create or replace function public.session_verified()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff_sessions s
    where s.user_id = auth.uid()
      and s.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  )
$$;
revoke execute on function public.session_verified() from anon;
grant execute on function public.session_verified() to authenticated;
