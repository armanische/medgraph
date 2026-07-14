# Wave 2 Progress Dashboard

## Purpose

`/internal/wave2` is a read-only operational view of Wave 2 progress. It
summarizes the planned manufacturers, lets an internal user filter them by
status, and shows the existing execution metrics without triggering any import
stage.

The screen has no API route, mutation, background job, Supabase client, or
pipeline control.

## Data boundary

The dashboard data adapter reads only:

- `data/research/wave2/wave2-summary.generated.json`;
- `data/research/wave2/<Manufacturer>/summary.generated.json`.

The aggregate file is the availability and generation marker. Because the
orchestrator may contain only the most recent execution in that file, dashboard
totals are calculated from the ten planned manufacturer summaries. The adapter
does not write, repair, or generate JSON.

The display aliases are local to the dashboard:

- `Dräger` reads `data/research/wave2/Drager/summary.generated.json`;
- `GE HealthCare` reads `data/research/wave2/GE/summary.generated.json`.

Execution-report links are shown only when the corresponding existing Markdown
file can be found under `docs/research/`. The Markdown content is not parsed as
a dashboard data source.

## Planned manufacturers

The fixed plan is Hamilton, Mindray, Dräger, GE HealthCare, Philips, Ambu,
SonoScape, Comen, SLE, and Dixion.

## Derived state

Manufacturer status is calculated from its existing summary:

- `Completed`: all six expected stages have `completed` status and there are no
  errors;
- `In Progress`: a valid summary exists but not every expected stage is
  completed;
- `Blocked`: errors exist, a stage is blocked/failed, or the summary structure
  is invalid;
- `Not Started`: the manufacturer summary does not exist.

Manufacturer progress is the percentage of the six expected completed stages.
Overall progress is:

`completed manufacturers / 10 planned manufacturers × 100`

`Ready` is the number of discovered products not counted in
`blockedProducts`, clamped at zero. It is a dashboard presentation value, not a
review decision and not a claim state.

## Rendering model

The Next.js page is a Server Component. It waits for a request, reads the local
JSON files on the server, and passes serializable dashboard data to the Client
Component. The Client Component owns only two ephemeral UI values: the selected
filter and the selected manufacturer.

In development the route is enabled. In production it returns `notFound()`
unless `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD=1`. Search indexing and following are
disabled through route metadata.

## Safety boundary

The implementation does not import or call Verification, Publication, Review
Queue, Candidate Claims, Supabase, public API, Portal, Discovery, Resolver,
Downloader, Provider Framework, Orchestrator, or Extraction Profile code. A
missing or invalid report produces a calm read-only state; it never starts or
repairs the pipeline.
