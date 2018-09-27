# data-fair-charts

A simple charting application for [DataFair](https://koumoul-dev.github.io/data-fair/). Also used as an example for the documentation and to bootstrap other applications.

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

## Development Setup

You need to have a running Docker daemon and a recent docker-compose command installed on your system. You also need a nodejs/npm setup.

Run data-fair and dependencies:

    docker-compose up -d

After a few seconds you can check that data-fair is up at [this url](http://localhost:8080). You can click on the links to log in with a new user, emails will be sent to a virtual mail server that you can access [here](http://localhost:1080/#/).

Create a dataset in your data-fair instance. You can use this [public dataset](https://koumoul.com/s/data-fair/dataset/population-communes/description) for example.

Install nodejs dependencies for the development environment:

    npm i

Run the development server and serve the application with hot reload [here](http://localhost:3000):

    npm run dev

You can now add an application configuration pointing to http://localhost:3000. Edit the configuration, edit the code source, etc.

## Project overview

TODO: most important = JSON schema based configuration.

## Deployment

This project is configured to use [gh-pages-multi](https://github.com/koumoul-dev/gh-pages-multi) to push the built application to [GitHub Pages](https://pages.github.com/).

Deploy manually in a "latest" subdirectory:

    PUBLIC_URL=https://koumoul-dev.github.io/data-fair-charts/latest/ npm run generate
    npm run deploy
