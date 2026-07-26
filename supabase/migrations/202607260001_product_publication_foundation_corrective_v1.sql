-- Product Publication Foundation Corrective Fix v1.
-- Hardens trusted identity, current revision binding and persistent dependencies.
-- Forward-only: performs no approval, publication or Product data backfill.

begin;

-- Service actions are attributed to the single service principal configured in
-- user_profiles. The caller cannot choose a human or service actor UUID.
create or replace function cloud.trusted_product_publication_service_actor_v1()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, cloud, auth
as $$
declare
  actor_id_value uuid;
  actor_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'product publication service action requires service role'
      using errcode = '42501';
  end if;

  select (array_agg(profile.id order by profile.id))[1], count(*)::integer
  into actor_id_value, actor_count
  from cloud.user_profiles profile
  where profile.role = 'service';

  if actor_count <> 1 or actor_id_value is null then
    raise exception 'exactly one Product publication service principal must be configured'
      using errcode = '42501';
  end if;
  return actor_id_value;
end
$$;

-- Canonical pointers supersede older immutable evidence without mutating it.
alter table cloud.products
  add column current_product_publication_revision_id uuid
    references cloud.product_publication_revisions(id) on delete restrict,
  add column current_product_publication_approval_id uuid
    references cloud.product_publication_approvals(id) on delete restrict;

create index products_current_product_publication_revision_idx
  on cloud.products (current_product_publication_revision_id)
  where current_product_publication_revision_id is not null;
create index products_current_product_publication_approval_idx
  on cloud.products (current_product_publication_approval_id)
  where current_product_publication_approval_id is not null;

alter table cloud.products
  add constraint products_current_publication_evidence_state check (
    (publication_status = 'draft'
      and current_product_publication_approval_id is null)
    -- The base v1 creator enters in_review immediately before inserting the
    -- immutable revision; the after-insert binding trigger clears old approval.
    or publication_status = 'in_review'
    or (publication_status in ('approved', 'published', 'archived')
      and current_product_publication_revision_id is not null
      and current_product_publication_approval_id is not null)
  ) not valid;

create or replace function cloud.enforce_product_publication_evidence_links_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, cloud
as $$
declare
  action text := current_setting('cybermedica.product_publication_action', true);
  revision cloud.product_publication_revisions%rowtype;
  approval cloud.product_publication_approvals%rowtype;
  active_batch cloud.product_publication_batches%rowtype;
begin
  if new.current_product_publication_revision_id is not null then
    select * into revision
    from cloud.product_publication_revisions
    where id = new.current_product_publication_revision_id;
    if not found or revision.product_id <> new.id then
      raise exception 'current Product publication revision belongs to another Product'
        using errcode = '23514';
    end if;
  end if;

  if new.current_product_publication_approval_id is not null then
    select * into approval
    from cloud.product_publication_approvals
    where id = new.current_product_publication_approval_id;
    if not found
       or approval.candidate_revision_id is distinct from new.current_product_publication_revision_id
       or revision.review_item_id is distinct from approval.review_item_id then
      raise exception 'current Product publication approval is not bound to the current revision'
        using errcode = '23514';
    end if;
  end if;

  if new.publication_status = 'published' then
    if new.active_product_publication_batch_id is null
       or new.current_product_publication_revision_id is null
       or new.current_product_publication_approval_id is null then
      raise exception 'published Product requires current revision, approval and active batch'
        using errcode = '23514';
    end if;
    select * into active_batch
    from cloud.product_publication_batches
    where id = new.active_product_publication_batch_id;
    if not found
       or active_batch.action <> 'publish'
       or active_batch.product_id <> new.id
       or active_batch.candidate_revision_id is distinct from new.current_product_publication_revision_id
       or active_batch.approval_id is distinct from new.current_product_publication_approval_id then
      raise exception 'active Product publication batch is not coherent with current evidence'
        using errcode = '23514';
    end if;
  end if;

  if TG_OP = 'UPDATE'
     and row(
       new.current_product_publication_revision_id,
       new.current_product_publication_approval_id
     ) is distinct from row(
       old.current_product_publication_revision_id,
       old.current_product_publication_approval_id
     )
     and action not in ('review', 'approve') then
    raise exception 'current Product publication evidence can change only in review workflow'
      using errcode = '55000';
  end if;
  return new;
end
$$;

create trigger products_publication_evidence_links_guard
  before insert or update on cloud.products
  for each row execute function cloud.enforce_product_publication_evidence_links_v1();

create or replace function cloud.bind_current_product_publication_revision_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, cloud
as $$
begin
  perform set_config('cybermedica.product_publication_action', 'review', true);
  update cloud.products
  set current_product_publication_revision_id = new.id,
      current_product_publication_approval_id = null
  where id = new.product_id;
  perform set_config('cybermedica.product_publication_action', '', true);

  update cloud.review_items
  set status = 'in_review', reviewed_at = null, updated_at = now()
  where id = new.review_item_id;
  return new;
end
$$;

create trigger product_publication_revision_becomes_current
  after insert on cloud.product_publication_revisions
  for each row execute function cloud.bind_current_product_publication_revision_v1();

-- Every publish batch must bind one Product, its current revision and the exact
-- approval that belongs to that revision. Archive/rollback retain append-only history.
create or replace function cloud.enforce_product_publication_batch_links_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, cloud
as $$
declare
  revision cloud.product_publication_revisions%rowtype;
  approval cloud.product_publication_approvals%rowtype;
begin
  if new.action = 'publish' then
    select * into revision from cloud.product_publication_revisions
    where id = new.candidate_revision_id;
    select * into approval from cloud.product_publication_approvals
    where id = new.approval_id;
    if revision.id is null
       or approval.id is null
       or revision.product_id <> new.product_id
       or approval.candidate_revision_id <> revision.id
       or approval.review_item_id <> revision.review_item_id
       or approval.payload_checksum <> revision.payload_checksum
       or approval.product_identity_checksum <> revision.product_identity_checksum then
      raise exception 'publication batch Product, revision and approval are not coherent'
        using errcode = '23514';
    end if;
    if not exists (
      select 1 from cloud.products product
      where product.id = new.product_id
        and product.current_product_publication_revision_id = revision.id
        and product.current_product_publication_approval_id = approval.id
    ) then
      raise exception 'only the current approved Product revision can be published'
        using errcode = '55000';
    end if;
  end if;
  return new;
end
$$;

create trigger product_publication_batch_links_guard
  before insert on cloud.product_publication_batches
  for each row execute function cloud.enforce_product_publication_batch_links_v1();

-- Dependency reads acquire deterministic row locks. They serialize with any
-- attempt to unpublish or archive a mandatory reference.
create or replace function cloud.assert_product_publication_dependencies_v1(p_product_id uuid)
returns void
language plpgsql
volatile
set search_path = pg_catalog, cloud
as $$
declare
  product cloud.products%rowtype;
begin
  select * into product from cloud.products where id = p_product_id;
  if not found then
    raise exception 'product does not exist' using errcode = 'P0002';
  end if;
  if product.catalog_quality_status <> 'READY'
     or product.manufacturer_id is null
     or product.category_id is null
     or nullif(btrim(product.model), '') is null then
    raise exception 'product is not READY for publication' using errcode = '23514';
  end if;

  perform 1 from cloud.manufacturers manufacturer
  where manufacturer.id = product.manufacturer_id
  for share;
  if not found or not exists (
    select 1 from cloud.manufacturers manufacturer
    where manufacturer.id = product.manufacturer_id
      and manufacturer.publication_status = 'published'
      and manufacturer.archived_at is null
  ) then
    raise exception 'product manufacturer is not published' using errcode = '23514';
  end if;

  perform 1 from cloud.categories category
  where category.id = product.category_id
  for share;
  if not found or not exists (
    select 1 from cloud.categories category
    where category.id = product.category_id
      and category.publication_status = 'published'
      and category.assignable
      and category.archived_at is null
  ) then
    raise exception 'product category is not a published assignable category'
      using errcode = '23514';
  end if;

  perform 1
  from cloud.product_application_areas product_area
  join cloud.application_areas area on area.id = product_area.application_area_id
  where product_area.product_id = product.id
  order by area.id
  for share of product_area, area;
  if not found or exists (
    select 1
    from cloud.product_application_areas product_area
    join cloud.application_areas area on area.id = product_area.application_area_id
    where product_area.product_id = product.id
      and (area.publication_status <> 'published' or area.archived_at is not null)
  ) then
    raise exception 'product application areas are missing or unpublished'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from cloud.import_products import_product
    join cloud.import_blocking_errors error
      on error.import_product_id = import_product.id
    where import_product.existing_product_id = product.id
      and error.resolved_at is null
  ) then
    raise exception 'product has unresolved critical import errors' using errcode = '23514';
  end if;
end
$$;

create or replace function cloud.guard_published_product_reference_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, cloud
as $$
begin
  if TG_TABLE_NAME = 'manufacturers'
     and old.publication_status = 'published'
     and old.archived_at is null
     and (new.publication_status <> 'published' or new.archived_at is not null)
     and exists (
       select 1 from cloud.products product
       where product.manufacturer_id = old.id
         and product.publication_status = 'published'
     ) then
    raise exception 'published Product depends on manufacturer; archive Product first'
      using errcode = '23503';
  elsif TG_TABLE_NAME = 'categories'
     and old.publication_status = 'published'
     and old.archived_at is null
     and coalesce((to_jsonb(old) ->> 'assignable')::boolean, false)
     and (new.publication_status <> 'published'
       or new.archived_at is not null
       or not coalesce((to_jsonb(new) ->> 'assignable')::boolean, false))
     and exists (
       select 1 from cloud.products product
       where product.category_id = old.id
         and product.publication_status = 'published'
     ) then
    raise exception 'published Product depends on category; archive Product first'
      using errcode = '23503';
  elsif TG_TABLE_NAME = 'application_areas'
     and old.publication_status = 'published'
     and old.archived_at is null
     and (new.publication_status <> 'published' or new.archived_at is not null)
     and exists (
       select 1
       from cloud.product_application_areas product_area
       join cloud.products product on product.id = product_area.product_id
       where product_area.application_area_id = old.id
         and product.publication_status = 'published'
     ) then
    raise exception 'published Product depends on application area; archive Product first'
      using errcode = '23503';
  end if;
  return new;
end
$$;

create trigger manufacturers_published_product_dependency_guard
  before update of publication_status, archived_at on cloud.manufacturers
  for each row execute function cloud.guard_published_product_reference_v1();
create trigger categories_published_product_dependency_guard
  before update of publication_status, archived_at, assignable on cloud.categories
  for each row execute function cloud.guard_published_product_reference_v1();
create trigger application_areas_published_product_dependency_guard
  before update of publication_status, archived_at on cloud.application_areas
  for each row execute function cloud.guard_published_product_reference_v1();

create or replace function cloud.guard_published_product_application_area_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, cloud
as $$
begin
  if (TG_OP in ('UPDATE', 'DELETE') and exists (
      select 1 from cloud.products where id = old.product_id
        and publication_status = 'published'
    )) or (TG_OP in ('INSERT', 'UPDATE') and exists (
      select 1 from cloud.products where id = new.product_id
        and publication_status = 'published'
    )) then
    raise exception 'published Product application areas are immutable; archive Product first'
      using errcode = '55000';
  end if;
  return case when TG_OP = 'DELETE' then old else new end;
end
$$;

create trigger product_application_areas_published_product_guard
  before insert or update or delete on cloud.product_application_areas
  for each row execute function cloud.guard_published_product_application_area_v1();

-- The reviewer decision is created in authenticated context. Reviewer identity,
-- payload and checksums are resolved inside the database and become immutable.
create or replace function cloud.record_product_publication_review_decision_v1(
  p_candidate_revision_id uuid,
  p_rationale text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  reviewer_id_value uuid := auth.uid();
  revision cloud.product_publication_revisions%rowtype;
  product cloud.products%rowtype;
  existing_decision cloud.review_decisions%rowtype;
  decision_id_value uuid;
begin
  if auth.role() <> 'authenticated' or reviewer_id_value is null then
    raise exception 'Product publication review decision requires authenticated reviewer'
      using errcode = '42501';
  end if;
  if nullif(btrim(p_rationale), '') is null then
    raise exception 'review rationale is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from cloud.user_profiles profile
    where profile.id = reviewer_id_value and profile.role in ('reviewer', 'admin')
  ) then
    raise exception 'Product publication review requires reviewer or admin role'
      using errcode = '42501';
  end if;

  select * into revision from cloud.product_publication_revisions
  where id = p_candidate_revision_id;
  if not found then
    raise exception 'product publication revision does not exist' using errcode = 'P0002';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(revision.product_id::text, 2));
  select * into product from cloud.products where id = revision.product_id for update;
  if product.publication_status <> 'in_review'
     or product.current_product_publication_revision_id is distinct from revision.id then
    raise exception 'review decision requires the current in-review Product revision'
      using errcode = '55000';
  end if;

  select * into existing_decision
  from cloud.review_decisions decision
  where decision.product_publication_revision_id = revision.id
    and decision.reviewer_id = reviewer_id_value
    and decision.decision_type = 'product_publication'
    and decision.decision = 'approve';
  if found then
    if existing_decision.rationale <> btrim(p_rationale)
       or existing_decision.approved_payload_checksum <> revision.payload_checksum
       or existing_decision.product_identity_checksum <> revision.product_identity_checksum then
      raise exception 'reviewer already recorded a different decision for this revision'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'reviewDecisionId', existing_decision.id,
      'candidateRevisionId', revision.id,
      'productId', revision.product_id,
      'reviewerId', reviewer_id_value,
      'payloadChecksum', revision.payload_checksum,
      'idempotent', true
    );
  end if;

  insert into cloud.review_decisions (
    review_item_id, decision_type, field_path, proposed_value, approved_value,
    decision, reviewer_id, rationale, product_publication_revision_id,
    approved_payload_checksum, product_identity_checksum
  ) values (
    revision.review_item_id, 'product_publication', 'product',
    revision.candidate_payload, revision.candidate_payload, 'approve',
    reviewer_id_value, btrim(p_rationale), revision.id,
    revision.payload_checksum, revision.product_identity_checksum
  ) returning id into decision_id_value;

  return jsonb_build_object(
    'reviewDecisionId', decision_id_value,
    'candidateRevisionId', revision.id,
    'productId', revision.product_id,
    'reviewerId', reviewer_id_value,
    'payloadChecksum', revision.payload_checksum,
    'idempotent', false
  );
end
$$;

create unique index review_decisions_product_publication_reviewer_uq
  on cloud.review_decisions (product_publication_revision_id, reviewer_id)
  where decision_type = 'product_publication' and decision = 'approve';

-- Approval consumes an existing immutable decision. It never accepts reviewer
-- identity or rationale from the service caller.
create or replace function cloud.approve_product_publication_decision_v1(
  p_candidate_revision_id uuid,
  p_review_decision_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, cloud, auth, extensions
as $$
declare
  revision cloud.product_publication_revisions%rowtype;
  product cloud.products%rowtype;
  decision cloud.review_decisions%rowtype;
  existing_approval cloud.product_publication_approvals%rowtype;
  current_identity jsonb;
  current_payload jsonb;
  approval_id_value uuid;
  previous_state_value jsonb;
  result_state_value jsonb;
begin
  perform cloud.trusted_product_publication_service_actor_v1();
  select * into revision from cloud.product_publication_revisions
  where id = p_candidate_revision_id;
  if not found then
    raise exception 'product publication revision does not exist' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(revision.product_id::text, 2));
  select * into product from cloud.products where id = revision.product_id for update;

  -- The lookup occurs after both advisory and Product row locks. An exact
  -- concurrent retry therefore returns the committed approval.
  select * into existing_approval
  from cloud.product_publication_approvals
  where candidate_revision_id = revision.id;
  if found then
    if existing_approval.review_decision_id <> p_review_decision_id then
      raise exception 'Product revision was approved by a different immutable decision'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'approvalId', existing_approval.id,
      'candidateRevisionId', revision.id,
      'productId', revision.product_id,
      'state', 'approved',
      'payloadChecksum', existing_approval.payload_checksum,
      'idempotent', true
    );
  end if;

  if product.publication_status <> 'in_review'
     or product.current_product_publication_revision_id is distinct from revision.id then
    raise exception 'only the current in-review Product revision can be approved'
      using errcode = '55000';
  end if;

  select * into decision from cloud.review_decisions
  where id = p_review_decision_id;
  if not found
     or decision.product_publication_revision_id is distinct from revision.id
     or decision.review_item_id <> revision.review_item_id
     or decision.decision_type <> 'product_publication'
     or decision.field_path <> 'product'
     or decision.decision <> 'approve'
     or decision.proposed_value is distinct from revision.candidate_payload
     or decision.approved_value is distinct from revision.candidate_payload
     or decision.approved_payload_checksum is distinct from revision.payload_checksum
     or decision.product_identity_checksum is distinct from revision.product_identity_checksum
     or not exists (
       select 1 from cloud.user_profiles profile
       where profile.id = decision.reviewer_id and profile.role in ('reviewer', 'admin')
     ) then
    raise exception 'Product publication approval requires an exact authenticated review decision'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from cloud.review_items review_item
    where review_item.id = revision.review_item_id
      and review_item.status not in ('blocked', 'rejected', 'archived')
  ) then
    raise exception 'product review item is not approvable' using errcode = '23514';
  end if;

  perform cloud.assert_product_publication_dependencies_v1(product.id);
  current_identity := cloud.product_publication_identity_snapshot_v1(product.id);
  current_payload := cloud.product_publication_candidate_payload_v1(product.id);
  if current_identity is distinct from revision.product_identity
     or current_payload is distinct from revision.candidate_payload
     or cloud.product_publication_payload_checksum_v1(
       revision.schema_version, current_identity, current_payload
     ) <> revision.payload_checksum then
    raise exception 'product changed after publication revision creation'
      using errcode = '55000';
  end if;

  insert into cloud.product_publication_approvals (
    candidate_revision_id, review_item_id, review_decision_id,
    payload_checksum, product_identity_checksum, decision, reviewer_id,
    rationale, approved_at
  ) values (
    revision.id, revision.review_item_id, decision.id,
    revision.payload_checksum, revision.product_identity_checksum, 'approve',
    decision.reviewer_id, decision.rationale, decision.created_at
  ) returning id into approval_id_value;

  previous_state_value := cloud.product_publication_state_snapshot_v1(product.id);
  perform set_config('cybermedica.product_publication_action', 'approve', true);
  update cloud.products
  set publication_status = 'approved', review_state = 'approved',
      current_product_publication_approval_id = approval_id_value,
      updated_at = clock_timestamp()
  where id = product.id;
  perform set_config('cybermedica.product_publication_action', '', true);
  update cloud.review_items
  set status = 'approved', reviewed_at = decision.created_at, updated_at = clock_timestamp()
  where id = revision.review_item_id;
  result_state_value := cloud.product_publication_state_snapshot_v1(product.id);

  insert into cloud.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, source
  ) values (
    decision.reviewer_id, 'approve', 'product_publication_revision', revision.id,
    previous_state_value, jsonb_build_object(
      'state', result_state_value,
      'approvalId', approval_id_value,
      'reviewDecisionId', decision.id,
      'payloadChecksum', revision.payload_checksum
    ), 'cloud_api.approve_product_publication_revision_v1'
  );

  return jsonb_build_object(
    'approvalId', approval_id_value,
    'candidateRevisionId', revision.id,
    'productId', revision.product_id,
    'state', 'approved',
    'payloadChecksum', revision.payload_checksum,
    'idempotent', false
  );
end
$$;

-- Remove all caller-asserted actor/reviewer signatures from the exposed schema.
drop function cloud_api.create_product_publication_revision_v1(uuid, text, uuid);
drop function cloud_api.approve_product_publication_revision_v1(uuid, uuid, text);
drop function cloud_api.publish_product_v1(uuid, text, uuid);
drop function cloud_api.archive_product_v1(uuid, text, uuid);
drop function cloud_api.rollback_product_publication_v1(uuid, text, uuid);

create or replace function cloud_api.create_product_publication_revision_v1(
  p_product_id uuid,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.create_product_publication_revision_v1(
    p_product_id, p_idempotency_key,
    cloud.trusted_product_publication_service_actor_v1()
  )
$$;

create or replace function cloud_api.record_product_publication_review_decision_v1(
  p_candidate_revision_id uuid,
  p_rationale text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.record_product_publication_review_decision_v1(
    p_candidate_revision_id, p_rationale
  )
$$;

create or replace function cloud_api.approve_product_publication_revision_v1(
  p_candidate_revision_id uuid,
  p_review_decision_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.approve_product_publication_decision_v1(
    p_candidate_revision_id, p_review_decision_id
  )
$$;

create or replace function cloud_api.publish_product_v1(
  p_candidate_revision_id uuid,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.publish_product_v1(
    p_candidate_revision_id, p_idempotency_key,
    cloud.trusted_product_publication_service_actor_v1()
  )
$$;

create or replace function cloud_api.archive_product_v1(
  p_product_id uuid,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.archive_product_v1(
    p_product_id, p_idempotency_key,
    cloud.trusted_product_publication_service_actor_v1()
  )
$$;

create or replace function cloud_api.rollback_product_publication_v1(
  p_publication_batch_id uuid,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, cloud
as $$
  select cloud.rollback_product_publication_v1(
    p_publication_batch_id, p_idempotency_key,
    cloud.trusted_product_publication_service_actor_v1()
  )
$$;

revoke all on function cloud.trusted_product_publication_service_actor_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.bind_current_product_publication_revision_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.enforce_product_publication_batch_links_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.enforce_product_publication_evidence_links_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.guard_published_product_reference_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.guard_published_product_application_area_v1()
  from public, anon, authenticated, service_role;
revoke all on function cloud.record_product_publication_review_decision_v1(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function cloud.approve_product_publication_decision_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

revoke all on function cloud_api.create_product_publication_revision_v1(uuid, text)
  from public, anon, authenticated;
revoke all on function cloud_api.record_product_publication_review_decision_v1(uuid, text)
  from public, anon, service_role;
revoke all on function cloud_api.approve_product_publication_revision_v1(uuid, uuid)
  from public, anon, authenticated;
revoke all on function cloud_api.publish_product_v1(uuid, text)
  from public, anon, authenticated;
revoke all on function cloud_api.archive_product_v1(uuid, text)
  from public, anon, authenticated;
revoke all on function cloud_api.rollback_product_publication_v1(uuid, text)
  from public, anon, authenticated;

grant execute on function cloud_api.record_product_publication_review_decision_v1(uuid, text)
  to authenticated;
grant execute on function cloud_api.create_product_publication_revision_v1(uuid, text),
  cloud_api.approve_product_publication_revision_v1(uuid, uuid),
  cloud_api.publish_product_v1(uuid, text),
  cloud_api.archive_product_v1(uuid, text),
  cloud_api.rollback_product_publication_v1(uuid, text)
  to service_role;

comment on function cloud_api.record_product_publication_review_decision_v1(uuid, text) is
  'Authenticated reviewer decision bound to auth.uid() and the current immutable Product revision.';
comment on function cloud_api.approve_product_publication_revision_v1(uuid, uuid) is
  'Service-only consumption of an existing authenticated immutable review decision.';
comment on function cloud_api.publish_product_v1(uuid, text) is
  'Service-only Product publication of the canonical current approved revision.';

commit;
