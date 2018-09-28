# data-fair-charts

A simple charting application for [DataFair](https://koumoul-dev.github.io/data-fair/). Also used as an [example for the documentation](https://koumoul-dev.github.io/data-fair/interoperate/applications) and to bootstrap other applications. 

It is hosted [here](https://koumoul-dev.github.io/data-fair-charts/).

An example configuration can be found [here](https://koumoul.com/s/data-fair/application/data-fair-charts/config), it uses [this dataset](https://koumoul.com/s/data-fair/dataset/population-communes/description).

## Context

[DataFair](https://koumoul-dev.github.io/data-fair/) is an Open Source Web software developped by [Koumoul](https://koumoul.com) for publishing data online with complete search and aggregation capabilities, metadata management, mapping functionalities, access control, etc. It can be used as a back office for Open Data platforms, data visualizations , custom search engines and other applications.

DataFair comes with functionalities to facilitate the development, deployment and configuration of small data consuming applications. data-fair-charts is an example of such an application.

## Technical stack

This technical stack is just an example of what can be used to build an application for DataFair. It is a quite rich stack for a state of the art development environment. For an application with a more minimalist stack, you can see [data-fair-minimal](https://github.com/koumoul-dev/data-fair-minimal).

  - [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/): use it to run DataFair and its system dependencies as easily as possible
  - [vuejs](https://vuejs.org/): our favorite framework for client-side code
  - [nuxt](https://nuxtjs.org/guide): a higher level framework on top of vuejs for creating full applications (integrates [webpack](https://webpack.js.org/) and other tools)
  - [vuetify](https://vuetifyjs.com/en/): a material design UI framework for vuejs
  - [chartjs](https://www.chartjs.org/): simple charting library

## Development Setup

Start by downloading, cloning or forking this repository:

    git clone git@github.com:koumoul-dev/data-fair-charts.git
    cd data-fair-charts

You need to have a running Docker daemon and a recent docker-compose command installed on your system. You also need a nodejs/npm setup.

Run data-fair and dependencies in the background:

    docker-compose pull
    docker-compose up -d

After a few seconds you can check that data-fair is up at [this url](http://localhost:8080). You can click on the links to log in with a new user, emails will be sent to a virtual mail server that you can access [here](http://localhost:1080/#/).

Create a dataset in your data-fair instance. You can use this [public dataset](https://koumoul.com/s/data-fair/dataset/population-communes/description) for example.

Install nodejs dependencies for the development environment:

    npm i

Run the development server and serve the application with hot reload [here](http://localhost:3000):

    npm run dev

You can now add an application configuration pointing to http://localhost:3000 in your data-fair instance. Edit the configuration, edit the code source, etc.

## DataFair application specificity

A DataFair application is mostly like any Web application. You can consume DataFair APIs from any framework for example. But for a seamless integration and multi-configuration management by DataFair you need to respect a few conventions. The following sections are a focus on the files that implement these conventions.

#### nuxt.config.js

The configuration file for the Nuxt framework. The important part for DataFair is the presence of the meta properties "title" and "description".

#### static/config-schema.json

A JSON schema file that describes the expected configuration. DataFair expects this file to be found at the precise path %MY APP%/config-schema.json.

The content of this JSON schema is extended with some annotations used by DataFair to automatically create a configuration form. The details of these annotations can be found in demo of the library we maintain to create these forms:  [vuetify-jsonschema-form](https://github.com/koumoul-dev/vuetify-jsonschema-form).

#### app.html

This the root template used to generate the HTML pages of this application. The key element here is this line:

    <script type="text/javascript">window.APPLICATION=%APPLICATION%;</script>

The string %APPLICATION% will be replaced automaticaly by the actual content of the configuration, when this application is re-exposed by DataFair. Later code can use the global variable APPLICATION to start interacting with the DataFair API.

## Deployment

This project is configured to use [gh-pages-multi](https://github.com/koumoul-dev/gh-pages-multi) to push the built application to [GitHub Pages](https://pages.github.com/). Basically it is a free, fast, static Web server for Open Source projects. If you fork this application to create your own you are encouraged to follow the same pattern.

Deploying manually to a "latest" subdirectory:

    PUBLIC_URL=https://koumoul-dev.github.io/data-fair-charts/latest/ npm run generate
    npm run deploy

Setting up an automatic deployment process is easy thanks to [Travis CI](travis-ci.org). The .travis.yml file in this repository is an example. Every commit to master triggers a push to the "latest" subdirectory of the Web server, and every tag is pushed in a MAJOR.x subdirectory.
