begin;

-- Extend the FS510 pilot with a separately verifiable registration-number Claim.
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
  elsif p_claim_type_code = 'product.registration_number' then
    if jsonb_typeof(p_value_payload) is distinct from 'object'
       or not (p_value_payload ? 'number')
       or nullif(btrim(p_value_payload ->> 'number'), '') is null
       or (select count(*) from jsonb_object_keys(p_value_payload)) <> 1 then
      raise exception 'invalid value payload for product.registration_number'
        using errcode = '23514';
    end if;
  else
    raise exception 'no pilot validator registered for Claim Type %', p_claim_type_code
      using errcode = '0A000';
  end if;
end
$$;

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
  values ('product.registration_number')
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
  'Registration number stated for a medical product',
  '{
    "type":"object",
    "required":["number"],
    "properties":{"number":{"type":"string","minLength":1}},
    "additionalProperties":false
  }'::jsonb,
  '{
    "type":"object",
    "required":["product_id"],
    "properties":{"product_id":{"type":"string","format":"uuid"}}
  }'::jsonb,
  pr.verification_policy_version_id,
  pr.publication_policy_version_id,
  '2026-07-03 00:00:00+03'::timestamptz,
  private.sha256_json(jsonb_build_object(
    'code', 'product.registration_number',
    'version', 1
  ))
from inserted_claim_type ict
cross join policy_refs pr
on conflict (claim_type_id, version_no) do nothing;

commit;
