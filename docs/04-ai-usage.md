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
| Serving the SPA's `index.html` from `public/` would inherit a 1-year cache header, pinning users to an old UI after a deploy | Reviewing the static file server config | `SpaController` serves `index.html` with `no-cache`; only hashed assets are long-cached |

## Product judgement kept in human-reviewable docs

The AI proposed, and the docs explain, choices that are about *correctness for the HR manager*
rather than code:

- Never sum or average salaries **across currencies**. Without trusted FX rates that would give
  leadership wrong numbers, so insights are always per country and charts never mix currencies.
- Percentiles match **Excel's `PERCENTILE.INC`**, so HR can reconcile figures with the spreadsheets
  they are migrating from.
- Currency is **derived from country**, never typed, so a salary can't be recorded in the wrong currency.
- List filters live **in the URL**, so a filtered view can be bookmarked or shared.
