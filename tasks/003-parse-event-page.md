# Task 003: Parse Event Page

Status: In progress

## Goal

Parse minimal event metadata from a cached IFSC event page fixture.

## Notes

- Parser functions must be pure and accept HTML strings.
- Tests must use cached fixtures only.
- Keep source-specific assumptions in `src/sources/ifsc-results`.

## Update

The raw event HTML fixture was a Vue app shell, so useful event data is now being parsed from cached first-party JSON fixtures instead of server-rendered HTML.

Current JSON parser tests cover:

- `event-1412.json` event metadata.
- `event-1412-result-3.json` Boulder Men result summary and first-ranked athlete round scores.
- `event-1405.json` event metadata.
- Boulder Men and Boulder Women result summaries from cached fixtures for events 1405, 1412, and 1478.
