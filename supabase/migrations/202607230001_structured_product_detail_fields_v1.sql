-- Structured Product Detail Fields v1.
-- Additive only. Defines review-gated, service-only publication and rollback;
-- it does not backfill, approve, publish, or otherwise alter Product Data.

begin;

create table cloud.product_detail_publication_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  candidate_id uuid not null references cloud.publication_candidates(id) on delete restrict,
  schema_version integer not null check (schema_version = 1),
  idempotency_key text not null unique,
  payload_checksum text not null check (payload_checksum ~ '^[a-f0-9]{64}$'),
  previous_batch_id uuid references cloud.product_detail_publication_batches(id) on delete restrict,
  status text not null check (status in ('published', 'superseded', 'rolled_back')),
  actor_id uuid not null,
  previous_state jsonb not null default '{"keyFeatures":[],"specifications":[]}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  rolled_back_by uuid,
  unique (candidate_id, payload_checksum),
  constraint product_detail_batch_rollback_identity check (
    (rolled_back_at is null) = (rolled_back_by is null)
  )
);

create index product_detail_publication_batches_product_created_idx
  on cloud.product_detail_publication_batches (product_id, created_at desc);

create table cloud.product_key_features (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  field_key text not null,
  text text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  source_type text not null,
  source_ref text not null,
  source_url text,
  review_status text not null check (
    review_status in ('needs_manual_approval', 'approved', 'rejected', 'needs_changes')
  ),
  publication_status text not null check (
    publication_status in ('unpublished', 'published', 'superseded', 'rolled_back')
  ),
  publication_batch_id uuid references cloud.product_detail_publication_batches(id) on delete restrict,
  approval_decision_id uuid references cloud.review_decisions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (product_id, field_key, publication_batch_id),
  constraint product_key_features_not_blank check (
    btrim(field_key) <> '' and btrim(text) <> '' and
    btrim(source_type) <> '' and btrim(source_ref) <> ''
  ),
  constraint product_key_features_source_url check (
    source_url is null or source_url ~ '^https://'
  ),
  constraint product_key_features_published_approval check (
    publication_status <> 'published' or (
      review_status = 'approved' and publication_batch_id is not null and
      approval_decision_id is not null and archived_at is null
    )
  )
);

create unique index product_key_features_active_key_uq
  on cloud.product_key_features (product_id, field_key)
  where publication_status = 'published' and archived_at is null;
create index product_key_features_public_order_idx
  on cloud.product_key_features (product_id, sort_order, id)
  where publication_status = 'published' and archived_at is null;

-- Existing names remain canonical: display_name = label,
-- normalized_value = public value, source_reference = provenance ref, and
-- reviewer_status = review status. New columns only add structured/publication
-- semantics; legacy imported metadata remains unpublished.
alter table cloud.product_characteristics
  add column content_kind text not null default 'legacy_metadata',
  add column group_key text,
  add column group_title text,
  add column group_sort_order integer,
  add column source_type text,
  add column source_url text,
  add column publication_status text not null default 'unpublished',
  add column publication_batch_id uuid references cloud.product_detail_publication_batches(id) on delete restrict,
  add column approval_decision_id uuid references cloud.review_decisions(id) on delete restrict,
  add column archived_at timestamptz;

alter table cloud.product_characteristics
  add constraint product_characteristics_content_kind check (
    content_kind in ('legacy_metadata', 'technical_specification')
  ) not valid,
  add constraint product_characteristics_group_order check (
    group_sort_order is null or group_sort_order >= 0
  ) not valid,
  add constraint product_characteristics_source_url check (
    source_url is null or source_url ~ '^https://'
  ) not valid,
  add constraint product_characteristics_publication_status check (
    publication_status in ('unpublished', 'published', 'superseded', 'rolled_back')
  ) not valid,
  add constraint product_characteristics_structured_contract check (
    content_kind <> 'technical_specification' or (
      btrim(display_name) <> '' and btrim(normalized_value) <> '' and
      nullif(btrim(source_type), '') is not null and
      nullif(btrim(source_reference), '') is not null
    )
  ) not valid,
  add constraint product_characteristics_published_approval check (
    publication_status <> 'published' or (
      content_kind = 'technical_specification' and
      reviewer_status = 'approved' and publication_batch_id is not null and
      approval_decision_id is not null and archived_at is null
    )
  ) not valid;

create index product_characteristics_public_structured_order_idx
  on cloud.product_characteristics (
    product_id,
    group_sort_order,
    sort_order,
    id
  )
  where content_kind = 'technical_specification'
    and publication_status = 'published'
    and archived_at is null;

-- Preserve the legacy policy for legacy rows while ensuring a future direct
-- Cloud read can never expose an unapproved structured specification.
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
        reviewer_status = 'approved'
        and publication_status = 'published'
        and archived_at is null
      )
    )
  );

alter table cloud.product_detail_publication_batches enable row level security;
alter table cloud.product_key_features enable row level security;
revoke all on table cloud.product_detail_publication_batches from public, anon, authenticated;
revoke all on table cloud.product_key_features from public, anon, authenticated;

create or replace function cloud.validate_structured_product_detail_candidate_v1(p_payload jsonb)
returns void
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  item jsonb;
  normalized_label text;
begin
  if jsonb_typeof(p_payload) is distinct from 'object'
     or p_payload ->> 'schemaVersion' is distinct from '1'
     or jsonb_typeof(p_payload -> 'product') is distinct from 'object'
     or coalesce(p_payload #>> '{product,id}', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or jsonb_typeof(p_payload -> 'keyFeatures') is distinct from 'array'
     or jsonb_typeof(p_payload -> 'specifications') is distinct from 'array' then
    raise exception 'invalid Structured Product Detail v1 candidate' using errcode = '22023';
  end if;

  if jsonb_array_length(p_payload -> 'keyFeatures') > 100
     or jsonb_array_length(p_payload -> 'specifications') > 500 then
    raise exception 'Structured Product Detail candidate exceeds field limits' using errcode = '22023';
  end if;

  if (select count(*) <> count(distinct value ->> 'key') from jsonb_array_elements(p_payload -> 'keyFeatures'))
     or (select count(*) <> count(distinct value ->> 'key') from jsonb_array_elements(p_payload -> 'specifications')) then
    raise exception 'Structured Product Detail field keys must be unique' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_payload -> 'keyFeatures') loop
    if coalesce(item ->> 'key', '') !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
       or nullif(btrim(item ->> 'text'), '') is null
       or item ->> 'text' ~ '[<>]'
       or coalesce((item ->> 'sortOrder')::integer, -1) < 0
       or nullif(btrim(item #>> '{source,type}'), '') is null
       or nullif(btrim(item #>> '{source,ref}'), '') is null
       or (item #>> '{source,url}' is not null and item #>> '{source,url}' !~ '^https://') then
      raise exception 'invalid structured key feature %', item ->> 'key' using errcode = '22023';
    end if;
  end loop;

  for item in select value from jsonb_array_elements(p_payload -> 'specifications') loop
    normalized_label := regexp_replace(lower(btrim(item ->> 'label')), '\s+', ' ', 'g');
    if coalesce(item ->> 'key', '') !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
       or nullif(btrim(item ->> 'label'), '') is null
       or nullif(btrim(item ->> 'value'), '') is null
       or item ->> 'label' ~ '[<>]'
       or item ->> 'value' ~ '[<>]'
       or coalesce((item ->> 'sortOrder')::integer, -1) < 0
       or normalized_label = any(array[
         'артикул','категория','модель','область применения','применение',
         'производитель','регистрационное удостоверение','страна производства',
         'тип товара','цена','application area','category','country',
         'country of origin','manufacturer','model','product type',
         'registration number','sku','price'
       ])
       or nullif(btrim(item #>> '{source,type}'), '') is null
       or nullif(btrim(item #>> '{source,ref}'), '') is null
       or (item #>> '{source,url}' is not null and item #>> '{source,url}' !~ '^https://')
       or (item -> 'group' is not null and item -> 'group' <> 'null'::jsonb and (
         coalesce(item #>> '{group,key}', '') !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
         or nullif(btrim(item #>> '{group,title}'), '') is null
         or coalesce((item #>> '{group,sortOrder}')::integer, -1) < 0
       )) then
      raise exception 'invalid structured specification %', item ->> 'key' using errcode = '22023';
    end if;
  end loop;
end
$$;

create or replace function cloud.publish_structured_product_detail_v1(
  p_candidate_id uuid,
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
  candidate cloud.publication_candidates%rowtype;
  product cloud.products%rowtype;
  existing_batch cloud.product_detail_publication_batches%rowtype;
  previous_batch_id_value uuid;
  publication_batch_id_value uuid;
  review_item_id_value uuid;
  decision cloud.review_decisions%rowtype;
  item jsonb;
  previous_state_value jsonb;
  payload_checksum_value text;
  key_feature_count integer;
  specification_count integer;
  result_value jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'structured product publication requires service role' using errcode = '42501';
  end if;
  if p_schema_version <> 1 or nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'schema version 1 and idempotency key are required' using errcode = '22023';
  end if;

  select * into candidate from cloud.publication_candidates where id = p_candidate_id for update;
  if not found
     or candidate.schema_version <> p_schema_version
     or candidate.validation_status <> 'approved'
     or candidate.approved_by is null
     or candidate.approved_at is null
     or candidate.target_product_id is null then
    raise exception 'publication candidate is not approved for Structured Product Detail publication' using errcode = '22023';
  end if;

  perform cloud.validate_structured_product_detail_candidate_v1(candidate.candidate_data);
  if (candidate.candidate_data #>> '{product,id}')::uuid <> candidate.target_product_id then
    raise exception 'candidate product identity does not match target product' using errcode = '22023';
  end if;

  select * into product from cloud.products where id = candidate.target_product_id;
  if not found or (
    nullif(candidate.candidate_data #>> '{product,sourceUid}', '') is not null
    and candidate.candidate_data #>> '{product,sourceUid}' is distinct from product.source_uid
  ) then
    raise exception 'candidate product identity could not be verified' using errcode = '22023';
  end if;

  payload_checksum_value := encode(
    extensions.digest(convert_to(candidate.candidate_data::text, 'UTF8'), 'sha256'),
    'hex'
  );

  -- Serialize all publications for one product before checking idempotency so
  -- concurrent retries observe the batch committed by the first request.
  perform pg_advisory_xact_lock(hashtextextended(candidate.target_product_id::text, 0));

  select * into existing_batch
  from cloud.product_detail_publication_batches
  where idempotency_key = p_idempotency_key;
  if found then
    if existing_batch.candidate_id <> candidate.id
       or existing_batch.payload_checksum <> payload_checksum_value then
      raise exception 'idempotency key belongs to a different publication payload' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'publicationBatchId', existing_batch.id,
      'candidateId', existing_batch.candidate_id,
      'productId', existing_batch.product_id,
      'status', existing_batch.status,
      'keyFeatureCount', coalesce((existing_batch.result_summary ->> 'keyFeatureCount')::integer, 0),
      'specificationCount', coalesce((existing_batch.result_summary ->> 'specificationCount')::integer, 0),
      'idempotent', true
    );
  end if;

  select id into review_item_id_value
  from cloud.review_items
  where import_product_id = candidate.import_product_id;
  if review_item_id_value is null then
    raise exception 'candidate has no manual review item' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(candidate.candidate_data -> 'keyFeatures') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.keyFeatures.' || (item ->> 'key')
    order by created_at desc, id desc
    limit 1;
    if not found or decision.decision <> 'approve' or decision.approved_value is distinct from item then
      raise exception 'key feature % lacks a matching approve decision', item ->> 'key' using errcode = '22023';
    end if;
  end loop;

  for item in select value from jsonb_array_elements(candidate.candidate_data -> 'specifications') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.specifications.' || (item ->> 'key')
    order by created_at desc, id desc
    limit 1;
    if not found or decision.decision <> 'approve' or decision.approved_value is distinct from item then
      raise exception 'specification % lacks a matching approve decision', item ->> 'key' using errcode = '22023';
    end if;
  end loop;

  select id into previous_batch_id_value
  from cloud.product_detail_publication_batches
  where product_id = candidate.target_product_id and status = 'published'
  order by created_at desc, id desc
  limit 1;

  select jsonb_build_object(
    'keyFeatures', coalesce((
      select jsonb_agg(to_jsonb(feature) order by feature.sort_order, feature.id)
      from cloud.product_key_features feature
      where feature.product_id = candidate.target_product_id
        and feature.publication_status = 'published'
        and feature.archived_at is null
    ), '[]'::jsonb),
    'specifications', coalesce((
      select jsonb_agg(to_jsonb(characteristic) order by characteristic.group_sort_order nulls first, characteristic.sort_order, characteristic.id)
      from cloud.product_characteristics characteristic
      where characteristic.product_id = candidate.target_product_id
        and characteristic.content_kind = 'technical_specification'
        and characteristic.publication_status = 'published'
        and characteristic.archived_at is null
    ), '[]'::jsonb)
  ) into previous_state_value;

  key_feature_count := jsonb_array_length(candidate.candidate_data -> 'keyFeatures');
  specification_count := jsonb_array_length(candidate.candidate_data -> 'specifications');

  insert into cloud.product_detail_publication_batches (
    product_id, candidate_id, schema_version, idempotency_key, payload_checksum,
    previous_batch_id, status, actor_id, previous_state, result_summary
  ) values (
    candidate.target_product_id, candidate.id, p_schema_version, p_idempotency_key,
    payload_checksum_value, previous_batch_id_value, 'published', p_actor_id,
    previous_state_value,
    jsonb_build_object(
      'keyFeatureCount', key_feature_count,
      'specificationCount', specification_count
    )
  ) returning id into publication_batch_id_value;

  if previous_batch_id_value is not null then
    update cloud.product_detail_publication_batches
    set status = 'superseded'
    where id = previous_batch_id_value;
  end if;

  update cloud.product_key_features
  set publication_status = 'superseded', archived_at = now(), updated_at = now()
  where product_id = candidate.target_product_id
    and publication_status = 'published'
    and archived_at is null;

  update cloud.product_characteristics
  set publication_status = 'superseded', archived_at = now(), updated_at = now()
  where product_id = candidate.target_product_id
    and content_kind = 'technical_specification'
    and publication_status = 'published'
    and archived_at is null;

  for item in select value from jsonb_array_elements(candidate.candidate_data -> 'keyFeatures') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.keyFeatures.' || (item ->> 'key')
    order by created_at desc, id desc limit 1;
    insert into cloud.product_key_features (
      product_id, field_key, text, sort_order, source_type, source_ref, source_url,
      review_status, publication_status, publication_batch_id, approval_decision_id
    ) values (
      candidate.target_product_id, item ->> 'key', item ->> 'text',
      (item ->> 'sortOrder')::integer, item #>> '{source,type}', item #>> '{source,ref}',
      nullif(item #>> '{source,url}', ''), 'approved', 'published',
      publication_batch_id_value, decision.id
    );
  end loop;

  for item in select value from jsonb_array_elements(candidate.candidate_data -> 'specifications') loop
    select * into decision
    from cloud.review_decisions
    where review_item_id = review_item_id_value
      and field_path = 'structuredProductDetail.specifications.' || (item ->> 'key')
    order by created_at desc, id desc limit 1;
    insert into cloud.product_characteristics (
      product_id, key, display_name, raw_value, normalized_value, unit, sort_order,
      confidence, source_reference, reviewer_status, content_kind, group_key,
      group_title, group_sort_order, source_type, source_url, publication_status,
      publication_batch_id, approval_decision_id, archived_at, updated_at
    ) values (
      candidate.target_product_id, 'structured-' || (item ->> 'key'), item ->> 'label',
      item ->> 'value', item ->> 'value', nullif(item ->> 'unit', ''),
      (item ->> 'sortOrder')::integer, 'reviewed', item #>> '{source,ref}', 'approved',
      'technical_specification', nullif(item #>> '{group,key}', ''),
      nullif(item #>> '{group,title}', ''), nullif(item #>> '{group,sortOrder}', '')::integer,
      item #>> '{source,type}', nullif(item #>> '{source,url}', ''), 'published',
      publication_batch_id_value, decision.id, null, now()
    )
    on conflict (product_id, key) do update set
      display_name = excluded.display_name,
      raw_value = excluded.raw_value,
      normalized_value = excluded.normalized_value,
      unit = excluded.unit,
      sort_order = excluded.sort_order,
      confidence = excluded.confidence,
      source_reference = excluded.source_reference,
      reviewer_status = excluded.reviewer_status,
      content_kind = excluded.content_kind,
      group_key = excluded.group_key,
      group_title = excluded.group_title,
      group_sort_order = excluded.group_sort_order,
      source_type = excluded.source_type,
      source_url = excluded.source_url,
      publication_status = excluded.publication_status,
      publication_batch_id = excluded.publication_batch_id,
      approval_decision_id = excluded.approval_decision_id,
      archived_at = null,
      updated_at = now();
  end loop;

  update cloud.publication_candidates
  set validation_status = 'published', updated_at = now()
  where id = candidate.id;

  insert into cloud.publication_events (
    product_id, candidate_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    candidate.target_product_id, candidate.id,
    case when previous_batch_id_value is null then 'created' else 'updated' end,
    previous_state_value, candidate.candidate_data, p_actor_id,
    jsonb_build_object(
      'contract', 'structured-product-detail-v1',
      'publicationBatchId', publication_batch_id_value,
      'payloadChecksum', payload_checksum_value
    )
  );

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source
  ) values (
    p_actor_id, 'publish', 'product_detail_publication_batch', publication_batch_id_value,
    previous_state_value, candidate.candidate_data, 'cloud_api.publish_structured_product_detail_v1'
  );

  result_value := jsonb_build_object(
    'publicationBatchId', publication_batch_id_value,
    'candidateId', candidate.id,
    'productId', candidate.target_product_id,
    'status', 'published',
    'keyFeatureCount', key_feature_count,
    'specificationCount', specification_count,
    'idempotent', false
  );
  return result_value;
end
$$;

create or replace function cloud.rollback_structured_product_detail_v1(
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
  previous_specification jsonb;
  key_feature_count integer;
  specification_count integer;
begin
  if not cloud.is_service_request() then
    raise exception 'structured product rollback requires service role' using errcode = '42501';
  end if;

  select * into batch
  from cloud.product_detail_publication_batches
  where id = p_publication_batch_id
  for update;
  if not found then
    raise exception 'publication batch does not exist' using errcode = '22023';
  end if;

  key_feature_count := coalesce((batch.result_summary ->> 'keyFeatureCount')::integer, 0);
  specification_count := coalesce((batch.result_summary ->> 'specificationCount')::integer, 0);
  if batch.status = 'rolled_back' then
    return jsonb_build_object(
      'publicationBatchId', batch.id,
      'candidateId', batch.candidate_id,
      'productId', batch.product_id,
      'status', 'rolled_back',
      'keyFeatureCount', key_feature_count,
      'specificationCount', specification_count,
      'idempotent', true
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(batch.product_id::text, 0));
  if batch.status <> 'published' or exists (
    select 1 from cloud.product_detail_publication_batches newer
    where newer.product_id = batch.product_id
      and newer.status = 'published'
      and (newer.created_at, newer.id) > (batch.created_at, batch.id)
  ) then
    raise exception 'only the latest published product-detail batch can be rolled back' using errcode = '22023';
  end if;

  update cloud.product_key_features
  set publication_status = 'rolled_back', archived_at = now(), updated_at = now()
  where publication_batch_id = batch.id
    and publication_status = 'published';

  update cloud.product_key_features
  set publication_status = 'published', archived_at = null, updated_at = now()
  where id in (
    select (value ->> 'id')::uuid
    from jsonb_array_elements(batch.previous_state -> 'keyFeatures')
  );

  update cloud.product_characteristics
  set publication_status = 'rolled_back', archived_at = now(), updated_at = now()
  where publication_batch_id = batch.id
    and content_kind = 'technical_specification';

  for previous_specification in
    select value from jsonb_array_elements(batch.previous_state -> 'specifications')
  loop
    update cloud.product_characteristics set
      display_name = previous_specification ->> 'display_name',
      raw_value = previous_specification ->> 'raw_value',
      normalized_value = previous_specification ->> 'normalized_value',
      unit = previous_specification ->> 'unit',
      sort_order = (previous_specification ->> 'sort_order')::integer,
      confidence = (previous_specification ->> 'confidence')::cloud.confidence_level,
      source_reference = previous_specification ->> 'source_reference',
      reviewer_status = previous_specification ->> 'reviewer_status',
      content_kind = previous_specification ->> 'content_kind',
      group_key = previous_specification ->> 'group_key',
      group_title = previous_specification ->> 'group_title',
      group_sort_order = nullif(previous_specification ->> 'group_sort_order', '')::integer,
      source_type = previous_specification ->> 'source_type',
      source_url = previous_specification ->> 'source_url',
      publication_status = previous_specification ->> 'publication_status',
      publication_batch_id = nullif(previous_specification ->> 'publication_batch_id', '')::uuid,
      approval_decision_id = nullif(previous_specification ->> 'approval_decision_id', '')::uuid,
      archived_at = nullif(previous_specification ->> 'archived_at', '')::timestamptz,
      updated_at = now()
    where id = (previous_specification ->> 'id')::uuid;
  end loop;

  if batch.previous_batch_id is not null then
    update cloud.product_detail_publication_batches
    set status = 'published'
    where id = batch.previous_batch_id and status = 'superseded';
  end if;

  update cloud.product_detail_publication_batches
  set status = 'rolled_back', rolled_back_at = now(), rolled_back_by = p_actor_id
  where id = batch.id;

  update cloud.publication_candidates
  set validation_status = 'approved', updated_at = now()
  where id = batch.candidate_id and validation_status = 'published';

  insert into cloud.publication_events (
    product_id, candidate_id, event_type, previous_version, new_version, actor_id, metadata
  ) values (
    batch.product_id, batch.candidate_id, 'rollback', null, batch.previous_state,
    p_actor_id, jsonb_build_object(
      'contract', 'structured-product-detail-v1',
      'publicationBatchId', batch.id,
      'restoredBatchId', batch.previous_batch_id
    )
  );

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source
  ) values (
    p_actor_id, 'restore', 'product_detail_publication_batch', batch.id,
    batch.result_summary, batch.previous_state,
    'cloud_api.rollback_structured_product_detail_v1'
  );

  return jsonb_build_object(
    'publicationBatchId', batch.id,
    'candidateId', batch.candidate_id,
    'productId', batch.product_id,
    'status', 'rolled_back',
    'keyFeatureCount', key_feature_count,
    'specificationCount', specification_count,
    'idempotent', false
  );
end
$$;

create or replace function cloud_api.publish_structured_product_detail_v1(
  p_candidate_id uuid,
  p_schema_version integer,
  p_idempotency_key text,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.publish_structured_product_detail_v1(
    p_candidate_id, p_schema_version, p_idempotency_key, p_actor_id
  )
$$;

create or replace function cloud_api.rollback_structured_product_detail_v1(
  p_publication_batch_id uuid,
  p_actor_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.rollback_structured_product_detail_v1(p_publication_batch_id, p_actor_id)
$$;

revoke all on function cloud.validate_structured_product_detail_candidate_v1(jsonb) from public, anon, authenticated;
revoke all on function cloud.publish_structured_product_detail_v1(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function cloud.rollback_structured_product_detail_v1(uuid, uuid) from public, anon, authenticated;
revoke all on function cloud_api.publish_structured_product_detail_v1(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function cloud_api.rollback_structured_product_detail_v1(uuid, uuid) from public, anon, authenticated;
grant execute on function cloud_api.publish_structured_product_detail_v1(uuid, integer, text, uuid) to service_role;
grant execute on function cloud_api.rollback_structured_product_detail_v1(uuid, uuid) to service_role;

comment on table cloud.product_key_features is
  'Atomic, provenance-bearing Product Detail features; only approved published rows reach Storefront RPC.';
comment on table cloud.product_detail_publication_batches is
  'Idempotent Structured Product Detail publication batches with reversible previous state.';

commit;
