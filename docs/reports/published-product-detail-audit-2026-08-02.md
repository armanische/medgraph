# Published Product Detail & Characteristics Audit — 2026-08-02

## Outcome

The read-only audit covered the complete canonical published scope: 71 unique
Product IDs, 71 unique source UIDs and 71 unique canonical slugs. All 71 Product
Detail routes returned HTTP 200 and rendered in an isolated iPhone-sized
Playwright WebKit session. Production Product and lifecycle writes were zero.

The catalog is structurally healthy but uniformly shallow: every published
Product exposes exactly three base characteristics (`Категория`, `Тип товара`,
`Страна производства`). The average score is `78.94/100`; all 71 Products are
class B because identity, descriptions, SEO, media and Product Detail UX are
present, while category-specific technical completeness receives only `8/25`.

The machine-readable record is
`/tmp/published-product-detail-audit-2026-08-02.json`, SHA-256
`38b2b8be2c388c21d04d68d7c37aa605bb008002d0d7bf9877555709c58e02fd`.

## Corporate and Production guard

| Guard | Result |
| --- | --- |
| Git author/committer | `cybermedica <cybermedicaooo@gmail.com>` |
| Vercel account / team / project | corporate `cybermedicaooo@gmail.com` / `medgraph` / `medgraph` |
| Supabase identity policy | `cybermedicaooo@gmail.com`; UUID `7e90a993-8b30-4e0d-aff4-a257d5a4a179`; role `admin` |
| Authenticated Review workspace | PASS; trusted Production session, queue `0` |
| `gitForkProtection` | `true` |
| Canonical Git / deployment | `c4ba531b4ad49c16be6443df1d5106246b5d17ae` / `dpl_4nEXwpwhoDwkH2WJ5s5We2UE3ET2` |
| Production | 79 Products; 71 Published; 8 Unpublished; lifecycle `71/71/71/71` |
| Projection / sitemap | version `73`; 71 Product URLs |
| Product / lifecycle writes | `0 / 0` |

No Production credential, service-role value, token or personal identity was
used or recorded. The inventory joins public projection evidence to tracked
immutable publication manifests; names are not used as the sole identity key.

## Audit method

1. Parse the canonical sitemap and require exactly 71 `/catalog/<slug>` URLs.
2. Fetch each Product Detail route and validate HTTP status, canonical URL,
   metadata, Product JSON-LD, description, characteristics, media and Product
   RFQ binding.
3. Bind source UID from the stable slug to Product ID from immutable tracked
   publication manifests.
4. Probe every media URL without mutation and render a 71-primary-image contact
   sheet for obvious manufacturer/equipment-type contradictions.
5. Open every route in an isolated 390 × 844 WebKit page and check meaningful
   render, `h1`, image, CTA, characteristics, empty sections, runtime errors,
   internal metadata leakage and horizontal overflow.
6. Score each Product using the approved 100-point rubric. The complete
   per-Product evidence and gap list remains in the JSON artifact.

## Inventory and scoring

| Metric | Result |
| --- | ---: |
| Products audited | 71 |
| Unique Product IDs / source UIDs / slugs | 71 / 71 / 71 |
| Product Detail HTTP 200 | 71 / 71 |
| Quality A / B / C / D | 0 / 71 / 0 / 0 |
| Average score | 78.94 |
| Average characteristics | 3.00 |
| Descriptions present | 71 / 71 |
| SEO title and description present | 71 / 71 |
| Registration / document warnings | 71 / 71 retain `missing_registration` and `missing_documents` |
| Unpublished leakage | 0 |

Published category coverage:

| Category | Products | Category | Products |
| --- | ---: | --- | ---: |
| УЗИ-системы | 16 | Фетальные мониторы | 9 |
| Эндоскопические системы | 7 | Мониторы пациента | 7 |
| Электрокардиографы | 6 | Аппараты ИВЛ | 4 |
| Неонатальные инкубаторы | 4 | Медицинские аспираторы | 3 |
| Шприцевые насосы | 3 | Дефибрилляторы-мониторы | 3 |
| Рентгеновские аппараты | 3 | Бронхофиброскопы | 2 |
| Гемодиализ / респираторная поддержка / гастроскопы / кислородные концентраторы | 4 total |  |  |

## Product Detail UX and WebKit

The UI result is PASS for the current data contract:

- meaningful Product shell and exact `h1`: `71/71`;
- primary image rendered: `71/71`;
- RFQ link bound to the current canonical slug: `71/71`;
- three visible characteristic rows: `71/71`;
- blank screens: `0`;
- horizontal overflow at iPhone viewport: `0`;
- console/page runtime errors: `0`;
- empty Product sections: `0`;
- internal lifecycle/checksum metadata leaks: `0`.

Names and models are visually distinct, manufacturer and category metadata are
visible, descriptions are readable and characteristics are grouped under
`Основные сведения`. Mobile screenshots confirm stable stacking and visible
CTA. The server-rendered Product shell and the Published Catalog resilience
path remained intact.

## Characteristics gap

Every Product needs category-specific technical fields in addition to the
three base rows. The target sets are deliberately compact:

| Category family | Minimum useful additions |
| --- | --- |
| ИВЛ | patient groups, ventilation modes, display, power, autonomy, mass, mobility |
| Patient monitoring | display, base parameters, optional modules, trends, power, interfaces |
| Infusion | pump type, consumables, flow range, accuracy, modes, drug library, power |
| Ultrasound | system type, imaging modes, probes, display, interfaces, archive, mobility |
| Endoscopy | processor type, compatible scopes, enhancement modes, light source, recording, interfaces |
| X-ray | system type, imaging chain, detector/intensifier, movements, modes, interfaces, power |
| Other categories | category-specific operating range, display/control, safety, interfaces, power and physical data |

No technical value may be copied from a neighbouring model. Optional and
configuration-dependent functions must be labelled in the value or label and
grounded to an exact official source.

## Content, SEO and media findings

- SEO coverage is complete (`71/71`) and canonical links are correct.
- All Products have a public short and full description. Most recent batch
  descriptions are neutral and concise.
- Hamilton-T1 remains the only urgent content-quality item: its legacy full
  description includes promotional absolutes, dense numeric claims and weak
  semantic structure. The page remains available and its exact identity is not
  in doubt; remediation belongs inside Characteristics Wave 1.
- Media HTTP availability is complete. Status is `PASS` for 39 Products and
  `IMPROVE` for 32, principally because those cards have only one image.
- Media `FAIL` is `0`. The primary-image contact sheet and existing immutable
  Human Review evidence reveal no obvious different manufacturer or equipment
  type. Single-image and low-diversity sets remain a non-blocking media backlog.

## Product Detail component contract

`app/catalog/[slug]/page.tsx` and the published mapper already support:

- deterministic multiple groups and ordering;
- labels, values and units;
- ordinary long values with responsive stacking;
- optional/configuration wording as source-grounded label/value text;
- mobile rendering without overflow.

There is no collapsed/expanded group control. It is not required for the first
wave's expected 7–11 technical rows, so the contract is **SUFFICIENT** and no
runtime change is planned. Reassess collapse only for materially larger future
packages.

## Wave 1 and urgent queue

The exact 15-Product queue is recorded in
[Product Characteristics Wave 1](./product-characteristics-wave-1-queue-2026-08-02.md).
It covers ventilation, patient monitoring, defibrillation, infusion,
ultrasound, endoscopy, dialysis, oxygen therapy, fetal monitoring, ECG,
neonatal care and mobile X-ray. Fourteen have media PASS; OEC 9900 Elite has
one usable exact-model image and remains `IMPROVE`, not `FAIL`.

The urgent queue is recorded in
[Product Detail Urgent Correctives](./product-detail-urgent-correctives-2026-08-02.md).

## Production invariance

- Products `79`; Published `71`; Unpublished `8`;
- Revisions / Decisions / Approvals / Publication Batches `71/71/71/71`;
- projection version `73`; sitemap Product URLs `71`;
- the eight deferred draft Products remain absent from the public projection;
- Product data writes `0`; lifecycle writes `0`;
- migrations, ENV and DNS unchanged;
- `gitForkProtection = true`.

## Next operation

Prepare one controlled, preview-first Characteristics Wave 1 task for the exact
15 Products. It should obtain fresh Product tokens, resolve official evidence
per proposed key, generate before/after payloads, and stop before Production
writes until the consolidated preview and provenance pass review.
