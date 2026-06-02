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
pnpm scrape:event
pnpm scrape:rankings
```

## Current Status

The repo contains placeholder schemas, parsers, normalizers, CLI entry points, and tests. The useful IFSC result data discovered so far is exposed through first-party JSON endpoints rather than the raw event HTML shell.

## Workflow

Before coding, read `AGENTS.md`, the relevant docs in `docs/`, and the current task in `tasks/`. Keep changes small and update `docs/IMPLEMENTATION_LOG.md` after meaningful work.
