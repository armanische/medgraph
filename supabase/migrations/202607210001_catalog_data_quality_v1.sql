-- Catalog Data Quality v1: deterministic identity corrections for the existing
-- 79-product staging batch. No product creation or publication is permitted.

begin;

alter table cloud.products
  add column missing_model boolean not null default true,
  add column catalog_quality_status text not null default 'REQUIRES_EDITOR_REVIEW',
  add column catalog_quality_reason text[] not null default '{}',
  add constraint products_catalog_quality_status_check
    check (catalog_quality_status in ('READY', 'REQUIRES_EDITOR_REVIEW'));

update cloud.products
set
  missing_model = model is null or btrim(model) = '',
  catalog_quality_status = case
    when manufacturer_id is not null and category_id is not null and model is not null and btrim(model) <> ''
      then 'READY'
    else 'REQUIRES_EDITOR_REVIEW'
  end,
  catalog_quality_reason = array_remove(array[
    case when manufacturer_id is null then 'UNKNOWN_MANUFACTURER' end,
    case when category_id is null then 'UNKNOWN_CATEGORY' end,
    case when model is null or btrim(model) = '' then 'MODEL_NOT_EXPLICIT_IN_SOURCE' end
  ], null)
where import_batch_key = 'product-import-v1-staging';

create or replace function cloud.catalog_data_quality_inventory()
returns jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, cloud, extensions
as $$
declare result jsonb;
begin
  if not cloud.is_service_request() then
    raise exception 'catalog data quality inventory requires service role' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'total', count(*),
    'manufacturerResolved', count(*) filter (where manufacturer_id is not null),
    'manufacturerMissing', count(*) filter (where manufacturer_id is null),
    'categoryResolved', count(*) filter (where category_id is not null),
    'categoryMissing', count(*) filter (where category_id is null),
    'modelResolved', count(*) filter (where model is not null and btrim(model) <> ''),
    'modelMissing', count(*) filter (where model is null or btrim(model) = ''),
    'ready', count(*) filter (where catalog_quality_status = 'READY'),
    'requiresEditorReview', count(*) filter (where catalog_quality_status = 'REQUIRES_EDITOR_REVIEW'),
    'published', count(*) filter (where published),
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'sourceUid', source_uid,
      'sourceChecksum', source_checksum,
      'title', title,
      'model', model,
      'manufacturerId', manufacturer_id,
      'categoryId', category_id,
      'status', catalog_quality_status,
      'reasons', to_jsonb(catalog_quality_reason),
      'publicationStatus', publication_status,
      'published', published,
      'publishedAt', published_at,
      'importBatchKey', import_batch_key
    ) order by source_uid), '[]'::jsonb)
  ) into result
  from cloud.products
  where import_batch_key = 'product-import-v1-staging';
  return result;
end;
$$;

create or replace function cloud.apply_catalog_data_quality_v1(p_plan jsonb, p_actor text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  proposal jsonb;
  product_row cloud.products%rowtype;
  manufacturer_uuid uuid;
  category_uuid uuid;
  next_model text;
  next_manufacturer uuid;
  next_category uuid;
  next_reasons text[];
  before_summary jsonb;
  after_summary jsonb;
  updated_products integer := 0;
  manufacturer_updates integer := 0;
  category_updates integer := 0;
  model_updates integer := 0;
begin
  if not cloud.is_service_request() then
    raise exception 'catalog data quality apply requires service role' using errcode = '42501';
  end if;
  if nullif(btrim(p_actor), '') is null then
    raise exception 'catalog data quality actor is required' using errcode = '22023';
  end if;
  if p_plan ->> 'version' <> 'catalog-data-quality-v1'
     or jsonb_typeof(p_plan -> 'products') <> 'array'
     or jsonb_array_length(p_plan -> 'products') <> 79 then
    raise exception 'catalog data quality plan must contain exactly 79 v1 proposals' using errcode = '22023';
  end if;
  if (select count(distinct value ->> 'sourceUid') from jsonb_array_elements(p_plan -> 'products')) <> 79 then
    raise exception 'catalog data quality plan contains duplicate sourceUid values' using errcode = '22023';
  end if;
  if (select count(*) from cloud.products where import_batch_key = 'product-import-v1-staging') <> 79 then
    raise exception 'staging product batch is not the expected 79-product set' using errcode = 'P0001';
  end if;

  before_summary := cloud.catalog_data_quality_inventory() - 'items';

  for proposal in select value from jsonb_array_elements(p_plan -> 'products') order by value ->> 'sourceUid' loop
    select * into product_row
    from cloud.products
    where source_uid = proposal ->> 'sourceUid'
      and import_batch_key = 'product-import-v1-staging'
    for update;
    if not found then
      raise exception 'product not found for sourceUid %', proposal ->> 'sourceUid' using errcode = 'P0002';
    end if;
    if product_row.source_checksum <> proposal ->> 'sourceChecksum'
       or product_row.title <> proposal ->> 'sourceTitle' then
      raise exception 'immutable identity mismatch for sourceUid %', proposal ->> 'sourceUid' using errcode = '23000';
    end if;
    if product_row.publication_status <> 'draft' or product_row.published or product_row.published_at is not null then
      raise exception 'catalog quality apply cannot touch a published product' using errcode = '23000';
    end if;

    manufacturer_uuid := null;
    if nullif(proposal ->> 'manufacturerId', '') is not null then
      select id into manufacturer_uuid
      from cloud.manufacturers
      where code = proposal ->> 'manufacturerId' and publication_status = 'published' and archived_at is null;
      if manufacturer_uuid is null then
        raise exception 'invalid manufacturer reference %', proposal ->> 'manufacturerId' using errcode = '23503';
      end if;
    end if;

    category_uuid := null;
    if nullif(proposal ->> 'categoryId', '') is not null then
      select id into category_uuid
      from cloud.categories
      where code = proposal ->> 'categoryId' and publication_status = 'published'
        and assignable and archived_at is null;
      if category_uuid is null then
        raise exception 'invalid category reference %', proposal ->> 'categoryId' using errcode = '23503';
      end if;
    end if;

    if product_row.manufacturer_id is not null and manufacturer_uuid is not null
       and product_row.manufacturer_id <> manufacturer_uuid then
      raise exception 'manufacturer conflict for sourceUid %', proposal ->> 'sourceUid' using errcode = '23000';
    end if;
    if product_row.category_id is not null and category_uuid is not null
       and product_row.category_id <> category_uuid then
      raise exception 'category conflict for sourceUid %', proposal ->> 'sourceUid' using errcode = '23000';
    end if;
    if product_row.model is not null and btrim(product_row.model) <> ''
       and nullif(proposal ->> 'model', '') is not null
       and product_row.model <> proposal ->> 'model' then
      raise exception 'model conflict for sourceUid %', proposal ->> 'sourceUid' using errcode = '23000';
    end if;

    next_manufacturer := coalesce(product_row.manufacturer_id, manufacturer_uuid);
    next_category := coalesce(product_row.category_id, category_uuid);
    next_model := coalesce(nullif(btrim(product_row.model), ''), nullif(btrim(proposal ->> 'model'), ''));
    next_reasons := array_remove(array[
      case when next_manufacturer is null then 'UNKNOWN_MANUFACTURER' end,
      case when next_category is null then coalesce(
        (select value #>> '{}' from jsonb_array_elements(proposal -> 'reasons')
         where value #>> '{}' in ('CATEGORY_SOURCE_CONFLICT', 'UNKNOWN_CATEGORY') limit 1),
        'UNKNOWN_CATEGORY') end,
      case when next_model is null then 'MODEL_NOT_EXPLICIT_IN_SOURCE' end
    ], null);

    if product_row.manufacturer_id is null and next_manufacturer is not null then
      manufacturer_updates := manufacturer_updates + 1;
    end if;
    if product_row.category_id is null and next_category is not null then
      category_updates := category_updates + 1;
    end if;
    if product_row.model is null and next_model is not null then
      model_updates := model_updates + 1;
    end if;

    if product_row.manufacturer_id is distinct from next_manufacturer
       or product_row.category_id is distinct from next_category
       or product_row.model is distinct from next_model
       or product_row.missing_model is distinct from (next_model is null)
       or product_row.catalog_quality_reason is distinct from next_reasons
       or product_row.catalog_quality_status is distinct from
         (case when cardinality(next_reasons) = 0 then 'READY' else 'REQUIRES_EDITOR_REVIEW' end) then
      update cloud.products set
        manufacturer_id = next_manufacturer,
        category_id = next_category,
        model = next_model,
        missing_manufacturer = next_manufacturer is null,
        missing_category = next_category is null,
        missing_model = next_model is null,
        catalog_quality_status = case
          when cardinality(next_reasons) = 0 then 'READY'
          else 'REQUIRES_EDITOR_REVIEW'
        end,
        catalog_quality_reason = next_reasons,
        updated_at = now(),
        updated_by = p_actor
      where id = product_row.id;
      updated_products := updated_products + 1;
    end if;
  end loop;

  after_summary := cloud.catalog_data_quality_inventory() - 'items';
  if (after_summary ->> 'total')::integer <> 79 or (after_summary ->> 'published')::integer <> 0 then
    raise exception 'catalog data quality postcondition failed' using errcode = '23000';
  end if;
  return jsonb_build_object(
    'before', before_summary,
    'after', after_summary,
    'updatedProducts', updated_products,
    'fieldUpdates', jsonb_build_object(
      'manufacturer', manufacturer_updates,
      'category', category_updates,
      'model', model_updates
    ),
    'actor', p_actor,
    'createsProducts', false,
    'changesPublication', false
  );
end;
$$;

create or replace function cloud_api.catalog_data_quality_inventory()
returns jsonb
language sql
security definer
stable
set search_path = pg_catalog, cloud
as $$ select cloud.catalog_data_quality_inventory() $$;

create or replace function cloud_api.apply_catalog_data_quality_v1(p_plan jsonb, p_actor text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$ select cloud.apply_catalog_data_quality_v1(p_plan, p_actor) $$;

revoke all on function cloud_api.catalog_data_quality_inventory() from public, anon, authenticated;
revoke all on function cloud_api.apply_catalog_data_quality_v1(jsonb, text) from public, anon, authenticated;
grant execute on function cloud_api.catalog_data_quality_inventory() to service_role;
grant execute on function cloud_api.apply_catalog_data_quality_v1(jsonb, text) to service_role;

commit;
