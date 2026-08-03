# Production backup — characteristics contract — 2026-08-03

## Backup and restore result

- Backup ID: `production-pre-characteristics-clbzibuusyuajsylcbvl-20260803T070450Z`.
- Created: `2026-08-03T07:04:50Z`.
- Project: `clbzibuusyuajsylcbvl`.
- Manifest SHA-256: `2c1c329355c80763bcda7434ca875e77075cfc6bc21b5ac71982b4607e16f6c2`.
- Storage: local recovery directory outside Git, directory mode `0700`, files
  mode `0600`.
- Restore image: `public.ecr.aws/supabase/postgres:17.6.1.147`.
- Restore network: `none`.
- Restore result: PASS; disposable container removed after verification.

| Artifact | SHA-256 |
| --- | --- |
| `database.tar` | `5a83328d97831c44b16d934419f8a9182f9d68803a7fdc1729dbfd4079292570` |
| `database-schema.sql` | `16f1fbab7f656d10af2d49af014ec8fd9becf3cc4fdfb2ea47aadc143e9bb2c8` |
| `database-data.sql` | `f5044cfb3e52d79c0ec158bf7d8b1704f28c542eab5cdc5c305bb9bfa7cf38cc` |
| `migration-schema.sql` | `18b99fbbb3ec9fbb964bb255a56171329acd99b6977ece2addd89fdf5aa5105b` |
| `roles.sql` | `aa9aa7b903ee5f37034129a9231bed6a7eb90954e229d034335b2888651c6c90` |

## Restored baseline

Restore independently confirmed Products `79`, Published `71`, Unpublished
`8`, lifecycle `71/71/71/71`, projection version `73`, migration count `27`,
latest migration `202608010001`, and one exact corporate admin profile.

Hashes before migration:

- exact 15 Product rows:
  `fa0f359b0d97ee4e80abfab5d7c57f0588369e2b1f586e7563ee084d123d113c`;
- other 64 Product rows:
  `f8733478392bcd8fc2bebf43a5491b8061a4605442414cbe6b7424502a0453b5`;
- published projection:
  `23f7f2b73d7c694584e85f0e910298930d555194bab26164f2988d9b74895898`.

The primary migration and projection-isolation corrective were rehearsed in
the isolated restore. Product/lifecycle/projection hashes remained unchanged,
and all application triggers were re-enabled before validation (`disabled =
0`). No Production credential, DSN or password is present in this report.
