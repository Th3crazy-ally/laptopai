# LaptopAI

LaptopAI turns a messy laptop buying decision into a clear, explainable shortlist. It combines a curated catalog with a deterministic weighted scoring engine that responds to budget, use cases, minimum specifications, and personal priorities. Optional AI features translate natural-language briefs and explain results using only backend-supplied facts.

## Product principles

- **Fit over hype:** there is no universal best laptop.
- **Deterministic ranking:** the recommendation engine, not the LLM, selects and ranks products.
- **Grounded explanations:** AI can summarize supplied facts but cannot invent specifications or availability.
- **Graceful degradation:** the core flow works without an AI provider or trained ML model.
- **Transparent trade-offs:** every result includes score evidence, compromises, and a confidence level.

## Stack

This WebDev project uses React 19, TypeScript, Vite, Tailwind CSS, tRPC, Drizzle, and the managed database runtime. The domain modules are intentionally framework-independent where practical:

- `server/catalog.ts` — curated, provenance-labeled laptop catalog.
- `server/recommendations.ts` — deterministic normalization, constraints, weighting, ranking, and fallback parsing.
- `server/routers.ts` — typed catalog, recommendation, comparison, and AI procedures.
- `shared/types.ts` — shared contracts used by server and client.
- `drizzle/schema.ts` — database-ready catalog and anonymous recommendation request tables.
- `client/src/pages/Home.tsx` — responsive brief, shortlist, deep dive, and comparison experience.

## Local development

```bash
pnpm install
pnpm dev
```

Run quality checks:

```bash
pnpm check
pnpm test
pnpm build
```

The database schema is managed through Drizzle migrations. The initial migration is in `drizzle/0001_windy_master_mold.sql`. Seed catalog data is intentionally kept in `server/catalog.ts` for a fast, usable MVP; the schema and persistence helpers are ready for a later catalog import job.

## Recommendation methodology

The scorer first normalizes requirements, applies hard budget and minimum-spec constraints, derives component features, calculates domain-reference scores, dynamically weights those components, and sorts deterministically. A near-match fallback is returned only when the hard constraints produce no eligible records, with the failed constraints shown as compromises. See [`docs/recommendation-methodology.md`](docs/recommendation-methodology.md).

## AI safety boundary

Natural-language parsing is an optional convenience. Its output is validated before entering the scorer and can always be edited in the guided form. Explanations receive the selected laptop facts, score breakdown, and requirements as typed context. They are expected to stay grounded; if an AI call fails, a deterministic explanation template is returned.

## Data note

The included catalog is a curated benchmark fixture for demonstrating the product experience. Prices are not live retailer quotes and availability is not guaranteed. A production catalog should preserve source URL, currency, observed time, licensing, freshness, and import-run metadata.


## Future extensions

The modular boundaries support live prices, price history, availability, review analysis/RAG, accounts, personalized recommendations, alerts, affiliate links, more currencies, and an evaluated ML strategy. These should be added only with appropriate provenance, labels, privacy controls, and operational review.
