import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/tasks': apiTarget,
      '/sessions': apiTarget,
      '/day': apiTarget,
      '/settings': apiTarget,
      '/interrupts': apiTarget,
    },
  },
})
