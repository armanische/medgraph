\set ON_ERROR_STOP on

do $contract$
declare
  function_oid oid := 'cloud_api.current_internal_access_v1()'::regprocedure::oid;
begin
  if not exists (
    select 1
    from pg_proc function
    join pg_roles owner on owner.oid = function.proowner
    where function.oid = function_oid
      and function.pronargs = 0
      and function.prosecdef
      and function.provolatile = 's'
      and function.proconfig = array['search_path=pg_catalog, auth, cloud']
      and owner.rolname = 'postgres'
  ) then
    raise exception 'internal access RPC metadata is unsafe';
  end if;

  if has_function_privilege('anon', 'cloud_api.current_internal_access_v1()', 'execute')
     or has_function_privilege('service_role', 'cloud_api.current_internal_access_v1()', 'execute')
     or not has_function_privilege('authenticated', 'cloud_api.current_internal_access_v1()', 'execute') then
    raise exception 'internal access RPC grants are unsafe';
  end if;

  if has_table_privilege('authenticated', 'cloud.user_profiles', 'select') then
    raise exception 'authenticated retained direct user profile read access';
  end if;
end
$contract$;

begin;

insert into cloud.user_profiles (id, role, display_name)
values
  ('71000000-0000-4000-8000-000000000001', 'admin', 'Admin One'),
  ('71000000-0000-4000-8000-000000000002', 'reviewer', 'Reviewer One'),
  ('71000000-0000-4000-8000-000000000003', 'editor', 'Editor One'),
  ('71000000-0000-4000-8000-000000000004', 'admin', 'Admin Two');

set local role authenticated;

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);
select 1 / case when cloud_api.current_internal_access_v1() =
  '{"userId":"71000000-0000-4000-8000-000000000001","role":"admin","displayName":"Admin One","allowed":true}'::jsonb
  then 1 else 0 end as authenticated_admin_receives_own_minimal_dto;

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000002', true);
select 1 / case when cloud_api.current_internal_access_v1() ->> 'allowed' = 'true'
  then 1 else 0 end as authenticated_reviewer_is_allowed;

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000003', true);
select 1 / case when cloud_api.current_internal_access_v1() ->> 'allowed' = 'false'
  then 1 else 0 end as unsupported_role_fails_closed;

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000099', true);
select 1 / case when cloud_api.current_internal_access_v1() ->> 'allowed' = 'false'
  then 1 else 0 end as missing_profile_fails_closed;

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);
select 1 / case when cloud_api.current_internal_access_v1() ->> 'displayName' = 'Admin One'
  and cloud_api.current_internal_access_v1() ->> 'displayName' <> 'Admin Two'
  then 1 else 0 end as caller_cannot_read_another_profile;

reset role;
rollback;
