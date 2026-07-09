# Product Comparison Pilot

MVP-027 creates the first comparison prototype for:

- Hamilton T1;
- Hamilton C1.

The pilot is available at:

```text
/compare
```

## Compared Products

| Product | Manufacturer | Category | Data source |
| --- | --- | --- | --- |
| Hamilton T1 | Hamilton Medical | Аппараты ИВЛ | publication-ready report |
| Hamilton C1 | Hamilton Medical | Аппараты ИВЛ | publication-ready report |

## Characteristics In The Pilot

- Тип изделия;
- Экран;
- Работа от аккумулятора;
- Назначение;
- Неонатальный режим.

## First Results

The pilot shows:

- identical display size;
- identical battery-operation availability;
- different intended-use wording;
- different device-type wording;
- missing confirmed data for neonatal support on Hamilton T1.

Missing data is shown as:

```text
Нет подтверждённых данных
```

It is not counted as a difference.

## Current Limitations

- Product selection is not interactive yet.
- Values come from a mock/report layer, not from a final published compare
  datastore.
- Unit conversion is not implemented.
- Conflict grouping is not implemented.
- Evidence excerpts are not rendered side by side.
- Candidate Claims are not used directly.

## Safety Findings

The MVP keeps the Verification boundary intact:

- no Candidate Claims are displayed as facts;
- no automatic source merging;
- no inferred values;
- no Supabase writes;
- no `public_api` writes;
- no Publication side effects.

## Compare v2 Ideas

- Choose any two products from the same category.
- Add category-specific templates for IVL, monitors, ultrasound, endoscopy and
  anesthesia systems.
- Show document excerpts and page locators in expandable rows.
- Add filters for differences, missing data and status.
- Add explicit unit conversion with evidence and conversion notes.
- Support three-way comparison for procurement workflows.

