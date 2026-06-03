# POC Checkpoint

Date: 2026-06-03

## Summary

The bouldering data proof-of-concept has done its main job.

It has proven that public first-party IFSC JSON responses from `ifsc.results.info` can be manually fetched at low volume, cached as fixtures, parsed, normalized, validated, tested, and documented without building a crawler, frontend, database, or prediction system.

The strongest conclusion is narrow but useful:

> For bouldering event results, the future app can likely use first-party IFSC JSON endpoints as the source input, as long as fetching remains responsible and the app keeps source-specific parsing separate from normalized application data.

## What We Proved

### Source Access

- Raw event HTML pages are Vue app shells and do not contain useful result tables directly.
- Useful data is available in first-party JSON endpoints used by the IFSC site.
- Event metadata endpoints such as `/api/v1/events/:eventId` expose discipline/category result URLs.
- Event result endpoints such as `/api/v1/events/:eventId/result/:resultId` expose bouldering rankings, round scores, and ascent details.
- Category-round endpoints such as `/api/v1/category_rounds/:categoryRoundId/results` expose round-local details such as start order, routes, and scoring settings.

### Responsible Fixture Workflow

- `pnpm save:json-fixture` can save one explicit JSON API URL at a time.
- The fixture saver rejects non-IFSC URLs, non-API URLs, unsafe filenames, and non-JSON responses.
- The workflow does not store cookies, CSRF tokens, auth headers, copied browser-private headers, or athlete images.
- Tests use cached fixtures only and do not make live network calls.

### Bouldering Parsing

The parser now handles cached first-party JSON for:

- Event metadata.
- Full bouldering event results.
- One category-round result shape.

Current fixture coverage includes:

- Event 1412 Boulder Men.
- Event 1478 Boulder Men.
- Event 1478 Boulder Women.
- Event 1405 Boulder Men.
- Event 1405 Boulder Women.
- Event 1478 Boulder Women Final category-round endpoint.

### Bouldering Normalization

The normalized bouldering model currently includes:

- `Competition`
- `Event`
- `Round`
- `Athlete`
- `Result`
- `RoundResult`
- `BoulderProblem`
- `BoulderProblemResult`

The model supports boulder-level analysis structurally because athlete ascent rows point back to shared `BoulderProblem` records.

### Validation And Tests

- Zod schemas validate normalized records.
- Fixture-backed tests cover parsing, normalization, edge cases, and CLI behavior.
- Current verification passes with 11 test files and 63 tests.

## Known Limitations

### Scope Limitations

- This POC only proves bouldering.
- Lead and speed are intentionally untouched.
- No database schema has been designed.
- No frontend data consumption has been built.
- No crawling or bulk discovery system exists.
- No prediction or ML logic exists.

### Source Limitations

- The API endpoints are first-party but not documented by IFSC in this repo.
- Endpoint stability is inferred from a small fixture set, not guaranteed.
- Result IDs such as `result/3` and `result/7` should be discovered from event metadata rather than treated as global constants.
- Category-round endpoints contain useful extra fields, but most are not yet normalized.

### Model Limitations

- `sourceCompetitionId` currently uses the IFSC event ID because the fixture shape does not yet justify a separate competition identity.
- Boulder scoring settings remain source-only.
- Round live-state fields, appeal fields, and invisible score fields remain source-only.
- Fixture coverage is good for a POC, but not broad enough to claim all bouldering formats and years are handled.

## What The Future App Should Reuse

The future app should reuse these ideas:

- Manual or controlled fixture-based development before broad ingestion.
- Strict separation between source-specific parsing and normalized app schemas.
- Source traceability fields such as source URL and source IDs.
- Fixture-only parser and normalizer tests.
- Bouldering model shape:
  - shared `BoulderProblem`
  - athlete-level `BoulderProblemResult`
  - per-round `RoundResult`
- Conservative treatment of optional source fields.

The future app can likely reuse some TypeScript code directly, but it should first decide whether this POC becomes:

- a source ingestion package,
- a set of schema definitions,
- a fixture/test reference,
- or simply documentation for a new implementation.

## What The Future App Should Not Inherit Blindly

The future app should not blindly inherit:

- Any assumption that all disciplines look like bouldering.
- Any assumption that IFSC result IDs are globally fixed.
- Any broad scraping behavior.
- The placeholder `scrape:event` and `scrape:rankings` commands as production commands.
- The current `sourceCompetitionId` semantics without revisiting competition identity.
- A database schema copied directly from the current normalized TypeScript records.

## Open Decisions

Before building the real app, decide:

- Whether this repo remains a POC only or becomes an ingestion library.
- Whether normalized schemas should be versioned.
- Whether fixtures should stay committed or move to a separate fixture package later.
- How to model competition identity separately from IFSC event identity.
- Whether boulder scoring settings deserve a normalized `RoundScoringConfig`.
- How to handle endpoint changes or missing data.
- When, if ever, to audit lead and speed fixtures.

## Recommendation

Pause feature work in this repo.

The bouldering retrieval, parsing, normalization, validation, testing, and documentation path is sufficiently proven for the current POC. More bouldering code should wait until there is a specific new data-shape question.

Good next non-coding step:

> Decide whether the next project is the real app architecture plan or a small ingestion package extracted from this POC.

Do not start crawling, database work, frontend work, lead/speed modeling, or analytics expansion from this repo by default.
