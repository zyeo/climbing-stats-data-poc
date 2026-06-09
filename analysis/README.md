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
