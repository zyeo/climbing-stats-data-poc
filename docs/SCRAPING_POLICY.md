# Scraping Policy

## Source

The only intended source for this proof-of-concept is `ifsc.results.info`.

## Rules

- Fetch manually and at low volume.
- Cache fetched HTML and use cached fixtures in tests.
- Do not crawl the whole site.
- Do not scrape athlete images.
- Do not scrape Sport Climbing Stats, Out of ISO, or other third-party analytics sites.
- Keep source-specific assumptions under `src/sources/ifsc-results`.
- Prefer the smallest useful fixture for each parser task.

## Current Implementation

The initial implementation provides CLI placeholders and cache utilities. Real scraping and parsing are deferred until a specific fixture is selected and saved.
