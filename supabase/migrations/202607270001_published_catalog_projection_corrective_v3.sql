-- Published Catalog Projection corrective v3.
-- Coalesces every tracked transaction into one transaction-final projection
-- comparison and atomically initializes the existing public baseline clock.

begin;

create table cloud.published_catalog_projection_initialization_v3 (
  singleton boolean primary key default true check (singleton),
  migration_version text not null
    check (migration_version = '202607270001'),
  initialization_mode text not null
    check (initialization_mode in (
      'initialized_existing_baseline', 'verified_existing_clock'
    )),
  baseline_version bigint not null check (baseline_version >= 0),
  baseline_generated_at timestamptz not null,
  payload_checksum text not null
    check (payload_checksum ~ '^[0-9a-f]{64}$'),
  initialized_at timestamptz not null
);

alter table cloud.published_catalog_projection_initialization_v3
  enable row level security;
revoke all on table cloud.published_catalog_projection_initialization_v3
  from public, anon, authenticated, service_role;

create or replace function cloud.reject_projection_initialization_mutation_v3()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
begin
  raise exception 'published projection initialization evidence is immutable'
    using errcode = '55000';
end
$$;

create trigger published_projection_initialization_immutable_v3
  before update or delete or truncate
  on cloud.published_catalog_projection_initialization_v3
  for each statement
  execute function cloud.reject_projection_initialization_mutation_v3();
alter table cloud.published_catalog_projection_initialization_v3
  enable always trigger published_projection_initialization_immutable_v3;

create or replace function cloud.initialize_published_catalog_projection_v3()
returns void
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  projection_snapshot jsonb;
  current_version bigint;
  current_changed_at timestamptz;
  current_initialized boolean;
  current_checksum text;
  baseline_generated_at timestamptz;
  baseline_checksum text;
  initialization_mode text;
begin
  select
    state.version,
    state.changed_at,
    state.initialized,
    state.payload_checksum
  into
    current_version,
    current_changed_at,
    current_initialized,
    current_checksum
  from cloud.published_catalog_projection_state state
  where state.singleton
  for update;

  if not found then
    raise exception 'published projection clock state is unavailable'
      using errcode = '55000';
  end if;

  projection_snapshot := cloud.capture_published_catalog_projection_v2();
  baseline_checksum := projection_snapshot ->> 'payloadChecksum';
  baseline_generated_at := (
    projection_snapshot ->> 'publicGeneratedAt'
  )::timestamptz;

  if baseline_checksum is null
     or baseline_checksum !~ '^[0-9a-f]{64}$'
     or baseline_generated_at is null then
    raise exception 'published projection baseline cannot be initialized'
      using errcode = '55000';
  end if;

  if current_initialized then
    if current_checksum is distinct from baseline_checksum then
      raise exception 'published projection state checksum does not match current public baseline'
        using errcode = '55000';
    end if;
    initialization_mode := 'verified_existing_clock';
  else
    update cloud.published_catalog_projection_state state
    set initialized = true,
        changed_at = baseline_generated_at,
        payload_checksum = baseline_checksum
    where state.singleton;
    initialization_mode := 'initialized_existing_baseline';
  end if;

  insert into cloud.published_catalog_projection_initialization_v3 (
    singleton,
    migration_version,
    initialization_mode,
    baseline_version,
    baseline_generated_at,
    payload_checksum,
    initialized_at
  ) values (
    true,
    '202607270001',
    initialization_mode,
    current_version,
    case
      when current_initialized then current_changed_at
      else baseline_generated_at
    end,
    baseline_checksum,
    clock_timestamp()
  );
end
$$;

select cloud.initialize_published_catalog_projection_v3();

create table cloud.published_catalog_projection_transactions_v3 (
  transaction_id xid8 primary key,
  entry_payload_checksum text not null
    check (entry_payload_checksum ~ '^[0-9a-f]{64}$'),
  entry_generated_at timestamptz not null,
  mutation_statement_count integer not null default 0
    check (mutation_statement_count >= 0),
  queued_at timestamptz not null default clock_timestamp()
);

alter table cloud.published_catalog_projection_transactions_v3
  enable row level security;
revoke all on table cloud.published_catalog_projection_transactions_v3
  from public, anon, authenticated, service_role;

create or replace function cloud.enqueue_published_catalog_projection_v3()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  current_transaction xid8 := pg_current_xact_id();
  projection_snapshot jsonb;
  state_initialized boolean;
  state_checksum text;
begin
  if current_setting('cybermedica.published_projection_finalized_v3', true) = '1' then
    raise exception 'published projection clock was already finalized in this transaction'
      using errcode = '55000';
  end if;

  if exists (
    select 1
    from cloud.published_catalog_projection_transactions_v3 queued
    where queued.transaction_id = current_transaction
  ) then
    return null;
  end if;

  -- Serialize tracked writers before their first mutation. The lock is held
  -- through commit, so the deferred finalizer compares two globally ordered
  -- committed states and cannot lose a concurrent public change.
  select state.initialized, state.payload_checksum
  into state_initialized, state_checksum
  from cloud.published_catalog_projection_state state
  where state.singleton
  for update;

  if not found or not state_initialized or state_checksum is null then
    raise exception 'published projection clock is not initialized'
      using errcode = '55000';
  end if;

  projection_snapshot := cloud.capture_published_catalog_projection_v2();
  if state_checksum is distinct from projection_snapshot ->> 'payloadChecksum' then
    raise exception 'published projection state drift detected before transaction mutation'
      using errcode = '55000';
  end if;

  insert into cloud.published_catalog_projection_transactions_v3 (
    transaction_id,
    entry_payload_checksum,
    entry_generated_at
  ) values (
    current_transaction,
    state_checksum,
    (projection_snapshot ->> 'publicGeneratedAt')::timestamptz
  );

  return null;
end
$$;

create or replace function cloud.mark_published_catalog_projection_mutation_v3()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
begin
  update cloud.published_catalog_projection_transactions_v3 queued
  set mutation_statement_count = queued.mutation_statement_count + 1
  where queued.transaction_id = pg_current_xact_id();

  if not found then
    raise exception 'published projection transaction entry is unavailable'
      using errcode = '55000';
  end if;

  return null;
end
$$;

create or replace function cloud.finalize_published_catalog_projection_v3()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  queued_checksum text;
  queued_generated_at timestamptz;
  queued_statement_count integer;
  state_checksum text;
  state_changed_at timestamptz;
  final_snapshot jsonb;
  final_checksum text;
begin
  select
    queued.entry_payload_checksum,
    queued.entry_generated_at,
    queued.mutation_statement_count
  into
    queued_checksum,
    queued_generated_at,
    queued_statement_count
  from cloud.published_catalog_projection_transactions_v3 queued
  where queued.transaction_id = new.transaction_id;

  if not found or queued_statement_count < 1 then
    raise exception 'published projection finalizer ran before a tracked mutation completed'
      using errcode = '55000';
  end if;

  select state.payload_checksum, state.changed_at
  into state_checksum, state_changed_at
  from cloud.published_catalog_projection_state state
  where state.singleton
  for update;

  if not found or state_checksum is distinct from queued_checksum then
    raise exception 'published projection transaction entry no longer matches clock state'
      using errcode = '55000';
  end if;

  final_snapshot := cloud.capture_published_catalog_projection_v2();
  final_checksum := final_snapshot ->> 'payloadChecksum';

  if final_checksum is null or final_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'published projection final checksum is invalid'
      using errcode = '55000';
  end if;

  if queued_checksum is distinct from final_checksum then
    update cloud.published_catalog_projection_state state
    set version = state.version + 1,
        changed_at = greatest(
          clock_timestamp(),
          state_changed_at + interval '1 microsecond',
          queued_generated_at + interval '1 microsecond'
        ),
        payload_checksum = final_checksum
    where state.singleton;
  end if;

  delete from cloud.published_catalog_projection_transactions_v3 queued
  where queued.transaction_id = new.transaction_id;

  perform set_config(
    'cybermedica.published_projection_finalized_v3', '1', true
  );
  return null;
end
$$;

create constraint trigger published_projection_transaction_finalize_v3
  after insert on cloud.published_catalog_projection_transactions_v3
  deferrable initially deferred
  for each row
  execute function cloud.finalize_published_catalog_projection_v3();
alter table cloud.published_catalog_projection_transactions_v3
  enable always trigger published_projection_transaction_finalize_v3;

-- Corrective v2 statement-final triggers are replaced, not modified in place.
drop trigger products_projection_before_v2 on cloud.products;
drop trigger products_projection_after_v2 on cloud.products;
drop trigger manufacturers_projection_before_v2 on cloud.manufacturers;
drop trigger manufacturers_projection_after_v2 on cloud.manufacturers;
drop trigger categories_projection_before_v2 on cloud.categories;
drop trigger categories_projection_after_v2 on cloud.categories;
drop trigger application_areas_projection_before_v2 on cloud.application_areas;
drop trigger application_areas_projection_after_v2 on cloud.application_areas;
drop trigger product_application_areas_projection_before_v2 on cloud.product_application_areas;
drop trigger product_application_areas_projection_after_v2 on cloud.product_application_areas;
drop trigger storage_objects_projection_before_v2 on cloud.storage_objects;
drop trigger storage_objects_projection_after_v2 on cloud.storage_objects;
drop trigger product_documents_projection_before_v2 on cloud.product_documents;
drop trigger product_documents_projection_after_v2 on cloud.product_documents;
drop trigger import_products_projection_before_v2 on cloud.import_products;
drop trigger import_products_projection_after_v2 on cloud.import_products;
drop trigger import_blocking_errors_projection_before_v2 on cloud.import_blocking_errors;
drop trigger import_blocking_errors_projection_after_v2 on cloud.import_blocking_errors;
drop trigger product_publication_revisions_projection_before_v2 on cloud.product_publication_revisions;
drop trigger product_publication_revisions_projection_after_v2 on cloud.product_publication_revisions;
drop trigger product_publication_approvals_projection_before_v2 on cloud.product_publication_approvals;
drop trigger product_publication_approvals_projection_after_v2 on cloud.product_publication_approvals;
drop trigger product_publication_batches_projection_before_v2 on cloud.product_publication_batches;
drop trigger product_publication_batches_projection_after_v2 on cloud.product_publication_batches;
drop trigger review_decisions_projection_before_v2 on cloud.review_decisions;
drop trigger review_decisions_projection_after_v2 on cloud.review_decisions;
drop trigger publication_candidates_projection_before_v2 on cloud.publication_candidates;
drop trigger publication_candidates_projection_after_v2 on cloud.publication_candidates;
drop trigger product_detail_candidate_revisions_projection_before_v2 on cloud.product_detail_candidate_revisions;
drop trigger product_detail_candidate_revisions_projection_after_v2 on cloud.product_detail_candidate_revisions;
drop trigger product_detail_candidate_approvals_projection_before_v2 on cloud.product_detail_candidate_revision_approvals;
drop trigger product_detail_candidate_approvals_projection_after_v2 on cloud.product_detail_candidate_revision_approvals;
drop trigger product_detail_batches_projection_before_v2 on cloud.product_detail_publication_batches;
drop trigger product_detail_batches_projection_after_v2 on cloud.product_detail_publication_batches;
drop trigger product_key_features_projection_before_v2 on cloud.product_key_features;
drop trigger product_key_features_projection_after_v2 on cloud.product_key_features;
drop trigger product_characteristics_projection_before_v2 on cloud.product_characteristics;
drop trigger product_characteristics_projection_after_v2 on cloud.product_characteristics;

create trigger products_projection_before_v3 before insert or update or delete or truncate
  on cloud.products for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger products_projection_after_v3 after insert or update or delete or truncate
  on cloud.products for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger manufacturers_projection_before_v3 before insert or update or delete or truncate
  on cloud.manufacturers for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger manufacturers_projection_after_v3 after insert or update or delete or truncate
  on cloud.manufacturers for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger categories_projection_before_v3 before insert or update or delete or truncate
  on cloud.categories for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger categories_projection_after_v3 after insert or update or delete or truncate
  on cloud.categories for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger application_areas_projection_before_v3 before insert or update or delete or truncate
  on cloud.application_areas for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger application_areas_projection_after_v3 after insert or update or delete or truncate
  on cloud.application_areas for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_application_areas_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_application_areas for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_application_areas_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_application_areas for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger storage_objects_projection_before_v3 before insert or update or delete or truncate
  on cloud.storage_objects for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger storage_objects_projection_after_v3 after insert or update or delete or truncate
  on cloud.storage_objects for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_documents_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_documents for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_documents_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_documents for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger import_products_projection_before_v3 before insert or update or delete or truncate
  on cloud.import_products for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger import_products_projection_after_v3 after insert or update or delete or truncate
  on cloud.import_products for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger import_blocking_errors_projection_before_v3 before insert or update or delete or truncate
  on cloud.import_blocking_errors for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger import_blocking_errors_projection_after_v3 after insert or update or delete or truncate
  on cloud.import_blocking_errors for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_publication_revisions_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_publication_revisions for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_publication_revisions_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_publication_revisions for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_publication_approvals_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_publication_approvals for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_publication_approvals_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_publication_approvals for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_publication_batches_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_publication_batches for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_publication_batches_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_publication_batches for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger review_decisions_projection_before_v3 before insert or update or delete or truncate
  on cloud.review_decisions for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger review_decisions_projection_after_v3 after insert or update or delete or truncate
  on cloud.review_decisions for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger publication_candidates_projection_before_v3 before insert or update or delete or truncate
  on cloud.publication_candidates for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger publication_candidates_projection_after_v3 after insert or update or delete or truncate
  on cloud.publication_candidates for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_detail_candidate_revisions_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_detail_candidate_revisions for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_detail_candidate_revisions_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_detail_candidate_revisions for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_detail_candidate_approvals_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_detail_candidate_revision_approvals for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_detail_candidate_approvals_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_detail_candidate_revision_approvals for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_detail_batches_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_detail_publication_batches for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_detail_batches_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_detail_publication_batches for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_key_features_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_key_features for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_key_features_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_key_features for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();
create trigger product_characteristics_projection_before_v3 before insert or update or delete or truncate
  on cloud.product_characteristics for each statement execute function cloud.enqueue_published_catalog_projection_v3();
create trigger product_characteristics_projection_after_v3 after insert or update or delete or truncate
  on cloud.product_characteristics for each statement execute function cloud.mark_published_catalog_projection_mutation_v3();

alter table cloud.products enable always trigger products_projection_before_v3;
alter table cloud.products enable always trigger products_projection_after_v3;
alter table cloud.manufacturers enable always trigger manufacturers_projection_before_v3;
alter table cloud.manufacturers enable always trigger manufacturers_projection_after_v3;
alter table cloud.categories enable always trigger categories_projection_before_v3;
alter table cloud.categories enable always trigger categories_projection_after_v3;
alter table cloud.application_areas enable always trigger application_areas_projection_before_v3;
alter table cloud.application_areas enable always trigger application_areas_projection_after_v3;
alter table cloud.product_application_areas enable always trigger product_application_areas_projection_before_v3;
alter table cloud.product_application_areas enable always trigger product_application_areas_projection_after_v3;
alter table cloud.storage_objects enable always trigger storage_objects_projection_before_v3;
alter table cloud.storage_objects enable always trigger storage_objects_projection_after_v3;
alter table cloud.product_documents enable always trigger product_documents_projection_before_v3;
alter table cloud.product_documents enable always trigger product_documents_projection_after_v3;
alter table cloud.import_products enable always trigger import_products_projection_before_v3;
alter table cloud.import_products enable always trigger import_products_projection_after_v3;
alter table cloud.import_blocking_errors enable always trigger import_blocking_errors_projection_before_v3;
alter table cloud.import_blocking_errors enable always trigger import_blocking_errors_projection_after_v3;
alter table cloud.product_publication_revisions enable always trigger product_publication_revisions_projection_before_v3;
alter table cloud.product_publication_revisions enable always trigger product_publication_revisions_projection_after_v3;
alter table cloud.product_publication_approvals enable always trigger product_publication_approvals_projection_before_v3;
alter table cloud.product_publication_approvals enable always trigger product_publication_approvals_projection_after_v3;
alter table cloud.product_publication_batches enable always trigger product_publication_batches_projection_before_v3;
alter table cloud.product_publication_batches enable always trigger product_publication_batches_projection_after_v3;
alter table cloud.review_decisions enable always trigger review_decisions_projection_before_v3;
alter table cloud.review_decisions enable always trigger review_decisions_projection_after_v3;
alter table cloud.publication_candidates enable always trigger publication_candidates_projection_before_v3;
alter table cloud.publication_candidates enable always trigger publication_candidates_projection_after_v3;
alter table cloud.product_detail_candidate_revisions enable always trigger product_detail_candidate_revisions_projection_before_v3;
alter table cloud.product_detail_candidate_revisions enable always trigger product_detail_candidate_revisions_projection_after_v3;
alter table cloud.product_detail_candidate_revision_approvals enable always trigger product_detail_candidate_approvals_projection_before_v3;
alter table cloud.product_detail_candidate_revision_approvals enable always trigger product_detail_candidate_approvals_projection_after_v3;
alter table cloud.product_detail_publication_batches enable always trigger product_detail_batches_projection_before_v3;
alter table cloud.product_detail_publication_batches enable always trigger product_detail_batches_projection_after_v3;
alter table cloud.product_key_features enable always trigger product_key_features_projection_before_v3;
alter table cloud.product_key_features enable always trigger product_key_features_projection_after_v3;
alter table cloud.product_characteristics enable always trigger product_characteristics_projection_before_v3;
alter table cloud.product_characteristics enable always trigger product_characteristics_projection_after_v3;

revoke all on function cloud.reject_projection_initialization_mutation_v3()
  from public, anon, authenticated, service_role;
revoke all on function cloud.initialize_published_catalog_projection_v3()
  from public, anon, authenticated, service_role;
revoke all on function cloud.enqueue_published_catalog_projection_v3()
  from public, anon, authenticated, service_role;
revoke all on function cloud.mark_published_catalog_projection_mutation_v3()
  from public, anon, authenticated, service_role;
revoke all on function cloud.finalize_published_catalog_projection_v3()
  from public, anon, authenticated, service_role;

comment on table cloud.published_catalog_projection_initialization_v3 is
  'Immutable local evidence for the atomic Corrective v3 baseline initialization.';
comment on table cloud.published_catalog_projection_transactions_v3 is
  'Private transaction-scoped queue coalescing tracked writes into one projection comparison.';
comment on function cloud.enqueue_published_catalog_projection_v3() is
  'Captures and locks one public projection entry state before the first tracked mutation.';
comment on function cloud.finalize_published_catalog_projection_v3() is
  'Deferred transaction-final public payload comparison and monotonic clock update.';

commit;
