# Requirements — ACME Salary Management

> One-page requirements document, written before any code.

## Goal

Give ACME's HR Manager one web tool that replaces the salary spreadsheets for ~10,000
employees in several countries. It should let them:

1. **Manage** salary records reliably (no more copy-paste mistakes or conflicting file versions).
2. **Answer questions about how the org pays people**, e.g. *"What do we pay Software Engineers
   in India?"*, *"Which country has the widest pay range?"*, *"How many people do we employ in Germany?"*

## Persona

**HR Manager**: knows compensation well, is comfortable in Excel, and is not technical. They care
about accurate numbers, finding a person quickly, and trusting the aggregates they present to
leadership.

## Scope & Features (in)

| # | Feature | Why it matters |
|---|---------|----------------|
| F1 | **Employee directory**: paginated table of all employees, with search by name/email and filters by country, department and job title; sortable columns | Finding one record among 10k in Excel is the main daily pain |
| F2 | **Add / edit / remove employee**: full name, email, job title, department, country, annual salary, hire date, with server-side validation and clear error messages | Core "manage" job; validation prevents the bad data spreadsheets allow |
| F3 | **Salary stored in the employee's local currency** (currency derived from country) | Pay is set and paid locally; converting at entry would distort the data |
| F4 | **Country insights**: headcount, min / max / average / median salary for a country | "How do we pay people in X?" is the core question |
| F5 | **Job-title and department breakdown within a country**: headcount, min / avg / max per title | Supports pay-equity and offer-benchmarking questions |
| F6 | **Org overview**: headcount and salary range per country on one screen | The leadership-level summary HR gets asked for |
| F7 | **Seed script** generating 10,000 realistic, deterministic employees | Realistic volume for the demo, performance checks and development |

### Non-functional requirements
- **Performance**: list/search and every insight respond in < 300 ms on 10k rows (indexed queries, server-side pagination, aggregation in SQL).
- **Correctness**: salaries are integers (no floating-point money); aggregates are computed in the database or in pure, unit-tested code.
- **Quality**: fast, deterministic automated tests for the domain, API and UI; incremental commits.
- **Deployability**: one Docker image that serves both the API and the UI.

## Deliberately left out (and why)

| Left out | Reasoning |
|----------|-----------|
| **Authentication / roles** | Single persona, and auth adds nothing to the product question being assessed. Production would put this behind company SSO, the lowest-effort secure option. The API is structured so a `before_action` guard is a one-line addition. |
| **Currency conversion / cross-country totals in one currency** | Needs a trusted, dated FX source; stale or invented rates would give leadership **wrong numbers**. Insights are therefore always *per country*, in local currency. Cross-country comparison is shown as headcount and ranges side by side, not summed. |
| **Salary history / audit trail** | Valuable (raises, compliance), but it doubles the data model. It is the natural next feature, and the schema allows adding a `salary_changes` table without migrating existing data. |
| **Bulk Excel/CSV import & export** | The migration path off Excel matters, but the seed script already proves bulk loading. Import needs its own UX for validation errors per row, so it gets its own iteration. |
| **Payroll, tax, bonuses, equity, benefits** | Different domain (payroll processing), not salary *management*. |
| **Org hierarchy / managers** | Not needed to answer the "how do we pay people" questions. |
| **Multi-tenant / multiple organisations** | The brief is for one org (ACME). |

## Success criteria
- The HR Manager can find any employee in two interactions or fewer (search or filter).
- The HR Manager can answer "min/max/avg/median salary for job title X in country Y" without leaving the app.
- `bin/rails db:seed` loads 10,000 employees in a few seconds.
- The whole test suite runs in well under a minute.
