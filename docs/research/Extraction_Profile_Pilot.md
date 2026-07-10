# Extraction Profile Pilot

## Scope

MVP-039 introduced category-based extraction profiles for the catalog importer.

The pilot validates rule-based extraction for:

- ventilators;
- ultrasound;
- anesthesia;
- patient monitors;
- endoscopy;
- consumables;
- lighting;
- neonatal devices;
- registry identity fields.

## What Works

The profile registry selects category-specific rules from product category text. The registry profile always runs and category profiles are added when the category matches.

Current supported examples:

| Category | Example matched fields |
| --- | --- |
| Ventilator | weight, screen, battery runtime, NIV, patient groups, oxygen |
| Ultrasound | probe ports, Doppler, 3D/4D |
| Patient Monitor | parameters, screen, battery runtime |
| Endoscopy | working channel, diameter, single-use, sterile |
| Consumables | dead space, filtration efficiency, connector |
| Lighting | illumination, color temperature |
| Neonatal | humidity, alarms |

## Unit Normalization

The pilot normalizes:

- kg / кг -> `kg`
- g / г -> `g`
- inch / inches / in / `"` -> `inch`
- hours / h / ч -> `h`
- min / minutes / мин -> `min`
- ml / мл -> `ml`
- mm / мм -> `mm`
- cm / см -> `cm`
- µm / um / мкм -> `µm`
- percent / % -> `%`

## Coverage Pilot

The profile coverage model reports:

- expected fields;
- matched fields;
- failed fields;
- coverage percent;
- matched pattern counts;
- normalized unit counts.

Example pilot behavior:

- `Weight: 7 kg. Display: 10 inch.` on a ventilator category matches `weight` and `screen`;
- `battery_runtime` and other ventilator fields remain in failed fields;
- units are counted as `kg` and `inch`;
- coverage remains below 100%, which is expected until more evidence is available.

## Test Coverage

The test suite includes 24 extraction profile checks:

- profile selection;
- synonyms;
- unit normalization;
- category registry;
- confidence diagnostics;
- coverage;
- summary aggregation.

## Safety

The pilot only creates candidate facts. It does not:

- publish;
- verify;
- write Supabase;
- change Review Queue logic;
- use LLM;
- use OCR;
- infer absent facts.

## Remaining Work

1. Run real manufacturer waves again and compare coverage before/after profiles.
2. Expand anesthesia-specific fields beyond ventilation overlap.
3. Add stronger table extraction upstream.
4. Add more document-language variants after real PDF review.
5. Treat coverage as research triage, not product completeness or publication readiness.
