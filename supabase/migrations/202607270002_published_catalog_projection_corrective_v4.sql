-- Published Catalog Projection corrective v4.
-- Replaces the caller-resettable v3 finalization guard with closed transaction
-- evidence and makes controlled baseline initialization exactly idempotent.

begin;

create table cloud.published_catalog_projection_initialization_v4 (
  singleton boolean primary key default true check (singleton),
  contract_version text not null
    check (contract_version = '202607270002'),
  baseline_version bigint not null check (baseline_version >= 0),
  baseline_generated_at timestamptz not null,
  payload_checksum text not null
    check (payload_checksum ~ '^[0-9a-f]{64}$'),
  initialized_by name not null,
  initialized_at timestamptz not null
);

create table cloud.published_catalog_projection_initialization_state_v4 (
  singleton boolean primary key default true check (singleton),
  contract_version text not null
    check (contract_version = '202607270002'),
  initialized boolean not null default false,
  initialized_at timestamptz,
  constraint published_projection_initialization_state_v4 check (
    (not initialized and initialized_at is null)
    or (initialized and initialized_at is not null)
  )
);

insert into cloud.published_catalog_projection_initialization_state_v4 (
  singleton,
  contract_version,
  initialized,
  initialized_at
) values (true, '202607270002', false, null);

alter table cloud.published_catalog_projection_initialization_v4
  enable row level security;
alter table cloud.published_catalog_projection_initialization_state_v4
  enable row level security;
revoke all on table cloud.published_catalog_projection_initialization_v4
  from public, anon, authenticated, service_role;
revoke all on table cloud.published_catalog_projection_initialization_state_v4
  from public, anon, authenticated, service_role;

create or replace function cloud.reject_projection_initialization_mutation_v4()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
begin
  raise exception 'published projection v4 initialization evidence is immutable'
    using errcode = '55000';
end
$$;

create trigger published_projection_initialization_immutable_v4
  before update or delete or truncate
  on cloud.published_catalog_projection_initialization_v4
  for each statement
  execute function cloud.reject_projection_initialization_mutation_v4();
alter table cloud.published_catalog_projection_initialization_v4
  enable always trigger published_projection_initialization_immutable_v4;

create or replace function cloud.initialize_published_catalog_projection_v4(
  expected_payload_checksum text
)
returns jsonb
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
  initialization_completed boolean;
  initialization_completed_at timestamptz;
  evidence cloud.published_catalog_projection_initialization_v4%rowtype;
  v3_evidence cloud.published_catalog_projection_initialization_v3%rowtype;
begin
  if expected_payload_checksum is null
     or expected_payload_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'published projection initialization preflight checksum is invalid'
      using errcode = '22023';
  end if;

  select initialization_state.initialized, initialization_state.initialized_at
  into initialization_completed, initialization_completed_at
  from cloud.published_catalog_projection_initialization_state_v4 initialization_state
  where initialization_state.singleton
  for update;

  if not found then
    raise exception 'published projection v4 initialization state is unavailable'
      using errcode = '55000';
  end if;

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

  if not found or not current_initialized or current_checksum is null then
    raise exception 'published projection clock is not initialized'
      using errcode = '55000';
  end if;

  select evidence_row.*
  into v3_evidence
  from cloud.published_catalog_projection_initialization_v3 evidence_row
  where evidence_row.singleton;

  if not found
     or v3_evidence.migration_version <> '202607270001'
     or v3_evidence.payload_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'published projection v3 initialization evidence is unavailable or invalid'
      using errcode = '55000';
  end if;

  projection_snapshot := cloud.capture_published_catalog_projection_v2();
  if current_checksum is distinct from projection_snapshot ->> 'payloadChecksum' then
    raise exception 'published projection state checksum does not match current public baseline'
      using errcode = '55000';
  end if;

  if expected_payload_checksum is distinct from current_checksum then
    raise exception 'published projection initialization preflight checksum mismatch'
      using errcode = '55000';
  end if;

  select evidence_row.*
  into evidence
  from cloud.published_catalog_projection_initialization_v4 evidence_row
  where evidence_row.singleton;

  if initialization_completed then
    if not found then
      raise exception 'published projection initialized state has no immutable evidence'
        using errcode = '55000';
    end if;
    if evidence.contract_version <> '202607270002'
       or evidence.baseline_version is distinct from current_version
       or evidence.baseline_generated_at is distinct from current_changed_at
       or evidence.payload_checksum is distinct from current_checksum
       or evidence.initialized_by is null
       or evidence.initialized_at is null
       or initialization_completed_at is distinct from evidence.initialized_at then
      raise exception 'published projection initialization retry does not match immutable evidence'
        using errcode = '55000';
    end if;
  else
    if found then
      raise exception 'published projection initialization evidence exists without initialized state'
        using errcode = '55000';
    end if;
    insert into cloud.published_catalog_projection_initialization_v4 (
      singleton,
      contract_version,
      baseline_version,
      baseline_generated_at,
      payload_checksum,
      initialized_by,
      initialized_at
    ) values (
      true,
      '202607270002',
      current_version,
      current_changed_at,
      current_checksum,
      current_user,
      clock_timestamp()
    )
    returning * into evidence;

    update cloud.published_catalog_projection_initialization_state_v4 initialization_state
    set initialized = true,
        initialized_at = evidence.initialized_at
    where initialization_state.singleton;
  end if;

  return jsonb_build_object(
    'contractVersion', evidence.contract_version,
    'baselineVersion', evidence.baseline_version,
    'baselineGeneratedAt', evidence.baseline_generated_at,
    'payloadChecksum', evidence.payload_checksum,
    'initializedBy', evidence.initialized_by,
    'initializedAt', evidence.initialized_at
  );
end
$$;

-- The original v3 initializer remains an internal compatibility entry point.
-- Once evidence exists, an exact retry succeeds without any write. Divergent
-- state or payload remains fail-closed.
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
  evidence cloud.published_catalog_projection_initialization_v3%rowtype;
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

  if not found or not current_initialized or current_checksum is null then
    raise exception 'published projection clock is not initialized'
      using errcode = '55000';
  end if;

  projection_snapshot := cloud.capture_published_catalog_projection_v2();
  if current_checksum is distinct from projection_snapshot ->> 'payloadChecksum' then
    raise exception 'published projection state checksum does not match current public baseline'
      using errcode = '55000';
  end if;

  select evidence_row.*
  into evidence
  from cloud.published_catalog_projection_initialization_v3 evidence_row
  where evidence_row.singleton;

  if not found
     or evidence.migration_version <> '202607270001'
     or evidence.baseline_version is distinct from current_version
     or evidence.baseline_generated_at is distinct from current_changed_at
     or evidence.payload_checksum is distinct from current_checksum
     or evidence.initialized_at is null then
    raise exception 'published projection initialization retry does not match immutable evidence'
      using errcode = '55000';
  end if;
end
$$;

create table cloud.published_catalog_projection_transactions_v4 (
  transaction_id xid8 primary key,
  entry_payload_checksum text not null
    check (entry_payload_checksum ~ '^[0-9a-f]{64}$'),
  entry_version bigint not null check (entry_version >= 0),
  entry_generated_at timestamptz not null,
  mutation_statement_count integer not null default 0
    check (mutation_statement_count >= 0),
  mutation_generation bigint not null default 0
    check (mutation_generation >= 0),
  reconciled_generation bigint not null default 0
    check (reconciled_generation >= 0),
  terminal_finalized boolean not null default false,
  clock_slot_reserved boolean not null default false,
  clock_slot_changed_at timestamptz,
  final_payload_checksum text
    check (final_payload_checksum is null
      or final_payload_checksum ~ '^[0-9a-f]{64}$'),
  final_version bigint check (final_version is null or final_version >= 0),
  final_generated_at timestamptz,
  opened_at timestamptz not null default clock_timestamp(),
  constraint published_projection_transaction_generation_v4 check (
    reconciled_generation <= mutation_generation
  ),
  constraint published_projection_transaction_terminal_v4 check (
    (not terminal_finalized
      and final_payload_checksum is null
      and final_version is null
      and final_generated_at is null)
    or
    (terminal_finalized
      and final_payload_checksum is not null
      and final_version is not null
      and final_generated_at is not null)
  ),
  constraint published_projection_transaction_slot_v4 check (
    (not clock_slot_reserved and clock_slot_changed_at is null)
    or (clock_slot_reserved and clock_slot_changed_at is not null)
  )
);

create table cloud.published_catalog_projection_events_v4 (
  transaction_id xid8 not null references
    cloud.published_catalog_projection_transactions_v4(transaction_id),
  mutation_generation bigint not null check (mutation_generation > 0),
  queued_at timestamptz not null default clock_timestamp(),
  primary key (transaction_id, mutation_generation)
);

alter table cloud.published_catalog_projection_transactions_v4
  enable row level security;
alter table cloud.published_catalog_projection_events_v4
  enable row level security;
revoke all on table cloud.published_catalog_projection_transactions_v4
  from public, anon, authenticated, service_role;
revoke all on table cloud.published_catalog_projection_events_v4
  from public, anon, authenticated, service_role;

create or replace function cloud.enqueue_published_catalog_projection_v4()
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
  state_version bigint;
  state_changed_at timestamptz;
begin
  if exists (
    select 1
    from cloud.published_catalog_projection_transactions_v4 transaction_state
    where transaction_state.transaction_id = current_transaction
  ) then
    return null;
  end if;

  -- The singleton lock is acquired before the first tracked mutation and held
  -- until transaction end. Concurrent writers therefore capture globally
  -- ordered entry states, while one transaction retains one closed clock slot.
  select
    state.initialized,
    state.payload_checksum,
    state.version,
    state.changed_at
  into
    state_initialized,
    state_checksum,
    state_version,
    state_changed_at
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

  insert into cloud.published_catalog_projection_transactions_v4 (
    transaction_id,
    entry_payload_checksum,
    entry_version,
    entry_generated_at
  ) values (
    current_transaction,
    state_checksum,
    state_version,
    state_changed_at
  );

  return null;
end
$$;

create or replace function cloud.mark_published_catalog_projection_mutation_v4()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  current_transaction xid8 := pg_current_xact_id();
  current_generation bigint;
begin
  update cloud.published_catalog_projection_transactions_v4 transaction_state
  set mutation_statement_count = transaction_state.mutation_statement_count + 1,
      mutation_generation = transaction_state.mutation_generation + 1
  where transaction_state.transaction_id = current_transaction
  returning transaction_state.mutation_generation into current_generation;

  if not found then
    raise exception 'published projection transaction entry is unavailable'
      using errcode = '55000';
  end if;

  insert into cloud.published_catalog_projection_events_v4 (
    transaction_id,
    mutation_generation
  ) values (
    current_transaction,
    current_generation
  );

  return null;
end
$$;

create or replace function cloud.finalize_published_catalog_projection_v4()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
declare
  transaction_state cloud.published_catalog_projection_transactions_v4%rowtype;
  state_checksum text;
  state_version bigint;
  state_changed_at timestamptz;
  expected_checksum text;
  expected_version bigint;
  expected_changed_at timestamptz;
  final_snapshot jsonb;
  final_checksum text;
  target_version bigint;
  target_changed_at timestamptz;
  reserved_changed_at timestamptz;
begin
  select queued.*
  into transaction_state
  from cloud.published_catalog_projection_transactions_v4 queued
  where queued.transaction_id = new.transaction_id
  for update;

  if not found or transaction_state.mutation_statement_count < 1 then
    raise exception 'published projection finalizer has no closed transaction state'
      using errcode = '55000';
  end if;

  if transaction_state.reconciled_generation
       >= transaction_state.mutation_generation then
    return null;
  end if;

  select state.payload_checksum, state.version, state.changed_at
  into state_checksum, state_version, state_changed_at
  from cloud.published_catalog_projection_state state
  where state.singleton
  for update;

  expected_checksum := coalesce(
    transaction_state.final_payload_checksum,
    transaction_state.entry_payload_checksum
  );
  expected_version := coalesce(
    transaction_state.final_version,
    transaction_state.entry_version
  );
  expected_changed_at := coalesce(
    transaction_state.final_generated_at,
    transaction_state.entry_generated_at
  );

  if not found
     or state_checksum is distinct from expected_checksum
     or state_version is distinct from expected_version
     or state_changed_at is distinct from expected_changed_at then
    raise exception 'published projection closed transaction state does not match clock'
      using errcode = '55000';
  end if;

  final_snapshot := cloud.capture_published_catalog_projection_v2();
  final_checksum := final_snapshot ->> 'payloadChecksum';

  if final_checksum is null or final_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'published projection final checksum is invalid'
      using errcode = '55000';
  end if;

  reserved_changed_at := transaction_state.clock_slot_changed_at;
  if final_checksum is distinct from transaction_state.entry_payload_checksum
     and reserved_changed_at is null then
    reserved_changed_at := greatest(
      clock_timestamp(),
      transaction_state.entry_generated_at + interval '1 microsecond',
      coalesce(
        (final_snapshot ->> 'sourceGeneratedAt')::timestamptz,
        '1970-01-01 00:00:00+00'::timestamptz
      )
    );
  end if;

  if final_checksum is distinct from transaction_state.entry_payload_checksum then
    target_version := transaction_state.entry_version + 1;
    target_changed_at := reserved_changed_at;
  else
    target_version := transaction_state.entry_version;
    target_changed_at := transaction_state.entry_generated_at;
  end if;

  if state_checksum is distinct from final_checksum
     or state_version is distinct from target_version
     or state_changed_at is distinct from target_changed_at then
    update cloud.published_catalog_projection_state state
    set version = target_version,
        changed_at = target_changed_at,
        initialized = true,
        payload_checksum = final_checksum
    where state.singleton;
  end if;

  update cloud.published_catalog_projection_transactions_v4 queued
  set reconciled_generation = queued.mutation_generation,
      terminal_finalized = true,
      clock_slot_reserved = queued.clock_slot_reserved
        or final_checksum is distinct from queued.entry_payload_checksum,
      clock_slot_changed_at = coalesce(
        queued.clock_slot_changed_at,
        reserved_changed_at
      ),
      final_payload_checksum = final_checksum,
      final_version = target_version,
      final_generated_at = target_changed_at
  where queued.transaction_id = new.transaction_id;

  delete from cloud.published_catalog_projection_events_v4 event
  where event.transaction_id = new.transaction_id;

  return null;
end
$$;

create constraint trigger published_projection_transaction_finalize_v4
  after insert on cloud.published_catalog_projection_events_v4
  deferrable initially deferred
  for each row
  execute function cloud.finalize_published_catalog_projection_v4();
alter table cloud.published_catalog_projection_events_v4
  enable always trigger published_projection_transaction_finalize_v4;

-- Corrective v3 tracked/finalizer triggers are neutralized. Their functions and
-- tables remain as historical schema artifacts but no longer participate in
-- clock correctness.
drop trigger published_projection_transaction_finalize_v3
  on cloud.published_catalog_projection_transactions_v3;
drop trigger products_projection_before_v3 on cloud.products;
drop trigger products_projection_after_v3 on cloud.products;
drop trigger manufacturers_projection_before_v3 on cloud.manufacturers;
drop trigger manufacturers_projection_after_v3 on cloud.manufacturers;
drop trigger categories_projection_before_v3 on cloud.categories;
drop trigger categories_projection_after_v3 on cloud.categories;
drop trigger application_areas_projection_before_v3 on cloud.application_areas;
drop trigger application_areas_projection_after_v3 on cloud.application_areas;
drop trigger product_application_areas_projection_before_v3 on cloud.product_application_areas;
drop trigger product_application_areas_projection_after_v3 on cloud.product_application_areas;
drop trigger storage_objects_projection_before_v3 on cloud.storage_objects;
drop trigger storage_objects_projection_after_v3 on cloud.storage_objects;
drop trigger product_documents_projection_before_v3 on cloud.product_documents;
drop trigger product_documents_projection_after_v3 on cloud.product_documents;
drop trigger import_products_projection_before_v3 on cloud.import_products;
drop trigger import_products_projection_after_v3 on cloud.import_products;
drop trigger import_blocking_errors_projection_before_v3 on cloud.import_blocking_errors;
drop trigger import_blocking_errors_projection_after_v3 on cloud.import_blocking_errors;
drop trigger product_publication_revisions_projection_before_v3 on cloud.product_publication_revisions;
drop trigger product_publication_revisions_projection_after_v3 on cloud.product_publication_revisions;
drop trigger product_publication_approvals_projection_before_v3 on cloud.product_publication_approvals;
drop trigger product_publication_approvals_projection_after_v3 on cloud.product_publication_approvals;
drop trigger product_publication_batches_projection_before_v3 on cloud.product_publication_batches;
drop trigger product_publication_batches_projection_after_v3 on cloud.product_publication_batches;
drop trigger review_decisions_projection_before_v3 on cloud.review_decisions;
drop trigger review_decisions_projection_after_v3 on cloud.review_decisions;
drop trigger publication_candidates_projection_before_v3 on cloud.publication_candidates;
drop trigger publication_candidates_projection_after_v3 on cloud.publication_candidates;
drop trigger product_detail_candidate_revisions_projection_before_v3 on cloud.product_detail_candidate_revisions;
drop trigger product_detail_candidate_revisions_projection_after_v3 on cloud.product_detail_candidate_revisions;
drop trigger product_detail_candidate_approvals_projection_before_v3 on cloud.product_detail_candidate_revision_approvals;
drop trigger product_detail_candidate_approvals_projection_after_v3 on cloud.product_detail_candidate_revision_approvals;
drop trigger product_detail_batches_projection_before_v3 on cloud.product_detail_publication_batches;
drop trigger product_detail_batches_projection_after_v3 on cloud.product_detail_publication_batches;
drop trigger product_key_features_projection_before_v3 on cloud.product_key_features;
drop trigger product_key_features_projection_after_v3 on cloud.product_key_features;
drop trigger product_characteristics_projection_before_v3 on cloud.product_characteristics;
drop trigger product_characteristics_projection_after_v3 on cloud.product_characteristics;

create trigger products_projection_before_v4 before insert or update or delete or truncate
  on cloud.products for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger products_projection_after_v4 after insert or update or delete or truncate
  on cloud.products for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger manufacturers_projection_before_v4 before insert or update or delete or truncate
  on cloud.manufacturers for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger manufacturers_projection_after_v4 after insert or update or delete or truncate
  on cloud.manufacturers for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger categories_projection_before_v4 before insert or update or delete or truncate
  on cloud.categories for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger categories_projection_after_v4 after insert or update or delete or truncate
  on cloud.categories for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger application_areas_projection_before_v4 before insert or update or delete or truncate
  on cloud.application_areas for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger application_areas_projection_after_v4 after insert or update or delete or truncate
  on cloud.application_areas for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_application_areas_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_application_areas for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_application_areas_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_application_areas for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger storage_objects_projection_before_v4 before insert or update or delete or truncate
  on cloud.storage_objects for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger storage_objects_projection_after_v4 after insert or update or delete or truncate
  on cloud.storage_objects for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_documents_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_documents for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_documents_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_documents for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger import_products_projection_before_v4 before insert or update or delete or truncate
  on cloud.import_products for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger import_products_projection_after_v4 after insert or update or delete or truncate
  on cloud.import_products for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger import_blocking_errors_projection_before_v4 before insert or update or delete or truncate
  on cloud.import_blocking_errors for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger import_blocking_errors_projection_after_v4 after insert or update or delete or truncate
  on cloud.import_blocking_errors for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_publication_revisions_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_publication_revisions for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_publication_revisions_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_publication_revisions for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_publication_approvals_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_publication_approvals for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_publication_approvals_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_publication_approvals for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_publication_batches_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_publication_batches for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_publication_batches_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_publication_batches for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger review_decisions_projection_before_v4 before insert or update or delete or truncate
  on cloud.review_decisions for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger review_decisions_projection_after_v4 after insert or update or delete or truncate
  on cloud.review_decisions for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger publication_candidates_projection_before_v4 before insert or update or delete or truncate
  on cloud.publication_candidates for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger publication_candidates_projection_after_v4 after insert or update or delete or truncate
  on cloud.publication_candidates for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_detail_candidate_revisions_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_detail_candidate_revisions for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_detail_candidate_revisions_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_detail_candidate_revisions for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_detail_candidate_approvals_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_detail_candidate_revision_approvals for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_detail_candidate_approvals_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_detail_candidate_revision_approvals for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_detail_batches_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_detail_publication_batches for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_detail_batches_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_detail_publication_batches for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_key_features_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_key_features for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_key_features_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_key_features for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();
create trigger product_characteristics_projection_before_v4 before insert or update or delete or truncate
  on cloud.product_characteristics for each statement execute function cloud.enqueue_published_catalog_projection_v4();
create trigger product_characteristics_projection_after_v4 after insert or update or delete or truncate
  on cloud.product_characteristics for each statement execute function cloud.mark_published_catalog_projection_mutation_v4();

alter table cloud.products enable always trigger products_projection_before_v4;
alter table cloud.products enable always trigger products_projection_after_v4;
alter table cloud.manufacturers enable always trigger manufacturers_projection_before_v4;
alter table cloud.manufacturers enable always trigger manufacturers_projection_after_v4;
alter table cloud.categories enable always trigger categories_projection_before_v4;
alter table cloud.categories enable always trigger categories_projection_after_v4;
alter table cloud.application_areas enable always trigger application_areas_projection_before_v4;
alter table cloud.application_areas enable always trigger application_areas_projection_after_v4;
alter table cloud.product_application_areas enable always trigger product_application_areas_projection_before_v4;
alter table cloud.product_application_areas enable always trigger product_application_areas_projection_after_v4;
alter table cloud.storage_objects enable always trigger storage_objects_projection_before_v4;
alter table cloud.storage_objects enable always trigger storage_objects_projection_after_v4;
alter table cloud.product_documents enable always trigger product_documents_projection_before_v4;
alter table cloud.product_documents enable always trigger product_documents_projection_after_v4;
alter table cloud.import_products enable always trigger import_products_projection_before_v4;
alter table cloud.import_products enable always trigger import_products_projection_after_v4;
alter table cloud.import_blocking_errors enable always trigger import_blocking_errors_projection_before_v4;
alter table cloud.import_blocking_errors enable always trigger import_blocking_errors_projection_after_v4;
alter table cloud.product_publication_revisions enable always trigger product_publication_revisions_projection_before_v4;
alter table cloud.product_publication_revisions enable always trigger product_publication_revisions_projection_after_v4;
alter table cloud.product_publication_approvals enable always trigger product_publication_approvals_projection_before_v4;
alter table cloud.product_publication_approvals enable always trigger product_publication_approvals_projection_after_v4;
alter table cloud.product_publication_batches enable always trigger product_publication_batches_projection_before_v4;
alter table cloud.product_publication_batches enable always trigger product_publication_batches_projection_after_v4;
alter table cloud.review_decisions enable always trigger review_decisions_projection_before_v4;
alter table cloud.review_decisions enable always trigger review_decisions_projection_after_v4;
alter table cloud.publication_candidates enable always trigger publication_candidates_projection_before_v4;
alter table cloud.publication_candidates enable always trigger publication_candidates_projection_after_v4;
alter table cloud.product_detail_candidate_revisions enable always trigger product_detail_candidate_revisions_projection_before_v4;
alter table cloud.product_detail_candidate_revisions enable always trigger product_detail_candidate_revisions_projection_after_v4;
alter table cloud.product_detail_candidate_revision_approvals enable always trigger product_detail_candidate_approvals_projection_before_v4;
alter table cloud.product_detail_candidate_revision_approvals enable always trigger product_detail_candidate_approvals_projection_after_v4;
alter table cloud.product_detail_publication_batches enable always trigger product_detail_batches_projection_before_v4;
alter table cloud.product_detail_publication_batches enable always trigger product_detail_batches_projection_after_v4;
alter table cloud.product_key_features enable always trigger product_key_features_projection_before_v4;
alter table cloud.product_key_features enable always trigger product_key_features_projection_after_v4;
alter table cloud.product_characteristics enable always trigger product_characteristics_projection_before_v4;
alter table cloud.product_characteristics enable always trigger product_characteristics_projection_after_v4;

revoke all on function cloud.reject_projection_initialization_mutation_v4()
  from public, anon, authenticated, service_role;
revoke all on function cloud.initialize_published_catalog_projection_v4(text)
  from public, anon, authenticated, service_role;
revoke all on function cloud.initialize_published_catalog_projection_v3()
  from public, anon, authenticated, service_role;
revoke all on function cloud.enqueue_published_catalog_projection_v4()
  from public, anon, authenticated, service_role;
revoke all on function cloud.mark_published_catalog_projection_mutation_v4()
  from public, anon, authenticated, service_role;
revoke all on function cloud.finalize_published_catalog_projection_v4()
  from public, anon, authenticated, service_role;

comment on table cloud.published_catalog_projection_initialization_v4 is
  'Immutable evidence for explicit checksum-bound Corrective v4 baseline initialization.';
comment on table cloud.published_catalog_projection_initialization_state_v4 is
  'Private singleton distinguishing first v4 initialization from corrupt missing evidence.';
comment on table cloud.published_catalog_projection_transactions_v4 is
  'Closed xid8 transaction evidence reserving at most one projection clock slot.';
comment on table cloud.published_catalog_projection_events_v4 is
  'Private deferred reconciliation events; rows are removed by the internal finalizer.';
comment on function cloud.initialize_published_catalog_projection_v4(text) is
  'Explicit checksum-bound, exact-retry-idempotent baseline initialization contract.';
comment on function cloud.enqueue_published_catalog_projection_v4() is
  'Captures one caller-proof transaction entry state before the first tracked mutation.';
comment on function cloud.finalize_published_catalog_projection_v4() is
  'Reconciles one closed transaction clock slot to the latest transaction-local payload.';

commit;
