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
