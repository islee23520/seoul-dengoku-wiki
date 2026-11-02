import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['2d/*.test.mjs'], pool: 'forks', fileParallelism: false, testTimeout: 30000 } });
