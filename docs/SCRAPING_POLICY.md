# Scraping Policy

## Source

The only intended source for this proof-of-concept is `ifsc.results.info`.

## Rules

- Fetch manually and at low volume.
- Fetch only one explicitly provided URL per command.
- Do not follow links from fetched pages.
- Cache fetched HTML and use cached fixtures in tests.
- Do not crawl the whole site.
- Do not scrape athlete images.
- Do not scrape Sport Climbing Stats, Out of ISO, or other third-party analytics sites.
- Keep source-specific assumptions under `src/sources/ifsc-results`.
- Prefer the smallest useful fixture for each parser task.

## Current Implementation

The `pnpm save:fixture` command saves one raw HTML page from `ifsc.results.info` into `src/sources/ifsc-results/fixtures/`.

The command:

- Requires `--url`.
- Accepts optional `--out`.
- Refuses to overwrite an existing fixture unless `--force` is passed.
- Rejects non-IFSC URLs.
- Rejects unsafe output filenames and paths.
- Sends a clear user-agent string.

Real parsing is deferred until a specific fixture has been saved and parser tests are written against that cached file.
