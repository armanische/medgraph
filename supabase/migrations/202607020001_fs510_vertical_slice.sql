-- CyberMedica
-- Migration 001: minimal FS510 vertical slice
-- Target: Supabase PostgreSQL
--
-- document -> document_version -> evidence -> claim revision
-- -> verification -> publication -> product page projection -> public_api

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
create schema if not exists core;
create schema if not exists catalog;
create schema if not exists source;
create schema if not exists governance;
create schema if not exists knowledge;
create schema if not exists publication;
create schema if not exists projection;
create schema if not exists factory_api;
create schema if not exists public_api;

revoke all on schema private, core, catalog, source, governance, knowledge,
  publication, projection, factory_api, public_api from public;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'cm_factory') then
    create role cm_factory nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'cm_publisher') then
    create role cm_publisher nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'cm_projector') then
    create role cm_projector nologin;
  end if;
end
$roles$;

grant usage on schema factory_api to cm_factory, cm_publisher, cm_projector;
grant usage on schema public_api to anon, authenticated;

create or replace function private.prevent_immutable_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = format('%I.%I is immutable; create a new revision instead', tg_table_schema, tg_table_name);
end
$$;

create or replace function private.sha256_json(payload jsonb)
returns bytea
language sql
immutable
strict
set search_path = pg_catalog, extensions
as $$
  select extensions.digest(convert_to(payload::text, 'UTF8'), 'sha256')
$$;

-- ---------------------------------------------------------------------------
-- Core identity
-- ---------------------------------------------------------------------------

create table core.entity_types (
  code text primary key,
  description text not null
);

create table core.entities (
  entity_id uuid primary key default extensions.gen_random_uuid(),
  entity_type_code text not null references core.entity_types(code) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid,
  retired_at timestamptz,
  constraint entities_retired_after_created
    check (retired_at is null or retired_at >= created_at)
);

create table core.organizations (
  organization_id uuid primary key references core.entities(entity_id) on delete restrict,
  canonical_name text not null,
  country_code text,
  created_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (btrim(canonical_name) <> '')
);

create unique index organizations_canonical_name_uq
  on core.organizations (lower(canonical_name), coalesce(country_code, ''));

create or replace function private.require_entity_type()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, core
as $$
declare
  actual_type text;
  target_id uuid;
begin
  target_id := (to_jsonb(new) ->> tg_argv[1])::uuid;

  select e.entity_type_code
    into actual_type
    from core.entities e
   where e.entity_id = target_id;

  if actual_type is distinct from tg_argv[0] then
    raise exception 'entity type must be %, got %', tg_argv[0], actual_type
      using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger organizations_require_entity_type
before insert or update on core.organizations
for each row execute function private.require_entity_type('organization', 'organization_id');

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table catalog.products (
  product_id uuid primary key references core.entities(entity_id) on delete restrict,
  manufacturer_organization_id uuid not null
    references core.organizations(organization_id) on delete restrict,
  model_designation text not null,
  identity_status text not null default 'active'
    check (identity_status in ('active', 'retired', 'needs_review')),
  created_at timestamptz not null default now(),
  constraint products_model_not_blank check (btrim(model_designation) <> '')
);

create unique index products_manufacturer_model_uq
  on catalog.products (manufacturer_organization_id, lower(model_designation));

create trigger products_require_entity_type
before insert or update on catalog.products
for each row execute function private.require_entity_type('product', 'product_id');

-- ---------------------------------------------------------------------------
-- Sources, documents and evidence
-- ---------------------------------------------------------------------------

create table source.documents (
  document_id uuid primary key references core.entities(entity_id) on delete restrict,
  source_organization_id uuid references core.organizations(organization_id) on delete restrict,
  document_type_code text not null,
  canonical_title text not null,
  external_document_id text,
  created_at timestamptz not null default now(),
  constraint documents_title_not_blank check (btrim(canonical_title) <> '')
);

create trigger documents_require_entity_type
before insert or update on source.documents
for each row execute function private.require_entity_type('document', 'document_id');

create table source.document_versions (
  document_version_id uuid primary key default extensions.gen_random_uuid(),
  document_id uuid not null references source.documents(document_id) on delete restrict,
  version_label text,
  issued_at timestamptz,
  acquired_at timestamptz not null default now(),
  source_uri text not null,
  storage_object_path text not null unique,
  sha256 bytea not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  supersedes_id uuid references source.document_versions(document_version_id) on delete restrict,
  created_by uuid,
  constraint document_versions_sha256_length check (octet_length(sha256) = 32),
  constraint document_versions_document_hash_uq unique (document_id, sha256)
);

create index document_versions_document_idx
  on source.document_versions (document_id, acquired_at desc);

create table source.evidence (
  evidence_id uuid primary key default extensions.gen_random_uuid(),
  document_version_id uuid not null
    references source.document_versions(document_version_id) on delete restrict,
  locator_kind_code text not null
    check (locator_kind_code in ('page', 'section', 'table', 'registry_record', 'html_fragment')),
  page_from integer check (page_from is null or page_from > 0),
  page_to integer check (page_to is null or page_to > 0),
  section_path text,
  quoted_text text,
  locator_payload jsonb not null default '{}'::jsonb,
  locator_hash bytea not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint evidence_page_order
    check (page_from is null or page_to is null or page_to >= page_from),
  constraint evidence_locator_hash_length check (octet_length(locator_hash) = 32),
  constraint evidence_document_locator_uq unique (document_version_id, locator_hash)
);

create index evidence_document_version_idx
  on source.evidence (document_version_id);

-- ---------------------------------------------------------------------------
-- Governance policies
-- ---------------------------------------------------------------------------

create table governance.policies (
  policy_id uuid primary key default extensions.gen_random_uuid(),
  stable_code text not null unique,
  policy_type_code text not null,
  created_at timestamptz not null default now()
);

create table governance.policy_versions (
  policy_version_id uuid primary key default extensions.gen_random_uuid(),
  policy_id uuid not null references governance.policies(policy_id) on delete restrict,
  version_no integer not null check (version_no > 0),
  status_code text not null check (status_code in ('draft', 'active', 'retired')),
  effective_from timestamptz not null,
  effective_to timestamptz,
  rules jsonb not null,
  canonical_hash bytea not null,
  supersedes_id uuid references governance.policy_versions(policy_version_id) on delete restrict,
  approved_by uuid,
  approved_at timestamptz,
  constraint policy_versions_effective_order
    check (effective_to is null or effective_to > effective_from),
  constraint policy_versions_hash_length check (octet_length(canonical_hash) = 32),
  constraint policy_versions_policy_version_uq unique (policy_id, version_no),
  constraint policy_versions_policy_hash_uq unique (policy_id, canonical_hash)
);

create index policy_versions_active_idx
  on governance.policy_versions (policy_id, effective_from desc)
  where status_code = 'active';

-- ---------------------------------------------------------------------------
-- Claims, revisions and verification
-- ---------------------------------------------------------------------------

create table knowledge.claim_types (
  claim_type_id uuid primary key default extensions.gen_random_uuid(),
  stable_code text not null unique,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create table knowledge.claim_type_versions (
  claim_type_version_id uuid primary key default extensions.gen_random_uuid(),
  claim_type_id uuid not null references knowledge.claim_types(claim_type_id) on delete restrict,
  version_no integer not null check (version_no > 0),
  status_code text not null check (status_code in ('draft', 'active', 'retired')),
  definition text not null,
  value_schema jsonb not null,
  scope_schema jsonb not null default '{}'::jsonb,
  verification_policy_version_id uuid not null
    references governance.policy_versions(policy_version_id) on delete restrict,
  publication_policy_version_id uuid not null
    references governance.policy_versions(policy_version_id) on delete restrict,
  effective_from timestamptz not null,
  effective_to timestamptz,
  supersedes_id uuid references knowledge.claim_type_versions(claim_type_version_id) on delete restrict,
  canonical_hash bytea not null,
  constraint claim_type_versions_effective_order
    check (effective_to is null or effective_to > effective_from),
  constraint claim_type_versions_hash_length check (octet_length(canonical_hash) = 32),
  constraint claim_type_versions_type_version_uq unique (claim_type_id, version_no)
);

create index claim_type_versions_active_idx
  on knowledge.claim_type_versions (claim_type_id, effective_from desc)
  where status_code = 'active';

create table knowledge.scopes (
  scope_id uuid primary key default extensions.gen_random_uuid(),
  scope_payload jsonb not null,
  canonical_hash bytea not null unique,
  created_at timestamptz not null default now(),
  constraint scopes_hash_length check (octet_length(canonical_hash) = 32)
);

create table knowledge.results (
  result_id uuid primary key default extensions.gen_random_uuid(),
  result_kind_code text not null check (result_kind_code = 'claim'),
  subject_entity_id uuid not null references core.entities(entity_id) on delete restrict,
  claim_type_id uuid not null references knowledge.claim_types(claim_type_id) on delete restrict,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create index results_subject_claim_type_idx
  on knowledge.results (subject_entity_id, claim_type_id);

create table knowledge.result_revisions (
  result_revision_id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null references knowledge.results(result_id) on delete restrict,
  revision_no integer not null check (revision_no > 0),
  claim_type_version_id uuid not null
    references knowledge.claim_type_versions(claim_type_version_id) on delete restrict,
  scope_id uuid not null references knowledge.scopes(scope_id) on delete restrict,
  value_payload jsonb not null,
  value_hash bytea not null,
  statement_text text not null,
  revision_reason_code text not null default 'initial',
  supersedes_id uuid references knowledge.result_revisions(result_revision_id) on delete restrict,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint result_revisions_hash_length check (octet_length(value_hash) = 32),
  constraint result_revisions_statement_not_blank check (btrim(statement_text) <> ''),
  constraint result_revisions_result_revision_uq unique (result_id, revision_no),
  constraint result_revisions_no_duplicate_uq unique (result_id, value_hash, scope_id)
);

create index result_revisions_result_idx
  on knowledge.result_revisions (result_id, revision_no desc);

create table knowledge.result_revision_evidence (
  result_revision_id uuid not null
    references knowledge.result_revisions(result_revision_id) on delete restrict,
  evidence_id uuid not null references source.evidence(evidence_id) on delete restrict,
  evidence_role_code text not null
    check (evidence_role_code in ('supports', 'limits', 'contradicts', 'context')),
  primary key (result_revision_id, evidence_id, evidence_role_code)
);

create index result_revision_evidence_evidence_idx
  on knowledge.result_revision_evidence (evidence_id);

create table knowledge.verifications (
  verification_id uuid primary key default extensions.gen_random_uuid(),
  result_revision_id uuid not null
    references knowledge.result_revisions(result_revision_id) on delete restrict,
  decision_code text not null
    check (decision_code in (
      'confirmed',
      'confirmed_with_limitations',
      'insufficient_evidence',
      'contradicted',
      'rejected'
    )),
  policy_version_id uuid not null
    references governance.policy_versions(policy_version_id) on delete restrict,
  reviewer_id uuid,
  limitations jsonb not null default '{}'::jsonb,
  rationale text,
  verified_at timestamptz not null default now(),
  review_due_at timestamptz,
  supersedes_id uuid references knowledge.verifications(verification_id) on delete restrict,
  constraint verifications_review_due_order
    check (review_due_at is null or review_due_at > verified_at)
);

create index verifications_revision_idx
  on knowledge.verifications (result_revision_id, verified_at desc);

-- ---------------------------------------------------------------------------
-- Publication and projections
-- ---------------------------------------------------------------------------

create table publication.channels (
  channel_id uuid primary key default extensions.gen_random_uuid(),
  stable_code text not null unique,
  is_public boolean not null default false
);

create table publication.records (
  publication_id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null references knowledge.results(result_id) on delete restrict,
  channel_id uuid not null references publication.channels(channel_id) on delete restrict,
  public_key text not null,
  created_at timestamptz not null default now(),
  constraint publication_records_result_channel_uq unique (result_id, channel_id),
  constraint publication_records_channel_key_uq unique (channel_id, public_key)
);

create table publication.decisions (
  publication_decision_id uuid primary key default extensions.gen_random_uuid(),
  publication_id uuid not null references publication.records(publication_id) on delete restrict,
  result_revision_id uuid not null
    references knowledge.result_revisions(result_revision_id) on delete restrict,
  verification_id uuid not null
    references knowledge.verifications(verification_id) on delete restrict,
  decision_code text not null
    check (decision_code in ('activate', 'suspend', 'withdraw', 'expire', 'replace')),
  policy_version_id uuid not null
    references governance.policy_versions(policy_version_id) on delete restrict,
  effective_at timestamptz not null default now(),
  reason text,
  decided_by uuid,
  supersedes_id uuid references publication.decisions(publication_decision_id) on delete restrict,
  created_at timestamptz not null default now()
);

create index publication_decisions_publication_idx
  on publication.decisions (publication_id, effective_at desc);

create table publication.current_state (
  publication_id uuid primary key
    references publication.records(publication_id) on delete cascade,
  active_result_revision_id uuid
    references knowledge.result_revisions(result_revision_id) on delete restrict,
  status_code text not null check (status_code in ('active', 'suspended', 'withdrawn', 'expired')),
  effective_since timestamptz not null,
  last_decision_id uuid not null
    references publication.decisions(publication_decision_id) on delete restrict,
  projection_version bigint not null default 1,
  rebuilt_at timestamptz not null default now()
);

create index publication_current_state_active_idx
  on publication.current_state (publication_id)
  where status_code = 'active';

create table projection.product_pages (
  product_id uuid not null references catalog.products(product_id) on delete cascade,
  locale text not null default 'ru-RU',
  channel_id uuid not null references publication.channels(channel_id) on delete restrict,
  page_payload jsonb not null,
  content_hash bytea not null,
  projection_version bigint not null default 1,
  built_at timestamptz not null default now(),
  primary key (product_id, locale, channel_id),
  constraint product_pages_hash_length check (octet_length(content_hash) = 32)
);

create table projection.product_page_publications (
  product_id uuid not null,
  locale text not null,
  channel_id uuid not null,
  publication_id uuid not null
    references publication.records(publication_id) on delete cascade,
  primary key (product_id, locale, channel_id, publication_id),
  foreign key (product_id, locale, channel_id)
    references projection.product_pages(product_id, locale, channel_id) on delete cascade
);

create index product_page_publications_publication_idx
  on projection.product_page_publications (publication_id);

-- ---------------------------------------------------------------------------
-- Factory commands
-- ---------------------------------------------------------------------------

create or replace function factory_api.create_organization(
  p_canonical_name text,
  p_country_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, core
as $$
declare
  new_id uuid := extensions.gen_random_uuid();
begin
  insert into core.entities (entity_id, entity_type_code, created_by)
  values (new_id, 'organization', auth.uid());

  insert into core.organizations (organization_id, canonical_name, country_code)
  values (new_id, p_canonical_name, p_country_code);

  return new_id;
end
$$;

create or replace function factory_api.create_product(
  p_manufacturer_organization_id uuid,
  p_model_designation text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, core, catalog
as $$
declare
  new_id uuid := extensions.gen_random_uuid();
begin
  insert into core.entities (entity_id, entity_type_code, created_by)
  values (new_id, 'product', auth.uid());

  insert into catalog.products (
    product_id,
    manufacturer_organization_id,
    model_designation
  )
  values (
    new_id,
    p_manufacturer_organization_id,
    p_model_designation
  );

  return new_id;
end
$$;

create or replace function factory_api.create_document(
  p_source_organization_id uuid,
  p_document_type_code text,
  p_canonical_title text,
  p_external_document_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, core, source
as $$
declare
  new_id uuid := extensions.gen_random_uuid();
begin
  insert into core.entities (entity_id, entity_type_code, created_by)
  values (new_id, 'document', auth.uid());

  insert into source.documents (
    document_id,
    source_organization_id,
    document_type_code,
    canonical_title,
    external_document_id
  )
  values (
    new_id,
    p_source_organization_id,
    p_document_type_code,
    p_canonical_title,
    p_external_document_id
  );

  return new_id;
end
$$;

create or replace function factory_api.add_document_version(
  p_document_id uuid,
  p_version_label text,
  p_issued_at timestamptz,
  p_source_uri text,
  p_storage_object_path text,
  p_sha256_hex text,
  p_mime_type text,
  p_byte_size bigint,
  p_supersedes_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, source
as $$
declare
  new_id uuid := extensions.gen_random_uuid();
begin
  insert into source.document_versions (
    document_version_id,
    document_id,
    version_label,
    issued_at,
    source_uri,
    storage_object_path,
    sha256,
    mime_type,
    byte_size,
    supersedes_id,
    created_by
  )
  values (
    new_id,
    p_document_id,
    p_version_label,
    p_issued_at,
    p_source_uri,
    p_storage_object_path,
    decode(p_sha256_hex, 'hex'),
    p_mime_type,
    p_byte_size,
    p_supersedes_id,
    auth.uid()
  );

  return new_id;
end
$$;

create or replace function factory_api.add_evidence(
  p_document_version_id uuid,
  p_locator_kind_code text,
  p_page_from integer,
  p_page_to integer,
  p_section_path text,
  p_quoted_text text,
  p_locator_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, private, source
as $$
declare
  new_id uuid := extensions.gen_random_uuid();
  normalized_locator jsonb;
begin
  normalized_locator := jsonb_build_object(
    'kind', p_locator_kind_code,
    'page_from', p_page_from,
    'page_to', p_page_to,
    'section_path', p_section_path,
    'quoted_text', p_quoted_text,
    'payload', coalesce(p_locator_payload, '{}'::jsonb)
  );

  insert into source.evidence (
    evidence_id,
    document_version_id,
    locator_kind_code,
    page_from,
    page_to,
    section_path,
    quoted_text,
    locator_payload,
    locator_hash,
    created_by
  )
  values (
    new_id,
    p_document_version_id,
    p_locator_kind_code,
    p_page_from,
    p_page_to,
    p_section_path,
    p_quoted_text,
    coalesce(p_locator_payload, '{}'::jsonb),
    private.sha256_json(normalized_locator),
    auth.uid()
  );

  return new_id;
end
$$;

create or replace function private.get_or_create_scope(p_scope_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, private, knowledge
as $$
declare
  scope_hash bytea := private.sha256_json(coalesce(p_scope_payload, '{}'::jsonb));
  found_id uuid;
begin
  select scope_id into found_id
    from knowledge.scopes
   where canonical_hash = scope_hash;

  if found_id is not null then
    return found_id;
  end if;

  begin
    insert into knowledge.scopes (scope_payload, canonical_hash)
    values (coalesce(p_scope_payload, '{}'::jsonb), scope_hash)
    returning scope_id into found_id;
  exception when unique_violation then
    select scope_id into found_id
      from knowledge.scopes
     where canonical_hash = scope_hash;
  end;

  return found_id;
end
$$;

create or replace function private.validate_pilot_claim(
  p_claim_type_code text,
  p_subject_entity_id uuid,
  p_value_payload jsonb,
  p_scope_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, core
as $$
declare
  subject_type text;
begin
  select entity_type_code into subject_type
    from core.entities
   where entity_id = p_subject_entity_id;

  if subject_type is distinct from 'product' then
    raise exception 'pilot Claim subject must be a product'
      using errcode = '23514';
  end if;

  if p_scope_payload ->> 'product_id' is distinct from p_subject_entity_id::text then
    raise exception 'Scope product_id must match Claim subject'
      using errcode = '23514';
  end if;

  if p_claim_type_code = 'product.filtration_efficiency' then
    if jsonb_typeof(p_value_payload) is distinct from 'object'
       or not (p_value_payload ?& array['operator', 'number', 'unit'])
       or p_value_payload ->> 'operator' not in ('>', '>=', '=', '<=', '<')
       or jsonb_typeof(p_value_payload -> 'number') is distinct from 'number'
       or p_value_payload ->> 'unit' is distinct from '%'
       or (select count(*) from jsonb_object_keys(p_value_payload)) <> 3 then
      raise exception 'invalid value payload for product.filtration_efficiency'
        using errcode = '23514';
    end if;
  else
    raise exception 'no pilot validator registered for Claim Type %', p_claim_type_code
      using errcode = '0A000';
  end if;
end
$$;

create or replace function factory_api.create_claim_revision(
  p_subject_entity_id uuid,
  p_claim_type_code text,
  p_value_payload jsonb,
  p_scope_payload jsonb,
  p_statement_text text,
  p_evidence_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, private, knowledge, source
as $$
declare
  selected_claim_type_id uuid;
  selected_claim_type_version_id uuid;
  new_result_id uuid := extensions.gen_random_uuid();
  new_revision_id uuid := extensions.gen_random_uuid();
  selected_scope_id uuid;
  evidence_count integer;
begin
  if p_evidence_ids is null or cardinality(p_evidence_ids) = 0 then
    raise exception 'at least one supporting Evidence is required'
      using errcode = '23514';
  end if;

  select ct.claim_type_id, ctv.claim_type_version_id
    into selected_claim_type_id, selected_claim_type_version_id
    from knowledge.claim_types ct
    join knowledge.claim_type_versions ctv
      on ctv.claim_type_id = ct.claim_type_id
   where ct.stable_code = p_claim_type_code
     and ctv.status_code = 'active'
     and ctv.effective_from <= now()
     and (ctv.effective_to is null or ctv.effective_to > now())
   order by ctv.version_no desc
   limit 1;

  if selected_claim_type_version_id is null then
    raise exception 'active Claim Type Version not found for %', p_claim_type_code;
  end if;

  select count(*) into evidence_count
    from source.evidence
   where evidence_id = any(p_evidence_ids);

  if evidence_count <> cardinality(p_evidence_ids) then
    raise exception 'one or more Evidence identifiers do not exist'
      using errcode = '23503';
  end if;

  perform private.validate_pilot_claim(
    p_claim_type_code,
    p_subject_entity_id,
    p_value_payload,
    p_scope_payload
  );

  selected_scope_id := private.get_or_create_scope(p_scope_payload);

  insert into knowledge.results (
    result_id,
    result_kind_code,
    subject_entity_id,
    claim_type_id
  )
  values (
    new_result_id,
    'claim',
    p_subject_entity_id,
    selected_claim_type_id
  );

  insert into knowledge.result_revisions (
    result_revision_id,
    result_id,
    revision_no,
    claim_type_version_id,
    scope_id,
    value_payload,
    value_hash,
    statement_text,
    created_by
  )
  values (
    new_revision_id,
    new_result_id,
    1,
    selected_claim_type_version_id,
    selected_scope_id,
    p_value_payload,
    private.sha256_json(p_value_payload),
    p_statement_text,
    auth.uid()
  );

  insert into knowledge.result_revision_evidence (
    result_revision_id,
    evidence_id,
    evidence_role_code
  )
  select new_revision_id, evidence_id, 'supports'
    from unnest(p_evidence_ids) as u(evidence_id);

  return new_revision_id;
end
$$;

create or replace function factory_api.verify_result_revision(
  p_result_revision_id uuid,
  p_decision_code text,
  p_limitations jsonb default '{}'::jsonb,
  p_rationale text default null,
  p_review_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, knowledge
as $$
declare
  new_verification_id uuid := extensions.gen_random_uuid();
  selected_policy_version_id uuid;
  supports_count integer;
begin
  if p_decision_code not in (
    'confirmed',
    'confirmed_with_limitations',
    'insufficient_evidence',
    'contradicted',
    'rejected'
  ) then
    raise exception 'unsupported verification decision: %', p_decision_code;
  end if;

  select ctv.verification_policy_version_id
    into selected_policy_version_id
    from knowledge.result_revisions rr
    join knowledge.claim_type_versions ctv
      on ctv.claim_type_version_id = rr.claim_type_version_id
   where rr.result_revision_id = p_result_revision_id;

  if selected_policy_version_id is null then
    raise exception 'result revision not found: %', p_result_revision_id
      using errcode = '23503';
  end if;

  select count(*) into supports_count
    from knowledge.result_revision_evidence
   where result_revision_id = p_result_revision_id
     and evidence_role_code = 'supports';

  if p_decision_code in ('confirmed', 'confirmed_with_limitations')
     and supports_count = 0 then
    raise exception 'confirmed Claim requires supporting Evidence'
      using errcode = '23514';
  end if;

  insert into knowledge.verifications (
    verification_id,
    result_revision_id,
    decision_code,
    policy_version_id,
    reviewer_id,
    limitations,
    rationale,
    review_due_at
  )
  values (
    new_verification_id,
    p_result_revision_id,
    p_decision_code,
    selected_policy_version_id,
    auth.uid(),
    coalesce(p_limitations, '{}'::jsonb),
    p_rationale,
    p_review_due_at
  );

  return new_verification_id;
end
$$;

create or replace function factory_api.activate_publication(
  p_result_revision_id uuid,
  p_verification_id uuid,
  p_public_key text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, knowledge, publication
as $$
declare
  selected_result_id uuid;
  selected_policy_version_id uuid;
  selected_channel_id uuid;
  selected_decision_code text;
  target_publication_id uuid;
  new_decision_id uuid := extensions.gen_random_uuid();
  prior_decision_id uuid;
begin
  select rr.result_id,
         ctv.publication_policy_version_id,
         v.decision_code
    into selected_result_id,
         selected_policy_version_id,
         selected_decision_code
    from knowledge.result_revisions rr
    join knowledge.claim_type_versions ctv
      on ctv.claim_type_version_id = rr.claim_type_version_id
    join knowledge.verifications v
      on v.verification_id = p_verification_id
     and v.result_revision_id = rr.result_revision_id
   where rr.result_revision_id = p_result_revision_id;

  if selected_result_id is null then
    raise exception 'revision/verification pair is invalid'
      using errcode = '23503';
  end if;

  if selected_decision_code not in ('confirmed', 'confirmed_with_limitations') then
    raise exception 'only confirmed revisions can be published'
      using errcode = '23514';
  end if;

  select channel_id into selected_channel_id
    from publication.channels
   where stable_code = 'public_web';

  insert into publication.records (result_id, channel_id, public_key)
  values (selected_result_id, selected_channel_id, p_public_key)
  on conflict (result_id, channel_id)
  do update set public_key = excluded.public_key
  returning publication_id into target_publication_id;

  select last_decision_id into prior_decision_id
    from publication.current_state
   where publication_id = target_publication_id
   for update;

  insert into publication.decisions (
    publication_decision_id,
    publication_id,
    result_revision_id,
    verification_id,
    decision_code,
    policy_version_id,
    reason,
    decided_by,
    supersedes_id
  )
  values (
    new_decision_id,
    target_publication_id,
    p_result_revision_id,
    p_verification_id,
    'activate',
    selected_policy_version_id,
    p_reason,
    auth.uid(),
    prior_decision_id
  );

  insert into publication.current_state (
    publication_id,
    active_result_revision_id,
    status_code,
    effective_since,
    last_decision_id
  )
  values (
    target_publication_id,
    p_result_revision_id,
    'active',
    now(),
    new_decision_id
  )
  on conflict (publication_id)
  do update set
    active_result_revision_id = excluded.active_result_revision_id,
    status_code = excluded.status_code,
    effective_since = excluded.effective_since,
    last_decision_id = excluded.last_decision_id,
    projection_version = publication.current_state.projection_version + 1,
    rebuilt_at = now();

  return target_publication_id;
end
$$;

create or replace function factory_api.suspend_publication(
  p_publication_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions, publication
as $$
declare
  state_row publication.current_state%rowtype;
  prior_decision publication.decisions%rowtype;
  new_decision_id uuid := extensions.gen_random_uuid();
begin
  select * into state_row
    from publication.current_state
   where publication_id = p_publication_id
   for update;

  if state_row.publication_id is null then
    raise exception 'publication not found: %', p_publication_id
      using errcode = '23503';
  end if;

  select * into prior_decision
    from publication.decisions
   where publication_decision_id = state_row.last_decision_id;

  insert into publication.decisions (
    publication_decision_id,
    publication_id,
    result_revision_id,
    verification_id,
    decision_code,
    policy_version_id,
    reason,
    decided_by,
    supersedes_id
  )
  values (
    new_decision_id,
    p_publication_id,
    prior_decision.result_revision_id,
    prior_decision.verification_id,
    'suspend',
    prior_decision.policy_version_id,
    p_reason,
    auth.uid(),
    prior_decision.publication_decision_id
  );

  update publication.current_state
     set status_code = 'suspended',
         active_result_revision_id = null,
         effective_since = now(),
         last_decision_id = new_decision_id,
         projection_version = projection_version + 1,
         rebuilt_at = now()
   where publication_id = p_publication_id;

  return new_decision_id;
end
$$;

create or replace function factory_api.upsert_product_page(
  p_product_id uuid,
  p_locale text,
  p_page_payload jsonb,
  p_publication_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, private, publication, projection
as $$
declare
  public_channel_id uuid;
  expected_count integer;
  active_count integer;
begin
  if p_publication_ids is null or cardinality(p_publication_ids) = 0 then
    raise exception 'product page requires at least one active Publication';
  end if;

  select channel_id into public_channel_id
    from publication.channels
   where stable_code = 'public_web';

  expected_count := cardinality(p_publication_ids);

  select count(*) into active_count
    from publication.current_state cs
    join publication.records pr on pr.publication_id = cs.publication_id
    join knowledge.results kr on kr.result_id = pr.result_id
   where cs.publication_id = any(p_publication_ids)
     and cs.status_code = 'active'
     and pr.channel_id = public_channel_id
     and kr.subject_entity_id = p_product_id;

  if active_count <> expected_count then
    raise exception 'all product page Publications must be active public_web records';
  end if;

  insert into projection.product_pages (
    product_id,
    locale,
    channel_id,
    page_payload,
    content_hash
  )
  values (
    p_product_id,
    p_locale,
    public_channel_id,
    p_page_payload,
    private.sha256_json(p_page_payload)
  )
  on conflict (product_id, locale, channel_id)
  do update set
    page_payload = excluded.page_payload,
    content_hash = excluded.content_hash,
    projection_version = projection.product_pages.projection_version + 1,
    built_at = now();

  delete from projection.product_page_publications
   where product_id = p_product_id
     and locale = p_locale
     and channel_id = public_channel_id;

  insert into projection.product_page_publications (
    product_id,
    locale,
    channel_id,
    publication_id
  )
  select p_product_id, p_locale, public_channel_id, publication_id
    from unnest(p_publication_ids) as u(publication_id);
end
$$;

-- ---------------------------------------------------------------------------
-- Immutability
-- ---------------------------------------------------------------------------

create trigger document_versions_immutable
before update or delete on source.document_versions
for each row execute function private.prevent_immutable_mutation();

create trigger evidence_immutable
before update or delete on source.evidence
for each row execute function private.prevent_immutable_mutation();

create trigger policy_versions_immutable
before update or delete on governance.policy_versions
for each row execute function private.prevent_immutable_mutation();

create trigger claim_type_versions_immutable
before update or delete on knowledge.claim_type_versions
for each row execute function private.prevent_immutable_mutation();

create trigger scopes_immutable
before update or delete on knowledge.scopes
for each row execute function private.prevent_immutable_mutation();

create trigger result_revisions_immutable
before update or delete on knowledge.result_revisions
for each row execute function private.prevent_immutable_mutation();

create trigger result_revision_evidence_immutable
before update or delete on knowledge.result_revision_evidence
for each row execute function private.prevent_immutable_mutation();

create trigger verifications_immutable
before update or delete on knowledge.verifications
for each row execute function private.prevent_immutable_mutation();

create trigger publication_decisions_immutable
before update or delete on publication.decisions
for each row execute function private.prevent_immutable_mutation();

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

alter table core.entity_types enable row level security;
alter table core.entities enable row level security;
alter table core.organizations enable row level security;
alter table catalog.products enable row level security;
alter table source.documents enable row level security;
alter table source.document_versions enable row level security;
alter table source.evidence enable row level security;
alter table governance.policies enable row level security;
alter table governance.policy_versions enable row level security;
alter table knowledge.claim_types enable row level security;
alter table knowledge.claim_type_versions enable row level security;
alter table knowledge.scopes enable row level security;
alter table knowledge.results enable row level security;
alter table knowledge.result_revisions enable row level security;
alter table knowledge.result_revision_evidence enable row level security;
alter table knowledge.verifications enable row level security;
alter table publication.channels enable row level security;
alter table publication.records enable row level security;
alter table publication.decisions enable row level security;
alter table publication.current_state enable row level security;
alter table projection.product_pages enable row level security;
alter table projection.product_page_publications enable row level security;

revoke all on all tables in schema core, catalog, source, governance, knowledge,
  publication, projection from anon, authenticated;

create or replace function private.is_public_product_page_active(
  p_product_id uuid,
  p_locale text,
  p_channel_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, projection, publication
as $$
  select
    exists (
      select 1
        from projection.product_page_publications ppp
       where ppp.product_id = p_product_id
         and ppp.locale = p_locale
         and ppp.channel_id = p_channel_id
    )
    and not exists (
      select 1
        from projection.product_page_publications ppp
        left join publication.current_state pcs
          on pcs.publication_id = ppp.publication_id
       where ppp.product_id = p_product_id
         and ppp.locale = p_locale
         and ppp.channel_id = p_channel_id
         and (pcs.publication_id is null or pcs.status_code <> 'active')
    )
$$;

grant usage on schema projection to anon, authenticated;
grant select on projection.product_pages to anon, authenticated;

create policy product_pages_public_read
  on projection.product_pages
  for select
  to anon, authenticated
  using (
    private.is_public_product_page_active(product_id, locale, channel_id)
  );

create or replace view public_api.product_pages
with (security_invoker = true)
as
select
  pp.product_id,
  pp.locale,
  pp.page_payload,
  pp.content_hash,
  pp.projection_version,
  pp.built_at
from projection.product_pages pp
;

grant select on public_api.product_pages to anon, authenticated;

revoke execute on all functions in schema factory_api from public;
revoke execute on all functions in schema private from public;

grant execute on function private.is_public_product_page_active(uuid, text, uuid)
  to anon, authenticated;

grant execute on function factory_api.create_organization(text, text) to cm_factory;
grant execute on function factory_api.create_product(uuid, text) to cm_factory;
grant execute on function factory_api.create_document(uuid, text, text, text) to cm_factory;
grant execute on function factory_api.add_document_version(
  uuid, text, timestamptz, text, text, text, text, bigint, uuid
) to cm_factory;
grant execute on function factory_api.add_evidence(
  uuid, text, integer, integer, text, text, jsonb
) to cm_factory;
grant execute on function factory_api.create_claim_revision(
  uuid, text, jsonb, jsonb, text, uuid[]
) to cm_factory;
grant execute on function factory_api.verify_result_revision(
  uuid, text, jsonb, text, timestamptz
) to cm_factory;
grant execute on function factory_api.activate_publication(
  uuid, uuid, text, text
) to cm_publisher;
grant execute on function factory_api.suspend_publication(uuid, text) to cm_publisher;
grant execute on function factory_api.upsert_product_page(
  uuid, text, jsonb, uuid[]
) to cm_projector;

-- ---------------------------------------------------------------------------
-- Seed only structural dictionaries and pilot policies.
-- FS510 data belongs to the pilot test/fixture, not the migration.
-- ---------------------------------------------------------------------------

insert into core.entity_types (code, description)
values
  ('organization', 'Organization'),
  ('product', 'Medical device product model'),
  ('document', 'Source document')
on conflict (code) do nothing;

insert into publication.channels (stable_code, is_public)
values ('public_web', true)
on conflict (stable_code) do nothing;

with inserted_policy as (
  insert into governance.policies (stable_code, policy_type_code)
  values ('technical_claim_verification', 'verification')
  on conflict (stable_code)
  do update set policy_type_code = excluded.policy_type_code
  returning policy_id
)
insert into governance.policy_versions (
  policy_id,
  version_no,
  status_code,
  effective_from,
  rules,
  canonical_hash,
  approved_at
)
select
  policy_id,
  1,
  'active',
  '2026-07-02 00:00:00+03'::timestamptz,
  '{"supporting_evidence_required":true,"human_reviewer_required":true}'::jsonb,
  private.sha256_json(
    '{"supporting_evidence_required":true,"human_reviewer_required":true}'::jsonb
  ),
  now()
from inserted_policy
on conflict (policy_id, version_no) do nothing;

with inserted_policy as (
  insert into governance.policies (stable_code, policy_type_code)
  values ('public_claim_publication', 'publication')
  on conflict (stable_code)
  do update set policy_type_code = excluded.policy_type_code
  returning policy_id
)
insert into governance.policy_versions (
  policy_id,
  version_no,
  status_code,
  effective_from,
  rules,
  canonical_hash,
  approved_at
)
select
  policy_id,
  1,
  'active',
  '2026-07-02 00:00:00+03'::timestamptz,
  '{"allowed_verifications":["confirmed","confirmed_with_limitations"]}'::jsonb,
  private.sha256_json(
    '{"allowed_verifications":["confirmed","confirmed_with_limitations"]}'::jsonb
  ),
  now()
from inserted_policy
on conflict (policy_id, version_no) do nothing;

with policy_refs as (
  select
    max(pv.policy_version_id::text) filter (
      where p.stable_code = 'technical_claim_verification'
    )::uuid as verification_policy_version_id,
    max(pv.policy_version_id::text) filter (
      where p.stable_code = 'public_claim_publication'
    )::uuid as publication_policy_version_id
  from governance.policies p
  join governance.policy_versions pv on pv.policy_id = p.policy_id
  where pv.version_no = 1
),
inserted_claim_type as (
  insert into knowledge.claim_types (stable_code)
  values ('product.filtration_efficiency')
  on conflict (stable_code)
  do update set stable_code = excluded.stable_code
  returning claim_type_id
)
insert into knowledge.claim_type_versions (
  claim_type_id,
  version_no,
  status_code,
  definition,
  value_schema,
  scope_schema,
  verification_policy_version_id,
  publication_policy_version_id,
  effective_from,
  canonical_hash
)
select
  ict.claim_type_id,
  1,
  'active',
  'Filtration efficiency stated for a product under an explicit test scope',
  '{
    "type":"object",
    "required":["operator","number","unit"],
    "properties":{
      "operator":{"enum":[">",">=","=","<=","<"]},
      "number":{"type":"number"},
      "unit":{"const":"%"}
    },
    "additionalProperties":false
  }'::jsonb,
  '{
    "type":"object",
    "required":["product_id"],
    "properties":{
      "product_id":{"type":"string","format":"uuid"},
      "method":{"type":["string","null"]},
      "conditions":{"type":["object","null"]}
    }
  }'::jsonb,
  pr.verification_policy_version_id,
  pr.publication_policy_version_id,
  '2026-07-02 00:00:00+03'::timestamptz,
  private.sha256_json(jsonb_build_object(
    'code', 'product.filtration_efficiency',
    'version', 1
  ))
from inserted_claim_type ict
cross join policy_refs pr
on conflict (claim_type_id, version_no) do nothing;

commit;
