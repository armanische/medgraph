-- Cloud Storefront Preview projection for Structured Product Detail v1.
-- Read-only and service-only. Provenance/review internals stay outside the
-- public Storefront DTO.

begin;

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
          ) order by grouped.group_sort_order_value, grouped.group_title_value, grouped.group_key_value
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
        'countryCode', country_code, 'website', website, 'createdAt', created_at, 'updatedAt', updated_at
      ) order by display_name)
      from cloud.manufacturers where publication_status = 'published' and archived_at is null
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', display_name, 'description', description,
        'position', sort_order, 'createdAt', created_at, 'updatedAt', updated_at
      ) order by sort_order, display_name)
      from cloud.categories where publication_status = 'published' and assignable and archived_at is null
    ), '[]'::jsonb),
    'applicationAreas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', display_name, 'description', description,
        'createdAt', created_at, 'updatedAt', updated_at
      ) order by display_name)
      from cloud.application_areas where publication_status = 'published' and archived_at is null
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function cloud_api.cloud_storefront_preview_catalog() returns jsonb
language sql
security definer
stable
set search_path = pg_catalog, cloud
as $$ select cloud.cloud_storefront_preview_catalog() $$;

revoke all on function cloud.cloud_storefront_preview_catalog() from public, anon, authenticated;
revoke all on function cloud_api.cloud_storefront_preview_catalog() from public, anon, authenticated;
grant execute on function cloud_api.cloud_storefront_preview_catalog() to service_role;

commit;
