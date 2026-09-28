import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/wiki/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5174 },
  build: {
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
