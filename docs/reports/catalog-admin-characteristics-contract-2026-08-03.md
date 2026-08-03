# Catalog Admin deterministic characteristics contract — 2026-08-03

## Итог

Контракт введён в Production и ограничен exact 15 Products Characteristics
Wave 1. Он принимает только `ru`, exact `expectedUpdatedAt`, полный набор из 10
характеристик, корпоративный actor UUID и request ID. Browser передаёт только
operation key и digest; Product scope разрешается server-side.

Основная миграция:

- `202608030001_catalog_admin_characteristics_patch_v1.sql`;
- SHA-256: `e59e6c45b17f07612ee0029d61dcea9501f84b370d65f34e169fbebce3397479`.

Во время независимой post-write проверки было обнаружено, что глобальный
candidate overlay мог влиять на live published-source eligibility для scalar
drafts. LKG сохранил публичные 71 Products, но такое скрытое fallback-состояние
не было принято. Введён forward-only isolation corrective:

- `202608030002_catalog_admin_characteristics_projection_isolation_v1.sql`;
- SHA-256: `e2cd8ea0b9bf7a09dbf6f15d67feff2e0073a986f30dace34376845a7dc42e72`.

После corrective обычный
`cloud.product_publication_candidate_payload_v1(uuid)` читает только
immutable Product state. Draft доступен исключительно через private
`cloud.product_publication_candidate_with_admin_draft_v1(uuid)` для следующей
revision operation. Canonical synthetic после apply: 71 URLs, transport
healthy, fallback inactive.

## RPC

```text
cloud_api.catalog_admin_patch_product_characteristics_v1(
  uuid, timestamptz, text, jsonb, jsonb, jsonb, uuid, text
) -> jsonb
```

- owner: `postgres`;
- `cloud_api` wrapper: execute только `service_role`;
- `public`, `anon`, `authenticated`: execute отсутствует;
- private helpers в `cloud`: grants отсутствуют;
- draft table: RLS включён, table grants отсутствуют;
- arbitrary Product scope невозможен: 15 UUID закреплены CHECK constraint.

Контракт валидирует весь payload до записи, отклоняет duplicate keys/order,
неподдерживаемые поля, не-`ru`, stale token, malformed evidence, пустые значения
и non-corporate actor. Product row блокируется до проверки, draft заменяется
одной транзакцией, audit row создаётся в той же транзакции. Revision, Decision,
Approval, Batch, publication status, review state, slug, raw snapshot и source
checksum не изменяются.

## Проверки

- transactional PostgreSQL integration: PASS;
- full tests: 590/590 PASS;
- lint: PASS;
- TypeScript: PASS;
- Turbopack / Webpack: PASS на runtime commit;
- migration ledger: 29/29, latest `202608030002`;
- Production project: `clbzibuusyuajsylcbvl`;
- Vercel project: `medgraph` / `prj_emEZsTDpPLEaXuC8cM9URmmG0zX8`;
- corporate Vercel identity: `cybermedica`;
- `gitForkProtection`: `true`.

Runtime deployment `dpl_CTFVEoHqU3eMCEz7uGBA4UKVH4kx` (READY) supplied
the exact server-only execution surface. No generic public patch endpoint was
introduced.
