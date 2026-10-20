import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'scripts/test-*.mjs',
      'lore/**/*.test.mjs',
      'lore/**/test-*.mjs',
      'lore/name-pools/verify-person-id-*.mjs',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'scripts/test-character-profile.mjs',
      'scripts/test-clan-crests.mjs',
      'scripts/test-generate-release.mjs',
      'scripts/test-naming-ledger-gate.mjs',
      'scripts/test-seoul-public-assets.mjs',
      'scripts/test-soul-assignments.mjs',
      'scripts/test-wiki-api-seoul.mjs',
    ],
    pool: 'forks',
    fileParallelism: false,
    // Authenticated full-corpus admission reads exceed two minutes on this corpus.
    testTimeout: 600_000,
  },
})
