/// <reference types="vitest/config" />

import path from 'node:path'

import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { uiTheme } from './src/shared/theme/config'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: uiTheme,
      icon: {
        clientBundle: {
          scan: true
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.DEV_API_PROXY_TARGET ?? 'http://127.0.0.1:18000',
        changeOrigin: false
      },
      '/media': {
        target: process.env.DEV_API_PROXY_TARGET ?? 'http://127.0.0.1:18000',
        changeOrigin: false
      }
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts']
  }
})
