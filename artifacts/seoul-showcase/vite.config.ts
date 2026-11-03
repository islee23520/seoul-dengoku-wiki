import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/** Public base path. Defaults to the wiki-hosted mount; override with BASE_PATH (e.g. "/" at a site root). */
const DEFAULT_BASE_PATH = '/wiki/seoul-showcase/';
const basePath = process.env.BASE_PATH || DEFAULT_BASE_PATH;

if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
  throw new Error(
    `Invalid BASE_PATH value: "${basePath}" (must start and end with "/")`,
  );
}

/** Optional dev/preview port. Only validated when provided; builds never need it. */
function optionalPort(): number | undefined {
  const rawPort = process.env.PORT;
  if (!rawPort) return undefined;
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  return port;
}

const port = optionalPort();

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: port !== undefined,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    strictPort: port !== undefined,
  },
});
