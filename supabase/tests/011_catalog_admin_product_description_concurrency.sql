\set ON_ERROR_STOP on

insert into cloud.manufacturers (
  id, code, slug, canonical_name, display_name, country_code, description,
  confidence, publication_status
) values (
  'a2000000-0000-4000-8000-000000000010',
  'manufacturer-catalog-admin-concurrency', 'catalog-admin-concurrency-manufacturer',
  'Catalog Admin Concurrency Manufacturer', 'Catalog Admin Concurrency Manufacturer',
  'CH', 'Local concurrency fixture.', 'reviewed', 'published'
);

insert into cloud.categories (
  id, code, slug, canonical_name, display_name, description, level, assignable,
  confidence, publication_status
) values (
  'a2000000-0000-4000-8000-000000000020',
  'category-catalog-admin-concurrency', 'catalog-admin-concurrency-category',
  'Catalog Admin Concurrency Category', 'Catalog Admin Concurrency Category',
  'Local concurrency fixture.', 'leaf', true, 'reviewed', 'published'
);

insert into cloud.application_areas (
  id, code, slug, canonical_name, display_name, description, confidence,
  publication_status
) values (
  'a2000000-0000-4000-8000-000000000030',
  'catalog-admin-concurrency-area', 'catalog-admin-concurrency-area',
  'Catalog Admin Concurrency Area', 'Catalog Admin Concurrency Area',
  'Local concurrency fixture.', 'reviewed', 'published'
);

insert into cloud.products (
  id, slug, title, model, manufacturer_id, category_id, short_description,
  full_description, source_type, source_url, confidence, publication_status,
  updated_at
) values (
  'a2000000-0000-4000-8000-000000000050',
  'catalog-admin-concurrency-product', 'Catalog Admin Concurrency Product',
  'CONCURRENT-1',
  'a2000000-0000-4000-8000-000000000010',
  'a2000000-0000-4000-8000-000000000020',
  'Concurrent initial short', 'Concurrent initial full',
  'integration_test', 'https://example.invalid/catalog-admin-concurrency',
  'reviewed', 'draft', '2026-07-28T11:00:00Z'
);

insert into cloud.product_descriptions (
  id, product_id, locale, short_description, full_description, confidence,
  updated_at
) values
  (
    'a2000000-0000-4000-8000-000000000060',
    'a2000000-0000-4000-8000-000000000050', 'ru',
    'Concurrent initial short', 'Concurrent initial full', 'reviewed',
    '2026-07-28T11:00:00Z'
  ),
  (
    'a2000000-0000-4000-8000-000000000061',
    'a2000000-0000-4000-8000-000000000050', 'en',
    'Concurrent English short', 'Concurrent English full', 'reviewed',
    '2026-07-28T11:00:00Z'
  );

insert into cloud.product_application_areas (product_id, application_area_id) values (
  'a2000000-0000-4000-8000-000000000050',
  'a2000000-0000-4000-8000-000000000030'
);
