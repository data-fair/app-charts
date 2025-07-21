# Agent Guide – @data-fair/app-charts

`app-charts` is a **DataFair visualization plugin** that renders charts (line, bar, multi-line, multi-bar, pie, radar, paired-histogram) from DataFair datasets. Published on npm as `@data-fair/app-charts` and served via jsDelivr CDN.

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vuetify 4**
- **Chart.js 4** + vue-chartjs + chartjs-plugin-datalabels + @energiency/chartjs-plugin-piechart-outlabels
- **@vueuse/core** (computedAsync, useDebounce)
- **@data-fair/lib-*** (utils, vue, vuetify)
- **chroma-js**, **dayjs**, **ofetch**
- **Build:** Vite 8, types generated from `src/config/schema.json`

## Project Structure

```
├── index.html
├── public/config-schema.json          # Generated from src/config/schema.json
├── src/
│   ├── main.js                        # Bootstraps Vue app, creates session + dynamic theme, installs createConfig plugin
│   ├── App.vue                        # Root: v-empty-state on config error, renders Chart + SnackBar
│   ├── composables/
│   │   ├── config.js                  # createConfig plugin + useConfig inject helper
│   │   ├── useChartData.js            # Hub: debounced params, error refs, routes to mode loaders
│   │   └── chart-data/                # One file per data mode
│   │       ├── rowsBased.js
│   │       ├── aggsBased.js
│   │       ├── aggsBasedLabels.js
│   │       └── aggsLabels.js
│   ├── components/
│   │   ├── Chart.vue                  # vue-chartjs renderer + options builder
│   │   ├── Actions.vue                # Metric selector, sort, stack toggle
│   │   └── SnackBar.vue               # Bound to displayError/errorMessage refs
│   ├── assets/utils.js                # getSortStr, getColors, splitString
│   ├── config/schema.json             # Source JSON schema (~1600 lines)
│   └── styles/settings.scss
```

## DataFair Conventions

- **`%APPLICATION%`** in `index.html` → `window.APPLICATION` (replaced by DataFair reverse proxy).
- **`public/config-schema.json`** must exist at `/config-schema.json`. DataFair fetches it to build the config form.
- **Meta tags** in `index.html` (`application-name`, `title`, `description`, `thumbnail`, `df:*`) are used when importing the app.
- Concept filters come from `@data-fair/lib-vue/concept-filters.js` and are merged with `staticFilters`.

## Key Patterns

### createConfig / useConfig
`createConfig()` is a Vue plugin installed in `main.js`. It reads `window.APPLICATION`, creates reactive refs, and provides them via `provide('data-fair-app-config', …)`. Returns an `error` computed instead of throwing; `App.vue` renders a `v-empty-state` when `error` is truthy.

### Dynamic Theme
`main.js` creates a session with `createSession({ directoryUrl: '/simple-directory', siteInfo: true })` and passes `vuetifySessionOptions(session)` to Vuetify. This pulls site colors and dark mode from DataFair dynamically. `index.html` includes `<link href="/simple-directory/api/sites/_theme.css" rel="stylesheet">` for runtime theme CSS.

### useChartData
Composable that calls `useConfig()` internally. Returns:
- `getData(theme)` — an object of async functions keyed by data mode (`rowsBased`, `aggsBased`, `aggsBasedLabels`, `aggsLabels`).
- `displayError` / `errorMessage` refs for the snackbar.

Each mode lives in its own file under `src/composables/chart-data/`. The hub (`useChartData.js`) builds the debounced query params and passes a shared `ctx` object to each mode loader.

### Chart.vue
Uses `computedAsync` to call the appropriate data loader. Builds Chart.js `options` reactively based on config + theme. Conditionally renders `<Line>`, `<Bar>`, `<Pie>` or `<Radar>` from `vue-chartjs`.

## Development Workflow

```bash
npm install
npm run dev          # dev server + DataFair dev server (zellij layout)
npm run dev-app      # vite only on :3000
npm run build-preview
npm run lint
```

When modifying `src/config/schema.json`, always run `npm run build-types` to keep TypeScript types synchronized.

## Notes for Agents

- Do **not** change `window.APPLICATION` logic; it is the contract with DataFair.
- Do **not** rename or move `public/config-schema.json` without updating the build script.
- Chart.js registrations are global (see `Chart.vue`). Registering plugins conditionally inside `options` can cause duplicate-registration warnings; prefer registering once in setup if possible.
