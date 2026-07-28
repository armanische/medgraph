-- Synchronize the canonical Russian Product description representation and
-- reject stale Catalog Admin writes without changing the public RPC signature.

begin;

create or replace function cloud.catalog_admin_patch_product(p_id uuid, p_patch jsonb, p_actor text) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  allowed text[] := array[
    'title',
    'model',
    'shortDescription',
    'description',
    'seoTitle',
    'seoDescription',
    'manufacturerId',
    'categoryId',
    'applicationAreaId',
    'expectedUpdatedAt'
  ];
  key text;
  manufacturer_uuid uuid;
  category_uuid uuid;
  area_uuid uuid;
  canonical_description_uuid uuid;
  expected_updated_at_text text;
  expected_updated_at timestamptz;
  current_updated_at timestamptz;
  change_timestamp timestamptz;
  reasons text[];
  identity_reasons text[];
begin
  if not cloud.is_service_request() then
    raise exception 'catalog admin requires service role' using errcode = '42501';
  end if;
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'catalog admin actor is required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_patch) <> 'object' then
    raise exception 'patch must be an object' using errcode = '22023';
  end if;
  for key in select jsonb_object_keys(p_patch) loop
    if not key = any(allowed) then
      raise exception 'immutable or unsupported field: %', key using errcode = '22023';
    end if;
  end loop;
  if not p_patch ? 'expectedUpdatedAt'
     or jsonb_typeof(p_patch -> 'expectedUpdatedAt') <> 'string'
     or nullif(btrim(p_patch ->> 'expectedUpdatedAt'), '') is null then
    raise exception 'expectedUpdatedAt is required' using errcode = '22023';
  end if;
  expected_updated_at_text := btrim(p_patch ->> 'expectedUpdatedAt');
  if expected_updated_at_text !~
     '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$' then
    raise exception 'expectedUpdatedAt must be an ISO timestamp with timezone' using errcode = '22023';
  end if;
  begin
    expected_updated_at := expected_updated_at_text::timestamptz;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      raise exception 'expectedUpdatedAt must be a valid ISO timestamp' using errcode = '22023';
  end;
  if p_patch ? 'model' and nullif(btrim(p_patch->>'model'), '') is null then
    raise exception 'model cannot be blank; omit the field to preserve it' using errcode = '22023';
  end if;

  select product.updated_at
  into current_updated_at
  from cloud.products product
  where product.id = p_id
  for update;
  if not found then
    raise exception 'product not found' using errcode = 'P0002';
  end if;
  if current_updated_at is distinct from expected_updated_at then
    raise exception 'stale catalog admin patch' using errcode = '40001';
  end if;

  if p_patch ? 'shortDescription' or p_patch ? 'description' then
    select description.id
    into canonical_description_uuid
    from cloud.product_descriptions description
    where description.product_id = p_id
      and description.locale = 'ru'
    for update;
    if not found then
      raise exception 'canonical ru product description is missing' using errcode = 'P0002';
    end if;
  end if;

  if p_patch ? 'manufacturerId' and nullif(p_patch->>'manufacturerId','') is not null then
    manufacturer_uuid := (p_patch->>'manufacturerId')::uuid;
    if not exists(select 1 from cloud.manufacturers where id=manufacturer_uuid and publication_status='published') then
      raise exception 'manufacturer reference is invalid' using errcode='23503';
    end if;
  elsif p_patch ? 'manufacturerId' then
    manufacturer_uuid := null;
  end if;
  if p_patch ? 'categoryId' and nullif(p_patch->>'categoryId','') is not null then
    category_uuid := (p_patch->>'categoryId')::uuid;
    if not exists(select 1 from cloud.categories where id=category_uuid and publication_status='published' and assignable) then
      raise exception 'category reference is invalid' using errcode='23503';
    end if;
  elsif p_patch ? 'categoryId' then
    category_uuid := null;
  end if;
  if p_patch ? 'applicationAreaId' and nullif(p_patch->>'applicationAreaId','') is not null then
    area_uuid := (p_patch->>'applicationAreaId')::uuid;
    if not exists(select 1 from cloud.application_areas where id=area_uuid and publication_status='published') then
      raise exception 'application area reference is invalid' using errcode='23503';
    end if;
  elsif p_patch ? 'applicationAreaId' then
    area_uuid := null;
  end if;

  change_timestamp := greatest(clock_timestamp(), current_updated_at + interval '1 microsecond');

  update cloud.products set
    title = case when p_patch ? 'title' then nullif(btrim(p_patch->>'title'),'') else title end,
    model = case when p_patch ? 'model' then nullif(btrim(p_patch->>'model'),'') else model end,
    short_description = case when p_patch ? 'shortDescription' then nullif(btrim(p_patch->>'shortDescription'),'') else short_description end,
    full_description = case when p_patch ? 'description' then nullif(btrim(p_patch->>'description'),'') else full_description end,
    seo_title = case when p_patch ? 'seoTitle' then nullif(btrim(p_patch->>'seoTitle'),'') else seo_title end,
    seo_description = case when p_patch ? 'seoDescription' then nullif(btrim(p_patch->>'seoDescription'),'') else seo_description end,
    manufacturer_id = case when p_patch ? 'manufacturerId' then manufacturer_uuid else manufacturer_id end,
    category_id = case when p_patch ? 'categoryId' then category_uuid else category_id end,
    updated_at = change_timestamp,
    updated_by = p_actor
  where id = p_id;

  if canonical_description_uuid is not null then
    update cloud.product_descriptions description
    set short_description = coalesce(product.short_description, ''),
        full_description = coalesce(product.full_description, ''),
        updated_at = change_timestamp
    from cloud.products product
    where description.id = canonical_description_uuid
      and description.product_id = p_id
      and description.locale = 'ru'
      and product.id = p_id;
    if not found then
      raise exception 'canonical ru product description synchronization failed' using errcode = 'P0002';
    end if;
  end if;

  if p_patch ? 'applicationAreaId' then
    delete from cloud.product_application_areas where product_id = p_id;
    if area_uuid is not null then
      insert into cloud.product_application_areas(product_id, application_area_id) values(p_id, area_uuid);
    end if;
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
