import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: '/gdd/',
  plugins: [react()],
  root: 'gdd',
  build: { outDir: '../dist-gdd', emptyOutDir: true },
  resolve: { alias: { '@gdd': path.resolve(__dirname, 'src-gdd') } },
})
