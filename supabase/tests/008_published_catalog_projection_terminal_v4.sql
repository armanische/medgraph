\set ON_ERROR_STOP on

select set_config('request.jwt.claim.role', 'service_role', false);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  false
);

create temporary table projection_terminal_probe_v4 (
  stage text primary key,
  payload jsonb not null,
  version bigint not null,
  changed_at timestamptz not null,
  checksum text not null
) on commit preserve rows;

create temporary table projection_transaction_ids_v4 (
  stage text primary key,
  transaction_id xid8 not null
) on commit preserve rows;

create function pg_temp.capture_projection_terminal_v4(stage_name text)
returns void
language plpgsql
as $$
begin
  insert into projection_terminal_probe_v4 (
    stage, payload, version, changed_at, checksum
  )
  select
    stage_name,
    cloud_api.cloud_published_storefront_catalog_v1(),
    state.version,
    state.changed_at,
    state.payload_checksum
  from cloud.published_catalog_projection_state state
  where state.singleton;
end
$$;

-- Exact Re-Review v4 path: two approved service-only writers, forced early
-- deferred-trigger evaluation, caller-controlled GUC reset, and a successful
-- commit. The closed xid8 evidence permits only one clock slot.
select pg_temp.capture_projection_terminal_v4('guc-exploit-before');
begin;
select pg_current_xact_id()::text as guc_exploit_xid \gset
select cloud_api.archive_product_v1(
  '60000000-0000-4000-8000-000000000050',
  'projection-v4-guc-exploit-first'
);
set constraints all immediate;
insert into projection_terminal_probe_v4 (
  stage, payload, version, changed_at, checksum
)
select
  'guc-exploit-early',
  cloud_api.cloud_published_storefront_catalog_v1(),
  state.version,
  state.changed_at,
  state.payload_checksum
from cloud.published_catalog_projection_state state
where state.singleton;
set constraints all deferred;
set local cybermedica.published_projection_finalized_v3 = '1';
reset cybermedica.published_projection_finalized_v3;
set local cybermedica.published_projection_finalized_v3 = '';
select cloud_api.archive_product_v1(
  '60000000-0000-4000-8000-000000000055',
  'projection-v4-guc-exploit-second'
);
commit;
insert into projection_transaction_ids_v4 values (
  'guc-exploit', :'guc_exploit_xid'::xid8
);
select pg_temp.capture_projection_terminal_v4('guc-exploit-after');

do $$
declare
  before_row projection_terminal_probe_v4%rowtype;
  early_row projection_terminal_probe_v4%rowtype;
  after_row projection_terminal_probe_v4%rowtype;
  evidence cloud.published_catalog_projection_transactions_v4%rowtype;
begin
  select * into before_row from projection_terminal_probe_v4
  where stage = 'guc-exploit-before';
  select * into early_row from projection_terminal_probe_v4
  where stage = 'guc-exploit-early';
  select * into after_row from projection_terminal_probe_v4
  where stage = 'guc-exploit-after';
  select * into evidence
  from cloud.published_catalog_projection_transactions_v4
  where transaction_id = (
    select transaction_id from projection_transaction_ids_v4
    where stage = 'guc-exploit'
  );

  if jsonb_array_length(after_row.payload -> 'products') <> 0
     or after_row.version <> before_row.version + 1
     or early_row.version <> before_row.version + 1
     or after_row.changed_at is distinct from early_row.changed_at
     or after_row.checksum is distinct from cloud.sha256_jsonb_v1(
       after_row.payload - 'generatedAt'
     )
     or evidence.transaction_id is null
     or not evidence.terminal_finalized
     or not evidence.clock_slot_reserved
     or evidence.final_version <> before_row.version + 1
     or evidence.final_payload_checksum is distinct from after_row.checksum
     or evidence.reconciled_generation <> evidence.mutation_generation
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0 then
    raise exception 'caller-resettable GUC exploit advanced or finalized clock incorrectly';
  end if;
end
$$;

-- Restore both Products through approved rollback writers. The restore itself
-- is another multi-writer transaction and therefore receives one clock slot.
begin;
select cloud_api.rollback_product_publication_v1(
  (select id from cloud.product_publication_batches
   where idempotency_key = 'projection-v4-guc-exploit-first'
     and product_id = '60000000-0000-4000-8000-000000000050'),
  'projection-v4-guc-exploit-first-restore'
);
select cloud_api.rollback_product_publication_v1(
  (select id from cloud.product_publication_batches
   where idempotency_key = 'projection-v4-guc-exploit-second'
     and product_id = '60000000-0000-4000-8000-000000000055'),
  'projection-v4-guc-exploit-second-restore'
);
commit;

do $$
declare payload jsonb;
begin
  select cloud_api.cloud_published_storefront_catalog_v1() into payload;
  if jsonb_array_length(payload -> 'products') <> 2 then
    raise exception 'approved rollback writers did not restore exploit fixture';
  end if;
end
$$;

-- Early finalization followed by restoration to the transaction-entry payload
-- must commit as an exact net-zero transaction.
select pg_temp.capture_projection_terminal_v4('early-net-zero-before');
create temporary table projection_v4_original_storage (
  source_url text not null
) on commit preserve rows;
insert into projection_v4_original_storage
select source_url from cloud.storage_objects
where id = '60000000-0000-4000-8000-000000000031';
begin;
update cloud.storage_objects
set source_url = 'https://example.invalid/v4-early-net-zero.pdf'
where id = '60000000-0000-4000-8000-000000000031';
set constraints all immediate;
set constraints all deferred;
update cloud.storage_objects
set source_url = (select source_url from projection_v4_original_storage)
where id = '60000000-0000-4000-8000-000000000031';
commit;
select pg_temp.capture_projection_terminal_v4('early-net-zero-after');

do $$
declare
  before_row projection_terminal_probe_v4%rowtype;
  after_row projection_terminal_probe_v4%rowtype;
begin
  select * into before_row from projection_terminal_probe_v4
  where stage = 'early-net-zero-before';
  select * into after_row from projection_terminal_probe_v4
  where stage = 'early-net-zero-after';
  if after_row.payload is distinct from before_row.payload
     or after_row.version <> before_row.version
     or after_row.changed_at is distinct from before_row.changed_at
     or after_row.checksum is distinct from before_row.checksum then
    raise exception 'net-zero transaction after early finalization changed public clock';
  end if;
end
$$;

-- Three tracked public statements generate three deferred events. The first
-- finalizer reconciles the newest generation; repeated queued finalizers are
-- no-ops and cannot create a second clock version.
select pg_temp.capture_projection_terminal_v4('three-writers-before');
begin;
select pg_current_xact_id()::text as three_writers_xid \gset
update cloud.manufacturers
set description = 'V4 three-writer manufacturer'
where id = '60000000-0000-4000-8000-000000000010';
update cloud.categories
set description = 'V4 three-writer category'
where id = '60000000-0000-4000-8000-000000000020';
update cloud.application_areas
set description = 'V4 three-writer area'
where id = '60000000-0000-4000-8000-000000000030';
commit;
insert into projection_transaction_ids_v4 values (
  'three-writers', :'three_writers_xid'::xid8
);
select pg_temp.capture_projection_terminal_v4('three-writers-after');

do $$
declare
  before_row projection_terminal_probe_v4%rowtype;
  after_row projection_terminal_probe_v4%rowtype;
  evidence cloud.published_catalog_projection_transactions_v4%rowtype;
begin
  select * into before_row from projection_terminal_probe_v4
  where stage = 'three-writers-before';
  select * into after_row from projection_terminal_probe_v4
  where stage = 'three-writers-after';
  select * into evidence
  from cloud.published_catalog_projection_transactions_v4
  where transaction_id = (
    select transaction_id from projection_transaction_ids_v4
    where stage = 'three-writers'
  );
  if after_row.version <> before_row.version + 1
     or evidence.mutation_statement_count <> 3
     or evidence.mutation_generation <> 3
     or evidence.reconciled_generation <> 3
     or evidence.final_version <> before_row.version + 1
     or evidence.final_payload_checksum is distinct from after_row.checksum
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0 then
    raise exception 'repeated finalizer events did not coalesce three writers';
  end if;
end
$$;

-- Savepoint rollback removes its data, event, and generation changes. Only A
-- and C survive into the transaction-final payload.
select pg_temp.capture_projection_terminal_v4('savepoint-before');
create temporary table projection_v4_category_before (
  description text
) on commit preserve rows;
insert into projection_v4_category_before
select description from cloud.categories
where id = '60000000-0000-4000-8000-000000000020';
begin;
update cloud.manufacturers
set description = 'V4 savepoint writer A'
where id = '60000000-0000-4000-8000-000000000010';
savepoint projection_v4_savepoint;
update cloud.categories
set description = 'V4 savepoint writer B rolled back'
where id = '60000000-0000-4000-8000-000000000020';
set constraints all immediate;
rollback to savepoint projection_v4_savepoint;
set constraints all deferred;
update cloud.application_areas
set description = 'V4 savepoint writer C'
where id = '60000000-0000-4000-8000-000000000030';
commit;
select pg_temp.capture_projection_terminal_v4('savepoint-after');

do $$
declare
  before_row projection_terminal_probe_v4%rowtype;
  after_row projection_terminal_probe_v4%rowtype;
  category_description text;
begin
  select * into before_row from projection_terminal_probe_v4
  where stage = 'savepoint-before';
  select * into after_row from projection_terminal_probe_v4
  where stage = 'savepoint-after';
  select description into category_description from cloud.categories
  where id = '60000000-0000-4000-8000-000000000020';
  if after_row.version <> before_row.version + 1
     or after_row.checksum is distinct from cloud.sha256_jsonb_v1(
       after_row.payload - 'generatedAt'
     )
     or category_description is distinct from (
       select description from projection_v4_category_before
     )
     or not after_row.payload @? '$.manufacturers[*] ? (@.description == "V4 savepoint writer A")'
     or not after_row.payload @? '$.applicationAreas[*] ? (@.description == "V4 savepoint writer C")' then
    raise exception 'savepoint rollback was not reflected in final projection state';
  end if;
end
$$;

-- A full rollback after forced early finalization removes the uncommitted
-- closed state row and restores both public payload and clock.
select pg_temp.capture_projection_terminal_v4('full-rollback-before');
begin;
select pg_current_xact_id()::text as rollback_xid \gset
update cloud.storage_objects
set source_url = 'https://example.invalid/v4-full-rollback.pdf'
where id = '60000000-0000-4000-8000-000000000031';
set constraints all immediate;
rollback;
insert into projection_transaction_ids_v4 values (
  'full-rollback', :'rollback_xid'::xid8
);
select pg_temp.capture_projection_terminal_v4('full-rollback-after');

do $$
declare
  before_row projection_terminal_probe_v4%rowtype;
  after_row projection_terminal_probe_v4%rowtype;
begin
  select * into before_row from projection_terminal_probe_v4
  where stage = 'full-rollback-before';
  select * into after_row from projection_terminal_probe_v4
  where stage = 'full-rollback-after';
  if after_row.payload is distinct from before_row.payload
     or after_row.version <> before_row.version
     or after_row.changed_at is distinct from before_row.changed_at
     or after_row.checksum is distinct from before_row.checksum
     or exists (
       select 1 from cloud.published_catalog_projection_transactions_v4
       where transaction_id = (
         select transaction_id from projection_transaction_ids_v4
         where stage = 'full-rollback'
       )
     )
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0 then
    raise exception 'full rollback retained transaction state or changed projection clock';
  end if;
end
$$;

-- Once v4 evidence exists and public payload has advanced, re-initialization
-- is a mismatch and must not rewrite the immutable baseline.
do $$
declare
  evidence_before cloud.published_catalog_projection_initialization_v4%rowtype;
  evidence_after cloud.published_catalog_projection_initialization_v4%rowtype;
  current_checksum text;
begin
  select * into evidence_before
  from cloud.published_catalog_projection_initialization_v4 where singleton;
  select payload_checksum into current_checksum
  from cloud.published_catalog_projection_state where singleton;
  begin
    perform cloud.initialize_published_catalog_projection_v4(current_checksum);
    raise exception 'changed baseline initialization retry unexpectedly succeeded';
  exception
    when sqlstate '55000' then null;
  end;
  select * into evidence_after
  from cloud.published_catalog_projection_initialization_v4 where singleton;
  if evidence_after is distinct from evidence_before then
    raise exception 'mismatch initialization retry mutated immutable evidence';
  end if;
end
$$;

-- Corrupt missing evidence cannot be silently recreated after initialized=true.
begin;
alter table cloud.published_catalog_projection_initialization_v4
  disable trigger published_projection_initialization_immutable_v4;
delete from cloud.published_catalog_projection_initialization_v4 where singleton;
do $$
declare current_checksum text;
begin
  select payload_checksum into current_checksum
  from cloud.published_catalog_projection_state where singleton;
  begin
    perform cloud.initialize_published_catalog_projection_v4(current_checksum);
    raise exception 'missing initialization evidence was silently recreated';
  exception
    when sqlstate '55000' then null;
  end;
end
$$;
rollback;

do $$
begin
  if (select count(*) from cloud.published_catalog_projection_initialization_v4) <> 1
     or (select count(*) from cloud.published_catalog_projection_events_v4) <> 0
     or exists (
       select 1
       from cloud.published_catalog_projection_transactions_v4 transaction_state
       where transaction_state.reconciled_generation
         <> transaction_state.mutation_generation
     ) then
    raise exception 'v4 terminal or initialization evidence audit failed';
  end if;
end
$$;
