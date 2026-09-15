import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    proxy: {
      '/api/catalog': {
        target: process.env.VITE_CATALOG_API_URL || 'http://localhost:5142',
        changeOrigin: true,
      },
      '/api/identity': {
        target: process.env.VITE_IDENTITY_API_URL || 'http://localhost:5051',
        changeOrigin: true,
      },
      '/api/inventory': {
        target: process.env.VITE_INVENTORY_API_URL || 'http://localhost:5219',
        changeOrigin: true,
      },
    },
  },
})
