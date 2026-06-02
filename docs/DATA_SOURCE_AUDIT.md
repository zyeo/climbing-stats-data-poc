# Data Source Audit

## 2026-05-26: IFSC Event 1412 Fixture

### Fixture

- Source URL: `https://ifsc.results.info/event/1412/`
- Local fixture inspected: `src/sources/ifsc-results/fixtures/event-1412.html`
- Fixture commit status: not committed; removed after audit because it is only a Vue app shell and is not needed for tests or parser development.
- Fetch command:

```sh
pnpm save:fixture -- --url "https://ifsc.results.info/event/1412/" --out event-1412.html
```

### Inspection Summary

The saved HTML appears to be a Vue application shell, not a server-rendered result page.

Observed in the saved HTML:

- `<title>`: `World Climbing Result Service`
- Root app mount: `div#unified-vue-app`
- Cable path marker: `div#cable-path` with text `ifsc_cable`
- No `<table>` elements.
- No `<tr>` elements.
- No `<a href>` athlete or profile links.
- No visible result text in the body beyond scripts/noscript content.
- Multiple Vite module preload references that suggest client-side stores/components for event data, including:
  - `event_store`
  - `event_phase_store`
  - `ascent_store`
  - `participant_store`
  - `athletes_store`
  - `country_store`
  - `category_round`

No linked scripts or module assets were fetched during this audit.

### Data Availability In Saved HTML

| Data type | Appears directly in saved HTML? | Notes |
| --- | --- | --- |
| Competition metadata | No | Not present as visible text or structured server-rendered data in the saved HTML. |
| Event/discipline/gender labels | No | No event labels found in the raw HTML. |
| Round data | No | No round rows or labels found in the raw HTML. |
| Athlete names | No | No athlete names found in the raw HTML. |
| Athlete profile links/IDs | No | No anchor tags found in the raw HTML. |
| Country data | No | No country values found directly, though a `country_store` module is referenced. |
| Ranks | No | No rank rows or result tables found. |
| Raw scores | No | No score values found. |

### Parser Implications

- A pure HTML parser for this fixture can currently extract only shell-level metadata such as page title, app mount IDs, and asset references.
- Event result data may be loaded client-side after the initial HTML response.
- Before implementing parser logic, investigate whether IFSC exposes the event data in a stable first-party endpoint used by the app, while still following the no-crawl, low-volume policy.
- Do not parse third-party analytics sites or fetch athlete images.

## 2026-05-29: IFSC Event 1412 JSON Endpoints

### Fixtures

- Event metadata URL: `https://ifsc.results.info/api/v1/events/1412`
- Event metadata fixture: `src/sources/ifsc-results/fixtures/event-1412.json`
- Boulder Men general result URL: `https://ifsc.results.info/api/v1/events/1412/result/3`
- Boulder Men general result fixture: `src/sources/ifsc-results/fixtures/event-1412-result-3.json`

Both JSON endpoints worked without cookies or CSRF tokens when requested with JSON headers and a referer from the public event page.

Example request shape:

```sh
curl 'https://ifsc.results.info/api/v1/events/1412' \
  -H 'accept: application/json' \
  -H 'referer: https://ifsc.results.info/event/1412/general/boulder' \
  -H 'user-agent: climbing-stats-data-poc/0.1'
```

### Endpoint Roles

`/api/v1/events/1412` appears to provide event-level metadata. It includes fields for event identity, location, dates, disciplines, discipline/category lists, rounds, logos, and related event URLs.

`/api/v1/events/1412/result/3` appears to provide Boulder Men general ranking/result data. It includes:

- `event`
- `dcat`
- `status`
- `category_rounds`
- `ranking`
- `ranking_as_of`

The `result/3` fixture contains result-oriented data including athlete IDs, athlete names, countries, ranks, round scores, round ranks, and ascent details such as route IDs, points, tops, zones, and tries.

### Current Inferences

- The raw event HTML is a Vue app shell, but first-party JSON endpoints expose the useful source data.
- `/api/v1/events/1412` is the event metadata fixture.
- `/api/v1/events/1412/result/3` is the Boulder Men general result/ranking fixture.
- The meaning of `result/3` is inferred from the response `dcat` value (`BOULDER Men`) and should be confirmed by comparing other discipline/category URLs later.
- Parser implementation should wait until JSON fixture shapes are documented and tests are written against cached fixtures.

### Fixture Workflow Update

Use `pnpm save:json-fixture` for future first-party IFSC JSON API fixtures. Prefer this over saving raw event-page HTML when the useful data comes from `/api/...` endpoints.

Example:

```sh
pnpm save:json-fixture -- \
  --url "https://ifsc.results.info/api/v1/events/1412/result/3" \
  --out event-1412-result-3.json \
  --referer "https://ifsc.results.info/event/1412/general/boulder"
```

Do not pass cookies, CSRF tokens, auth headers, or copied private browser headers.
