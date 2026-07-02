-- Run after Migration 001 on a disposable Supabase database.
-- Fixtures are rolled back.
begin;

create temporary table fs510_ids (publication_id uuid) on commit drop;

do $$
declare
  v_org_id uuid;
  v_product_id uuid;
  v_document_id uuid;
  v_version_id uuid;
  v_evidence_id uuid;
  v_revision_id uuid;
  v_verification_id uuid;
  v_publication_id uuid;
  blocked boolean := false;
begin
  v_org_id := factory_api.create_organization('Alba Healthcare — smoke test', 'US');
  v_product_id := factory_api.create_product(v_org_id, 'FS510');
  v_document_id := factory_api.create_document(
    v_org_id, 'ifu', 'FS510 IFU — smoke test', 'FS510-IFU-SMOKE'
  );
  v_version_id := factory_api.add_document_version(
    v_document_id, 'smoke-v1', '2026-07-01 00:00:00+03',
    'https://example.invalid/fs510.pdf', 'smoke/fs510.pdf',
    encode(extensions.digest(convert_to('fs510-smoke', 'UTF8'), 'sha256'), 'hex'),
    'application/pdf', 1024, null
  );
  v_evidence_id := factory_api.add_evidence(
    v_version_id, 'page', 4, 4, 'Technical specifications',
    'Filtration efficiency >= 99.999%', '{}'::jsonb
  );
  v_revision_id := factory_api.create_claim_revision(
    v_product_id,
    'product.filtration_efficiency',
    '{"operator":">=","number":99.999,"unit":"%"}',
    jsonb_build_object('product_id', v_product_id::text),
    'FS510 filtration efficiency is at least 99.999 percent.',
    array[v_evidence_id]
  );
  v_verification_id := factory_api.verify_result_revision(
    v_revision_id, 'confirmed', '{}', 'Smoke test', now() + interval '1 year'
  );
  v_publication_id := factory_api.activate_publication(
    v_revision_id, v_verification_id, 'fs510-smoke-claim', 'Smoke test'
  );
  perform factory_api.upsert_product_page(
    v_product_id, 'ru-RU',
    '{"model":"FS510","claim":"filtration >= 99.999%"}',
    array[v_publication_id]
  );

  begin
    update source.evidence set quoted_text = 'forbidden'
     where source.evidence.evidence_id = v_evidence_id;
  exception when sqlstate '55000' then
    blocked := true;
  end;
  if not blocked then
    raise exception 'FAIL: immutable Evidence accepted UPDATE';
  end if;

  if not exists (
    select 1 from publication.current_state
     where publication.current_state.publication_id = v_publication_id
       and status_code = 'active'
  ) then
    raise exception 'FAIL: publication is not active';
  end if;

  insert into fs510_ids values (v_publication_id);
end
$$;

set local role anon;
select 1 / (exists (
  select 1 from public_api.product_pages
   where page_payload ->> 'model' = 'FS510'
))::integer as active_page_visible;
reset role;

select factory_api.suspend_publication(
  (select publication_id from fs510_ids), 'Smoke test'
);

set local role anon;
select 1 / (not exists (
  select 1 from public_api.product_pages
   where page_payload ->> 'model' = 'FS510'
))::integer as suspended_page_hidden;
reset role;

rollback;
