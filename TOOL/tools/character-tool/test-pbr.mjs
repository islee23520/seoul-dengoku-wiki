import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

test('Unity GLB texture preparation has a concrete implementation', () => {
  assert.ok(existsSync(fileURLToPath(new URL('./blender_pbr.py', import.meta.url))),
    'GLB images and ORM channels must be externalized before FBX/Unity import');
});
