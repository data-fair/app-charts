# data-fair-charts

A simple charting application for data-fair. Also used as an example for the documentation and to bootstrap other applications.

[Check it out](https://koumoul-dev.github.io/data-fair-charts/).

## Development Setup

TODO: docker-compose to run local data-fair

``` bash
npm i

# serve with hot reload at localhost:3000
npm run dev
```

For detailed explanation on how things work, checkout the [Nuxt.js docs](https://github.com/nuxt/nuxt.js).

## Deployment

This project is configured to use [gh-pages-multi](https://github.com/koumoul-dev/gh-pages-multi) to push the built application to [GitHub Pages](https://pages.github.com/).

Deploy manually in a "latest" subdirectory:

    PUBLIC_URL=https://koumoul-dev.github.io/data-fair-charts/latest/ npm run generate
    npm run deploy
