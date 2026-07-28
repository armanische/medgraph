\set ON_ERROR_STOP on

do $$
declare
  item record;
  function_oid oid;
  owner_name text;
  security_definer boolean;
  public_execute boolean;
begin
  for item in
    select * from (values
      ('cloud.apply_catalog_data_quality_v1(jsonb,text)', '72c3dc5c33d7dd9d9d2f1553701f063f', true, false, false),
      ('cloud.apply_product_import_v1(jsonb,text)', '97c71d5276749a82ccc193f68d2893ad', true, false, false),
      ('cloud.apply_reference_import(jsonb,text)', '37cf7cb673bbea95e1750ae5f149eb60', true, false, false),
      ('cloud.apply_reference_publication(jsonb,text)', 'bc94bab9322dd01ba718d7a54d80b232', true, false, false),
      ('cloud.catalog_admin_patch_product(uuid,jsonb,text)', 'bf7e15acc39049fc6c60abd59be70bd3', true, false, false),
      ('cloud.catalog_admin_product(uuid)', 'fc46210957a45964ffd9aa834e647b24', true, false, false),
      ('cloud.catalog_admin_products(text,text,text)', '1be61b279fcbb7e714d0b9de15aeb2ff', true, false, false),
      ('cloud.catalog_admin_references(text)', 'bfd6db5dc3d3ef96466d5ecb1f1e0fe5', true, false, false),
      ('cloud.catalog_data_quality_inventory()', '783da3d7df9d3b09f3fa07644de4ed8b', true, false, false),
      ('cloud.current_app_role()', 'aa911525bfab140252d92dbdbcc75a34', false, true, true),
      ('cloud.enforce_product_publication_state_v1()', '0319106d3e6bbf44f84f52ecd0bc9958', false, false, false),
      ('cloud.is_service_request()', '49e9715222fe474829c984de90b3e581', false, false, true),
      ('cloud.prevent_product_publication_record_mutation_v1()', 'b6079c4aa5b46d35e4749e371c6685b4', false, false, false),
      ('cloud.reference_publication_snapshot()', '493dee316bfe536a36dea3bdbae4a33e', true, false, false),
      ('cloud.rollback_product_import_v1(text)', '4c3645cf179b044a073e3b16093f90be', true, false, false),
      ('cloud.rollback_reference_publication(text)', 'd5db9a1f9f741e808128d2380d54d352', true, false, false)
    ) expected(signature, definition_md5, expected_security_definer, authenticated_execute, service_execute)
  loop
    function_oid := to_regprocedure(item.signature);
    if function_oid is null then
      raise exception 'required internal function is missing: %', item.signature;
    end if;

    select pg_get_userbyid(proc.proowner), proc.prosecdef,
           exists (
             select 1
             from aclexplode(coalesce(proc.proacl, acldefault('f', proc.proowner))) acl
             where acl.grantee = 0
               and acl.privilege_type = 'EXECUTE'
           )
    into owner_name, security_definer, public_execute
    from pg_proc proc
    where proc.oid = function_oid;

    if owner_name <> current_user
       or security_definer is distinct from item.expected_security_definer
       or md5(pg_get_functiondef(function_oid)) <> item.definition_md5 then
      raise exception 'function identity/body/owner drift: %', item.signature;
    end if;
    if public_execute then
      raise exception 'PUBLIC EXECUTE remains: %', item.signature;
    end if;
    if has_function_privilege('anon', function_oid, 'EXECUTE') then
      raise exception 'anon EXECUTE remains: %', item.signature;
    end if;
    if has_function_privilege('authenticated', function_oid, 'EXECUTE')
       is distinct from item.authenticated_execute then
      raise exception 'authenticated ACL mismatch: %', item.signature;
    end if;
    if has_function_privilege('service_role', function_oid, 'EXECUTE')
       is distinct from item.service_execute then
      raise exception 'service_role ACL mismatch: %', item.signature;
    end if;
  end loop;

  for item in
    select signature from (values
      ('cloud_api.apply_catalog_data_quality_v1(jsonb,text)'),
      ('cloud_api.apply_product_import_v1(jsonb,text)'),
      ('cloud_api.apply_reference_import(jsonb,text)'),
      ('cloud_api.apply_reference_publication(jsonb,text)'),
      ('cloud_api.catalog_admin_patch_product(uuid,jsonb,text)'),
      ('cloud_api.catalog_admin_product(uuid)'),
      ('cloud_api.catalog_admin_products(text,text,text)'),
      ('cloud_api.catalog_admin_references(text)'),
      ('cloud_api.catalog_data_quality_inventory()'),
      ('cloud_api.reference_publication_snapshot()'),
      ('cloud_api.rollback_product_import_v1(text)'),
      ('cloud_api.rollback_reference_publication(text)')
    ) wrappers(signature)
  loop
    function_oid := to_regprocedure(item.signature);
    if function_oid is null
       or not has_function_privilege('service_role', function_oid, 'EXECUTE')
       or has_function_privilege('anon', function_oid, 'EXECUTE')
       or has_function_privilege('authenticated', function_oid, 'EXECUTE') then
      raise exception 'approved cloud_api wrapper ACL regression: %', item.signature;
    end if;
  end loop;

  function_oid := to_regprocedure('cloud_api.cloud_published_storefront_catalog_v1()');
  if function_oid is null
     or not has_function_privilege('service_role', function_oid, 'EXECUTE')
     or has_function_privilege('anon', function_oid, 'EXECUTE')
     or has_function_privilege('authenticated', function_oid, 'EXECUTE') then
    raise exception 'Published RPC ACL regression';
  end if;

  if (select count(*) from pg_class rel
      join pg_namespace ns on ns.oid = rel.relnamespace
      where ns.nspname = 'cloud'
        and rel.relkind in ('r', 'p')
        and rel.relrowsecurity) <> 47 then
    raise exception 'Cloud RLS inventory changed';
  end if;
  if (select count(*) from pg_policies where schemaname = 'cloud') <> 16 then
    raise exception 'Cloud policy inventory changed';
  end if;
  if (select count(*) from pg_trigger
      where tgfoid = to_regprocedure('cloud.enforce_product_publication_state_v1()')
        and not tgisinternal) <> 1 then
    raise exception 'Product publication state trigger is unavailable';
  end if;
  if (select count(*) from pg_trigger
      where tgfoid = to_regprocedure('cloud.prevent_product_publication_record_mutation_v1()')
        and not tgisinternal) <> 3 then
    raise exception 'Immutable publication evidence triggers are unavailable';
  end if;
end
$$;

begin read only;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","app_metadata":{"app_role":"admin"}}',
  true
);
do $$
begin
  if cloud.current_app_role() <> 'admin' then
    raise exception 'authenticated RLS role helper regression';
  end if;
end
$$;
rollback;

begin read only;
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);
do $$
begin
  if cloud.current_app_role() <> 'service'
     or not cloud.is_service_request() then
    raise exception 'service-role policy helper regression';
  end if;
end
$$;
rollback;

begin read only;
set local role service_role;
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);
do $$
declare
  payload jsonb;
  reference_snapshot jsonb;
begin
  reference_snapshot := cloud_api.reference_publication_snapshot();
  if reference_snapshot is null then
    raise exception 'service-role approved wrapper regression';
  end if;
  payload := cloud_api.cloud_published_storefront_catalog_v1();
  if payload -> 'summary' ->> 'productCount' <> '0'
     or jsonb_array_length(payload -> 'products') <> 0 then
    raise exception 'empty Published RPC regression';
  end if;
end
$$;
rollback;

do $$
begin
  if (select count(*) from cloud.products) <> 0
     or (select count(*) from cloud.review_decisions) <> 0
     or (select count(*) from cloud.product_publication_revisions) <> 0
     or (select count(*) from cloud.product_publication_approvals) <> 0
     or (select count(*) from cloud.product_publication_batches) <> 0 then
    raise exception 'hardening migration changed Product/publication state';
  end if;
end
$$;
