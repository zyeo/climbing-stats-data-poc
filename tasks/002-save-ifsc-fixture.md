# Task 002: Save IFSC Fixture

Status: Done

## Goal

Manually save one low-volume IFSC HTML fixture from `ifsc.results.info`.

## Notes

- Read `docs/SCRAPING_POLICY.md` first.
- Use `pnpm save:fixture -- --url <url> [--out <fixture-name.html>]`.
- Record source URL, save date, and purpose in `docs/IMPLEMENTATION_LOG.md`.
- Do not crawl.

## Completed

- Added safe URL validation for `ifsc.results.info`.
- Added output filename validation to prevent path traversal.
- Added overwrite protection with optional `--force`.
- Added a clear user-agent string.
- Added no-network tests for URL and filename safety.
