\set ON_ERROR_STOP on

begin;

insert into cloud.user_profiles (id, role, display_name) values
  ('60000000-0000-4000-8000-000000000001', 'service', 'Projection test service'),
  ('60000000-0000-4000-8000-000000000002', 'reviewer', 'Projection test reviewer');

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, country_code, description,
  confidence, publication_status
) values (
  '60000000-0000-4000-8000-000000000010',
  'manufacturer-projection-test', 'projection-test-manufacturer',
  'Projection Test Manufacturer', 'Projection Test Manufacturer', 'CH',
  'Published projection fixture.', 'reviewed', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values (
  '60000000-0000-4000-8000-000000000020',
  'category-projection-test', 'projection-test-category',
  'Projection Test Category', 'Projection Test Category',
  'Published projection fixture.', 'leaf', true, 'reviewed', 'published'
);

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description, confidence,
  publication_status
) values (
  '60000000-0000-4000-8000-000000000030',
  'application-area-projection-test', 'projection-test-area',
  'Projection Test Area', 'Projection Test Area',
  'Published projection fixture.', 'reviewed', 'published'
);

insert into cloud.storage_objects (
  id, bucket, object_path, original_filename, mime_type, size_bytes,
  checksum_sha256, source_type, source_url, rights_status, confidence, access_status
) values
  (
    '60000000-0000-4000-8000-000000000031', 'published',
    'projection/public-document.pdf', 'public-document.pdf', 'application/pdf', 128,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'integration_test', 'https://example.invalid/public-document.pdf',
    'manufacturer_official', 'reviewed', 'public'
  ),
  (
    '60000000-0000-4000-8000-000000000032', 'private',
    'projection/private-document.pdf', 'private-document.pdf', 'application/pdf', 128,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'integration_test', 'https://example.invalid/private-document.pdf',
    'restricted', 'reviewed', 'private'
  );

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  '60000000-0000-4000-8000-000000000040',
  'published-catalog-projection-test', 'projection-test-v1', 'test', 'completed',
  '2026-07-26T00:00:00Z', '2026-07-26T00:00:01Z', '{}'::jsonb
);

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  source_uid, source_checksum, snapshot_version, created_from_snapshot_at,
  import_batch_key, missing_manufacturer, missing_category, missing_model,
  missing_application_area, catalog_quality_status, catalog_quality_reason
) values
  (
    '60000000-0000-4000-8000-000000000050',
    'projection-z-product', 'Projection Z Product', 'PZ-1',
    '60000000-0000-4000-8000-000000000010',
    '60000000-0000-4000-8000-000000000020',
    'Published projection summary.', 'Published projection description.',
    'integration_test', 'https://example.invalid/products/pz-1', 'reviewed', 'draft',
    'projection-z-source',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    'projection-test-v1', '2026-07-26T00:00:00Z',
    'published-catalog-projection-test', false, false, false, false, 'READY', '{}'
  ),
  (
    '60000000-0000-4000-8000-000000000051',
    'projection-draft-product', 'Projection Draft Product', 'PD-1',
    '60000000-0000-4000-8000-000000000010',
    '60000000-0000-4000-8000-000000000020',
    'Draft summary.', 'Draft description.', 'integration_test',
    'https://example.invalid/products/pd-1', 'reviewed', 'draft',
    'projection-draft-source',
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    'projection-test-v1', '2026-07-26T00:00:00Z',
    'published-catalog-projection-test', false, false, false, false, 'READY', '{}'
  ),
  (
    '60000000-0000-4000-8000-000000000052',
    'projection-review-product', 'Projection Review Product', 'PR-1',
    '60000000-0000-4000-8000-000000000010',
    '60000000-0000-4000-8000-000000000020',
    'Review summary.', 'Review description.', 'integration_test',
    'https://example.invalid/products/pr-1', 'reviewed', 'draft',
    'projection-review-source',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    'projection-test-v1', '2026-07-26T00:00:00Z',
    'published-catalog-projection-test', false, false, false, false, 'READY', '{}'
  ),
  (
    '60000000-0000-4000-8000-000000000053',
    'projection-approved-product', 'Projection Approved Product', 'PA-1',
    '60000000-0000-4000-8000-000000000010',
    '60000000-0000-4000-8000-000000000020',
    'Approved summary.', 'Approved description.', 'integration_test',
    'https://example.invalid/products/pa-1', 'reviewed', 'draft',
    'projection-approved-source',
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'projection-test-v1', '2026-07-26T00:00:00Z',
    'published-catalog-projection-test', false, false, false, false, 'READY', '{}'
  ),
  (
    '60000000-0000-4000-8000-000000000054',
    'projection-archived-product', 'Projection Archived Product', 'PX-1',
    '60000000-0000-4000-8000-000000000010',
    '60000000-0000-4000-8000-000000000020',
    'Archived summary.', 'Archived description.', 'integration_test',
    'https://example.invalid/products/px-1', 'reviewed', 'draft',
    'projection-archived-source',
    '1111111111111111111111111111111111111111111111111111111111111111',
    'projection-test-v1', '2026-07-26T00:00:00Z',
    'published-catalog-projection-test', false, false, false, false, 'READY', '{}'
  ),
  (
    '60000000-0000-4000-8000-000000000055',
    'projection-a-product', 'Projection A Product', 'PA-2',
    '60000000-0000-4000-8000-000000000010',
    '60000000-0000-4000-8000-000000000020',
    'Second published summary.', 'Second published description.', 'integration_test',
    'https://example.invalid/products/pa-2', 'reviewed', 'draft',
    'projection-a-source',
    '2222222222222222222222222222222222222222222222222222222222222222',
    'projection-test-v1', '2026-07-26T00:00:00Z',
    'published-catalog-projection-test', false, false, false, false, 'READY', '{}'
  );

insert into cloud.product_application_areas (product_id, application_area_id)
select id, '60000000-0000-4000-8000-000000000030'::uuid
from cloud.products
where id::text like '60000000-0000-4000-8000-00000000005%';

insert into cloud.product_media (
  product_id, source_url, role, media_format, sort_order, import_batch_key
) values
  (
    '60000000-0000-4000-8000-000000000050',
    'https://example.invalid/equipment.webp', 'primary', 'image/webp', 0,
    'published-catalog-projection-test'
  ),
  (
    '60000000-0000-4000-8000-000000000050',
    'http://example.invalid/insecure.webp', 'gallery', 'image/webp', 1,
    'published-catalog-projection-test'
  );

insert into cloud.product_documents (
  product_id, storage_object_id, title, document_type, language, is_official,
  publication_status
) values
  (
    '60000000-0000-4000-8000-000000000050',
    '60000000-0000-4000-8000-000000000031',
    'Public document', 'datasheet', 'ru', true, 'published'
  ),
  (
    '60000000-0000-4000-8000-000000000050',
    '60000000-0000-4000-8000-000000000032',
    'Private document', 'datasheet', 'ru', true, 'published'
  );

insert into cloud.registration_records (
  id, registration_number, status, source_url, verified_at
) values (
  '60000000-0000-4000-8000-000000000033', 'TEST-REG-1', 'verified_exact',
  'https://example.invalid/registration', '2026-07-26T00:00:00Z'
);
insert into cloud.product_registration_links (
  product_id, registration_record_id, relationship_type
) values (
  '60000000-0000-4000-8000-000000000050',
  '60000000-0000-4000-8000-000000000033', 'exact'
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
)
select
  ('60000000-0000-4000-8000-' || lpad((60 + ordinal)::text, 12, '0'))::uuid,
  '60000000-0000-4000-8000-000000000040', product.source_uid,
  'integration_test', 'local://' || product.source_uid, '{}'::jsonb,
  product.source_checksum
from cloud.products product
cross join lateral (
  select row_number() over (order by product_inner.id) as ordinal
  from cloud.products product_inner
  where product_inner.id::text like '60000000-0000-4000-8000-00000000005%'
) numbering
where product.id::text like '60000000-0000-4000-8000-00000000005%'
  and numbering.ordinal = (
    select count(*) from cloud.products ordered
    where ordered.id::text like '60000000-0000-4000-8000-00000000005%'
      and ordered.id <= product.id
  );

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
)
select
  ('60000000-0000-4000-8000-' || lpad((70 + ordinal)::text, 12, '0'))::uuid,
  '60000000-0000-4000-8000-000000000040',
  ('60000000-0000-4000-8000-' || lpad((60 + ordinal)::text, 12, '0'))::uuid,
  product.source_uid, product.slug, 'imported', 'source_exact', 'exact', 'exact',
  'needs_review', product.id
from (
  select product.*, row_number() over (order by product.id) as ordinal
  from cloud.products product
  where product.id::text like '60000000-0000-4000-8000-00000000005%'
) product;

insert into cloud.review_items (
  id, import_product_id, status, priority
)
select
  ('60000000-0000-4000-8000-' || lpad((80 + ordinal)::text, 12, '0'))::uuid,
  import_product.id, 'pending', 'high'
from (
  select import_product.*, row_number() over (order by import_product.id) as ordinal
  from cloud.import_products import_product
  where import_product.id::text like '60000000-0000-4000-8000-00000000007%'
) import_product;

do $$
declare
  empty_projection jsonb;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);
  select cloud_api.cloud_published_storefront_catalog_v1() into empty_projection;
  if jsonb_array_length(empty_projection -> 'products') <> 0
     or empty_projection #>> '{summary,productCount}' <> '0' then
    raise exception 'empty projection is not a valid empty result: %', empty_projection;
  end if;
end
$$;

create function pg_temp.advance_projection_product(
  product_id_value uuid,
  key_prefix text,
  target_state text
)
returns void
language plpgsql
as $$
declare
  revision_result jsonb;
  decision_result jsonb;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config(
    'request.jwt.claims',
    '{"role":"service_role","app_metadata":{"app_role":"service"}}', true
  );
  revision_result := cloud_api.create_product_publication_revision_v1(
    product_id_value, key_prefix || '-revision'
  );
  if target_state = 'in_review' then return; end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true
  );
  perform set_config(
    'request.jwt.claims',
    '{"role":"authenticated","sub":"60000000-0000-4000-8000-000000000002","app_metadata":{"app_role":"reviewer"}}',
    true
  );
  decision_result := cloud_api.record_product_publication_review_decision_v1(
    (revision_result ->> 'candidateRevisionId')::uuid,
    'Local approval for the exact projection fixture revision.'
  );

  perform set_config('request.jwt.claim.role', 'service_role', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config(
    'request.jwt.claims',
    '{"role":"service_role","app_metadata":{"app_role":"service"}}', true
  );
  perform cloud_api.approve_product_publication_revision_v1(
    (revision_result ->> 'candidateRevisionId')::uuid,
    (decision_result ->> 'reviewDecisionId')::uuid
  );
  if target_state = 'approved' then return; end if;

  perform cloud_api.publish_product_v1(
    (revision_result ->> 'candidateRevisionId')::uuid,
    key_prefix || '-publish'
  );
  if target_state = 'published' then return; end if;

  perform cloud_api.archive_product_v1(product_id_value, key_prefix || '-archive');
end
$$;

-- Local corruption helper. Tests use replica mode to simulate a
-- checksum-consistent but malformed immutable publication artifact without
-- weakening production triggers or grants.
create function pg_temp.replace_projection_product_payload(
  product_id_value uuid,
  replacement_payload jsonb
)
returns void
language plpgsql
as $$
declare
  revision_id_value uuid;
  candidate_checksum_value text;
  payload_checksum_value text;
begin
  select product.current_product_publication_revision_id
  into revision_id_value
  from cloud.products product
  where product.id = product_id_value;

  candidate_checksum_value := cloud.sha256_jsonb_v1(replacement_payload);
  select cloud.product_publication_payload_checksum_v1(
    revision.schema_version,
    revision.product_identity,
    replacement_payload
  )
  into payload_checksum_value
  from cloud.product_publication_revisions revision
  where revision.id = revision_id_value;

  update cloud.product_publication_revisions revision
  set candidate_payload = replacement_payload,
      candidate_payload_checksum = candidate_checksum_value,
      payload_checksum = payload_checksum_value
  where revision.id = revision_id_value;

  update cloud.review_decisions decision
  set proposed_value = replacement_payload,
      approved_value = replacement_payload,
      approved_payload_checksum = payload_checksum_value
  where decision.product_publication_revision_id = revision_id_value;

  update cloud.product_publication_approvals approval
  set payload_checksum = payload_checksum_value
  where approval.candidate_revision_id = revision_id_value;

  update cloud.product_publication_batches batch
  set payload_checksum = payload_checksum_value
  where batch.candidate_revision_id = revision_id_value
    and batch.action = 'publish';
end
$$;

select pg_temp.advance_projection_product(
  '60000000-0000-4000-8000-000000000050', 'projection-z', 'published'
);
select pg_temp.advance_projection_product(
  '60000000-0000-4000-8000-000000000052', 'projection-review', 'in_review'
);
select pg_temp.advance_projection_product(
  '60000000-0000-4000-8000-000000000053', 'projection-approved', 'approved'
);
select pg_temp.advance_projection_product(
  '60000000-0000-4000-8000-000000000054', 'projection-archived', 'archived'
);
select pg_temp.advance_projection_product(
  '60000000-0000-4000-8000-000000000055', 'projection-a', 'published'
);

-- Publish one independently reviewed key feature and specification after the
-- base Product publication. The projection must prove both contracts.
update cloud.review_items
set status = 'approved', reviewed_at = clock_timestamp(), updated_at = clock_timestamp()
where import_product_id = (
  select id from cloud.import_products
  where existing_product_id = '60000000-0000-4000-8000-000000000050'
);

insert into cloud.publication_candidates (
  id, import_product_id, target_product_id, schema_version, candidate_data,
  validation_status, approved_by, approved_at
) values (
  '60000000-0000-4000-8000-000000000090',
  (select id from cloud.import_products
   where existing_product_id = '60000000-0000-4000-8000-000000000050'),
  '60000000-0000-4000-8000-000000000050', 1,
  jsonb_build_object(
    'schemaVersion', 1,
    'product', jsonb_build_object(
      'id', '60000000-0000-4000-8000-000000000050',
      'sourceUid', 'projection-z-source'
    ),
    'keyFeatures', jsonb_build_array(jsonb_build_object(
      'key', 'projection-feature', 'text', 'Reviewed projection feature',
      'sortOrder', 10,
      'source', jsonb_build_object('type', 'integration_test', 'ref', 'local:feature')
    )),
    'specifications', jsonb_build_array(jsonb_build_object(
      'key', 'projection-specification', 'label', 'Projection specification',
      'value', '42', 'unit', 'test-unit', 'sortOrder', 10,
      'group', jsonb_build_object(
        'key', 'projection-group', 'title', 'Projection group', 'sortOrder', 10
      ),
      'source', jsonb_build_object('type', 'integration_test', 'ref', 'local:specification')
    ))
  ),
  'approved', '60000000-0000-4000-8000-000000000002', clock_timestamp()
);

create temporary table projection_structured_revision (result jsonb not null);
insert into projection_structured_revision (result)
select cloud_api.create_structured_product_detail_revision_v1(
  '60000000-0000-4000-8000-000000000090',
  '60000000-0000-4000-8000-000000000002'
);

update cloud.publication_candidates
set validation_status = 'approved',
    approved_by = '60000000-0000-4000-8000-000000000002',
    approved_at = clock_timestamp(), updated_at = clock_timestamp()
where id = '60000000-0000-4000-8000-000000000090';

insert into cloud.product_detail_candidate_revision_approvals (
  id, candidate_revision_id, review_item_id, payload_checksum,
  product_identity_checksum, decision, reviewer_id, approved_at
)
select
  '60000000-0000-4000-8000-000000000091', revision.id,
  (select id from cloud.review_items where import_product_id = candidate.import_product_id),
  revision.payload_checksum, revision.product_identity_checksum, 'approve',
  candidate.approved_by, candidate.approved_at
from cloud.product_detail_candidate_revisions revision
join cloud.publication_candidates candidate on candidate.id = revision.candidate_id
where revision.id = (
  select (result ->> 'candidateRevisionId')::uuid from projection_structured_revision
);

insert into cloud.review_decisions (
  id, review_item_id, decision_type, field_path, proposed_value, approved_value,
  decision, reviewer_id, rationale, created_at, candidate_revision_id,
  approved_payload_checksum, product_identity_checksum
)
select
  values_to_insert.id,
  (select id from cloud.review_items where import_product_id = candidate.import_product_id),
  'structured_field', values_to_insert.field_path, values_to_insert.approved_value,
  values_to_insert.approved_value, 'approve', candidate.approved_by,
  'Local projection structured approval.', revision.created_at + values_to_insert.delay,
  revision.id, revision.payload_checksum, revision.product_identity_checksum
from cloud.product_detail_candidate_revisions revision
join cloud.publication_candidates candidate on candidate.id = revision.candidate_id
cross join lateral (values
  (
    '60000000-0000-4000-8000-000000000092'::uuid,
    'structuredProductDetail.keyFeatures.projection-feature',
    revision.candidate_payload -> 'keyFeatures' -> 0,
    interval '1 millisecond'
  ),
  (
    '60000000-0000-4000-8000-000000000093'::uuid,
    'structuredProductDetail.specifications.projection-specification',
    revision.candidate_payload -> 'specifications' -> 0,
    interval '2 milliseconds'
  )
) values_to_insert(id, field_path, approved_value, delay)
where revision.id = (
  select (result ->> 'candidateRevisionId')::uuid from projection_structured_revision
);

select cloud_api.publish_structured_product_detail_v2(
  (select (result ->> 'candidateRevisionId')::uuid from projection_structured_revision),
  1, 'published-projection-structured-v1',
  '60000000-0000-4000-8000-000000000002'
);

do $$
declare
  projection jsonb;
  repeated jsonb;
  product jsonb;
  forbidden_key text;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);
  select cloud_api.cloud_published_storefront_catalog_v1() into projection;
  select cloud_api.cloud_published_storefront_catalog_v1() into repeated;

  if projection is distinct from repeated then
    raise exception 'published projection is not deterministic';
  end if;
  if projection #>> '{summary,productCount}' <> '2'
     or projection #>> '{summary,manufacturerCount}' <> '1'
     or projection #>> '{summary,categoryCount}' <> '1'
     or projection #>> '{summary,applicationAreaCount}' <> '1' then
    raise exception 'unexpected published baseline counts: %', projection -> 'summary';
  end if;
  if projection #>> '{products,0,slug}' <> 'projection-a-product'
     or projection #>> '{products,1,slug}' <> 'projection-z-product' then
    raise exception 'published products are not ordered by stable slug: %', projection -> 'products';
  end if;
  select item into product
  from jsonb_array_elements(projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if product ->> 'status' <> 'active'
     or product ->> 'manufacturerId' <> 'projection-test-manufacturer'
     or product ->> 'categoryId' <> 'projection-test-category'
     or jsonb_array_length(product -> 'applicationAreas') <> 1
     or jsonb_array_length(product -> 'media') <> 1
     or jsonb_array_length(product -> 'documents') <> 1
     or jsonb_array_length(product -> 'registrations') <> 1
     or jsonb_array_length(product -> 'keyFeatures') <> 1
     or jsonb_array_length(product -> 'characteristicGroups') <> 1 then
    raise exception 'valid published Product payload is incomplete: %', product;
  end if;
  if product #>> '{media,0,url}' <> 'https://example.invalid/equipment.webp'
     or product #>> '{documents,0,title}' <> 'Public document'
     or product #>> '{registrations,0,sourceUrl}' is not null
     or product #>> '{keyFeatures,0,text}' <> 'Reviewed projection feature'
     or product #>> '{characteristicGroups,0,items,0,label}'
       <> 'Projection specification' then
    raise exception 'child visibility contract failed: %', product;
  end if;
  if projection::text ~* '(preview_draft|publicationStatus|reviewState|approvalId|batchId|reviewerId|actorId|payloadChecksum|sourceUid|importBatchKey)' then
    raise exception 'internal publication or Preview metadata leaked: %', projection;
  end if;
  foreach forbidden_key in array array[
    'publicationStatus', 'reviewState', 'approvalId', 'reviewerId',
    'actorId', 'payloadChecksum', 'sourceUid', 'importBatchKey'
  ] loop
    if projection @? format('strict $.**.%s', forbidden_key)::jsonpath then
      raise exception 'internal metadata key % leaked', forbidden_key;
    end if;
  end loop;
end
$$;

create function pg_temp.assert_public_projection_content_changed_v3(
  before_projection jsonb,
  after_projection jsonb,
  scenario text
)
returns void
language plpgsql
as $$
begin
  if cloud.sha256_jsonb_v1(before_projection - 'generatedAt')
       = cloud.sha256_jsonb_v1(after_projection - 'generatedAt')
     or after_projection ->> 'generatedAt'
       is distinct from before_projection ->> 'generatedAt' then
    raise exception '% did not change public content while the transaction-final clock remained pending', scenario;
  end if;
end
$$;

create function pg_temp.assert_public_projection_unchanged_v3(
  before_projection jsonb,
  after_projection jsonb,
  scenario text
)
returns void
language plpgsql
as $$
begin
  if before_projection is distinct from after_projection then
    raise exception '% changed the public payload or clock', scenario;
  end if;
end
$$;

-- New draft child content after publication is ignored because the immutable
-- approved revision, not Preview live rows, is the public content source.
savepoint preview_isolation;
insert into cloud.storage_objects (
  id, bucket, object_path, original_filename, mime_type, size_bytes,
  checksum_sha256, source_type, source_url, rights_status, confidence, access_status
) values (
  '60000000-0000-4000-8000-000000000034', 'review',
  'projection/unreviewed-document.pdf', 'unreviewed-document.pdf',
  'application/pdf', 128,
  '5555555555555555555555555555555555555555555555555555555555555555',
  'integration_test', 'https://example.invalid/unreviewed-document.pdf',
  'restricted', 'reviewed', 'review'
);
insert into cloud.product_media (
  product_id, source_url, role, media_format, sort_order, import_batch_key
) values (
  '60000000-0000-4000-8000-000000000050',
  'https://example.invalid/unreviewed-gallery.webp', 'gallery', 'image/webp', 2,
  'published-catalog-projection-test'
);
insert into cloud.product_documents (
  product_id, storage_object_id, title, document_type, language, is_official,
  publication_status
) values (
  '60000000-0000-4000-8000-000000000050',
  '60000000-0000-4000-8000-000000000034',
  'Unreviewed draft document', 'other', 'ru', false, 'draft'
);
do $$
declare product jsonb;
begin
  select item into product
  from jsonb_array_elements(cloud_api.cloud_published_storefront_catalog_v1() -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if jsonb_array_length(product -> 'media') <> 1
     or jsonb_array_length(product -> 'documents') <> 1 then
    raise exception 'Preview-only child content leaked into Published Projection';
  end if;
end
$$;
rollback to preview_isolation;

-- A public document whose storage visibility is revoked disappears without
-- leaking its URL or invalidating the independently published base Product.
savepoint document_visibility;
do $$
declare
  before_projection jsonb;
  after_projection jsonb;
  product jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  update cloud.storage_objects
  set access_status = 'private', updated_at = clock_timestamp()
  where id = '60000000-0000-4000-8000-000000000031';
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  select item into product
  from jsonb_array_elements(after_projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if jsonb_array_length(product -> 'documents') <> 0 then
    raise exception 'non-public storage object leaked through documents';
  end if;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'public document to private transition'
  );
end
$$;
rollback to document_visibility;

-- Fail-closed corruption simulations are local-only and rolled back. They
-- prove the projection independently re-checks immutable evidence bindings.
savepoint stale_identity;
set local session_replication_role = replica;
update cloud.products
set source_checksum = '3333333333333333333333333333333333333333333333333333333333333333'
where id = '60000000-0000-4000-8000-000000000050';
set local session_replication_role = origin;
do $$
begin
  if cloud_api.cloud_published_storefront_catalog_v1() @? '$.products[*] ? (@.slug == "projection-z-product")' then
    raise exception 'stale Product identity unexpectedly remained visible';
  end if;
end
$$;
rollback to stale_identity;

savepoint invalid_approval;
set local session_replication_role = replica;
update cloud.product_publication_approvals approval
set payload_checksum = '6666666666666666666666666666666666666666666666666666666666666666'
where approval.candidate_revision_id = (
  select current_product_publication_revision_id from cloud.products
  where id = '60000000-0000-4000-8000-000000000050'
);
set local session_replication_role = origin;
do $$
begin
  if cloud_api.cloud_published_storefront_catalog_v1() @? '$.products[*] ? (@.slug == "projection-z-product")' then
    raise exception 'invalid approval binding unexpectedly remained visible';
  end if;
end
$$;
rollback to invalid_approval;

savepoint invalid_batch;
set local session_replication_role = replica;
update cloud.product_publication_batches
set payload_checksum = '4444444444444444444444444444444444444444444444444444444444444444'
where id = (
  select active_product_publication_batch_id from cloud.products
  where id = '60000000-0000-4000-8000-000000000050'
);
set local session_replication_role = origin;
do $$
begin
  if cloud_api.cloud_published_storefront_catalog_v1() @? '$.products[*] ? (@.slug == "projection-z-product")' then
    raise exception 'invalid active batch binding unexpectedly remained visible';
  end if;
end
$$;
rollback to invalid_batch;

savepoint unpublished_manufacturer;
set local session_replication_role = replica;
update cloud.manufacturers set publication_status = 'draft'
where id = '60000000-0000-4000-8000-000000000010';
set local session_replication_role = origin;
do $$ begin
  if jsonb_array_length(cloud_api.cloud_published_storefront_catalog_v1() -> 'products') <> 0 then
    raise exception 'Product with unpublished manufacturer remained visible';
  end if;
end $$;
rollback to unpublished_manufacturer;

savepoint unpublished_category;
set local session_replication_role = replica;
update cloud.categories set publication_status = 'draft'
where id = '60000000-0000-4000-8000-000000000020';
set local session_replication_role = origin;
do $$ begin
  if jsonb_array_length(cloud_api.cloud_published_storefront_catalog_v1() -> 'products') <> 0 then
    raise exception 'Product with unpublished category remained visible';
  end if;
end $$;
rollback to unpublished_category;

savepoint unpublished_area;
set local session_replication_role = replica;
update cloud.application_areas set publication_status = 'draft'
where id = '60000000-0000-4000-8000-000000000030';
set local session_replication_role = origin;
do $$ begin
  if jsonb_array_length(cloud_api.cloud_published_storefront_catalog_v1() -> 'products') <> 0 then
    raise exception 'Product with unpublished application area remained visible';
  end if;
end $$;
rollback to unpublished_area;

savepoint unresolved_blocker;
insert into cloud.import_blocking_errors (
  import_product_id, code, field_path, message
) values (
  (select id from cloud.import_products
   where existing_product_id = '60000000-0000-4000-8000-000000000050'),
  'projection_test_blocker', 'product', 'Local unresolved blocker fixture.'
);
do $$ begin
  if cloud_api.cloud_published_storefront_catalog_v1() @? '$.products[*] ? (@.slug == "projection-z-product")' then
    raise exception 'Product with unresolved blocking error remained visible';
  end if;
end $$;
rollback to unresolved_blocker;

-- A public document URL is an independently mutable public dependency. Its
-- trigger-maintained clock must advance generatedAt in the same snapshot as
-- the changed URL.
savepoint public_document_url_clock;
do $$
declare
  before_projection jsonb;
  after_projection jsonb;
  product jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  perform pg_sleep(0.01);
  update cloud.storage_objects
  set source_url = 'https://example.invalid/public-document-v2.pdf'
  where id = '60000000-0000-4000-8000-000000000031';
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  select item into product
  from jsonb_array_elements(after_projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';

  if product #>> '{documents,0,publicUrl}'
       <> 'https://example.invalid/public-document-v2.pdf' then
    raise exception 'public document URL did not change inside the writer transaction';
  end if;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'public document URL change'
  );
end
$$;
rollback to public_document_url_clock;

-- Every public removal path advances the same transactional clock. Each case
-- is isolated so the published fixture is restored before the next probe.
savepoint document_deleted_clock;
do $$
declare before_projection jsonb; after_projection jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  update cloud.storage_objects
  set deleted_at = clock_timestamp(), updated_at = clock_timestamp()
  where id = '60000000-0000-4000-8000-000000000031';
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'public document deletion'
  );
end
$$;
rollback to document_deleted_clock;

savepoint document_http_clock;
do $$
declare before_projection jsonb; after_projection jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  update cloud.storage_objects
  set source_url = 'http://example.invalid/public-document.pdf',
      updated_at = clock_timestamp()
  where id = '60000000-0000-4000-8000-000000000031';
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'public document HTTPS to HTTP transition'
  );
end
$$;
rollback to document_http_clock;

savepoint ownership_removed_clock;
do $$
declare before_projection jsonb; after_projection jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  delete from cloud.product_documents
  where product_id = '60000000-0000-4000-8000-000000000050'
    and storage_object_id = '60000000-0000-4000-8000-000000000031';
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'Product document ownership removal'
  );
end
$$;
rollback to ownership_removed_clock;

savepoint blocking_error_clock;
do $$
declare before_projection jsonb; after_projection jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  insert into cloud.import_blocking_errors (
    import_product_id, code, field_path, message
  ) values (
    (select id from cloud.import_products
     where existing_product_id = '60000000-0000-4000-8000-000000000050'),
    'projection_clock_blocker', 'product', 'Local removal clock fixture.'
  );
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'public Product blocking error'
  );
end
$$;
rollback to blocking_error_clock;

savepoint product_archive_clock;
do $$
declare
  before_projection jsonb;
  after_projection jsonb;
  repeated_projection jsonb;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);
  perform set_config(
    'request.jwt.claims',
    '{"role":"service_role","app_metadata":{"app_role":"service"}}', true
  );
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  perform cloud_api.archive_product_v1(
    '60000000-0000-4000-8000-000000000050',
    'projection-clock-archive'
  );
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'Product archive'
  );
  perform cloud_api.archive_product_v1(
    '60000000-0000-4000-8000-000000000050',
    'projection-clock-archive'
  );
  select cloud_api.cloud_published_storefront_catalog_v1() into repeated_projection;
  perform pg_temp.assert_public_projection_unchanged_v3(
    after_projection, repeated_projection, 'Product archive exact retry'
  );
end
$$;
rollback to product_archive_clock;

savepoint product_publication_rollback_clock;
do $$
declare
  before_projection jsonb;
  after_projection jsonb;
  repeated_projection jsonb;
  publish_batch_id uuid;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);
  perform set_config(
    'request.jwt.claims',
    '{"role":"service_role","app_metadata":{"app_role":"service"}}', true
  );
  select active_product_publication_batch_id into publish_batch_id
  from cloud.products
  where id = '60000000-0000-4000-8000-000000000050';
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  perform cloud_api.rollback_product_publication_v1(
    publish_batch_id, 'projection-clock-publication-rollback'
  );
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, after_projection, 'Product publication rollback'
  );
  perform cloud_api.rollback_product_publication_v1(
    publish_batch_id, 'projection-clock-publication-rollback'
  );
  select cloud_api.cloud_published_storefront_catalog_v1() into repeated_projection;
  perform pg_temp.assert_public_projection_unchanged_v3(
    after_projection, repeated_projection, 'Product publication rollback exact retry'
  );
end
$$;
rollback to product_publication_rollback_clock;

-- Hidden content, a sequential exact retry, and a rolled-back transaction do
-- not create a false public cache invalidation.
savepoint hidden_storage_mutation_clock;
do $$
declare before_projection jsonb; after_projection jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  update cloud.storage_objects
  set source_url = 'https://example.invalid/private-document-v2.pdf',
      updated_at = clock_timestamp()
  where id = '60000000-0000-4000-8000-000000000032';
  select cloud_api.cloud_published_storefront_catalog_v1() into after_projection;
  perform pg_temp.assert_public_projection_unchanged_v3(
    before_projection, after_projection, 'hidden storage mutation'
  );
end
$$;
rollback to hidden_storage_mutation_clock;

savepoint exact_retry_clock;
do $$
declare before_projection jsonb; after_projection jsonb; before_version bigint; after_version bigint;
begin
  select cloud_api.cloud_published_storefront_catalog_v1(), state.version
  into before_projection, before_version
  from cloud.published_catalog_projection_state state where state.singleton;
  update cloud.storage_objects
  set source_url = source_url, updated_at = updated_at
  where id = '60000000-0000-4000-8000-000000000031';
  select cloud_api.cloud_published_storefront_catalog_v1(), state.version
  into after_projection, after_version
  from cloud.published_catalog_projection_state state where state.singleton;
  perform pg_temp.assert_public_projection_unchanged_v3(
    before_projection, after_projection, 'exact retry'
  );
  if after_version <> before_version then
    raise exception 'exact retry advanced projection version';
  end if;
end
$$;
rollback to exact_retry_clock;

create temporary table projection_rollback_probe as
select cloud_api.cloud_published_storefront_catalog_v1() as payload,
       state.version
from cloud.published_catalog_projection_state state
where state.singleton;
savepoint transaction_rollback_clock;
update cloud.storage_objects
set source_url = 'https://example.invalid/public-document-rolled-back.pdf'
where id = '60000000-0000-4000-8000-000000000031';
rollback to transaction_rollback_clock;
do $$
declare before_projection jsonb; after_projection jsonb; before_version bigint; after_version bigint;
begin
  select payload, version into before_projection, before_version
  from projection_rollback_probe;
  select cloud_api.cloud_published_storefront_catalog_v1(), state.version
  into after_projection, after_version
  from cloud.published_catalog_projection_state state where state.singleton;
  perform pg_temp.assert_public_projection_unchanged_v3(
    before_projection, after_projection, 'rolled-back public mutation'
  );
  if after_version <> before_version then
    raise exception 'rolled-back public mutation retained a projection event';
  end if;
end
$$;

-- Ownership is exact at Product/document relation level. A public object from
-- another Product and an otherwise valid unbound public object both fail
-- closed even when immutable revision checksums are made self-consistent.
savepoint other_product_storage_ownership;
insert into cloud.storage_objects (
  id, bucket, object_path, original_filename, mime_type, size_bytes,
  checksum_sha256, source_type, source_url, rights_status, confidence, access_status
) values (
  '60000000-0000-4000-8000-000000000035', 'published',
  'projection/other-product-document.pdf', 'other-product-document.pdf',
  'application/pdf', 128,
  '7777777777777777777777777777777777777777777777777777777777777777',
  'integration_test', 'https://example.invalid/other-product-document.pdf',
  'manufacturer_official', 'reviewed', 'public'
);
insert into cloud.product_documents (
  product_id, storage_object_id, title, document_type, language, is_official,
  publication_status
) values (
  '60000000-0000-4000-8000-000000000055',
  '60000000-0000-4000-8000-000000000035',
  'Public document', 'datasheet', 'ru', true, 'published'
);
set local session_replication_role = replica;
select pg_temp.replace_projection_product_payload(
  '60000000-0000-4000-8000-000000000050',
  replace(
    (select revision.candidate_payload::text
     from cloud.product_publication_revisions revision
     where revision.id = (
       select current_product_publication_revision_id from cloud.products
       where id = '60000000-0000-4000-8000-000000000050'
     )),
    '60000000-0000-4000-8000-000000000031',
    '60000000-0000-4000-8000-000000000035'
  )::jsonb
);
set local session_replication_role = origin;
do $$
declare product jsonb;
begin
  select item into product
  from jsonb_array_elements(cloud_api.cloud_published_storefront_catalog_v1() -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if jsonb_array_length(product -> 'documents') <> 0
     or product::text like '%other-product-document.pdf%' then
    raise exception 'storage object owned by another Product leaked';
  end if;
end
$$;
rollback to other_product_storage_ownership;

savepoint unbound_public_storage_ownership;
insert into cloud.storage_objects (
  id, bucket, object_path, original_filename, mime_type, size_bytes,
  checksum_sha256, source_type, source_url, rights_status, confidence, access_status
) values (
  '60000000-0000-4000-8000-000000000036', 'published',
  'projection/unbound-document.pdf', 'unbound-document.pdf', 'application/pdf', 128,
  '8888888888888888888888888888888888888888888888888888888888888888',
  'integration_test', 'https://example.invalid/unbound-document.pdf',
  'manufacturer_official', 'reviewed', 'public'
);
set local session_replication_role = replica;
select pg_temp.replace_projection_product_payload(
  '60000000-0000-4000-8000-000000000050',
  replace(
    (select revision.candidate_payload::text
     from cloud.product_publication_revisions revision
     where revision.id = (
       select current_product_publication_revision_id from cloud.products
       where id = '60000000-0000-4000-8000-000000000050'
     )),
    '60000000-0000-4000-8000-000000000031',
    '60000000-0000-4000-8000-000000000036'
  )::jsonb
);
set local session_replication_role = origin;
do $$
declare product jsonb;
begin
  select item into product
  from jsonb_array_elements(cloud_api.cloud_published_storefront_catalog_v1() -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if jsonb_array_length(product -> 'documents') <> 0
     or product::text like '%unbound-document.pdf%' then
    raise exception 'unbound public storage object leaked';
  end if;
end
$$;
rollback to unbound_public_storage_ownership;

-- Malformed optional numeric content is excluded at child granularity. The
-- containing Product and an unrelated Product remain visible, and the RPC
-- never evaluates an unsafe cast.
savepoint malformed_numeric_child;
set local session_replication_role = replica;
select pg_temp.replace_projection_product_payload(
  '60000000-0000-4000-8000-000000000050',
  jsonb_set(
    (select revision.candidate_payload
     from cloud.product_publication_revisions revision
     where revision.id = (
       select current_product_publication_revision_id from cloud.products
       where id = '60000000-0000-4000-8000-000000000050'
     )),
    '{media,0,sortOrder}', '"malformed"'::jsonb, false
  )
);
set local session_replication_role = origin;
do $$
declare
  projection jsonb;
  product jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into projection;
  select item into product
  from jsonb_array_elements(projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if product is null
     or jsonb_array_length(product -> 'media') <> 0
     or not projection @? '$.products[*] ? (@.slug == "projection-a-product")' then
    raise exception 'malformed numeric child was not isolated fail-closed';
  end if;
end
$$;
rollback to malformed_numeric_child;

-- Malformed booleans are excluded rather than cast. The Product and its
-- valid neighbor remain available.
savepoint malformed_boolean_child;
set local session_replication_role = replica;
select pg_temp.replace_projection_product_payload(
  '60000000-0000-4000-8000-000000000050',
  jsonb_set(
    (select revision.candidate_payload
     from cloud.product_publication_revisions revision
     where revision.id = (
       select current_product_publication_revision_id from cloud.products
       where id = '60000000-0000-4000-8000-000000000050'
     )),
    '{documents,1,isOfficial}', '"not-a-boolean"'::jsonb, false
  )
);
set local session_replication_role = origin;
do $$
declare
  projection jsonb;
  product jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into projection;
  select item into product
  from jsonb_array_elements(projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if product is null
     or jsonb_array_length(product -> 'documents') <> 0
     or not projection @? '$.products[*] ? (@.slug == "projection-a-product")' then
    raise exception 'malformed boolean child was not isolated fail-closed';
  end if;
end
$$;
rollback to malformed_boolean_child;

-- A malformed mandatory nested application-area object excludes only its
-- Product. A valid neighboring Product remains visible.
savepoint malformed_nested_object;
set local session_replication_role = replica;
select pg_temp.replace_projection_product_payload(
  '60000000-0000-4000-8000-000000000050',
  jsonb_set(
    (select revision.candidate_payload
     from cloud.product_publication_revisions revision
     where revision.id = (
       select current_product_publication_revision_id from cloud.products
       where id = '60000000-0000-4000-8000-000000000050'
     )),
    '{applicationAreas,0}', '"malformed"'::jsonb, false
  )
);
set local session_replication_role = origin;
do $$
declare projection jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into projection;
  if projection @? '$.products[*] ? (@.slug == "projection-z-product")'
     or not projection @? '$.products[*] ? (@.slug == "projection-a-product")' then
    raise exception 'malformed mandatory nested object was not Product-isolated';
  end if;
end
$$;
rollback to malformed_nested_object;

-- A visible structured field that loses its valid evidence disappears and
-- advances the public clock even though the newly-invalid row is no longer
-- part of the projection.
savepoint invisible_structured_clock;
do $$
declare
  before_projection jsonb;
  projection jsonb;
  product jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  set local session_replication_role = replica;
  update cloud.product_key_features
  set approval_decision_id = '60000000-0000-4000-8000-000000000093',
      updated_at = '2099-01-01T00:00:00Z'
  where product_id = '60000000-0000-4000-8000-000000000050'
    and structured_item_id = 'projection-feature';
  set local session_replication_role = origin;
  select cloud_api.cloud_published_storefront_catalog_v1() into projection;
  select item into product
  from jsonb_array_elements(projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if jsonb_array_length(product -> 'keyFeatures') <> 0
     or (projection ->> 'generatedAt')::timestamptz >= '2099-01-01T00:00:00Z' then
    raise exception 'invalid structured row was not isolated safely';
  end if;
  perform pg_temp.assert_public_projection_content_changed_v3(
    before_projection, projection, 'visible structured field removal'
  );
end
$$;
rollback to invisible_structured_clock;

-- Internal timestamp-only churn is not public content and therefore leaves
-- both the JSON payload and the monotonic clock unchanged.
savepoint visible_structured_clock;
do $$
declare
  before_projection jsonb;
  projection jsonb;
  product jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into before_projection;
  set local session_replication_role = replica;
  update cloud.product_key_features
  set updated_at = '2098-01-01T00:00:00Z'
  where product_id = '60000000-0000-4000-8000-000000000050'
    and structured_item_id = 'projection-feature';
  set local session_replication_role = origin;
  select cloud_api.cloud_published_storefront_catalog_v1() into projection;
  select item into product
  from jsonb_array_elements(projection -> 'products') item
  where item ->> 'slug' = 'projection-z-product';
  if jsonb_array_length(product -> 'keyFeatures') <> 1 then
    raise exception 'valid structured row was omitted from payload';
  end if;
  perform pg_temp.assert_public_projection_unchanged_v3(
    before_projection, projection, 'visible structured timestamp-only mutation'
  );
end
$$;
rollback to visible_structured_clock;

-- Determinism is asserted over a longer consecutive sample, not merely a
-- single repeated call.
do $$
declare
  expected_projection jsonb;
  repeated_projection jsonb;
  call_number integer;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into expected_projection;
  for call_number in 1..100 loop
    select cloud_api.cloud_published_storefront_catalog_v1() into repeated_projection;
    if repeated_projection is distinct from expected_projection then
      raise exception 'published projection changed on deterministic call %', call_number;
    end if;
  end loop;
end
$$;

do $$
declare
  authenticated_denied boolean := false;
  before_counts jsonb;
  after_counts jsonb;
begin
  if has_function_privilege(
       'anon', 'cloud_api.cloud_published_storefront_catalog_v1()', 'EXECUTE'
     ) or has_function_privilege(
       'authenticated', 'cloud_api.cloud_published_storefront_catalog_v1()', 'EXECUTE'
     ) or not has_function_privilege(
       'service_role', 'cloud_api.cloud_published_storefront_catalog_v1()', 'EXECUTE'
     ) then
    raise exception 'Published Projection grants are unsafe';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  begin
    perform cloud.cloud_published_storefront_catalog_v1();
  exception when insufficient_privilege then
    authenticated_denied := true;
  end;
  if not authenticated_denied then
    raise exception 'authenticated request bypassed service-only projection boundary';
  end if;

  perform set_config('request.jwt.claim.role', 'service_role', true);
  select jsonb_build_object(
    'products', (select count(*) from cloud.products),
    'revisions', (select count(*) from cloud.product_publication_revisions),
    'approvals', (select count(*) from cloud.product_publication_approvals),
    'batches', (select count(*) from cloud.product_publication_batches),
    'audit', (select count(*) from cloud.audit_log)
  ) into before_counts;
  perform cloud_api.cloud_published_storefront_catalog_v1();
  select jsonb_build_object(
    'products', (select count(*) from cloud.products),
    'revisions', (select count(*) from cloud.product_publication_revisions),
    'approvals', (select count(*) from cloud.product_publication_approvals),
    'batches', (select count(*) from cloud.product_publication_batches),
    'audit', (select count(*) from cloud.audit_log)
  ) into after_counts;
  if before_counts is distinct from after_counts then
    raise exception 'read-only projection mutated operational data';
  end if;
end
$$;

\if :{?keep_fixture}
commit;
\else
rollback;
\endif
