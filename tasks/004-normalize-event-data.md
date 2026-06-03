# Task 004: Normalize Event Data

Status: In progress

## Goal

Normalize parsed IFSC event data into app-facing Zod schemas.

## Notes

- Preserve source traceability fields.
- Keep normalized schemas in `src/schemas`.
- Update `docs/SCHEMA.md` when fields become real.

## Update

Initial fixture-backed normalization tests now cover event 1412 metadata and Boulder Men result data. The first pass validates minimal Competition, Event, Round, Athlete, Result, and bouldering-only BoulderProblemResult records with source traceability fields preserved.
