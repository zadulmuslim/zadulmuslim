-- Separate migration: a new enum value can't be used in the same transaction.
alter type public.user_role add value if not exists 'super_admin';
