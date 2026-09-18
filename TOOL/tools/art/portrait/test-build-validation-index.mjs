import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { buildValidationIndex } from './build-validation-index.mjs';

const repo = resolve(import.meta.dirname, '../../..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('validation index binds receipts and web artifacts byte-exactly', () => {
  const index = buildValidationIndex({ repoRoot: repo });
  assert.equal(index.receipts.length, 2);
  assert.ok(index.receipts.some(receipt => receipt.status === 'PENDING'));
  assert.ok(index.receipts.every(receipt => receipt.status !== 'FAIL'));
  for (const receipt of index.receipts) {
    assert.equal(sha256(readFileSync(resolve(repo, receipt.path))), receipt.sha256);
    assert.notEqual(receipt.visual_approval, 'APPROVED');
    for (const artifact of receipt.artifacts) assert.equal(sha256(readFileSync(resolve(repo, 'GAME-REFERENCE/potray-generator/assets/v2', artifact.web_path))), artifact.sha256);
  }
});

test('validation index rerun is deterministic', () => {
  buildValidationIndex({ repoRoot: repo });
  const first = readFileSync(resolve(repo, 'GAME-REFERENCE/potray-generator/assets/v2/validation-index.json'));
  buildValidationIndex({ repoRoot: repo });
  assert.deepEqual(readFileSync(resolve(repo, 'GAME-REFERENCE/potray-generator/assets/v2/validation-index.json')), first);
});

test('validation index refuses escaping outputs and symlink parents before cleanup', (t) => {
  assert.throws(() => buildValidationIndex({ repoRoot: repo, output: '../outside/index.json' }), /escapes/);
  const temp = mkdtempSync(join(tmpdir(), 'validation-index-'));
  const outside = mkdtempSync(join(tmpdir(), 'validation-index-outside-'));
  t.after(() => { rmSync(temp, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); });
  mkdirSync(join(temp, 'GAME-REFERENCE/potray-generator/assets/v2'), { recursive: true });
  symlinkSync(outside, join(temp, 'GAME-REFERENCE/potray-generator/assets/v2/link'));
  assert.throws(() => buildValidationIndex({ repoRoot: temp, output: 'GAME-REFERENCE/potray-generator/assets/v2/link/index.json' }), /symlink/);
});
