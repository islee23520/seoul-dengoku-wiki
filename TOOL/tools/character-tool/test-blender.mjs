import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

test('Blender worker contract is available for real scene execution', () => {
  assert.ok(existsSync(fileURLToPath(new URL('./worker.py', import.meta.url))), 'Blender command dispatcher is missing');
});
