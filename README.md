# data-fair-charts

> Nuxt.js project

## Build Setup

``` bash
# install dependencies
$ npm install # Or yarn install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, checkout the [Nuxt.js docs](https://github.com/nuxt/nuxt.js).

## Deployment

This project is configured to use [gh-pages-multi](https://github.com/koumoul-dev/gh-pages-multi) to push the built application to [GitHub Pages](https://pages.github.com/).

Deploy manually in a "latest" subdirectory:

    PUBLIC_URL=https://koumoul-dev.github.io/data-fair-charts/latest/ npm run generate
    npm run deploy
