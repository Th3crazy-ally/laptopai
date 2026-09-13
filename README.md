# LaptopAI

LaptopAI turns a messy laptop buying decision into a clear, explainable shortlist. It combines a curated catalog with a deterministic weighted scoring engine that responds to budget, use cases, minimum specifications, and personal priorities. Optional AI features translate natural-language briefs and explain results using only backend-supplied facts.

> **Repository note:** this repository contains the actual LaptopAI source code. It does not contain credentials, production database values, or a link-only placeholder.

## Features

- Guided brief with budget, RAM, storage, use-case, and priority controls.
- Natural-language brief parsing with an editable, deterministic fallback.
- Curated laptop catalog with provenance labels and version metadata.
- Constraint-aware weighted ranking with score breakdowns, evidence, confidence, and compromises.
- Product deep dives and side-by-side comparison.
- Grounded AI explanations that never select products or invent specifications.
- Graceful operation when optional AI services are unavailable.
- Responsive editorial UI with light/dark theme support.
- Drizzle schema and migration support for catalog and recommendation records.

## Tech stack

LaptopAI uses React 19, TypeScript, Vite, Tailwind CSS, tRPC, Express, Drizzle ORM, MySQL/TiDB, Vitest, and pnpm. Authentication and optional Manus integrations are implemented server-side through the existing WebDev runtime adapters.

## Run locally

Prerequisites are Node.js 22 or newer and pnpm 10 or newer.

```bash
git clone https://github.com/Th3crazy-ally/laptopai.git
cd laptopai
pnpm install
cp .env.example .env
# Edit .env with local values for the features you want to use.
pnpm dev
```

The development server is normally available at `http://localhost:3000`.

Run validation commands:

```bash
pnpm check
pnpm test
pnpm build
```

## Environment variables

`.env.example` lists every environment variable referenced by the runtime. Copy it to `.env` for local work; never commit `.env` or real credentials.

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | MySQL/TiDB connection used by Drizzle persistence | For database-backed features |
| `JWT_SECRET` | Signs authentication session cookies | For authentication |
| `VITE_APP_ID` | Manus OAuth application ID | For authentication |
| `OAUTH_SERVER_URL` | OAuth backend base URL | For authentication |
| `VITE_OAUTH_PORTAL_URL` | Browser login portal URL | For authentication |
| `OWNER_OPEN_ID` / `OWNER_NAME` | Owner metadata used by the auth bootstrap | For owner-aware auth |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Server-side Manus AI, storage, maps, notifications, and voice integrations | For optional integrations |
| `VITE_FRONTEND_FORGE_API_URL` / `VITE_FRONTEND_FORGE_API_KEY` | Browser-side integration configuration where applicable | For optional frontend integrations |
| `OPENAI_API_KEY` | Optional direct OpenAI-compatible LLM integration | Only if that provider path is enabled |
| `VITE_ANALYTICS_ENDPOINT` / `VITE_ANALYTICS_WEBSITE_ID` | Optional analytics script configuration | Optional |

Do not paste secrets into source files, README examples, issues, commit messages, or client-side code. If a credential was ever committed, rotate it and remove it from history before publishing.

## Project structure

```text
client/
  index.html
  src/
    App.tsx                 # application routes and providers
    pages/Home.tsx          # main product experience
    components/             # reusable UI and WebDev components
    index.css               # LaptopAI visual system and responsive styles
server/
  catalog.ts                # curated laptop records
  recommendations.ts        # deterministic scoring and natural-language fallback
  routers.ts                # typed tRPC procedures
  db.ts                     # database helpers
  _core/                    # WebDev runtime adapters and integrations
drizzle/
  schema.ts                 # database schema
  *.sql                     # generated migrations
shared/
  types.ts                  # shared contracts
docs/
  recommendation-methodology.md
  visual-verification.md
.env.example                # safe placeholders only
```

## Deployment

LaptopAI is a full-stack application. GitHub stores the source code, but GitHub Pages is not sufficient for the complete product because the recommendation API, Express server, authentication, database, and optional integrations require a server runtime.

### Manus WebDev

The existing Manus project can run and publish this application through its WebDev deployment flow. Configure production environment variables through the platform’s secret manager, not through committed files, then deploy the existing project checkpoint.

### Generic Node host

A compatible host such as Render, Railway, Fly.io, or another Node service can deploy the repository using:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Set the service to listen on the host-provided `PORT` and add the required production environment variables through the provider’s secret settings. Configure a managed MySQL/TiDB database and run the reviewed Drizzle migrations before using database-backed features. Keep authentication callback URLs and allowed origins aligned with the deployed domain.

### Vercel or other serverless hosts

Use a serverless adapter only if the provider supports the Express/tRPC runtime and the project’s authentication/database behavior. Do not assume a static export is equivalent to this full-stack application. Validate OAuth callbacks, database connectivity, cold starts, and optional integration credentials in a staging deployment first.

## Recommendation methodology

The scorer normalizes requirements, applies hard budget and minimum-spec constraints, calculates component signals, applies dynamic weights, and sorts deterministically. If hard constraints eliminate every candidate, the near-match fallback shows the relevant compromises. See [`docs/recommendation-methodology.md`](docs/recommendation-methodology.md).

## Security and data notes

The included catalog is a curated benchmark fixture for demonstrating the product experience. Prices are not live retailer quotes and availability is not guaranteed. Production imports should preserve source URL, currency, observed time, licensing, freshness, and import-run metadata. Before adding accounts, history, alerts, or retailer integrations, add retention, authorization, abuse controls, and deletion workflows.

## Future extensions

The modular boundaries support live prices, price history, availability, review analysis/RAG, accounts, personalized recommendations, alerts, affiliate links, more currencies, and an evaluated ML strategy. These should be added only with appropriate provenance, labels, privacy controls, and operational review.

## License

The project currently retains the MIT license metadata from the WebDev template. Confirm the intended license and add a `LICENSE` file before distributing the repository as an open-source project.
