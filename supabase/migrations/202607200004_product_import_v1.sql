begin;

-- Product Import v1 must preserve unknown values as NULL rather than fabricate
-- references merely to satisfy the original Cloud Foundation constraints.
alter table cloud.products alter column model drop not null;
alter table cloud.products alter column manufacturer_id drop not null;
alter table cloud.products alter column category_id drop not null;
alter table cloud.products alter column short_description drop not null;
alter table cloud.products alter column full_description drop not null;

alter table cloud.products
  add column source_uid text,
  add column source_checksum text,
  add column snapshot_version text,
  add column created_from_snapshot_at timestamptz,
  add column legacy_metadata jsonb not null default '{}'::jsonb,
  add column import_batch_key text,
  add column needs_review boolean not null default true,
  add column review_reason text[] not null default '{}',
  add column missing_manufacturer boolean not null default true,
  add column missing_category boolean not null default true,
  add column missing_application_area boolean not null default true,
  add column missing_characteristics boolean not null default true,
  add column missing_registration boolean not null default true,
  add column missing_documents boolean not null default true,
  add column missing_media boolean not null default true,
  add column import_warnings text[] not null default '{}',
  add column review_state cloud.review_status not null default 'pending',
  add column published boolean generated always as (publication_status = 'published') stored,
  add constraint products_source_uid_unique unique (source_uid),
  add constraint products_source_checksum_format check (source_checksum is null or source_checksum ~ '^[a-f0-9]{64}$'),
  add constraint products_snapshot_metadata check (
    source_uid is null or (
      source_checksum is not null
      and snapshot_version is not null
      and created_from_snapshot_at is not null
      and import_batch_key is not null
    )
  ),
  add constraint products_import_never_published check (
    import_batch_key is null or (publication_status = 'draft' and published = false and published_at is null)
  );

create table cloud.product_media (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  source_url text not null,
  role text not null check (role in ('primary', 'gallery')),
  media_format text,
  sort_order integer not null default 0 check (sort_order >= 0),
  import_batch_key text not null,
  created_at timestamptz not null default now(),
  unique (product_id, source_url)
);

create unique index product_media_primary_uq on cloud.product_media (product_id) where role = 'primary';
alter table cloud.product_media enable row level security;
create policy product_media_public_read on cloud.product_media
  for select to anon, authenticated
  using (exists (
    select 1 from cloud.products product
    where product.id = product_id and product.publication_status = 'published'
  ));

create or replace function cloud.apply_product_import_v1(p_payload jsonb, p_batch_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  snapshot jsonb;
  raw_product jsonb;
  characteristic record;
  media record;
  product_uuid uuid;
  manufacturer_uuid uuid;
  category_uuid uuid;
  area_uuid uuid;
  import_run_uuid uuid;
  import_source_uuid uuid;
  import_product_uuid uuid;
  source_uid_value text;
  source_url_value text;
  source_checksum_value text;
  slug_value text;
  raw_manufacturer text;
  raw_product_type text;
  raw_application_area text;
  missing_manufacturer_value boolean;
  missing_category_value boolean;
  missing_area_value boolean;
  missing_characteristics_value boolean;
  missing_registration_value boolean;
  missing_documents_value boolean;
  missing_media_value boolean;
  review_reasons text[];
  warning_code text;
  imported_count integer := 0;
  media_count integer := 0;
  characteristic_count integer := 0;
begin
  if not cloud.is_service_request() then
    raise exception 'product import requires service role' using errcode = '42501';
  end if;
  if p_batch_key <> 'product-import-v1-staging' then
    raise exception 'invalid Product Import v1 batch key' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload) <> 'object'
     or jsonb_typeof(p_payload -> 'snapshots') <> 'array'
     or jsonb_array_length(p_payload -> 'snapshots') <> 79 then
    raise exception 'Product Import v1 requires exactly 79 snapshots' using errcode = '22023';
  end if;
  if exists (select 1 from cloud.import_runs where run_key = p_batch_key)
     or exists (select 1 from cloud.products where import_batch_key = p_batch_key) then
    raise exception 'Product Import v1 batch already exists; verify or rollback before retry' using errcode = '23505';
  end if;

  insert into cloud.import_runs (
    run_key, pipeline_version, environment, status, started_at, source_manifest, configuration
  ) values (
    p_batch_key, 'product-import-v1', 'staging', 'running', now(),
    p_payload -> 'manifest',
    jsonb_build_object('mapping', 'exact_only', 'source', 'immutable_source_snapshot_v1')
  ) returning id into import_run_uuid;

  for snapshot in select value from jsonb_array_elements(p_payload -> 'snapshots') loop
    raw_product := snapshot #> '{raw,product}';
    source_uid_value := raw_product ->> 'uid';
    source_url_value := snapshot ->> 'sourceUrl';
    source_checksum_value := snapshot ->> 'payloadSha256';
    slug_value := regexp_replace(split_part(source_url_value, '?', 1), '^.*/', '');
    raw_manufacturer := nullif(snapshot #>> '{raw,manufacturer}', '');
    raw_product_type := nullif(snapshot #>> '{raw,productType}', '');
    raw_application_area := nullif(snapshot #>> '{raw,applicationArea}', '');

    if source_uid_value is null or source_url_value is null or source_checksum_value !~ '^[a-f0-9]{64}$'
       or slug_value !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      raise exception 'invalid immutable snapshot identity for source UID %', source_uid_value using errcode = '22023';
    end if;

    select matched_id into manufacturer_uuid from (
      select manufacturer.id as matched_id
      from cloud.manufacturers manufacturer
      where lower(btrim(manufacturer.canonical_name)) = lower(btrim(raw_manufacturer))
         or lower(btrim(manufacturer.display_name)) = lower(btrim(raw_manufacturer))
      union
      select alias.manufacturer_id
      from cloud.manufacturer_aliases alias
      where alias.normalized_alias = lower(btrim(raw_manufacturer))
    ) matches
    group by matched_id
    having count(*) = 1;

    select matched_id into category_uuid from (
      select category.id as matched_id
      from cloud.categories category
      where category.assignable
        and (lower(btrim(category.canonical_name)) = lower(btrim(raw_product_type))
          or lower(btrim(category.display_name)) = lower(btrim(raw_product_type)))
      union
      select alias.category_id
      from cloud.category_aliases alias
      join cloud.categories category on category.id = alias.category_id and category.assignable
      where alias.normalized_alias = lower(btrim(raw_product_type))
    ) matches
    group by matched_id
    having count(*) = 1;

    select matched_id into area_uuid from (
      select area.id as matched_id
      from cloud.application_areas area
      where lower(btrim(area.canonical_name)) = lower(btrim(raw_application_area))
         or lower(btrim(area.display_name)) = lower(btrim(raw_application_area))
      union
      select alias.application_area_id
      from cloud.application_area_aliases alias
      where alias.normalized_alias = lower(btrim(raw_application_area))
    ) matches
    group by matched_id
    having count(*) = 1;

    missing_manufacturer_value := manufacturer_uuid is null;
    missing_category_value := category_uuid is null;
    missing_area_value := area_uuid is null;
    missing_characteristics_value := jsonb_array_length(coalesce(snapshot #> '{raw,characteristics}', '[]'::jsonb)) = 0;
    missing_registration_value := jsonb_array_length(coalesce(snapshot #> '{raw,registrationReferences}', '[]'::jsonb)) = 0;
    missing_documents_value := jsonb_array_length(coalesce(snapshot #> '{raw,documentReferences}', '[]'::jsonb)) = 0;
    missing_media_value := jsonb_array_length(coalesce(snapshot #> '{raw,mediaReferences}', '[]'::jsonb)) = 0;
    review_reasons := array_remove(array[
      case when missing_manufacturer_value then 'missing_manufacturer' end,
      case when missing_category_value then 'missing_category' end,
      case when missing_area_value then 'missing_application_area' end,
      case when missing_characteristics_value then 'missing_characteristics' end,
      case when missing_registration_value then 'missing_registration' end,
      case when missing_documents_value then 'missing_documents' end,
      case when missing_media_value then 'missing_media' end
    ], null);

    insert into cloud.products (
      external_code, legacy_id, slug, title, model, manufacturer_id, category_id,
      short_description, full_description, source_type, source_url, confidence,
      publication_status, published_at, source_uid, source_checksum, snapshot_version,
      created_from_snapshot_at, legacy_metadata, import_batch_key, needs_review,
      review_reason, missing_manufacturer, missing_category, missing_application_area,
      missing_characteristics, missing_registration, missing_documents, missing_media,
      import_warnings, review_state
    ) values (
      'legacy-' || source_uid_value, source_uid_value, slug_value,
      raw_product ->> 'title', null, manufacturer_uuid, category_uuid,
      nullif(snapshot #>> '{raw,shortDescription}', ''),
      nullif(snapshot #>> '{raw,fullDescription}', ''),
      'immutable_source_snapshot_v1', source_url_value, 'legacy', 'draft', null,
      source_uid_value, source_checksum_value, snapshot ->> 'schemaVersion',
      (snapshot ->> 'receivedAt')::timestamptz,
      jsonb_build_object(
        'rawManufacturer', snapshot #> '{raw,manufacturer}',
        'rawProductType', snapshot #> '{raw,productType}',
        'rawApplicationArea', snapshot #> '{raw,applicationArea}',
        'tildaExternalId', raw_product -> 'externalid',
        'snapshotPath', 'data/legacy/products/' || source_uid_value || '.json'
      ),
      p_batch_key, cardinality(review_reasons) > 0, review_reasons,
      missing_manufacturer_value, missing_category_value, missing_area_value,
      missing_characteristics_value, missing_registration_value,
      missing_documents_value, missing_media_value, review_reasons, 'pending'
    ) returning id into product_uuid;

    if snapshot #>> '{raw,shortDescription}' is not null or snapshot #>> '{raw,fullDescription}' is not null then
      insert into cloud.product_descriptions (product_id, locale, short_description, full_description, confidence)
      values (
        product_uuid, 'ru', coalesce(snapshot #>> '{raw,shortDescription}', ''),
        coalesce(snapshot #>> '{raw,fullDescription}', ''), 'legacy'
      );
    end if;

    if area_uuid is not null then
      insert into cloud.product_application_areas (product_id, application_area_id)
      values (product_uuid, area_uuid);
    end if;

    for characteristic in
      select value, ordinality from jsonb_array_elements(coalesce(snapshot #> '{raw,characteristics}', '[]'::jsonb)) with ordinality
    loop
      insert into cloud.product_characteristics (
        product_id, key, display_name, raw_value, normalized_value, unit,
        sort_order, confidence, source_reference, reviewer_status
      ) values (
        product_uuid, 'raw-' || lpad(characteristic.ordinality::text, 3, '0'),
        characteristic.value ->> 'title', characteristic.value ->> 'value',
        characteristic.value ->> 'value', null,
        (characteristic.ordinality::integer - 1) * 10,
        'legacy', 'snapshot:' || source_uid_value, 'pending'
      );
      characteristic_count := characteristic_count + 1;
    end loop;

    for media in
      select value, ordinality from jsonb_array_elements(coalesce(snapshot #> '{raw,mediaReferences}', '[]'::jsonb)) with ordinality
    loop
      if nullif(media.value ->> 'img', '') is not null then
        insert into cloud.product_media (
          product_id, source_url, role, media_format, sort_order, import_batch_key
        ) values (
          product_uuid, media.value ->> 'img',
          case when media.ordinality::integer = 1 then 'primary' else 'gallery' end,
          nullif(lower(substring(split_part(media.value ->> 'img', '?', 1) from '\.([a-zA-Z0-9]+)$')), ''),
          (media.ordinality::integer - 1) * 10, p_batch_key
        );
        media_count := media_count + 1;
      end if;
    end loop;

    insert into cloud.import_sources (
      import_run_id, source_id, source_type, source_location, snapshot, checksum_sha256
    ) values (
      import_run_uuid, source_uid_value, 'immutable_source_snapshot_v1',
      source_url_value, snapshot, source_checksum_value
    ) returning id into import_source_uuid;

    insert into cloud.import_products (
      import_run_id, import_source_id, source_id, legacy_slug, status,
      identity_status, manufacturer_status, category_status, readiness_status,
      extracted_product, normalized_candidate, publication_candidate, existing_product_id
    ) values (
      import_run_uuid, import_source_uuid, source_uid_value, slug_value, 'imported',
      'source_exact', case when manufacturer_uuid is null then 'unresolved' else 'exact' end,
      case when category_uuid is null then 'unresolved' else 'exact' end,
      case when missing_manufacturer_value or missing_category_value or missing_area_value then 'blocked' else 'needs_review' end,
      jsonb_build_object(
        'title', raw_product -> 'title', 'manufacturer', snapshot #> '{raw,manufacturer}',
        'productType', snapshot #> '{raw,productType}', 'applicationArea', snapshot #> '{raw,applicationArea}'
      ),
      jsonb_build_object(
        'manufacturerId', manufacturer_uuid, 'categoryId', category_uuid,
        'applicationAreaId', area_uuid, 'mapping', 'exact_only', 'qualityFlags', review_reasons
      ),
      null, product_uuid
    ) returning id into import_product_uuid;

    foreach warning_code in array review_reasons loop
      insert into cloud.import_warnings (import_product_id, code, field_path, message, metadata)
      values (
        import_product_uuid, warning_code, warning_code,
        'Immutable snapshot field is absent or has no exact published reference match.',
        jsonb_build_object('sourceUid', source_uid_value, 'mapping', 'exact_only')
      );
    end loop;
    if missing_manufacturer_value then
      insert into cloud.import_blocking_errors (import_product_id, code, field_path, message)
      values (import_product_uuid, 'missing_manufacturer', 'manufacturer_id', 'No exact manufacturer reference match.');
    end if;
    if missing_category_value then
      insert into cloud.import_blocking_errors (import_product_id, code, field_path, message)
      values (import_product_uuid, 'missing_category', 'category_id', 'No exact category reference match.');
    end if;
    if missing_area_value then
      insert into cloud.import_blocking_errors (import_product_id, code, field_path, message)
      values (import_product_uuid, 'missing_application_area', 'application_area_id', 'No exact application-area reference match.');
    end if;
    imported_count := imported_count + 1;
  end loop;

  update cloud.import_runs set
    status = 'completed', completed_at = now(),
    summary = jsonb_build_object(
      'products', imported_count, 'media', media_count,
      'characteristics', characteristic_count, 'batchKey', p_batch_key
    )
  where id = import_run_uuid;

  return jsonb_build_object(
    'batchKey', p_batch_key, 'products', imported_count,
    'media', media_count, 'characteristics', characteristic_count,
    'documents', 0, 'registrations', 0
  );
end
$$;

create or replace function cloud.rollback_product_import_v1(p_batch_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  product_ids uuid[];
  run_ids uuid[];
  deleted_products integer := 0;
begin
  if not cloud.is_service_request() then
    raise exception 'product rollback requires service role' using errcode = '42501';
  end if;
  if p_batch_key <> 'product-import-v1-staging' then
    raise exception 'invalid Product Import v1 batch key' using errcode = '22023';
  end if;
  select coalesce(array_agg(id), '{}') into product_ids from cloud.products where import_batch_key = p_batch_key;
  select coalesce(array_agg(id), '{}') into run_ids from cloud.import_runs where run_key = p_batch_key;

  delete from cloud.product_media where product_id = any(product_ids);
  delete from cloud.product_characteristics where product_id = any(product_ids);
  delete from cloud.product_descriptions where product_id = any(product_ids);
  delete from cloud.product_application_areas where product_id = any(product_ids);
  delete from cloud.product_registration_links where product_id = any(product_ids);
  delete from cloud.product_documents where product_id = any(product_ids);
  delete from cloud.product_images where product_id = any(product_ids);
  delete from cloud.import_warnings where import_product_id in (select id from cloud.import_products where import_run_id = any(run_ids));
  delete from cloud.import_blocking_errors where import_product_id in (select id from cloud.import_products where import_run_id = any(run_ids));
  delete from cloud.import_field_provenance where import_product_id in (select id from cloud.import_products where import_run_id = any(run_ids));
  delete from cloud.review_items where import_product_id in (select id from cloud.import_products where import_run_id = any(run_ids));
  delete from cloud.publication_candidates where import_product_id in (select id from cloud.import_products where import_run_id = any(run_ids));
  delete from cloud.import_products where import_run_id = any(run_ids);
  delete from cloud.import_sources where import_run_id = any(run_ids);
  delete from cloud.products where id = any(product_ids);
  get diagnostics deleted_products = row_count;
  delete from cloud.import_runs where id = any(run_ids);
  return jsonb_build_object('batchKey', p_batch_key, 'deletedProducts', deleted_products);
end
$$;

create or replace function cloud_api.apply_product_import_v1(p_payload jsonb, p_batch_key text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$ select cloud.apply_product_import_v1(p_payload, p_batch_key) $$;

create or replace function cloud_api.rollback_product_import_v1(p_batch_key text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$ select cloud.rollback_product_import_v1(p_batch_key) $$;

revoke all on function cloud_api.apply_product_import_v1(jsonb, text) from public, anon, authenticated;
revoke all on function cloud_api.rollback_product_import_v1(text) from public, anon, authenticated;
grant execute on function cloud_api.apply_product_import_v1(jsonb, text) to service_role;
grant execute on function cloud_api.rollback_product_import_v1(text) to service_role;

commit;
