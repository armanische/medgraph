\set ON_ERROR_STOP on
\pset tuples_only on

begin;

insert into cloud.user_profiles (id, role, display_name) values
  ('a4000000-0000-4000-8000-000000000001', 'service', 'Candidate payload service'),
  ('a4000000-0000-4000-8000-000000000002', 'reviewer', 'Candidate payload reviewer');

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, description,
  confidence, publication_status
) values (
  'a4000000-0000-4000-8000-000000000010',
  'manufacturer-candidate-payload', 'candidate-payload-manufacturer',
  'Candidate Payload Manufacturer', 'Candidate Payload Manufacturer',
  'Disposable candidate payload fixture.', 'verified', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description,
  level, assignable, confidence, publication_status
) values (
  'a4000000-0000-4000-8000-000000000020',
  'category-candidate-payload', 'candidate-payload-category',
  'Candidate Payload Category', 'Candidate Payload Category',
  'Disposable candidate payload fixture.', 'leaf', true, 'verified', 'published'
);

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description,
  confidence, publication_status
) values (
  'a4000000-0000-4000-8000-000000000030',
  'application-area-candidate-payload', 'candidate-payload-area',
  'Candidate Payload Area', 'Candidate Payload Area',
  'Disposable candidate payload fixture.', 'verified', 'published'
);

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  'a4000000-0000-4000-8000-000000000040',
  'candidate-payload-completeness-test', 'candidate-payload-completeness-v1',
  'test', 'completed', '2026-07-29T00:00:00Z', '2026-07-29T00:00:01Z',
  '{}'::jsonb
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
) values (
  'a4000000-0000-4000-8000-000000000041',
  'a4000000-0000-4000-8000-000000000040',
  'candidate-payload-source', 'integration_test',
  'local://candidate-payload-source',
  '{"rawSnapshot":"internal-raw-marker"}'::jsonb,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
);

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, seo_title, seo_description, source_type, source_url,
  confidence, publication_status, source_uid, source_checksum, snapshot_version,
  created_from_snapshot_at, import_batch_key, missing_manufacturer,
  missing_category, missing_model, missing_application_area,
  catalog_quality_status, catalog_quality_reason
) values
  (
    'a4000000-0000-4000-8000-000000000050',
    'candidate-payload-product', 'Candidate Payload Product', 'CPP-1',
    'a4000000-0000-4000-8000-000000000010',
    'a4000000-0000-4000-8000-000000000020',
    'Canonical Russian summary.', 'Canonical Russian description.',
    'Canonical SEO Title', 'Canonical SEO Description',
    'integration_test', 'https://example.invalid/products/candidate-payload',
    'verified', 'draft', 'candidate-payload-source',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'candidate-payload-test-v1', '2026-07-29T00:00:00Z',
    'candidate-payload-completeness-test', false, false, false, false,
    'READY', '{}'
  ),
  (
    'a4000000-0000-4000-8000-000000000051',
    'candidate-payload-product-mirror', 'Candidate Payload Product Mirror', 'CPP-2',
    'a4000000-0000-4000-8000-000000000010',
    'a4000000-0000-4000-8000-000000000020',
    'Canonical Russian summary.', 'Canonical Russian description.',
    'Canonical SEO Title', 'Canonical SEO Description',
    'integration_test', 'https://example.invalid/products/candidate-payload-mirror',
    'verified', 'draft', 'candidate-payload-source-mirror',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'candidate-payload-test-v1', '2026-07-29T00:00:00Z',
    'candidate-payload-completeness-mirror-test',
    false, false, false, false, 'READY', '{}'
  );

insert into cloud.product_descriptions (
  id, product_id, locale, short_description, full_description, confidence
) values
  (
    'a4000000-0000-4000-8000-000000000060',
    'a4000000-0000-4000-8000-000000000050', 'ru',
    'Canonical Russian summary.', 'Canonical Russian description.', 'verified'
  ),
  (
    'a4000000-0000-4000-8000-000000000061',
    'a4000000-0000-4000-8000-000000000050', 'en',
    'Non-canonical SEO Title', 'Non-canonical description.', 'legacy'
  ),
  (
    'a4000000-0000-4000-8000-000000000062',
    'a4000000-0000-4000-8000-000000000051', 'ru',
    'Canonical Russian summary.', 'Canonical Russian description.', 'verified'
  );

insert into cloud.product_application_areas (product_id, application_area_id) values
  ('a4000000-0000-4000-8000-000000000050', 'a4000000-0000-4000-8000-000000000030');

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
) values (
  'a4000000-0000-4000-8000-000000000070',
  'a4000000-0000-4000-8000-000000000040',
  'a4000000-0000-4000-8000-000000000041',
  'candidate-payload-source', 'candidate-payload-product', 'imported',
  'source_exact', 'exact', 'exact', 'needs_review',
  'a4000000-0000-4000-8000-000000000050'
);

-- Insert in reverse presentation order. UUID values intentionally do not sort
-- with stable keys, proving that serialization is not physical/UUID ordered.
insert into cloud.product_characteristics (
  id, product_id, key, display_name, raw_value, normalized_value, unit,
  sort_order, confidence, source_reference, reviewer_status
) values
  (
    'a4000000-0000-4000-8000-000000000083',
    'a4000000-0000-4000-8000-000000000050', 'char-c', 'Characteristic C',
    '30', '30', 'mm', 30, 'verified', 'internal-source-c', 'pending'
  ),
  (
    'a4000000-0000-4000-8000-000000000081',
    'a4000000-0000-4000-8000-000000000050', 'char-a', 'Characteristic A',
    '10', '10', 'mm', 10, 'verified', 'internal-source-a', 'pending'
  ),
  (
    'a4000000-0000-4000-8000-000000000082',
    'a4000000-0000-4000-8000-000000000050', 'char-b', 'Characteristic B',
    '20', '20', null, 20, 'verified', 'internal-source-b', 'pending'
  ),
  (
    'a4000000-0000-4000-8000-000000000084',
    'a4000000-0000-4000-8000-000000000050', 'char-archived', 'Archived Characteristic',
    'hidden', 'hidden', null, 5, 'legacy', 'internal-source-hidden', 'pending'
  );

update cloud.product_characteristics
set archived_at = '2026-07-29T00:00:00Z'
where id = 'a4000000-0000-4000-8000-000000000084';

insert into cloud.product_characteristics (
  id, product_id, key, display_name, raw_value, normalized_value, unit,
  sort_order, confidence, source_reference, reviewer_status
) values
  (
    'a4000000-0000-4000-8000-000000000093',
    'a4000000-0000-4000-8000-000000000051', 'char-c', 'Characteristic C',
    '30', '30', 'mm', 30, 'verified', 'different-source-c', 'pending'
  ),
  (
    'a4000000-0000-4000-8000-000000000092',
    'a4000000-0000-4000-8000-000000000051', 'char-b', 'Characteristic B',
    '20', '20', null, 20, 'verified', 'different-source-b', 'pending'
  ),
  (
    'a4000000-0000-4000-8000-000000000091',
    'a4000000-0000-4000-8000-000000000051', 'char-a', 'Characteristic A',
    '10', '10', 'mm', 10, 'verified', 'different-source-a', 'pending'
  );

insert into cloud.product_media (
  id, product_id, source_url, role, media_format, sort_order, import_batch_key
) values
  ('a4000000-0000-4000-8000-000000000101', 'a4000000-0000-4000-8000-000000000050', 'https://example.invalid/media/1.jpg', 'primary', 'jpg', 0, 'candidate-payload-completeness-test'),
  ('a4000000-0000-4000-8000-000000000102', 'a4000000-0000-4000-8000-000000000050', 'https://example.invalid/media/2.jpg', 'gallery', 'jpg', 10, 'candidate-payload-completeness-test'),
  ('a4000000-0000-4000-8000-000000000103', 'a4000000-0000-4000-8000-000000000050', 'https://example.invalid/media/3.jpg', 'gallery', 'jpg', 20, 'candidate-payload-completeness-test');

create temporary table candidate_payload_baseline on commit drop as
select
  cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050') payload,
  cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050')) checksum;

do $$
declare
  baseline candidate_payload_baseline%rowtype;
  current_payload jsonb;
  current_checksum text;
  loop_index integer;
begin
  select * into baseline from candidate_payload_baseline;

  if baseline.payload #>> '{product,seoTitle}' <> 'Canonical SEO Title'
     or baseline.payload #>> '{product,seoDescription}' <> 'Canonical SEO Description'
     or baseline.payload #>> '{product,seoTitle}' = 'Non-canonical SEO Title'
     or jsonb_array_length(baseline.payload -> 'characteristics') <> 3
     or jsonb_array_length(baseline.payload -> 'media') <> 3
     or jsonb_array_length(baseline.payload -> 'descriptions') <> 2
     or (select array_agg(item ->> 'key' order by ordinality)
         from jsonb_array_elements(baseline.payload -> 'characteristics')
           with ordinality as characteristic(item, ordinality))
       <> array['legacy:char-a', 'legacy:char-b', 'legacy:char-c'] then
    raise exception 'candidate payload does not include canonical SEO and ordered active characteristics';
  end if;
  if baseline.payload -> 'characteristics' @? '$[*].id'
     or baseline.payload -> 'characteristics' @? '$[*].sourceReference'
     or baseline.payload -> 'characteristics' @? '$[*].updatedAt'
     or baseline.payload::text like '%internal-raw-marker%'
     or baseline.payload::text like '%internal-source-%' then
    raise exception 'candidate payload leaked UUID, volatile or internal provenance data';
  end if;

  if baseline.payload -> 'characteristics' is distinct from
     cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000051') -> 'characteristics' then
    raise exception 'environment-local characteristic UUID/source data changed the canonical characteristic payload';
  end if;

  for loop_index in 1..100 loop
    current_payload := cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050');
    current_checksum := cloud.sha256_jsonb_v1(current_payload);
    if current_payload is distinct from baseline.payload or current_checksum <> baseline.checksum then
      raise exception 'candidate payload/checksum is not deterministic on read %', loop_index;
    end if;
  end loop;

  perform set_config('enable_seqscan', 'off', true);
  current_payload := cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050');
  perform set_config('enable_seqscan', 'on', true);
  if current_payload is distinct from baseline.payload then
    raise exception 'query plan changed candidate characteristic order';
  end if;
end
$$;

-- Canonical SEO participates in checksum and restoring it restores the hash.
update cloud.products set seo_title = 'Changed SEO Title'
where id = 'a4000000-0000-4000-8000-000000000050';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'SEO title change did not invalidate candidate checksum';
  end if;
end $$;
update cloud.products set seo_title = 'Canonical SEO Title'
where id = 'a4000000-0000-4000-8000-000000000050';

update cloud.products set seo_description = 'Changed SEO Description'
where id = 'a4000000-0000-4000-8000-000000000050';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'SEO description change did not invalidate candidate checksum';
  end if;
end $$;
update cloud.products set seo_description = 'Canonical SEO Description'
where id = 'a4000000-0000-4000-8000-000000000050';

do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       <> (select checksum from candidate_payload_baseline) then
    raise exception 'restoring SEO did not restore candidate checksum';
  end if;
end $$;

-- Every publishable characteristic field participates in the checksum.
update cloud.product_characteristics set normalized_value = 'changed'
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'characteristic value change did not invalidate candidate checksum';
  end if;
end $$;
update cloud.product_characteristics set normalized_value = '10'
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';

update cloud.product_characteristics set unit = 'cm'
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'characteristic unit change did not invalidate candidate checksum';
  end if;
end $$;
update cloud.product_characteristics set unit = 'mm'
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';

update cloud.product_characteristics set sort_order = 40
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'characteristic order change did not invalidate candidate checksum';
  end if;
end $$;
update cloud.product_characteristics set sort_order = 10
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';

delete from cloud.product_characteristics
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-b';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'characteristic removal did not invalidate candidate checksum';
  end if;
end $$;
insert into cloud.product_characteristics (
  id, product_id, key, display_name, raw_value, normalized_value, unit,
  sort_order, confidence, source_reference, reviewer_status
) values (
  'a4000000-0000-4000-8000-000000000085',
  'a4000000-0000-4000-8000-000000000050', 'char-b', 'Characteristic B',
  '20', '20', null, 20, 'verified', 'replacement-internal-source-b', 'pending'
);
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       <> (select checksum from candidate_payload_baseline) then
    raise exception 'restoring characteristic with a different UUID/source did not restore checksum';
  end if;
end $$;

insert into cloud.product_characteristics (
  id, product_id, key, display_name, raw_value, normalized_value, unit,
  sort_order, confidence, source_reference, reviewer_status
) values (
  'a4000000-0000-4000-8000-000000000086',
  'a4000000-0000-4000-8000-000000000050', 'char-d', 'Characteristic D',
  '40', '40', null, 40, 'verified', 'internal-source-d', 'pending'
);
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       = (select checksum from candidate_payload_baseline) then
    raise exception 'characteristic addition did not invalidate candidate checksum';
  end if;
end $$;
delete from cloud.product_characteristics
where id = 'a4000000-0000-4000-8000-000000000086';

-- Non-publishable metadata and archived rows cannot affect the checksum.
update cloud.product_characteristics set source_reference = 'changed-internal-source'
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';
update cloud.product_characteristics set normalized_value = 'changed-hidden-value'
where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-archived';
update cloud.products set updated_at = updated_at + interval '1 second'
where id = 'a4000000-0000-4000-8000-000000000050';
do $$ begin
  if cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1('a4000000-0000-4000-8000-000000000050'))
       <> (select checksum from candidate_payload_baseline) then
    raise exception 'non-publishable metadata changed candidate checksum';
  end if;
end $$;

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role","app_metadata":{"app_role":"service"}}', true);

create temporary table candidate_payload_revision on commit drop as
select cloud_api.create_product_publication_revision_v1(
  'a4000000-0000-4000-8000-000000000050',
  'candidate-payload-completeness-revision-v1'
) result;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"a4000000-0000-4000-8000-000000000002","app_metadata":{"app_role":"reviewer"}}',
  true
);

create temporary table candidate_payload_review_decision on commit drop as
select cloud_api.record_product_publication_review_decision_v1(
  (select id from cloud.product_publication_revisions
   where product_id = 'a4000000-0000-4000-8000-000000000050'),
  'Candidate payload completeness local regression.'
) result;

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);

-- SEO and characteristic mutations invalidate the exact immutable revision at
-- the approval boundary. The immutable Human Review decision itself remains
-- evidence of what was reviewed.
do $$
begin
  begin
    update cloud.products set seo_title = 'Stale SEO Title'
    where id = 'a4000000-0000-4000-8000-000000000050';
    perform cloud_api.approve_product_publication_revision_v1(
      (select id from cloud.product_publication_revisions where product_id = 'a4000000-0000-4000-8000-000000000050'),
      (select (result ->> 'reviewDecisionId')::uuid from candidate_payload_review_decision)
    );
    raise exception 'SEO mutation did not make revision stale at approval';
  exception when sqlstate '55000' then
    null;
  end;

  begin
    update cloud.product_characteristics set normalized_value = 'stale-value'
    where product_id = 'a4000000-0000-4000-8000-000000000050' and key = 'char-a';
    perform cloud_api.approve_product_publication_revision_v1(
      (select id from cloud.product_publication_revisions where product_id = 'a4000000-0000-4000-8000-000000000050'),
      (select (result ->> 'reviewDecisionId')::uuid from candidate_payload_review_decision)
    );
    raise exception 'characteristic mutation did not make revision stale at approval';
  exception when sqlstate '55000' then
    null;
  end;
end
$$;

do $$
declare
  revision cloud.product_publication_revisions%rowtype;
begin
  select * into revision from cloud.product_publication_revisions
  where product_id = 'a4000000-0000-4000-8000-000000000050';

  if revision.candidate_payload is distinct from
       cloud.product_publication_candidate_payload_v1(revision.product_id)
     or revision.candidate_payload_checksum <> cloud.sha256_jsonb_v1(revision.candidate_payload)
     or jsonb_array_length(revision.candidate_payload -> 'characteristics') <> 3
     or (select count(*) from cloud.review_decisions) <> 1
     or (select count(*) from cloud.product_publication_approvals) <> 0
     or (select count(*) from cloud.product_publication_batches) <> 0
     or (select count(*) from cloud.products where publication_status = 'published') <> 0 then
    raise exception 'revision invalidation fixture left inconsistent evidence or publication state';
  end if;

  if has_function_privilege('anon', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute')
     or has_function_privilege('authenticated', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute')
     or has_function_privilege('service_role', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute')
     or exists (
       select 1
       from information_schema.routine_privileges privilege
       where privilege.specific_schema = 'cloud'
         and privilege.routine_name = 'product_publication_candidate_payload_v1'
         and privilege.grantee = 'PUBLIC'
         and privilege.privilege_type = 'EXECUTE'
     )
     or has_function_privilege('anon', 'cloud_api.create_product_publication_revision_v1(uuid,text)', 'execute')
     or has_function_privilege('authenticated', 'cloud_api.create_product_publication_revision_v1(uuid,text)', 'execute')
     or not has_function_privilege('service_role', 'cloud_api.create_product_publication_revision_v1(uuid,text)', 'execute') then
    raise exception 'candidate payload corrective changed the approved ACL boundary';
  end if;
end
$$;

select jsonb_pretty(jsonb_build_object(
  'status', 'PASS',
  'candidateChecksum', (select checksum from candidate_payload_baseline),
  'characteristics', jsonb_array_length((select payload -> 'characteristics' from candidate_payload_baseline)),
  'media', jsonb_array_length((select payload -> 'media' from candidate_payload_baseline)),
  'deterministicReads', 100,
  'seoInvalidation', true,
  'characteristicInvalidation', true,
  'uuidIndependentOrdering', true,
  'revisionStaleChecks', true,
  'remoteConnections', 0,
  'functionOwner', (
    select pg_get_userbyid(proc.proowner)
    from pg_proc proc
    where proc.oid = 'cloud.product_publication_candidate_payload_v1(uuid)'::regprocedure
  ),
  'securityDefiner', (
    select proc.prosecdef
    from pg_proc proc
    where proc.oid = 'cloud.product_publication_candidate_payload_v1(uuid)'::regprocedure
  ),
  'volatility', (
    select proc.provolatile
    from pg_proc proc
    where proc.oid = 'cloud.product_publication_candidate_payload_v1(uuid)'::regprocedure
  ),
  'functionSettings', (
    select to_jsonb(proc.proconfig)
    from pg_proc proc
    where proc.oid = 'cloud.product_publication_candidate_payload_v1(uuid)'::regprocedure
  ),
  'directRuntimeExecute', jsonb_build_object(
    'anon', has_function_privilege(
      'anon', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
    ),
    'authenticated', has_function_privilege(
      'authenticated', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
    ),
    'serviceRole', has_function_privilege(
      'service_role', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
    )
  )
));

rollback;
