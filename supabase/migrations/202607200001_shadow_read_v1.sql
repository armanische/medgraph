-- Shadow Read v1: additive anon read surface for published reference data only.
-- The cloud schema remains unexposed; no write grants or product access are added.

begin;

grant usage on schema cloud_api to anon, authenticated;

grant select on table
  cloud.manufacturers,
  cloud.manufacturer_aliases,
  cloud.categories,
  cloud.category_aliases,
  cloud.application_areas,
  cloud.application_area_aliases
to anon, authenticated;

create policy manufacturer_aliases_public_read
on cloud.manufacturer_aliases
for select to anon, authenticated
using (
  exists (
    select 1
    from cloud.manufacturers manufacturer
    where manufacturer.id = manufacturer_id
      and manufacturer.publication_status = 'published'
  )
);

create policy category_aliases_public_read
on cloud.category_aliases
for select to anon, authenticated
using (
  exists (
    select 1
    from cloud.categories category
    where category.id = category_id
      and category.publication_status = 'published'
  )
);

create policy application_area_aliases_public_read
on cloud.application_area_aliases
for select to anon, authenticated
using (
  exists (
    select 1
    from cloud.application_areas application_area
    where application_area.id = application_area_id
      and application_area.publication_status = 'published'
  )
);

create or replace function cloud_api.shadow_reference_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, cloud
as $$
  select jsonb_build_object(
    'manufacturers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', manufacturer.code,
        'slug', manufacturer.slug,
        'canonicalName', manufacturer.canonical_name,
        'aliases', coalesce((
          select jsonb_agg(alias.alias order by alias.normalized_alias)
          from cloud.manufacturer_aliases alias
          where alias.manufacturer_id = manufacturer.id
        ), '[]'::jsonb),
        'status', manufacturer.publication_status
      ) order by manufacturer.code)
      from cloud.manufacturers manufacturer
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', category.code,
        'slug', category.slug,
        'canonicalName', category.canonical_name,
        'aliases', coalesce((
          select jsonb_agg(alias.alias order by alias.normalized_alias)
          from cloud.category_aliases alias
          where alias.category_id = category.id
        ), '[]'::jsonb),
        'status', category.publication_status
      ) order by category.code)
      from cloud.categories category
    ), '[]'::jsonb),
    'applicationAreas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', application_area.code,
        'slug', application_area.slug,
        'canonicalName', application_area.canonical_name,
        'aliases', coalesce((
          select jsonb_agg(alias.alias order by alias.normalized_alias)
          from cloud.application_area_aliases alias
          where alias.application_area_id = application_area.id
        ), '[]'::jsonb),
        'status', application_area.publication_status
      ) order by application_area.code)
      from cloud.application_areas application_area
    ), '[]'::jsonb)
  )
$$;

revoke all on function cloud_api.shadow_reference_snapshot() from public;
grant execute on function cloud_api.shadow_reference_snapshot() to anon, authenticated, service_role;

comment on function cloud_api.shadow_reference_snapshot() is
  'Read-only, RLS-constrained reference snapshot for server-side Shadow Read comparisons.';

commit;
