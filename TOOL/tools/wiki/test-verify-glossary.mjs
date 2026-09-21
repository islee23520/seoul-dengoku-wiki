import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { verifyGlossary } from './verify-glossary.mjs';

test('verifyGlossary should pass for valid glossary', (t) => {
  const repoRoot = path.resolve(import.meta.dirname, '../../..');
  const jsonPath = path.join(repoRoot, 'LORE/glossary.json');
  assert.doesNotThrow(() => verifyGlossary(jsonPath, repoRoot));
});
