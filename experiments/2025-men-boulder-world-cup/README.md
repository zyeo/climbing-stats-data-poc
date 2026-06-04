# 2025 Men Boulder World Cup Experiment

This is an exploratory analysis workspace, not production app code.

Goal:

> Build a small, curated fixture-backed dataset for 2025 IFSC World Cup Men Boulder and use it to test whether normalized bouldering data can support useful analysis questions.

## Current Scope

In scope:

- 2025 IFSC World Cup events.
- Boulder discipline.
- Men category.
- First-party IFSC JSON fixtures only.
- Cached fixtures committed under `src/sources/ifsc-results/fixtures/`.
- Descriptive analysis and data-shape exploration.

Out of scope:

- Crawling.
- Bulk downloading.
- Lead.
- Speed.
- Frontend or database work.
- Production ML or prediction features.

## Current Dataset Status

This experiment currently uses committed fixtures for the six 2025 IFSC World Cup Boulder stops listed by IFSC Results:

- Event 1405: `IFSC World Cup Keqiao 2025`
- Event 1408: `IFSC World Cup Curitiba 2025`
- Event 1409: `IFSC World Cup Salt Lake City 2025`
- Event 1410: `IFSC World Cup Prague 2025`
- Event 1411: `IFSC World Cup Bern 2025`
- Event 1412: `IFSC World Cup Innsbruck 2025`

This is now a fixture-backed 2025 World Cup Men Boulder dataset for exploratory work. It is still not a production dataset, and conclusions should remain exploratory until the source assumptions are reviewed again.

Current normalized totals:

- 6 event results.
- 479 athlete event-result rows.
- 103 shared boulder/problem records.
- 3,179 athlete boulder/problem result rows.

Fixture shape note:

- Every athlete in the current 2025 Men Boulder World Cup fixtures has 5 qualification ascent rows.
- Most current fixtures still normalize to 18 shared source boulder records: 10 qualification route records, 4 semifinal route records, and 4 final route records.
- The 10 qualification route records are not 10 boulders climbed by each athlete. They are two separate 5-boulder qualification route sets: Group A and Group B.
- Event 1408 Curitiba normalizes to 13 shared boulders because the source fixture does not expose separate Group A and Group B qualification route sets; its athlete rows expose one 5-boulder qualification route set.

## Adding Or Revising Events

Add events carefully:

1. Identify a specific 2025 World Cup event that includes Boulder Men.
2. Save event metadata with `pnpm save:json-fixture`.
3. Read the metadata fixture and find the `BOULDER Men` `full_results_url`.
4. Save the corresponding result fixture with `pnpm save:json-fixture`.
5. Add the event to `manifest.json`.
6. Run `pnpm test` and `pnpm typecheck`.

Do not crawl or bulk-fetch event lists in this experiment.

## Early Analysis Questions

Once more event fixtures exist, useful first-pass questions include:

- How stable are athletes' ranks across 2025 World Cup Boulder Men events?
- How strongly do qualification scores/ranks relate to final placement?
- Which rounds produce the most separation?
- How do boulder top rates and zone rates vary by round and event?
- Are there repeated athletes whose round-to-round consistency stands out?

Treat these as exploratory statistics first. Do not jump to ML until the dataset is larger and the target question is clear.
