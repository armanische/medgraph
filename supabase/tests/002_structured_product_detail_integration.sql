\set ON_ERROR_STOP on

begin;

-- This fixture is local-only and rolls back in full. It exercises the actual
-- review gate, writer, projection and rollback against a clean migration chain.
insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, country_code, description,
  confidence, publication_status
) values (
  '10000000-0000-4000-8000-000000000001',
  'manufacturer-integration-test', 'integration-test-manufacturer',
  'Integration Test Manufacturer', 'Integration Test Manufacturer', 'CH',
  'Local integration fixture.', 'reviewed', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values (
  '10000000-0000-4000-8000-000000000002',
  'category-integration-test', 'integration-test-category',
  'Integration Test Category', 'Integration Test Category',
  'Local integration fixture.', 'leaf', true, 'reviewed', 'published'
);

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  source_uid, source_checksum, snapshot_version, created_from_snapshot_at,
  import_batch_key
) values (
  '10000000-0000-4000-8000-000000000003',
  'structured-fields-integration-product', 'Structured Fields Integration Product',
  'SF-1', '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002', 'Local integration fixture.',
  'Local integration fixture.', 'integration_test',
  'https://example.invalid/products/sf-1', 'reviewed', 'draft',
  'structured-fields-integration-source',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'integration-test-v1', '2026-07-23T00:00:00Z',
  'structured-fields-integration-test'
);

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  '10000000-0000-4000-8000-000000000004',
  'structured-fields-integration-test', 'integration-test-v1', 'test',
  'completed', '2026-07-23T00:00:00Z', '2026-07-23T00:00:01Z', '{}'::jsonb
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
) values (
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000004',
  'structured-fields-integration-source', 'integration_test',
  'local://structured-fields-integration', '{}'::jsonb,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
);

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
) values (
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  'structured-fields-integration-source', 'structured-fields-integration-product',
  'imported', 'source_exact', 'exact', 'exact', 'needs_review',
  '10000000-0000-4000-8000-000000000003'
);

insert into cloud.review_items (
  id, import_product_id, status, priority, reviewed_at
) values (
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000006', 'approved', 'high',
  '2026-07-23T00:01:00Z'
);

insert into cloud.publication_candidates (
  id, import_product_id, target_product_id, schema_version, candidate_data,
  validation_status, approved_by, approved_at
) values (
  '10000000-0000-4000-8000-000000000008',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000003', 1,
  jsonb_build_object(
    'schemaVersion', 1,
    'product', jsonb_build_object(
      'id', '10000000-0000-4000-8000-000000000003',
      'sourceUid', 'structured-fields-integration-source'
    ),
    'keyFeatures', jsonb_build_array(jsonb_build_object(
      'key', 'local-feature', 'text', 'Reviewed local integration feature',
      'sortOrder', 10,
      'source', jsonb_build_object(
        'type', 'integration_test', 'ref', 'local:keyFeatures[0]'
      )
    )),
    'specifications', jsonb_build_array(jsonb_build_object(
      'key', 'local-specification', 'label', 'Local specification',
      'value', '42', 'unit', 'test-unit', 'sortOrder', 10,
      'group', jsonb_build_object(
        'key', 'local-group', 'title', 'Local group', 'sortOrder', 10
      ),
      'source', jsonb_build_object(
        'type', 'integration_test', 'ref', 'local:specifications[0]'
      )
    ))
  ),
  'approved', '10000000-0000-4000-8000-000000000009',
  '2026-07-23T00:02:00Z'
);

insert into cloud.review_decisions (
  id, review_item_id, decision_type, field_path, proposed_value,
  approved_value, decision, reviewer_id, rationale, created_at
) values
(
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000007', 'structured_field',
  'structuredProductDetail.keyFeatures.local-feature',
  (select candidate_data -> 'keyFeatures' -> 0 from cloud.publication_candidates
    where id = '10000000-0000-4000-8000-000000000008'),
  (select candidate_data -> 'keyFeatures' -> 0 from cloud.publication_candidates
    where id = '10000000-0000-4000-8000-000000000008'),
  'approve', '10000000-0000-4000-8000-000000000009',
  'Local integration approval.', '2026-07-23T00:02:01Z'
),
(
  '10000000-0000-4000-8000-000000000011',
  '10000000-0000-4000-8000-000000000007', 'structured_field',
  'structuredProductDetail.specifications.local-specification',
  (select candidate_data -> 'specifications' -> 0 from cloud.publication_candidates
    where id = '10000000-0000-4000-8000-000000000008'),
  (select candidate_data -> 'specifications' -> 0 from cloud.publication_candidates
    where id = '10000000-0000-4000-8000-000000000008'),
  'approve', '10000000-0000-4000-8000-000000000009',
  'Local integration approval.', '2026-07-23T00:02:02Z'
);

do $$
declare
  candidate cloud.publication_candidates%rowtype;
begin
  select * into candidate
  from cloud.publication_candidates
  where id = '10000000-0000-4000-8000-000000000008';
  if not found
     or candidate.schema_version <> 1
     or candidate.validation_status <> 'approved'
     or candidate.approved_by is null
     or candidate.approved_at is null
     or candidate.target_product_id is null then
    raise exception 'integration fixture did not create an approved candidate: %',
      to_jsonb(candidate);
  end if;
end
$$;

do $$
declare
  result jsonb;
  repeated_result jsonb;
  projection jsonb;
  rollback_result jsonb;
  batch_id uuid;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);

  select cloud_api.publish_structured_product_detail_v1(
    '10000000-0000-4000-8000-000000000008', 1,
    'structured-fields-integration-idempotency-v1',
    '10000000-0000-4000-8000-000000000009'
  ) into result;

  if result ->> 'status' <> 'published'
     or (result ->> 'keyFeatureCount')::integer <> 1
     or (result ->> 'specificationCount')::integer <> 1
     or (result ->> 'idempotent')::boolean then
    raise exception 'unexpected initial publication result: %', result;
  end if;
  batch_id := (result ->> 'publicationBatchId')::uuid;

  select cloud_api.publish_structured_product_detail_v1(
    '10000000-0000-4000-8000-000000000008', 1,
    'structured-fields-integration-idempotency-v1',
    '10000000-0000-4000-8000-000000000009'
  ) into repeated_result;
  if not (repeated_result ->> 'idempotent')::boolean
     or repeated_result ->> 'publicationBatchId' <> batch_id::text then
    raise exception 'idempotent retry produced a different result: %', repeated_result;
  end if;

  select cloud_api.cloud_storefront_preview_catalog() into projection;
  if jsonb_array_length(projection #> '{products,0,keyFeatures}') <> 1
     or projection #>> '{products,0,keyFeatures,0,text}' <> 'Reviewed local integration feature'
     or jsonb_array_length(projection #> '{products,0,characteristicGroups}') <> 1
     or projection #>> '{products,0,characteristicGroups,0,items,0,label}' <> 'Local specification' then
    raise exception 'published projection does not contain reviewed fields: %', projection;
  end if;

  if (select source_uid from cloud.products where id = '10000000-0000-4000-8000-000000000003')
       <> 'structured-fields-integration-source'
     or (select publication_status from cloud.products where id = '10000000-0000-4000-8000-000000000003')
       <> 'draft' then
    raise exception 'writer changed immutable identity or product publication status';
  end if;

  select cloud_api.rollback_structured_product_detail_v1(
    batch_id, '10000000-0000-4000-8000-000000000009'
  ) into rollback_result;
  if rollback_result ->> 'status' <> 'rolled_back'
     or (rollback_result ->> 'idempotent')::boolean then
    raise exception 'unexpected rollback result: %', rollback_result;
  end if;

  select cloud_api.cloud_storefront_preview_catalog() into projection;
  if jsonb_array_length(projection #> '{products,0,keyFeatures}') <> 0
     or jsonb_array_length(projection #> '{products,0,characteristicGroups}') <> 0 then
    raise exception 'rollback left structured fields in Storefront projection: %', projection;
  end if;

  select cloud_api.rollback_structured_product_detail_v1(
    batch_id, '10000000-0000-4000-8000-000000000009'
  ) into rollback_result;
  if not (rollback_result ->> 'idempotent')::boolean then
    raise exception 'rollback retry was not idempotent: %', rollback_result;
  end if;
end
$$;

do $$
begin
  if has_function_privilege(
    'anon',
    'cloud_api.publish_structured_product_detail_v1(uuid,integer,text,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'cloud_api.publish_structured_product_detail_v1(uuid,integer,text,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'cloud_api.rollback_structured_product_detail_v1(uuid,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'cloud_api.rollback_structured_product_detail_v1(uuid,uuid)',
    'EXECUTE'
  ) then
    raise exception 'public roles retain structured Product Detail write access';
  end if;
end
$$;

rollback;
