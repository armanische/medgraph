-- Cloud Storefront Preview v1: service-only, read-only projection.

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
        'characteristics', coalesce(chars.value, '[]'::jsonb),
        'media', coalesce(media.value, '[]'::jsonb),
        'documents', coalesce(documents.value, '[]'::jsonb),
        'registrations', coalesce(registrations.value, '[]'::jsonb)
      ) order by lower(p.title), p.id)
      from cloud.products p
      left join lateral (
        select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.display_name) order by a.display_name) value
        from cloud.product_application_areas pa
        join cloud.application_areas a on a.id = pa.application_area_id
        where pa.product_id = p.id
      ) areas on true
      left join lateral (
        select jsonb_agg(jsonb_build_object('name', pc.display_name, 'value', pc.raw_value, 'unit', pc.unit) order by pc.sort_order, pc.display_name) value
        from cloud.product_characteristics pc where pc.product_id = p.id
      ) chars on true
      left join lateral (
        select jsonb_agg(jsonb_build_object('url', pm.source_url, 'role', pm.role, 'format', pm.media_format) order by pm.sort_order, pm.source_url) value
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

revoke all on function cloud_api.cloud_storefront_preview_catalog() from public, anon, authenticated;
grant execute on function cloud_api.cloud_storefront_preview_catalog() to service_role;

commit;
