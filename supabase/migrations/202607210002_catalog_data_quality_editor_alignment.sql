-- Align Catalog Admin corrections with Catalog Data Quality v1.

begin;

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
    'updatedBy', p.updated_by, 'catalogQualityStatus', p.catalog_quality_status,
    'catalogQualityReasons', to_jsonb(p.catalog_quality_reason),
    'qualityFlags', jsonb_build_object(
      'missingManufacturer', p.missing_manufacturer, 'missingCategory', p.missing_category,
      'missingModel', p.missing_model, 'missingApplicationArea', p.missing_application_area,
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

create or replace function cloud.catalog_admin_patch_product(p_id uuid, p_patch jsonb, p_actor text) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  allowed text[] := array['title','model','shortDescription','description','seoTitle','seoDescription','manufacturerId','categoryId','applicationAreaId'];
  key text;
  manufacturer_uuid uuid;
  category_uuid uuid;
  area_uuid uuid;
  reasons text[];
  identity_reasons text[];
begin
  if not cloud.is_service_request() then raise exception 'catalog admin requires service role' using errcode = '42501'; end if;
  if p_actor is null or btrim(p_actor) = '' then raise exception 'catalog admin actor is required' using errcode = '22023'; end if;
  if jsonb_typeof(p_patch) <> 'object' then raise exception 'patch must be an object' using errcode = '22023'; end if;
  for key in select jsonb_object_keys(p_patch) loop
    if not key = any(allowed) then raise exception 'immutable or unsupported field: %', key using errcode = '22023'; end if;
  end loop;
  if p_patch ? 'model' and nullif(btrim(p_patch->>'model'), '') is null then
    raise exception 'model cannot be blank; omit the field to preserve it' using errcode = '22023';
  end if;

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
    model = case when p_patch ? 'model' then nullif(btrim(p_patch->>'model'),'') else model end,
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
    missing_model = p.model is null or btrim(p.model) = '',
    missing_application_area = not exists(select 1 from cloud.product_application_areas pa where pa.product_id=p.id),
    missing_characteristics = not exists(select 1 from cloud.product_characteristics pc where pc.product_id=p.id),
    missing_registration = not exists(select 1 from cloud.product_registration_links pr where pr.product_id=p.id),
    missing_documents = not exists(select 1 from cloud.product_documents pd where pd.product_id=p.id),
    missing_media = not exists(select 1 from cloud.product_media pm where pm.product_id=p.id)
  where p.id=p_id;

  select array_remove(array[
    case when missing_manufacturer then 'UNKNOWN_MANUFACTURER' end,
    case when missing_category then 'UNKNOWN_CATEGORY' end,
    case when missing_model then 'MODEL_NOT_EXPLICIT_IN_SOURCE' end,
    case when missing_application_area then 'UNKNOWN_APPLICATION_AREA' end,
    case when missing_characteristics then 'MISSING_CHARACTERISTICS' end,
    case when missing_registration then 'MISSING_REGISTRATION' end,
    case when missing_documents then 'MISSING_DOCUMENTS' end,
    case when missing_media then 'MISSING_MEDIA' end
  ], null), array_remove(array[
    case when missing_manufacturer then 'UNKNOWN_MANUFACTURER' end,
    case when missing_category then 'UNKNOWN_CATEGORY' end,
    case when missing_model then 'MODEL_NOT_EXPLICIT_IN_SOURCE' end
  ], null) into reasons, identity_reasons
  from cloud.products where id=p_id;

  update cloud.products set
    review_reason=reasons,
    needs_review=cardinality(reasons)>0,
    catalog_quality_reason=identity_reasons,
    catalog_quality_status=case when cardinality(identity_reasons)=0 then 'READY' else 'REQUIRES_EDITOR_REVIEW' end,
    review_state=case
      when missing_manufacturer or missing_category or missing_model or missing_application_area then 'blocked'::cloud.review_status
      when cardinality(reasons)>0 then 'pending'::cloud.review_status
      else 'in_review'::cloud.review_status end
  where id=p_id;
  return cloud.catalog_admin_product(p_id);
end;
$$;

commit;
