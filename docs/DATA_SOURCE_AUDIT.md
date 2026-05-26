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
