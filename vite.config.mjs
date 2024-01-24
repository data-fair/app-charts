import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import visualizer from 'rollup-plugin-visualizer'
import Unfonts from 'unplugin-fonts/vite'
import { createVuetify } from 'vuetify/lib/framework.mjs'
import commonjs from 'vite-plugin-commonjs'
import { transformAssetUrls } from 'vite-plugin-vuetify'

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
      brotliSize: true
    }),
    commonjs({
      include: [
        'node_modules/debounce/index.js',
        'node_modules/color-js/index.js',
        'node_modules/google-palette/index.js'
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/settings.scss";'
      }
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
      include: [/vuetify/, /debounce/, /color-js/, /google-palette/]
    }
  }
})
