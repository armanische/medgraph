# Wave 2 Execution Pilot

Дата: 2026-07-09

## Scope

MVP-035 introduced a Wave 2 execution orchestrator for manufacturer-level runs.

This is a report-layer pilot, not mass import.

## Supported Manufacturers

- Hamilton;
- Mindray;
- Ambu;
- Drager;
- SonoScape;
- Comen;
- SLE;
- Dixion;
- GE;
- Philips.

## Pilot Command

```bash
npm run wave2:execute -- Hamilton
npm run wave2:execute -- all
```

## Reports Created

Per manufacturer:

- `data/research/wave2/Hamilton/summary.generated.json`;
- `data/research/wave2/Mindray/summary.generated.json`;
- and so on for every supported manufacturer.

Aggregate:

- `data/research/wave2/wave2-summary.generated.json`.

## Pilot Findings

What works:

- one command can execute a manufacturer or all manufacturers;
- progress output follows the intended pipeline stages;
- reports are deterministic and idempotent;
- retry model is testable without network calls;
- safety flags make non-publication explicit.

Current limits:

- metrics are deterministic mock/report counts;
- no real document download is triggered by Wave 2 orchestrator;
- no real extraction run is triggered by Wave 2 orchestrator;
- no Review Decisions are read or written;
- no Supabase connection is used.

## Example Aggregate Shape

```json
{
  "generatedAt": "wave2-execution-v1",
  "manufacturers": ["Hamilton", "Mindray"],
  "totals": {
    "productsDiscovered": 25,
    "officialSources": 2,
    "documentsFound": 58,
    "downloads": 38,
    "artifacts": 38,
    "candidateFacts": 87,
    "reviewItems": 87,
    "blockedProducts": 3
  },
  "safety": {
    "publicationCreated": false,
    "supabaseWrites": false,
    "verificationChanged": false,
    "reviewDecisionsChanged": false
  }
}
```

## Next Steps

1. Connect manufacturer execution to existing discovery reports.
2. Feed trusted document reports into the Wave 2 summary.
3. Add artifact identity metrics from the artifact store.
4. Add extraction report metrics.
5. Add review queue handoff metrics.
6. Keep publication as a separate, human-approved boundary.
