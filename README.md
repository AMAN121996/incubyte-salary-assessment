# ACME Salary Management

Web-based salary management for ACME's HR Manager. It replaces spreadsheets for **10,000 employees
across 10 countries**, lets HR maintain salary records safely, and answers *"how does the org pay
people?"* per country, job title and department.

**Stack:** Ruby on Rails 8 (API) · SQLite · React 19 + TypeScript · Mantine · TanStack Query · RSpec · Vitest · Docker

## Read this first

| Document | What it covers |
|----------|----------------|
| [Requirements](docs/01-requirements.md) | Goal, persona, scope, and what is deliberately left out, with reasons (written before any code) |
| [Design notes](docs/02-design.md) | Architecture diagram, data model, API contract, trade-offs |
| [Performance](docs/03-performance.md) | Measurements at 10k rows, indexing, scaling triggers |
| [AI usage](docs/04-ai-usage.md) | How Claude Code was directed and verified, and what it got wrong |

The git history is incremental (requirements → design → model → API → search → insights → seed →
UI → packaging) and can be read commit by commit.

## Features

- **Employee directory**: paginated table with search by name/email, filters by country, department
  and job title, and sortable columns. Filters live in the URL, so views can be shared.
- **Add / edit / delete** employees, with validation in the browser and on the server (duplicate
  email, positive whole-number salary, no future hire dates). Currency is derived from country.
- **Salary insights**
  - Overview: headcount per country, plus min / median / average / max in each local currency.
  - Country drill-down: headline stats, middle-50% pay band, and breakdowns by job title and by
    department. Each headcount links to the matching filtered employee list.
- **Seed**: 10,000 deterministic, realistic employees in ~2 seconds.

## Run locally

Prerequisites: Ruby 3.3.3, Node 22+, pnpm 10.

```bash
# Backend: http://localhost:3000
cd backend
bundle install
bin/rails db:prepare        # creates the DB and seeds 10,000 employees
bin/rails server

# Frontend: http://localhost:5173 (proxies /api to :3000)
cd frontend
pnpm install
pnpm dev
```

Re-seed at any time with `bin/rails db:seed` (deterministic, and replaces all employees).

## Tests

```bash
cd backend  && bundle exec rspec      # models, query object, statistics, services, request specs
cd frontend && pnpm test              # formatting, API client, form rules, page behaviour
```

Quality checks: `bin/rubocop`, `bin/brakeman` (backend), `pnpm lint`, `pnpm typecheck` (frontend).

## Run with Docker (production build)

One image serves the API and the built React app on the same origin.

```bash
docker build -t acme-salary .
docker run -p 3000:3000 \
  -e SECRET_KEY_BASE=$(openssl rand -hex 64) \
  -e FORCE_SSL=false \
  -v acme-salary-data:/rails/storage \
  acme-salary
# open http://localhost:3000
```

On first boot the container creates the SQLite database and seeds 10,000 employees. Later boots only
run pending migrations. Mount `/rails/storage` on a persistent volume.

| Env var | Default | Purpose |
|---------|---------|---------|
| `SECRET_KEY_BASE` | required | Rails secret |
| `FORCE_SSL` | `true` | Set `false` when not behind an HTTPS proxy |
| `DATABASE_PATH` | `storage/production.sqlite3` | SQLite file location |
| `PORT` | `3000` | HTTP port |

**Deploying:** any container host with a persistent disk works (Render, Railway, Fly.io, a VM).
Point it at this Dockerfile, mount a volume at `/rails/storage`, and set `SECRET_KEY_BASE`.
Health check: `GET /up`.

## Project layout

```
backend/
  app/models/          Employee, Countries, SalaryStatistics (pure maths)
  app/queries/         EmployeeSearch (filters, search, sort, pagination)
  app/services/        SalaryInsights (per-country / job title / department)
  app/serializers/     EmployeeSerializer (public JSON shape)
  app/controllers/api/ thin JSON controllers
  lib/                 EmployeeGenerator (deterministic seed data)
  db/seeds.rb          bulk insert of 10,000 employees
  spec/                RSpec suite
frontend/src/
  api/                 typed client, types, TanStack Query hooks
  features/employees/  directory, form, URL-driven list state
  features/insights/   overview + country drill-down
  components/, lib/    shared UI and formatting
docs/                  requirements, design, performance, AI usage
Dockerfile             multi-stage: React build → gems → slim runtime
```
