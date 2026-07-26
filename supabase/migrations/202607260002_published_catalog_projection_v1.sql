-- Published Catalog Projection v1.
-- Service-only, read-only and fail-closed public Storefront payload.
-- This migration performs no backfill, approval, publication or Product mutation.

begin;

create index products_published_projection_idx
  on cloud.products (slug, id)
  where publication_status = 'published' and archived_at is null;

create index import_products_existing_product_idx
  on cloud.import_products (existing_product_id, id)
  where existing_product_id is not null;

create index import_blocking_errors_unresolved_product_idx
  on cloud.import_blocking_errors (import_product_id, id)
  where resolved_at is null;

create or replace function cloud.cloud_published_storefront_catalog_v1()
returns jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  result jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'published Storefront projection requires service role'
      using errcode = '42501';
  end if;

  with
  published_manufacturers as materialized (
    select manufacturer.*
    from cloud.manufacturers manufacturer
    where manufacturer.publication_status = 'published'
      and manufacturer.archived_at is null
      and nullif(btrim(manufacturer.slug), '') is not null
      and nullif(btrim(manufacturer.display_name), '') is not null
  ),
  published_categories as materialized (
    select category.*
    from cloud.categories category
    where category.publication_status = 'published'
      and category.archived_at is null
      and category.assignable
      and nullif(btrim(category.slug), '') is not null
      and nullif(btrim(category.display_name), '') is not null
  ),
  published_application_areas as materialized (
    select area.*
    from cloud.application_areas area
    where area.publication_status = 'published'
      and area.archived_at is null
      and nullif(btrim(area.slug), '') is not null
      and nullif(btrim(area.display_name), '') is not null
  ),
  eligible_products as materialized (
    select
      product.id,
      product.created_at,
      product.updated_at,
      product.publication_version,
      manufacturer.slug as manufacturer_slug,
      category.slug as category_slug,
      revision.candidate_payload
    from cloud.products product
    join cloud.product_publication_revisions revision
      on revision.id = product.current_product_publication_revision_id
      and revision.product_id = product.id
    join cloud.product_publication_approvals approval
      on approval.id = product.current_product_publication_approval_id
      and approval.candidate_revision_id = revision.id
      and approval.review_item_id = revision.review_item_id
      and approval.payload_checksum = revision.payload_checksum
      and approval.product_identity_checksum = revision.product_identity_checksum
      and approval.decision = 'approve'
    join cloud.review_decisions decision
      on decision.id = approval.review_decision_id
      and decision.product_publication_revision_id = revision.id
      and decision.review_item_id = revision.review_item_id
      and decision.decision = 'approve'
      and decision.approved_value = revision.candidate_payload
      and decision.approved_payload_checksum = revision.payload_checksum
      and decision.product_identity_checksum = revision.product_identity_checksum
    join cloud.product_publication_batches batch
      on batch.id = product.active_product_publication_batch_id
      and batch.product_id = product.id
      and batch.candidate_revision_id = revision.id
      and batch.approval_id = approval.id
      and batch.action = 'publish'
      and batch.payload_checksum = revision.payload_checksum
      and batch.publication_version = product.publication_version
      and batch.result_state ->> 'publicationStatus' = 'published'
      and batch.result_state ->> 'activePublicationBatchId' = batch.id::text
    join published_manufacturers manufacturer
      on manufacturer.id = product.manufacturer_id
    join published_categories category
      on category.id = product.category_id
    where product.publication_status = 'published'
      and product.published_at is not null
      and product.archived_at is null
      and product.review_state = 'published'
      and product.catalog_quality_status = 'READY'
      and revision.schema_version = 1
      and revision.product_identity = cloud.product_publication_identity_snapshot_v1(product.id)
      and revision.product_identity_checksum = cloud.sha256_jsonb_v1(revision.product_identity)
      and revision.candidate_payload_checksum = cloud.sha256_jsonb_v1(revision.candidate_payload)
      and revision.payload_checksum = cloud.product_publication_payload_checksum_v1(
        revision.schema_version,
        revision.product_identity,
        revision.candidate_payload
      )
      and revision.candidate_payload #>> '{product,id}' = product.id::text
      and revision.candidate_payload #>> '{product,manufacturerId}' = manufacturer.id::text
      and revision.candidate_payload #>> '{product,categoryId}' = category.id::text
      and nullif(btrim(revision.candidate_payload #>> '{product,slug}'), '') is not null
      and nullif(btrim(revision.candidate_payload #>> '{product,title}'), '') is not null
      and nullif(btrim(revision.candidate_payload #>> '{product,model}'), '') is not null
      and jsonb_typeof(revision.candidate_payload -> 'applicationAreas') = 'array'
      and jsonb_array_length(revision.candidate_payload -> 'applicationAreas') > 0
      and not exists (
        select 1
        from jsonb_array_elements(revision.candidate_payload -> 'applicationAreas') candidate_area
        left join cloud.product_application_areas product_area
          on product_area.product_id = product.id
          and product_area.application_area_id::text = candidate_area ->> 'id'
        left join published_application_areas area
          on area.id = product_area.application_area_id
        where product_area.product_id is null
          or area.id is null
          or candidate_area ->> 'publicationStatus' <> 'published'
          or candidate_area ->> 'archivedAt' is not null
      )
      and not exists (
        select 1
        from cloud.product_application_areas product_area
        where product_area.product_id = product.id
          and not exists (
            select 1
            from jsonb_array_elements(revision.candidate_payload -> 'applicationAreas') candidate_area
            where candidate_area ->> 'id' = product_area.application_area_id::text
          )
      )
      and not exists (
        select 1
        from cloud.import_products import_product
        join cloud.import_blocking_errors blocking_error
          on blocking_error.import_product_id = import_product.id
          and blocking_error.resolved_at is null
        where import_product.existing_product_id = product.id
      )
  ),
  product_payloads as materialized (
    select
      eligible.id,
      eligible.candidate_payload #>> '{product,slug}' as slug,
      jsonb_build_object(
        'id', eligible.candidate_payload #>> '{product,slug}',
        'slug', eligible.candidate_payload #>> '{product,slug}',
        'title', eligible.candidate_payload #>> '{product,title}',
        'model', eligible.candidate_payload #>> '{product,model}',
        'shortDescription', nullif(btrim(
          eligible.candidate_payload #>> '{product,shortDescription}'
        ), ''),
        'description', nullif(btrim(
          eligible.candidate_payload #>> '{product,fullDescription}'
        ), ''),
        'manufacturerId', eligible.manufacturer_slug,
        'categoryId', eligible.category_slug,
        'status', 'active',
        'applicationAreas', coalesce(application_areas.value, '[]'::jsonb),
        'keyFeatures', coalesce(key_features.value, '[]'::jsonb),
        'characteristicGroups', coalesce(characteristic_groups.value, '[]'::jsonb),
        'media', coalesce(media.value, '[]'::jsonb),
        'documents', coalesce(documents.value, '[]'::jsonb),
        'registrations', coalesce(registrations.value, '[]'::jsonb),
        'createdAt', eligible.created_at,
        'updatedAt', eligible.updated_at
      ) as value
    from eligible_products eligible
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('id', area.slug, 'name', area.display_name)
        order by area.slug
      ) as value
      from jsonb_array_elements(eligible.candidate_payload -> 'applicationAreas') candidate_area
      join published_application_areas area
        on area.id::text = candidate_area ->> 'id'
    ) application_areas on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'text', feature.text,
          'sortOrder', feature.sort_order
        ) order by feature.sort_order, feature.structured_item_id
      ) as value
      from cloud.product_key_features feature
      join cloud.product_detail_publication_batches detail_batch
        on detail_batch.id = feature.publication_batch_id
        and detail_batch.product_id = eligible.id
        and detail_batch.status = 'published'
        and detail_batch.candidate_revision_id = feature.candidate_revision_id
      join cloud.product_detail_candidate_revisions detail_revision
        on detail_revision.id = feature.candidate_revision_id
        and detail_revision.product_id = eligible.id
        and detail_revision.candidate_id = detail_batch.candidate_id
        and detail_revision.payload_checksum = detail_batch.payload_checksum
        and detail_revision.product_identity_checksum = detail_batch.product_identity_checksum
      join cloud.product_detail_candidate_revision_approvals detail_approval
        on detail_approval.candidate_revision_id = detail_revision.id
        and detail_approval.payload_checksum = detail_revision.payload_checksum
        and detail_approval.product_identity_checksum = detail_revision.product_identity_checksum
        and detail_approval.decision = 'approve'
      join cloud.publication_candidates detail_candidate
        on detail_candidate.id = detail_revision.candidate_id
        and detail_candidate.target_product_id = eligible.id
        and detail_candidate.candidate_data = detail_revision.candidate_payload
        and detail_candidate.validation_status in ('approved', 'published')
      join cloud.review_decisions detail_decision
        on detail_decision.id = feature.approval_decision_id
        and detail_decision.candidate_revision_id = detail_revision.id
        and detail_decision.review_item_id = detail_approval.review_item_id
        and detail_decision.decision = 'approve'
        and detail_decision.approved_payload_checksum = detail_revision.payload_checksum
        and detail_decision.product_identity_checksum = detail_revision.product_identity_checksum
      join lateral (
        select item
        from jsonb_array_elements(detail_revision.candidate_payload -> 'keyFeatures') item
        where item ->> 'key' = feature.structured_item_id
          and detail_decision.approved_value = item
      ) approved_item on true
      where feature.product_id = eligible.id
        and feature.review_status = 'approved'
        and feature.publication_status = 'published'
        and feature.archived_at is null
        and detail_revision.product_identity = cloud.structured_product_identity_snapshot_v1(eligible.id)
        and detail_revision.product_identity_checksum = cloud.sha256_jsonb_v1(
          detail_revision.product_identity
        )
        and detail_revision.candidate_payload_checksum = cloud.sha256_jsonb_v1(
          detail_revision.candidate_payload
        )
        and detail_revision.payload_checksum = cloud.structured_product_detail_payload_checksum_v1(
          detail_revision.schema_version,
          detail_revision.product_identity,
          detail_revision.candidate_payload
        )
        and feature.text = approved_item.item ->> 'text'
        and feature.sort_order = (approved_item.item ->> 'sortOrder')::integer
        and feature.source_type = approved_item.item #>> '{source,type}'
        and feature.source_ref = approved_item.item #>> '{source,ref}'
        and feature.source_url is not distinct from nullif(
          approved_item.item #>> '{source,url}', ''
        )
    ) key_features on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'key', grouped.group_key,
          'title', grouped.group_title,
          'sortOrder', grouped.group_sort_order,
          'items', grouped.items
        ) order by grouped.group_sort_order, grouped.group_title, grouped.group_key
      ) as value
      from (
        select
          coalesce(nullif(characteristic.group_key, ''), 'general') as group_key,
          coalesce(nullif(characteristic.group_title, ''), 'Характеристики') as group_title,
          coalesce(characteristic.group_sort_order, 0) as group_sort_order,
          jsonb_agg(
            jsonb_build_object(
              'label', characteristic.display_name,
              'value', characteristic.normalized_value,
              'unit', characteristic.unit,
              'sortOrder', characteristic.sort_order
            ) order by characteristic.sort_order, characteristic.structured_item_id
          ) as items
        from cloud.product_characteristics characteristic
        join cloud.product_detail_publication_batches detail_batch
          on detail_batch.id = characteristic.publication_batch_id
          and detail_batch.product_id = eligible.id
          and detail_batch.status = 'published'
          and detail_batch.candidate_revision_id = characteristic.candidate_revision_id
        join cloud.product_detail_candidate_revisions detail_revision
          on detail_revision.id = characteristic.candidate_revision_id
          and detail_revision.product_id = eligible.id
          and detail_revision.candidate_id = detail_batch.candidate_id
          and detail_revision.payload_checksum = detail_batch.payload_checksum
          and detail_revision.product_identity_checksum = detail_batch.product_identity_checksum
        join cloud.product_detail_candidate_revision_approvals detail_approval
          on detail_approval.candidate_revision_id = detail_revision.id
          and detail_approval.payload_checksum = detail_revision.payload_checksum
          and detail_approval.product_identity_checksum = detail_revision.product_identity_checksum
          and detail_approval.decision = 'approve'
        join cloud.publication_candidates detail_candidate
          on detail_candidate.id = detail_revision.candidate_id
          and detail_candidate.target_product_id = eligible.id
          and detail_candidate.candidate_data = detail_revision.candidate_payload
          and detail_candidate.validation_status in ('approved', 'published')
        join cloud.review_decisions detail_decision
          on detail_decision.id = characteristic.approval_decision_id
          and detail_decision.candidate_revision_id = detail_revision.id
          and detail_decision.review_item_id = detail_approval.review_item_id
          and detail_decision.decision = 'approve'
          and detail_decision.approved_payload_checksum = detail_revision.payload_checksum
          and detail_decision.product_identity_checksum = detail_revision.product_identity_checksum
        join lateral (
          select item
          from jsonb_array_elements(detail_revision.candidate_payload -> 'specifications') item
          where item ->> 'key' = characteristic.structured_item_id
            and detail_decision.approved_value = item
        ) approved_item on true
        where characteristic.product_id = eligible.id
          and characteristic.record_origin = 'structured_product_detail'
          and characteristic.content_kind = 'technical_specification'
          and characteristic.reviewer_status = 'approved'
          and characteristic.publication_status = 'published'
          and characteristic.archived_at is null
          and detail_revision.product_identity = cloud.structured_product_identity_snapshot_v1(
            eligible.id
          )
          and detail_revision.product_identity_checksum = cloud.sha256_jsonb_v1(
            detail_revision.product_identity
          )
          and detail_revision.candidate_payload_checksum = cloud.sha256_jsonb_v1(
            detail_revision.candidate_payload
          )
          and detail_revision.payload_checksum = cloud.structured_product_detail_payload_checksum_v1(
            detail_revision.schema_version,
            detail_revision.product_identity,
            detail_revision.candidate_payload
          )
          and characteristic.display_name = approved_item.item ->> 'label'
          and characteristic.normalized_value = approved_item.item ->> 'value'
          and characteristic.unit is not distinct from nullif(approved_item.item ->> 'unit', '')
          and characteristic.sort_order = (approved_item.item ->> 'sortOrder')::integer
          and characteristic.group_key is not distinct from nullif(
            approved_item.item #>> '{group,key}', ''
          )
          and characteristic.group_title is not distinct from nullif(
            approved_item.item #>> '{group,title}', ''
          )
          and characteristic.group_sort_order is not distinct from nullif(
            approved_item.item #>> '{group,sortOrder}', ''
          )::integer
          and characteristic.source_type = approved_item.item #>> '{source,type}'
          and characteristic.source_reference = approved_item.item #>> '{source,ref}'
          and characteristic.source_url is not distinct from nullif(
            approved_item.item #>> '{source,url}', ''
          )
        group by
          coalesce(nullif(characteristic.group_key, ''), 'general'),
          coalesce(nullif(characteristic.group_title, ''), 'Характеристики'),
          coalesce(characteristic.group_sort_order, 0)
      ) grouped
    ) characteristic_groups on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'url', item ->> 'sourceUrl',
          'role', item ->> 'role',
          'format', nullif(btrim(item ->> 'format'), ''),
          'sortOrder', (item ->> 'sortOrder')::integer
        ) order by (item ->> 'sortOrder')::integer, item ->> 'sourceUrl'
      ) as value
      from jsonb_array_elements(eligible.candidate_payload -> 'media') item
      where item ->> 'sourceUrl' ~ '^https://'
        and item ->> 'role' in ('primary', 'gallery')
    ) media on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'title', item ->> 'title',
          'kind', case
            when item ->> 'documentType' in (
              'brochure', 'datasheet', 'technical_specification', 'ifu',
              'operator_manual', 'quick_guide', 'software',
              'clinical_information', 'accessories', 'compatibility',
              'service_documentation', 'registration', 'certificate', 'other'
            ) then item ->> 'documentType'
            else 'other'
          end,
          'publicUrl', storage.source_url,
          'language', item ->> 'language',
          'isOfficial', (item ->> 'isOfficial')::boolean
        ) order by item ->> 'title', item ->> 'storageObjectId'
      ) as value
      from jsonb_array_elements(eligible.candidate_payload -> 'documents') item
      join cloud.storage_objects storage
        on storage.id::text = item ->> 'storageObjectId'
        and storage.access_status = 'public'
        and storage.deleted_at is null
        and storage.rights_status in (
          'manufacturer_official', 'licensed', 'owned', 'public_domain'
        )
        and storage.source_url ~ '^https://'
      where item ->> 'publicationStatus' = 'published'
        and nullif(btrim(item ->> 'title'), '') is not null
        and nullif(btrim(item ->> 'language'), '') is not null
    ) documents on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'registrationNumber', nullif(btrim(item ->> 'registrationNumber'), ''),
          'status', item ->> 'status',
          'sourceUrl', null
        ) order by item ->> 'registrationNumber' nulls last, item ->> 'id'
      ) as value
      from jsonb_array_elements(eligible.candidate_payload -> 'registrations') item
      where item ->> 'status' in (
        'no_data', 'legacy_claim_only', 'candidate_number',
        'requires_external_verification', 'verified_exact', 'verified_family'
      )
    ) registrations on true
  ),
  projection_clock as (
    select coalesce(max(clock_value), '1970-01-01 00:00:00+00'::timestamptz) as value
    from (
      select updated_at as clock_value from eligible_products
      union all select updated_at from published_manufacturers
      union all select updated_at from published_categories
      union all select updated_at from published_application_areas
      union all
        select feature.updated_at
        from cloud.product_key_features feature
        join eligible_products eligible on eligible.id = feature.product_id
        where feature.publication_status = 'published' and feature.archived_at is null
      union all
        select characteristic.updated_at
        from cloud.product_characteristics characteristic
        join eligible_products eligible on eligible.id = characteristic.product_id
        where characteristic.record_origin = 'structured_product_detail'
          and characteristic.publication_status = 'published'
          and characteristic.archived_at is null
    ) timestamps
  )
  select jsonb_build_object(
    'schemaVersion', 1,
    'generatedAt', projection_clock.value,
    'products', coalesce((
      select jsonb_agg(product.value order by product.slug)
      from product_payloads product
    ), '[]'::jsonb),
    'manufacturers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', manufacturer.slug,
        'slug', manufacturer.slug,
        'name', manufacturer.display_name,
        'description', nullif(btrim(manufacturer.description), ''),
        'countryCode', manufacturer.country_code,
        'website', case when manufacturer.website ~ '^https://' then manufacturer.website else null end,
        'createdAt', manufacturer.created_at,
        'updatedAt', manufacturer.updated_at
      ) order by manufacturer.slug)
      from published_manufacturers manufacturer
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', category.slug,
        'slug', category.slug,
        'name', category.display_name,
        'description', nullif(btrim(category.description), ''),
        'position', category.sort_order,
        'createdAt', category.created_at,
        'updatedAt', category.updated_at
      ) order by category.slug)
      from published_categories category
    ), '[]'::jsonb),
    'applicationAreas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', area.slug,
        'slug', area.slug,
        'name', area.display_name,
        'description', nullif(btrim(area.description), ''),
        'createdAt', area.created_at,
        'updatedAt', area.updated_at
      ) order by area.slug)
      from published_application_areas area
    ), '[]'::jsonb),
    'summary', jsonb_build_object(
      'productCount', (select count(*) from eligible_products),
      'manufacturerCount', (select count(*) from published_manufacturers),
      'categoryCount', (select count(*) from published_categories),
      'applicationAreaCount', (select count(*) from published_application_areas)
    )
  ) into result
  from projection_clock;

  return result;
end
$$;

create or replace function cloud_api.cloud_published_storefront_catalog_v1()
returns jsonb
language sql
security definer
stable
set search_path = pg_catalog, cloud
as $$
  select cloud.cloud_published_storefront_catalog_v1()
$$;

revoke all on function cloud.cloud_published_storefront_catalog_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud_api.cloud_published_storefront_catalog_v1()
  from public, anon, authenticated;
grant execute on function cloud_api.cloud_published_storefront_catalog_v1()
  to service_role;

comment on function cloud_api.cloud_published_storefront_catalog_v1() is
  'Service-only, read-only and fail-closed published Storefront catalog projection v1.';

commit;
