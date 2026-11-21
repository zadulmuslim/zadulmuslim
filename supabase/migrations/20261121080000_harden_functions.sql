-- Fixed search_path for the updated_at trigger.
alter function public.set_updated_at() set search_path = public;

-- Trigger-only functions must not be callable through the API (/rest/v1/rpc/...).
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.guard_role_change() from public, anon, authenticated;

-- app_role() and is_staff() are used inside RLS policies, so signed-in and
-- anonymous requests still need EXECUTE; they only reveal the caller's own role.
