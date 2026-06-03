# Task 004: Normalize Event Data

Status: Done for the bouldering proof-of-concept first pass

## Goal

Normalize parsed IFSC event data into app-facing Zod schemas.

## Notes

- Preserve source traceability fields.
- Keep normalized schemas in `src/schemas`.
- Update `docs/SCHEMA.md` when fields become real.

## Update

Initial fixture-backed normalization tests now cover event 1412, event 1478, and event 1405 metadata plus Boulder Men and Boulder Women result data. The first pass validates minimal Competition, Event, Round, Athlete, Result, RoundResult, and bouldering-only BoulderProblemResult records with source traceability fields preserved.

Full-fixture tests now normalize every Boulder Men/Women ranking row from the current bouldering result fixtures, including all round rows and boulder problem/ascent rows.

`RoundResult.startOrder` is now part of the normalized schema when a round-level fixture provides it. Boulder scoring settings remain source-specific and are not normalized yet.

`BoulderProblem` is now a normalized shared record for each route/problem within a round. `BoulderProblemResult` rows link to it with `boulderProblemId`, which supports boulder-level analysis across athletes.

## Remaining Out Of Scope

- Lead normalization.
- Speed normalization.
- Bulk fixture discovery or crawling.
- Database persistence.
- Frontend use of normalized records.
