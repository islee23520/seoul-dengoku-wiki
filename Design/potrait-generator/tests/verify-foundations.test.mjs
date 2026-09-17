import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { encodePng, decodePng } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';
import {
  ORIGINAL_GATE1_SCHEMA,
  ORIGINAL_GATE1_SLOTS,
  resolveLiveFoundation,
  verifyDecodedPartition,
} from '../src/verify-foundations.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function image(width, height, rgba) {
  const pixels = Uint8Array.from(rgba);
  const bytes = encodePng(width, height, pixels);
  return { image: decodePng(bytes), bytes, sha256: digest(bytes) };
}

function layer(id, width, height, rgba, expectedSha256 = null) {
  const encoded = image(width, height, rgba);
  return { id, ...encoded, expectedSha256: expectedSha256 ?? encoded.sha256 };
}

const transparent = [0, 0, 0, 0];

function fixtureLayers() {
  const source = image(2, 1, [
    10, 20, 30, 255,
    40, 50, 60, 255,
  ]).image;
  const left = layer('left', 2, 1, [
    10, 20, 30, 255,
    ...transparent,
  ]);
  const right = layer('right', 2, 1, [
    ...transparent,
    40, 50, 60, 255,
  ]);
  return { source, left, right };
}

test('original Gate1 schema remains the frozen 22-slot recipe rather than the 23-slot UI schema', () => {
  assert.equal(ORIGINAL_GATE1_SLOTS.length, 22);
  assert.deepEqual(ORIGINAL_GATE1_SCHEMA.slots.map(slot => [slot.id, slot.z]), ORIGINAL_GATE1_SLOTS.map((id, z) => [id, z]));
  assert.equal(ORIGINAL_GATE1_SLOTS.includes('eyes_white'), false);
  assert.deepEqual(ORIGINAL_GATE1_SLOTS.slice(11, 14), ['eyes_shape', 'eyes_color', 'ears']);
});

test('live foundation resolution selects male by exact database sex when female config entries come first', () => {
  const hashes = {
    female: '1'.repeat(64),
    male: '2'.repeat(64),
    receipt: '3'.repeat(64),
    slot: '4'.repeat(64),
  };
  const sourcePath = sex => `.omo/evidence/${sex}-foundation/source.png`;
  const facePath = sex => `.omo/evidence/${sex}-foundation/final/slots/face_base.png`;
  const receiptPath = sex => `.omo/evidence/${sex}-foundation/VERDICT.md`;
  const decisions = [];
  for (const sex of ['female', 'male']) {
    decisions.push(
      { path: sourcePath(sex), sha256: hashes[sex], receipt: receiptPath(sex), properties: { role: 'foundation_body', gate_scope: 'gate1_source' } },
      { path: facePath(sex), sha256: hashes[sex], receipt: receiptPath(sex), properties: { role: 'face_base', gate_scope: 'gate1_visible_ownership' } },
    );
  }
  const rows = new Map();
  for (const sex of ['female', 'male']) {
    rows.set(sourcePath(sex), { path: sourcePath(sex), sha256: hashes[sex], sex, slot: null, lifecycle: 'current' });
    rows.set(receiptPath(sex), { path: receiptPath(sex), sha256: hashes.receipt, sex: null, slot: null, lifecycle: 'current' });
    for (const id of ORIGINAL_GATE1_SLOTS) {
      const path = `.omo/evidence/${sex}-foundation/final/slots/${id}.png`;
      rows.set(path, { path, sha256: id === 'face_base' ? hashes[sex] : hashes.slot, sex, slot: id, lifecycle: 'current' });
    }
  }
  const db = { prepare: () => ({ get: path => rows.get(path) }) };
  const resolved = resolveLiveFoundation({ db, config: { decisions }, sex: 'male', repoRoot: '/repo' });
  assert.equal(resolved.sex, 'male');
  assert.equal(resolved.source.path, sourcePath('male'));
  assert.equal(resolved.source.expectedSha256, hashes.male);
  assert.equal(resolved.slots.find(slot => slot.id === 'face_base').path, facePath('male'));
});

test('tiny exact one-hot partition passes decoded RGBA verification', () => {
  const { source, left, right } = fixtureLayers();
  const result = verifyDecodedPartition({ source, layers: [left, right] });
  assert.equal(result.verified, true);
  assert.equal(result.gap_pixels, 0);
  assert.equal(result.overlap_pixels, 0);
  assert.equal(result.owned_rgba_mismatch_pixels, 0);
  assert.equal(result.alpha_zero_rgb_violations, 0);
  assert.deepEqual(result.failures, []);
});

test('tiny partition fails closed on a visible ownership gap', () => {
  const { source, left } = fixtureLayers();
  const emptyRight = layer('right', 2, 1, [...transparent, ...transparent]);
  const result = verifyDecodedPartition({ source, layers: [left, emptyRight] });
  assert.equal(result.verified, false);
  assert.equal(result.gap_pixels, 1);
  assert.ok(result.failures.some(failure => failure.code === 'OWNERSHIP_GAP' && failure.pixels === 1));
});

test('tiny partition fails closed on visible ownership overlap', () => {
  const { source, left, right } = fixtureLayers();
  const overlappingRight = layer('right', 2, 1, [
    10, 20, 30, 255,
    ...right.image.pixels.subarray(4, 8),
  ]);
  const result = verifyDecodedPartition({ source, layers: [left, overlappingRight] });
  assert.equal(result.verified, false);
  assert.equal(result.overlap_pixels, 1);
  assert.ok(result.failures.some(failure => failure.code === 'OWNERSHIP_OVERLAP' && failure.pixels === 1));
});

test('tiny partition fails closed on bytes/hash drift and decoded owned-pixel drift', () => {
  const { source, left, right } = fixtureLayers();
  const driftedRight = layer('right', 2, 1, [
    ...transparent,
    41, 50, 60, 255,
  ], right.sha256);
  const result = verifyDecodedPartition({ source, layers: [left, driftedRight] });
  assert.equal(result.verified, false);
  assert.equal(result.hash_drift_files, 1);
  assert.equal(result.owned_rgba_mismatch_pixels, 1);
  assert.ok(result.failures.some(failure => failure.code === 'HASH_DRIFT'));
  assert.ok(result.failures.some(failure => failure.code === 'OWNED_RGBA_DRIFT'));
});

test('alpha cleanup rejects partial alpha and nonzero RGB under alpha zero', () => {
  const source = image(2, 1, [10, 20, 30, 255, 40, 50, 60, 255]).image;
  const dirty = layer('dirty', 2, 1, [10, 20, 30, 128, 1, 2, 3, 0]);
  const result = verifyDecodedPartition({ source, layers: [dirty] });
  assert.equal(result.verified, false);
  assert.equal(result.partial_alpha_pixels, 1);
  assert.equal(result.alpha_zero_rgb_violations, 1);
  assert.ok(result.failures.some(failure => failure.code === 'PARTIAL_ALPHA'));
  assert.ok(result.failures.some(failure => failure.code === 'DIRTY_ALPHA_ZERO_RGB'));
});
