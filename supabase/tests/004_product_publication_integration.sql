\set ON_ERROR_STOP on

begin;

insert into cloud.user_profiles (id, role, display_name) values
  ('40000000-0000-4000-8000-000000000001', 'service', 'Local publication service'),
  ('40000000-0000-4000-8000-000000000002', 'reviewer', 'Local publication reviewer');

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, country_code, description,
  confidence, publication_status
) values
  (
    '40000000-0000-4000-8000-000000000010',
    'manufacturer-publication-test', 'publication-test-manufacturer',
    'Publication Test Manufacturer', 'Publication Test Manufacturer', 'CH',
    'Local publication fixture.', 'reviewed', 'published'
  ),
  (
    '40000000-0000-4000-8000-000000000011',
    'manufacturer-publication-partial', 'publication-partial-manufacturer',
    'Publication Partial Manufacturer', 'Publication Partial Manufacturer', 'DE',
    'Local atomicity fixture.', 'reviewed', 'published'
  );

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values
  (
    '40000000-0000-4000-8000-000000000020',
    'category-publication-test', 'publication-test-category',
    'Publication Test Category', 'Publication Test Category',
    'Local publication fixture.', 'leaf', true, 'reviewed', 'published'
  ),
  (
    '40000000-0000-4000-8000-000000000021',
    'category-publication-partial', 'publication-partial-category',
    'Publication Partial Category', 'Publication Partial Category',
    'Local atomicity fixture.', 'leaf', true, 'reviewed', 'published'
  );

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description, confidence,
  publication_status
) values
  (
    '40000000-0000-4000-8000-000000000030',
    'application-area-publication-test', 'publication-test-area',
    'Publication Test Area', 'Publication Test Area', 'Local publication fixture.',
    'reviewed', 'published'
  ),
  (
    '40000000-0000-4000-8000-000000000031',
    'application-area-publication-partial', 'publication-partial-area',
    'Publication Partial Area', 'Publication Partial Area', 'Local atomicity fixture.',
    'reviewed', 'published'
  );

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  '40000000-0000-4000-8000-000000000040',
  'product-publication-integration-test', 'product-publication-test-v1', 'test',
  'completed', '2026-07-25T00:00:00Z', '2026-07-25T00:00:01Z', '{}'::jsonb
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
) values
  (
    '40000000-0000-4000-8000-000000000041',
    '40000000-0000-4000-8000-000000000040',
    'product-publication-source', 'integration_test',
    'local://product-publication-source', '{}'::jsonb,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  (
    '40000000-0000-4000-8000-000000000042',
    '40000000-0000-4000-8000-000000000040',
    'product-publication-incomplete-source', 'integration_test',
    'local://product-publication-incomplete-source', '{}'::jsonb,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  ),
  (
    '40000000-0000-4000-8000-000000000043',
    '40000000-0000-4000-8000-000000000040',
    'product-publication-partial-source', 'integration_test',
    'local://product-publication-partial-source', '{}'::jsonb,
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
  );

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  source_uid, source_checksum, snapshot_version, created_from_snapshot_at,
  import_batch_key, missing_manufacturer, missing_category, missing_model,
  missing_application_area, catalog_quality_status, catalog_quality_reason
) values
  (
    '40000000-0000-4000-8000-000000000050',
    'product-publication-test', 'Product Publication Test', 'PP-1',
    '40000000-0000-4000-8000-000000000010',
    '40000000-0000-4000-8000-000000000020',
    'Local publication fixture.', 'Local publication fixture.',
    'integration_test', 'https://example.invalid/products/pp-1', 'reviewed', 'draft',
    'product-publication-source',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'publication-test-v1', '2026-07-25T00:00:00Z',
    'product-publication-integration-test', false, false, false, false, 'READY', '{}'
  ),
  (
    '40000000-0000-4000-8000-000000000051',
    'product-publication-incomplete', 'Product Publication Incomplete', null,
    null, null, 'Incomplete local fixture.', 'Incomplete local fixture.',
    'integration_test', 'https://example.invalid/products/incomplete', 'unknown', 'draft',
    'product-publication-incomplete-source',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'publication-test-v1', '2026-07-25T00:00:00Z',
    'product-publication-integration-test', true, true, true, true,
    'REQUIRES_EDITOR_REVIEW', array['UNKNOWN_MANUFACTURER']
  ),
  (
    '40000000-0000-4000-8000-000000000052',
    'product-publication-partial', 'Product Publication Partial Failure', 'PP-2',
    '40000000-0000-4000-8000-000000000011',
    '40000000-0000-4000-8000-000000000021',
    'Local atomicity fixture.', 'Local atomicity fixture.',
    'integration_test', 'https://example.invalid/products/pp-2', 'reviewed', 'draft',
    'product-publication-partial-source',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    'publication-test-v1', '2026-07-25T00:00:00Z',
    'product-publication-integration-test', false, false, false, false, 'READY', '{}'
  );

insert into cloud.product_application_areas (product_id, application_area_id) values
  (
    '40000000-0000-4000-8000-000000000050',
    '40000000-0000-4000-8000-000000000030'
  ),
  (
    '40000000-0000-4000-8000-000000000052',
    '40000000-0000-4000-8000-000000000031'
  );

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
) values
  (
    '40000000-0000-4000-8000-000000000060',
    '40000000-0000-4000-8000-000000000040',
    '40000000-0000-4000-8000-000000000041',
    'product-publication-source', 'product-publication-test', 'imported',
    'source_exact', 'exact', 'exact', 'needs_review',
    '40000000-0000-4000-8000-000000000050'
  ),
  (
    '40000000-0000-4000-8000-000000000061',
    '40000000-0000-4000-8000-000000000040',
    '40000000-0000-4000-8000-000000000042',
    'product-publication-incomplete-source', 'product-publication-incomplete', 'imported',
    'source_exact', 'unresolved', 'unresolved', 'blocked',
    '40000000-0000-4000-8000-000000000051'
  ),
  (
    '40000000-0000-4000-8000-000000000062',
    '40000000-0000-4000-8000-000000000040',
    '40000000-0000-4000-8000-000000000043',
    'product-publication-partial-source', 'product-publication-partial', 'imported',
    'source_exact', 'exact', 'exact', 'needs_review',
    '40000000-0000-4000-8000-000000000052'
  );

insert into cloud.import_blocking_errors (
  import_product_id, code, field_path, message
) values (
  '40000000-0000-4000-8000-000000000061', 'missing_manufacturer',
  'manufacturer_id', 'Local fail-closed fixture.'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);

create temporary table product_publication_results (
  key text primary key,
  result jsonb not null
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);

insert into product_publication_results (key, result)
select 'revision', cloud_api.create_product_publication_revision_v1(
  '40000000-0000-4000-8000-000000000050',
  'product-publication-revision-1'
);

do $$
declare
  revision jsonb := (select result from product_publication_results where key = 'revision');
  repeated jsonb;
begin
  if revision ->> 'state' <> 'in_review'
     or (revision ->> 'idempotent')::boolean
     or (select publication_status from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') <> 'in_review' then
    raise exception 'revision creation did not enter in-review state: %', revision;
  end if;
  select cloud_api.create_product_publication_revision_v1(
    '40000000-0000-4000-8000-000000000050',
    'product-publication-revision-1'
  ) into repeated;
  if not (repeated ->> 'idempotent')::boolean
     or repeated ->> 'candidateRevisionId' <> revision ->> 'candidateRevisionId' then
    raise exception 'revision retry is not idempotent: %', repeated;
  end if;
end
$$;

-- Authenticated identity is fail-closed: an app-role claim cannot impersonate a
-- reviewer whose trusted profile has a different role for a real current revision.
do $$
begin
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
  perform set_config(
    'request.jwt.claims',
    '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000001","app_metadata":{"app_role":"reviewer"}}',
    true
  );
  begin
    perform cloud_api.record_product_publication_review_decision_v1(
      (select (result ->> 'candidateRevisionId')::uuid
       from product_publication_results where key = 'revision'),
      'Spoofed reviewer attempt.'
    );
    raise exception 'spoofed reviewer unexpectedly accepted';
  exception when insufficient_privilege then
    null;
  end;
  if exists (
    select 1 from cloud.review_decisions
    where product_publication_revision_id = (
      select (result ->> 'candidateRevisionId')::uuid
      from product_publication_results where key = 'revision'
    )
  ) then
    raise exception 'spoofed reviewer rejection left a review decision';
  end if;
end
$$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000002","app_metadata":{"app_role":"reviewer"}}',
  true
);
insert into product_publication_results (key, result)
select 'review-decision', cloud_api.record_product_publication_review_decision_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'revision'),
  'Local reviewer approved the exact Product revision.'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);
insert into product_publication_results (key, result)
select 'approval', cloud_api.approve_product_publication_revision_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'revision'),
  (select (result ->> 'reviewDecisionId')::uuid
   from product_publication_results where key = 'review-decision')
);

do $$
declare
  approval jsonb := (select result from product_publication_results where key = 'approval');
  repeated jsonb;
begin
  if approval ->> 'state' <> 'approved'
     or (approval ->> 'idempotent')::boolean
     or (select publication_status from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') <> 'approved' then
    raise exception 'approval did not enter approved state: %', approval;
  end if;
  select cloud_api.approve_product_publication_revision_v1(
    (select (result ->> 'candidateRevisionId')::uuid
     from product_publication_results where key = 'revision'),
    (select (result ->> 'reviewDecisionId')::uuid
     from product_publication_results where key = 'review-decision')
  ) into repeated;
  if not (repeated ->> 'idempotent')::boolean
     or repeated ->> 'approvalId' <> approval ->> 'approvalId' then
    raise exception 'approval retry is not idempotent: %', repeated;
  end if;
end
$$;

insert into product_publication_results (key, result)
select 'publish', cloud_api.publish_product_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'revision'),
  'product-publication-publish-1'
);

do $$
declare
  publication jsonb := (select result from product_publication_results where key = 'publish');
  repeated jsonb;
  repeated_revision jsonb;
begin
  if publication ->> 'state' <> 'published'
     or (publication ->> 'action') <> 'publish'
     or (publication ->> 'publicationVersion')::integer <> 1
     or (publication ->> 'idempotent')::boolean then
    raise exception 'unexpected publication result: %', publication;
  end if;
  if not exists (
    select 1 from cloud.products
    where id = '40000000-0000-4000-8000-000000000050'
      and publication_status = 'published'
      and review_state = 'published'
      and published_at is not null
      and active_product_publication_batch_id = (publication ->> 'publicationBatchId')::uuid
  ) then
    raise exception 'product was not atomically published';
  end if;
  select cloud_api.publish_product_v1(
    (select (result ->> 'candidateRevisionId')::uuid
     from product_publication_results where key = 'revision'),
    'product-publication-publish-1'
  ) into repeated;
  if not (repeated ->> 'idempotent')::boolean
     or repeated ->> 'publicationBatchId' <> publication ->> 'publicationBatchId' then
    raise exception 'publication retry is not idempotent: %', repeated;
  end if;
  select cloud_api.create_product_publication_revision_v1(
    '40000000-0000-4000-8000-000000000050',
    'product-publication-revision-1'
  ) into repeated_revision;
  if not (repeated_revision ->> 'idempotent')::boolean
     or repeated_revision ->> 'candidateRevisionId' <>
        (select result ->> 'candidateRevisionId'
         from product_publication_results where key = 'revision')
     or (select publication_status from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') <> 'published' then
    raise exception 'revision retry changed an advanced Product state: %', repeated_revision;
  end if;
end
$$;

-- Mandatory dependencies remain valid after publication. Reference unpublish,
-- category de-assignment and relationship removal all fail closed.
do $$
begin
  begin
    update cloud.manufacturers set publication_status = 'archived'
    where id = '40000000-0000-4000-8000-000000000010';
    raise exception 'published Product manufacturer unexpectedly unpublished';
  exception when foreign_key_violation then
    null;
  end;
  begin
    update cloud.categories set assignable = false
    where id = '40000000-0000-4000-8000-000000000020';
    raise exception 'published Product category unexpectedly became non-assignable';
  exception when foreign_key_violation then
    null;
  end;
  begin
    update cloud.application_areas set archived_at = now()
    where id = '40000000-0000-4000-8000-000000000030';
    raise exception 'published Product application area unexpectedly archived';
  exception when foreign_key_violation then
    null;
  end;
  begin
    delete from cloud.product_application_areas
    where product_id = '40000000-0000-4000-8000-000000000050'
      and application_area_id = '40000000-0000-4000-8000-000000000030';
    raise exception 'published Product application area link unexpectedly removed';
  exception when check_violation or object_not_in_prerequisite_state then
    null;
  end;

  if (select publication_status from cloud.manufacturers
      where id = '40000000-0000-4000-8000-000000000010') <> 'published'
     or not (select assignable from cloud.categories
             where id = '40000000-0000-4000-8000-000000000020')
     or (select archived_at from cloud.application_areas
         where id = '40000000-0000-4000-8000-000000000030') is not null
     or not exists (
       select 1 from cloud.product_application_areas
       where product_id = '40000000-0000-4000-8000-000000000050'
         and application_area_id = '40000000-0000-4000-8000-000000000030'
     ) then
    raise exception 'dependency guard did not preserve published Product contract';
  end if;
end
$$;

insert into product_publication_results (key, result)
select 'archive', cloud_api.archive_product_v1(
  '40000000-0000-4000-8000-000000000050',
  'product-publication-archive-1'
);

insert into product_publication_results (key, result)
select 'rollback-archive', cloud_api.rollback_product_publication_v1(
  (select (result ->> 'publicationBatchId')::uuid
   from product_publication_results where key = 'archive'),
  'product-publication-rollback-archive-1'
);

do $$
declare
  archive_result jsonb := (select result from product_publication_results where key = 'archive');
  rollback_result jsonb := (select result from product_publication_results where key = 'rollback-archive');
  repeated jsonb;
begin
  if archive_result ->> 'state' <> 'archived'
     or rollback_result ->> 'state' <> 'published'
     or (select publication_status from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') <> 'published' then
    raise exception 'archive rollback did not restore published state';
  end if;
  select cloud_api.rollback_product_publication_v1(
    (archive_result ->> 'publicationBatchId')::uuid,
    'product-publication-rollback-archive-1'
  ) into repeated;
  if not (repeated ->> 'idempotent')::boolean
     or repeated ->> 'publicationBatchId' <> rollback_result ->> 'publicationBatchId' then
    raise exception 'archive rollback retry is not idempotent: %', repeated;
  end if;
end
$$;

insert into product_publication_results (key, result)
select 'rollback-publish', cloud_api.rollback_product_publication_v1(
  (select (result ->> 'publicationBatchId')::uuid
   from product_publication_results where key = 'publish'),
  'product-publication-rollback-publish-1'
);

do $$
declare
  rollback_result jsonb := (select result from product_publication_results where key = 'rollback-publish');
  repeated jsonb;
begin
  if rollback_result ->> 'state' <> 'approved'
     or (select publication_status from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') <> 'approved'
     or (select published_at from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') is not null
     or (select active_product_publication_batch_id from cloud.products
         where id = '40000000-0000-4000-8000-000000000050') is not null then
    raise exception 'publication rollback did not restore exact approved state';
  end if;
  select cloud_api.rollback_product_publication_v1(
    (select (result ->> 'publicationBatchId')::uuid
     from product_publication_results where key = 'publish'),
    'product-publication-rollback-publish-1'
  ) into repeated;
  if not (repeated ->> 'idempotent')::boolean
     or repeated ->> 'publicationBatchId' <> rollback_result ->> 'publicationBatchId' then
    raise exception 'publication rollback retry is not idempotent: %', repeated;
  end if;
end
$$;

-- A product with missing identity/dependencies cannot even enter the publication review.
do $$
begin
  begin
    perform cloud_api.create_product_publication_revision_v1(
      '40000000-0000-4000-8000-000000000051',
      'product-publication-incomplete-revision'
    );
    raise exception 'incomplete product unexpectedly entered publication review';
  exception when check_violation then
    null;
  end;
  if exists (
    select 1 from cloud.product_publication_revisions
    where product_id = '40000000-0000-4000-8000-000000000051'
  ) or (select publication_status from cloud.products
        where id = '40000000-0000-4000-8000-000000000051') <> 'draft' then
    raise exception 'failed review entry left partial state';
  end if;
end
$$;

insert into product_publication_results (key, result)
select 'partial-revision', cloud_api.create_product_publication_revision_v1(
  '40000000-0000-4000-8000-000000000052',
  'product-publication-partial-revision'
);

-- Publication without approval fails closed and creates no batch.
do $$
begin
  begin
    perform cloud_api.publish_product_v1(
      (select (result ->> 'candidateRevisionId')::uuid
       from product_publication_results where key = 'partial-revision'),
      'product-publication-unapproved'
    );
    raise exception 'unapproved product unexpectedly published';
  exception when object_not_in_prerequisite_state then
    null;
  end;
  if exists (
    select 1 from cloud.product_publication_batches
    where idempotency_key = 'product-publication-unapproved'
  ) or (select publication_status from cloud.products
        where id = '40000000-0000-4000-8000-000000000052') <> 'in_review' then
    raise exception 'unapproved publication left partial state';
  end if;
end
$$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000002","app_metadata":{"app_role":"reviewer"}}',
  true
);
insert into product_publication_results (key, result)
select 'partial-review-decision', cloud_api.record_product_publication_review_decision_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'partial-revision'),
  'Local atomicity revision approval.'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);
insert into product_publication_results (key, result)
select 'partial-approval', cloud_api.approve_product_publication_revision_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'partial-revision'),
  (select (result ->> 'reviewDecisionId')::uuid
   from product_publication_results where key = 'partial-review-decision')
);

-- A new revision supersedes the previous approval and resets the review item.
insert into product_publication_results (key, result)
select 'partial-revision-current', cloud_api.create_product_publication_revision_v1(
  '40000000-0000-4000-8000-000000000052',
  'product-publication-partial-revision-current'
);
do $$
begin
  if (select publication_status from cloud.products
      where id = '40000000-0000-4000-8000-000000000052') <> 'in_review'
     or (select status from cloud.review_items
         where import_product_id = '40000000-0000-4000-8000-000000000062') <> 'in_review'
     or (select current_product_publication_approval_id from cloud.products
         where id = '40000000-0000-4000-8000-000000000052') is not null then
    raise exception 'new revision did not supersede approval and reset review lifecycle';
  end if;
end
$$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000002","app_metadata":{"app_role":"reviewer"}}',
  true
);
insert into product_publication_results (key, result)
select 'partial-review-decision-current', cloud_api.record_product_publication_review_decision_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'partial-revision-current'),
  'Local reviewer approved the current atomicity revision.'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);
insert into product_publication_results (key, result)
select 'partial-approval-current', cloud_api.approve_product_publication_revision_v1(
  (select (result ->> 'candidateRevisionId')::uuid
   from product_publication_results where key = 'partial-revision-current'),
  (select (result ->> 'reviewDecisionId')::uuid
   from product_publication_results where key = 'partial-review-decision-current')
);

-- An older approved revision cannot be replayed after a newer approval exists.
do $$
begin
  begin
    perform cloud_api.publish_product_v1(
      (select (result ->> 'candidateRevisionId')::uuid
       from product_publication_results where key = 'partial-revision'),
      'product-publication-stale-revision-replay'
    );
    raise exception 'stale approved revision unexpectedly published';
  exception when object_not_in_prerequisite_state then
    null;
  end;
  if exists (
    select 1 from cloud.product_publication_batches
    where idempotency_key = 'product-publication-stale-revision-replay'
  ) then
    raise exception 'stale revision replay left a publication batch';
  end if;
end
$$;

-- A dependency changed after approval invalidates the immutable revision.
update cloud.categories set publication_status = 'archived'
where id = '40000000-0000-4000-8000-000000000021';
do $$
begin
  begin
    perform cloud_api.publish_product_v1(
      (select (result ->> 'candidateRevisionId')::uuid
       from product_publication_results where key = 'partial-revision-current'),
      'product-publication-stale-dependency'
    );
    raise exception 'product with unpublished dependency unexpectedly published';
  exception when check_violation then
    null;
  end;
  if exists (
    select 1 from cloud.product_publication_batches
    where idempotency_key = 'product-publication-stale-dependency'
  ) then
    raise exception 'dependency failure left a publication batch';
  end if;
end
$$;
update cloud.categories set publication_status = 'published'
where id = '40000000-0000-4000-8000-000000000021';

-- Force a failure after batch/product/event mutations. PostgreSQL must roll the
-- complete RPC statement back, proving that publication is atomic.
create function pg_temp.reject_product_publication_audit()
returns trigger language plpgsql as $$
begin
  if new.source = 'cloud_api.publish_product_v1' then
    raise exception 'synthetic audit failure' using errcode = 'P0001';
  end if;
  return new;
end
$$;
create trigger product_publication_synthetic_audit_failure
before insert on cloud.audit_log
for each row execute function pg_temp.reject_product_publication_audit();

do $$
begin
  begin
    perform cloud_api.publish_product_v1(
      (select (result ->> 'candidateRevisionId')::uuid
       from product_publication_results where key = 'partial-revision-current'),
      'product-publication-partial-failure'
    );
    raise exception 'synthetic partial failure did not fire';
  exception when raise_exception then
    null;
  end;
  if exists (
    select 1 from cloud.product_publication_batches
    where idempotency_key = 'product-publication-partial-failure'
  ) or (select publication_status from cloud.products
        where id = '40000000-0000-4000-8000-000000000052') <> 'approved' then
    raise exception 'failed publication was not rolled back atomically';
  end if;
end
$$;
drop trigger product_publication_synthetic_audit_failure on cloud.audit_log;

-- Direct state bypass and post-approval content mutation are both rejected.
do $$
begin
  begin
    update cloud.products
    set publication_status = 'published', published_at = now()
    where id = '40000000-0000-4000-8000-000000000052';
    raise exception 'direct publication bypass unexpectedly succeeded';
  exception when check_violation or object_not_in_prerequisite_state then
    null;
  end;
  begin
    update cloud.products set title = 'Unauthorized mutation'
    where id = '40000000-0000-4000-8000-000000000052';
    raise exception 'approved Product content unexpectedly mutated';
  exception when object_not_in_prerequisite_state then
    null;
  end;
end
$$;

do $$
begin
  if has_function_privilege(
    'anon', 'cloud_api.publish_product_v1(uuid,text)', 'EXECUTE'
  ) or has_function_privilege(
    'authenticated', 'cloud_api.publish_product_v1(uuid,text)', 'EXECUTE'
  ) or not has_function_privilege(
    'service_role', 'cloud_api.publish_product_v1(uuid,text)', 'EXECUTE'
  ) or has_function_privilege(
    'service_role', 'cloud_api.record_product_publication_review_decision_v1(uuid,text)', 'EXECUTE'
  ) or not has_function_privilege(
    'authenticated', 'cloud_api.record_product_publication_review_decision_v1(uuid,text)', 'EXECUTE'
  ) or has_function_privilege(
    'service_role', 'cloud.approve_product_publication_revision_v1(uuid,uuid,text)', 'EXECUTE'
  ) or to_regprocedure('cloud_api.create_product_publication_revision_v1(uuid,text,uuid)') is not null
     or to_regprocedure('cloud_api.approve_product_publication_revision_v1(uuid,uuid,text)') is not null
     or to_regprocedure('cloud_api.publish_product_v1(uuid,text,uuid)') is not null
     or to_regprocedure('cloud_api.archive_product_v1(uuid,text,uuid)') is not null
     or to_regprocedure('cloud_api.rollback_product_publication_v1(uuid,text,uuid)') is not null
  then
    raise exception 'product publication RPC grants are unsafe';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'cloud' and tablename = 'products'
      and policyname = 'products_public_read'
      and qual like '%publication_status%published%'
  ) then
    raise exception 'public Product RLS is not fail-closed';
  end if;
  if (select count(*) from cloud.product_publication_revisions) <> 3
     or (select count(*) from cloud.product_publication_approvals) <> 3
     or (select count(*) from cloud.product_publication_batches
         where product_id = '40000000-0000-4000-8000-000000000050') <> 4
     or (select count(*) from cloud.publication_events
         where product_id = '40000000-0000-4000-8000-000000000050') <> 4
     or not exists (
       select 1 from cloud.audit_log
       where entity_type = 'product_publication_batch' and action = 'publish'
     )
     or not exists (
       select 1 from cloud.audit_log
       where entity_type = 'product_publication_batch' and action = 'restore'
     ) then
    raise exception 'publication audit/history invariants failed';
  end if;
end
$$;

rollback;
