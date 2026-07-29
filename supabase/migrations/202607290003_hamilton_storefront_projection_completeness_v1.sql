-- Hamilton-T1 Storefront Projection Completeness v1.
-- Extends the published-only read model from the current immutable Product
-- revision and provides a checksum-bound, service-only clock refresh for the
-- already-published launch Product. No Product or publication evidence changes.

begin;

alter function cloud.cloud_published_storefront_catalog_source_v2()
  rename to cloud_published_storefront_catalog_source_pre_completeness_v1;

create or replace function cloud.published_characteristic_groups_from_revision_v1(
  p_characteristics jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = pg_catalog, cloud
as $$
declare
  result jsonb;
begin
  if jsonb_typeof(p_characteristics) <> 'array' then
    return null;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_characteristics) characteristic(item)
    where jsonb_typeof(characteristic.item) <> 'object'
      or nullif(btrim(cloud.public_json_text_v1(characteristic.item -> 'key')), '') is null
      or cloud.public_json_text_v1(characteristic.item -> 'contentKind') not in (
        'legacy_metadata', 'technical_specification'
      )
      or cloud.public_json_text_v1(characteristic.item -> 'recordOrigin') not in (
        'legacy', 'structured_product_detail'
      )
      or nullif(btrim(cloud.public_json_text_v1(characteristic.item -> 'label')), '') is null
      or nullif(btrim(cloud.public_json_text_v1(characteristic.item -> 'value')), '') is null
      or (
        characteristic.item ? 'unit'
        and jsonb_typeof(characteristic.item -> 'unit') not in ('null', 'string')
      )
      or jsonb_typeof(characteristic.item -> 'group') <> 'object'
      or nullif(btrim(cloud.public_json_text_v1(
        characteristic.item #> '{group,key}'
      )), '') is null
      or nullif(btrim(cloud.public_json_text_v1(
        characteristic.item #> '{group,title}'
      )), '') is null
      or cloud.public_json_nonnegative_integer_v1(
        characteristic.item #> '{group,sortOrder}'
      ) is null
      or cloud.public_json_nonnegative_integer_v1(
        characteristic.item -> 'sortOrder'
      ) is null
  ) then
    return null;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'key', grouped.group_key,
      'title', grouped.group_title,
      'sortOrder', grouped.group_sort_order,
      'items', grouped.items
    ) order by grouped.group_sort_order, grouped.group_key, grouped.group_title
  ), '[]'::jsonb)
  into result
  from (
    select
      cloud.public_json_text_v1(characteristic.item #> '{group,key}') as group_key,
      cloud.public_json_text_v1(characteristic.item #> '{group,title}') as group_title,
      cloud.public_json_nonnegative_integer_v1(
        characteristic.item #> '{group,sortOrder}'
      ) as group_sort_order,
      jsonb_agg(jsonb_build_object(
        'key', cloud.public_json_text_v1(characteristic.item -> 'key'),
        'contentKind', cloud.public_json_text_v1(characteristic.item -> 'contentKind'),
        'recordOrigin', cloud.public_json_text_v1(characteristic.item -> 'recordOrigin'),
        'label', cloud.public_json_text_v1(characteristic.item -> 'label'),
        'value', cloud.public_json_text_v1(characteristic.item -> 'value'),
        'unit', nullif(btrim(cloud.public_json_text_v1(
          characteristic.item -> 'unit'
        )), ''),
        'sortOrder', cloud.public_json_nonnegative_integer_v1(
          characteristic.item -> 'sortOrder'
        )
      ) order by
        cloud.public_json_nonnegative_integer_v1(characteristic.item -> 'sortOrder'),
        cloud.public_json_text_v1(characteristic.item -> 'key'),
        cloud.public_json_text_v1(characteristic.item -> 'label')
      ) as items
    from jsonb_array_elements(p_characteristics) characteristic(item)
    group by
      cloud.public_json_text_v1(characteristic.item #> '{group,key}'),
      cloud.public_json_text_v1(characteristic.item #> '{group,title}'),
      cloud.public_json_nonnegative_integer_v1(
        characteristic.item #> '{group,sortOrder}'
      )
  ) grouped;

  return result;
end
$$;

create or replace function cloud.cloud_published_storefront_catalog_source_v2()
returns jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  source_payload jsonb;
  completed_products jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'published Storefront projection requires service role'
      using errcode = '42501';
  end if;

  source_payload := cloud.cloud_published_storefront_catalog_source_pre_completeness_v1();

  select coalesce(jsonb_agg(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          product_item.value,
          '{seoTitle}',
          coalesce(to_jsonb(nullif(btrim(cloud.public_json_text_v1(
            revision.candidate_payload #> '{product,seoTitle}'
          )), '')), 'null'::jsonb),
          true
        ),
        '{seoDescription}',
        coalesce(to_jsonb(nullif(btrim(cloud.public_json_text_v1(
          revision.candidate_payload #> '{product,seoDescription}'
        )), '')), 'null'::jsonb),
        true
      ),
      '{characteristicGroups}',
      case
        when jsonb_typeof(revision.candidate_payload -> 'characteristics') = 'array'
          and jsonb_array_length(revision.candidate_payload -> 'characteristics') > 0
        then coalesce(
          cloud.published_characteristic_groups_from_revision_v1(
            revision.candidate_payload -> 'characteristics'
          ),
          '[]'::jsonb
        )
        else coalesce(product_item.value -> 'characteristicGroups', '[]'::jsonb)
      end,
      true
    ) order by product_item.value ->> 'slug'
  ), '[]'::jsonb)
  into completed_products
  from jsonb_array_elements(source_payload -> 'products') product_item(value)
  join cloud.products product
    on product.slug = product_item.value ->> 'slug'
  join cloud.product_publication_revisions revision
    on revision.id = product.current_product_publication_revision_id
    and revision.product_id = product.id
    and revision.candidate_payload_checksum = cloud.sha256_jsonb_v1(
      revision.candidate_payload
    )
    and revision.product_identity_checksum = cloud.sha256_jsonb_v1(
      revision.product_identity
    )
    and revision.payload_checksum = cloud.product_publication_payload_checksum_v1(
      revision.schema_version,
      revision.product_identity,
      revision.candidate_payload
    );

  return jsonb_set(source_payload, '{products}', completed_products, false);
end
$$;

create or replace function cloud.refresh_published_product_projection_completeness_v1(
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
volatile
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  target_slug text;
  target_revision_id uuid;
  target_revision_checksum text;
  state_version bigint;
  state_changed_at timestamptz;
  state_checksum text;
  old_source jsonb;
  new_source jsonb;
  public_payload jsonb;
  old_target jsonb;
  new_target jsonb;
  old_other_products jsonb;
  new_other_products jsonb;
  reconstructed_old_products jsonb;
  expected_old_checksum text;
  final_checksum text;
  target_changed_at timestamptz;
  result_idempotent boolean := false;
begin
  if auth.role() <> 'service_role' then
    raise exception 'published Product projection refresh requires service role'
      using errcode = '42501';
  end if;

  select product.slug, revision.id, revision.payload_checksum
  into target_slug, target_revision_id, target_revision_checksum
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
  where product.id = p_product_id
    and product.publication_status = 'published'
    and product.review_state = 'published'
    and product.published_at is not null
    and product.archived_at is null
    and revision.candidate_payload_checksum = cloud.sha256_jsonb_v1(
      revision.candidate_payload
    )
    and revision.product_identity_checksum = cloud.sha256_jsonb_v1(
      revision.product_identity
    )
    and revision.payload_checksum = cloud.product_publication_payload_checksum_v1(
      revision.schema_version,
      revision.product_identity,
      revision.candidate_payload
    )
  for update of product;

  if not found then
    raise exception 'published Product projection refresh target is not current and approved'
      using errcode = '55000';
  end if;

  select state.version, state.changed_at, state.payload_checksum
  into state_version, state_changed_at, state_checksum
  from cloud.published_catalog_projection_state state
  where state.singleton and state.initialized
  for update;

  if not found or state_checksum is null then
    raise exception 'published projection clock is not initialized'
      using errcode = '55000';
  end if;

  old_source := cloud.cloud_published_storefront_catalog_source_pre_completeness_v1();
  new_source := cloud.cloud_published_storefront_catalog_source_v2();
  public_payload := cloud.cloud_published_storefront_catalog_v1();

  select item into old_target
  from jsonb_array_elements(old_source -> 'products') item
  where item ->> 'slug' = target_slug;
  select item into new_target
  from jsonb_array_elements(public_payload -> 'products') item
  where item ->> 'slug' = target_slug;

  if old_target is null or new_target is null then
    raise exception 'published Product projection refresh target is absent from projection'
      using errcode = '55000';
  end if;

  select coalesce(jsonb_agg(item order by item ->> 'slug'), '[]'::jsonb)
  into old_other_products
  from jsonb_array_elements(old_source -> 'products') item
  where item ->> 'slug' <> target_slug;
  if exists (
    select 1
    from jsonb_array_elements(new_source -> 'products') new_item
    join jsonb_array_elements(old_source -> 'products') old_item
      on old_item ->> 'slug' = new_item ->> 'slug'
    where new_item ->> 'slug' <> target_slug
      and (
        new_item -> 'seoTitle' <> 'null'::jsonb
        or new_item -> 'seoDescription' <> 'null'::jsonb
        or new_item -> 'characteristicGroups'
          is distinct from old_item -> 'characteristicGroups'
      )
  ) then
    raise exception 'published Product projection refresh would complete another Product'
      using errcode = '55000';
  end if;
  select coalesce(jsonb_agg(
    item - 'seoTitle' - 'seoDescription' order by item ->> 'slug'
  ), '[]'::jsonb)
  into new_other_products
  from jsonb_array_elements(new_source -> 'products') item
  where item ->> 'slug' <> target_slug;

  if old_other_products is distinct from new_other_products
     or (old_source - 'products' - 'generatedAt')
       is distinct from (new_source - 'products' - 'generatedAt') then
    raise exception 'published Product projection refresh would affect another Product'
      using errcode = '55000';
  end if;

  select jsonb_agg(
    case
      when item ->> 'slug' = target_slug then
        jsonb_set(
          item - 'seoTitle' - 'seoDescription',
          '{characteristicGroups}',
          coalesce(old_target -> 'characteristicGroups', '[]'::jsonb),
          true
        )
      else item
    end
    order by item ->> 'slug'
  )
  into reconstructed_old_products
  from jsonb_array_elements(public_payload -> 'products') item;

  expected_old_checksum := cloud.sha256_jsonb_v1(
    jsonb_set(
      public_payload,
      '{products}',
      coalesce(reconstructed_old_products, '[]'::jsonb),
      false
    ) - 'generatedAt'
  );
  final_checksum := cloud.sha256_jsonb_v1(public_payload - 'generatedAt');

  if state_checksum = final_checksum then
    result_idempotent := true;
  elsif state_checksum = expected_old_checksum then
    target_changed_at := greatest(
      clock_timestamp(),
      state_changed_at + interval '1 microsecond'
    );
    update cloud.published_catalog_projection_state state
    set version = state_version + 1,
        changed_at = target_changed_at,
        payload_checksum = final_checksum
    where state.singleton;
    state_version := state_version + 1;
    state_changed_at := target_changed_at;
  else
    raise exception 'published projection refresh checksum mismatch'
      using errcode = '55000';
  end if;

  return jsonb_build_object(
    'productId', p_product_id,
    'revisionId', target_revision_id,
    'revisionChecksum', target_revision_checksum,
    'projectionVersion', state_version,
    'projectionGeneratedAt', state_changed_at,
    'projectionChecksum', final_checksum,
    'idempotent', result_idempotent
  );
end
$$;

create or replace function cloud_api.refresh_published_product_projection_completeness_v1(
  p_product_id uuid
)
returns jsonb
language sql
security definer
volatile
set search_path = pg_catalog, cloud
as $$
  select cloud.refresh_published_product_projection_completeness_v1(p_product_id)
$$;

revoke all on function cloud.published_characteristic_groups_from_revision_v1(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function cloud.cloud_published_storefront_catalog_source_pre_completeness_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.cloud_published_storefront_catalog_source_v2()
  from public, anon, authenticated, service_role;
revoke all on function cloud.refresh_published_product_projection_completeness_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function cloud_api.refresh_published_product_projection_completeness_v1(uuid)
  from public, anon, authenticated;
grant execute on function cloud_api.refresh_published_product_projection_completeness_v1(uuid)
  to service_role;

comment on function cloud.cloud_published_storefront_catalog_source_v2() is
  'Published Storefront source completed from current immutable Product revision SEO and characteristics; malformed revision fields fail closed.';
comment on function cloud.refresh_published_product_projection_completeness_v1(uuid) is
  'Checksum-bound targeted clock refresh for an already-published current approved Product after the projection completeness contract change.';
comment on function cloud_api.refresh_published_product_projection_completeness_v1(uuid) is
  'Service-only targeted published Product projection completeness refresh; creates no publication evidence.';

commit;
