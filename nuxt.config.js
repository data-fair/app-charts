const cors = require('cors')
const webpack = require('webpack')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const pjson = require('./package.json')

module.exports = {
  // No server side rendering in our case, the deployment target is some static web server.
  mode: 'spa',
  // Headers of the page
  head: {
    title: 'data-fair-charts',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'df:overflow', content: 'false' },
      { name: 'df:sync-state', content: 'true' },
      { name: 'df:filter-concepts', content: 'true' },
      { hid: 'version', name: 'version', content: process.env.NODE_ENV === 'development' ? 'development' : pjson.version },
      { hid: 'application', name: 'application-name', content: 'Charts' },
      { hid: 'description', name: 'description', content: 'Une application simple de graphiques pour data-fair.' }
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:300,400,500,700,400italic|Material+Icons' }
    ]
  },
  // Customize the progress bar color
  loading: { color: '#3B8070' },
  router: {
    // Build specifically to deploy on a web server somewhere
    base: process.env.BASE_PATH || '/'
  },
  build: {
    transpile: [/vuetify/],
    extend (config, { isDev, isClient }) {
      // Build specifically to deploy on a web server somewhere
      config.output.publicPath = (process.env.PUBLIC_URL || 'http://localhost:3000') + '/_nuxt/'

      // Ignore all locale files of moment.js, those we want are loaded in plugins/moment.js
      config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))

      config.plugins.push(new VuetifyLoaderPlugin())
    }
  },
  plugins: ['~plugins/init', '~plugins/vuetify'],
  modules: ['@nuxtjs/axios'],
  env: {
    defaultDataFair: process.env.DEFAULT_DATA_FAIR || 'http://localhost:8080'
  },
  hooks: {
    build: {
      compile({ name, compiler }) {
        if (name === 'client') {
          // Replace the webpack hot module replacement for the webpack hot middleware
          // Necessary to support re-exposing the dev server behind a reverse proxy (as done by data-fair)

          // TODO fix this
          // "pending" queries to webpack_hmr block the requests queues in chrome
          const appEntry = compiler.options.entry.app
          for (let i = 0; i < appEntry.length; i++) {
            appEntry[i] = appEntry[i].replace('path=/__webpack_hmr', `path=${process.env.PUBLIC_URL || 'http://localhost:3000'}/__webpack_hmr`)
          }
        }
      }
    },
    render: {
      setupMiddleware(app) {
        // Also necessary for livereload through a reverse-proxy
        app.use(cors())
      }
    }
  }
}
