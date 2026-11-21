-- ─────────────────────────────────────────────────────────────────────
-- Role hierarchy:  member < editor < admin < super_admin
--  • super_admin is set ONLY manually (Supabase SQL editor). No app path
--    can grant it.
--  • Only a super_admin can make someone admin or remove an admin.
--  • admin can change member ↔ editor.
-- Enforced here in the database, so it holds even if app code is wrong.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.app_role() in ('editor', 'admin', 'super_admin')
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.app_role() in ('admin', 'super_admin')
$$;

create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor public.user_role;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;
  -- No signed-in user = SQL editor / migrations: the manual path, allowed.
  if auth.uid() is null then
    return new;
  end if;

  actor := public.app_role();
  if new.role = 'super_admin' or old.role = 'super_admin' then
    raise exception 'super_admin can only be granted or removed manually in Supabase';
  end if;
  if new.role = 'admin' or old.role = 'admin' then
    if actor <> 'super_admin' then
      raise exception 'only a super_admin can grant or remove the admin role';
    end if;
    return new;
  end if;
  if actor not in ('admin', 'super_admin') then
    raise exception 'only admins can change roles';
  end if;
  return new;
end $$;
revoke execute on function public.guard_role_change() from public, anon, authenticated;

drop policy if exists "profiles: admin manage" on public.profiles;
create policy "profiles: admin manage" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Activity log ─────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  actor_name  text,
  action      text not null,               -- e.g. question.publish, user.delete
  entity_type text not null,               -- question | article | media | user | category
  entity_id   text,
  summary     text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;

create policy "audit_log: admins read" on public.audit_log
  for select using (public.is_admin());
create policy "audit_log: staff insert own" on public.audit_log
  for insert with check (public.is_staff() and actor_id = auth.uid());

-- ── Reader question submission ───────────────────────────────────────
alter table public.questions
  add column if not exists asker_name   text,
  add column if not exists notify_email boolean not null default true,
  add column if not exists notified_at  timestamptz;
-- New columns are NOT added to the anon/authenticated column grants, so
-- asker_name stays private like asker_email.

create index if not exists questions_asker_email_idx on public.questions (asker_email, created_at desc);
