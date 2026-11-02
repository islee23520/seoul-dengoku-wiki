import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'portrait',
    include: ['tests/*.test.mjs', 'tools/character-tool/test-*.mjs'],
    exclude: ['**/node_modules/**'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
})
