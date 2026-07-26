-- Published Catalog Projection corrective v2.
-- Adds a transactional monotonic public-projection clock and proves Product
-- ownership for public document storage dependencies.

begin;

alter function cloud.cloud_published_storefront_catalog_v1()
  rename to cloud_published_storefront_catalog_source_v2;

comment on function cloud.cloud_published_storefront_catalog_source_v2() is
  'Corrective-v1 projection source retained for public payload construction and compatibility clock bootstrap.';

create table cloud.published_catalog_projection_state (
  singleton boolean primary key default true check (singleton),
  version bigint not null default 0 check (version >= 0),
  changed_at timestamptz not null default '1970-01-01 00:00:00+00',
  initialized boolean not null default false,
  payload_checksum text,
  constraint published_catalog_projection_state_checksum check (
    payload_checksum is null or payload_checksum ~ '^[0-9a-f]{64}$'
  )
);

insert into cloud.published_catalog_projection_state (
  singleton, version, changed_at, initialized, payload_checksum
) values (true, 0, '1970-01-01 00:00:00+00', false, null);

alter table cloud.published_catalog_projection_state enable row level security;
revoke all on table cloud.published_catalog_projection_state
  from public, anon, authenticated, service_role;

create or replace function cloud.cloud_published_storefront_catalog_v1()
returns jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  source_payload jsonb;
  owned_products jsonb;
  projection_clock timestamptz;
begin
  if auth.role() <> 'service_role' then
    raise exception 'published Storefront projection requires service role'
      using errcode = '42501';
  end if;

  source_payload := cloud.cloud_published_storefront_catalog_source_v2();

  select coalesce(jsonb_agg(
    jsonb_set(
      product_item.value,
      '{documents}',
      coalesce(owned_documents.value, '[]'::jsonb),
      false
    )
    order by product_item.value ->> 'slug'
  ), '[]'::jsonb)
  into owned_products
  from jsonb_array_elements(source_payload -> 'products') product_item(value)
  join cloud.products product
    on product.slug = product_item.value ->> 'slug'
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'title', cloud.public_json_text_v1(document_item.item -> 'title'),
        'kind', cloud.public_json_text_v1(document_item.item -> 'documentType'),
        'publicUrl', storage.source_url,
        'language', cloud.public_json_text_v1(document_item.item -> 'language'),
        'isOfficial', cloud.public_json_boolean_v1(document_item.item -> 'isOfficial')
      ) order by
        cloud.public_json_text_v1(document_item.item -> 'title'),
        cloud.public_json_text_v1(document_item.item -> 'storageObjectId')
    ) as value
    from cloud.product_publication_revisions revision
    cross join lateral jsonb_array_elements(case
      when jsonb_typeof(revision.candidate_payload -> 'documents') = 'array'
        then revision.candidate_payload -> 'documents'
      else '[]'::jsonb
    end) document_item(item)
    join cloud.storage_objects storage
      on storage.id::text = cloud.public_json_text_v1(
        document_item.item -> 'storageObjectId'
      )
      and storage.access_status = 'public'
      and storage.deleted_at is null
      and storage.rights_status in (
        'manufacturer_official', 'licensed', 'owned', 'public_domain'
      )
      and storage.source_url ~ '^https://'
    join cloud.product_documents ownership
      on ownership.product_id = product.id
      and ownership.storage_object_id = storage.id
      and ownership.publication_status = 'published'
      and ownership.title = cloud.public_json_text_v1(
        document_item.item -> 'title'
      )
      and ownership.document_type = cloud.public_json_text_v1(
        document_item.item -> 'documentType'
      )
      and ownership.language = cloud.public_json_text_v1(
        document_item.item -> 'language'
      )
      and ownership.is_official = cloud.public_json_boolean_v1(
        document_item.item -> 'isOfficial'
      )
    where revision.id = product.current_product_publication_revision_id
      and revision.product_id = product.id
      and jsonb_typeof(document_item.item) = 'object'
      and cloud.public_json_text_v1(
        document_item.item -> 'publicationStatus'
      ) = 'published'
      and nullif(btrim(cloud.public_json_text_v1(
        document_item.item -> 'title'
      )), '') is not null
      and nullif(btrim(cloud.public_json_text_v1(
        document_item.item -> 'language'
      )), '') is not null
      and cloud.public_json_text_v1(
        document_item.item -> 'documentType'
      ) in (
        'brochure', 'datasheet', 'technical_specification', 'ifu',
        'operator_manual', 'quick_guide', 'software',
        'clinical_information', 'accessories', 'compatibility',
        'service_documentation', 'registration', 'certificate', 'other'
      )
      and cloud.public_json_boolean_v1(
        document_item.item -> 'isOfficial'
      ) is not null
  ) owned_documents on true;

  source_payload := jsonb_set(
    source_payload,
    '{products}',
    owned_products,
    false
  );

  select case
    when state.initialized then state.changed_at
    else (source_payload ->> 'generatedAt')::timestamptz
  end
  into projection_clock
  from cloud.published_catalog_projection_state state
  where state.singleton;

  if projection_clock is null then
    raise exception 'published projection clock state is unavailable'
      using errcode = '55000';
  end if;

  return jsonb_set(
    source_payload,
    '{generatedAt}',
    to_jsonb(projection_clock),
    false
  );
end
$$;

create or replace function cloud.capture_published_catalog_projection_v2()
returns jsonb
language plpgsql
security definer
volatile
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  previous_role text := current_setting('request.jwt.claim.role', true);
  public_payload jsonb;
  source_payload jsonb;
begin
  perform set_config('request.jwt.claim.role', 'service_role', true);
  public_payload := cloud.cloud_published_storefront_catalog_v1();
  source_payload := cloud.cloud_published_storefront_catalog_source_v2();
  perform set_config(
    'request.jwt.claim.role',
    coalesce(previous_role, ''),
    true
  );

  return jsonb_build_object(
    'payloadChecksum', cloud.sha256_jsonb_v1(public_payload - 'generatedAt'),
    'publicGeneratedAt', public_payload ->> 'generatedAt',
    'sourceGeneratedAt', source_payload ->> 'generatedAt'
  );
end
$$;

create or replace function cloud.capture_published_catalog_projection_before_v2()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
begin
  perform set_config(
    'cybermedica.published_projection_before_' || tg_relid::text,
    cloud.capture_published_catalog_projection_v2()::text,
    true
  );
  return null;
end
$$;

create or replace function cloud.refresh_published_catalog_projection_after_v2()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  before_snapshot jsonb;
  after_snapshot jsonb;
  state_checksum text;
begin
  before_snapshot := nullif(current_setting(
    'cybermedica.published_projection_before_' || tg_relid::text,
    true
  ), '')::jsonb;
  if before_snapshot is null then
    raise exception 'published projection before-state is unavailable for relation %',
      tg_relid::regclass using errcode = '55000';
  end if;

  -- Serialize public mutations on the singleton before taking the final
  -- snapshot. A waiter consequently observes already-committed concurrent
  -- changes, and an identical concurrent retry cannot advance the clock.
  select state.payload_checksum
  into state_checksum
  from cloud.published_catalog_projection_state state
  where state.singleton
  for update;

  if not found then
    raise exception 'published projection clock state is unavailable'
      using errcode = '55000';
  end if;

  after_snapshot := cloud.capture_published_catalog_projection_v2();

  if before_snapshot ->> 'payloadChecksum'
       is distinct from after_snapshot ->> 'payloadChecksum'
     and state_checksum is distinct from after_snapshot ->> 'payloadChecksum' then
    update cloud.published_catalog_projection_state state
    set version = state.version + 1,
        changed_at = greatest(
          clock_timestamp(),
          state.changed_at + interval '1 microsecond',
          coalesce(
            (before_snapshot ->> 'publicGeneratedAt')::timestamptz,
            '1970-01-01 00:00:00+00'::timestamptz
          ) + interval '1 microsecond',
          coalesce(
            (before_snapshot ->> 'sourceGeneratedAt')::timestamptz,
            '1970-01-01 00:00:00+00'::timestamptz
          ) + interval '1 microsecond',
          coalesce(
            (after_snapshot ->> 'sourceGeneratedAt')::timestamptz,
            '1970-01-01 00:00:00+00'::timestamptz
          )
        ),
        initialized = true,
        payload_checksum = after_snapshot ->> 'payloadChecksum'
    where state.singleton;

    if not found then
      raise exception 'published projection clock state is unavailable'
        using errcode = '55000';
    end if;
  end if;

  perform set_config(
    'cybermedica.published_projection_before_' || tg_relid::text,
    '',
    true
  );
  return null;
end
$$;

create trigger products_projection_before_v2
  before insert or update or delete or truncate on cloud.products
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger products_projection_after_v2
  after insert or update or delete or truncate on cloud.products
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger manufacturers_projection_before_v2
  before insert or update or delete or truncate on cloud.manufacturers
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger manufacturers_projection_after_v2
  after insert or update or delete or truncate on cloud.manufacturers
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger categories_projection_before_v2
  before insert or update or delete or truncate on cloud.categories
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger categories_projection_after_v2
  after insert or update or delete or truncate on cloud.categories
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger application_areas_projection_before_v2
  before insert or update or delete or truncate on cloud.application_areas
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger application_areas_projection_after_v2
  after insert or update or delete or truncate on cloud.application_areas
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_application_areas_projection_before_v2
  before insert or update or delete or truncate on cloud.product_application_areas
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_application_areas_projection_after_v2
  after insert or update or delete or truncate on cloud.product_application_areas
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger storage_objects_projection_before_v2
  before insert or update or delete or truncate on cloud.storage_objects
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger storage_objects_projection_after_v2
  after insert or update or delete or truncate on cloud.storage_objects
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_documents_projection_before_v2
  before insert or update or delete or truncate on cloud.product_documents
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_documents_projection_after_v2
  after insert or update or delete or truncate on cloud.product_documents
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger import_products_projection_before_v2
  before insert or update or delete or truncate on cloud.import_products
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger import_products_projection_after_v2
  after insert or update or delete or truncate on cloud.import_products
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger import_blocking_errors_projection_before_v2
  before insert or update or delete or truncate on cloud.import_blocking_errors
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger import_blocking_errors_projection_after_v2
  after insert or update or delete or truncate on cloud.import_blocking_errors
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_publication_revisions_projection_before_v2
  before insert or update or delete or truncate on cloud.product_publication_revisions
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_publication_revisions_projection_after_v2
  after insert or update or delete or truncate on cloud.product_publication_revisions
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_publication_approvals_projection_before_v2
  before insert or update or delete or truncate on cloud.product_publication_approvals
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_publication_approvals_projection_after_v2
  after insert or update or delete or truncate on cloud.product_publication_approvals
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_publication_batches_projection_before_v2
  before insert or update or delete or truncate on cloud.product_publication_batches
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_publication_batches_projection_after_v2
  after insert or update or delete or truncate on cloud.product_publication_batches
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger review_decisions_projection_before_v2
  before insert or update or delete or truncate on cloud.review_decisions
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger review_decisions_projection_after_v2
  after insert or update or delete or truncate on cloud.review_decisions
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger publication_candidates_projection_before_v2
  before insert or update or delete or truncate on cloud.publication_candidates
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger publication_candidates_projection_after_v2
  after insert or update or delete or truncate on cloud.publication_candidates
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_detail_candidate_revisions_projection_before_v2
  before insert or update or delete or truncate on cloud.product_detail_candidate_revisions
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_detail_candidate_revisions_projection_after_v2
  after insert or update or delete or truncate on cloud.product_detail_candidate_revisions
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_detail_candidate_approvals_projection_before_v2
  before insert or update or delete or truncate on cloud.product_detail_candidate_revision_approvals
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_detail_candidate_approvals_projection_after_v2
  after insert or update or delete or truncate on cloud.product_detail_candidate_revision_approvals
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_detail_batches_projection_before_v2
  before insert or update or delete or truncate on cloud.product_detail_publication_batches
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_detail_batches_projection_after_v2
  after insert or update or delete or truncate on cloud.product_detail_publication_batches
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_key_features_projection_before_v2
  before insert or update or delete or truncate on cloud.product_key_features
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_key_features_projection_after_v2
  after insert or update or delete or truncate on cloud.product_key_features
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

create trigger product_characteristics_projection_before_v2
  before insert or update or delete or truncate on cloud.product_characteristics
  for each statement execute function cloud.capture_published_catalog_projection_before_v2();
create trigger product_characteristics_projection_after_v2
  after insert or update or delete or truncate on cloud.product_characteristics
  for each statement execute function cloud.refresh_published_catalog_projection_after_v2();

-- The projection invariant must also survive controlled local integrity
-- simulations that temporarily use replica mode. Production writers use the
-- normal origin path; ALWAYS prevents a privileged maintenance session from
-- silently bypassing cache invalidation.
alter table cloud.products enable always trigger products_projection_before_v2;
alter table cloud.products enable always trigger products_projection_after_v2;
alter table cloud.manufacturers enable always trigger manufacturers_projection_before_v2;
alter table cloud.manufacturers enable always trigger manufacturers_projection_after_v2;
alter table cloud.categories enable always trigger categories_projection_before_v2;
alter table cloud.categories enable always trigger categories_projection_after_v2;
alter table cloud.application_areas enable always trigger application_areas_projection_before_v2;
alter table cloud.application_areas enable always trigger application_areas_projection_after_v2;
alter table cloud.product_application_areas enable always trigger product_application_areas_projection_before_v2;
alter table cloud.product_application_areas enable always trigger product_application_areas_projection_after_v2;
alter table cloud.storage_objects enable always trigger storage_objects_projection_before_v2;
alter table cloud.storage_objects enable always trigger storage_objects_projection_after_v2;
alter table cloud.product_documents enable always trigger product_documents_projection_before_v2;
alter table cloud.product_documents enable always trigger product_documents_projection_after_v2;
alter table cloud.import_products enable always trigger import_products_projection_before_v2;
alter table cloud.import_products enable always trigger import_products_projection_after_v2;
alter table cloud.import_blocking_errors enable always trigger import_blocking_errors_projection_before_v2;
alter table cloud.import_blocking_errors enable always trigger import_blocking_errors_projection_after_v2;
alter table cloud.product_publication_revisions enable always trigger product_publication_revisions_projection_before_v2;
alter table cloud.product_publication_revisions enable always trigger product_publication_revisions_projection_after_v2;
alter table cloud.product_publication_approvals enable always trigger product_publication_approvals_projection_before_v2;
alter table cloud.product_publication_approvals enable always trigger product_publication_approvals_projection_after_v2;
alter table cloud.product_publication_batches enable always trigger product_publication_batches_projection_before_v2;
alter table cloud.product_publication_batches enable always trigger product_publication_batches_projection_after_v2;
alter table cloud.review_decisions enable always trigger review_decisions_projection_before_v2;
alter table cloud.review_decisions enable always trigger review_decisions_projection_after_v2;
alter table cloud.publication_candidates enable always trigger publication_candidates_projection_before_v2;
alter table cloud.publication_candidates enable always trigger publication_candidates_projection_after_v2;
alter table cloud.product_detail_candidate_revisions enable always trigger product_detail_candidate_revisions_projection_before_v2;
alter table cloud.product_detail_candidate_revisions enable always trigger product_detail_candidate_revisions_projection_after_v2;
alter table cloud.product_detail_candidate_revision_approvals enable always trigger product_detail_candidate_approvals_projection_before_v2;
alter table cloud.product_detail_candidate_revision_approvals enable always trigger product_detail_candidate_approvals_projection_after_v2;
alter table cloud.product_detail_publication_batches enable always trigger product_detail_batches_projection_before_v2;
alter table cloud.product_detail_publication_batches enable always trigger product_detail_batches_projection_after_v2;
alter table cloud.product_key_features enable always trigger product_key_features_projection_before_v2;
alter table cloud.product_key_features enable always trigger product_key_features_projection_after_v2;
alter table cloud.product_characteristics enable always trigger product_characteristics_projection_before_v2;
alter table cloud.product_characteristics enable always trigger product_characteristics_projection_after_v2;

create or replace function cloud_api.cloud_published_storefront_catalog_v1()
returns jsonb
language sql
security definer
stable
set search_path = pg_catalog, cloud
as $$
  select cloud.cloud_published_storefront_catalog_v1()
$$;

revoke all on function cloud.cloud_published_storefront_catalog_source_v2()
  from public, anon, authenticated, service_role;
revoke all on function cloud.cloud_published_storefront_catalog_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.capture_published_catalog_projection_v2()
  from public, anon, authenticated, service_role;
revoke all on function cloud.capture_published_catalog_projection_before_v2()
  from public, anon, authenticated, service_role;
revoke all on function cloud.refresh_published_catalog_projection_after_v2()
  from public, anon, authenticated, service_role;
revoke all on function cloud_api.cloud_published_storefront_catalog_v1()
  from public, anon, authenticated;
grant execute on function cloud_api.cloud_published_storefront_catalog_v1()
  to service_role;

comment on table cloud.published_catalog_projection_state is
  'Internal O(1) monotonic clock and last committed public payload checksum.';
comment on function cloud.cloud_published_storefront_catalog_v1() is
  'Published-only projection with Product-owned documents and monotonic cache clock.';
comment on function cloud.capture_published_catalog_projection_v2() is
  'Internal content checksum capture used only by projection change triggers.';

commit;
