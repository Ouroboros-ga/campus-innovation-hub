/// <reference types="vitest/config" />

import path from 'node:path'

import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { uiTheme } from './src/shared/theme/config.ts'

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
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts']
  }
})
