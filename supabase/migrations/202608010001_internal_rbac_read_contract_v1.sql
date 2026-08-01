-- CyberMedica Internal RBAC Read Contract v1
-- Authenticated, read-only self access check for server-side internal routes.

begin;

grant usage on schema cloud_api
  to authenticated;

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
  owner to postgres;

revoke all on function cloud_api.current_internal_access_v1()
  from public, anon, service_role;
grant execute on function cloud_api.current_internal_access_v1()
  to authenticated;

comment on function cloud_api.current_internal_access_v1() is
  'Returns the authenticated caller RBAC decision from their own cloud.user_profiles row; no arguments and no writes.';

commit;
