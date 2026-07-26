-- Published Catalog Projection corrective v1.
-- Additive-only hardening for document dependency clocks, type-safe child
-- parsing and exact visible-child projection timestamps.

begin;

create or replace function cloud.public_json_text_v1(p_value jsonb)
returns text
language sql
immutable
as $$
  select case
    when jsonb_typeof(p_value) = 'string' then p_value #>> '{}'
    else null
  end
$$;

create or replace function cloud.public_json_nonnegative_integer_v1(p_value jsonb)
returns integer
language sql
immutable
as $$
  select case
    when jsonb_typeof(p_value) = 'number'
      and p_value::text ~ '^(0|[1-9][0-9]{0,9})$'
      and p_value::text::numeric <= 2147483647
      then p_value::text::integer
    else null
  end
$$;

create or replace function cloud.public_json_boolean_v1(p_value jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when jsonb_typeof(p_value) = 'boolean' then p_value::text::boolean
    else null
  end
$$;

create or replace function cloud.touch_published_storage_projection_clock_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if row(
       new.source_url, new.checksum_sha256, new.rights_status,
       new.access_status, new.deleted_at, new.bucket, new.object_path
     ) is distinct from row(
       old.source_url, old.checksum_sha256, old.rights_status,
       old.access_status, old.deleted_at, old.bucket, old.object_path
     ) then
    new.updated_at := clock_timestamp();
  end if;
  return new;
end
$$;

create trigger storage_objects_published_projection_clock
  before update of source_url, checksum_sha256, rights_status, access_status,
    deleted_at, bucket, object_path
  on cloud.storage_objects
  for each row execute function cloud.touch_published_storage_projection_clock_v1();

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
      and jsonb_typeof(revision.candidate_payload) = 'object'
      and cloud.public_json_nonnegative_integer_v1(
        revision.candidate_payload -> 'schemaVersion'
      ) = 1
      and jsonb_typeof(revision.candidate_payload -> 'product') = 'object'
      and cloud.public_json_text_v1(
        revision.candidate_payload #> '{product,id}'
      ) = product.id::text
      and cloud.public_json_text_v1(
        revision.candidate_payload #> '{product,manufacturerId}'
      ) = manufacturer.id::text
      and cloud.public_json_text_v1(
        revision.candidate_payload #> '{product,categoryId}'
      ) = category.id::text
      and nullif(btrim(cloud.public_json_text_v1(
        revision.candidate_payload #> '{product,slug}'
      )), '') is not null
      and nullif(btrim(cloud.public_json_text_v1(
        revision.candidate_payload #> '{product,title}'
      )), '') is not null
      and nullif(btrim(cloud.public_json_text_v1(
        revision.candidate_payload #> '{product,model}'
      )), '') is not null
      and jsonb_array_length(case
        when jsonb_typeof(revision.candidate_payload -> 'applicationAreas') = 'array'
          then revision.candidate_payload -> 'applicationAreas'
        else '[]'::jsonb
      end) > 0
      and not exists (
        select 1
        from jsonb_array_elements(case
          when jsonb_typeof(revision.candidate_payload -> 'applicationAreas') = 'array'
            then revision.candidate_payload -> 'applicationAreas'
          else '[]'::jsonb
        end) candidate_area
        left join cloud.product_application_areas product_area
          on product_area.product_id = product.id
          and product_area.application_area_id::text = cloud.public_json_text_v1(
            candidate_area -> 'id'
          )
        left join published_application_areas area
          on area.id = product_area.application_area_id
        where jsonb_typeof(candidate_area) <> 'object'
          or product_area.product_id is null
          or area.id is null
          or cloud.public_json_text_v1(candidate_area -> 'publicationStatus') <> 'published'
          or not (candidate_area ? 'archivedAt')
          or candidate_area -> 'archivedAt' <> 'null'::jsonb
      )
      and not exists (
        select 1
        from cloud.product_application_areas product_area
        where product_area.product_id = product.id
          and not exists (
            select 1
            from jsonb_array_elements(case
              when jsonb_typeof(revision.candidate_payload -> 'applicationAreas') = 'array'
                then revision.candidate_payload -> 'applicationAreas'
              else '[]'::jsonb
            end) candidate_area
            where cloud.public_json_text_v1(candidate_area -> 'id')
              = product_area.application_area_id::text
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
  visible_key_features as materialized (
    select
      eligible.id as product_id,
      feature.structured_item_id,
      feature.text,
      feature.sort_order,
      feature.updated_at
    from eligible_products eligible
    join cloud.product_key_features feature
      on feature.product_id = eligible.id
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
      from jsonb_array_elements(case
        when jsonb_typeof(detail_revision.candidate_payload -> 'keyFeatures') = 'array'
          then detail_revision.candidate_payload -> 'keyFeatures'
        else '[]'::jsonb
      end) item
      where jsonb_typeof(item) = 'object'
        and cloud.public_json_text_v1(item -> 'key') = feature.structured_item_id
        and cloud.public_json_text_v1(item -> 'text') is not null
        and cloud.public_json_nonnegative_integer_v1(item -> 'sortOrder') is not null
        and jsonb_typeof(item -> 'source') = 'object'
        and cloud.public_json_text_v1(item #> '{source,type}') is not null
        and cloud.public_json_text_v1(item #> '{source,ref}') is not null
        and (
          not ((item -> 'source') ? 'url')
          or jsonb_typeof(item #> '{source,url}') in ('null', 'string')
        )
        and detail_decision.approved_value = item
    ) approved_item on true
    where feature.review_status = 'approved'
      and feature.publication_status = 'published'
      and feature.archived_at is null
      and detail_revision.schema_version = 1
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
      and feature.text = cloud.public_json_text_v1(approved_item.item -> 'text')
      and feature.sort_order = cloud.public_json_nonnegative_integer_v1(
        approved_item.item -> 'sortOrder'
      )
      and feature.source_type = cloud.public_json_text_v1(
        approved_item.item #> '{source,type}'
      )
      and feature.source_ref = cloud.public_json_text_v1(
        approved_item.item #> '{source,ref}'
      )
      and feature.source_url is not distinct from nullif(
        cloud.public_json_text_v1(approved_item.item #> '{source,url}'), ''
      )
  ),
  visible_characteristics as materialized (
    select
      eligible.id as product_id,
      characteristic.structured_item_id,
      characteristic.display_name,
      characteristic.normalized_value,
      characteristic.unit,
      characteristic.sort_order,
      characteristic.group_key,
      characteristic.group_title,
      characteristic.group_sort_order,
      characteristic.updated_at
    from eligible_products eligible
    join cloud.product_characteristics characteristic
      on characteristic.product_id = eligible.id
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
      from jsonb_array_elements(case
        when jsonb_typeof(detail_revision.candidate_payload -> 'specifications') = 'array'
          then detail_revision.candidate_payload -> 'specifications'
        else '[]'::jsonb
      end) item
      where jsonb_typeof(item) = 'object'
        and cloud.public_json_text_v1(item -> 'key') = characteristic.structured_item_id
        and cloud.public_json_text_v1(item -> 'label') is not null
        and cloud.public_json_text_v1(item -> 'value') is not null
        and cloud.public_json_nonnegative_integer_v1(item -> 'sortOrder') is not null
        and (
          not (item ? 'unit')
          or jsonb_typeof(item -> 'unit') in ('null', 'string')
        )
        and (
          not (item ? 'group')
          or item -> 'group' = 'null'::jsonb
          or (
            jsonb_typeof(item -> 'group') = 'object'
            and cloud.public_json_text_v1(item #> '{group,key}') is not null
            and cloud.public_json_text_v1(item #> '{group,title}') is not null
            and cloud.public_json_nonnegative_integer_v1(
              item #> '{group,sortOrder}'
            ) is not null
          )
        )
        and jsonb_typeof(item -> 'source') = 'object'
        and cloud.public_json_text_v1(item #> '{source,type}') is not null
        and cloud.public_json_text_v1(item #> '{source,ref}') is not null
        and (
          not ((item -> 'source') ? 'url')
          or jsonb_typeof(item #> '{source,url}') in ('null', 'string')
        )
        and detail_decision.approved_value = item
    ) approved_item on true
    where characteristic.record_origin = 'structured_product_detail'
      and characteristic.content_kind = 'technical_specification'
      and characteristic.reviewer_status = 'approved'
      and characteristic.publication_status = 'published'
      and characteristic.archived_at is null
      and detail_revision.schema_version = 1
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
      and characteristic.display_name = cloud.public_json_text_v1(
        approved_item.item -> 'label'
      )
      and characteristic.normalized_value = cloud.public_json_text_v1(
        approved_item.item -> 'value'
      )
      and characteristic.unit is not distinct from nullif(
        cloud.public_json_text_v1(approved_item.item -> 'unit'), ''
      )
      and characteristic.sort_order = cloud.public_json_nonnegative_integer_v1(
        approved_item.item -> 'sortOrder'
      )
      and characteristic.group_key is not distinct from nullif(
        cloud.public_json_text_v1(approved_item.item #> '{group,key}'), ''
      )
      and characteristic.group_title is not distinct from nullif(
        cloud.public_json_text_v1(approved_item.item #> '{group,title}'), ''
      )
      and characteristic.group_sort_order is not distinct from
        cloud.public_json_nonnegative_integer_v1(approved_item.item #> '{group,sortOrder}')
      and characteristic.source_type = cloud.public_json_text_v1(
        approved_item.item #> '{source,type}'
      )
      and characteristic.source_reference = cloud.public_json_text_v1(
        approved_item.item #> '{source,ref}'
      )
      and characteristic.source_url is not distinct from nullif(
        cloud.public_json_text_v1(approved_item.item #> '{source,url}'), ''
      )
  ),
  visible_documents as materialized (
    select
      eligible.id as product_id,
      item,
      storage.source_url,
      storage.updated_at as storage_updated_at
    from eligible_products eligible
    cross join lateral jsonb_array_elements(case
      when jsonb_typeof(eligible.candidate_payload -> 'documents') = 'array'
        then eligible.candidate_payload -> 'documents'
      else '[]'::jsonb
    end) item
    join cloud.storage_objects storage
      on storage.id::text = cloud.public_json_text_v1(item -> 'storageObjectId')
      and storage.access_status = 'public'
      and storage.deleted_at is null
      and storage.rights_status in (
        'manufacturer_official', 'licensed', 'owned', 'public_domain'
      )
      and storage.source_url ~ '^https://'
    where jsonb_typeof(item) = 'object'
      and cloud.public_json_text_v1(item -> 'publicationStatus') = 'published'
      and nullif(btrim(cloud.public_json_text_v1(item -> 'title')), '') is not null
      and nullif(btrim(cloud.public_json_text_v1(item -> 'language')), '') is not null
      and cloud.public_json_text_v1(item -> 'documentType') in (
        'brochure', 'datasheet', 'technical_specification', 'ifu',
        'operator_manual', 'quick_guide', 'software',
        'clinical_information', 'accessories', 'compatibility',
        'service_documentation', 'registration', 'certificate', 'other'
      )
      and cloud.public_json_boolean_v1(item -> 'isOfficial') is not null
  ),
  product_payloads as materialized (
    select
      eligible.id,
      cloud.public_json_text_v1(eligible.candidate_payload #> '{product,slug}') as slug,
      jsonb_build_object(
        'id', cloud.public_json_text_v1(eligible.candidate_payload #> '{product,slug}'),
        'slug', cloud.public_json_text_v1(eligible.candidate_payload #> '{product,slug}'),
        'title', cloud.public_json_text_v1(eligible.candidate_payload #> '{product,title}'),
        'model', cloud.public_json_text_v1(eligible.candidate_payload #> '{product,model}'),
        'shortDescription', nullif(btrim(cloud.public_json_text_v1(
          eligible.candidate_payload #> '{product,shortDescription}'
        )), ''),
        'description', nullif(btrim(cloud.public_json_text_v1(
          eligible.candidate_payload #> '{product,fullDescription}'
        )), ''),
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
      from jsonb_array_elements(case
        when jsonb_typeof(eligible.candidate_payload -> 'applicationAreas') = 'array'
          then eligible.candidate_payload -> 'applicationAreas'
        else '[]'::jsonb
      end) candidate_area
      join published_application_areas area
        on area.id::text = cloud.public_json_text_v1(candidate_area -> 'id')
    ) application_areas on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('text', feature.text, 'sortOrder', feature.sort_order)
        order by feature.sort_order, feature.structured_item_id
      ) as value
      from visible_key_features feature
      where feature.product_id = eligible.id
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
        from visible_characteristics characteristic
        where characteristic.product_id = eligible.id
        group by
          coalesce(nullif(characteristic.group_key, ''), 'general'),
          coalesce(nullif(characteristic.group_title, ''), 'Характеристики'),
          coalesce(characteristic.group_sort_order, 0)
      ) grouped
    ) characteristic_groups on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'url', cloud.public_json_text_v1(item -> 'sourceUrl'),
          'role', cloud.public_json_text_v1(item -> 'role'),
          'format', nullif(btrim(cloud.public_json_text_v1(item -> 'format')), ''),
          'sortOrder', cloud.public_json_nonnegative_integer_v1(item -> 'sortOrder')
        ) order by
          cloud.public_json_nonnegative_integer_v1(item -> 'sortOrder'),
          cloud.public_json_text_v1(item -> 'sourceUrl')
      ) as value
      from jsonb_array_elements(case
        when jsonb_typeof(eligible.candidate_payload -> 'media') = 'array'
          then eligible.candidate_payload -> 'media'
        else '[]'::jsonb
      end) item
      where jsonb_typeof(item) = 'object'
        and cloud.public_json_text_v1(item -> 'sourceUrl') ~ '^https://'
        and cloud.public_json_text_v1(item -> 'role') in ('primary', 'gallery')
        and cloud.public_json_nonnegative_integer_v1(item -> 'sortOrder') is not null
        and (
          not (item ? 'format')
          or jsonb_typeof(item -> 'format') in ('null', 'string')
        )
    ) media on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'title', cloud.public_json_text_v1(document.item -> 'title'),
          'kind', cloud.public_json_text_v1(document.item -> 'documentType'),
          'publicUrl', document.source_url,
          'language', cloud.public_json_text_v1(document.item -> 'language'),
          'isOfficial', cloud.public_json_boolean_v1(document.item -> 'isOfficial')
        ) order by
          cloud.public_json_text_v1(document.item -> 'title'),
          cloud.public_json_text_v1(document.item -> 'storageObjectId')
      ) as value
      from visible_documents document
      where document.product_id = eligible.id
    ) documents on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'registrationNumber', nullif(btrim(
            cloud.public_json_text_v1(item -> 'registrationNumber')
          ), ''),
          'status', cloud.public_json_text_v1(item -> 'status'),
          'sourceUrl', null
        ) order by
          cloud.public_json_text_v1(item -> 'registrationNumber') nulls last,
          cloud.public_json_text_v1(item -> 'id')
      ) as value
      from jsonb_array_elements(case
        when jsonb_typeof(eligible.candidate_payload -> 'registrations') = 'array'
          then eligible.candidate_payload -> 'registrations'
        else '[]'::jsonb
      end) item
      where jsonb_typeof(item) = 'object'
        and cloud.public_json_text_v1(item -> 'id') is not null
        and cloud.public_json_text_v1(item -> 'status') in (
          'no_data', 'legacy_claim_only', 'candidate_number',
          'requires_external_verification', 'verified_exact', 'verified_family'
        )
        and (
          not (item ? 'registrationNumber')
          or jsonb_typeof(item -> 'registrationNumber') in ('null', 'string')
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
      union all select updated_at from visible_key_features
      union all select updated_at from visible_characteristics
      union all select storage_updated_at from visible_documents
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

revoke all on function cloud.public_json_text_v1(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function cloud.public_json_nonnegative_integer_v1(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function cloud.public_json_boolean_v1(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function cloud.touch_published_storage_projection_clock_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.cloud_published_storefront_catalog_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud_api.cloud_published_storefront_catalog_v1()
  from public, anon, authenticated;
grant execute on function cloud_api.cloud_published_storefront_catalog_v1()
  to service_role;

comment on function cloud.cloud_published_storefront_catalog_v1() is
  'Internal type-safe, read-only and fail-closed Published Catalog Projection v1.';
comment on function cloud.touch_published_storage_projection_clock_v1() is
  'Advances the independent public storage dependency clock when public document state changes.';

commit;
