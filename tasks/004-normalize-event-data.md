# Task 004: Normalize Event Data

Status: Done for the bouldering proof-of-concept first pass

## Goal

Normalize parsed IFSC event data into app-facing Zod schemas.

## Notes

- Preserve source traceability fields.
- Keep normalized schemas in `src/schemas`.
- Update `docs/SCHEMA.md` when fields become real.

## Update

Initial fixture-backed normalization tests now cover event 1412 and event 1478 metadata plus Boulder Men result data. The first pass validates minimal Competition, Event, Round, Athlete, Result, RoundResult, and bouldering-only BoulderProblemResult records with source traceability fields preserved.

Full-fixture tests now normalize every Boulder Men ranking row from the 1412 and 1478 result fixtures, including all round rows and boulder problem/ascent rows.

## Remaining Out Of Scope

- Lead normalization.
- Speed normalization.
- Bulk fixture discovery or crawling.
- Database persistence.
- Frontend use of normalized records.
