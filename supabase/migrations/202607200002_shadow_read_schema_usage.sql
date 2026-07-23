-- Required by SECURITY INVOKER to resolve RLS-protected cloud relations.
-- This PostgreSQL USAGE grant does not expose cloud through PostgREST.

begin;

grant usage on schema cloud to anon, authenticated;

commit;
