-- CyberMedica Cloud-First Data Foundation v1
-- Additive only: does not modify the existing FS510 vertical slice.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists cloud;
create schema if not exists cloud_api;

revoke all on schema cloud, cloud_api from public;
grant usage on schema cloud_api to service_role;

create type cloud.confidence_level as enum ('verified', 'reviewed', 'legacy', 'inferred', 'unknown');
create type cloud.reference_status as enum ('draft', 'imported', 'reviewed', 'verified', 'published', 'archived');
create type cloud.product_status as enum ('draft', 'in_review', 'approved', 'published', 'archived');
create type cloud.import_status as enum ('queued', 'running', 'completed', 'completed_with_warnings', 'blocked', 'failed', 'cancelled');
create type cloud.review_status as enum ('pending', 'in_review', 'blocked', 'approved', 'rejected', 'ready_for_publication', 'published', 'archived');
create type cloud.review_decision_type as enum ('approve', 'reject', 'replace', 'defer', 'request_research');
create type cloud.rights_status as enum ('unknown', 'legacy_claim', 'manufacturer_official', 'licensed', 'owned', 'public_domain', 'restricted', 'rejected');

create table cloud.user_profiles (
  id uuid primary key,
  role text not null check (role in ('admin', 'editor', 'reviewer', 'researcher', 'viewer', 'service')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cloud.manufacturers (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  canonical_name text not null,
  display_name text not null,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  description text not null,
  website text,
  confidence cloud.confidence_level not null,
  publication_status cloud.reference_status not null default 'draft',
  legal_manufacturer text,
  commercial_brand text,
  parent_company text,
  founded_year integer check (founded_year is null or founded_year between 1800 and 2200),
  headquarters text,
  migration_batch_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint manufacturers_code_format check (code ~ '^manufacturer-[a-z0-9-]+$'),
  constraint manufacturers_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint manufacturers_names_not_blank check (btrim(canonical_name) <> '' and btrim(display_name) <> '')
);

create unique index manufacturers_canonical_name_uq on cloud.manufacturers (lower(canonical_name));

create table cloud.manufacturer_aliases (
  id uuid primary key default extensions.gen_random_uuid(),
  manufacturer_id uuid not null references cloud.manufacturers(id) on delete restrict,
  alias text not null,
  normalized_alias text not null unique,
  locale text,
  alias_type text not null default 'synonym',
  created_at timestamptz not null default now(),
  constraint manufacturer_alias_not_blank check (btrim(alias) <> '' and btrim(normalized_alias) <> '')
);

create table cloud.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  canonical_name text not null,
  display_name text not null,
  description text not null,
  parent_id uuid references cloud.categories(id) on delete restrict,
  level text not null check (level in ('root', 'child', 'leaf')),
  assignable boolean not null default false,
  confidence cloud.confidence_level not null,
  publication_status cloud.reference_status not null default 'draft',
  sort_order integer not null default 0 check (sort_order >= 0),
  migration_batch_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint categories_parent_not_self check (parent_id is null or parent_id <> id),
  constraint categories_code_format check (code ~ '^category-[a-z0-9-]+$'),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_assignable_leaf check (not assignable or level = 'leaf')
);

create unique index categories_canonical_name_uq on cloud.categories (lower(canonical_name));

create table cloud.category_aliases (
  id uuid primary key default extensions.gen_random_uuid(),
  category_id uuid not null references cloud.categories(id) on delete restrict,
  alias text not null,
  normalized_alias text not null unique,
  locale text,
  alias_type text not null default 'synonym',
  created_at timestamptz not null default now()
);

create table cloud.application_areas (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  canonical_name text not null,
  display_name text not null,
  description text not null,
  confidence cloud.confidence_level not null,
  publication_status cloud.reference_status not null default 'draft',
  migration_batch_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint application_area_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index application_areas_canonical_name_uq on cloud.application_areas (lower(canonical_name));

create table cloud.application_area_aliases (
  id uuid primary key default extensions.gen_random_uuid(),
  application_area_id uuid not null references cloud.application_areas(id) on delete restrict,
  alias text not null,
  normalized_alias text not null unique,
  locale text,
  alias_type text not null default 'synonym',
  created_at timestamptz not null default now()
);

create table cloud.legacy_category_mappings (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  legacy_value text not null,
  normalized_legacy_value text not null,
  source_context text not null,
  target_category_id uuid references cloud.categories(id) on delete restrict,
  target_application_area_ids uuid[] not null default '{}',
  target_category_candidate_ids uuid[] not null default '{}',
  mapping_type text not null check (mapping_type in ('exact', 'normalized', 'broader', 'narrower', 'split', 'application_area', 'deprecated', 'unresolved')),
  confidence cloud.confidence_level not null,
  reviewer_status text not null check (reviewer_status in ('pending', 'approved', 'needs_review', 'rejected')),
  reviewer_required boolean not null default true,
  blocks_publication boolean not null default true,
  rationale text not null,
  notes text,
  migration_batch_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_context, normalized_legacy_value),
  constraint legacy_mapping_exact_target check (
    mapping_type not in ('exact', 'normalized') or target_category_id is not null
  ),
  constraint legacy_mapping_split_target check (
    mapping_type <> 'split' or (target_category_id is null and cardinality(target_category_candidate_ids) > 1 and reviewer_required and blocks_publication)
  ),
  constraint legacy_mapping_application_area check (
    mapping_type <> 'application_area' or (target_category_id is null and cardinality(target_application_area_ids) > 0)
  )
);

create table cloud.storage_objects (
  id uuid primary key default extensions.gen_random_uuid(),
  bucket text not null,
  object_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  source_type text not null,
  source_url text,
  rights_status cloud.rights_status not null default 'unknown',
  confidence cloud.confidence_level not null default 'unknown',
  access_status text not null check (access_status in ('private', 'review', 'public', 'archived')),
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket, object_path),
  unique (bucket, checksum_sha256)
);

create table cloud.products (
  id uuid primary key default extensions.gen_random_uuid(),
  external_code text unique,
  legacy_id text,
  slug text not null unique,
  title text not null,
  model text not null,
  manufacturer_id uuid not null references cloud.manufacturers(id) on delete restrict,
  category_id uuid not null references cloud.categories(id) on delete restrict,
  short_description text not null,
  full_description text not null,
  primary_image_id uuid references cloud.storage_objects(id) on delete restrict,
  source_type text not null,
  source_url text,
  confidence cloud.confidence_level not null,
  publication_status cloud.product_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_text_not_blank check (btrim(title) <> '' and btrim(model) <> ''),
  constraint products_published_at check (publication_status <> 'published' or published_at is not null)
);

create table cloud.product_descriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  locale text not null,
  short_description text not null,
  full_description text not null,
  confidence cloud.confidence_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, locale)
);

create table cloud.product_characteristics (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  key text not null,
  display_name text not null,
  raw_value text not null,
  normalized_value text not null,
  unit text,
  sort_order integer not null default 0 check (sort_order >= 0),
  confidence cloud.confidence_level not null,
  source_reference text not null,
  reviewer_status text not null check (reviewer_status in ('pending', 'approved', 'needs_review', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, key)
);

create table cloud.product_application_areas (
  product_id uuid not null references cloud.products(id) on delete restrict,
  application_area_id uuid not null references cloud.application_areas(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (product_id, application_area_id)
);

create table cloud.product_images (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  storage_object_id uuid not null references cloud.storage_objects(id) on delete restrict,
  role text not null check (role in ('primary', 'gallery', 'document_preview')),
  alt_text text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, storage_object_id)
);

create unique index product_primary_image_uq on cloud.product_images (product_id) where role = 'primary';

create table cloud.product_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  storage_object_id uuid not null references cloud.storage_objects(id) on delete restrict,
  title text not null,
  document_type text not null,
  language text not null,
  is_official boolean not null default false,
  publication_status cloud.reference_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, storage_object_id)
);

create table cloud.accessories (
  id uuid primary key default extensions.gen_random_uuid(),
  code text unique,
  title text not null,
  description text,
  confidence cloud.confidence_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cloud.product_accessories (
  product_id uuid not null references cloud.products(id) on delete restrict,
  accessory_id uuid not null references cloud.accessories(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  primary key (product_id, accessory_id)
);

create table cloud.package_contents (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  item_name text not null,
  quantity numeric,
  unit text,
  sort_order integer not null default 0,
  confidence cloud.confidence_level not null,
  created_at timestamptz not null default now()
);

create table cloud.import_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  run_key text not null unique,
  pipeline_version text not null,
  environment text not null check (environment in ('local', 'test', 'staging', 'production')),
  status cloud.import_status not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  initiated_by uuid,
  source_manifest jsonb not null,
  configuration jsonb not null default '{}',
  summary jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint import_run_dates check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table cloud.import_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  import_run_id uuid not null references cloud.import_runs(id) on delete restrict,
  source_id text not null,
  source_type text not null,
  source_location text not null,
  snapshot jsonb not null,
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  storage_object_id uuid references cloud.storage_objects(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (import_run_id, source_id)
);

create table cloud.import_products (
  id uuid primary key default extensions.gen_random_uuid(),
  import_run_id uuid not null references cloud.import_runs(id) on delete restrict,
  import_source_id uuid references cloud.import_sources(id) on delete restrict,
  source_id text not null,
  legacy_slug text not null,
  status text not null,
  identity_status text not null,
  manufacturer_status text not null,
  category_status text not null,
  readiness_status text not null,
  extracted_product jsonb not null default '{}',
  normalized_candidate jsonb not null default '{}',
  publication_candidate jsonb,
  existing_product_id uuid references cloud.products(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (import_run_id, source_id)
);

create table cloud.import_field_provenance (
  id uuid primary key default extensions.gen_random_uuid(),
  import_product_id uuid not null references cloud.import_products(id) on delete restrict,
  field_path text not null,
  source_type text not null,
  source_id text not null,
  source_location text not null,
  raw_value_json jsonb,
  normalized_value_json jsonb,
  transformation text not null,
  resolver text,
  confidence cloud.confidence_level not null,
  reviewer_status text not null,
  created_at timestamptz not null default now()
);

create table cloud.import_warnings (
  id uuid primary key default extensions.gen_random_uuid(),
  import_product_id uuid not null references cloud.import_products(id) on delete restrict,
  code text not null,
  field_path text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_note text
);

create table cloud.import_blocking_errors (
  id uuid primary key default extensions.gen_random_uuid(),
  import_product_id uuid not null references cloud.import_products(id) on delete restrict,
  code text not null,
  field_path text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_note text
);

create table cloud.review_items (
  id uuid primary key default extensions.gen_random_uuid(),
  import_product_id uuid not null references cloud.import_products(id) on delete restrict,
  status cloud.review_status not null default 'pending',
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (import_product_id)
);

create table cloud.review_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  review_item_id uuid not null references cloud.review_items(id) on delete restrict,
  decision_type text not null,
  field_path text,
  previous_value jsonb,
  proposed_value jsonb,
  approved_value jsonb,
  decision cloud.review_decision_type not null,
  reviewer_id uuid not null,
  rationale text not null,
  created_at timestamptz not null default now()
);

create table cloud.review_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  review_item_id uuid not null references cloud.review_items(id) on delete restrict,
  author_id uuid not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table cloud.publication_candidates (
  id uuid primary key default extensions.gen_random_uuid(),
  import_product_id uuid not null references cloud.import_products(id) on delete restrict,
  target_product_id uuid references cloud.products(id) on delete restrict,
  schema_version integer not null check (schema_version > 0),
  candidate_data jsonb not null,
  validation_status text not null check (validation_status in ('not_ready', 'valid', 'invalid', 'approved', 'published')),
  blocking_error_count integer not null default 0 check (blocking_error_count >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (import_product_id, schema_version),
  constraint publication_candidate_approval check ((approved_by is null) = (approved_at is null))
);

create table cloud.publication_events (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references cloud.products(id) on delete restrict,
  candidate_id uuid references cloud.publication_candidates(id) on delete restrict,
  event_type text not null check (event_type in ('created', 'updated', 'unpublished', 'republished', 'archived', 'rollback')),
  previous_version jsonb,
  new_version jsonb,
  actor_id uuid not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

create table cloud.registration_records (
  id uuid primary key default extensions.gen_random_uuid(),
  registration_number text,
  status text not null check (status in ('no_data', 'legacy_claim_only', 'candidate_number', 'requires_external_verification', 'verified_exact', 'verified_family', 'rejected')),
  record_data jsonb not null default '{}',
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index registration_number_uq on cloud.registration_records (registration_number) where registration_number is not null;

create table cloud.product_registration_links (
  product_id uuid not null references cloud.products(id) on delete restrict,
  registration_record_id uuid not null references cloud.registration_records(id) on delete restrict,
  relationship_type text not null check (relationship_type in ('exact', 'family', 'candidate')),
  created_at timestamptz not null default now(),
  primary key (product_id, registration_record_id)
);

create table cloud.audit_log (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid,
  action text not null check (action in ('create', 'update', 'approve', 'reject', 'publish', 'unpublish', 'archive', 'upload', 'delete', 'restore', 'admin_login')),
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  source text not null,
  request_id text,
  created_at timestamptz not null default now()
);

create or replace function cloud.current_app_role()
returns text
language sql
stable
set search_path = pg_catalog, auth
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'app_role', auth.jwt() ->> 'app_role', 'anonymous')
$$;

create or replace function cloud.is_service_request()
returns boolean
language sql
stable
set search_path = pg_catalog, auth
as $$
  select auth.role() = 'service_role'
    or cloud.current_app_role() = 'service'
$$;

-- Reference import is one server-side transaction. It is not exposed to anon/authenticated.
create or replace function cloud.apply_reference_import(p_payload jsonb, p_batch_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, extensions
as $$
declare
  item jsonb;
  alias_value text;
  parent_uuid uuid;
  target_uuid uuid;
  target_area_ids uuid[];
  candidate_ids uuid[];
  manufacturer_count integer := 0;
  category_count integer := 0;
  application_area_count integer := 0;
  mapping_count integer := 0;
begin
  if not cloud.is_service_request() then
    raise exception 'reference import requires service role' using errcode = '42501';
  end if;
  if nullif(btrim(p_batch_key), '') is null then
    raise exception 'migration batch key is required' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_payload -> 'manufacturers') loop
    insert into cloud.manufacturers (
      code, slug, canonical_name, display_name, country_code, description, website,
      confidence, publication_status, legal_manufacturer, commercial_brand,
      parent_company, founded_year, headquarters, migration_batch_key, updated_at
    ) values (
      item ->> 'id', item ->> 'slug', item ->> 'canonicalName', item ->> 'displayName',
      item ->> 'country', item ->> 'description', item ->> 'website',
      (item ->> 'confidence')::cloud.confidence_level,
      (item ->> 'publicationStatus')::cloud.reference_status,
      item ->> 'legalManufacturer', item ->> 'commercialBrand', item ->> 'parentCompany',
      nullif(item ->> 'foundedYear', '')::integer, item ->> 'headquarters', p_batch_key,
      (item ->> 'updatedAt')::timestamptz
    ) on conflict (code) do update set
      slug = excluded.slug, canonical_name = excluded.canonical_name,
      display_name = excluded.display_name, country_code = excluded.country_code,
      description = excluded.description, website = excluded.website,
      confidence = excluded.confidence, publication_status = excluded.publication_status,
      legal_manufacturer = excluded.legal_manufacturer, commercial_brand = excluded.commercial_brand,
      parent_company = excluded.parent_company, founded_year = excluded.founded_year,
      headquarters = excluded.headquarters, migration_batch_key = excluded.migration_batch_key,
      updated_at = excluded.updated_at;
    manufacturer_count := manufacturer_count + 1;
    for alias_value in select value #>> '{}' from jsonb_array_elements(item -> 'aliases') loop
      insert into cloud.manufacturer_aliases (manufacturer_id, alias, normalized_alias)
      select id, alias_value, lower(btrim(alias_value)) from cloud.manufacturers where code = item ->> 'id'
      on conflict (normalized_alias) do update set alias = excluded.alias;
    end loop;
  end loop;

  -- Two passes allow roots before leaves while keeping source order irrelevant.
  for item in select value from jsonb_array_elements(p_payload -> 'categories') where value ->> 'parentId' is null loop
    insert into cloud.categories (code, slug, canonical_name, display_name, description, parent_id, level, assignable, confidence, publication_status, sort_order, migration_batch_key, updated_at)
    values (item ->> 'id', item ->> 'slug', item ->> 'canonicalName', item ->> 'displayName', item ->> 'description', null, item ->> 'level', (item ->> 'assignable')::boolean, (item ->> 'confidence')::cloud.confidence_level, (item ->> 'publicationStatus')::cloud.reference_status, coalesce((item ->> 'sortOrder')::integer, 0), p_batch_key, (item ->> 'updatedAt')::timestamptz)
    on conflict (code) do update set slug = excluded.slug, canonical_name = excluded.canonical_name, display_name = excluded.display_name, description = excluded.description, parent_id = null, level = excluded.level, assignable = excluded.assignable, confidence = excluded.confidence, publication_status = excluded.publication_status, sort_order = excluded.sort_order, migration_batch_key = excluded.migration_batch_key, updated_at = excluded.updated_at;
  end loop;
  for item in select value from jsonb_array_elements(p_payload -> 'categories') order by jsonb_array_length(coalesce(value -> 'hierarchyPath', '[]'::jsonb)) loop
    select id into parent_uuid from cloud.categories where code = item ->> 'parentId';
    insert into cloud.categories (code, slug, canonical_name, display_name, description, parent_id, level, assignable, confidence, publication_status, sort_order, migration_batch_key, updated_at)
    values (item ->> 'id', item ->> 'slug', item ->> 'canonicalName', item ->> 'displayName', item ->> 'description', parent_uuid, item ->> 'level', (item ->> 'assignable')::boolean, (item ->> 'confidence')::cloud.confidence_level, (item ->> 'publicationStatus')::cloud.reference_status, coalesce((item ->> 'sortOrder')::integer, 0), p_batch_key, (item ->> 'updatedAt')::timestamptz)
    on conflict (code) do update set slug = excluded.slug, canonical_name = excluded.canonical_name, display_name = excluded.display_name, description = excluded.description, parent_id = excluded.parent_id, level = excluded.level, assignable = excluded.assignable, confidence = excluded.confidence, publication_status = excluded.publication_status, sort_order = excluded.sort_order, migration_batch_key = excluded.migration_batch_key, updated_at = excluded.updated_at;
    category_count := category_count + 1;
    for alias_value in select value #>> '{}' from jsonb_array_elements(item -> 'aliases') loop
      insert into cloud.category_aliases (category_id, alias, normalized_alias)
      select id, alias_value, lower(btrim(alias_value)) from cloud.categories where code = item ->> 'id'
      on conflict (normalized_alias) do update set alias = excluded.alias;
    end loop;
  end loop;

  for item in select value from jsonb_array_elements(p_payload -> 'applicationAreas') loop
    insert into cloud.application_areas (code, slug, canonical_name, display_name, description, confidence, publication_status, migration_batch_key, updated_at)
    values (item ->> 'id', item ->> 'slug', item ->> 'canonicalName', item ->> 'displayName', item ->> 'description', (item ->> 'confidence')::cloud.confidence_level, (item ->> 'publicationStatus')::cloud.reference_status, p_batch_key, (item ->> 'updatedAt')::timestamptz)
    on conflict (code) do update set slug = excluded.slug, canonical_name = excluded.canonical_name, display_name = excluded.display_name, description = excluded.description, confidence = excluded.confidence, publication_status = excluded.publication_status, migration_batch_key = excluded.migration_batch_key, updated_at = excluded.updated_at;
    application_area_count := application_area_count + 1;
    for alias_value in select value #>> '{}' from jsonb_array_elements(item -> 'aliases') loop
      insert into cloud.application_area_aliases (application_area_id, alias, normalized_alias)
      select id, alias_value, lower(btrim(alias_value)) from cloud.application_areas where code = item ->> 'id'
      on conflict (normalized_alias) do update set alias = excluded.alias;
    end loop;
  end loop;

  for item in select value from jsonb_array_elements(p_payload -> 'legacyMappings') loop
    select id into target_uuid from cloud.categories where code = item ->> 'targetCategoryId';
    select coalesce(array_agg(id order by id), '{}') into target_area_ids from cloud.application_areas where code in (select value #>> '{}' from jsonb_array_elements(item -> 'targetApplicationAreaIds'));
    select coalesce(array_agg(id order by id), '{}') into candidate_ids from cloud.categories where code in (select value #>> '{}' from jsonb_array_elements(item -> 'targetCategoryCandidates'));
    insert into cloud.legacy_category_mappings (code, legacy_value, normalized_legacy_value, source_context, target_category_id, target_application_area_ids, target_category_candidate_ids, mapping_type, confidence, reviewer_status, reviewer_required, blocks_publication, rationale, notes, migration_batch_key, updated_at)
    values (item ->> 'id', item ->> 'legacyValue', item ->> 'normalizedLegacyValue', item ->> 'sourceContext', target_uuid, target_area_ids, candidate_ids, item ->> 'mappingType', (item ->> 'confidence')::cloud.confidence_level, item ->> 'reviewerStatus', (item ->> 'reviewerRequired')::boolean, (item ->> 'blocksPublication')::boolean, item ->> 'rationale', item ->> 'notes', p_batch_key, (item ->> 'updatedAt')::timestamptz)
    on conflict (code) do update set legacy_value = excluded.legacy_value, normalized_legacy_value = excluded.normalized_legacy_value, source_context = excluded.source_context, target_category_id = excluded.target_category_id, target_application_area_ids = excluded.target_application_area_ids, target_category_candidate_ids = excluded.target_category_candidate_ids, mapping_type = excluded.mapping_type, confidence = excluded.confidence, reviewer_status = excluded.reviewer_status, reviewer_required = excluded.reviewer_required, blocks_publication = excluded.blocks_publication, rationale = excluded.rationale, notes = excluded.notes, migration_batch_key = excluded.migration_batch_key, updated_at = excluded.updated_at;
    mapping_count := mapping_count + 1;
  end loop;

  return jsonb_build_object('manufacturers', manufacturer_count, 'categories', category_count, 'applicationAreas', application_area_count, 'legacyMappings', mapping_count, 'batchKey', p_batch_key);
end
$$;

create or replace function cloud_api.apply_reference_import(p_payload jsonb, p_batch_key text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$ select cloud.apply_reference_import(p_payload, p_batch_key) $$;

revoke all on function cloud_api.apply_reference_import(jsonb, text) from public, anon, authenticated;
grant execute on function cloud_api.apply_reference_import(jsonb, text) to service_role;

-- RLS is enabled on every operational table. No anonymous write policy exists.
do $rls$
declare table_name text;
begin
  foreach table_name in array array[
    'user_profiles','manufacturers','manufacturer_aliases','categories','category_aliases',
    'application_areas','application_area_aliases','legacy_category_mappings','storage_objects',
    'products','product_descriptions','product_characteristics','product_application_areas',
    'product_images','product_documents','accessories','product_accessories','package_contents',
    'import_runs','import_sources','import_products','import_field_provenance','import_warnings',
    'import_blocking_errors','review_items','review_decisions','review_notes',
    'publication_candidates','publication_events','registration_records',
    'product_registration_links','audit_log'
  ] loop
    execute format('alter table cloud.%I enable row level security', table_name);
  end loop;
end
$rls$;

create policy manufacturers_public_read on cloud.manufacturers for select to anon, authenticated using (publication_status = 'published');
create policy categories_public_read on cloud.categories for select to anon, authenticated using (publication_status = 'published');
create policy application_areas_public_read on cloud.application_areas for select to anon, authenticated using (publication_status = 'published');
create policy products_public_read on cloud.products for select to anon, authenticated using (publication_status = 'published');
create policy product_descriptions_public_read on cloud.product_descriptions for select to anon, authenticated using (exists (select 1 from cloud.products p where p.id = product_id and p.publication_status = 'published'));
create policy product_characteristics_public_read on cloud.product_characteristics for select to anon, authenticated using (exists (select 1 from cloud.products p where p.id = product_id and p.publication_status = 'published'));
create policy product_images_public_read on cloud.product_images for select to anon, authenticated using (exists (select 1 from cloud.products p where p.id = product_id and p.publication_status = 'published'));
create policy product_documents_public_read on cloud.product_documents for select to anon, authenticated using (publication_status = 'published' and exists (select 1 from cloud.products p where p.id = product_id and p.publication_status = 'published'));
create policy storage_objects_public_read on cloud.storage_objects for select to anon, authenticated using (access_status = 'public' and deleted_at is null and rights_status in ('manufacturer_official','licensed','owned','public_domain'));
create policy review_decisions_reviewer_insert on cloud.review_decisions for insert to authenticated with check (cloud.current_app_role() in ('reviewer','admin') and reviewer_id = auth.uid());
create policy internal_viewer_read on cloud.review_items for select to authenticated using (cloud.current_app_role() in ('viewer','researcher','reviewer','editor','admin'));
create policy import_runs_service_insert on cloud.import_runs for insert to service_role with check (cloud.is_service_request());

comment on schema cloud is 'Cloud-first operational model; not exposed directly through PostgREST in v1.';
comment on schema cloud_api is 'Minimal controlled RPC surface for server-side migration tooling.';

commit;
