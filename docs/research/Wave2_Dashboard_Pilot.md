# Wave 2 Dashboard Pilot

## Scope

The pilot adds `/internal/wave2` as a read-only view over the existing Wave 2
generated summaries. No generated report, API, dependency, pipeline stage, or
data mutation was added.

## What the pilot shows

- overall progress across the ten-manufacturer plan;
- completed and remaining manufacturer counts;
- aggregate products, official sources, documents, downloads, artifacts,
  candidate facts, review items, errors, and warnings;
- a manufacturer table with status filtering and stage-based progress;
- a selected-manufacturer detail panel;
- repository-relative links to existing manufacturer execution reports.

## Pilot observations

The current `wave2-summary.generated.json` can represent the most recent scoped
execution rather than all historical manufacturer executions. Reading the ten
allowed manufacturer summaries avoids presenting the last manufacturer as the
entire Wave 2 program while staying inside the prescribed data boundary.

The summaries do not expose a separate `ready` count. The pilot therefore
displays `productsDiscovered - blockedProducts` as a clearly documented,
clamped presentation metric. It does not infer Review Queue decisions or claim
readiness.

Warnings do not make a manufacturer blocked. Errors and explicit failed or
blocked stage states do. A manufacturer can therefore be completed with
warnings, matching the existing reports.

## Limitations

- progress measures completed pipeline stages, not document quality or
  extraction coverage;
- the overall percentage counts completed manufacturers equally regardless of
  product volume;
- execution-report links depend on existing Markdown files and are absent for
  manufacturers without those files;
- the page does not refresh in the background; a normal page request reads the
  latest files;
- there are no controls to execute, retry, verify, review, or publish data.

## Safety confirmation

- publication creation: absent;
- verified claim creation: absent;
- Supabase writes: absent;
- verification changes: absent;
- review decisions: absent;
- pipeline execution: absent.
