# Roadmap

## Phase 1: Repository Baseline

- Create TypeScript project structure.
- Add placeholder schemas, parsers, normalizers, CLI commands, and tests.
- Document scraping policy and workflow.

## Phase 2: Save One Fixture

- Manually choose one IFSC event page.
- Fetch it once with `save:fixture`.
- Save the raw HTML to the fixtures directory.
- Record source URL and date.

## Phase 3: Parse Event Page

- Write failing tests against the cached fixture.
- Parse minimal event metadata.
- Validate assumptions in docs.

## Phase 4: Normalize Event Data

- Map source-specific event data into normalized schemas.
- Preserve source identifiers and source URLs.
- Add Zod validation tests.

## Phase 5: Parse Rankings

- Save a small rankings fixture.
- Parse minimal ranking rows.
- Normalize and validate ranking records.
