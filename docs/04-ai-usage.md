# How AI Was Used

The solution was built with **Claude Code** (Anthropic's agentic coding CLI) working in this
repository. This document records how the work was directed and checked, and where the AI got
things wrong.

## The brief given to the agent

The assessment PDF was attached, together with the Incubyte email text ("think deeply about problems
before coding, make pragmatic design decisions, build maintainable systems, use AI intentionally..."),
and this instruction:

> "please check this attachment and must follow everything and also commit progress step by step according to it"

## Human decisions (asked, not assumed)

Before writing code the agent stopped to ask about the two things that depend on the candidate,
not on the problem:

| Question | Answer |
|----------|--------|
| Backend stack matching the role applied for | **Ruby on Rails** |
| Deployment target | **Dockerfile only** (host chosen later) |

Everything else (scope, data model, API, UI library) was proposed in the requirements and design
docs **before** implementation, so it could be reviewed up front.

## Working agreement the agent followed

1. **Requirements first, then design, then code**, each committed separately so the history shows the order.
2. **Test-first for domain logic and UI behaviour**: write specs, run them to see them fail, implement, run again.
3. **Small, meaningful commits** (conventional commit prefixes), each leaving the suite green.
4. **Verify, don't assume**: newly released library versions (Rails 8.1, Mantine 9, Vitest 5,
   React Router 8) were checked against the installed type definitions before use, not written from memory.
5. **Keep docs honest**: when the implementation diverged from the design (statistics computed in
   Ruby rather than SQL), the design doc was updated in the same commit.

## Where AI output was wrong, and how it was caught

| Issue | How it surfaced | Fix |
|-------|-----------------|-----|
| `json` 3.0 was resolved by Bundler and breaks ActiveSupport 8.1's `JSON.parse` call | Request specs returned 400 for every JSON body | Pinned `json ~> 2.10`, with a comment explaining why |
| Seed generator used `Range#count` on dates (walks every day, per row) | Generator spec took 13 s | Precomputed the day span; suite back to < 1 s |
| A UI test asserted `page` was *absent* after a search, but the app correctly sends `page=1` | Test failed; behaviour was inspected before changing anything | Fixed the assertion, not the code |
| npm 10.9 crashed (`edgesOut` of null) resolving the frontend tree | `npm install` failed even from a clean state | Switched the frontend to pnpm (recorded in `packageManager`) |
| Rails' generated production config had no database path and forced SSL unconditionally | Reviewing config before writing the Dockerfile | `DATABASE_PATH` with a default; `FORCE_SSL` env toggle; `/up` exempt from the redirect |
| CI used `db:prepare`, which also seeds a newly created database, so the specs ran against 10,000 employees | First GitHub Actions run failed 16 specs that passed locally (the local test DB already existed) | Reproduced on a fresh DB, switched CI to `db:schema:load` |
| Serving the SPA's `index.html` from `public/` would inherit a 1-year cache header, pinning users to an old UI after a deploy | Reviewing the static file server config | `SpaController` serves `index.html` with `no-cache`; only hashed assets are long-cached |

## Final verification pass

After the build was "done", the user asked for the implementation to be verified against the brief.
Two independent checks ran:

1. **An independent reviewer agent** read the code without being told what the author thought was
   correct. It was limited to GET requests against the live instance, so it couldn't damage data.
2. **The full test suite was rerun as three copies at once** to simulate a slow CI runner, since the
   brief asks for *deterministic* tests.

Every finding was reproduced before fixing. Each fix got a test that fails without the fix and passes
with it (confirmed by running the new tests against the old code):

| Finding | Evidence | Fix |
|---------|----------|-----|
| `?page=9223372036854775807` returned **500** (SQLite offset overflow) | `curl` against the running app | Page clamped to the last page |
| A page past the end (e.g. after deleting its last row) showed "No employees match" and "Showing 51–50 of 50" | API returned `data: []` with `total > 0` | Server returns the last page instead |
| Sorting by Country used ISO codes, so United Kingdom (GB) sorted before India | Live API response | Sort by country name (CASE built from the constant list) |
| Hire-date check used the **UTC** date, so HR in India couldn't enter today's hire before 05:30 | Code review | Server allows up to the furthest time zone (UTC+14); the form uses the local date |
| Currency was re-derived on every save, contradicting the design doc | Doc vs code comparison | Derive only on create or country change; the form warns that amounts aren't converted |
| Two simultaneous saves with one email → unique index → **500** | Code review | `RecordNotUnique` mapped to a 422 field error |
| The search box drifted from the URL (nav link, Back, Clear filters racing a pending search) | Code review | Extracted `useSearchInput` |
| **The first fix for the search box itself lost keystrokes** ("priya" became "pria") when a search landed mid-typing | Found only by the load test; a normal UI test couldn't reproduce it | The hook ignores the URL echo of its own search; pinned by a fake-timer test that fails on the buggy version every time |
| First click on "Name" did nothing (default sort was implicit) | Code review | Treat a missing sort as `full_name` |
| 8–9 UI tests exceeded the 5 s default under load | Load test | Raised test and async-lookup timeouts; timing-sensitive logic moved to fake-timer hook tests |

Lesson recorded: passing tests on an idle laptop weren't enough evidence. The independent review
and the load test each found problems the other missed.

## Product judgement kept in human-reviewable docs

The AI proposed, and the docs explain, choices that are about *correctness for the HR manager*
rather than code:

- Never sum or average salaries **across currencies**. Without trusted FX rates that would give
  leadership wrong numbers, so insights are always per country and charts never mix currencies.
- Percentiles match **Excel's `PERCENTILE.INC`**, so HR can reconcile figures with the spreadsheets
  they are migrating from.
- Currency is **derived from country**, never typed, so a salary can't be recorded in the wrong currency.
- List filters live **in the URL**, so a filtered view can be bookmarked or shared.
