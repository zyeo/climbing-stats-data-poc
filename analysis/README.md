# Python Analysis Workspace

This folder is an exploratory Python workspace for learning data analysis and basic machine learning from the normalized IFSC bouldering fixtures.

It is not production analytics or part of the future app.

## Data Bridge

The trusted parsing and normalization pipeline remains in TypeScript. Export its normalized 2025 Men Boulder World Cup tables from the repository root:

```sh
pnpm export:2025-men-boulder
```

This generates git-ignored CSV files under:

```text
analysis/data/generated/2025-men-boulder-world-cup/
```

Generated tables:

- `competitions.csv`
- `events.csv`
- `athletes.csv`
- `rounds.csv`
- `event_results.csv`
- `round_results.csv`
- `boulder_problems.csv`
- `boulder_problem_results.csv`

The CSV files preserve the normalized relational model and source traceability fields. Python should use these exports instead of independently parsing the raw IFSC JSON fixtures.

## Setup And Smoke Test

This workspace uses `uv`.

```sh
cd analysis
uv sync
uv run python main.py
```

`main.py` reads each generated CSV with pandas and prints its row count. It is intentionally only a handoff smoke test; exploratory analysis and ML work should be added in a later step.

## Gradual Pandas EDA Lesson

Run the descriptive walkthrough after generating the CSV files:

```sh
cd analysis
uv run python eda_lesson.py
```

The lesson introduces pandas in this order:

1. Load tables and inspect shapes and data types.
2. Distinguish missing-by-design values from suspicious missingness.
3. Validate normalized table relationships before joining.
4. Calculate attempt-weighted top and zone rates.
5. Compare rounds, events, and qualification groups.
6. Describe athlete rank consistency without treating it as a prediction task.

Read one numbered section at a time, then change one expression and rerun it. Useful
first experiments are changing `events >= 3`, sorting event rates by `zone_rate`, or
filtering the attempt view to one event before grouping.

## Advancement And Athlete Profiles

The next descriptive EDA phase defines advancement from actual next-round
participation and builds qualification-based athlete profiles:

```sh
cd analysis
uv run python advancement_profiles.py
```

It follows this sequence:

1. Verify event-by-event qualification, semifinal, and final counts.
2. Describe qualification cutoffs within each event and starting group.
3. Compare advancing and non-advancing qualification performances.
4. Inspect the overlap where equal top counts produced different outcomes.
5. Build athlete profiles from participation, advancement, event ranks, and
   qualification top/zone rates.
6. Record follow-up questions without starting prediction modeling.

Advancement is inferred from an athlete's actual presence in the next round. This
preserves source outcomes when ties cause more athletes than usual to advance.

## Difficulty-Relative Performance

Use transparent field-relative math to find difficult boulders, rare tops, and
specific problems worth manually reviewing:

```sh
cd analysis
uv run python difficulty_relative.py
```

For each exact shared boulder, the analysis calculates observed top and zone rates.
A successful top receives:

```text
standout top value = 1 - field top rate
```

This gives more descriptive credit to rare tops. It is not ML, a context-free
athlete rating, or evidence of a specific style weakness. Boulder style is not
available in the current source data and would require careful manual labeling.

## Media Review Queue

Create a prioritized queue of rare-top semifinal and final boulders:

```sh
cd analysis
uv run python media_review_candidates.py
```

The queue includes generated event context, round, a compact boulder label such as
`M1`, source route ID, observed rates, and topper names. Human-entered replay URLs,
timestamps, style labels, and notes live separately in:

```text
analysis/data/curated/boulder_media_reviews.csv
```

Add curated rows using `boulder_problem_id` as the stable join key. Keep generated
result facts in the scripts and CSV exports; keep subjective media/style review in
the curated file.

## Boundaries

- Keep generated data and `.venv/` out of git.
- Use committed fixtures as the reproducible source.
- Start with descriptive analysis before modeling.
- Treat all ML results as exploratory because the current dataset contains only six events.

## Next Chat Handoff

The data bridge is complete. Begin the next analysis session with:

```sh
pnpm export:2025-men-boulder
cd analysis
uv run python main.py
```

Recommended next work:

1. Use pandas to inspect column types, missing values, and table relationships.
2. Join event, round, athlete, and boulder-result tables for exploratory plots.
3. Compare top and zone rates by event, round, qualification group, and boulder.
4. Define one clear first ML question, such as predicting semifinal advancement from qualification performance without using qualification rank.
5. Use leave-one-event-out validation to avoid training and testing on rows from the same competition.

Do not reimplement IFSC parsing or normalization in Python.
