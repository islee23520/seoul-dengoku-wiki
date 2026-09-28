import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'scripts/test-*.mjs',
      'lore/**/*.test.mjs',
      'lore/**/test-*.mjs',
      'lore/name-pools/verify-person-id-*.mjs',
    ],
    exclude: ['node_modules/**', 'dist/**'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 120_000,
  },
})
