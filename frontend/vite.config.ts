import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Same-origin /api in dev: no CORS, and the backend URL stays out of the bundle.
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
