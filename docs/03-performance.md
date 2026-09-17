# Performance Considerations

Target from the requirements: list/search and every insight respond in **< 300 ms** at 10,000 employees.

## Measurements

Measured locally (Ruby 3.3, SQLite 3.53, laptop, warm process) against the seeded 10,000 employees,
using `Benchmark.realtime` in `bin/rails runner`:

| Operation | Time |
|-----------|------|
| `db:seed`: generate and insert 10,000 employees | ~2.4 s total |
| List, default sort, page 1 | ~3.5 ms |
| List, page 400 (deepest offset) | ~3.3 ms |
| List filtered by country + job title | ~2.7 ms |
| Org overview (`SalaryInsights.countries`, all 10k salaries) | ~25 ms |
| Country drill-down (`SalaryInsights.country("US")`, ~3k rows) | ~16 ms |

All comfortably inside the budget, with at least 10× headroom.

## What makes it fast

- **Indexes that match the access paths**: `country_code` leads composite indexes with
  `job_title`, `department` and `salary`, because every insight is scoped to a country.
  `full_name` is indexed for the default sort, and `email` has a unique index.
- **Server-side pagination** (max 100 rows per page) and `COUNT(*)` on the same filtered scope.
  The browser never receives 10k rows.
- **Insights read only what they need**: `pluck(:country_code, :salary)` returns plain arrays of
  integers, so no ActiveRecord objects are built. Sorting 10k integers for medians takes microseconds.
- **Bulk seeding**: `insert_all!` in batches of 1,000 inside one transaction, instead of 10,000
  `save` calls with validations and callbacks.
- **Frontend**: TanStack Query caches responses (30 s stale time) and keeps the previous page on
  screen while the next loads. Search is debounced by 300 ms, so typing sends one request, not one
  per keystroke.

## Problems found and fixed during the build

- **Seed generator was O(rows × days)**: `Range#count` on a `Date` range walks every day, and it ran
  once per generated row. The generator spec took 13 s. Precomputing the day span brought the
  whole backend suite back under 1 s.

## When this would need to change

| Signal | Next step |
|--------|-----------|
| 100k+ employees, or insights > 100 ms | Compute count/min/max/avg with SQL `GROUP BY`; use Postgres `percentile_cont` for medians, or cache insights and invalidate on write |
| Many concurrent HR writers | Move from SQLite to Postgres (ActiveRecord code unchanged) |
| Users paging very deep with changing data | Keyset pagination on `(sort_column, id)` |
| Free-text search over large text | SQLite FTS5 / Postgres trigram index instead of `LIKE '%q%'` |
