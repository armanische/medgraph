-- Publication Candidate Payload Completeness Corrective v1.
-- Extends the immutable Product revision payload with canonical SEO and the
-- complete active characteristic set. This migration changes no Product data,
-- evidence, approval, publication or projection state, and grants no new access.

begin;

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
      'seoTitle', nullif(btrim(product.seo_title), ''),
      'seoDescription', nullif(btrim(product.seo_description), ''),
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
    'characteristics', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', characteristic.stable_key,
          'contentKind', characteristic.content_kind,
          'recordOrigin', characteristic.record_origin,
          'label', characteristic.display_name,
          'value', characteristic.normalized_value,
          'unit', characteristic.unit,
          'group', jsonb_build_object(
            'key', characteristic.public_group_key,
            'title', characteristic.public_group_title,
            'sortOrder', characteristic.public_group_sort_order
          ),
          'sortOrder', characteristic.sort_order
        ) order by
          characteristic.public_group_sort_order,
          characteristic.public_group_key,
          characteristic.sort_order,
          characteristic.stable_key,
          lower(btrim(characteristic.display_name)),
          characteristic.display_name
      )
      from (
        select
          case
            when source.record_origin = 'structured_product_detail'
              then 'structured:' || source.structured_item_id
            else 'legacy:' || source.key
          end as stable_key,
          source.content_kind,
          source.record_origin,
          source.display_name,
          source.normalized_value,
          source.unit,
          coalesce(nullif(btrim(source.group_key), ''), 'general') as public_group_key,
          coalesce(nullif(btrim(source.group_title), ''), 'Характеристики') as public_group_title,
          coalesce(source.group_sort_order, 0) as public_group_sort_order,
          source.sort_order
        from cloud.product_characteristics source
        where source.product_id = product.id
          and source.archived_at is null
          and (
            (
              source.record_origin = 'legacy'
              and source.content_kind = 'legacy_metadata'
            )
            or (
              source.record_origin = 'structured_product_detail'
              and source.content_kind = 'technical_specification'
              and source.publication_status = 'published'
              and source.reviewer_status = 'approved'
              and source.structured_item_id is not null
            )
          )
      ) characteristic
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

revoke all on function cloud.product_publication_candidate_payload_v1(uuid)
  from public, anon, authenticated, service_role;

comment on function cloud.product_publication_candidate_payload_v1(uuid) is
  'Canonical immutable Product publication candidate. Includes canonical Product SEO and deterministically ordered active characteristics without characteristic UUID identity.';

commit;
