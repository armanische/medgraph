# Internal Review Queue UI

MVP-025 adds a first read-only internal screen for Review Queue items.

Route:

```text
/internal/review-queue
```

## What It Does

The prototype reads generated Review Queue reports from:

```text
data/research/review/review-queue.generated.json
data/research/review/products/*.json
```

It shows:

- total queue items;
- pending review count;
- high-priority count;
- ready-for-human-review count;
- products with review items;
- warnings;
- product groups;
- candidate facts;
- priority and risk;
- evidence ids;
- document version ids;
- source URLs;
- reviewer action guidance.

## Route Protection

The route is protected by:

```text
CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1
```

In production, if the flag is not set, the route calls `notFound()`.

The page also uses Next.js `connection()` so the flag and report are evaluated at request time rather than being baked into the static build.

In development, access is allowed for local review.

## Why Read-Only

The current Review Queue is a foundation layer, not a full reviewer workflow.

Read-only keeps the boundary clear:

- no approve/reject actions;
- no writes;
- no Verified Claims;
- no Publication;
- no Supabase dependency;
- no public portal dependency.

## What It Does Not Do

The prototype does not:

- publish data;
- create Verified Claims;
- write to Supabase;
- update `public_api`;
- change Verification or Publication;
- create a CMS;
- expose public navigation;
- allow reviewer decisions.

## Safety Boundary

The screen includes explicit copy:

> Эта страница показывает только кандидатные факты. Решение reviewer-а не публикует данные автоматически. Публикация выполняется отдельным процессом.

The Portal must not read Review Queue directly.

## Empty And Error States

If the report is missing, the UI shows:

```text
Очередь проверки ещё не сформирована.
npm run build:review-queue
```

If the report is invalid JSON, the UI shows a safe error without stack trace.

If there are no items, the UI shows:

```text
Нет фактов, ожидающих проверки.
```

## Next Steps

Before a real Review UI:

- add authentication for internal users;
- add reviewer identity model;
- add decision persistence separate from Verification;
- add conflict grouping;
- render source excerpts next to PDF metadata;
- add filtering by product, priority, risk, missing evidence, and claim type;
- define the handoff from `approved_for_verification` to the Verification pipeline.
