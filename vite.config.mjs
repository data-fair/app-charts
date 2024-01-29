import commonjs from 'vite-plugin-commonjs'
import Unfonts from 'unplugin-fonts/vite'
import vue from '@vitejs/plugin-vue'
import { createVuetify } from 'vuetify/lib/framework.mjs'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { transformAssetUrls } from 'vite-plugin-vuetify'
import { visualizer } from 'rollup-plugin-visualizer'

const BASE_PATH = process.env.PUBLIC_URL ?? '/app/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    createVuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss'
      }
    }),
    Unfonts({
      google: {
        families: ['Nunito', 'Material+Icons']
      }
    }),
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    }),
    commonjs({
      include: [
        'node_modules/@data-fair/lib/src/vuetify',
        'node_modules/chroma-js/chroma.js',
        'node_modules/debounce/index.js',
        'node_modules/google-palette/index.js',
        'node_modules/vuetify/lib/vuetify.js'
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    hmr: {
      port: 3000,
      protocol: 'ws'
    },
    publicPath: BASE_PATH
  },
  build: {
    rollupOptions: {
      output: {
        paths: {
          'original-import-path': process.env.PUBLIC_URL || 'http://localhost:3000'
        }
      }
    },
    commonjsOptions: {
      include: [/@data-fair/, /chroma-js/, /debounce/, /google-palette/, /vuetify/]
    }
  }
})
