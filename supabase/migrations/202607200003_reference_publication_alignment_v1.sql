-- Reference Publication Alignment v1.
-- Service-only snapshot, transactional publication and batch-scoped rollback.

begin;

create or replace function cloud.reference_publication_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, cloud
as $$
begin
  if not cloud.is_service_request() then
    raise exception 'reference publication snapshot requires service role' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'manufacturers', coalesce((select jsonb_agg(jsonb_build_object(
      'id', m.id, 'code', m.code, 'slug', m.slug, 'canonicalName', m.canonical_name,
      'aliases', coalesce((select jsonb_agg(a.alias order by a.normalized_alias) from cloud.manufacturer_aliases a where a.manufacturer_id = m.id), '[]'::jsonb),
      'status', m.publication_status) order by m.code) from cloud.manufacturers m), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'code', c.code, 'slug', c.slug, 'canonicalName', c.canonical_name,
      'parentCode', p.code,
      'aliases', coalesce((select jsonb_agg(a.alias order by a.normalized_alias) from cloud.category_aliases a where a.category_id = c.id), '[]'::jsonb),
      'status', c.publication_status) order by c.code) from cloud.categories c left join cloud.categories p on p.id = c.parent_id), '[]'::jsonb),
    'applicationAreas', coalesce((select jsonb_agg(jsonb_build_object(
      'id', a.id, 'code', a.code, 'slug', a.slug, 'canonicalName', a.canonical_name,
      'aliases', coalesce((select jsonb_agg(aa.alias order by aa.normalized_alias) from cloud.application_area_aliases aa where aa.application_area_id = a.id), '[]'::jsonb),
      'status', a.publication_status) order by a.code) from cloud.application_areas a), '[]'::jsonb),
    'legacyMappings', coalesce((select jsonb_agg(jsonb_build_object(
      'id', lm.id, 'code', lm.code, 'legacyValue', lm.legacy_value,
      'normalizedLegacyValue', lm.normalized_legacy_value, 'sourceContext', lm.source_context,
      'targetCategoryCode', tc.code,
      'targetApplicationAreaCodes', coalesce((select jsonb_agg(a.code order by a.code) from cloud.application_areas a where a.id = any(lm.target_application_area_ids)), '[]'::jsonb),
      'targetCategoryCandidateCodes', coalesce((select jsonb_agg(c.code order by c.code) from cloud.categories c where c.id = any(lm.target_category_candidate_ids)), '[]'::jsonb),
      'mappingType', lm.mapping_type, 'reviewerStatus', lm.reviewer_status,
      'reviewerRequired', lm.reviewer_required, 'blocksPublication', lm.blocks_publication
    ) order by lm.code) from cloud.legacy_category_mappings lm left join cloud.categories tc on tc.id = lm.target_category_id), '[]'::jsonb)
  );
end
$$;

create or replace function cloud.apply_reference_publication(p_plan jsonb, p_batch_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  item jsonb;
  target_table text;
  target_id uuid;
  current_status cloud.reference_status;
  changed_count integer := 0;
  unchanged_count integer := 0;
begin
  if not cloud.is_service_request() then
    raise exception 'reference publication requires service role' using errcode = '42501';
  end if;
  if p_batch_key <> 'reference-publication-v1-staging' then
    raise exception 'invalid reference publication batch key' using errcode = '22023';
  end if;
  if jsonb_typeof(p_plan) <> 'array' then
    raise exception 'publication plan must be an array' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_plan) loop
    target_table := item ->> 'entity';
    if target_table not in ('manufacturers', 'categories', 'application_areas')
      or item ->> 'newStatus' <> 'published'
      or item ->> 'comparison' not in ('exact_match', 'acceptable_normalized_match') then
      raise exception 'invalid publication plan item' using errcode = '22023';
    end if;

    if target_table = 'manufacturers' then
      select id, publication_status into target_id, current_status from cloud.manufacturers where code = item ->> 'code' for update;
    elsif target_table = 'categories' then
      select id, publication_status into target_id, current_status from cloud.categories where code = item ->> 'code' for update;
    else
      select id, publication_status into target_id, current_status from cloud.application_areas where code = item ->> 'code' for update;
    end if;
    if target_id is null or target_id::text <> item ->> 'id' then
      raise exception 'reference identity mismatch for %:%', target_table, item ->> 'code' using errcode = 'P0001';
    end if;
    if current_status = 'published' then
      unchanged_count := unchanged_count + 1;
      continue;
    end if;
    if current_status::text <> item ->> 'previousStatus' then
      raise exception 'reference status mismatch for %:%', target_table, item ->> 'code' using errcode = 'P0001';
    end if;

    if target_table = 'manufacturers' then
      update cloud.manufacturers set publication_status = 'published', migration_batch_key = p_batch_key, updated_at = now() where id = target_id;
    elsif target_table = 'categories' then
      update cloud.categories set publication_status = 'published', migration_batch_key = p_batch_key, updated_at = now() where id = target_id;
    else
      update cloud.application_areas set publication_status = 'published', migration_batch_key = p_batch_key, updated_at = now() where id = target_id;
    end if;
    insert into cloud.audit_log(action, entity_type, entity_id, before_data, after_data, source, request_id)
    values ('publish', target_table, target_id, jsonb_build_object('publicationStatus', current_status), jsonb_build_object('publicationStatus', 'published'), 'reference-publication-alignment-v1', p_batch_key);
    changed_count := changed_count + 1;
  end loop;
  return jsonb_build_object('batchKey', p_batch_key, 'changed', changed_count, 'unchanged', unchanged_count);
end
$$;

create or replace function cloud.rollback_reference_publication(p_batch_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare entry record; restored integer := 0;
begin
  if not cloud.is_service_request() then
    raise exception 'reference publication rollback requires service role' using errcode = '42501';
  end if;
  if p_batch_key <> 'reference-publication-v1-staging' then
    raise exception 'invalid reference publication batch key' using errcode = '22023';
  end if;
  for entry in
    select distinct on (entity_type, entity_id) entity_type, entity_id, before_data ->> 'publicationStatus' as previous_status
    from cloud.audit_log
    where request_id = p_batch_key and source = 'reference-publication-alignment-v1' and action = 'publish'
    order by entity_type, entity_id, created_at desc
  loop
    if entry.entity_type = 'manufacturers' then
      update cloud.manufacturers set publication_status = entry.previous_status::cloud.reference_status, updated_at = now() where id = entry.entity_id and publication_status = 'published' and migration_batch_key = p_batch_key;
    elsif entry.entity_type = 'categories' then
      update cloud.categories set publication_status = entry.previous_status::cloud.reference_status, updated_at = now() where id = entry.entity_id and publication_status = 'published' and migration_batch_key = p_batch_key;
    elsif entry.entity_type = 'application_areas' then
      update cloud.application_areas set publication_status = entry.previous_status::cloud.reference_status, updated_at = now() where id = entry.entity_id and publication_status = 'published' and migration_batch_key = p_batch_key;
    end if;
    if found then restored := restored + 1; end if;
  end loop;
  return jsonb_build_object('batchKey', p_batch_key, 'restored', restored);
end
$$;

create or replace function cloud_api.reference_publication_snapshot()
returns jsonb language sql security definer set search_path = pg_catalog, cloud
as $$ select cloud.reference_publication_snapshot() $$;
create or replace function cloud_api.apply_reference_publication(p_plan jsonb, p_batch_key text)
returns jsonb language sql security definer set search_path = pg_catalog, cloud
as $$ select cloud.apply_reference_publication(p_plan, p_batch_key) $$;
create or replace function cloud_api.rollback_reference_publication(p_batch_key text)
returns jsonb language sql security definer set search_path = pg_catalog, cloud
as $$ select cloud.rollback_reference_publication(p_batch_key) $$;

revoke all on function cloud_api.reference_publication_snapshot() from public, anon, authenticated;
revoke all on function cloud_api.apply_reference_publication(jsonb, text) from public, anon, authenticated;
revoke all on function cloud_api.rollback_reference_publication(text) from public, anon, authenticated;
grant execute on function cloud_api.reference_publication_snapshot() to service_role;
grant execute on function cloud_api.apply_reference_publication(jsonb, text) to service_role;
grant execute on function cloud_api.rollback_reference_publication(text) to service_role;

commit;
