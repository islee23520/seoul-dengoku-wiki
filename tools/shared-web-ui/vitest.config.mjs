import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'shared-web-ui',
    include: ['test/*.test.mjs'],
    exclude: ['**/node_modules/**'],
    pool: 'forks',
    fileParallelism: false,
  },
})
