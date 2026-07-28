-- CyberMedica Internal RBAC Read Contract v1
-- Authenticated, read-only access check for server-side internal routes.

begin;

do $roles$
declare
  reader_role pg_roles%rowtype;
begin
  select * into reader_role
  from pg_roles
  where rolname = 'cybermedica_internal_access_reader';

  if not found then
    create role cybermedica_internal_access_reader
      nologin
      noinherit
      nobypassrls;
  elsif reader_role.rolcanlogin
     or reader_role.rolinherit
     or reader_role.rolbypassrls
     or reader_role.rolsuper
     or reader_role.rolcreaterole
     or reader_role.rolcreatedb
     or reader_role.rolreplication then
    raise exception
      'cybermedica_internal_access_reader exists with unsafe attributes';
  end if;
end
$roles$;

grant usage on schema auth, cloud, cloud_api
  to cybermedica_internal_access_reader;
grant usage on schema cloud_api
  to authenticated;
grant execute on function auth.uid()
  to cybermedica_internal_access_reader;

revoke all on table cloud.user_profiles
  from cybermedica_internal_access_reader;
grant select (id, role, display_name) on table cloud.user_profiles
  to cybermedica_internal_access_reader;

create policy user_profiles_internal_access_reader_self_v1
on cloud.user_profiles
for select
to cybermedica_internal_access_reader
using (id = auth.uid());

-- CREATE is needed only while transferring ownership to the constrained
-- NOLOGIN role. It is revoked immediately after the ownership transfer.
grant create on schema cloud_api
  to cybermedica_internal_access_reader;

create function cloud_api.current_internal_access_v1()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, auth, cloud
as $function$
  with caller as (
    select auth.uid() as user_id
  ), allowed_profile as (
    select
      profile.id,
      profile.role,
      profile.display_name
    from cloud.user_profiles profile
    cross join caller
    where profile.id = caller.user_id
      and profile.role in ('admin', 'reviewer')
  )
  select pg_catalog.jsonb_build_object(
    'userId', caller.user_id,
    'role', allowed_profile.role,
    'displayName', allowed_profile.display_name,
    'allowed', allowed_profile.id is not null
  )
  from caller
  left join allowed_profile on true
$function$;

alter function cloud_api.current_internal_access_v1()
  owner to cybermedica_internal_access_reader;

revoke create on schema cloud_api
  from cybermedica_internal_access_reader;

revoke all on function cloud_api.current_internal_access_v1()
  from public, anon, service_role;
grant execute on function cloud_api.current_internal_access_v1()
  to authenticated;

comment on function cloud_api.current_internal_access_v1() is
  'Returns the authenticated caller RBAC decision from their own cloud.user_profiles row; no arguments and no writes.';

commit;
