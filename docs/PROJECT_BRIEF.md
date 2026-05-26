# Project Brief

## Goal

Prove that we can responsibly fetch/cache, parse, normalize, validate, test, and document IFSC competition results data from `ifsc.results.info`.

## Scope

This repository is a data feasibility proof-of-concept only. It should help answer:

- Can we manually fetch low-volume public result pages?
- Can we cache fixtures for repeatable tests?
- Can we parse event and ranking pages from HTML?
- Can we normalize source-specific fields into stable app-facing schemas?
- Can we validate normalized records with Zod?
- Can we document source assumptions and limitations?

Development should proceed through small git-tracked milestones so each meaningful change can be reviewed, committed, and rolled back safely.

## Non-Goals

- No frontend.
- No database.
- No prediction or machine learning.
- No crawling system.
- No scraping athlete images.
- No scraping third-party analytics sites.
