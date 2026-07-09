# Search Pilot

MVP-028 adds the first professional search route:

```text
/search
```

## Supported Pilot Queries

Examples:

- `Hamilton T1`
- `Hamilton C1`
- `Hamilton`
- `ИВЛ Hamilton`
- `FS510`
- `ФСЗ 2009/04992`
- `тепловлагообменный фильтр`
- `HMEF`

## Indexed Pilot Products

The pilot index contains:

- Тепловлагообменный фильтр FS510;
- Hamilton T1;
- Hamilton C1.

FS510 comes from published product data.

Hamilton T1 and Hamilton C1 come from the publication-ready comparison mock/report
layer and are marked accordingly.

## Ranking Findings

The first ranking rules work as intended:

- exact model queries place the matching model first;
- registration number query finds FS510;
- manufacturer query returns Hamilton products;
- multi-word query `Hamilton ИВЛ` returns Hamilton ventilator products;
- unknown query returns an empty state.

## UI Findings

The route shows:

- search input;
- popular queries;
- recent local queries;
- result count;
- result cards;
- empty state;
- no-results state.

The homepage search and header search now route to `/search`.

## Limitations

- The index is in-memory and small.
- There is no typo tolerance yet.
- There are no advanced filters yet.
- Recent queries are local browser storage only.
- Search does not show evidence excerpts yet.
- Candidate Claims and Review Queue data are intentionally excluded.

## Compare With Future Search v2

Next useful steps:

- build a published search datastore;
- add manufacturer/category filters;
- add typo and keyboard-layout tolerance;
- expose source/evidence snippets for verified facts;
- add synonym dictionaries per medical category;
- add search analytics without storing sensitive user data.

