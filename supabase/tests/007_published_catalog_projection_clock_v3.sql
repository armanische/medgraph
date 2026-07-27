\set ON_ERROR_STOP on

select set_config('request.jwt.claim.role', 'service_role', false);

create temporary table projection_clock_probe_v3 (
  stage text primary key,
  payload jsonb not null,
  version bigint not null
) on commit preserve rows;

create function pg_temp.capture_projection_clock_v3(stage_name text)
returns void
language plpgsql
as $$
begin
  insert into projection_clock_probe_v3 (stage, payload, version)
  select
    stage_name,
    cloud_api.cloud_published_storefront_catalog_v1(),
    state.version
  from cloud.published_catalog_projection_state state
  where state.singleton;
end
$$;

do $$
declare
  projection jsonb;
  state_checksum text;
begin
  select cloud_api.cloud_published_storefront_catalog_v1(), state.payload_checksum
  into projection, state_checksum
  from cloud.published_catalog_projection_state state
  where state.singleton and state.initialized;

  if projection is null
     or state_checksum is distinct from cloud.sha256_jsonb_v1(
       projection - 'generatedAt'
     )
     or (select count(*) from cloud.published_catalog_projection_initialization_v3) <> 1
     or (select count(*) from cloud.published_catalog_projection_initialization_v4) <> 1
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0 then
    raise exception 'transaction-final projection clock bootstrap is invalid';
  end if;
end
$$;

-- Initialization evidence remains immutable even when a privileged integrity
-- fixture uses replica mode; the guard is ENABLE ALWAYS.
begin;
set local session_replication_role = replica;
do $$
begin
  begin
    update cloud.published_catalog_projection_initialization_v3
    set initialized_at = clock_timestamp()
    where singleton;
    raise exception 'initialization evidence UPDATE unexpectedly succeeded';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    delete from cloud.published_catalog_projection_initialization_v3
    where singleton;
    raise exception 'initialization evidence DELETE unexpectedly succeeded';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    truncate cloud.published_catalog_projection_initialization_v3;
    raise exception 'initialization evidence TRUNCATE unexpectedly succeeded';
  exception
    when sqlstate '55000' then null;
  end;
end
$$;
rollback;

-- A transaction that removes and restores the same public document has the
-- same committed public payload and therefore must not advance the clock.
select pg_temp.capture_projection_clock_v3('net-zero-before');
begin;
update cloud.storage_objects
set access_status = 'private'
where id = '60000000-0000-4000-8000-000000000031';
update cloud.storage_objects
set access_status = 'public'
where id = '60000000-0000-4000-8000-000000000031';
do $$
declare
  queued_count integer;
  statement_count integer;
  before_version bigint;
  current_version bigint;
begin
  select count(*), max(mutation_statement_count)
  into queued_count, statement_count
  from cloud.published_catalog_projection_transactions_v4
  where transaction_id = pg_current_xact_id();
  select version into before_version
  from projection_clock_probe_v3 where stage = 'net-zero-before';
  select version into current_version
  from cloud.published_catalog_projection_state where singleton;
  if queued_count <> 1 or statement_count <> 2
     or current_version <> before_version then
    raise exception 'transaction mutations were not coalesced before finalization';
  end if;
end
$$;
commit;
select pg_temp.capture_projection_clock_v3('net-zero-after');
do $$
declare
  before_row projection_clock_probe_v3%rowtype;
  after_row projection_clock_probe_v3%rowtype;
begin
  select * into before_row from projection_clock_probe_v3 where stage = 'net-zero-before';
  select * into after_row from projection_clock_probe_v3 where stage = 'net-zero-after';
  if after_row.payload is distinct from before_row.payload
     or after_row.version <> before_row.version
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0 then
    raise exception 'net-zero committed transaction advanced projection clock';
  end if;
end
$$;

-- Multiple real public changes in one transaction produce exactly one clock
-- advancement after commit, never one event per SQL statement.
select pg_temp.capture_projection_clock_v3('coalesced-before');
begin;
update cloud.manufacturers
set description = 'Transaction-final manufacturer change'
where id = '60000000-0000-4000-8000-000000000010';
update cloud.categories
set description = 'Transaction-final category change'
where id = '60000000-0000-4000-8000-000000000020';
do $$
declare queued_count integer; statement_count integer;
begin
  select count(*), max(mutation_statement_count)
  into queued_count, statement_count
  from cloud.published_catalog_projection_transactions_v4
  where transaction_id = pg_current_xact_id();
  if queued_count <> 1 or statement_count <> 2 then
    raise exception 'multi-statement public transaction was not coalesced';
  end if;
end
$$;
commit;
select pg_temp.capture_projection_clock_v3('coalesced-after');
do $$
declare
  before_row projection_clock_probe_v3%rowtype;
  after_row projection_clock_probe_v3%rowtype;
begin
  select * into before_row from projection_clock_probe_v3 where stage = 'coalesced-before';
  select * into after_row from projection_clock_probe_v3 where stage = 'coalesced-after';
  if cloud.sha256_jsonb_v1(after_row.payload - 'generatedAt')
       = cloud.sha256_jsonb_v1(before_row.payload - 'generatedAt')
     or after_row.version <> before_row.version + 1
     or (after_row.payload ->> 'generatedAt')::timestamptz
       <= (before_row.payload ->> 'generatedAt')::timestamptz
     or not after_row.payload @? '$.manufacturers[*] ? (@.description == "Transaction-final manufacturer change")'
     or not after_row.payload @? '$.categories[*] ? (@.description == "Transaction-final category change")' then
    raise exception 'multi-statement public transaction did not advance exactly once';
  end if;
end
$$;

-- An exact committed retry performs the same tracked statements but leaves
-- public content and clock unchanged.
select pg_temp.capture_projection_clock_v3('retry-before');
begin;
update cloud.manufacturers
set description = 'Transaction-final manufacturer change'
where id = '60000000-0000-4000-8000-000000000010';
update cloud.categories
set description = 'Transaction-final category change'
where id = '60000000-0000-4000-8000-000000000020';
commit;
select pg_temp.capture_projection_clock_v3('retry-after');
do $$
declare
  before_row projection_clock_probe_v3%rowtype;
  after_row projection_clock_probe_v3%rowtype;
begin
  select * into before_row from projection_clock_probe_v3 where stage = 'retry-before';
  select * into after_row from projection_clock_probe_v3 where stage = 'retry-after';
  if after_row.payload is distinct from before_row.payload
     or after_row.version <> before_row.version then
    raise exception 'exact committed retry advanced projection clock';
  end if;
end
$$;

-- Hidden-only changes still use one transaction entry/final comparison but
-- do not invalidate the public projection.
select pg_temp.capture_projection_clock_v3('hidden-before');
begin;
update cloud.storage_objects
set source_url = 'https://example.invalid/private-document-v3-a.pdf'
where id = '60000000-0000-4000-8000-000000000032';
update cloud.storage_objects
set source_url = 'https://example.invalid/private-document-v3-b.pdf'
where id = '60000000-0000-4000-8000-000000000032';
commit;
select pg_temp.capture_projection_clock_v3('hidden-after');
do $$
declare
  before_row projection_clock_probe_v3%rowtype;
  after_row projection_clock_probe_v3%rowtype;
begin
  select * into before_row from projection_clock_probe_v3 where stage = 'hidden-before';
  select * into after_row from projection_clock_probe_v3 where stage = 'hidden-after';
  if after_row.payload is distinct from before_row.payload
     or after_row.version <> before_row.version then
    raise exception 'hidden-only committed transaction advanced projection clock';
  end if;
end
$$;

-- Late transaction rollback removes both the mutation and transaction queue;
-- the finalizer never leaves a clock event behind.
select pg_temp.capture_projection_clock_v3('rollback-before');
begin;
update cloud.storage_objects
set source_url = 'https://example.invalid/rolled-back-v3.pdf'
where id = '60000000-0000-4000-8000-000000000031';
rollback;
select pg_temp.capture_projection_clock_v3('rollback-after');
do $$
declare
  before_row projection_clock_probe_v3%rowtype;
  after_row projection_clock_probe_v3%rowtype;
begin
  select * into before_row from projection_clock_probe_v3 where stage = 'rollback-before';
  select * into after_row from projection_clock_probe_v3 where stage = 'rollback-after';
  if after_row.payload is distinct from before_row.payload
     or after_row.version <> before_row.version
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0 then
    raise exception 'rolled-back transaction retained projection state';
  end if;
end
$$;
