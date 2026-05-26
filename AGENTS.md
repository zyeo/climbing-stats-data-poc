# AGENTS.md

This repository is a lightweight data feasibility proof-of-concept for a future IFSC climbing stats app. It is not the final app.

## Working Style

Use a simple single-agent workflow:

1. Plan briefly.
2. Test or define expected behavior.
3. Implement the smallest useful change.
4. Verify with tests and type checks.
5. Document meaningful changes.

Do not install or configure a heavy multi-agent framework. Do not set up Superpowers/GSD. Subagents may be considered later, but this repository should stay simple for now.

## Start Of Task Checklist

- Read the relevant files in `docs/`.
- Read the relevant task file in `tasks/`.
- Check the current git status.
- Make a short plan before coding.
- Keep changes small, scoped, and easy to review.
- Prefer source-specific code under `src/sources/ifsc-results`.
- Keep normalized app schemas under `src/schemas`.

## Git Workflow

- Work in small, reviewable changes.
- Before starting a task, check current git status.
- Do not mix unrelated changes in one task.
- After each meaningful task, suggest a commit.
- Do not commit automatically unless the user explicitly asks for it.
- Always provide a clear recommended commit message.
- Keep commit messages concise and use this style:
  - `chore: initialize data POC scaffold`
  - `docs: add public repo safety notes`
  - `feat: add fixture saving CLI`
  - `test: add event parser fixture tests`
  - `fix: handle missing athlete IDs`
- Before recommending a commit, run `pnpm test` and `pnpm typecheck` when relevant.
- Mention any files that should not be committed.

## Data Rules

- Parser functions must be pure and accept HTML strings.
- Tests must use cached fixtures, not live network requests.
- Fetching should be manual and low-volume only.
- Do not crawl the whole site.
- Do not scrape athlete images.
- Do not scrape Sport Climbing Stats, Out of ISO, or other third-party analytics sites.
- Use source traceability fields such as `source`, `sourceUrl`, `sourceAthleteId`, and `sourceCompetitionId`.
- Use Zod for runtime validation of normalized data.

## Documentation Rules

- Update `docs/IMPLEMENTATION_LOG.md` after meaningful changes.
- Update `docs/DECISIONS.md` when a technical decision is made.
- Use `docs/` for durable implementation memory.
- Use `tasks/` for task-by-task handoff.

## Testing Rules

- Use TDD for parsers and normalizers once real fixtures exist.
- Do not make parser or normalizer tests depend on the live network.
- Keep placeholder tests minimal until real IFSC fixtures are saved.

## Explicit Non-Goals

Do not add:

- Next.js
- React
- Supabase
- A database
- A frontend
- ML or prediction code
- A crawling system
