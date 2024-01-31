# @data-fair/app-charts

![NPM Version](https://img.shields.io/npm/v/%40data-fair%2Fapp-charts) ![NPM Downloads](https://img.shields.io/npm/dt/%40data-fair%2Fapp-charts) ![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/%40data-fair%2Fapp-charts)
  
A simple charting application for [DataFair](https://data-fair.github.io/3/). Also used as an [example for the documentation](https://data-fair.github.io/3/interoperate/applications).  
  
It is hosted by [npm](https://www.npmjs.com/package/@data-fair/app-charts) and the [jsdelivr CDN](https://www.jsdelivr.com/package/npm/@data-fair/app-charts).  
  
An example app can be found [here](https://demo.koumoul.com/applications/categories-des-etablissements-par-departements), it uses [this dataset](https://demo.koumoul.com/datasets/etablissements-finess-france).

## Context

[DataFair](https://data-fair.github.io/3/) is an Open Source Web software developped by [Koumoul](https://koumoul.com) for publishing data online with complete search and aggregation capabilities, metadata management, mapping functionalities, access control, etc. It can be used as a back office for Open Data platforms, data visualizations, custom search engines and other applications.  
  
DataFair comes with functionalities to facilitate the development, deployment and configuration of small data consuming applications. `app-charts` is an example of such an application.

## Technical stack

This technical stack is just an example of what can be used to build an application for DataFair. It is a quite rich stack for a state of the art development environment. For an application with a more minimalist stack, you can see [app-minimal](https://github.com/data-fair/app-minimal). For a state of the art application generator see the [vue-cli plugin](https://github.com/data-fair/vue-cli-plugin-app).
- [vuejs](https://vuejs.org/): our favorite framework for client-side code
- [vuetify](https://vuetifyjs.com/en/): a material design UI framework for vuejs
- [chartjs](https://www.chartjs.org/): simple charting library

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
  
Run the development server and serve the application with hot reload [here](http://localhost:3000):

```bash
npm run dev-src
```

You can now add an application configuration pointing to http://localhost:3000 in your data-fair instance. Edit the configuration, edit the source code, etc.  

#### Else

Run the development server and serve the application with hot reload [here](http://localhost:3000):

```bash
npm run dev
```

You will find a dev server running at http://localhost:5888. It contains sample data and a sample configuration. You can edit the source code, edit the configuration, etc.

## DataFair application specificity

A DataFair application is mostly like any Web application. You can consume DataFair APIs from any framework for example. But for a seamless integration and multi-configuration management by DataFair you need to respect a few conventions. The following sections are a focus on the files that implement these conventions.

#### `public/config-schema.json`

A JSON schema file that describes the expected configuration. DataFair expects this file to be found at the precise path `%MY_APP%/config-schema.json`.

The content of this JSON schema is extended with some annotations used by DataFair to automatically create a configuration form. The details of these annotations can be found in demo of the library we maintain to create these forms:  [vuetify-jsonschema-form](https://github.com/koumoul-dev/vuetify-jsonschema-form).

#### `index.html`

This the root template used to generate the HTML pages of this application. The key element here is this line:

```html
<script type="text/javascript">window.APPLICATION=%APPLICATION%;</script>
```

The string `%APPLICATION%` will be replaced automatically by the actual content of the configuration, when this application is re-exposed by DataFair. Later code can use the global variable `APPLICATION` (`window.APPLICATION`) to start interacting with the DataFair API.  
The important part for DataFair is the presence of the meta properties "title" and "description".

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
