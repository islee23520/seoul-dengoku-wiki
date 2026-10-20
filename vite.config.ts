import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyReviewedPublic } from './scripts/seoul-terrain-artifacts.mjs'

export default defineConfig({
  base: '/wiki/',
  publicDir: false,
  plugins: [react(), {
    name: 'reviewed-wiki-public',
    apply: 'build',
    async closeBundle() { await copyReviewedPublic(__dirname, path.resolve(__dirname, 'dist')) },
  }],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5174, proxy: { '/wiki/api': 'http://127.0.0.1:8787' } },
  build: {
    copyPublicDir: false,
    rolldownOptions: {
      output: {
        // Chunks made only of dependencies (the lazily loaded Mermaid graph) go to assets/lib/,
        // which artifact-allowlist.json accepts as a whole; lore content never lives in node_modules.
        chunkFileNames: (chunk) => chunk.moduleIds.length > 0 && chunk.moduleIds.every((id) => id.includes('/node_modules/'))
          ? 'assets/lib/[name]-[hash].js'
          : 'assets/[name]-[hash].js',
      },
    },
  },
})
