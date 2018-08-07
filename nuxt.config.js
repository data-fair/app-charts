const URL = require('url').URL

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
    vendor: ['babel-polyfill'],
    // Use babel polyfill, not runtime transform to support Array.includes and other methods
    // cf https://github.com/nuxt/nuxt.js/issues/93
    babel: {
      presets: [
        ['vue-app', {useBuiltIns: true, targets: { ie: 11, uglify: true }}]
      ]
    },

    extend (config, { isDev, isClient }) {
      // Build specifically to deploy on a web server somewhere
      config.output.publicPath = process.env.PUBLIC_URL || 'http://localhost:3000/_nuxt/'

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
  plugins: ['~plugins/init', '~plugins/vuetify', '~plugins/v-tooltip'],
  modules: ['@nuxtjs/axios'],
  env: {
    defaultDataFair: process.env.NODE_ENV === 'production' ? 'https://koumoul.com/s/data-fair' : 'http://localhost:5600'
  }
}
