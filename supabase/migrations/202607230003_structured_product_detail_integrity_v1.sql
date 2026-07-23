-- Structured Product Detail integrity v1.
-- Forward-only correction for immutable review binding, managed row identity,
-- and exact product-scoped rollback. It performs no approval or publication.

begin;

create or replace function cloud.sha256_jsonb_v1(p_value jsonb)
returns text
language sql
immutable
set search_path = pg_catalog, extensions
as $$
  select encode(extensions.digest(convert_to(p_value::text, 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function cloud.structured_product_identity_snapshot_v1(p_product_id uuid)
returns jsonb
language sql
stable
set search_path = pg_catalog, cloud
as $$
  select jsonb_build_object(
    'id', product.id,
    'slug', product.slug,
    'title', product.title,
    'model', product.model,
    'manufacturerId', product.manufacturer_id,
    'categoryId', product.category_id,
    'sourceUid', product.source_uid,
    'sourceChecksum', product.source_checksum,
    'snapshotVersion', product.snapshot_version,
    'importBatchKey', product.import_batch_key,
    'updatedAt', product.updated_at
  )
  from cloud.products product
  where product.id = p_product_id
$$;

create or replace function cloud.structured_product_detail_payload_checksum_v1(
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

create table cloud.product_detail_candidate_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  candidate_id uuid not null references cloud.publication_candidates(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  product_id uuid not null references cloud.products(id) on delete restrict,
  schema_version integer not null check (schema_version = 1),
  product_identity jsonb not null,
  product_identity_checksum text not null check (product_identity_checksum ~ '^[a-f0-9]{64}$'),
  candidate_payload jsonb not null,
  candidate_payload_checksum text not null check (candidate_payload_checksum ~ '^[a-f0-9]{64}$'),
  payload_checksum text not null check (payload_checksum ~ '^[a-f0-9]{64}$'),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (candidate_id, revision_number),
  unique (candidate_id, payload_checksum),
  constraint product_detail_revision_product_identity_checksum check (
    product_identity_checksum = cloud.sha256_jsonb_v1(product_identity)
  ),
  constraint product_detail_revision_candidate_payload_checksum check (
    candidate_payload_checksum = cloud.sha256_jsonb_v1(candidate_payload)
  ),
  constraint product_detail_revision_payload_checksum check (
    payload_checksum = cloud.structured_product_detail_payload_checksum_v1(
      schema_version, product_identity, candidate_payload
    )
  )
);

create index product_detail_candidate_revisions_candidate_created_idx
  on cloud.product_detail_candidate_revisions (candidate_id, revision_number desc);
create index product_detail_candidate_revisions_product_created_idx
  on cloud.product_detail_candidate_revisions (product_id, created_at desc, id desc);

create table cloud.product_detail_candidate_revision_approvals (
  id uuid primary key default extensions.gen_random_uuid(),
  candidate_revision_id uuid not null unique
    references cloud.product_detail_candidate_revisions(id) on delete restrict,
  review_item_id uuid not null references cloud.review_items(id) on delete restrict,
  payload_checksum text not null check (payload_checksum ~ '^[a-f0-9]{64}$'),
  product_identity_checksum text not null check (product_identity_checksum ~ '^[a-f0-9]{64}$'),
  decision cloud.review_decision_type not null check (decision = 'approve'),
  reviewer_id uuid not null,
  approved_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index product_detail_revision_approvals_review_item_idx
  on cloud.product_detail_candidate_revision_approvals (review_item_id, approved_at desc);

create or replace function cloud.prevent_structured_review_binding_mutation_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception '% records are immutable; create a new revision or decision', TG_TABLE_NAME
    using errcode = '55000';
end
$$;

create trigger product_detail_candidate_revisions_immutable
  before update or delete on cloud.product_detail_candidate_revisions
  for each row execute function cloud.prevent_structured_review_binding_mutation_v1();

create trigger product_detail_candidate_revision_approvals_immutable
  before update or delete on cloud.product_detail_candidate_revision_approvals
  for each row execute function cloud.prevent_structured_review_binding_mutation_v1();

alter table cloud.review_decisions
  add column candidate_revision_id uuid
    references cloud.product_detail_candidate_revisions(id) on delete restrict,
  add column approved_payload_checksum text,
  add column product_identity_checksum text;

alter table cloud.review_decisions
  add constraint review_decisions_payload_checksum_format check (
    approved_payload_checksum is null or approved_payload_checksum ~ '^[a-f0-9]{64}$'
  ) not valid,
  add constraint review_decisions_product_identity_checksum_format check (
    product_identity_checksum is null or product_identity_checksum ~ '^[a-f0-9]{64}$'
  ) not valid,
  add constraint review_decisions_structured_revision_binding check (
    decision_type <> 'structured_field' or (
      candidate_revision_id is not null
      and approved_payload_checksum is not null
      and product_identity_checksum is not null
    )
  ) not valid;

create index review_decisions_structured_revision_field_idx
  on cloud.review_decisions (
    candidate_revision_id, review_item_id, field_path, created_at desc, id desc
  )
  where decision_type = 'structured_field';

create or replace function cloud.prevent_bound_review_decision_mutation_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.candidate_revision_id is not null then
    raise exception 'revision-bound review decisions are immutable; insert a new decision'
      using errcode = '55000';
  end if;
  return case when TG_OP = 'DELETE' then old else new end;
end
$$;

create trigger review_decisions_structured_binding_immutable
  before update or delete on cloud.review_decisions
  for each row execute function cloud.prevent_bound_review_decision_mutation_v1();

alter table cloud.product_detail_publication_batches
  add column candidate_revision_id uuid
    references cloud.product_detail_candidate_revisions(id) on delete restrict,
  add column product_identity_checksum text,
  add column mutation_log jsonb not null default jsonb_build_object(
    'keyFeatures', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb),
    'specifications', jsonb_build_object('created', '[]'::jsonb, 'updated', '[]'::jsonb)
  );

alter table cloud.product_detail_publication_batches
  add constraint product_detail_batch_identity_checksum_format check (
    product_identity_checksum is null or product_identity_checksum ~ '^[a-f0-9]{64}$'
  ) not valid,
  add constraint product_detail_batch_revision_binding check (
    candidate_revision_id is null or product_identity_checksum is not null
  ) not valid;

create unique index product_detail_publication_batches_revision_uq
  on cloud.product_detail_publication_batches (candidate_revision_id)
  where candidate_revision_id is not null;

alter table cloud.product_key_features
  add column candidate_revision_id uuid
    references cloud.product_detail_candidate_revisions(id) on delete restrict,
  add column structured_item_id text;

alter table cloud.product_key_features
  add constraint product_key_features_structured_item_not_blank check (
    structured_item_id is null or btrim(structured_item_id) <> ''
  ) not valid,
  add constraint product_key_features_revision_binding check (
    candidate_revision_id is null or (
      structured_item_id is not null and publication_batch_id is not null
    )
  ) not valid;

create index product_key_features_revision_idx
  on cloud.product_key_features (candidate_revision_id, structured_item_id);

alter table cloud.product_characteristics
  drop constraint product_characteristics_product_id_key_key,
  add column record_origin text not null default 'legacy',
  add column structured_item_id text,
  add column candidate_revision_id uuid
    references cloud.product_detail_candidate_revisions(id) on delete restrict;

-- A v1 structured row cannot be proven revision-bound and may have replaced a
-- legacy row. The corrective migration therefore fails closed instead of
-- guessing ownership or rewriting existing data. The approved staging plan
-- must first confirm this count is zero (the local canonical chain is zero).
do $$
begin
  if exists (
    select 1 from cloud.product_detail_publication_batches
    where candidate_revision_id is null
  ) or exists (
    select 1 from cloud.product_key_features
  ) or exists (
    select 1 from cloud.product_characteristics
    where content_kind = 'technical_specification'
      and publication_batch_id is not null
  ) then
    raise exception 'pre-existing v1 structured fields require explicit integrity audit'
      using errcode = '55000';
  end if;
end
$$;

alter table cloud.product_characteristics
  add constraint product_characteristics_record_origin check (
    record_origin in ('legacy', 'structured_product_detail')
  ) not valid,
  add constraint product_characteristics_managed_identity check (
    record_origin <> 'structured_product_detail' or (
      content_kind = 'technical_specification'
      and nullif(btrim(structured_item_id), '') is not null
      and publication_batch_id is not null
      and approval_decision_id is not null
    )
  ) not valid,
  add constraint product_characteristics_revision_binding check (
    candidate_revision_id is null or record_origin = 'structured_product_detail'
  ) not valid;

create unique index product_characteristics_legacy_key_uq
  on cloud.product_characteristics (product_id, key)
  where record_origin = 'legacy';
create unique index product_characteristics_structured_batch_item_uq
  on cloud.product_characteristics (product_id, structured_item_id, publication_batch_id)
  where record_origin = 'structured_product_detail';
create unique index product_characteristics_structured_active_item_uq
  on cloud.product_characteristics (product_id, structured_item_id)
  where record_origin = 'structured_product_detail'
    and publication_status = 'published'
    and archived_at is null;
create index product_characteristics_revision_idx
  on cloud.product_characteristics (candidate_revision_id, structured_item_id);

alter policy product_characteristics_public_read
  on cloud.product_characteristics
  using (
    exists (
      select 1 from cloud.products product
      where product.id = cloud.product_characteristics.product_id
        and product.publication_status = 'published'
    )
    and (
      content_kind <> 'technical_specification'
      or (
        record_origin = 'structured_product_detail'
        and candidate_revision_id is not null
        and reviewer_status = 'approved'
        and publication_status = 'published'
        and archived_at is null
      )
    )
  );

alter table cloud.product_detail_candidate_revisions enable row level security;
alter table cloud.product_detail_candidate_revision_approvals enable row level security;
revoke all on table cloud.product_detail_candidate_revisions from public, anon, authenticated;
revoke all on table cloud.product_detail_candidate_revision_approvals from public, anon, authenticated;

create or replace function cloud.create_structured_product_detail_revision_v1(
  p_candidate_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  candidate cloud.publication_candidates%rowtype;
  product_identity_value jsonb;
  product_identity_checksum_value text;
  candidate_payload_checksum_value text;
  payload_checksum_value text;
  existing_revision cloud.product_detail_candidate_revisions%rowtype;
  revision_number_value integer;
  revision_id_value uuid;
begin
  if not cloud.is_service_request() then
    raise exception 'structured product revision creation requires service role' using errcode = '42501';
  end if;

  select * into candidate
  from cloud.publication_candidates
  where id = p_candidate_id
  for update;
  if not found or candidate.target_product_id is null then
    raise exception 'publication candidate with target product does not exist' using errcode = '22023';
  end if;
  if candidate.schema_version <> 1 then
    raise exception 'only Structured Product Detail schema version 1 is supported' using errcode = '22023';
  end if;

  perform cloud.validate_structured_product_detail_candidate_v1(candidate.candidate_data);
  if (candidate.candidate_data #>> '{product,id}')::uuid <> candidate.target_product_id then
    raise exception 'candidate product identity does not match target product' using errcode = '22023';
  end if;

  product_identity_value := cloud.structured_product_identity_snapshot_v1(candidate.target_product_id);
  if product_identity_value is null or (
    nullif(candidate.candidate_data #>> '{product,sourceUid}', '') is not null
    and candidate.candidate_data #>> '{product,sourceUid}'
      is distinct from product_identity_value ->> 'sourceUid'
  ) then
    raise exception 'candidate product identity could not be snapshotted' using errcode = '22023';
  end if;

  product_identity_checksum_value := cloud.sha256_jsonb_v1(product_identity_value);
  candidate_payload_checksum_value := cloud.sha256_jsonb_v1(candidate.candidate_data);
  payload_checksum_value := cloud.structured_product_detail_payload_checksum_v1(
    candidate.schema_version, product_identity_value, candidate.candidate_data
  );

  perform pg_advisory_xact_lock(hashtextextended(candidate.id::text, 1));
  select * into existing_revision
  from cloud.product_detail_candidate_revisions
  where candidate_id = candidate.id
    and payload_checksum = payload_checksum_value;
  if found then
    return jsonb_build_object(
      'candidateRevisionId', existing_revision.id,
      'candidateId', existing_revision.candidate_id,
      'productId', existing_revision.product_id,
      'revisionNumber', existing_revision.revision_number,
      'schemaVersion', existing_revision.schema_version,
      'payloadChecksum', existing_revision.payload_checksum,
      'productIdentityChecksum', existing_revision.product_identity_checksum,
      'idempotent', true
    );
  end if;

  select coalesce(max(revision_number), 0) + 1 into revision_number_value
  from cloud.product_detail_candidate_revisions
  where candidate_id = candidate.id;

  insert into cloud.product_detail_candidate_revisions (
    candidate_id, revision_number, product_id, schema_version,
    product_identity, product_identity_checksum, candidate_payload,
    candidate_payload_checksum, payload_checksum, created_by
  ) values (
    candidate.id, revision_number_value, candidate.target_product_id,
    candidate.schema_version, product_identity_value,
    product_identity_checksum_value, candidate.candidate_data,
    candidate_payload_checksum_value, payload_checksum_value, p_actor_id
  ) returning id into revision_id_value;

  return jsonb_build_object(
    'candidateRevisionId', revision_id_value,
    'candidateId', candidate.id,
    'productId', candidate.target_product_id,
    'revisionNumber', revision_number_value,
    'schemaVersion', candidate.schema_version,
    'payloadChecksum', payload_checksum_value,
    'productIdentityChecksum', product_identity_checksum_value,
    'idempotent', false
  );
end
$$;

create or replace function cloud.publish_structured_product_detail_v2(
  p_candidate_revision_id uuid,
  p_schema_version integer,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  revision cloud.product_detail_candidate_revisions%rowtype;
  candidate cloud.publication_candidates%rowtype;
  revision_approval cloud.product_detail_candidate_revision_approvals%rowtype;
  existing_batch cloud.product_detail_publication_batches%rowtype;
  previous_batch cloud.product_detail_publication_batches%rowtype;
  review_item_id_value uuid;
  decision cloud.review_decisions%rowtype;
  item jsonb;
  current_product_identity jsonb;
  current_payload_checksum text;
  previous_state_value jsonb;
  mutation_log_value jsonb;
  publication_batch_id_value uuid;
  key_feature_count integer;
  specification_count integer;
begin
  if not cloud.is_service_request() then
    raise exception 'structured product publication requires service role' using errcode = '42501';
  end if;
  if p_schema_version <> 1 or nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'schema version 1 and idempotency key are required' using errcode = '22023';
  end if;

  -- All review, identity, hash and idempotency checks precede the first data
  -- mutation. Advisory locking is transaction-local and changes no data.
  select * into revision
  from cloud.product_detail_candidate_revisions
  where id = p_candidate_revision_id;
  if not found or revision.schema_version <> p_schema_version then
    raise exception 'supported candidate revision does not exist' using errcode = '22023';
  end if;
  if revision.payload_checksum <> cloud.structured_product_detail_payload_checksum_v1(
       revision.schema_version, revision.product_identity, revision.candidate_payload
     )
     or revision.candidate_payload_checksum <> cloud.sha256_jsonb_v1(revision.candidate_payload)
     or revision.product_identity_checksum <> cloud.sha256_jsonb_v1(revision.product_identity) then
    raise exception 'candidate revision checksum validation failed' using errcode = '22023';
  end if;

  select * into candidate
  from cloud.publication_candidates
  where id = revision.candidate_id
  for update;
  if not found
     or candidate.target_product_id is distinct from revision.product_id
     or candidate.schema_version <> revision.schema_version
     or candidate.candidate_data is distinct from revision.candidate_payload then
    raise exception 'candidate changed after immutable revision creation' using errcode = '22023';
  end if;
  if candidate.validation_status not in ('approved', 'published')
     or candidate.approved_by is null
     or candidate.approved_at is null then
    raise exception 'candidate revision has no current manual approval' using errcode = '22023';
  end if;

  perform cloud.validate_structured_product_detail_candidate_v1(revision.candidate_payload);
  current_product_identity := cloud.structured_product_identity_snapshot_v1(revision.product_id);
  if current_product_identity is distinct from revision.product_identity
     or cloud.sha256_jsonb_v1(current_product_identity) <> revision.product_identity_checksum then
    raise exception 'product identity changed after candidate review' using errcode = '22023';
  end if;
  current_payload_checksum := cloud.structured_product_detail_payload_checksum_v1(
    revision.schema_version, current_product_identity, revision.candidate_payload
  );
  if current_payload_checksum <> revision.payload_checksum then
    raise exception 'candidate revision payload checksum is stale' using errcode = '22023';
  end if;

  select id into review_item_id_value
  from cloud.review_items
  where import_product_id = candidate.import_product_id
    and status = 'approved';
  if review_item_id_value is null then
    raise exception 'candidate revision has no approved manual review item' using errcode = '22023';
  end if;

  select * into revision_approval
  from cloud.product_detail_candidate_revision_approvals
  where candidate_revision_id = revision.id;
  if not found
     or revision_approval.review_item_id <> review_item_id_value
     or revision_approval.decision <> 'approve'
     or revision_approval.reviewer_id <> candidate.approved_by
     or revision_approval.approved_at is distinct from candidate.approved_at
     or revision_approval.approved_at < revision.created_at
     or revision_approval.payload_checksum <> revision.payload_checksum
     or revision_approval.product_identity_checksum <> revision.product_identity_checksum then
    raise exception 'candidate approval is not bound to this immutable revision' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(revision.candidate_payload -> 'keyFeatures') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.keyFeatures.' || (item ->> 'key')
    order by created_at desc, id desc
    limit 1;
    if not found
       or decision.candidate_revision_id is distinct from revision.id
       or decision.approved_payload_checksum is distinct from revision.payload_checksum
       or decision.product_identity_checksum is distinct from revision.product_identity_checksum
       or decision.created_at < revision.created_at
       or decision.decision <> 'approve'
       or decision.approved_value is distinct from item then
      raise exception 'key feature % lacks a current revision-bound approval', item ->> 'key'
        using errcode = '22023';
    end if;
  end loop;

  for item in select value from jsonb_array_elements(revision.candidate_payload -> 'specifications') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.specifications.' || (item ->> 'key')
    order by created_at desc, id desc
    limit 1;
    if not found
       or decision.candidate_revision_id is distinct from revision.id
       or decision.approved_payload_checksum is distinct from revision.payload_checksum
       or decision.product_identity_checksum is distinct from revision.product_identity_checksum
       or decision.created_at < revision.created_at
       or decision.decision <> 'approve'
       or decision.approved_value is distinct from item then
      raise exception 'specification % lacks a current revision-bound approval', item ->> 'key'
        using errcode = '22023';
    end if;
  end loop;

  perform pg_advisory_xact_lock(hashtextextended(revision.product_id::text, 0));

  select * into existing_batch
  from cloud.product_detail_publication_batches
  where idempotency_key = p_idempotency_key;
  if found then
    if existing_batch.candidate_revision_id is distinct from revision.id
       or existing_batch.payload_checksum <> revision.payload_checksum
       or existing_batch.product_identity_checksum is distinct from revision.product_identity_checksum then
      raise exception 'idempotency key belongs to a different publication revision' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'publicationBatchId', existing_batch.id,
      'candidateId', existing_batch.candidate_id,
      'candidateRevisionId', existing_batch.candidate_revision_id,
      'productId', existing_batch.product_id,
      'status', existing_batch.status,
      'keyFeatureCount', coalesce((existing_batch.result_summary ->> 'keyFeatureCount')::integer, 0),
      'specificationCount', coalesce((existing_batch.result_summary ->> 'specificationCount')::integer, 0),
      'idempotent', true
    );
  end if;
  if exists (
    select 1 from cloud.product_detail_publication_batches
    where candidate_revision_id = revision.id
  ) then
    raise exception 'candidate revision was already published under another idempotency key'
      using errcode = '23505';
  end if;
  if candidate.validation_status <> 'approved' then
    raise exception 'published candidate cannot create a new publication batch' using errcode = '22023';
  end if;

  select * into previous_batch
  from cloud.product_detail_publication_batches
  where product_id = revision.product_id and status = 'published'
  order by created_at desc, id desc
  limit 1;

  select jsonb_build_object(
    'candidate', jsonb_build_object(
      'id', candidate.id,
      'validation_status', candidate.validation_status,
      'updated_at', candidate.updated_at
    ),
    'previousBatch', case when previous_batch.id is null then null else jsonb_build_object(
      'id', previous_batch.id,
      'status', previous_batch.status
    ) end,
    'keyFeatures', coalesce((
      select jsonb_agg(to_jsonb(feature) order by feature.sort_order, feature.id)
      from cloud.product_key_features feature
      where feature.product_id = revision.product_id
        and feature.candidate_revision_id is not null
        and feature.publication_status = 'published'
        and feature.archived_at is null
    ), '[]'::jsonb),
    'specifications', coalesce((
      select jsonb_agg(to_jsonb(characteristic)
        order by characteristic.group_sort_order nulls first,
          characteristic.sort_order, characteristic.id)
      from cloud.product_characteristics characteristic
      where characteristic.product_id = revision.product_id
        and characteristic.record_origin = 'structured_product_detail'
        and characteristic.candidate_revision_id is not null
        and characteristic.publication_status = 'published'
        and characteristic.archived_at is null
    ), '[]'::jsonb)
  ) into previous_state_value;

  key_feature_count := jsonb_array_length(revision.candidate_payload -> 'keyFeatures');
  specification_count := jsonb_array_length(revision.candidate_payload -> 'specifications');

  insert into cloud.product_detail_publication_batches (
    product_id, candidate_id, candidate_revision_id, schema_version,
    idempotency_key, payload_checksum, product_identity_checksum,
    previous_batch_id, status, actor_id, previous_state, result_summary
  ) values (
    revision.product_id, revision.candidate_id, revision.id, revision.schema_version,
    p_idempotency_key, revision.payload_checksum, revision.product_identity_checksum,
    previous_batch.id, 'published', p_actor_id, previous_state_value,
    jsonb_build_object(
      'keyFeatureCount', key_feature_count,
      'specificationCount', specification_count
    )
  ) returning id into publication_batch_id_value;

  if previous_batch.id is not null then
    update cloud.product_detail_publication_batches
    set status = 'superseded'
    where id = previous_batch.id;
  end if;

  update cloud.product_key_features
  set publication_status = 'superseded', archived_at = now(), updated_at = now()
  where product_id = revision.product_id
    and candidate_revision_id is not null
    and publication_status = 'published'
    and archived_at is null;

  update cloud.product_characteristics
  set publication_status = 'superseded', archived_at = now(), updated_at = now()
  where product_id = revision.product_id
    and record_origin = 'structured_product_detail'
    and candidate_revision_id is not null
    and publication_status = 'published'
    and archived_at is null;

  for item in select value from jsonb_array_elements(revision.candidate_payload -> 'keyFeatures') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.keyFeatures.' || (item ->> 'key')
    order by created_at desc, id desc limit 1;
    insert into cloud.product_key_features (
      product_id, field_key, structured_item_id, candidate_revision_id,
      text, sort_order, source_type, source_ref, source_url,
      review_status, publication_status, publication_batch_id, approval_decision_id
    ) values (
      revision.product_id, item ->> 'key', item ->> 'key', revision.id,
      item ->> 'text', (item ->> 'sortOrder')::integer,
      item #>> '{source,type}', item #>> '{source,ref}', nullif(item #>> '{source,url}', ''),
      'approved', 'published', publication_batch_id_value, decision.id
    );
  end loop;

  for item in select value from jsonb_array_elements(revision.candidate_payload -> 'specifications') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.specifications.' || (item ->> 'key')
    order by created_at desc, id desc limit 1;
    insert into cloud.product_characteristics (
      product_id, key, record_origin, structured_item_id, candidate_revision_id,
      display_name, raw_value, normalized_value, unit, sort_order,
      confidence, source_reference, reviewer_status, content_kind, group_key,
      group_title, group_sort_order, source_type, source_url, publication_status,
      publication_batch_id, approval_decision_id, archived_at, updated_at
    ) values (
      revision.product_id, 'structured-' || (item ->> 'key'),
      'structured_product_detail', item ->> 'key', revision.id,
      item ->> 'label', item ->> 'value', item ->> 'value', nullif(item ->> 'unit', ''),
      (item ->> 'sortOrder')::integer, 'reviewed', item #>> '{source,ref}', 'approved',
      'technical_specification', nullif(item #>> '{group,key}', ''),
      nullif(item #>> '{group,title}', ''), nullif(item #>> '{group,sortOrder}', '')::integer,
      item #>> '{source,type}', nullif(item #>> '{source,url}', ''), 'published',
      publication_batch_id_value, decision.id, null, now()
    );
  end loop;

  select jsonb_build_object(
    'keyFeatures', jsonb_build_object(
      'created', coalesce((
        select jsonb_agg(to_jsonb(feature) order by feature.id)
        from cloud.product_key_features feature
        where feature.publication_batch_id = publication_batch_id_value
          and feature.candidate_revision_id = revision.id
      ), '[]'::jsonb),
      'updated', previous_state_value -> 'keyFeatures'
    ),
    'specifications', jsonb_build_object(
      'created', coalesce((
        select jsonb_agg(to_jsonb(characteristic) order by characteristic.id)
        from cloud.product_characteristics characteristic
        where characteristic.publication_batch_id = publication_batch_id_value
          and characteristic.candidate_revision_id = revision.id
          and characteristic.record_origin = 'structured_product_detail'
      ), '[]'::jsonb),
      'updated', previous_state_value -> 'specifications'
    )
  ) into mutation_log_value;

  update cloud.product_detail_publication_batches
  set mutation_log = mutation_log_value
  where id = publication_batch_id_value;

  insert into cloud.publication_events (
    product_id, candidate_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    revision.product_id, revision.candidate_id,
    case when previous_batch.id is null then 'created' else 'updated' end,
    previous_state_value, revision.candidate_payload, p_actor_id,
    jsonb_build_object(
      'contract', 'structured-product-detail-integrity-v1',
      'publicationBatchId', publication_batch_id_value,
      'candidateRevisionId', revision.id,
      'payloadChecksum', revision.payload_checksum,
      'productIdentityChecksum', revision.product_identity_checksum
    )
  );

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source
  ) values (
    p_actor_id, 'publish', 'product_detail_publication_batch', publication_batch_id_value,
    previous_state_value, mutation_log_value,
    'cloud_api.publish_structured_product_detail_v2'
  );

  return jsonb_build_object(
    'publicationBatchId', publication_batch_id_value,
    'candidateId', revision.candidate_id,
    'candidateRevisionId', revision.id,
    'productId', revision.product_id,
    'status', 'published',
    'keyFeatureCount', key_feature_count,
    'specificationCount', specification_count,
    'idempotent', false
  );
end
$$;

create or replace function cloud.rollback_structured_product_detail_v2(
  p_publication_batch_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  batch cloud.product_detail_publication_batches%rowtype;
  before_row jsonb;
  previous_batch_before jsonb;
  key_feature_count integer;
  specification_count integer;
  affected_count integer;
  expected_count integer;
begin
  if not cloud.is_service_request() then
    raise exception 'structured product rollback requires service role' using errcode = '42501';
  end if;

  select * into batch
  from cloud.product_detail_publication_batches
  where id = p_publication_batch_id;
  if not found or batch.candidate_revision_id is null then
    raise exception 'revision-bound publication batch does not exist' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(batch.product_id::text, 0));
  select * into batch
  from cloud.product_detail_publication_batches
  where id = p_publication_batch_id
  for update;

  key_feature_count := coalesce((batch.result_summary ->> 'keyFeatureCount')::integer, 0);
  specification_count := coalesce((batch.result_summary ->> 'specificationCount')::integer, 0);
  if batch.status = 'rolled_back' then
    return jsonb_build_object(
      'publicationBatchId', batch.id,
      'candidateId', batch.candidate_id,
      'candidateRevisionId', batch.candidate_revision_id,
      'productId', batch.product_id,
      'status', 'rolled_back',
      'keyFeatureCount', key_feature_count,
      'specificationCount', specification_count,
      'idempotent', true
    );
  end if;
  if batch.status <> 'published' or exists (
    select 1 from cloud.product_detail_publication_batches newer
    where newer.product_id = batch.product_id
      and newer.status = 'published'
      and (newer.created_at, newer.id) > (batch.created_at, batch.id)
  ) then
    raise exception 'only the latest published product-detail batch can be rolled back'
      using errcode = '22023';
  end if;

  -- Rows created by this batch are removed. The batch and audit records remain
  -- as immutable publication history.
  delete from cloud.product_key_features
  where publication_batch_id = batch.id
    and candidate_revision_id = batch.candidate_revision_id;
  get diagnostics affected_count = row_count;
  expected_count := coalesce(
    jsonb_array_length(batch.mutation_log #> '{keyFeatures,created}'), 0
  );
  if affected_count <> expected_count then
    raise exception 'publication batch key-feature state is incomplete for exact rollback'
      using errcode = '55000';
  end if;

  delete from cloud.product_characteristics
  where publication_batch_id = batch.id
    and candidate_revision_id = batch.candidate_revision_id
    and record_origin = 'structured_product_detail';
  get diagnostics affected_count = row_count;
  expected_count := coalesce(
    jsonb_array_length(batch.mutation_log #> '{specifications,created}'), 0
  );
  if affected_count <> expected_count then
    raise exception 'publication batch specification state is incomplete for exact rollback'
      using errcode = '55000';
  end if;

  for before_row in
    select value from jsonb_array_elements(batch.previous_state -> 'keyFeatures')
  loop
    update cloud.product_key_features set
      product_id = (before_row ->> 'product_id')::uuid,
      field_key = before_row ->> 'field_key',
      text = before_row ->> 'text',
      sort_order = (before_row ->> 'sort_order')::integer,
      source_type = before_row ->> 'source_type',
      source_ref = before_row ->> 'source_ref',
      source_url = before_row ->> 'source_url',
      review_status = before_row ->> 'review_status',
      publication_status = before_row ->> 'publication_status',
      publication_batch_id = nullif(before_row ->> 'publication_batch_id', '')::uuid,
      approval_decision_id = nullif(before_row ->> 'approval_decision_id', '')::uuid,
      candidate_revision_id = nullif(before_row ->> 'candidate_revision_id', '')::uuid,
      structured_item_id = before_row ->> 'structured_item_id',
      created_at = (before_row ->> 'created_at')::timestamptz,
      updated_at = (before_row ->> 'updated_at')::timestamptz,
      archived_at = nullif(before_row ->> 'archived_at', '')::timestamptz
    where id = (before_row ->> 'id')::uuid
      and product_id = batch.product_id;
    if not found then
      raise exception 'previous key-feature row is unavailable for exact rollback'
        using errcode = '55000';
    end if;
  end loop;

  for before_row in
    select value from jsonb_array_elements(batch.previous_state -> 'specifications')
  loop
    update cloud.product_characteristics set
      product_id = (before_row ->> 'product_id')::uuid,
      key = before_row ->> 'key',
      display_name = before_row ->> 'display_name',
      raw_value = before_row ->> 'raw_value',
      normalized_value = before_row ->> 'normalized_value',
      unit = before_row ->> 'unit',
      sort_order = (before_row ->> 'sort_order')::integer,
      confidence = (before_row ->> 'confidence')::cloud.confidence_level,
      source_reference = before_row ->> 'source_reference',
      reviewer_status = before_row ->> 'reviewer_status',
      content_kind = before_row ->> 'content_kind',
      group_key = before_row ->> 'group_key',
      group_title = before_row ->> 'group_title',
      group_sort_order = nullif(before_row ->> 'group_sort_order', '')::integer,
      source_type = before_row ->> 'source_type',
      source_url = before_row ->> 'source_url',
      publication_status = before_row ->> 'publication_status',
      publication_batch_id = nullif(before_row ->> 'publication_batch_id', '')::uuid,
      approval_decision_id = nullif(before_row ->> 'approval_decision_id', '')::uuid,
      archived_at = nullif(before_row ->> 'archived_at', '')::timestamptz,
      record_origin = before_row ->> 'record_origin',
      structured_item_id = before_row ->> 'structured_item_id',
      candidate_revision_id = nullif(before_row ->> 'candidate_revision_id', '')::uuid,
      created_at = (before_row ->> 'created_at')::timestamptz,
      updated_at = (before_row ->> 'updated_at')::timestamptz
    where id = (before_row ->> 'id')::uuid
      and product_id = batch.product_id
      and record_origin = 'structured_product_detail';
    if not found then
      raise exception 'previous specification row is unavailable for exact rollback'
        using errcode = '55000';
    end if;
  end loop;

  previous_batch_before := batch.previous_state -> 'previousBatch';
  if previous_batch_before is not null and previous_batch_before <> 'null'::jsonb then
    update cloud.product_detail_publication_batches
    set status = previous_batch_before ->> 'status'
    where id = (previous_batch_before ->> 'id')::uuid
      and product_id = batch.product_id;
    if not found then
      raise exception 'previous publication batch is unavailable for exact rollback'
        using errcode = '55000';
    end if;
  end if;

  update cloud.product_detail_publication_batches
  set status = 'rolled_back', rolled_back_at = now(), rolled_back_by = p_actor_id
  where id = batch.id;

  insert into cloud.publication_events (
    product_id, candidate_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    batch.product_id, batch.candidate_id, 'rollback', batch.mutation_log,
    batch.previous_state, p_actor_id,
    jsonb_build_object(
      'contract', 'structured-product-detail-integrity-v1',
      'publicationBatchId', batch.id,
      'candidateRevisionId', batch.candidate_revision_id,
      'restoredBatchId', batch.previous_batch_id
    )
  );

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source
  ) values (
    p_actor_id, 'restore', 'product_detail_publication_batch', batch.id,
    batch.mutation_log, batch.previous_state,
    'cloud_api.rollback_structured_product_detail_v2'
  );

  return jsonb_build_object(
    'publicationBatchId', batch.id,
    'candidateId', batch.candidate_id,
    'candidateRevisionId', batch.candidate_revision_id,
    'productId', batch.product_id,
    'status', 'rolled_back',
    'keyFeatureCount', key_feature_count,
    'specificationCount', specification_count,
    'idempotent', false
  );
end
$$;

-- Replace the service-only Storefront projection forward-only. The public DTO
-- stays unchanged, while only revision-bound managed rows are eligible.
create or replace function cloud.cloud_storefront_preview_catalog() returns jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, cloud, extensions
as $$
declare result jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'cloud storefront preview requires service role' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generatedAt', coalesce((select max(updated_at) from cloud.products), now()),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'title', p.title,
        'model', p.model,
        'shortDescription', p.short_description,
        'description', p.full_description,
        'manufacturerId', p.manufacturer_id,
        'categoryId', p.category_id,
        'publicationStatus', p.publication_status,
        'published', p.published,
        'reviewState', p.review_state,
        'createdAt', p.created_at,
        'updatedAt', p.updated_at,
        'applicationAreas', coalesce(areas.value, '[]'::jsonb),
        'keyFeatures', coalesce(features.value, '[]'::jsonb),
        'characteristicGroups', coalesce(characteristic_groups.value, '[]'::jsonb),
        'media', coalesce(media.value, '[]'::jsonb),
        'documents', coalesce(documents.value, '[]'::jsonb),
        'registrations', coalesce(registrations.value, '[]'::jsonb)
      ) order by lower(p.title), p.id)
      from cloud.products p
      left join lateral (
        select jsonb_agg(
          jsonb_build_object('id', a.id, 'name', a.display_name)
          order by a.display_name
        ) value
        from cloud.product_application_areas pa
        join cloud.application_areas a on a.id = pa.application_area_id
        where pa.product_id = p.id
      ) areas on true
      left join lateral (
        select jsonb_agg(
          jsonb_build_object('text', feature.text, 'sortOrder', feature.sort_order)
          order by feature.sort_order, feature.id
        ) value
        from cloud.product_key_features feature
        where feature.product_id = p.id
          and feature.candidate_revision_id is not null
          and feature.review_status = 'approved'
          and feature.publication_status = 'published'
          and feature.archived_at is null
      ) features on true
      left join lateral (
        select jsonb_agg(
          jsonb_build_object(
            'key', grouped.group_key_value,
            'title', grouped.group_title_value,
            'sortOrder', grouped.group_sort_order_value,
            'items', grouped.items
          ) order by grouped.group_sort_order_value,
            grouped.group_title_value, grouped.group_key_value
        ) value
        from (
          select
            coalesce(nullif(characteristic.group_key, ''), 'general') as group_key_value,
            coalesce(nullif(characteristic.group_title, ''), 'Характеристики') as group_title_value,
            coalesce(characteristic.group_sort_order, 0) as group_sort_order_value,
            jsonb_agg(
              jsonb_build_object(
                'label', characteristic.display_name,
                'value', characteristic.normalized_value,
                'unit', characteristic.unit,
                'sortOrder', characteristic.sort_order
              ) order by characteristic.sort_order, characteristic.display_name, characteristic.id
            ) as items
          from cloud.product_characteristics characteristic
          where characteristic.product_id = p.id
            and characteristic.record_origin = 'structured_product_detail'
            and characteristic.candidate_revision_id is not null
            and characteristic.content_kind = 'technical_specification'
            and characteristic.reviewer_status = 'approved'
            and characteristic.publication_status = 'published'
            and characteristic.archived_at is null
          group by
            coalesce(nullif(characteristic.group_key, ''), 'general'),
            coalesce(nullif(characteristic.group_title, ''), 'Характеристики'),
            coalesce(characteristic.group_sort_order, 0)
        ) grouped
      ) characteristic_groups on true
      left join lateral (
        select jsonb_agg(
          jsonb_build_object('url', pm.source_url, 'role', pm.role, 'format', pm.media_format)
          order by pm.sort_order, pm.source_url
        ) value
        from cloud.product_media pm where pm.product_id = p.id
      ) media on true
      left join lateral (
        select jsonb_agg(jsonb_build_object(
          'title', pd.title,
          'kind', pd.document_type,
          'publicUrl', so.source_url,
          'language', pd.language,
          'isOfficial', pd.is_official
        ) order by pd.title) filter (where so.source_url is not null) value
        from cloud.product_documents pd
        join cloud.storage_objects so on so.id = pd.storage_object_id
        where pd.product_id = p.id
      ) documents on true
      left join lateral (
        select jsonb_agg(jsonb_build_object(
          'registrationNumber', rr.registration_number,
          'status', rr.status,
          'sourceUrl', rr.source_url
        ) order by rr.registration_number nulls last, rr.id) value
        from cloud.product_registration_links pr
        join cloud.registration_records rr on rr.id = pr.registration_record_id
        where pr.product_id = p.id
      ) registrations on true
      where p.archived_at is null
    ), '[]'::jsonb),
    'manufacturers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', display_name, 'description', description,
        'countryCode', country_code, 'website', website,
        'createdAt', created_at, 'updatedAt', updated_at
      ) order by display_name)
      from cloud.manufacturers
      where publication_status = 'published' and archived_at is null
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', display_name, 'description', description,
        'position', sort_order, 'createdAt', created_at, 'updatedAt', updated_at
      ) order by sort_order, display_name)
      from cloud.categories
      where publication_status = 'published' and assignable and archived_at is null
    ), '[]'::jsonb),
    'applicationAreas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', display_name, 'description', description,
        'createdAt', created_at, 'updatedAt', updated_at
      ) order by display_name)
      from cloud.application_areas
      where publication_status = 'published' and archived_at is null
    ), '[]'::jsonb)
  ) into result;

  return result;
end
$$;

create or replace function cloud_api.create_structured_product_detail_revision_v1(
  p_candidate_id uuid,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.create_structured_product_detail_revision_v1(p_candidate_id, p_actor_id)
$$;

create or replace function cloud_api.publish_structured_product_detail_v2(
  p_candidate_revision_id uuid,
  p_schema_version integer,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.publish_structured_product_detail_v2(
    p_candidate_revision_id, p_schema_version, p_idempotency_key, p_actor_id
  )
$$;

create or replace function cloud_api.rollback_structured_product_detail_v2(
  p_publication_batch_id uuid,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.rollback_structured_product_detail_v2(p_publication_batch_id, p_actor_id)
$$;

-- The vulnerable v1 service surface is disabled by the forward-only
-- correction. Historical functions remain for migration-chain reproducibility.
revoke execute on function cloud_api.publish_structured_product_detail_v1(uuid, integer, text, uuid)
  from service_role;
revoke execute on function cloud_api.rollback_structured_product_detail_v1(uuid, uuid)
  from service_role;

revoke all on function cloud.sha256_jsonb_v1(jsonb) from public, anon, authenticated, service_role;
revoke all on function cloud.structured_product_identity_snapshot_v1(uuid) from public, anon, authenticated, service_role;
revoke all on function cloud.structured_product_detail_payload_checksum_v1(integer, jsonb, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function cloud.prevent_structured_review_binding_mutation_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.prevent_bound_review_decision_mutation_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.create_structured_product_detail_revision_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.publish_structured_product_detail_v2(uuid, integer, text, uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud.rollback_structured_product_detail_v2(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud_api.create_structured_product_detail_revision_v1(uuid, uuid)
  from public, anon, authenticated;
revoke all on function cloud_api.publish_structured_product_detail_v2(uuid, integer, text, uuid)
  from public, anon, authenticated;
revoke all on function cloud_api.rollback_structured_product_detail_v2(uuid, uuid)
  from public, anon, authenticated;
grant execute on function cloud_api.create_structured_product_detail_revision_v1(uuid, uuid)
  to service_role;
grant execute on function cloud_api.publish_structured_product_detail_v2(uuid, integer, text, uuid)
  to service_role;
grant execute on function cloud_api.rollback_structured_product_detail_v2(uuid, uuid)
  to service_role;

comment on table cloud.product_detail_candidate_revisions is
  'Immutable canonical candidate revisions bound to product identity and SHA-256 checksums.';
comment on table cloud.product_detail_candidate_revision_approvals is
  'Immutable manual approval binding for one exact candidate revision and product identity.';
comment on column cloud.product_characteristics.record_origin is
  'Ownership boundary: legacy rows and structured publication rows never share an upsert identity.';

commit;
