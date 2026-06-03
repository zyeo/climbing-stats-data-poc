# Decisions

## 2026-05-26: Keep Initial POC Single-Agent And Lightweight

Decision: Use a simple `plan -> test -> implement -> verify -> document` workflow in `AGENTS.md` instead of adding a heavier multi-agent framework.

Reason: The project is currently a feasibility proof-of-concept. A small workflow keeps the repository easier to understand while the data model and source assumptions are still forming.

## 2026-06-03: Use Event Result JSON As Primary Bouldering Input

Decision: Use `/api/v1/events/:eventId/result/:resultId` fixtures as the primary parser and normalizer input for bouldering results. Treat `/api/v1/category_rounds/:categoryRoundId/results` fixtures as optional audit or enrichment inputs for round-specific fields.

Reason: The full event result fixture already contains the current POC's needed event ranking, round ranking, score, and ascent details across all rounds. The category-round fixture matches that data for the compared final round and adds useful round-local fields such as start order, route lists, and boulder scoring settings.

Follow-up: `startOrder` is now normalized on `RoundResult` because it is athlete-round-specific and likely useful for later analysis. Boulder scoring settings remain source-only until a normalized round scoring configuration is needed.

## 2026-06-03: Normalize Shared Boulder Problems

Decision: Add `BoulderProblem` as a first-class normalized bouldering record and link athlete-level `BoulderProblemResult` rows to it with `boulderProblemId`.

Reason: Boulder-level analysis needs a shared problem identity so multiple athlete ascents can be grouped by the same route/problem within a round. Keeping only athlete-specific problem results made each athlete's Boulder 1 look independent instead of relating those rows back to the same underlying boulder.
