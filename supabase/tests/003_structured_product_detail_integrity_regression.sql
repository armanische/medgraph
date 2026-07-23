\set ON_ERROR_STOP on

begin;

-- Local-only synthetic fixture. It verifies the two confirmed integrity
-- blockers and rolls back every row before returning.
insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, country_code, description,
  confidence, publication_status
) values (
  '20000000-0000-4000-8000-000000000001',
  'manufacturer-integrity', 'integrity-manufacturer',
  'Integrity Manufacturer', 'Integrity Manufacturer', 'CH',
  'Local integrity fixture.', 'reviewed', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values (
  '20000000-0000-4000-8000-000000000002',
  'category-integrity', 'integrity-category', 'Integrity Category',
  'Integrity Category', 'Local integrity fixture.', 'leaf', true,
  'reviewed', 'published'
);

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  source_uid, source_checksum, snapshot_version, created_from_snapshot_at,
  import_batch_key, created_at, updated_at
) values
(
  '20000000-0000-4000-8000-000000000003',
  'structured-integrity-product', 'Structured Integrity Product', 'SI-1',
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'Local integrity fixture.', 'Local integrity fixture.', 'integration_test',
  'https://example.invalid/products/si-1', 'reviewed', 'draft',
  'structured-integrity-source',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'integrity-test-v1', '2026-07-23T00:00:00Z',
  'structured-integrity-test', '2026-07-23T00:00:00Z', '2026-07-23T00:00:00Z'
),
(
  '20000000-0000-4000-8000-000000000004',
  'structured-integrity-unrelated', 'Unrelated Integrity Product', 'SI-2',
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'Local unrelated fixture.', 'Local unrelated fixture.', 'integration_test',
  'https://example.invalid/products/si-2', 'reviewed', 'draft',
  'structured-integrity-unrelated-source',
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  'integrity-test-v1', '2026-07-23T00:00:00Z',
  'structured-integrity-test', '2026-07-23T00:00:00Z', '2026-07-23T00:00:00Z'
);

insert into cloud.product_characteristics (
  id, product_id, key, display_name, raw_value, normalized_value, unit,
  sort_order, confidence, source_reference, reviewer_status,
  created_at, updated_at
) values
(
  '20000000-0000-4000-8000-000000000005',
  '20000000-0000-4000-8000-000000000003',
  'structured-local-specification', 'Legacy collision', 'legacy-raw',
  'legacy-normalized', 'legacy-unit', 77, 'reviewed', 'legacy:evidence',
  'approved', '2026-07-23T00:00:00Z', '2026-07-23T00:00:00Z'
),
(
  '20000000-0000-4000-8000-000000000006',
  '20000000-0000-4000-8000-000000000004',
  'unrelated-characteristic', 'Unrelated', 'unchanged', 'unchanged', null,
  1, 'reviewed', 'unrelated:evidence', 'approved',
  '2026-07-23T00:00:00Z', '2026-07-23T00:00:00Z'
);

create temporary table integrity_row_baseline (
  row_id uuid primary key,
  row_value jsonb not null
);
insert into integrity_row_baseline
select id, to_jsonb(characteristic)
from cloud.product_characteristics characteristic
where id in (
  '20000000-0000-4000-8000-000000000005',
  '20000000-0000-4000-8000-000000000006'
);

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  '20000000-0000-4000-8000-000000000007',
  'structured-integrity-test', 'integrity-test-v1', 'test', 'completed',
  '2026-07-23T00:00:00Z', '2026-07-23T00:00:01Z', '{}'::jsonb
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
) values (
  '20000000-0000-4000-8000-000000000008',
  '20000000-0000-4000-8000-000000000007',
  'structured-integrity-source', 'integration_test',
  'local://structured-integrity', '{}'::jsonb,
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
);

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
) values (
  '20000000-0000-4000-8000-000000000009',
  '20000000-0000-4000-8000-000000000007',
  '20000000-0000-4000-8000-000000000008',
  'structured-integrity-source', 'structured-integrity-product', 'imported',
  'source_exact', 'exact', 'exact', 'needs_review',
  '20000000-0000-4000-8000-000000000003'
);

insert into cloud.review_items (
  id, import_product_id, status, priority, reviewed_at
) values (
  '20000000-0000-4000-8000-000000000010',
  '20000000-0000-4000-8000-000000000009', 'approved', 'critical',
  '2026-07-23T00:01:00Z'
);

insert into cloud.publication_candidates (
  id, import_product_id, target_product_id, schema_version, candidate_data,
  validation_status, approved_by, approved_at, created_at, updated_at
) values (
  '20000000-0000-4000-8000-000000000011',
  '20000000-0000-4000-8000-000000000009',
  '20000000-0000-4000-8000-000000000003', 1,
  jsonb_build_object(
    'schemaVersion', 1,
    'product', jsonb_build_object(
      'id', '20000000-0000-4000-8000-000000000003',
      'sourceUid', 'structured-integrity-source'
    ),
    'keyFeatures', jsonb_build_array(jsonb_build_object(
      'key', 'local-feature', 'text', 'Reviewed feature A', 'sortOrder', 10,
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
  'approved', '20000000-0000-4000-8000-000000000012',
  '2026-07-23T00:02:00Z', '2026-07-23T00:02:00Z', '2026-07-23T00:02:00Z'
);

select set_config('request.jwt.claim.role', 'service_role', true);

create temporary table integrity_revisions (
  label text primary key,
  result jsonb not null
);
insert into integrity_revisions
select 'A', cloud_api.create_structured_product_detail_revision_v1(
  '20000000-0000-4000-8000-000000000011',
  '20000000-0000-4000-8000-000000000012'
);

update cloud.publication_candidates
set validation_status = 'approved',
    approved_by = '20000000-0000-4000-8000-000000000012',
    approved_at = clock_timestamp(),
    updated_at = clock_timestamp()
where id = '20000000-0000-4000-8000-000000000011';

insert into cloud.product_detail_candidate_revision_approvals (
  id, candidate_revision_id, review_item_id, payload_checksum,
  product_identity_checksum, decision, reviewer_id, approved_at
)
select
  '20000000-0000-4000-8000-000000000013', revision.id,
  '20000000-0000-4000-8000-000000000010', revision.payload_checksum,
  revision.product_identity_checksum, 'approve',
  '20000000-0000-4000-8000-000000000012', candidate.approved_at
from cloud.product_detail_candidate_revisions revision
join cloud.publication_candidates candidate on candidate.id = revision.candidate_id
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'A'
);

insert into cloud.review_decisions (
  id, review_item_id, decision_type, field_path, proposed_value,
  approved_value, decision, reviewer_id, rationale, created_at,
  candidate_revision_id, approved_payload_checksum, product_identity_checksum
)
select
  '20000000-0000-4000-8000-000000000014'::uuid,
  '20000000-0000-4000-8000-000000000010'::uuid, 'structured_field',
  'structuredProductDetail.keyFeatures.local-feature',
  revision.candidate_payload -> 'keyFeatures' -> 0,
  revision.candidate_payload -> 'keyFeatures' -> 0,
  'approve'::cloud.review_decision_type,
  '20000000-0000-4000-8000-000000000012'::uuid,
  'Revision A feature approval.', revision.created_at + interval '1 millisecond',
  revision.id, revision.payload_checksum, revision.product_identity_checksum
from cloud.product_detail_candidate_revisions revision
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'A'
)
union all
select
  '20000000-0000-4000-8000-000000000015'::uuid,
  '20000000-0000-4000-8000-000000000010'::uuid, 'structured_field',
  'structuredProductDetail.specifications.local-specification',
  revision.candidate_payload -> 'specifications' -> 0,
  revision.candidate_payload -> 'specifications' -> 0,
  'approve'::cloud.review_decision_type,
  '20000000-0000-4000-8000-000000000012'::uuid,
  'Revision A specification approval.', revision.created_at + interval '2 milliseconds',
  revision.id, revision.payload_checksum, revision.product_identity_checksum
from cloud.product_detail_candidate_revisions revision
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'A'
);

create or replace function pg_temp.expect_integrity_publication_rejected(
  p_revision_id uuid,
  p_idempotency_key text
)
returns void
language plpgsql
as $$
declare
  rejected boolean := false;
begin
  begin
    perform cloud_api.publish_structured_product_detail_v2(
      p_revision_id, 1, p_idempotency_key,
      '20000000-0000-4000-8000-000000000012'
    );
  exception when sqlstate '22023' or sqlstate '23505' then
    rejected := true;
  end;
  if not rejected then
    raise exception 'expected publication rejection for %', p_idempotency_key;
  end if;
end
$$;

-- Candidate payload, provenance and ordering changes invalidate revision A.
update cloud.publication_candidates
set candidate_data = jsonb_set(
  candidate_data, '{keyFeatures,0,text}', to_jsonb('Changed after approval'::text)
)
where id = '20000000-0000-4000-8000-000000000011';
select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'A'),
  'integrity-stale-candidate-payload'
);

update cloud.publication_candidates candidate
set candidate_data = revision.candidate_payload
from cloud.product_detail_candidate_revisions revision
where candidate.id = '20000000-0000-4000-8000-000000000011'
  and revision.id = (
    select (entry.result ->> 'candidateRevisionId')::uuid
    from integrity_revisions entry where entry.label = 'A'
  );

update cloud.publication_candidates
set candidate_data = jsonb_set(
  candidate_data, '{specifications,0,source,ref}',
  to_jsonb('changed:provenance'::text)
)
where id = '20000000-0000-4000-8000-000000000011';
select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'A'),
  'integrity-stale-provenance'
);

update cloud.publication_candidates candidate
set candidate_data = revision.candidate_payload
from cloud.product_detail_candidate_revisions revision
where candidate.id = '20000000-0000-4000-8000-000000000011'
  and revision.id = (
    select (entry.result ->> 'candidateRevisionId')::uuid
    from integrity_revisions entry where entry.label = 'A'
  );

update cloud.publication_candidates
set candidate_data = jsonb_set(
  candidate_data, '{specifications,0,sortOrder}', to_jsonb(11)
)
where id = '20000000-0000-4000-8000-000000000011';
select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'A'),
  'integrity-stale-ordering'
);

update cloud.publication_candidates candidate
set candidate_data = revision.candidate_payload
from cloud.product_detail_candidate_revisions revision
where candidate.id = '20000000-0000-4000-8000-000000000011'
  and revision.id = (
    select (entry.result ->> 'candidateRevisionId')::uuid
    from integrity_revisions entry where entry.label = 'A'
  );

-- Product identity/version changes also invalidate revision A.
update cloud.products
set updated_at = '2026-07-23T00:03:00Z'
where id = '20000000-0000-4000-8000-000000000003';
select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'A'),
  'integrity-stale-product-identity'
);
update cloud.products
set updated_at = '2026-07-23T00:00:00Z'
where id = '20000000-0000-4000-8000-000000000003';

do $$
begin
  if (select count(*) from cloud.product_detail_publication_batches) <> 0
     or (select count(*) from cloud.publication_events) <> 0
     or (select count(*) from cloud.product_key_features) <> 0
     or (select count(*) from cloud.product_characteristics
         where record_origin = 'structured_product_detail') <> 0 then
    raise exception 'failed preflight created mutation state';
  end if;
end
$$;

create temporary table integrity_batches (
  label text primary key,
  result jsonb not null
);
insert into integrity_batches
select 'A', cloud_api.publish_structured_product_detail_v2(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'A'),
  1, 'integrity-publication-batch-a',
  '20000000-0000-4000-8000-000000000012'
);

do $$
declare
  retry jsonb;
begin
  select cloud_api.publish_structured_product_detail_v2(
    (select (entry.result ->> 'candidateRevisionId')::uuid
     from integrity_revisions entry where entry.label = 'A'),
    1, 'integrity-publication-batch-a',
    '20000000-0000-4000-8000-000000000012'
  ) into retry;
  if not (retry ->> 'idempotent')::boolean
     or retry ->> 'publicationBatchId' is distinct from (
       select entry.result ->> 'publicationBatchId'
       from integrity_batches entry where entry.label = 'A'
     ) then
    raise exception 'exact retry did not return publication batch A';
  end if;
end
$$;

select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'A'),
  'integrity-publication-batch-a-different-key'
);

do $$
declare
  projection jsonb;
begin
  if (select to_jsonb(characteristic) from cloud.product_characteristics characteristic
      where characteristic.id = '20000000-0000-4000-8000-000000000005')
     is distinct from (
       select row_value from integrity_row_baseline
       where row_id = '20000000-0000-4000-8000-000000000005'
     ) then
    raise exception 'structured publication changed legacy collision row';
  end if;
  if (select count(*) from cloud.product_characteristics
      where product_id = '20000000-0000-4000-8000-000000000003'
        and key = 'structured-local-specification') <> 2 then
    raise exception 'legacy and structured display keys were not isolated';
  end if;

  select cloud_api.cloud_storefront_preview_catalog() into projection;
  if jsonb_array_length(projection #> '{products,0,characteristicGroups}') <> 1
     or projection #>> '{products,0,characteristicGroups,0,items,0,label}'
       <> 'Local specification'
     or projection::text like '%Legacy collision%' then
    raise exception 'projection did not isolate published structured specification: %', projection;
  end if;
end
$$;

create temporary table integrity_state_a as
select jsonb_build_object(
  'features', coalesce((
    select jsonb_agg(to_jsonb(feature) order by feature.id)
    from cloud.product_key_features feature
    where feature.product_id = '20000000-0000-4000-8000-000000000003'
  ), '[]'::jsonb),
  'specifications', coalesce((
    select jsonb_agg(to_jsonb(characteristic) order by characteristic.id)
    from cloud.product_characteristics characteristic
    where characteristic.product_id = '20000000-0000-4000-8000-000000000003'
      and characteristic.record_origin = 'structured_product_detail'
  ), '[]'::jsonb)
) state;

-- Editing produces revision B. It inherits neither candidate approval binding
-- nor field-level decisions from revision A.
update cloud.publication_candidates
set candidate_data = jsonb_set(
      jsonb_set(candidate_data, '{keyFeatures,0,text}', to_jsonb('Reviewed feature B'::text)),
      '{specifications,0,value}', to_jsonb('84'::text)
    ),
    validation_status = 'approved',
    updated_at = '2026-07-23T00:04:00Z'
where id = '20000000-0000-4000-8000-000000000011';

insert into integrity_revisions
select 'B', cloud_api.create_structured_product_detail_revision_v1(
  '20000000-0000-4000-8000-000000000011',
  '20000000-0000-4000-8000-000000000012'
);

select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'B'),
  'integrity-revision-b-no-inherited-approval'
);

update cloud.publication_candidates
set validation_status = 'approved',
    approved_by = '20000000-0000-4000-8000-000000000012',
    approved_at = clock_timestamp(),
    updated_at = clock_timestamp()
where id = '20000000-0000-4000-8000-000000000011';

insert into cloud.product_detail_candidate_revision_approvals (
  id, candidate_revision_id, review_item_id, payload_checksum,
  product_identity_checksum, decision, reviewer_id, approved_at
)
select
  '20000000-0000-4000-8000-000000000016', revision.id,
  '20000000-0000-4000-8000-000000000010', revision.payload_checksum,
  revision.product_identity_checksum, 'approve',
  '20000000-0000-4000-8000-000000000012', candidate.approved_at
from cloud.product_detail_candidate_revisions revision
join cloud.publication_candidates candidate on candidate.id = revision.candidate_id
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'B'
);

-- A later decision bound to revision A is stale for revision B.
insert into cloud.review_decisions (
  id, review_item_id, decision_type, field_path, proposed_value,
  approved_value, decision, reviewer_id, rationale, created_at,
  candidate_revision_id, approved_payload_checksum, product_identity_checksum
)
select
  '20000000-0000-4000-8000-000000000017',
  '20000000-0000-4000-8000-000000000010', 'structured_field',
  'structuredProductDetail.keyFeatures.local-feature',
  revision.candidate_payload -> 'keyFeatures' -> 0,
  revision.candidate_payload -> 'keyFeatures' -> 0,
  'approve', '20000000-0000-4000-8000-000000000012',
  'Stale revision A decision.',
  (select revision_b.created_at + interval '1 millisecond'
   from cloud.product_detail_candidate_revisions revision_b
   where revision_b.id = (
     select (entry.result ->> 'candidateRevisionId')::uuid
     from integrity_revisions entry where entry.label = 'B'
   )),
  revision.id, revision.payload_checksum, revision.product_identity_checksum
from cloud.product_detail_candidate_revisions revision
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'A'
);

select pg_temp.expect_integrity_publication_rejected(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'B'),
  'integrity-revision-b-stale-decision'
);

insert into cloud.review_decisions (
  id, review_item_id, decision_type, field_path, proposed_value,
  approved_value, decision, reviewer_id, rationale, created_at,
  candidate_revision_id, approved_payload_checksum, product_identity_checksum
)
select
  '20000000-0000-4000-8000-000000000018'::uuid,
  '20000000-0000-4000-8000-000000000010'::uuid, 'structured_field',
  'structuredProductDetail.keyFeatures.local-feature',
  revision.candidate_payload -> 'keyFeatures' -> 0,
  revision.candidate_payload -> 'keyFeatures' -> 0,
  'approve'::cloud.review_decision_type,
  '20000000-0000-4000-8000-000000000012'::uuid,
  'Revision B feature approval.', revision.created_at + interval '2 milliseconds',
  revision.id, revision.payload_checksum, revision.product_identity_checksum
from cloud.product_detail_candidate_revisions revision
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'B'
)
union all
select
  '20000000-0000-4000-8000-000000000019'::uuid,
  '20000000-0000-4000-8000-000000000010'::uuid, 'structured_field',
  'structuredProductDetail.specifications.local-specification',
  revision.candidate_payload -> 'specifications' -> 0,
  revision.candidate_payload -> 'specifications' -> 0,
  'approve'::cloud.review_decision_type,
  '20000000-0000-4000-8000-000000000012'::uuid,
  'Revision B specification approval.', revision.created_at + interval '3 milliseconds',
  revision.id, revision.payload_checksum, revision.product_identity_checksum
from cloud.product_detail_candidate_revisions revision
where revision.id = (
  select (entry.result ->> 'candidateRevisionId')::uuid
  from integrity_revisions entry where entry.label = 'B'
);

insert into integrity_batches
select 'B', cloud_api.publish_structured_product_detail_v2(
  (select (entry.result ->> 'candidateRevisionId')::uuid
   from integrity_revisions entry where entry.label = 'B'),
  1, 'integrity-publication-batch-b',
  '20000000-0000-4000-8000-000000000012'
);

do $$
declare
  rollback_result jsonb;
begin
  select cloud_api.rollback_structured_product_detail_v2(
    (select (entry.result ->> 'publicationBatchId')::uuid
     from integrity_batches entry where entry.label = 'B'),
    '20000000-0000-4000-8000-000000000012'
  ) into rollback_result;
  if rollback_result ->> 'status' <> 'rolled_back'
     or (rollback_result ->> 'idempotent')::boolean then
    raise exception 'rollback B failed: %', rollback_result;
  end if;

  if (select jsonb_build_object(
        'features', coalesce((
          select jsonb_agg(to_jsonb(feature) order by feature.id)
          from cloud.product_key_features feature
          where feature.product_id = '20000000-0000-4000-8000-000000000003'
        ), '[]'::jsonb),
        'specifications', coalesce((
          select jsonb_agg(to_jsonb(characteristic) order by characteristic.id)
          from cloud.product_characteristics characteristic
          where characteristic.product_id = '20000000-0000-4000-8000-000000000003'
            and characteristic.record_origin = 'structured_product_detail'
        ), '[]'::jsonb)
      )) is distinct from (select state from integrity_state_a) then
    raise exception 'rollback B did not restore exact state after A';
  end if;
  if (select status from cloud.product_detail_publication_batches
      where id = (select (entry.result ->> 'publicationBatchId')::uuid
                  from integrity_batches entry where entry.label = 'A')) <> 'published' then
    raise exception 'rollback B did not restore publication batch A';
  end if;

  select cloud_api.rollback_structured_product_detail_v2(
    (select (entry.result ->> 'publicationBatchId')::uuid
     from integrity_batches entry where entry.label = 'B'),
    '20000000-0000-4000-8000-000000000012'
  ) into rollback_result;
  if not (rollback_result ->> 'idempotent')::boolean then
    raise exception 'rollback B retry was not idempotent';
  end if;
end
$$;

do $$
declare
  rollback_result jsonb;
begin
  select cloud_api.rollback_structured_product_detail_v2(
    (select (entry.result ->> 'publicationBatchId')::uuid
     from integrity_batches entry where entry.label = 'A'),
    '20000000-0000-4000-8000-000000000012'
  ) into rollback_result;
  if rollback_result ->> 'status' <> 'rolled_back'
     or (rollback_result ->> 'idempotent')::boolean then
    raise exception 'rollback A failed: %', rollback_result;
  end if;

  if exists (
    select 1 from cloud.product_key_features
    where product_id = '20000000-0000-4000-8000-000000000003'
  ) or exists (
    select 1 from cloud.product_characteristics
    where product_id = '20000000-0000-4000-8000-000000000003'
      and record_origin = 'structured_product_detail'
  ) then
    raise exception 'rollback A left rows created by publication A';
  end if;

  select cloud_api.rollback_structured_product_detail_v2(
    (select (entry.result ->> 'publicationBatchId')::uuid
     from integrity_batches entry where entry.label = 'A'),
    '20000000-0000-4000-8000-000000000012'
  ) into rollback_result;
  if not (rollback_result ->> 'idempotent')::boolean then
    raise exception 'rollback A retry was not idempotent';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from integrity_row_baseline baseline
    join cloud.product_characteristics characteristic on characteristic.id = baseline.row_id
    where to_jsonb(characteristic) is distinct from baseline.row_value
  ) then
    raise exception 'legacy or unrelated characteristic changed during publication/rollback';
  end if;
  if (select count(*) from cloud.product_detail_candidate_revisions) <> 2
     or (select count(*) from cloud.product_detail_candidate_revision_approvals) <> 2
     or (select count(*) from cloud.review_decisions
         where candidate_revision_id is not null) <> 5
     or (select count(*) from cloud.publication_events) <> 4
     or (select count(*) from cloud.audit_log
         where entity_type = 'product_detail_publication_batch') <> 4 then
    raise exception 'review, provenance, publication or audit history was not preserved';
  end if;
end
$$;

do $$
begin
  if has_function_privilege(
       'anon', 'cloud_api.create_structured_product_detail_revision_v1(uuid,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'authenticated', 'cloud_api.create_structured_product_detail_revision_v1(uuid,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'anon', 'cloud_api.publish_structured_product_detail_v2(uuid,integer,text,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'authenticated', 'cloud_api.publish_structured_product_detail_v2(uuid,integer,text,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'anon', 'cloud_api.rollback_structured_product_detail_v2(uuid,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'authenticated', 'cloud_api.rollback_structured_product_detail_v2(uuid,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'service_role', 'cloud_api.publish_structured_product_detail_v1(uuid,integer,text,uuid)', 'EXECUTE'
     ) or has_function_privilege(
       'service_role', 'cloud_api.rollback_structured_product_detail_v1(uuid,uuid)', 'EXECUTE'
     ) then
    raise exception 'structured Product Detail function grants are not fail-closed';
  end if;
  if not has_function_privilege(
       'service_role', 'cloud_api.create_structured_product_detail_revision_v1(uuid,uuid)', 'EXECUTE'
     ) or not has_function_privilege(
       'service_role', 'cloud_api.publish_structured_product_detail_v2(uuid,integer,text,uuid)', 'EXECUTE'
     ) or not has_function_privilege(
       'service_role', 'cloud_api.rollback_structured_product_detail_v2(uuid,uuid)', 'EXECUTE'
     ) then
    raise exception 'service-only v2 functions are unavailable';
  end if;
  if has_table_privilege('anon', 'cloud.product_detail_candidate_revisions', 'SELECT')
     or has_table_privilege('authenticated', 'cloud.product_detail_candidate_revisions', 'SELECT')
     or has_table_privilege('anon', 'cloud.product_detail_candidate_revision_approvals', 'SELECT')
     or has_table_privilege('authenticated', 'cloud.product_detail_candidate_revision_approvals', 'SELECT') then
    raise exception 'unpublished revision or approval data is publicly readable';
  end if;
  if not (select relrowsecurity from pg_class
          where oid = 'cloud.product_detail_candidate_revisions'::regclass)
     or not (select relrowsecurity from pg_class
             where oid = 'cloud.product_detail_candidate_revision_approvals'::regclass) then
    raise exception 'revision/approval RLS is disabled';
  end if;
end
$$;

-- Immutability is enforced by triggers, not convention.
do $$
declare
  rejected boolean := false;
begin
  begin
    update cloud.product_detail_candidate_revisions
    set candidate_payload = '{}'::jsonb
    where id = (
      select (entry.result ->> 'candidateRevisionId')::uuid
      from integrity_revisions entry where entry.label = 'A'
    );
  exception when sqlstate '55000' then
    rejected := true;
  end;
  if not rejected then
    raise exception 'immutable candidate revision accepted an update';
  end if;
end
$$;

rollback;
