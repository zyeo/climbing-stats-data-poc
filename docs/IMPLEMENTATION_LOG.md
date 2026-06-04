# Implementation Log

## 2026-05-26

### Created

- Added durable repo instructions in `AGENTS.md`.
- Added project overview in `README.md`.
- Added documentation files under `docs/`:
  - `PROJECT_BRIEF.md`
  - `ROADMAP.md`
  - `IMPLEMENTATION_LOG.md`
  - `DECISIONS.md`
  - `SCHEMA.md`
  - `SCRAPING_POLICY.md`
- Added task handoff files under `tasks/` for the first five planned tasks.
- Added TypeScript project configuration:
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `.gitignore`
- Added placeholder Zod schemas under `src/schemas`.
- Added IFSC source placeholders under `src/sources/ifsc-results`.
- Added cached fixture directory placeholder at `src/sources/ifsc-results/fixtures/.gitkeep`.
- Added placeholder parser tests for event pages and rankings.
- Added placeholder normalizers under `src/normalize`.
- Added CLI entry points:
  - `saveFixture.ts`
  - `scrapeEvent.ts`
  - `scrapeRankings.ts`
- Added utility helpers for cache directory creation and stable IDs.

### Commands Run

```sh
pnpm install
pnpm test
pnpm typecheck
```

### Results

- `pnpm install` completed successfully.
- `pnpm test` passed:
  - 2 test files passed.
  - 4 tests passed.
- `pnpm typecheck` passed.

### Known Limitations

- Parsers only read the HTML `<title>` and return empty placeholder arrays.
- No real IFSC fixture has been saved yet.
- Normalizers use minimal placeholder fields and should evolve from real fixtures.
- CLI commands are intentionally basic and are not a crawling system.
- Tests currently use inline placeholder HTML rather than saved real fixtures.

### Next Recommended Step

Start `tasks/002-save-ifsc-fixture.md`: choose one IFSC result page, fetch it manually at low volume with `pnpm save:fixture`, and record the source URL and fixture purpose before writing real parser tests.

### Git Workflow Update

- Added a `Git Workflow` section to `AGENTS.md`.
- Added git status checks to the task start checklist.
- Documented that commits should be small, reviewable, and explicitly requested before being created.
- Documented concise commit message examples.
- Documented that `pnpm test` and `pnpm typecheck` should be run before recommending a commit when relevant.
- Updated `docs/PROJECT_BRIEF.md` to state that development should proceed through small git-tracked milestones.

### Commands Run For Git Workflow Update

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 2 test files passed.
  - 4 tests passed.
- `pnpm typecheck` passed.

### Git Repository Setup

- Initialized the local git repository.
- Renamed the default branch to `main`.
- Created the first commit:
  - `chore: initialize data POC scaffold`
  - Commit: `96d6d24`
- Confirmed GitHub CLI was installed and authenticated.
- Created the public GitHub repository:
  - `https://github.com/zyeo/climbing-stats-data-poc`
- Pushed local `main` to `origin/main`.

### Task 002: Save IFSC Fixture

Implemented a safe, manual fixture-saving workflow for IFSC Results pages.

Created or updated:

- `src/cli/saveFixture.ts`
- `src/sources/ifsc-results/fetchPage.ts`
- `src/cli/__tests__/saveFixture.test.ts`
- `src/sources/ifsc-results/__tests__/fetchPage.test.ts`
- `docs/SCRAPING_POLICY.md`
- `tasks/002-save-ifsc-fixture.md`

Behavior added:

- `pnpm save:fixture -- --url <url> [--out <fixture-name.html>] [--force]`
- Saves raw HTML into `src/sources/ifsc-results/fixtures/`.
- Fetches only one explicit URL per command.
- Rejects non-IFSC URLs.
- Rejects unsafe output filenames and paths.
- Refuses to overwrite existing fixture files unless `--force` is passed.
- Sends a clear user-agent string.
- Throws helpful errors for non-200 responses and detectable non-HTML responses.

No scraping, parsing, crawling, image fetching, database, frontend, or ML code was added.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 4 test files passed.
  - 16 tests passed.
- `pnpm typecheck` passed.

### Event 1412 Fixture Audit

Saved exactly one IFSC event fixture:

```sh
pnpm save:fixture -- --url "https://ifsc.results.info/event/1412/" --out event-1412.html
```

Created:

- `docs/DATA_SOURCE_AUDIT.md`

Updated:

- `src/cli/saveFixture.ts`
- `src/cli/__tests__/saveFixture.test.ts`

Notes:

- The first attempt exposed that pnpm passes a leading `--` delimiter through to the CLI. The CLI argument parser now tolerates that delimiter.
- `src/sources/ifsc-results/fixtures/event-1412.html` was saved and inspected locally, then removed rather than committed because it is only a Vue app shell and is not needed by tests or documentation.
- The saved HTML appears to be a Vue app shell rather than a server-rendered result page.
- No competition metadata, event labels, round rows, athlete names, athlete profile links, country rows, ranks, or raw scores appear directly in the saved HTML.
- The fixture references client-side modules such as `event_store`, `event_phase_store`, `participant_store`, `athletes_store`, `ascent_store`, and `country_store`.
- No linked assets were fetched during the audit, and no parser logic was implemented.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 4 test files passed.
  - 17 tests passed.
- `pnpm typecheck` passed.

### Event 1412 JSON Endpoint Fixtures

Moved two discovered first-party IFSC JSON responses into the fixture directory:

- `src/sources/ifsc-results/fixtures/event-1412.json`
- `src/sources/ifsc-results/fixtures/event-1412-result-3.json`

Updated:

- `docs/DATA_SOURCE_AUDIT.md`
- `docs/IMPLEMENTATION_LOG.md`

Notes:

- `/api/v1/events/1412` appears to be event metadata.
- `/api/v1/events/1412/result/3` appears to be Boulder Men general ranking/result data.
- Both endpoints worked without cookies or CSRF tokens when requested with JSON headers and a referer from the public event page.
- `result/3` includes `category_rounds`, `ranking`, athlete IDs, countries, ranks, round scores, and ascent details.
- No parser implementation was added.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 4 test files passed.
  - 17 tests passed.
- `pnpm typecheck` passed.

### JSON Fixture Saver

Added a safe manual JSON fixture-saving workflow for first-party IFSC API endpoints.

Created or updated:

- `src/cli/saveJsonFixture.ts`
- `src/cli/__tests__/saveJsonFixture.test.ts`
- `src/sources/ifsc-results/fetchPage.ts`
- `src/sources/ifsc-results/__tests__/fetchPage.test.ts`
- `package.json`
- `README.md`
- `docs/SCRAPING_POLICY.md`
- `docs/DATA_SOURCE_AUDIT.md`

Behavior added:

- `pnpm save:json-fixture -- --url <https://ifsc.results.info/api/...> [--out <fixture-name.json>] [--referer <https://ifsc.results.info/...>] [--force]`
- Saves pretty-printed JSON into `src/sources/ifsc-results/fixtures/`.
- Fetches only one explicit API URL per command.
- Rejects non-IFSC URLs and IFSC URLs outside `/api/`.
- Rejects unsafe output filenames and paths.
- Saves `.json` files only.
- Refuses to overwrite existing fixture files unless `--force` is passed.
- Sends a clear user-agent string and `Accept: application/json`.
- Does not accept cookies, CSRF tokens, auth headers, or arbitrary copied browser headers.

No parser implementation was added.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 5 test files passed.
  - 33 tests passed.
- `pnpm typecheck` passed.

## 2026-06-02

### Event 1478 Comparison Fixture And Initial JSON Parser Tests

Fetched event 1478 metadata using the JSON fixture saver:

```sh
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1478" --out event-1478.json --referer "https://ifsc.results.info/event/1478/general/boulder"
```

Created or updated fixtures:

- `src/sources/ifsc-results/fixtures/event-1478.json`
- `src/sources/ifsc-results/fixtures/event-1478-result-3.json`

Created parser code and fixture-based tests:

- `src/sources/ifsc-results/parseEventJson.ts`
- `src/sources/ifsc-results/__tests__/parseEventJson.test.ts`

Updated:

- `docs/DATA_SOURCE_AUDIT.md`
- `docs/IMPLEMENTATION_LOG.md`

Notes:

- Event 1478 is now documented as a comparison fixture for checking whether JSON endpoint structure is consistent across events.
- The initial parser tests use committed JSON fixtures, not live network requests.
- Parser expectations were chosen by inspecting stable fixture facts once and encoding them in tests.
- The first parser pass showed that some ranking rows can have `rank: null`, so parsed result rankings allow missing ranks.
- No normalization code was added in this step.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 6 test files passed.
  - 37 tests passed.
- `pnpm typecheck` passed.

### Initial Normalization Tests

Started fixture-backed normalization tests that turn parsed IFSC JSON into minimal app schema records.

Created:

- `src/normalize/normalizeEvent.ts`
- `src/normalize/normalizeRound.ts`
- `src/normalize/__tests__/normalizeIfscEventJson.test.ts`

Updated:

- `docs/SCHEMA.md`
- `docs/IMPLEMENTATION_LOG.md`

Coverage added:

- Competition metadata from `event-1412.json`.
- Boulder Men event context from `event-1412-result-3.json`.
- Category rounds from `category_rounds`.
- First-ranked athlete from `ranking`.
- A minimal result record using the athlete's final-round score.
- Boulder problem-level result records for the first-ranked athlete's final-round ascents.
- Round-level result records for the first-ranked athlete's Qualification, Semi-final, and Final scores.
- Representative normalization coverage for event 1478 in addition to event 1412.

Added bouldering-only detailed performance schema:

- `src/schemas/boulderProblemResult.ts`
- `src/schemas/roundResult.ts`
- `src/normalize/normalizeBoulderProblemResult.ts`
- `src/normalize/normalizeRoundResult.ts`

Updated parser output:

- `parseEventResultJson` now preserves ascent details needed for bouldering problem-level normalization.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 7 test files passed.
  - 38 tests passed.
- `pnpm typecheck` passed.

### Full Bouldering Fixture Normalization

Added a source-specific full bouldering normalizer:

- `src/normalize/normalizeIfscEventResult.ts`
- `src/normalize/__tests__/normalizeIfscFullEventResult.test.ts`

Coverage:

- Normalizes every Boulder Men ranking row from event 1412.
- Normalizes every Boulder Men ranking row from event 1478.
- Validates expected counts for athletes, event results, round results, and boulder problem results.
- Covers known fixture edge cases:
  - Event 1412 has two unranked/DNS event results.
  - Event 1412 has `lowZone` absent after source `null`.
  - Event 1478 has boolean `lowZone` values.
- Rejects non-bouldering parsed result data.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 8 test files passed.
  - 42 tests passed.
- `pnpm typecheck` passed.

### Source Traceability Fields

Strengthened normalized source traceability fields.

Updated schemas and normalizers to preserve:

- `sourceEventId`
- `sourceAthleteId`
- `sourceCategoryRoundId`
- `sourceRouteId`

Notes:

- `sourceCompetitionId` remains on competition/event records and currently stores the IFSC event ID for these fixtures.
- `docs/SCHEMA.md` now documents current source identifier semantics.

### IFSC Bouldering Edge Case Tests

Added explicit tests for edge cases found in the cached fixtures:

- Event 1412 has two DNS/unranked athletes with `rank: null`.
- Qualification rows can have `startingGroup`, while later rounds do not.
- Event 1412 has source `low_zone: null`, normalized as absent `lowZone`.
- Event 1478 has boolean `low_zone` values, normalized as `lowZone`.

### Bouldering Normalization Milestone Docs

Updated durable planning docs after completing the first bouldering normalization pass.

Updated:

- `docs/ROADMAP.md`
- `tasks/004-normalize-event-data.md`
- `docs/IMPLEMENTATION_LOG.md`

Current milestone summary:

- Raw event HTML is no longer the primary parser target because it is a Vue app shell.
- First-party JSON fixtures are the source target for the POC.
- Bouldering-only parser and normalization tests now cover two events.
- Lead, speed, crawling, database, frontend, and prediction work remain out of scope.

## 2026-06-03

### Women Boulder And Older Event Fixture Comparison

Saved additional first-party IFSC JSON fixtures with the manual JSON fixture saver:

```sh
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1478/result/7" --out event-1478-result-7.json --referer "https://ifsc.results.info/event/1478/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1405" --out event-1405.json --referer "https://ifsc.results.info/event/1405/"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1405/result/3" --out event-1405-result-3.json --referer "https://ifsc.results.info/event/1405/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1405/result/7" --out event-1405-result-7.json --referer "https://ifsc.results.info/event/1405/general/boulder"
```

Added fixtures:

- `src/sources/ifsc-results/fixtures/event-1478-result-7.json`
- `src/sources/ifsc-results/fixtures/event-1405.json`
- `src/sources/ifsc-results/fixtures/event-1405-result-3.json`
- `src/sources/ifsc-results/fixtures/event-1405-result-7.json`

Updated tests:

- Parser tests now cover event 1405 metadata and Boulder Men/Women result summaries.
- Full normalization tests now cover all ranking rows, round rows, and boulder ascent rows for current Boulder Men/Women fixtures.
- Added explicit Women Boulder normalization coverage using event 1478's first-ranked athlete.

Documented findings:

- Event metadata exposes `full_results_url` values for each discipline/category.
- In the inspected bouldering fixtures, `result/3` maps to Boulder Men and `result/7` maps to Boulder Women.
- Future code should continue to use metadata and response `dcat` values rather than assuming result IDs globally.
- Event 1405 gives an older World Cup comparison with `low_zone: null`, while event 1478 Women preserves boolean `low_zone` values.

Verification so far:

```sh
pnpm test
```

Results:

- `pnpm test` passed:
  - 8 test files passed.
  - 54 tests passed.

Known limitations:

- This remains bouldering-only.
- No round-level endpoint parser has been implemented yet.
- No live network calls are used in tests.

### Category Round Fixture Comparison And Local Report CLI

Saved one category-round JSON fixture for event 1478 Boulder Women Final:

```sh
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/category_rounds/10668/results" --out category-round-10668-results.json --referer "https://ifsc.results.info/event/1478/general/boulder"
```

Added:

- `src/sources/ifsc-results/fixtures/category-round-10668-results.json`
- `parseCategoryRoundResultsJson` in `src/sources/ifsc-results/parseEventJson.ts`
- Fixture-backed parser tests comparing the round endpoint with the final-round slice of `event-1478-result-7.json`
- `src/cli/reportFixture.ts`
- `src/cli/__tests__/reportFixture.test.ts`
- `pnpm report:fixture`

Findings:

- The category-round endpoint is a round-specific shape with `points_per_boulder_settings`, `routes`, `ranking`, `start_order`, and ascent details.
- For the tested Women Boulder final round, the round endpoint matches the full event result's final-round ranking/ascent data.
- The full event result endpoint remains the best primary input for the current normalizer because it contains all rounds in one fixture.
- Category-round endpoints are useful optional enrichment fixtures for route lists, start order, scoring settings, appeals, and live-state fields.

Local report command run:

```sh
pnpm report:fixture -- --event 1478 --result 7
```

Result summary:

- Competition: `World Climbing Series Bern 2026`
- Result: `BOULDER Women`
- Athletes/results: 75
- Round results: 107
- Boulder problem results: 503
- Low-zone counts: 416 true, 87 false, 0 absent

Verification so far:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 9 test files passed.
  - 60 tests passed.
- `pnpm typecheck` passed.

### Round Start Order Normalization

Promoted athlete round start order into the normalized `RoundResult` schema.

Updated:

- `src/schemas/roundResult.ts`
- `src/normalize/normalizeRoundResult.ts`
- `src/normalize/normalizeIfscEventResult.ts`
- `src/sources/ifsc-results/parseEventJson.ts`
- `src/normalize/__tests__/normalizeRoundResult.test.ts`
- `docs/SCHEMA.md`
- `docs/DATA_SOURCE_AUDIT.md`
- `docs/DECISIONS.md`
- `tasks/004-normalize-event-data.md`

Notes:

- `RoundResult.startOrder` is optional because the full event result fixtures inspected so far do not include `start_order`.
- Category-round fixtures do include `start_order`, and fixture-backed tests now prove it can be normalized.
- Boulder scoring settings remain source-only for now; they are parsed/documented but not promoted into normalized schemas.

Verification so far:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 10 test files passed.
  - 62 tests passed.
- `pnpm typecheck` passed.

### Shared Boulder Problem Normalization

Added first-class normalized boulder/problem records for bouldering analysis.

Created:

- `src/schemas/boulderProblem.ts`
- `src/normalize/normalizeBoulderProblem.ts`
- `src/normalize/__tests__/normalizeBoulderProblem.test.ts`

Updated:

- `src/schemas/boulderProblemResult.ts`
- `src/normalize/normalizeBoulderProblemResult.ts`
- `src/normalize/normalizeIfscEventResult.ts`
- `src/normalize/__tests__/normalizeIfscEventJson.test.ts`
- `src/normalize/__tests__/normalizeIfscFullEventResult.test.ts`
- `src/cli/reportFixture.ts`
- `src/cli/__tests__/reportFixture.test.ts`
- `docs/SCHEMA.md`
- `docs/DECISIONS.md`
- `docs/ROADMAP.md`
- `tasks/004-normalize-event-data.md`

Notes:

- `BoulderProblem` represents the shared boulder/route within a round.
- `BoulderProblemResult` now links to the shared problem with `boulderProblemId`.
- Current full bouldering fixtures mostly normalize to 18 shared boulder problem records:
  - 10 qualification source route records across two starting groups.
  - 4 semifinal problems.
  - 4 final problems.
- This route inventory does not mean each athlete climbs 10 qualification boulders; each athlete's qualification row has 5 ascent records.
- The report CLI now prints both shared `boulderProblems` and athlete-level `boulderProblemResults`.

Local report command run:

```sh
pnpm report:fixture -- --event 1478 --result 7
```

Result summary:

- Shared boulder problems: 18
- Athlete boulder problem results: 503

Verification so far:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 11 test files passed.
  - 63 tests passed.
- `pnpm typecheck` passed.

### 2025 Men Boulder World Cup Experiment Seed

Started an explicitly exploratory, manifest-driven analysis dataset for 2025 IFSC World Cup Men Boulder.

Created:

- `experiments/2025-men-boulder-world-cup/README.md`
- `experiments/2025-men-boulder-world-cup/manifest.json`
- `src/experiments/menBoulderWorldCup2025.ts`
- `src/experiments/__tests__/menBoulderWorldCup2025.test.ts`

Updated:

- `README.md`
- `docs/DECISIONS.md`
- `docs/POC_CHECKPOINT.md`
- `docs/IMPLEMENTATION_LOG.md`

Notes:

- The manifest is intentionally partial and starts with existing committed fixtures only:
  - Event 1405: `IFSC World Cup Keqiao 2025`
  - Event 1412: `IFSC World Cup Innsbruck 2025`
- The experiment is scoped to 2025, World Cup, Boulder, Men.
- Tests validate the manifest and normalize every listed event from cached fixtures.
- This does not add crawling, bulk fetching, live-network tests, ML, database, frontend, lead, or speed code.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 12 test files passed.
  - 65 tests passed.
- `pnpm typecheck` passed.

### Exploratory Report And Season Analysis Summaries

Expanded local exploratory reporting while keeping generated outputs out of git.

Updated:

- `.gitignore`
- `package.json`
- `README.md`
- `experiments/2025-men-boulder-world-cup/README.md`
- `docs/POC_CHECKPOINT.md`
- `docs/IMPLEMENTATION_LOG.md`
- `src/cli/reportFixture.ts`
- `src/cli/__tests__/reportFixture.test.ts`

Created:

- `src/cli/analyzeMenBoulderWorldCup2025.ts`
- `src/cli/__tests__/analyzeMenBoulderWorldCup2025.test.ts`

Behavior added:

- `reports/` is git-ignored for local generated report outputs.
- `pnpm report:fixture` now includes:
  - overall top, zone, and low-zone counts
  - per-round attempt/top/zone summaries
  - per-boulder attempt/top-rate/zone-rate summaries
  - existing qualification group-aware summaries
- `pnpm analyze:2025-men-boulder` reads the committed 2025 Men Boulder World Cup manifest and reports:
  - event count and normalized row totals
  - top and zone totals
  - per-event top and zone rates
  - per-round top and zone rates
  - qualification grouping shapes
  - repeated athlete counts across the six events

Current season-level analysis totals:

- 6 events
- 479 athlete event-result rows
- 675 athlete round-result rows
- 103 shared boulder/problem records
- 3,179 athlete boulder/problem result rows
- 897 tops
- 2,157 zones
- 185 unique athletes
- 112 athletes appearing in multiple events

Boundary note:

- These commands are descriptive, fixture-backed POC tools.
- They do not fetch live data.
- They do not add frontend, database, ML, prediction, crawling, lead, or speed scope.

Verification:

```sh
pnpm report:fixture -- --event 1408 --result 3
pnpm report:fixture -- --event 1478 --result 7
pnpm analyze:2025-men-boulder
pnpm test
pnpm typecheck
```

Results:

- `pnpm report:fixture -- --event 1408 --result 3` reported top/zone/low-zone counts, round summaries, boulder summaries, and one qualification route set.
- `pnpm report:fixture -- --event 1478 --result 7` reported top/zone/low-zone counts, round summaries, boulder summaries, and Group A/B qualification route sets.
- `pnpm analyze:2025-men-boulder` completed from committed fixtures.
- `pnpm test` passed:
  - 13 test files passed.
  - 69 tests passed.
- `pnpm typecheck` passed.

### Group-Aware Qualification Report Summary

Added qualification grouping details to the local fixture report CLI.

Updated:

- `src/cli/reportFixture.ts`
- `src/cli/__tests__/reportFixture.test.ts`
- `docs/DECISIONS.md`
- `docs/IMPLEMENTATION_LOG.md`

Behavior added:

- Reports the unique per-athlete qualification ascent counts.
- Reports the qualification route inventory size.
- Reports route sets by `startingGroup` when the source exposes Group A and Group B.
- Reports one ungrouped route set when the source does not expose qualification groups, as in event 1408 Curitiba.

Examples:

- Event 1478 Boulder Women reports 10 qualification route records split into Group A and Group B, with 5 qualification ascents per athlete.
- Event 1408 Boulder Men reports one 5-route qualification set, with 5 qualification ascents per athlete.

Verification:

```sh
pnpm report:fixture -- --event 1478 --result 7
pnpm report:fixture -- --event 1408 --result 3
pnpm test
pnpm typecheck
```

Results:

- `pnpm report:fixture -- --event 1478 --result 7` reported 5 qualification ascents per athlete and 10 route records split across Group A and Group B.
- `pnpm report:fixture -- --event 1408 --result 3` reported 5 qualification ascents per athlete and one ungrouped 5-route qualification set.
- `pnpm test` passed:
  - 12 test files passed.
  - 67 tests passed.
- `pnpm typecheck` passed.

### Bouldering Data Model Overview

Added a durable model overview and bouldering POC conclusion.

Created:

- `docs/DATA_MODEL.md`

Updated:

- `README.md`
- `docs/ROADMAP.md`
- `docs/SCHEMA.md`
- `tasks/004-normalize-event-data.md`
- `docs/IMPLEMENTATION_LOG.md`

Notes:

- `docs/DATA_MODEL.md` documents the current normalized bouldering relationships:
  - `Competition -> Event -> Round -> BoulderProblem`
  - `Athlete -> Result -> RoundResult`
  - `BoulderProblem -> BoulderProblemResult`
- The document records current fixture coverage and the source-only fields that should not be normalized yet.
- The roadmap now marks bouldering retrieval, parsing, and normalization as sufficiently proven for the current POC scope.
- No new scraping, parsing, normalization, analytics, database, frontend, lead, or speed code was added in this step.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 11 test files passed.
  - 63 tests passed.
- `pnpm typecheck` passed.

### POC Checkpoint

Added a durable proof-of-concept checkpoint.

Created:

- `docs/POC_CHECKPOINT.md`

Updated:

- `README.md`
- `docs/ROADMAP.md`
- `docs/IMPLEMENTATION_LOG.md`

Notes:

- The checkpoint records that bouldering retrieval, fixture caching, parsing, normalization, validation, testing, and documentation are sufficiently proven for the current POC scope.
- It documents what the future app should reuse, what it should not inherit blindly, known limitations, and open decisions.
- It recommends pausing feature work in this repo unless a specific new data-shape question appears.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 11 test files passed.
  - 63 tests passed.
- `pnpm typecheck` passed.

### Complete 2025 Men Boulder World Cup Fixture Set

Completed the exploratory 2025 IFSC World Cup Men Boulder dataset with the remaining official Boulder World Cup stops listed by IFSC Results.

Already present:

- Event 1405: `IFSC World Cup Keqiao 2025`
- Event 1412: `IFSC World Cup Innsbruck 2025`

Added metadata and Boulder Men result fixtures:

- Event 1408: `IFSC World Cup Curitiba 2025`
- Event 1409: `IFSC World Cup Salt Lake City 2025`
- Event 1410: `IFSC World Cup Prague 2025`
- Event 1411: `IFSC World Cup Bern 2025`

Fixture commands run:

```sh
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1408" --out event-1408.json --referer "https://ifsc.results.info/event/1408/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1408/result/3" --out event-1408-result-3.json --referer "https://ifsc.results.info/event/1408/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1409" --out event-1409.json --referer "https://ifsc.results.info/event/1409/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1409/result/3" --out event-1409-result-3.json --referer "https://ifsc.results.info/event/1409/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1410" --out event-1410.json --referer "https://ifsc.results.info/event/1410/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1410/result/3" --out event-1410-result-3.json --referer "https://ifsc.results.info/event/1410/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1411" --out event-1411.json --referer "https://ifsc.results.info/event/1411/general/boulder"
pnpm save:json-fixture -- --url "https://ifsc.results.info/api/v1/events/1411/result/3" --out event-1411-result-3.json --referer "https://ifsc.results.info/event/1411/general/boulder"
```

Updated:

- `experiments/2025-men-boulder-world-cup/manifest.json`
- `experiments/2025-men-boulder-world-cup/README.md`
- `src/experiments/menBoulderWorldCup2025.ts`
- `src/experiments/__tests__/menBoulderWorldCup2025.test.ts`
- `docs/DATA_MODEL.md`
- `docs/SCHEMA.md`
- `docs/IMPLEMENTATION_LOG.md`

Normalized dataset totals:

- 6 event result fixtures
- 479 athlete event-result rows
- 103 shared boulder/problem records
- 3,179 athlete boulder/problem result rows

Fixture size notes:

- The eight newly added fixture files total about 1.1 MB.
- The full IFSC fixture directory is about 2.5 MB.
- This is small enough for the laptop and public repository at the current exploratory scale.

Known fixture-shape note:

- Every athlete in the current 2025 Men Boulder World Cup fixtures has 5 qualification ascent rows.
- Most current full bouldering fixtures normalize to 18 shared boulder problem records because the source exposes two separate qualification route sets: 5 boulders for Group A and 5 boulders for Group B, plus 4 semifinal and 4 final boulders.
- Event 1408 Curitiba normalizes to 13 shared boulder problems because the source does not expose separate Group A and Group B qualification route sets; its athlete rows expose one 5-boulder qualification route set, plus 4 semifinal and 4 final boulders.

Verification:

```sh
pnpm test
pnpm typecheck
```

Results:

- `pnpm test` passed:
  - 12 test files passed.
  - 65 tests passed.
- `pnpm typecheck` passed.
