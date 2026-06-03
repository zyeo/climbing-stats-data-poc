# Schema Notes

Normalized schemas live in `src/schemas`.

All normalized records should preserve source traceability where relevant:

- `source`
- `sourceUrl`
- `sourceAthleteId`
- `sourceCompetitionId`

Current schemas are placeholders and intentionally minimal. They should evolve only when backed by real fixtures and tests.

## Current Fixture-Backed Normalization

The first normalization tests use cached IFSC JSON fixtures for event 1412.

Current app-facing records covered by tests:

- Competition metadata from `/api/v1/events/1412`.
- Boulder Men event/result context from `/api/v1/events/1412/result/3`.
- Category rounds from `category_rounds`.
- The first-ranked athlete from `ranking`.
- A minimal event result record using the athlete's final-round score.
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
