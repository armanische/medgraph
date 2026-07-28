\set ON_ERROR_STOP on

begin;

insert into cloud.user_profiles (id, role, display_name) values
  ('a1000000-0000-4000-8000-000000000001', 'service', 'Catalog Admin test service');

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, country_code, description,
  confidence, publication_status
) values (
  'a1000000-0000-4000-8000-000000000010',
  'manufacturer-catalog-admin-sync', 'catalog-admin-sync-manufacturer',
  'Catalog Admin Sync Manufacturer', 'Catalog Admin Sync Manufacturer', 'CH',
  'Local description synchronization fixture.', 'reviewed', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values (
  'a1000000-0000-4000-8000-000000000020',
  'category-catalog-admin-sync', 'catalog-admin-sync-category',
  'Catalog Admin Sync Category', 'Catalog Admin Sync Category',
  'Local description synchronization fixture.', 'leaf', true, 'reviewed', 'published'
);

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description, confidence,
  publication_status
) values (
  'a1000000-0000-4000-8000-000000000030',
  'catalog-admin-sync-area', 'catalog-admin-sync-area',
  'Catalog Admin Sync Area', 'Catalog Admin Sync Area',
  'Local description synchronization fixture.', 'reviewed', 'published'
);

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  'a1000000-0000-4000-8000-000000000040',
  'catalog-admin-description-sync-test', 'catalog-admin-description-sync-v1',
  'test', 'completed', '2026-07-28T09:00:00Z', '2026-07-28T09:00:01Z',
  '{}'::jsonb
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
) values
  (
    'a1000000-0000-4000-8000-000000000041',
    'a1000000-0000-4000-8000-000000000040',
    'catalog-admin-sync-source', 'immutable_source_snapshot_v1',
    'local://catalog-admin-sync-source',
    '{"raw":{"shortDescription":"более 9 часов","fullDescription":"Историческое утверждение: более 9 часов"}}'::jsonb,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  (
    'a1000000-0000-4000-8000-000000000042',
    'a1000000-0000-4000-8000-000000000040',
    'catalog-admin-no-ru-source', 'immutable_source_snapshot_v1',
    'local://catalog-admin-no-ru-source', '{}'::jsonb,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  );

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  source_uid, source_checksum, snapshot_version, created_from_snapshot_at,
  import_batch_key, missing_manufacturer, missing_category, missing_model,
  missing_application_area, catalog_quality_status, catalog_quality_reason,
  updated_at
) values
  (
    'a1000000-0000-4000-8000-000000000050',
    'catalog-admin-sync-product', 'Catalog Admin Sync Product', 'SYNC-1',
    'a1000000-0000-4000-8000-000000000010',
    'a1000000-0000-4000-8000-000000000020',
    'более 9 часов', 'Историческое утверждение: более 9 часов',
    'immutable_source_snapshot_v1', 'https://example.invalid/catalog-admin-sync',
    'reviewed', 'draft', 'catalog-admin-sync-source',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'immutable-source-snapshot-v1', '2026-07-28T09:00:00Z',
    'catalog-admin-description-sync-test', false, false, false, false,
    'READY', '{}', '2026-07-28T10:00:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000051',
    'catalog-admin-no-ru-product', 'Catalog Admin No RU Product', 'SYNC-2',
    'a1000000-0000-4000-8000-000000000010',
    'a1000000-0000-4000-8000-000000000020',
    'Original short two', 'Original full two',
    'immutable_source_snapshot_v1', 'https://example.invalid/catalog-admin-no-ru',
    'reviewed', 'draft', 'catalog-admin-no-ru-source',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'immutable-source-snapshot-v1', '2026-07-28T09:00:00Z',
    'catalog-admin-description-sync-test', false, false, false, false,
    'READY', '{}', '2026-07-28T10:00:00Z'
  );

insert into cloud.product_descriptions (
  id, product_id, locale, short_description, full_description, confidence,
  updated_at
) values
  (
    'a1000000-0000-4000-8000-000000000060',
    'a1000000-0000-4000-8000-000000000050', 'ru',
    'более 9 часов', 'Историческое утверждение: более 9 часов', 'legacy',
    '2026-07-28T10:00:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000061',
    'a1000000-0000-4000-8000-000000000050', 'en',
    'More than nine hours', 'Historical English description', 'legacy',
    '2026-07-28T10:00:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000062',
    'a1000000-0000-4000-8000-000000000051', 'en',
    'Second English short', 'Second English full', 'legacy',
    '2026-07-28T10:00:00Z'
  );

insert into cloud.product_application_areas (product_id, application_area_id) values
  ('a1000000-0000-4000-8000-000000000050', 'a1000000-0000-4000-8000-000000000030'),
  ('a1000000-0000-4000-8000-000000000051', 'a1000000-0000-4000-8000-000000000030');

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
) values
  (
    'a1000000-0000-4000-8000-000000000070',
    'a1000000-0000-4000-8000-000000000040',
    'a1000000-0000-4000-8000-000000000041',
    'catalog-admin-sync-source', 'catalog-admin-sync-product', 'imported',
    'source_exact', 'exact', 'exact', 'needs_review',
    'a1000000-0000-4000-8000-000000000050'
  ),
  (
    'a1000000-0000-4000-8000-000000000071',
    'a1000000-0000-4000-8000-000000000040',
    'a1000000-0000-4000-8000-000000000042',
    'catalog-admin-no-ru-source', 'catalog-admin-no-ru-product', 'imported',
    'source_exact', 'exact', 'exact', 'needs_review',
    'a1000000-0000-4000-8000-000000000051'
  );

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);

do $$
begin
  begin
    perform cloud_api.catalog_admin_patch_product(
      'a1000000-0000-4000-8000-000000000050',
      '{"shortDescription":"Rejected without version"}'::jsonb,
      'catalog-admin-test'
    );
    raise exception 'missing expectedUpdatedAt was accepted';
  exception when sqlstate '22023' then
    null;
  end;

  begin
    perform cloud_api.catalog_admin_patch_product(
      'a1000000-0000-4000-8000-000000000050',
      '{"expectedUpdatedAt":"not-a-timestamp","shortDescription":"Rejected invalid version"}'::jsonb,
      'catalog-admin-test'
    );
    raise exception 'invalid expectedUpdatedAt was accepted';
  exception when sqlstate '22023' then
    null;
  end;

  begin
    perform cloud_api.catalog_admin_patch_product(
      'a1000000-0000-4000-8000-000000000050',
      '{"expectedUpdatedAt":"2026-07-28","shortDescription":"Rejected non-ISO version"}'::jsonb,
      'catalog-admin-test'
    );
    raise exception 'timezone-free expectedUpdatedAt was accepted';
  exception when sqlstate '22023' then
    null;
  end;
end
$$;

-- Short description only: Product and canonical ru change together; en stays exact.
select cloud_api.catalog_admin_patch_product(
  'a1000000-0000-4000-8000-000000000050',
  jsonb_build_object(
    'expectedUpdatedAt', (select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000050'),
    'shortDescription', 'До 8 часов автономной работы при использовании двух встроенных аккумуляторов.'
  ),
  'catalog-admin-test'
);

do $$
begin
  if (select short_description from cloud.products where id = 'a1000000-0000-4000-8000-000000000050')
       <> 'До 8 часов автономной работы при использовании двух встроенных аккумуляторов.'
     or (select short_description from cloud.product_descriptions
         where product_id = 'a1000000-0000-4000-8000-000000000050' and locale = 'ru')
       <> 'До 8 часов автономной работы при использовании двух встроенных аккумуляторов.' then
    raise exception 'shortDescription was not synchronized';
  end if;
  if (select full_description from cloud.product_descriptions
      where product_id = 'a1000000-0000-4000-8000-000000000050' and locale = 'ru')
       <> 'Историческое утверждение: более 9 часов' then
    raise exception 'short-only patch changed the canonical full description';
  end if;
  if (select short_description from cloud.product_descriptions
      where product_id = 'a1000000-0000-4000-8000-000000000050' and locale = 'en')
       <> 'More than nine hours' then
    raise exception 'non-canonical locale was changed';
  end if;
end
$$;

-- Full description only.
select cloud_api.catalog_admin_patch_product(
  'a1000000-0000-4000-8000-000000000050',
  jsonb_build_object(
    'expectedUpdatedAt', (select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000050'),
    'description', '<strong>Автономная работа:</strong><br /><ul><li>До 8 часов автономной работы при использовании двух встроенных аккумуляторов.</li></ul>'
  ),
  'catalog-admin-test'
);

do $$
begin
  if (select full_description from cloud.products where id = 'a1000000-0000-4000-8000-000000000050')
       is distinct from (select full_description from cloud.product_descriptions
                         where product_id = 'a1000000-0000-4000-8000-000000000050' and locale = 'ru') then
    raise exception 'full description was not synchronized';
  end if;
  if (select full_description from cloud.product_descriptions
      where product_id = 'a1000000-0000-4000-8000-000000000050' and locale = 'en')
       <> 'Historical English description' then
    raise exception 'full description changed another locale';
  end if;
end
$$;

-- Both fields and a non-description field in one operation.
select cloud_api.catalog_admin_patch_product(
  'a1000000-0000-4000-8000-000000000050',
  jsonb_build_object(
    'expectedUpdatedAt', (select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000050'),
    'shortDescription', 'Canonical short final',
    'description', 'Canonical full final',
    'seoTitle', 'Canonical SEO title'
  ),
  'catalog-admin-test'
);

-- A patch without description fields must not require or touch description rows.
select cloud_api.catalog_admin_patch_product(
  'a1000000-0000-4000-8000-000000000051',
  jsonb_build_object(
    'expectedUpdatedAt', (select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000051'),
    'seoTitle', 'No RU row SEO edit'
  ),
  'catalog-admin-test'
);

do $$
declare
  current_version timestamptz := (
    select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000050'
  );
  stable_title text := (
    select title from cloud.products where id = 'a1000000-0000-4000-8000-000000000050'
  );
begin
  begin
    perform cloud_api.catalog_admin_patch_product(
      'a1000000-0000-4000-8000-000000000050',
      jsonb_build_object(
        'expectedUpdatedAt', '2026-07-28T10:00:00Z',
        'title', 'Stale overwrite'
      ),
      'catalog-admin-test'
    );
    raise exception 'stale patch was accepted';
  exception when sqlstate '40001' then
    null;
  end;
  if (select title from cloud.products where id = 'a1000000-0000-4000-8000-000000000050')
       is distinct from stable_title
     or (select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000050')
       is distinct from current_version then
    raise exception 'stale rejection changed Product state';
  end if;
end
$$;

-- Missing canonical row fails before Product mutation.
do $$
declare
  before_product cloud.products%rowtype;
begin
  select * into before_product from cloud.products
  where id = 'a1000000-0000-4000-8000-000000000051';
  begin
    perform cloud_api.catalog_admin_patch_product(
      before_product.id,
      jsonb_build_object(
        'expectedUpdatedAt', before_product.updated_at,
        'shortDescription', 'Must not persist'
      ),
      'catalog-admin-test'
    );
    raise exception 'missing canonical ru row was accepted';
  exception when sqlstate 'P0002' then
    null;
  end;
  if (select short_description from cloud.products where id = before_product.id)
       is distinct from before_product.short_description
     or (select updated_at from cloud.products where id = before_product.id)
       is distinct from before_product.updated_at then
    raise exception 'missing canonical row failure changed Product';
  end if;
end
$$;

-- The schema itself rejects duplicate canonical rows.
do $$
begin
  begin
    insert into cloud.product_descriptions (
      product_id, locale, short_description, full_description, confidence
    ) values (
      'a1000000-0000-4000-8000-000000000050', 'ru',
      'Duplicate short', 'Duplicate full', 'unknown'
    );
    raise exception 'duplicate canonical row was accepted';
  exception when unique_violation then
    null;
  end;
end
$$;

-- An error after Product update must roll back Product and description together.
create function cloud.catalog_admin_sync_test_failure()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'forced canonical description failure' using errcode = '23514';
end
$$;

create trigger catalog_admin_sync_test_failure
before update on cloud.product_descriptions
for each row
when (old.product_id = 'a1000000-0000-4000-8000-000000000050'::uuid and old.locale = 'ru')
execute function cloud.catalog_admin_sync_test_failure();

do $$
declare
  before_product cloud.products%rowtype;
  before_description cloud.product_descriptions%rowtype;
begin
  select * into before_product from cloud.products
  where id = 'a1000000-0000-4000-8000-000000000050';
  select * into before_description from cloud.product_descriptions
  where product_id = before_product.id and locale = 'ru';
  begin
    perform cloud_api.catalog_admin_patch_product(
      before_product.id,
      jsonb_build_object(
        'expectedUpdatedAt', before_product.updated_at,
        'shortDescription', 'Forced failure value',
        'description', 'Forced failure full value'
      ),
      'catalog-admin-test'
    );
    raise exception 'forced description failure was not raised';
  exception when sqlstate '23514' then
    null;
  end;
  if (select short_description from cloud.products where id = before_product.id)
       is distinct from before_product.short_description
     or (select full_description from cloud.products where id = before_product.id)
       is distinct from before_product.full_description
     or (select updated_at from cloud.products where id = before_product.id)
       is distinct from before_product.updated_at
     or (select short_description from cloud.product_descriptions where id = before_description.id)
       is distinct from before_description.short_description
     or (select full_description from cloud.product_descriptions where id = before_description.id)
       is distinct from before_description.full_description then
    raise exception 'forced failure left a partial update';
  end if;
end
$$;

drop trigger catalog_admin_sync_test_failure on cloud.product_descriptions;
drop function cloud.catalog_admin_sync_test_failure();

-- Reapply the approved active content, then create an immutable revision.
select cloud_api.catalog_admin_patch_product(
  'a1000000-0000-4000-8000-000000000050',
  jsonb_build_object(
    'expectedUpdatedAt', (select updated_at from cloud.products where id = 'a1000000-0000-4000-8000-000000000050'),
    'shortDescription', 'До 8 часов автономной работы при использовании двух встроенных аккумуляторов.',
    'description', '<strong>Автономная работа:</strong><br /><ul><li>До 8 часов автономной работы при использовании двух встроенных аккумуляторов.</li></ul>',
    'seoTitle', 'Аппарат ИВЛ Hamilton-T1 | Hamilton Medical',
    'seoDescription', 'Аппарат ИВЛ Hamilton-T1 от Hamilton Medical. До 8 часов автономной работы при использовании двух встроенных аккумуляторов.'
  ),
  'catalog-admin-test'
);

do $$
begin
  if (select count(*) from cloud.products
      where id = 'a1000000-0000-4000-8000-000000000050'
        and (coalesce(short_description, '') ilike '%более 9 часов%'
          or coalesce(full_description, '') ilike '%более 9 часов%')) <> 0
     or (select count(*) from cloud.product_descriptions
         where product_id = 'a1000000-0000-4000-8000-000000000050'
           and locale = 'ru'
           and (short_description ilike '%более 9 часов%'
             or full_description ilike '%более 9 часов%')) <> 0 then
    raise exception 'old claim remains in canonical active state';
  end if;
  if (select count(*) from cloud.import_sources
      where id = 'a1000000-0000-4000-8000-000000000041'
        and snapshot::text like '%более 9 часов%'
        and checksum_sha256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') <> 1
     or (select source_checksum from cloud.products
         where id = 'a1000000-0000-4000-8000-000000000050')
        <> 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' then
    raise exception 'immutable provenance changed';
  end if;
  if (select title from cloud.products where id = 'a1000000-0000-4000-8000-000000000051')
       <> 'Catalog Admin No RU Product'
     or (select short_description from cloud.product_descriptions
         where product_id = 'a1000000-0000-4000-8000-000000000051' and locale = 'en')
       <> 'Second English short' then
    raise exception 'another Product changed';
  end if;
end
$$;

create temporary table catalog_admin_revision_result (result jsonb not null);
insert into catalog_admin_revision_result (result)
select cloud_api.create_product_publication_revision_v1(
  'a1000000-0000-4000-8000-000000000050',
  'catalog-admin-description-sync-revision-1'
);

do $$
declare
  revision cloud.product_publication_revisions%rowtype;
begin
  select * into revision
  from cloud.product_publication_revisions
  where id = (
    select (result ->> 'candidateRevisionId')::uuid from catalog_admin_revision_result
  );
  if revision.candidate_payload::text ilike '%более 9 часов%'
     or revision.candidate_payload::text not like '%До 8 часов автономной работы при использовании двух встроенных аккумуляторов.%' then
    raise exception 'publication revision contains stale or missing approved description';
  end if;
  if revision.candidate_payload_checksum
       <> cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1(revision.product_id)) then
    raise exception 'publication revision fingerprint does not match active state';
  end if;
  if (select count(*) from cloud.product_publication_approvals) <> 0
     or (select count(*) from cloud.product_publication_batches) <> 0 then
    raise exception 'corrective regression created approval or publication evidence';
  end if;
end
$$;

-- Function signature, security boundary and ACL remain unchanged.
do $$
declare
  function_oid oid := to_regprocedure('cloud.catalog_admin_patch_product(uuid,jsonb,text)');
  public_execute boolean;
begin
  select exists (
    select 1
    from pg_proc procedure
    cross join lateral aclexplode(coalesce(procedure.proacl, acldefault('f', procedure.proowner))) acl
    where procedure.oid = function_oid
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) into public_execute;
  if function_oid is null
     or not (select prosecdef from pg_proc where oid = function_oid)
     or (select proconfig from pg_proc where oid = function_oid)
        is distinct from array['search_path=pg_catalog, cloud, extensions']
     or public_execute
     or has_function_privilege('anon', function_oid, 'EXECUTE')
     or has_function_privilege('authenticated', function_oid, 'EXECUTE')
     or has_function_privilege('service_role', function_oid, 'EXECUTE') then
    raise exception 'internal Catalog Admin function security contract changed';
  end if;
  if not has_function_privilege(
       'service_role',
       'cloud_api.catalog_admin_patch_product(uuid,jsonb,text)',
       'EXECUTE'
     ) then
    raise exception 'approved cloud_api Catalog Admin wrapper is unavailable';
  end if;
end
$$;

rollback;
