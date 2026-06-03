# climbing-stats-data-poc

A data feasibility proof-of-concept for responsibly fetching, caching, parsing, normalizing, validating, testing, and documenting IFSC competition results data from `ifsc.results.info`.

This is not the final climbing stats app. It is a small TypeScript workspace for learning what data can be extracted safely and reliably.

## Stack

- TypeScript
- pnpm
- Vitest
- Zod
- Cheerio
- tsx

## Scripts

```sh
pnpm test
pnpm typecheck
pnpm save:fixture
pnpm save:json-fixture
pnpm report:fixture
pnpm scrape:event
pnpm scrape:rankings
```

## Current Status

The repo now has a fixture-backed bouldering proof-of-concept for IFSC first-party JSON endpoints. It can save manual JSON fixtures, parse bouldering result data, normalize shared boulder/problem records and athlete result rows, and verify the pipeline with cached fixture tests only.

See `docs/DATA_MODEL.md` for the current normalized bouldering relationships.

See `docs/POC_CHECKPOINT.md` for the current POC conclusion and recommended pause point.

## Workflow

Before coding, read `AGENTS.md`, the relevant docs in `docs/`, and the current task in `tasks/`. Keep changes small and update `docs/IMPLEMENTATION_LOG.md` after meaningful work.
