begin;

alter table cloud.products
  add column seo_title text,
  add column seo_description text,
  add column updated_by text;

create or replace function cloud.catalog_admin_products(
  p_search text default null,
  p_filter text default 'all',
  p_sort text default 'updated'
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare result jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'catalog admin requires service role' using errcode = '42501';
  end if;
  if p_filter not in ('all','needs_review','missing_manufacturer','missing_category','missing_registration','missing_documents','blocked') then
    raise exception 'unsupported catalog admin filter' using errcode = '22023';
  end if;
  if p_sort not in ('updated','name','warnings') then
    raise exception 'unsupported catalog admin sort' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(row_value order by
    case when p_sort = 'name' then lower(row_value->>'name') end asc,
    case when p_sort = 'warnings' then (row_value->>'warningsCount')::integer end desc,
    case when p_sort = 'updated' then row_value->>'updatedAt' end desc,
    row_value->>'id'
  ), '[]'::jsonb) into result
  from (
    select jsonb_build_object(
      'id', p.id,
      'slug', p.slug,
      'name', p.title,
      'manufacturer', m.display_name,
      'category', c.display_name,
      'applicationArea', aa.name,
      'reviewState', p.review_state,
      'warningsCount', cardinality(p.review_reason),
      'updatedAt', p.updated_at,
      'blocked', p.missing_manufacturer or p.missing_category or p.missing_application_area,
      'flags', jsonb_build_object(
        'missingManufacturer', p.missing_manufacturer,
        'missingCategory', p.missing_category,
        'missingApplicationArea', p.missing_application_area,
        'missingRegistration', p.missing_registration,
        'missingDocuments', p.missing_documents,
        'missingMedia', p.missing_media,
        'needsReview', p.needs_review
      )
    ) row_value
    from cloud.products p
    left join cloud.manufacturers m on m.id = p.manufacturer_id
    left join cloud.categories c on c.id = p.category_id
    left join lateral (
      select a.display_name as name from cloud.product_application_areas pa
      join cloud.application_areas a on a.id = pa.application_area_id
      where pa.product_id = p.id order by a.display_name limit 1
    ) aa on true
    where (p_search is null or btrim(p_search) = '' or p.title ilike '%' || p_search || '%' or p.slug ilike '%' || p_search || '%')
      and case p_filter
        when 'needs_review' then p.needs_review
        when 'missing_manufacturer' then p.missing_manufacturer
        when 'missing_category' then p.missing_category
        when 'missing_registration' then p.missing_registration
        when 'missing_documents' then p.missing_documents
        when 'blocked' then p.missing_manufacturer or p.missing_category or p.missing_application_area
        else true
      end
  ) rows;
  return jsonb_build_object('items', result, 'total', jsonb_array_length(result));
end;
$$;

create or replace function cloud.catalog_admin_product(p_id uuid) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare result jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'catalog admin requires service role' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'model', p.model,
    'sourceUrl', p.source_url, 'shortDescription', p.short_description,
    'description', p.full_description, 'seoTitle', p.seo_title,
    'seoDescription', p.seo_description, 'manufacturerId', p.manufacturer_id,
    'categoryId', p.category_id, 'applicationAreaId', aa.id,
    'publicationStatus', p.publication_status, 'published', p.published,
    'reviewState', p.review_state, 'needsReview', p.needs_review,
    'reviewReasons', to_jsonb(p.review_reason), 'updatedAt', p.updated_at,
    'updatedBy', p.updated_by,
    'qualityFlags', jsonb_build_object(
      'missingManufacturer', p.missing_manufacturer, 'missingCategory', p.missing_category,
      'missingApplicationArea', p.missing_application_area,
      'missingCharacteristics', p.missing_characteristics,
      'missingRegistration', p.missing_registration, 'missingDocuments', p.missing_documents,
      'missingMedia', p.missing_media
    ),
    'characteristics', coalesce(chars.value, '[]'::jsonb),
    'media', coalesce(media.value, '[]'::jsonb),
    'warnings', coalesce(warnings.value, '[]'::jsonb),
    'immutable', jsonb_build_object(
      'sourceUid', p.source_uid, 'sourceChecksum', p.source_checksum,
      'snapshotVersion', p.snapshot_version, 'importBatchKey', p.import_batch_key,
      'rawSnapshot', src.snapshot, 'importMetadata', p.legacy_metadata
    )
  ) into result
  from cloud.products p
  left join lateral (
    select a.id from cloud.product_application_areas pa
    join cloud.application_areas a on a.id = pa.application_area_id
    where pa.product_id = p.id order by a.display_name limit 1
  ) aa on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('name', pc.display_name, 'value', pc.raw_value, 'unit', pc.unit) order by pc.sort_order, pc.display_name) value
    from cloud.product_characteristics pc where pc.product_id = p.id
  ) chars on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('url', pm.source_url, 'role', pm.role, 'format', pm.media_format) order by pm.sort_order, pm.source_url) value
    from cloud.product_media pm where pm.product_id = p.id
  ) media on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('code', iw.code, 'message', iw.message, 'severity', 'warning') order by iw.code) value
    from cloud.import_products ip join cloud.import_warnings iw on iw.import_product_id = ip.id
    where ip.existing_product_id = p.id and iw.resolved_at is null
  ) warnings on true
  left join cloud.import_products ip on ip.existing_product_id = p.id
  left join cloud.import_sources src on src.id = ip.import_source_id
  where p.id = p_id;
  return result;
end;
$$;

create or replace function cloud.catalog_admin_references(p_kind text) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare result jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'catalog admin requires service role' using errcode = '42501';
  end if;
  if p_kind = 'manufacturers' then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', display_name) order by display_name), '[]'::jsonb) into result from cloud.manufacturers where publication_status = 'published';
  elsif p_kind = 'categories' then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', display_name) order by display_name), '[]'::jsonb) into result from cloud.categories where publication_status = 'published' and assignable;
  elsif p_kind = 'application-areas' then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', display_name) order by display_name), '[]'::jsonb) into result from cloud.application_areas where publication_status = 'published';
  else
    raise exception 'unsupported reference kind' using errcode = '22023';
  end if;
  return result;
end;
$$;

create or replace function cloud.catalog_admin_patch_product(p_id uuid, p_patch jsonb, p_actor text) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  allowed text[] := array['title','shortDescription','description','seoTitle','seoDescription','manufacturerId','categoryId','applicationAreaId'];
  key text;
  manufacturer_uuid uuid;
  category_uuid uuid;
  area_uuid uuid;
  reasons text[];
begin
  if not cloud.is_service_request() then raise exception 'catalog admin requires service role' using errcode = '42501'; end if;
  if p_actor is null or btrim(p_actor) = '' then raise exception 'catalog admin actor is required' using errcode = '22023'; end if;
  if jsonb_typeof(p_patch) <> 'object' then raise exception 'patch must be an object' using errcode = '22023'; end if;
  for key in select jsonb_object_keys(p_patch) loop
    if not key = any(allowed) then raise exception 'immutable or unsupported field: %', key using errcode = '22023'; end if;
  end loop;

  if p_patch ? 'manufacturerId' and nullif(p_patch->>'manufacturerId','') is not null then
    manufacturer_uuid := (p_patch->>'manufacturerId')::uuid;
    if not exists(select 1 from cloud.manufacturers where id=manufacturer_uuid and publication_status='published') then raise exception 'manufacturer reference is invalid' using errcode='23503'; end if;
  elsif p_patch ? 'manufacturerId' then manufacturer_uuid := null; end if;
  if p_patch ? 'categoryId' and nullif(p_patch->>'categoryId','') is not null then
    category_uuid := (p_patch->>'categoryId')::uuid;
    if not exists(select 1 from cloud.categories where id=category_uuid and publication_status='published' and assignable) then raise exception 'category reference is invalid' using errcode='23503'; end if;
  elsif p_patch ? 'categoryId' then category_uuid := null; end if;
  if p_patch ? 'applicationAreaId' and nullif(p_patch->>'applicationAreaId','') is not null then
    area_uuid := (p_patch->>'applicationAreaId')::uuid;
    if not exists(select 1 from cloud.application_areas where id=area_uuid and publication_status='published') then raise exception 'application area reference is invalid' using errcode='23503'; end if;
  elsif p_patch ? 'applicationAreaId' then area_uuid := null; end if;

  update cloud.products set
    title = case when p_patch ? 'title' then nullif(btrim(p_patch->>'title'),'') else title end,
    short_description = case when p_patch ? 'shortDescription' then nullif(btrim(p_patch->>'shortDescription'),'') else short_description end,
    full_description = case when p_patch ? 'description' then nullif(btrim(p_patch->>'description'),'') else full_description end,
    seo_title = case when p_patch ? 'seoTitle' then nullif(btrim(p_patch->>'seoTitle'),'') else seo_title end,
    seo_description = case when p_patch ? 'seoDescription' then nullif(btrim(p_patch->>'seoDescription'),'') else seo_description end,
    manufacturer_id = case when p_patch ? 'manufacturerId' then manufacturer_uuid else manufacturer_id end,
    category_id = case when p_patch ? 'categoryId' then category_uuid else category_id end,
    updated_at = now(), updated_by = p_actor
  where id = p_id;
  if not found then raise exception 'product not found' using errcode='P0002'; end if;

  if p_patch ? 'applicationAreaId' then
    delete from cloud.product_application_areas where product_id = p_id;
    if area_uuid is not null then insert into cloud.product_application_areas(product_id, application_area_id) values(p_id, area_uuid); end if;
  end if;

  update cloud.products p set
    missing_manufacturer = p.manufacturer_id is null,
    missing_category = p.category_id is null,
    missing_application_area = not exists(select 1 from cloud.product_application_areas pa where pa.product_id=p.id),
    missing_characteristics = not exists(select 1 from cloud.product_characteristics pc where pc.product_id=p.id),
    missing_registration = not exists(select 1 from cloud.product_registration_links pr where pr.product_id=p.id),
    missing_documents = not exists(select 1 from cloud.product_documents pd where pd.product_id=p.id),
    missing_media = not exists(select 1 from cloud.product_media pm where pm.product_id=p.id)
  where p.id=p_id;
  select array_remove(array[
    case when missing_manufacturer then 'UNKNOWN_MANUFACTURER' end,
    case when missing_category then 'UNKNOWN_CATEGORY' end,
    case when missing_application_area then 'UNKNOWN_APPLICATION_AREA' end,
    case when missing_characteristics then 'MISSING_CHARACTERISTICS' end,
    case when missing_registration then 'MISSING_REGISTRATION' end,
    case when missing_documents then 'MISSING_DOCUMENTS' end,
    case when missing_media then 'MISSING_MEDIA' end
  ], null) into reasons from cloud.products where id=p_id;
  update cloud.products set review_reason=reasons, needs_review=cardinality(reasons)>0,
    review_state=case
      when missing_manufacturer or missing_category or missing_application_area then 'blocked'::cloud.review_status
      when cardinality(reasons)>0 then 'pending'::cloud.review_status
      else 'in_review'::cloud.review_status end
  where id=p_id;
  return cloud.catalog_admin_product(p_id);
end;
$$;

create or replace function cloud_api.catalog_admin_products(p_search text default null, p_filter text default 'all', p_sort text default 'updated') returns jsonb language sql security definer set search_path=pg_catalog,cloud as $$ select cloud.catalog_admin_products(p_search,p_filter,p_sort) $$;
create or replace function cloud_api.catalog_admin_product(p_id uuid) returns jsonb language sql security definer set search_path=pg_catalog,cloud as $$ select cloud.catalog_admin_product(p_id) $$;
create or replace function cloud_api.catalog_admin_references(p_kind text) returns jsonb language sql security definer set search_path=pg_catalog,cloud as $$ select cloud.catalog_admin_references(p_kind) $$;
create or replace function cloud_api.catalog_admin_patch_product(p_id uuid,p_patch jsonb,p_actor text) returns jsonb language sql security definer set search_path=pg_catalog,cloud as $$ select cloud.catalog_admin_patch_product(p_id,p_patch,p_actor) $$;

revoke all on function cloud_api.catalog_admin_products(text,text,text) from public,anon,authenticated;
revoke all on function cloud_api.catalog_admin_product(uuid) from public,anon,authenticated;
revoke all on function cloud_api.catalog_admin_references(text) from public,anon,authenticated;
revoke all on function cloud_api.catalog_admin_patch_product(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function cloud_api.catalog_admin_products(text,text,text) to service_role;
grant execute on function cloud_api.catalog_admin_product(uuid) to service_role;
grant execute on function cloud_api.catalog_admin_references(text) to service_role;
grant execute on function cloud_api.catalog_admin_patch_product(uuid,jsonb,text) to service_role;

commit;
