\set ON_ERROR_STOP on

begin;

insert into cloud.user_profiles (id, role, display_name) values
  ('50000000-0000-4000-8000-000000000001', 'service', 'Concurrent publication service'),
  ('50000000-0000-4000-8000-000000000002', 'reviewer', 'Concurrent publication reviewer');

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, description, confidence,
  publication_status
) values (
  '50000000-0000-4000-8000-000000000010',
  'manufacturer-publication-concurrent', 'publication-concurrent-manufacturer',
  'Publication Concurrent Manufacturer', 'Publication Concurrent Manufacturer',
  'Disposable concurrency fixture.', 'reviewed', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values (
  '50000000-0000-4000-8000-000000000020',
  'category-publication-concurrent', 'publication-concurrent-category',
  'Publication Concurrent Category', 'Publication Concurrent Category',
  'Disposable concurrency fixture.', 'leaf', true, 'reviewed', 'published'
);

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description, confidence,
  publication_status
) values (
  '50000000-0000-4000-8000-000000000030',
  'application-area-publication-concurrent', 'publication-concurrent-area',
  'Publication Concurrent Area', 'Publication Concurrent Area',
  'Disposable concurrency fixture.', 'reviewed', 'published'
);

insert into cloud.import_runs (
  id, run_key, pipeline_version, environment, status, started_at, completed_at,
  source_manifest
) values (
  '50000000-0000-4000-8000-000000000040',
  'product-publication-concurrent-test', 'product-publication-test-v1', 'test',
  'completed', now(), now(), '{}'::jsonb
);

insert into cloud.import_sources (
  id, import_run_id, source_id, source_type, source_location, snapshot,
  checksum_sha256
) values (
  '50000000-0000-4000-8000-000000000041',
  '50000000-0000-4000-8000-000000000040',
  'product-publication-concurrent-source', 'integration_test',
  'local://product-publication-concurrent', '{}'::jsonb,
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
);

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  source_uid, source_checksum, snapshot_version, created_from_snapshot_at,
  import_batch_key, missing_manufacturer, missing_category, missing_model,
  missing_application_area, catalog_quality_status, catalog_quality_reason
) values (
  '50000000-0000-4000-8000-000000000050',
  'product-publication-concurrent', 'Product Publication Concurrent', 'PP-C',
  '50000000-0000-4000-8000-000000000010',
  '50000000-0000-4000-8000-000000000020',
  'Disposable concurrency fixture.', 'Disposable concurrency fixture.',
  'integration_test', 'https://example.invalid/products/pp-c', 'reviewed', 'draft',
  'product-publication-concurrent-source',
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  'publication-test-v1', now(), 'product-publication-concurrent-test',
  false, false, false, false, 'READY', '{}'
);

insert into cloud.product_application_areas (product_id, application_area_id)
values (
  '50000000-0000-4000-8000-000000000050',
  '50000000-0000-4000-8000-000000000030'
);

insert into cloud.import_products (
  id, import_run_id, import_source_id, source_id, legacy_slug, status,
  identity_status, manufacturer_status, category_status, readiness_status,
  existing_product_id
) values (
  '50000000-0000-4000-8000-000000000060',
  '50000000-0000-4000-8000-000000000040',
  '50000000-0000-4000-8000-000000000041',
  'product-publication-concurrent-source', 'product-publication-concurrent',
  'imported', 'source_exact', 'exact', 'exact', 'needs_review',
  '50000000-0000-4000-8000-000000000050'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}', true
);
select cloud_api.create_product_publication_revision_v1(
  '50000000-0000-4000-8000-000000000050',
  'product-publication-concurrent-revision'
);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"50000000-0000-4000-8000-000000000002","app_metadata":{"app_role":"reviewer"}}',
  true
);
select cloud_api.record_product_publication_review_decision_v1(
  (select id from cloud.product_publication_revisions
   where idempotency_key = 'product-publication-concurrent-revision'),
  'Concurrent approval of the exact immutable revision.'
);

create function cloud.product_publication_concurrent_approval_delay_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, cloud
as $$
begin
  if new.candidate_revision_id = (
    select id from cloud.product_publication_revisions
    where idempotency_key = 'product-publication-concurrent-revision'
  ) then
    perform pg_sleep(0.75);
  end if;
  return new;
end
$$;

create trigger product_publication_concurrent_approval_delay
  before insert on cloud.product_publication_approvals
  for each row execute function cloud.product_publication_concurrent_approval_delay_v1();

commit;
