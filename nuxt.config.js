const URL = require('url').URL
const cors = require('cors')
module.exports = {
  // No server side rendering in our case, the deployment target is some static web server.
  mode: 'spa',
  // Headers of the page
  head: {
    title: 'data-fair-charts',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
    base: process.env.PUBLIC_URL ? new URL(process.env.PUBLIC_URL).pathname : '/'
  },
  build: {
    extractCSS: true,
    extend (config, { isDev, isClient }) {
      // Build specifically to deploy on a web server somewhere
      config.output.publicPath = (process.env.PUBLIC_URL || 'http://localhost:3000') + '/_nuxt/'

      // Run ESLint on save
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  },
  plugins: ['~plugins/init', '~plugins/vuetify'],
  modules: ['@nuxtjs/axios'],
  env: {
    defaultDataFair: process.env.DEFAULT_DATA_FAIR || 'http://localhost:5600'
  },
  hooks: {
    build: {
      compile({ name, compiler }) {
        if (name === 'client') {
          // Replace the webpack hot module replacement for the webpack hot middleware
          // Necessary to support re-exposing the dev server behind a reverse proxy (as done by data-fair)
          const appEntry = compiler.options.entry.app
          appEntry[0] = appEntry[0].replace('path=/__webpack_hmr', `path=${process.env.PUBLIC_URL || 'http://localhost:3000'}/__webpack_hmr`)
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
