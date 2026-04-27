import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/tasks': 'http://localhost:8080',
      '/sessions': 'http://localhost:8080',
      '/day': 'http://localhost:8080',
      '/settings': 'http://localhost:8080',
      '/interrupts': 'http://localhost:8080',
    },
  },
})
