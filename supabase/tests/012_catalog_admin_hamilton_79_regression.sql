begin;

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config(
  'request.jwt.claims',
  '{"role":"service_role","app_metadata":{"app_role":"service"}}',
  true
);

insert into cloud.user_profiles (id, role, display_name)
values ('a3000000-0000-4000-8000-000000000001', 'service', 'Hamilton regression service');

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, description,
  confidence, publication_status
) values (
  'a3000000-0000-4000-8000-000000000010',
  'manufacturer-hamilton-regression', 'hamilton-regression',
  'Hamilton Medical', 'Hamilton Medical', 'Disposable regression reference.',
  'verified', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description,
  level, assignable, confidence, publication_status
) values (
  'a3000000-0000-4000-8000-000000000020',
  'category-hamilton-ventilator-regression', 'hamilton-ventilator-regression',
  'Аппарат искусственной вентиляции лёгких',
  'Аппарат искусственной вентиляции лёгких',
  'Disposable regression reference.', 'leaf', true, 'verified', 'published'
);

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description,
  confidence, publication_status
) values (
  'a3000000-0000-4000-8000-000000000030',
  'application-area-hamilton-regression', 'hamilton-regression',
  'Реанимация', 'Реанимация', 'Disposable regression reference.',
  'verified', 'published'
);

select cloud_api.apply_product_import_v1(
  pg_read_file('/tmp/catalog-admin-approved-79-payload.json')::jsonb,
  'product-import-v1-staging'
);

do $$
declare
  hamilton cloud.products%rowtype;
begin
  if (select count(*) from cloud.products) <> 79
     or (select count(*) from cloud.product_descriptions) <> 79
     or (select count(*) from cloud.products where publication_status = 'published') <> 0 then
    raise exception 'approved immutable batch did not produce the expected unpublished 79-product baseline';
  end if;

  select * into hamilton from cloud.products where source_uid = '330695211247';
  if not found
     or hamilton.source_checksum <> '92d2302078a65870a3ef1de35e510e3e206f5093c826b8cd9d19a6f3331e9ebb'
     or hamilton.short_description not ilike '%более 9 часов%'
     or hamilton.full_description not ilike '%более 9 часов%' then
    raise exception 'Hamilton immutable import baseline does not contain the expected historical claim and checksum';
  end if;
  if (select count(*) from cloud.product_descriptions
      where product_id = hamilton.id and locale = 'ru'
        and (short_description ilike '%более 9 часов%'
          or full_description ilike '%более 9 часов%')) <> 1 then
    raise exception 'Hamilton canonical ru description import baseline is ambiguous';
  end if;
end
$$;

create temporary table catalog_admin_hamilton_provenance_before on commit drop as
select product.id as product_id,
       product.source_checksum,
       source.checksum_sha256,
       source.snapshot
from cloud.products product
join cloud.import_products import_product on import_product.existing_product_id = product.id
join cloud.import_sources source on source.id = import_product.import_source_id
where product.source_uid = '330695211247';

create temporary table catalog_admin_other_products_before on commit drop as
select product.id, to_jsonb(product) as row_value
from cloud.products product
where product.source_uid <> '330695211247';

create temporary table catalog_admin_hamilton_patch_result on commit drop as
select cloud_api.catalog_admin_patch_product(
  product.id,
  jsonb_build_object(
    'expectedUpdatedAt', product.updated_at,
    'model', 'Hamilton-T1',
    'shortDescription', replace(
      product.short_description,
      'Работает от аккумулятора более 9 часов.',
      'До 8 часов автономной работы при использовании двух встроенных аккумуляторов.'
    ),
    'description', replace(
      product.full_description,
      '<strong>Более 9 часов работы от аккумулятора:</strong> Бесперебойная работа при транспортировке.',
      '<strong>До 8 часов автономной работы при использовании двух встроенных аккумуляторов.</strong>'
    ),
    'seoTitle', 'Аппарат ИВЛ Hamilton-T1 — Hamilton Medical',
    'seoDescription', 'Аппарат ИВЛ Hamilton-T1 от Hamilton Medical. До 8 часов автономной работы при использовании двух встроенных аккумуляторов.'
  ),
  'catalog-admin-hamilton-production-shaped-regression'
)
from cloud.products product
where product.source_uid = '330695211247';

do $$
declare
  hamilton cloud.products%rowtype;
  provenance_before record;
begin
  select * into hamilton from cloud.products where source_uid = '330695211247';
  select * into provenance_before from catalog_admin_hamilton_provenance_before;

  if hamilton.short_description ilike '%более 9 часов%'
     or hamilton.full_description ilike '%более 9 часов%'
     or hamilton.short_description not like '%До 8 часов автономной работы при использовании двух встроенных аккумуляторов.%'
     or hamilton.full_description not like '%До 8 часов автономной работы при использовании двух встроенных аккумуляторов.%' then
    raise exception 'Hamilton active Product content was not corrected exactly';
  end if;
  if (select count(*) from cloud.product_descriptions
      where product_id = hamilton.id and locale = 'ru'
        and (short_description ilike '%более 9 часов%'
          or full_description ilike '%более 9 часов%')) <> 0
     or (select count(*) from cloud.product_descriptions
         where product_id = hamilton.id and locale = 'ru'
           and (short_description like '%До 8 часов автономной работы при использовании двух встроенных аккумуляторов.%'
             or full_description like '%До 8 часов автономной работы при использовании двух встроенных аккумуляторов.%')) <> 1 then
    raise exception 'Hamilton canonical ru active description was not corrected exactly';
  end if;
  if hamilton.source_checksum is distinct from provenance_before.source_checksum
     or provenance_before.source_checksum is distinct from provenance_before.checksum_sha256
     or provenance_before.snapshot::text not ilike '%более 9 часов%' then
    raise exception 'Hamilton immutable provenance changed or lost its historical source evidence';
  end if;
  if exists (
    select 1
    from catalog_admin_other_products_before before_row
    join cloud.products product on product.id = before_row.id
    where to_jsonb(product) is distinct from before_row.row_value
  ) or (select count(*) from catalog_admin_other_products_before) <> 78 then
    raise exception 'Catalog Admin Hamilton patch changed another Product';
  end if;
end
$$;

create temporary table catalog_admin_hamilton_revision on commit drop as
select cloud_api.create_product_publication_revision_v1(
  product.id,
  'catalog-admin-hamilton-79-revision-v1'
) as result
from cloud.products product
where product.source_uid = '330695211247';

do $$
declare
  hamilton_id uuid;
  revision cloud.product_publication_revisions%rowtype;
  repeated_payload jsonb;
begin
  select id into hamilton_id from cloud.products where source_uid = '330695211247';
  select * into revision
  from cloud.product_publication_revisions
  where product_id = hamilton_id;
  repeated_payload := cloud.product_publication_candidate_payload_v1(hamilton_id);

  if not found or revision.revision_number <> 1
     or revision.candidate_payload::text ilike '%более 9 часов%'
     or revision.candidate_payload::text not like '%До 8 часов автономной работы при использовании двух встроенных аккумуляторов.%'
     or revision.candidate_payload_checksum
        <> cloud.sha256_jsonb_v1(cloud.product_publication_candidate_payload_v1(hamilton_id))
     or revision.payload_checksum
        <> cloud.product_publication_payload_checksum_v1(
          revision.schema_version,
          revision.product_identity,
          revision.candidate_payload
        ) then
    raise exception 'Hamilton revision does not match the corrected canonical active state';
  end if;
  if revision.candidate_payload #>> '{product,seoTitle}'
       <> 'Аппарат ИВЛ Hamilton-T1 — Hamilton Medical'
     or revision.candidate_payload #>> '{product,seoDescription}'
       <> 'Аппарат ИВЛ Hamilton-T1 от Hamilton Medical. До 8 часов автономной работы при использовании двух встроенных аккумуляторов.'
     or jsonb_array_length(revision.candidate_payload -> 'characteristics') <> 3
     or revision.candidate_payload -> 'characteristics' is distinct from repeated_payload -> 'characteristics'
     or (select array_agg(item ->> 'key' order by ordinality)
         from jsonb_array_elements(revision.candidate_payload -> 'characteristics')
           with ordinality as characteristic(item, ordinality))
       <> array['legacy:raw-001', 'legacy:raw-002', 'legacy:raw-003']
     or revision.candidate_payload -> 'characteristics' @? '$[*].id'
     or revision.candidate_payload -> 'characteristics' @? '$[*].sourceReference'
     or revision.candidate_payload -> 'characteristics' @? '$[*].updatedAt' then
    raise exception 'Hamilton revision does not cover canonical SEO and three stable-key characteristics';
  end if;
  if (select count(*) from cloud.product_publication_revisions) <> 1
     or (select count(*) from cloud.review_decisions) <> 0
     or (select count(*) from cloud.product_publication_approvals) <> 0
     or (select count(*) from cloud.product_publication_batches) <> 0
     or (select count(*) from cloud.products where publication_status = 'published') <> 0 then
    raise exception 'Hamilton corrective regression performed Review, Approval or Publication';
  end if;
end
$$;

select jsonb_pretty(jsonb_build_object(
  'status', 'PASS',
  'fixture', 'Hamilton-T1 approved 79-product baseline',
  'activeCharacteristics', (
    select count(*)
    from cloud.product_characteristics characteristic
    join cloud.products product on product.id = characteristic.product_id
    where product.source_uid = '330695211247'
      and characteristic.archived_at is null
  ),
  'candidateCharacteristics', (
    select jsonb_array_length(
      cloud.product_publication_candidate_payload_v1(product.id) -> 'characteristics'
    )
    from cloud.products product
    where product.source_uid = '330695211247'
  ),
  'candidateMedia', (
    select jsonb_array_length(
      cloud.product_publication_candidate_payload_v1(product.id) -> 'media'
    )
    from cloud.products product
    where product.source_uid = '330695211247'
  ),
  'candidateChecksum', (
    select cloud.sha256_jsonb_v1(
      cloud.product_publication_candidate_payload_v1(product.id)
    )
    from cloud.products product
    where product.source_uid = '330695211247'
  ),
  'oldClaimPresent', false,
  'reviewDecisions', (select count(*) from cloud.review_decisions),
  'approvals', (select count(*) from cloud.product_publication_approvals),
  'publicationBatches', (select count(*) from cloud.product_publication_batches),
  'publishedProducts', (
    select count(*) from cloud.products where publication_status = 'published'
  )
));

rollback;
