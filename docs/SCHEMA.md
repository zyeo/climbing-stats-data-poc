# Schema Notes

Normalized schemas live in `src/schemas`.

All normalized records should preserve source traceability where relevant:

- `source`
- `sourceUrl`
- `sourceEventId`
- `sourceAthleteId`
- `sourceCompetitionId`
- `sourceCategoryRoundId`
- `sourceRouteId`

Current schemas are placeholders and intentionally minimal. They should evolve only when backed by real fixtures and tests.

## Current Fixture-Backed Normalization

The first normalization tests use cached IFSC JSON fixtures for event 1412.

Current app-facing records covered by tests:

- Competition metadata from cached event metadata fixtures.
- Boulder Men event/result context from `/api/v1/events/:eventId/result/3`.
- Boulder Women event/result context from `/api/v1/events/:eventId/result/7`.
- Category rounds from `category_rounds`.
- The first-ranked athlete from `ranking`.
- A minimal event result record using the athlete's final-round score.
- Round result records using the athlete's per-round scores.
- Boulder problem-level results from the athlete's final-round `ascents`.

These tests intentionally keep the schemas small while preserving source traceability fields.

## Bouldering Scope

The first detailed performance schema is bouldering-only.

`BoulderProblemResult` represents one athlete's result on one boulder/problem in one round. It currently preserves:

- Source route ID and route name.
- Points.
- Top and top tries.
- Zone and zone tries.
- Low-zone and low-zone tries when present.
- Links back to normalized result, athlete, event, and round records.

Lead and speed-specific performance details are intentionally deferred until real fixtures and tests justify those schema decisions.

`RoundResult` represents one athlete's rank and score within one round. It bridges the event-level `Result` record and the bouldering problem-level records.

## Source Identifiers

Fixture-backed normalization currently preserves these IFSC identifiers:

- `sourceEventId`: IFSC event ID, such as `1412`.
- `sourceCompetitionId`: currently also the IFSC event ID for competition-level records.
- `sourceAthleteId`: IFSC athlete ID from ranking rows.
- `sourceCategoryRoundId`: IFSC category round ID from `category_rounds`.
- `sourceRouteId`: IFSC route/problem ID from ascent rows.

## Full Fixture Normalization

`normalizeIfscBoulderingEventResult` currently converts a parsed bouldering event result into arrays of normalized records:

- `competition`
- `event`
- `rounds`
- `athletes`
- `results`
- `roundResults`
- `boulderProblemResults`

Fixture-backed tests cover all ranking rows from:

- Event 1412 Boulder Men.
- Event 1478 Boulder Men.
- Event 1478 Boulder Women.
- Event 1405 Boulder Men.
- Event 1405 Boulder Women.

This is still bouldering-only; lead and speed remain out of scope until separate fixtures justify their schema design.
