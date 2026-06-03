# Roadmap

## Phase 1: Repository Baseline

- Create TypeScript project structure.
- Add placeholder schemas, parsers, normalizers, CLI commands, and tests.
- Document scraping policy and workflow.
- Status: Done.

## Phase 2: Save One Fixture

- Manually choose one IFSC event page.
- Fetch it once with `save:fixture`.
- Save the raw HTML to the fixtures directory.
- Record source URL and date.
- Status: Superseded by JSON endpoint discovery. The raw HTML event page was a Vue app shell, so useful result data now comes from first-party JSON fixtures.

## Phase 3: Parse IFSC JSON Fixtures

- Write failing tests against cached JSON fixtures.
- Parse minimal event metadata and bouldering result data.
- Validate assumptions in docs.
- Status: Done for current event metadata and Boulder Men/Women result fixtures.

## Phase 4: Normalize Bouldering Event Data

- Map source-specific event data into normalized schemas.
- Preserve source identifiers and source URLs.
- Add Zod validation tests.
- Status: Done for current Boulder Men/Women fixtures from events 1412, 1478, and 1405.

## Phase 5: Expand Bouldering Coverage

- Add more manually selected bouldering fixtures only when they test a new shape or edge case.
- Compare one round-level endpoint shape such as `category_rounds[*].result_url`.
- Decide whether normalized exports should include a small CLI/report for fixture inspection.
- Keep tests fixture-based and avoid live network requests.
- Status: Done for one Women Boulder final-round endpoint and a local fixture report CLI.

## Phase 6: Next Data Feasibility Questions

- Decide whether to add round-local normalized fields such as start order and boulder scoring settings.
- Add one lead fixture only when ready to design a separate lead-specific shape.
- Add one speed fixture only when ready to design a separate speed-specific shape.
- Keep avoiding crawl/discovery automation until the source model is stable.

## Later Phases

- Design lead-specific parsing and normalization only after saving lead fixtures.
- Design speed-specific parsing and normalization only after saving speed fixtures.
- Defer crawling, database, frontend, and prediction work.
