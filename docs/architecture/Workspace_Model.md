# Procurement Workspace Model

MVP-031 introduces the foundation for an AI Procurement Workspace.

This is not an AI chat and not a full assistant. LLM is not connected.

The workspace combines existing deterministic CyberMedica capabilities:

- Search;
- Compare;
- Compatibility;
- Tender Compliance.

## WorkspaceSession

A session is an in-memory/report-layer object. It is not saved to a database.

It contains:

- selected products;
- search results;
- comparison result;
- compatibility result;
- tender compliance result;
- rule-based insights;
- rule-based recommendations;
- safety warnings.

## WorkspaceSelection

Stores the current working context:

- primary product slug;
- compared product slugs;
- search query;
- tender title.

## WorkspaceInsight

An insight summarizes existing engine results.

Allowed sources:

- Search result counts;
- Compare differences;
- Compatibility statuses;
- Tender Compliance statuses.

Insights must not:

- invent facts;
- use Candidate Claims;
- read Review Queue;
- use LLM-generated text;
- say “AI thinks”.

## WorkspaceRecommendation

Recommendations are deterministic next actions:

- open product card;
- review comparison;
- check compatibility;
- review tender requirements;
- send request for quotation.

Recommendations must be grounded in available engine results. If data is
insufficient, the workspace should say so instead of guessing.

## Safety Boundaries

Workspace must never:

- read Candidate Claims directly;
- read Review Queue;
- write to Supabase;
- write to `public_api`;
- change Verification;
- change Publication;
- generate procurement conclusions through LLM;
- create or publish verified facts.

## Future AI Assistant Path

Future AI Assistant can be introduced only after these boundaries are preserved:

1. Retrieval uses published or publication-ready surfaces only.
2. LLM explains existing results but does not create facts.
3. Every answer links back to Search, Compare, Compatibility or Tender evidence.
4. Human review remains required for ambiguous procurement decisions.
5. No AI output can become Verification or Publication.

