# @data-fair/app-charts

![NPM Version](https://img.shields.io/npm/v/%40data-fair%2Fapp-charts) ![NPM Downloads](https://img.shields.io/npm/dt/%40data-fair%2Fapp-charts) ![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/%40data-fair%2Fapp-charts)
  
A simple charting application for [DataFair](https://data-fair.github.io/3/). Also used as an [example for the documentation](https://data-fair.github.io/3/interoperate/applications).  
  
It is hosted by [npm](https://www.npmjs.com/package/@data-fair/app-charts) and the [jsdelivr CDN](https://www.jsdelivr.com/package/npm/@data-fair/app-charts).  
  
An example app can be found [here](https://demo.koumoul.com/applications/categories-des-etablissements-par-departements), it uses [this dataset](https://demo.koumoul.com/datasets/etablissements-finess-france).

## Context

[DataFair](https://data-fair.github.io/3/) is an Open Source Web software developped by [Koumoul](https://koumoul.com) for publishing data online with complete search and aggregation capabilities, metadata management, mapping functionalities, access control, etc. It can be used as a back office for Open Data platforms, data visualizations, custom search engines and other applications.  
  
DataFair comes with functionalities to facilitate the development, deployment and configuration of small data consuming applications. `app-charts` is an example of such an application.

## Technical stack

This technical stack is just an example of what can be used to build an application for DataFair. It is a quite rich stack for a state of the art development environment. For an application with a more minimalist stack, you can see [app-minimal](https://github.com/data-fair/app-minimal).
- [vuejs](https://vuejs.org/) 3 with the composition API: our favorite framework for client-side code
- [vuetify](https://vuetifyjs.com/en/) 4: a material design UI framework for vuejs
- [vue-i18n](https://vue-i18n.intlify.dev/): internationalization (session locale, number/percent formats)
- [chartjs](https://www.chartjs.org/): simple charting library
- [vite](https://vite.dev/): build tool (rolldown) with [vite-plugin-vuetify](https://github.com/vuetifyjs/vuetify-loader)
- [playwright](https://playwright.dev/): unit and e2e tests

## Development Setup

Start by downloading, cloning or forking this repository:

```bash
git clone https://github.com/data-fair/app-charts.git
cd app-charts
```

Install nodejs dependencies for the development environment:

```bash
npm install
```

#### If you are running a local data-fair instance

Create a dataset in your data-fair instance. You can use this [public dataset](https://koumoul.com/s/data-fair/dataset/population-communes/description) for example.  
  
Run the development environment (vite + the DataFair dev-server in a zellij layout):

```bash
npm run dev
```

The first run generates a git-ignored `.env` file holding three free ports (`APP_PORT`, `DEV_SERVER_PORT`, `E2E_PORT`), so several applications can run side by side. An URL banner in zellij shows the dev-server address; configure your application there and edit the configuration, edit the source code, etc.

You can also run only one side of the environment:

```bash
npm run dev-app      # vite only (port from .env APP_PORT)
npm run dev-server   # DataFair dev-server only (port from .env DEV_SERVER_PORT)
```

#### Else

If you don't have a local data-fair instance, the test suite is fully self-contained (all DataFair APIs are mocked):

```bash
npm run test-unit    # unit tests: pure transforms + utils (no server needed)
npm run test-e2e     # e2e tests: full app boot against vite (E2E_PORT from .env)
```

## DataFair application specificity

A DataFair application is mostly like any Web application. You can consume DataFair APIs from any framework for example. But for a seamless integration and multi-configuration management by DataFair you need to respect a few conventions. The following sections are a focus on the files that implement these conventions.

#### `public/config-schema.json`

A JSON schema file that describes the expected configuration. DataFair expects this file to be found at the precise path `%MY_APP%/config-schema.json`. This hand-edited file **is** the schema (served with its `$defs`/`$ref`); TypeScript types are generated from it with `npm run build-types` (see `src/config/schema.ts`).

The content of this JSON schema is extended with some annotations used by DataFair to automatically create a configuration form. The details of these annotations can be found in demo of the library we maintain to create these forms:  [vuetify-jsonschema-form](https://github.com/koumoul-dev/vuetify-jsonschema-form).

#### `index.html`

This the root template used to generate the HTML pages of this application. The key element here is this line:

```html
<script>window.APPLICATION=%APPLICATION%;</script>
```

The string `%APPLICATION%` will be replaced automatically by the actual content of the configuration, when this application is re-exposed by DataFair. Later code can use the global variable `APPLICATION` (`window.APPLICATION`) to start interacting with the DataFair API.  
The important parts for DataFair are the `df:*` meta properties (form version, concept filters, config/state sync, overflow, capture delay) and the `application-name` / `description` metas for the catalog.

## Deployment

To publish the project, upload it to the global npm registry (you need to be a member of the owner organization).

```bash
npm version PATCH|MINOR|MAJOR
npm publish
git push && git push --tags
```

If the release is a bug fix and you don't want to wait 24h (the cache delay of jsdelivr), you can purge the cache for the index.html file of the minor version in the CDN:

```bash
curl https://purge.jsdelivr.net/npm/@data-fair/app-charts@VER/dist/index.html
```

Replace `VER` with the minor version number (e.g. `1.0`).  
  
To publish a version for testing purposes you can tag it as a pre-release and publish it with the tag "staging".

```bash
npm version prerelease --preid=staging
npm publish --tag staging
curl https://purge.jsdelivr.net/npm/@data-fair/app-charts@staging/dist/index.html
git push && git push --tags
```
