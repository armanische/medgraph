-- Restrict direct execution of internal Cloud implementation functions.
-- Approved runtime entry points remain in cloud_api; two security-invoker
-- helpers retain only the role grants required by existing RLS policies.

begin;

revoke execute on function cloud.apply_catalog_data_quality_v1(jsonb, text) from public;
revoke execute on function cloud.apply_product_import_v1(jsonb, text) from public;
revoke execute on function cloud.apply_reference_import(jsonb, text) from public;
revoke execute on function cloud.apply_reference_publication(jsonb, text) from public;
revoke execute on function cloud.catalog_admin_patch_product(uuid, jsonb, text) from public;
revoke execute on function cloud.catalog_admin_product(uuid) from public;
revoke execute on function cloud.catalog_admin_products(text, text, text) from public;
revoke execute on function cloud.catalog_admin_references(text) from public;
revoke execute on function cloud.catalog_data_quality_inventory() from public;
revoke execute on function cloud.current_app_role() from public;
revoke execute on function cloud.enforce_product_publication_state_v1() from public;
revoke execute on function cloud.is_service_request() from public;
revoke execute on function cloud.prevent_product_publication_record_mutation_v1() from public;
revoke execute on function cloud.reference_publication_snapshot() from public;
revoke execute on function cloud.rollback_product_import_v1(text) from public;
revoke execute on function cloud.rollback_reference_publication(text) from public;

revoke execute on function cloud.apply_catalog_data_quality_v1(jsonb, text) from anon;
revoke execute on function cloud.apply_product_import_v1(jsonb, text) from anon;
revoke execute on function cloud.apply_reference_import(jsonb, text) from anon;
revoke execute on function cloud.apply_reference_publication(jsonb, text) from anon;
revoke execute on function cloud.catalog_admin_patch_product(uuid, jsonb, text) from anon;
revoke execute on function cloud.catalog_admin_product(uuid) from anon;
revoke execute on function cloud.catalog_admin_products(text, text, text) from anon;
revoke execute on function cloud.catalog_admin_references(text) from anon;
revoke execute on function cloud.catalog_data_quality_inventory() from anon;
revoke execute on function cloud.current_app_role() from anon;
revoke execute on function cloud.enforce_product_publication_state_v1() from anon;
revoke execute on function cloud.is_service_request() from anon;
revoke execute on function cloud.prevent_product_publication_record_mutation_v1() from anon;
revoke execute on function cloud.reference_publication_snapshot() from anon;
revoke execute on function cloud.rollback_product_import_v1(text) from anon;
revoke execute on function cloud.rollback_reference_publication(text) from anon;

revoke execute on function cloud.apply_catalog_data_quality_v1(jsonb, text) from authenticated;
revoke execute on function cloud.apply_product_import_v1(jsonb, text) from authenticated;
revoke execute on function cloud.apply_reference_import(jsonb, text) from authenticated;
revoke execute on function cloud.apply_reference_publication(jsonb, text) from authenticated;
revoke execute on function cloud.catalog_admin_patch_product(uuid, jsonb, text) from authenticated;
revoke execute on function cloud.catalog_admin_product(uuid) from authenticated;
revoke execute on function cloud.catalog_admin_products(text, text, text) from authenticated;
revoke execute on function cloud.catalog_admin_references(text) from authenticated;
revoke execute on function cloud.catalog_data_quality_inventory() from authenticated;
revoke execute on function cloud.current_app_role() from authenticated;
revoke execute on function cloud.enforce_product_publication_state_v1() from authenticated;
revoke execute on function cloud.is_service_request() from authenticated;
revoke execute on function cloud.prevent_product_publication_record_mutation_v1() from authenticated;
revoke execute on function cloud.reference_publication_snapshot() from authenticated;
revoke execute on function cloud.rollback_product_import_v1(text) from authenticated;
revoke execute on function cloud.rollback_reference_publication(text) from authenticated;

revoke execute on function cloud.apply_catalog_data_quality_v1(jsonb, text) from service_role;
revoke execute on function cloud.apply_product_import_v1(jsonb, text) from service_role;
revoke execute on function cloud.apply_reference_import(jsonb, text) from service_role;
revoke execute on function cloud.apply_reference_publication(jsonb, text) from service_role;
revoke execute on function cloud.catalog_admin_patch_product(uuid, jsonb, text) from service_role;
revoke execute on function cloud.catalog_admin_product(uuid) from service_role;
revoke execute on function cloud.catalog_admin_products(text, text, text) from service_role;
revoke execute on function cloud.catalog_admin_references(text) from service_role;
revoke execute on function cloud.catalog_data_quality_inventory() from service_role;
revoke execute on function cloud.current_app_role() from service_role;
revoke execute on function cloud.enforce_product_publication_state_v1() from service_role;
revoke execute on function cloud.is_service_request() from service_role;
revoke execute on function cloud.prevent_product_publication_record_mutation_v1() from service_role;
revoke execute on function cloud.reference_publication_snapshot() from service_role;
revoke execute on function cloud.rollback_product_import_v1(text) from service_role;
revoke execute on function cloud.rollback_reference_publication(text) from service_role;

grant execute on function cloud.current_app_role() to authenticated, service_role;
grant execute on function cloud.is_service_request() to service_role;

commit;
