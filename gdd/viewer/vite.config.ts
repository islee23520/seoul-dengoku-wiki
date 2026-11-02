import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/gdd/',
  plugins: [react()],
  // The linked vendor renderer has its own dev copy of React; its hooks must use the viewer's React.
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { outDir: 'dist', emptyOutDir: true },
})
