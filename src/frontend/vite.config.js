import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.BUILD_DATE':  JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 3001,
    proxy: {
      '/api':  'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    },
  },
})
