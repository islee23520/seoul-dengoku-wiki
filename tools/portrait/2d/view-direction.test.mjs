import assert from 'node:assert/strict';
import { test } from 'vitest';
import { viewDirection } from './view-direction.mjs';

test('each declared camera view has its own direction constraint', () => {
  const directions = ['front', 'profile', 'side', 'back'].map(viewDirection);
  assert.ok(directions.every(value => value.length > 0));
  assert.equal(new Set(directions).size, 4);
  assert.equal(viewDirection(null), '');
});
