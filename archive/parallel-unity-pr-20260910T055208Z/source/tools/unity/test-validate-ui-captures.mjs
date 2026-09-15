#!/usr/bin/env node
// RED/GREEN harness for validate-ui-captures.mjs against real capture dir.
import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, writeFileSync, cpSync, rmSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const validator = join(here, 'validate-ui-captures.mjs');
const repo = resolve(here, '../..');
const captures = process.env.JANSEON_CAPTURE_DIR
  || join(repo, '.omo/evidence/unity-poc-core-loop/task-11-ui-toolkit/captures');

function run(dir, head, fingerprint) {
  const args = [validator, '--dir', dir];
  if (head) args.push('--head', head);
  if (fingerprint) args.push('--source-fingerprint', fingerprint);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return r;
}

function assert(cond, msg) {
  if (!cond) {
    console.error('ASSERT', msg);
    throw new Error(msg);
  }
}

// self-test
{
  const r = spawnSync(process.execPath, [validator, '--self-test'], { encoding: 'utf8' });
  assert(r.status === 0, 'self-test must pass: ' + r.stderr);
}

// Against current captures: must FAIL while old invalid matrix remains
if (existsSync(captures)) {
  const matrixIdentity = JSON.parse(readFileSync(join(captures, 'main-title-1280x720.receipt.json'), 'utf8'));
  const r = run(captures, matrixIdentity.head, matrixIdentity.dirty_tree_fingerprint);
  if (r.status === 0) {
    console.log('CAPTURE_VALIDATOR_GREEN_ON_MATRIX');
  } else {
    console.log('CAPTURE_VALIDATOR_RED_ON_MATRIX');
    console.log(r.stderr || r.stdout);
  }
  // Mutation: copy one receipt with is_playing forced false must fail even if matrix later green
  const tmp = mkdtempSync(join(tmpdir(), 'ui-cap-mut-'));
  try {
    cpSync(captures, tmp, { recursive: true });
    const receiptPath = join(tmp, 'main-title-1280x720.receipt.json');
    if (existsSync(receiptPath)) {
      const j = JSON.parse(readFileSync(receiptPath, 'utf8'));
      j.is_playing = false;
      writeFileSync(receiptPath, JSON.stringify(j, null, 2));
      const mut = run(tmp, matrixIdentity.head, matrixIdentity.dirty_tree_fingerprint);
      assert(mut.status !== 0, 'mutation is_playing=false must fail validation');
      assert(String(mut.stderr + mut.stdout).includes('is_playing'), 'mutation message');
      console.log('MUTATION_PROOF_OK is_playing=false rejected');
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Metadata mutations use real rendered PNGs, never the original receipts.
assert(existsSync(captures), 'production capture matrix required for validator regression');
const metadataFixture = mkdtempSync(join(tmpdir(), 'ui-cap-metadata-'));
try {
  cpSync(captures, metadataFixture, { recursive: true });
  const intendedHead = 'a'.repeat(40);
  const intendedFingerprint = 'b'.repeat(64);
  for (const name of readdirSync(metadataFixture).filter(name => name.endsWith('.receipt.json'))) {
    const path = join(metadataFixture, name);
    const receipt = JSON.parse(readFileSync(path, 'utf8'));
    receipt.head = intendedHead;
    receipt.dirty_tree_fingerprint = intendedFingerprint;
    writeFileSync(path, JSON.stringify(receipt));
  }
  const valid = run(metadataFixture, intendedHead, intendedFingerprint);
  assert(valid.status === 0, 'intended non-baseline HEAD must pass: ' + valid.stderr);
  console.log('METADATA_VALID intended HEAD and fingerprint accepted');

  const receiptPath = join(metadataFixture, 'main-title-1280x720.receipt.json');
  const original = readFileSync(receiptPath, 'utf8');
  for (const [field, value, message] of [
    ['head', 'c'.repeat(40), 'head'],
    ['dirty_tree_fingerprint', 'd'.repeat(64), 'fingerprint'],
    ['png_sha256', '0'.repeat(64), 'png_sha256'],
    ['is_playing', false, 'is_playing'],
  ]) {
    const receipt = JSON.parse(original);
    receipt[field] = value;
    writeFileSync(receiptPath, JSON.stringify(receipt));
    const invalid = run(metadataFixture, intendedHead, intendedFingerprint);
    assert(invalid.status !== 0 && invalid.stderr.includes(message), field + ' mismatch must be rejected');
    console.log('METADATA_REJECT ' + field);
  }
  writeFileSync(receiptPath, original);
  const stale = run(metadataFixture, intendedHead, 'e'.repeat(64));
  assert(stale.status !== 0 && stale.stderr.includes('fingerprint'), 'stale matrix must be rejected');
  rmSync(receiptPath);
  const missing = run(metadataFixture, intendedHead, intendedFingerprint);
  assert(missing.status !== 0 && missing.stderr.includes('missing receipt'), 'missing receipt must be rejected');
  assert(run(metadataFixture).status !== 0, 'intended source identity is required');
} finally {
  rmSync(metadataFixture, { recursive: true, force: true });
  console.log('CLEANUP metadata fixture removed');
}
console.log('TEST_VALIDATE_UI_CAPTURES_DONE');
