import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import visualizer from 'rollup-plugin-visualizer'
import Unfonts from 'unplugin-fonts/vite'
import { createVuetify } from 'vuetify/lib/framework.mjs'

const BASE_PATH = process.env.PUBLIC_URL || '/'

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE_PATH,
  plugins: [
    vue(),
    createVuetify({
      autoImport: true
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
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/settings.scss";'
      }
    }
  },
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
    }
  },
  build: {
    rollupOptions: {
      output: {
        publicPath: process.env.PUBLIC_URL || 'http://localhost:3000'
      }
    },
    commonjsOptions: {
      include: [/vuetify/]
    }
  }
})
