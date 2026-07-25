-- Product Publication Foundation v1.
-- Defines the review-gated, reversible lifecycle of the base Cloud Product.
-- This forward-only migration performs no backfill, approval or publication.

begin;

create or replace function cloud.product_publication_identity_snapshot_v1(p_product_id uuid)
returns jsonb
language sql
stable
set search_path = pg_catalog, cloud
as $$
  select jsonb_build_object(
    'id', product.id,
    'sourceUid', product.source_uid,
    'sourceChecksum', product.source_checksum,
    'snapshotVersion', product.snapshot_version,
    'importBatchKey', product.import_batch_key
  )
  from cloud.products product
  where product.id = p_product_id
$$;

create or replace function cloud.product_publication_candidate_payload_v1(p_product_id uuid)
returns jsonb
language sql
stable
set search_path = pg_catalog, cloud
as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'product', jsonb_build_object(
      'id', product.id,
      'externalCode', product.external_code,
      'legacyId', product.legacy_id,
      'slug', product.slug,
      'title', product.title,
      'model', product.model,
      'manufacturerId', product.manufacturer_id,
      'categoryId', product.category_id,
      'shortDescription', product.short_description,
      'fullDescription', product.full_description,
      'primaryImageId', product.primary_image_id,
      'sourceType', product.source_type,
      'sourceUrl', product.source_url,
      'confidence', product.confidence,
      'sourceUid', product.source_uid,
      'sourceChecksum', product.source_checksum,
      'snapshotVersion', product.snapshot_version,
      'createdFromSnapshotAt', product.created_from_snapshot_at,
      'catalogQualityStatus', product.catalog_quality_status,
      'catalogQualityReasons', to_jsonb(product.catalog_quality_reason)
    ),
    'descriptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', description.id,
        'locale', description.locale,
        'shortDescription', description.short_description,
        'fullDescription', description.full_description,
        'confidence', description.confidence
      ) order by description.locale, description.id)
      from cloud.product_descriptions description
      where description.product_id = product.id
    ), '[]'::jsonb),
    'applicationAreas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', area.id,
        'publicationStatus', area.publication_status,
        'archivedAt', area.archived_at
      ) order by area.id)
      from cloud.product_application_areas product_area
      join cloud.application_areas area on area.id = product_area.application_area_id
      where product_area.product_id = product.id
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', media.id,
        'sourceUrl', media.source_url,
        'role', media.role,
        'format', media.media_format,
        'sortOrder', media.sort_order
      ) order by media.sort_order, media.id)
      from cloud.product_media media
      where media.product_id = product.id
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', document.id,
        'storageObjectId', document.storage_object_id,
        'title', document.title,
        'documentType', document.document_type,
        'language', document.language,
        'isOfficial', document.is_official,
        'publicationStatus', document.publication_status
      ) order by document.title, document.id)
      from cloud.product_documents document
      where document.product_id = product.id
    ), '[]'::jsonb),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', registration.id,
        'relationshipType', link.relationship_type,
        'registrationNumber', registration.registration_number,
        'status', registration.status,
        'verifiedAt', registration.verified_at
      ) order by registration.id)
      from cloud.product_registration_links link
      join cloud.registration_records registration
        on registration.id = link.registration_record_id
      where link.product_id = product.id
    ), '[]'::jsonb)
  )
  from cloud.products product
  where product.id = p_product_id
$$;

create or replace function cloud.product_publication_payload_checksum_v1(
  p_schema_version integer,
  p_product_identity jsonb,
  p_candidate_payload jsonb
)
returns text
language sql
immutable
set search_path = pg_catalog, cloud
as $$
  select cloud.sha256_jsonb_v1(jsonb_build_object(
    'schemaVersion', p_schema_version,
    'productIdentity', p_product_identity,
    'candidatePayload', p_candidate_payload
  ))
$$;

create or replace function cloud.assert_product_publication_dependencies_v1(p_product_id uuid)
returns void
language plpgsql
stable
set search_path = pg_catalog, cloud
as $$
declare
  product cloud.products%rowtype;
begin
  select * into product from cloud.products where id = p_product_id;
  if not found then
    raise exception 'product does not exist' using errcode = 'P0002';
  end if;
  if product.catalog_quality_status <> 'READY'
     or product.manufacturer_id is null
     or product.category_id is null
     or nullif(btrim(product.model), '') is null then
    raise exception 'product is not READY for publication' using errcode = '23514';
  end if;
  if not exists (
    select 1 from cloud.manufacturers manufacturer
    where manufacturer.id = product.manufacturer_id
      and manufacturer.publication_status = 'published'
      and manufacturer.archived_at is null
  ) then
    raise exception 'product manufacturer is not published' using errcode = '23514';
  end if;
  if not exists (
    select 1 from cloud.categories category
    where category.id = product.category_id
      and category.publication_status = 'published'
      and category.assignable
      and category.archived_at is null
  ) then
    raise exception 'product category is not a published assignable category'
      using errcode = '23514';
  end if;
  if not exists (
    select 1 from cloud.product_application_areas area
    where area.product_id = product.id
  ) or exists (
    select 1
    from cloud.product_application_areas product_area
    join cloud.application_areas area on area.id = product_area.application_area_id
    where product_area.product_id = product.id
      and (area.publication_status <> 'published' or area.archived_at is not null)
  ) then
    raise exception 'product application areas are missing or unpublished'
      using errcode = '23514';
  end if;
  if exists (
    select 1
    from cloud.import_products import_product
    join cloud.import_blocking_errors error
      on error.import_product_id = import_product.id
    where import_product.existing_product_id = product.id
      and error.resolved_at is null
  ) then
    raise exception 'product has unresolved critical import errors' using errcode = '23514';
  end if;
end
$$;

create or replace function cloud.assert_product_publication_actor_v1(
  p_actor_id uuid,
  p_operation text
)
returns void
language plpgsql
stable
set search_path = pg_catalog, cloud
as $$
begin
  if p_actor_id is null or not exists (
    select 1
    from cloud.user_profiles profile
    where profile.id = p_actor_id
      and (
        (p_operation = 'review'
          and profile.role in ('admin', 'editor', 'reviewer', 'service'))
        or (p_operation in ('publish', 'archive', 'rollback')
          and profile.role in ('admin', 'service'))
      )
  ) then
    raise exception 'product publication actor is not authorized for %', p_operation
      using errcode = '42501';
  end if;
end
$$;

create table cloud.product_publication_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  review_item_id uuid not null references cloud.review_items(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  schema_version integer not null check (schema_version = 1),
  idempotency_key text not null unique check (
    char_length(btrim(idempotency_key)) between 8 and 200
  ),
  product_identity jsonb not null,
  product_identity_checksum text not null check (
    product_identity_checksum ~ '^[a-f0-9]{64}$'
  ),
  candidate_payload jsonb not null,
  candidate_payload_checksum text not null check (
    candidate_payload_checksum ~ '^[a-f0-9]{64}$'
  ),
  payload_checksum text not null check (payload_checksum ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references cloud.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (product_id, revision_number),
  constraint product_publication_revision_identity_checksum check (
    product_identity_checksum = cloud.sha256_jsonb_v1(product_identity)
  ),
  constraint product_publication_revision_candidate_checksum check (
    candidate_payload_checksum = cloud.sha256_jsonb_v1(candidate_payload)
  ),
  constraint product_publication_revision_payload_checksum check (
    payload_checksum = cloud.product_publication_payload_checksum_v1(
      schema_version, product_identity, candidate_payload
    )
  )
);

create index product_publication_revisions_product_created_idx
  on cloud.product_publication_revisions (product_id, revision_number desc);

alter table cloud.review_decisions
  add column product_publication_revision_id uuid
    references cloud.product_publication_revisions(id) on delete restrict;

alter table cloud.review_decisions
  add constraint review_decisions_product_publication_binding check (
    decision_type <> 'product_publication' or (
      product_publication_revision_id is not null
      and approved_payload_checksum is not null
      and product_identity_checksum is not null
      and field_path = 'product'
    )
  ) not valid;

create index review_decisions_product_publication_revision_idx
  on cloud.review_decisions (
    product_publication_revision_id, review_item_id, created_at desc, id desc
  )
  where decision_type = 'product_publication';

create table cloud.product_publication_approvals (
  id uuid primary key default extensions.gen_random_uuid(),
  candidate_revision_id uuid not null unique
    references cloud.product_publication_revisions(id) on delete restrict,
  review_item_id uuid not null references cloud.review_items(id) on delete restrict,
  review_decision_id uuid not null unique references cloud.review_decisions(id) on delete restrict,
  payload_checksum text not null check (payload_checksum ~ '^[a-f0-9]{64}$'),
  product_identity_checksum text not null check (
    product_identity_checksum ~ '^[a-f0-9]{64}$'
  ),
  decision cloud.review_decision_type not null check (decision = 'approve'),
  reviewer_id uuid not null references cloud.user_profiles(id) on delete restrict,
  rationale text not null check (btrim(rationale) <> ''),
  approved_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table cloud.product_publication_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  candidate_revision_id uuid references cloud.product_publication_revisions(id) on delete restrict,
  approval_id uuid references cloud.product_publication_approvals(id) on delete restrict,
  action text not null check (action in ('publish', 'archive', 'rollback')),
  idempotency_key text not null unique check (
    char_length(btrim(idempotency_key)) between 8 and 200
  ),
  publication_version integer not null check (publication_version >= 0),
  payload_checksum text not null check (payload_checksum ~ '^[a-f0-9]{64}$'),
  previous_active_batch_id uuid references cloud.product_publication_batches(id) on delete restrict,
  rollback_target_batch_id uuid references cloud.product_publication_batches(id) on delete restrict,
  previous_state jsonb not null,
  result_state jsonb not null,
  actor_id uuid not null references cloud.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint product_publication_batch_action_binding check (
    (action = 'publish' and candidate_revision_id is not null
      and approval_id is not null and rollback_target_batch_id is null)
    or (action = 'archive' and candidate_revision_id is null
      and approval_id is null and previous_active_batch_id is not null
      and rollback_target_batch_id is null)
    or (action = 'rollback' and candidate_revision_id is null
      and approval_id is null and rollback_target_batch_id is not null)
  )
);

create unique index product_publication_batches_revision_publish_uq
  on cloud.product_publication_batches (candidate_revision_id)
  where action = 'publish';
create unique index product_publication_batches_rollback_target_uq
  on cloud.product_publication_batches (rollback_target_batch_id)
  where action = 'rollback';
create index product_publication_batches_product_created_idx
  on cloud.product_publication_batches (product_id, created_at desc, id desc);

alter table cloud.products
  drop constraint products_import_never_published,
  add column publication_version integer not null default 0 check (publication_version >= 0),
  add column active_product_publication_batch_id uuid
    references cloud.product_publication_batches(id) on delete restrict;

alter table cloud.products
  add constraint products_publication_foundation_state check (
    (publication_status = 'published'
      and published_at is not null
      and archived_at is null
      and active_product_publication_batch_id is not null)
    or (publication_status = 'archived'
      and archived_at is not null
      and active_product_publication_batch_id is null)
    or (publication_status in ('draft', 'in_review', 'approved')
      and published_at is null
      and archived_at is null
      and active_product_publication_batch_id is null)
  );

create or replace function cloud.product_publication_state_snapshot_v1(p_product_id uuid)
returns jsonb
language sql
stable
set search_path = pg_catalog, cloud
as $$
  select jsonb_build_object(
    'publicationStatus', product.publication_status,
    'reviewState', product.review_state,
    'publishedAt', product.published_at,
    'archivedAt', product.archived_at,
    'publicationVersion', product.publication_version,
    'activePublicationBatchId', product.active_product_publication_batch_id,
    'updatedAt', product.updated_at
  )
  from cloud.products product
  where product.id = p_product_id
$$;

create or replace function cloud.prevent_product_publication_record_mutation_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception '% records are immutable; append a new publication action', TG_TABLE_NAME
    using errcode = '55000';
end
$$;

create trigger product_publication_revisions_immutable
  before update or delete on cloud.product_publication_revisions
  for each row execute function cloud.prevent_product_publication_record_mutation_v1();
create trigger product_publication_approvals_immutable
  before update or delete on cloud.product_publication_approvals
  for each row execute function cloud.prevent_product_publication_record_mutation_v1();
create trigger product_publication_batches_immutable
  before update or delete on cloud.product_publication_batches
  for each row execute function cloud.prevent_product_publication_record_mutation_v1();

create or replace function cloud.prevent_bound_review_decision_mutation_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.candidate_revision_id is not null
     or old.product_publication_revision_id is not null then
    raise exception 'revision-bound review decisions are immutable; insert a new decision'
      using errcode = '55000';
  end if;
  return case when TG_OP = 'DELETE' then old else new end;
end
$$;

create or replace function cloud.enforce_product_publication_state_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, cloud
as $$
declare
  action text := current_setting('cybermedica.product_publication_action', true);
  workflow_changed boolean;
  protected_content_changed boolean;
begin
  workflow_changed := row(
    new.publication_status, new.review_state, new.published_at, new.archived_at,
    new.publication_version, new.active_product_publication_batch_id
  ) is distinct from row(
    old.publication_status, old.review_state, old.published_at, old.archived_at,
    old.publication_version, old.active_product_publication_batch_id
  );

  protected_content_changed := row(
    new.external_code, new.legacy_id, new.slug, new.title, new.model,
    new.manufacturer_id, new.category_id, new.short_description,
    new.full_description, new.primary_image_id, new.source_type, new.source_url,
    new.confidence, new.source_uid, new.source_checksum, new.snapshot_version,
    new.created_from_snapshot_at, new.import_batch_key
  ) is distinct from row(
    old.external_code, old.legacy_id, old.slug, old.title, old.model,
    old.manufacturer_id, old.category_id, old.short_description,
    old.full_description, old.primary_image_id, old.source_type, old.source_url,
    old.confidence, old.source_uid, old.source_checksum, old.snapshot_version,
    old.created_from_snapshot_at, old.import_batch_key
  );

  if protected_content_changed
     and old.publication_status in ('approved', 'published', 'archived') then
    raise exception 'approved or public product content is immutable; create a new reviewed revision'
      using errcode = '55000';
  end if;

  if workflow_changed and not (
    (action = 'review'
      and old.publication_status in ('draft', 'in_review', 'approved')
      and new.publication_status = 'in_review'
      and new.review_state = 'in_review'
      and new.active_product_publication_batch_id is null)
    or (action = 'approve'
      and old.publication_status = 'in_review'
      and new.publication_status = 'approved'
      and new.review_state = 'approved'
      and new.active_product_publication_batch_id is null)
    or (action = 'publish'
      and old.publication_status = 'approved'
      and new.publication_status = 'published'
      and new.review_state = 'published'
      and new.active_product_publication_batch_id is not null)
    or (action = 'archive'
      and old.publication_status = 'published'
      and new.publication_status = 'archived'
      and new.review_state = 'archived'
      and new.active_product_publication_batch_id is null)
    or (action = 'rollback'
      and ((old.publication_status = 'published' and new.publication_status = 'approved')
        or (old.publication_status = 'archived' and new.publication_status = 'published')))
  ) then
    raise exception 'invalid or unauthorized product publication state transition: % -> %',
      old.publication_status, new.publication_status using errcode = '55000';
  end if;
  return new;
end
$$;

create trigger products_publication_state_guard
  before update on cloud.products
  for each row execute function cloud.enforce_product_publication_state_v1();

alter table cloud.product_publication_revisions enable row level security;
alter table cloud.product_publication_approvals enable row level security;
alter table cloud.product_publication_batches enable row level security;
revoke all on table cloud.product_publication_revisions from public, anon, authenticated;
revoke all on table cloud.product_publication_approvals from public, anon, authenticated;
revoke all on table cloud.product_publication_batches from public, anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table cloud.product_publication_revisions,
    cloud.product_publication_approvals,
    cloud.product_publication_batches
  from service_role;
grant select on table cloud.product_publication_revisions,
  cloud.product_publication_approvals,
  cloud.product_publication_batches to service_role;

create or replace function cloud.create_product_publication_revision_v1(
  p_product_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  product cloud.products%rowtype;
  import_product_id_value uuid;
  review_item_id_value uuid;
  product_identity_value jsonb;
  product_identity_checksum_value text;
  candidate_payload_value jsonb;
  candidate_payload_checksum_value text;
  payload_checksum_value text;
  existing_revision cloud.product_publication_revisions%rowtype;
  revision_number_value integer;
  revision_id_value uuid;
begin
  if not cloud.is_service_request() then
    raise exception 'product publication revision creation requires service role'
      using errcode = '42501';
  end if;
  if p_actor_id is null
     or char_length(coalesce(btrim(p_idempotency_key), '')) not between 8 and 200 then
    raise exception 'actor and idempotency key are required' using errcode = '22023';
  end if;
  perform cloud.assert_product_publication_actor_v1(p_actor_id, 'review');

  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text, 2));
  select * into product from cloud.products where id = p_product_id for update;
  if not found then
    raise exception 'product does not exist' using errcode = 'P0002';
  end if;

  select * into existing_revision
  from cloud.product_publication_revisions
  where idempotency_key = p_idempotency_key;
  if found then
    if existing_revision.product_id is distinct from product.id then
      raise exception 'idempotency key belongs to a different product revision'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'candidateRevisionId', existing_revision.id,
      'productId', existing_revision.product_id,
      'reviewItemId', existing_revision.review_item_id,
      'revisionNumber', existing_revision.revision_number,
      'schemaVersion', existing_revision.schema_version,
      'payloadChecksum', existing_revision.payload_checksum,
      'productIdentityChecksum', existing_revision.product_identity_checksum,
      'state', 'in_review',
      'idempotent', true
    );
  end if;
  if product.publication_status in ('published', 'archived') then
    raise exception 'published or archived product requires a separate revision workflow'
      using errcode = '55000';
  end if;

  perform cloud.assert_product_publication_dependencies_v1(product.id);

  select import_product.id into import_product_id_value
  from cloud.import_products import_product
  where import_product.existing_product_id = product.id
  order by import_product.created_at desc, import_product.id desc
  limit 1;
  if import_product_id_value is null then
    raise exception 'product has no reproducible import record' using errcode = '23514';
  end if;

  select review_item.id into review_item_id_value
  from cloud.review_items review_item
  where review_item.import_product_id = import_product_id_value;
  if review_item_id_value is null then
    insert into cloud.review_items (import_product_id, status, priority)
    values (import_product_id_value, 'in_review', 'high')
    returning id into review_item_id_value;
  elsif exists (
    select 1 from cloud.review_items
    where id = review_item_id_value and status in ('blocked', 'rejected', 'archived')
  ) then
    raise exception 'product review item is blocked, rejected or archived'
      using errcode = '23514';
  else
    update cloud.review_items
    set status = 'in_review', updated_at = now()
    where id = review_item_id_value and status <> 'approved';
  end if;

  perform set_config('cybermedica.product_publication_action', 'review', true);
  update cloud.products
  set publication_status = 'in_review', review_state = 'in_review', updated_at = now()
  where id = product.id and publication_status <> 'in_review';
  perform set_config('cybermedica.product_publication_action', '', true);

  product_identity_value := cloud.product_publication_identity_snapshot_v1(product.id);
  candidate_payload_value := cloud.product_publication_candidate_payload_v1(product.id);
  product_identity_checksum_value := cloud.sha256_jsonb_v1(product_identity_value);
  candidate_payload_checksum_value := cloud.sha256_jsonb_v1(candidate_payload_value);
  payload_checksum_value := cloud.product_publication_payload_checksum_v1(
    1, product_identity_value, candidate_payload_value
  );

  select coalesce(max(revision_number), 0) + 1 into revision_number_value
  from cloud.product_publication_revisions where product_id = product.id;
  insert into cloud.product_publication_revisions (
    product_id, review_item_id, revision_number, schema_version, idempotency_key,
    product_identity, product_identity_checksum, candidate_payload,
    candidate_payload_checksum, payload_checksum, created_by
  ) values (
    product.id, review_item_id_value, revision_number_value, 1, p_idempotency_key,
    product_identity_value, product_identity_checksum_value, candidate_payload_value,
    candidate_payload_checksum_value, payload_checksum_value, p_actor_id
  ) returning id into revision_id_value;

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, after_data, source, request_id
  ) values (
    p_actor_id, 'create', 'product_publication_revision', revision_id_value,
    jsonb_build_object(
      'productId', product.id,
      'revisionNumber', revision_number_value,
      'payloadChecksum', payload_checksum_value
    ), 'cloud_api.create_product_publication_revision_v1', p_idempotency_key
  );

  return jsonb_build_object(
    'candidateRevisionId', revision_id_value,
    'productId', product.id,
    'reviewItemId', review_item_id_value,
    'revisionNumber', revision_number_value,
    'schemaVersion', 1,
    'payloadChecksum', payload_checksum_value,
    'productIdentityChecksum', product_identity_checksum_value,
    'state', 'in_review',
    'idempotent', false
  );
end
$$;

create or replace function cloud.approve_product_publication_revision_v1(
  p_candidate_revision_id uuid,
  p_reviewer_id uuid,
  p_rationale text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  revision cloud.product_publication_revisions%rowtype;
  product cloud.products%rowtype;
  existing_approval cloud.product_publication_approvals%rowtype;
  current_identity jsonb;
  current_payload jsonb;
  decision_id_value uuid;
  approval_id_value uuid;
  approved_at_value timestamptz := clock_timestamp();
  previous_state_value jsonb;
  result_state_value jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'product publication approval requires service role' using errcode = '42501';
  end if;
  if p_reviewer_id is null or nullif(btrim(p_rationale), '') is null then
    raise exception 'reviewer and rationale are required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from cloud.user_profiles profile
    where profile.id = p_reviewer_id and profile.role in ('reviewer', 'admin')
  ) then
    raise exception 'product publication approval requires a reviewer or admin profile'
      using errcode = '42501';
  end if;

  select * into revision
  from cloud.product_publication_revisions
  where id = p_candidate_revision_id;
  if not found then
    raise exception 'product publication revision does not exist' using errcode = 'P0002';
  end if;

  select * into existing_approval
  from cloud.product_publication_approvals
  where candidate_revision_id = revision.id;
  if found then
    return jsonb_build_object(
      'approvalId', existing_approval.id,
      'candidateRevisionId', revision.id,
      'productId', revision.product_id,
      'state', 'approved',
      'payloadChecksum', existing_approval.payload_checksum,
      'idempotent', true
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(revision.product_id::text, 2));
  select * into product from cloud.products where id = revision.product_id for update;
  if product.publication_status <> 'in_review' then
    raise exception 'only an in-review product can be approved' using errcode = '55000';
  end if;
  if not exists (
    select 1 from cloud.review_items review_item
    where review_item.id = revision.review_item_id
      and review_item.status not in ('blocked', 'rejected', 'archived')
  ) then
    raise exception 'product review item is not approvable' using errcode = '23514';
  end if;

  perform cloud.assert_product_publication_dependencies_v1(product.id);
  current_identity := cloud.product_publication_identity_snapshot_v1(product.id);
  current_payload := cloud.product_publication_candidate_payload_v1(product.id);
  if current_identity is distinct from revision.product_identity
     or current_payload is distinct from revision.candidate_payload
     or cloud.sha256_jsonb_v1(current_identity) <> revision.product_identity_checksum
     or cloud.sha256_jsonb_v1(current_payload) <> revision.candidate_payload_checksum
     or cloud.product_publication_payload_checksum_v1(
       revision.schema_version, current_identity, current_payload
     ) <> revision.payload_checksum then
    raise exception 'product changed after publication revision creation'
      using errcode = '55000';
  end if;

  insert into cloud.review_decisions (
    review_item_id, decision_type, field_path, proposed_value, approved_value,
    decision, reviewer_id, rationale, created_at,
    product_publication_revision_id, approved_payload_checksum,
    product_identity_checksum
  ) values (
    revision.review_item_id, 'product_publication', 'product',
    revision.candidate_payload, revision.candidate_payload, 'approve',
    p_reviewer_id, btrim(p_rationale), approved_at_value, revision.id,
    revision.payload_checksum, revision.product_identity_checksum
  ) returning id into decision_id_value;

  insert into cloud.product_publication_approvals (
    candidate_revision_id, review_item_id, review_decision_id,
    payload_checksum, product_identity_checksum, decision, reviewer_id,
    rationale, approved_at
  ) values (
    revision.id, revision.review_item_id, decision_id_value,
    revision.payload_checksum, revision.product_identity_checksum, 'approve',
    p_reviewer_id, btrim(p_rationale), approved_at_value
  ) returning id into approval_id_value;

  previous_state_value := cloud.product_publication_state_snapshot_v1(product.id);
  perform set_config('cybermedica.product_publication_action', 'approve', true);
  update cloud.products
  set publication_status = 'approved', review_state = 'approved', updated_at = approved_at_value
  where id = product.id;
  perform set_config('cybermedica.product_publication_action', '', true);
  update cloud.review_items
  set status = 'approved', reviewed_at = approved_at_value, updated_at = approved_at_value
  where id = revision.review_item_id;
  result_state_value := cloud.product_publication_state_snapshot_v1(product.id);

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source
  ) values (
    p_reviewer_id, 'approve', 'product_publication_revision', revision.id,
    previous_state_value, jsonb_build_object(
      'state', result_state_value,
      'approvalId', approval_id_value,
      'reviewDecisionId', decision_id_value,
      'payloadChecksum', revision.payload_checksum
    ), 'cloud_api.approve_product_publication_revision_v1'
  );

  return jsonb_build_object(
    'approvalId', approval_id_value,
    'candidateRevisionId', revision.id,
    'productId', revision.product_id,
    'state', 'approved',
    'payloadChecksum', revision.payload_checksum,
    'idempotent', false
  );
end
$$;

create or replace function cloud.publish_product_v1(
  p_candidate_revision_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  revision cloud.product_publication_revisions%rowtype;
  approval cloud.product_publication_approvals%rowtype;
  product cloud.products%rowtype;
  existing_batch cloud.product_publication_batches%rowtype;
  current_identity jsonb;
  current_payload jsonb;
  previous_state_value jsonb;
  result_state_value jsonb;
  batch_id_value uuid := extensions.gen_random_uuid();
  published_at_value timestamptz := clock_timestamp();
  publication_version_value integer;
begin
  if not cloud.is_service_request() then
    raise exception 'product publication requires service role' using errcode = '42501';
  end if;
  if p_actor_id is null
     or char_length(coalesce(btrim(p_idempotency_key), '')) not between 8 and 200 then
    raise exception 'actor and idempotency key are required' using errcode = '22023';
  end if;
  perform cloud.assert_product_publication_actor_v1(p_actor_id, 'publish');
  select * into revision
  from cloud.product_publication_revisions
  where id = p_candidate_revision_id;
  if not found then
    raise exception 'product publication revision does not exist' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(revision.product_id::text, 2));
  select * into existing_batch
  from cloud.product_publication_batches where idempotency_key = p_idempotency_key;
  if found then
    if existing_batch.action <> 'publish'
       or existing_batch.candidate_revision_id is distinct from revision.id
       or existing_batch.payload_checksum <> revision.payload_checksum then
      raise exception 'idempotency key belongs to a different publication action'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'publicationBatchId', existing_batch.id,
      'candidateRevisionId', existing_batch.candidate_revision_id,
      'productId', existing_batch.product_id,
      'action', existing_batch.action,
      'state', existing_batch.result_state ->> 'publicationStatus',
      'publicationVersion', existing_batch.publication_version,
      'idempotent', true
    );
  end if;
  if exists (
    select 1 from cloud.product_publication_batches
    where candidate_revision_id = revision.id and action = 'publish'
  ) then
    raise exception 'product publication revision was already used'
      using errcode = '23505';
  end if;

  select * into product from cloud.products where id = revision.product_id for update;
  if product.publication_status <> 'approved' or product.review_state <> 'approved' then
    raise exception 'only an approved product can be published' using errcode = '55000';
  end if;
  select * into approval
  from cloud.product_publication_approvals
  where candidate_revision_id = revision.id;
  if not found
     or approval.payload_checksum <> revision.payload_checksum
     or approval.product_identity_checksum <> revision.product_identity_checksum
     or approval.decision <> 'approve'
     or not exists (
       select 1 from cloud.review_decisions decision
       where decision.id = approval.review_decision_id
         and decision.product_publication_revision_id = revision.id
         and decision.review_item_id = revision.review_item_id
         and decision.decision = 'approve'
         and decision.approved_value = revision.candidate_payload
         and decision.approved_payload_checksum = revision.payload_checksum
         and decision.product_identity_checksum = revision.product_identity_checksum
     ) then
    raise exception 'product has no current revision-bound approval'
      using errcode = '23514';
  end if;

  perform cloud.assert_product_publication_dependencies_v1(product.id);
  current_identity := cloud.product_publication_identity_snapshot_v1(product.id);
  current_payload := cloud.product_publication_candidate_payload_v1(product.id);
  if current_identity is distinct from revision.product_identity
     or current_payload is distinct from revision.candidate_payload
     or cloud.product_publication_payload_checksum_v1(
       revision.schema_version, current_identity, current_payload
     ) <> revision.payload_checksum then
    raise exception 'approved product publication revision is stale' using errcode = '55000';
  end if;

  previous_state_value := cloud.product_publication_state_snapshot_v1(product.id);
  publication_version_value := product.publication_version + 1;
  result_state_value := jsonb_build_object(
    'publicationStatus', 'published',
    'reviewState', 'published',
    'publishedAt', published_at_value,
    'archivedAt', null,
    'publicationVersion', publication_version_value,
    'activePublicationBatchId', batch_id_value,
    'updatedAt', published_at_value
  );

  insert into cloud.product_publication_batches (
    id, product_id, candidate_revision_id, approval_id, action,
    idempotency_key, publication_version, payload_checksum,
    previous_active_batch_id, previous_state, result_state, actor_id,
    created_at
  ) values (
    batch_id_value, product.id, revision.id, approval.id, 'publish',
    p_idempotency_key, publication_version_value, revision.payload_checksum,
    product.active_product_publication_batch_id, previous_state_value,
    result_state_value, p_actor_id, published_at_value
  );

  perform set_config('cybermedica.product_publication_action', 'publish', true);
  update cloud.products
  set publication_status = 'published', review_state = 'published',
      published_at = published_at_value, archived_at = null,
      publication_version = publication_version_value,
      active_product_publication_batch_id = batch_id_value,
      updated_at = published_at_value
  where id = product.id;
  perform set_config('cybermedica.product_publication_action', '', true);

  insert into cloud.publication_events (
    product_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    product.id,
    case when product.publication_version = 0 then 'created' else 'republished' end,
    previous_state_value, result_state_value, p_actor_id,
    jsonb_build_object(
      'contract', 'product-publication-foundation-v1',
      'publicationBatchId', batch_id_value,
      'candidateRevisionId', revision.id,
      'approvalId', approval.id,
      'payloadChecksum', revision.payload_checksum
    )
  );
  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source,
    request_id
  ) values (
    p_actor_id, 'publish', 'product_publication_batch', batch_id_value,
    previous_state_value, result_state_value, 'cloud_api.publish_product_v1',
    p_idempotency_key
  );

  return jsonb_build_object(
    'publicationBatchId', batch_id_value,
    'candidateRevisionId', revision.id,
    'productId', product.id,
    'action', 'publish',
    'state', 'published',
    'publicationVersion', publication_version_value,
    'idempotent', false
  );
end
$$;

create or replace function cloud.archive_product_v1(
  p_product_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  product cloud.products%rowtype;
  existing_batch cloud.product_publication_batches%rowtype;
  previous_state_value jsonb;
  result_state_value jsonb;
  batch_id_value uuid := extensions.gen_random_uuid();
  archived_at_value timestamptz := clock_timestamp();
begin
  if not cloud.is_service_request() then
    raise exception 'product archive requires service role' using errcode = '42501';
  end if;
  if p_actor_id is null
     or char_length(coalesce(btrim(p_idempotency_key), '')) not between 8 and 200 then
    raise exception 'actor and idempotency key are required' using errcode = '22023';
  end if;
  perform cloud.assert_product_publication_actor_v1(p_actor_id, 'archive');
  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text, 2));
  select * into existing_batch
  from cloud.product_publication_batches where idempotency_key = p_idempotency_key;
  if found then
    if existing_batch.action <> 'archive' or existing_batch.product_id <> p_product_id then
      raise exception 'idempotency key belongs to a different publication action'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'publicationBatchId', existing_batch.id,
      'candidateRevisionId', existing_batch.candidate_revision_id,
      'productId', existing_batch.product_id,
      'action', existing_batch.action,
      'state', existing_batch.result_state ->> 'publicationStatus',
      'publicationVersion', existing_batch.publication_version,
      'idempotent', true
    );
  end if;
  select * into product from cloud.products where id = p_product_id for update;
  if not found or product.publication_status <> 'published'
     or product.active_product_publication_batch_id is null then
    raise exception 'only a currently published product can be archived'
      using errcode = '55000';
  end if;

  previous_state_value := cloud.product_publication_state_snapshot_v1(product.id);
  result_state_value := jsonb_build_object(
    'publicationStatus', 'archived',
    'reviewState', 'archived',
    'publishedAt', product.published_at,
    'archivedAt', archived_at_value,
    'publicationVersion', product.publication_version,
    'activePublicationBatchId', null,
    'updatedAt', archived_at_value
  );
  insert into cloud.product_publication_batches (
    id, product_id, action, idempotency_key, publication_version,
    payload_checksum, previous_active_batch_id, previous_state, result_state,
    actor_id, created_at
  ) values (
    batch_id_value, product.id, 'archive', p_idempotency_key,
    product.publication_version, cloud.sha256_jsonb_v1(previous_state_value),
    product.active_product_publication_batch_id, previous_state_value,
    result_state_value, p_actor_id, archived_at_value
  );

  perform set_config('cybermedica.product_publication_action', 'archive', true);
  update cloud.products
  set publication_status = 'archived', review_state = 'archived',
      archived_at = archived_at_value, active_product_publication_batch_id = null,
      updated_at = archived_at_value
  where id = product.id;
  perform set_config('cybermedica.product_publication_action', '', true);

  insert into cloud.publication_events (
    product_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    product.id, 'archived', previous_state_value, result_state_value, p_actor_id,
    jsonb_build_object(
      'contract', 'product-publication-foundation-v1',
      'publicationBatchId', batch_id_value,
      'previousActiveBatchId', product.active_product_publication_batch_id
    )
  );
  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source,
    request_id
  ) values (
    p_actor_id, 'archive', 'product_publication_batch', batch_id_value,
    previous_state_value, result_state_value, 'cloud_api.archive_product_v1',
    p_idempotency_key
  );

  return jsonb_build_object(
    'publicationBatchId', batch_id_value,
    'candidateRevisionId', null,
    'productId', product.id,
    'action', 'archive',
    'state', 'archived',
    'publicationVersion', product.publication_version,
    'idempotent', false
  );
end
$$;

create or replace function cloud.rollback_product_publication_v1(
  p_publication_batch_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  target_batch cloud.product_publication_batches%rowtype;
  existing_batch cloud.product_publication_batches%rowtype;
  product cloud.products%rowtype;
  current_state_value jsonb;
  result_state_value jsonb;
  rollback_batch_id_value uuid := extensions.gen_random_uuid();
  rolled_back_at_value timestamptz := clock_timestamp();
begin
  if not cloud.is_service_request() then
    raise exception 'product publication rollback requires service role'
      using errcode = '42501';
  end if;
  if p_actor_id is null
     or char_length(coalesce(btrim(p_idempotency_key), '')) not between 8 and 200 then
    raise exception 'actor and idempotency key are required' using errcode = '22023';
  end if;
  perform cloud.assert_product_publication_actor_v1(p_actor_id, 'rollback');
  select * into target_batch
  from cloud.product_publication_batches where id = p_publication_batch_id;
  if not found or target_batch.action not in ('publish', 'archive') then
    raise exception 'rollback target is not a product publication action'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_batch.product_id::text, 2));
  select * into existing_batch
  from cloud.product_publication_batches where idempotency_key = p_idempotency_key;
  if found then
    if existing_batch.action <> 'rollback'
       or existing_batch.rollback_target_batch_id is distinct from target_batch.id then
      raise exception 'idempotency key belongs to a different publication action'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'publicationBatchId', existing_batch.id,
      'candidateRevisionId', existing_batch.candidate_revision_id,
      'productId', existing_batch.product_id,
      'action', existing_batch.action,
      'state', existing_batch.result_state ->> 'publicationStatus',
      'publicationVersion', existing_batch.publication_version,
      'idempotent', true
    );
  end if;
  if exists (
    select 1 from cloud.product_publication_batches
    where action = 'rollback' and rollback_target_batch_id = target_batch.id
  ) then
    raise exception 'publication action was already rolled back under another idempotency key'
      using errcode = '23505';
  end if;

  select * into product
  from cloud.products where id = target_batch.product_id for update;
  current_state_value := cloud.product_publication_state_snapshot_v1(product.id);
  if current_state_value is distinct from target_batch.result_state then
    raise exception 'only the currently applied product publication action can be rolled back'
      using errcode = '55000';
  end if;
  result_state_value := target_batch.previous_state;

  insert into cloud.product_publication_batches (
    id, product_id, action, idempotency_key, publication_version,
    payload_checksum, previous_active_batch_id, rollback_target_batch_id,
    previous_state, result_state, actor_id, created_at
  ) values (
    rollback_batch_id_value, product.id, 'rollback', p_idempotency_key,
    (result_state_value ->> 'publicationVersion')::integer,
    cloud.sha256_jsonb_v1(target_batch.result_state),
    product.active_product_publication_batch_id, target_batch.id,
    current_state_value, result_state_value, p_actor_id, rolled_back_at_value
  );

  perform set_config('cybermedica.product_publication_action', 'rollback', true);
  update cloud.products
  set publication_status = (result_state_value ->> 'publicationStatus')::cloud.product_status,
      review_state = (result_state_value ->> 'reviewState')::cloud.review_status,
      published_at = nullif(result_state_value ->> 'publishedAt', '')::timestamptz,
      archived_at = nullif(result_state_value ->> 'archivedAt', '')::timestamptz,
      publication_version = (result_state_value ->> 'publicationVersion')::integer,
      active_product_publication_batch_id =
        nullif(result_state_value ->> 'activePublicationBatchId', '')::uuid,
      updated_at = (result_state_value ->> 'updatedAt')::timestamptz
  where id = product.id;
  perform set_config('cybermedica.product_publication_action', '', true);

  insert into cloud.publication_events (
    product_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    product.id, 'rollback', current_state_value, result_state_value, p_actor_id,
    jsonb_build_object(
      'contract', 'product-publication-foundation-v1',
      'publicationBatchId', rollback_batch_id_value,
      'rollbackTargetBatchId', target_batch.id
    )
  );
  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source,
    request_id
  ) values (
    p_actor_id, 'restore', 'product_publication_batch', rollback_batch_id_value,
    current_state_value, result_state_value,
    'cloud_api.rollback_product_publication_v1', p_idempotency_key
  );

  return jsonb_build_object(
    'publicationBatchId', rollback_batch_id_value,
    'candidateRevisionId', null,
    'productId', product.id,
    'action', 'rollback',
    'state', result_state_value ->> 'publicationStatus',
    'publicationVersion', (result_state_value ->> 'publicationVersion')::integer,
    'idempotent', false
  );
end
$$;

create or replace function cloud_api.create_product_publication_revision_v1(
  p_product_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.create_product_publication_revision_v1(
    p_product_id, p_idempotency_key, p_actor_id
  )
$$;

create or replace function cloud_api.approve_product_publication_revision_v1(
  p_candidate_revision_id uuid,
  p_reviewer_id uuid,
  p_rationale text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.approve_product_publication_revision_v1(
    p_candidate_revision_id, p_reviewer_id, p_rationale
  )
$$;

create or replace function cloud_api.publish_product_v1(
  p_candidate_revision_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.publish_product_v1(
    p_candidate_revision_id, p_idempotency_key, p_actor_id
  )
$$;

create or replace function cloud_api.archive_product_v1(
  p_product_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.archive_product_v1(p_product_id, p_idempotency_key, p_actor_id)
$$;

create or replace function cloud_api.rollback_product_publication_v1(
  p_publication_batch_id uuid,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.rollback_product_publication_v1(
    p_publication_batch_id, p_idempotency_key, p_actor_id
  )
$$;

revoke all on function cloud.product_publication_identity_snapshot_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.product_publication_candidate_payload_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.product_publication_payload_checksum_v1(integer, jsonb, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function cloud.assert_product_publication_dependencies_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.assert_product_publication_actor_v1(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function cloud.product_publication_state_snapshot_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.create_product_publication_revision_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.approve_product_publication_revision_v1(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function cloud.publish_product_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.archive_product_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.rollback_product_publication_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;

revoke all on function cloud_api.create_product_publication_revision_v1(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function cloud_api.approve_product_publication_revision_v1(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function cloud_api.publish_product_v1(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function cloud_api.archive_product_v1(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function cloud_api.rollback_product_publication_v1(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function cloud_api.create_product_publication_revision_v1(uuid, text, uuid)
  to service_role;
grant execute on function cloud_api.approve_product_publication_revision_v1(uuid, uuid, text)
  to service_role;
grant execute on function cloud_api.publish_product_v1(uuid, text, uuid)
  to service_role;
grant execute on function cloud_api.archive_product_v1(uuid, text, uuid)
  to service_role;
grant execute on function cloud_api.rollback_product_publication_v1(uuid, text, uuid)
  to service_role;

comment on table cloud.product_publication_revisions is
  'Immutable base Product candidate revisions reviewed before publication.';
comment on table cloud.product_publication_approvals is
  'Immutable approvals bound to exact Product revision and checksums.';
comment on table cloud.product_publication_batches is
  'Append-only Product publish, archive and rollback actions.';
comment on function cloud_api.publish_product_v1(uuid, text, uuid) is
  'Service-only atomic Product publication. It never approves a Product.';

commit;
