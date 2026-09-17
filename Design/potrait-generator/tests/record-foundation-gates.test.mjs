import assert from 'node:assert/strict';
import test from 'node:test';
import { foundationClaims } from '../src/record-foundation-gates.mjs';
import { ORIGINAL_GATE1_SLOTS } from '../src/verify-foundations.mjs';

const hash = 'a'.repeat(64);
function report() {
  return { overall_verdict: 'VERIFIED_EXACT_PARTITIONS', foundations: ['female','male'].map(sex => ({
    sex, baseline_verdict: 'VERIFIED_EXACT_PARTITION', source: { path: `${sex}/source.png`, actual_sha256: hash, expected_sha256: hash },
    partition: { verified: true, gap_pixels: 0, overlap_pixels: 0, partial_alpha_pixels: 0, alpha_zero_rgb_violations: 0, owned_rgba_mismatch_pixels: 0, hash_drift_files: 0,
      slots: ORIGINAL_GATE1_SLOTS.map(id=>({ id, path: `${sex}/${id}.png`, sha256: hash, expected_sha256: hash })) },
    reconstruction: { changed_pixels: 0, max_channel_delta: 0 }, failures: [],
  })) };
}

test('only verified full partitions produce Gate1 claims, no inferred Gate2 or Gate3', () => {
  const rows = foundationClaims(report(), 'work/receipt.json', hash);
  assert.equal(rows.length, 46);
  assert.ok(rows.every(row => row.gate === 'gate1' && row.check === 'reconstruction' && row.decision === 'PASS'));
  assert.deepEqual(rows.filter(row=>row.slot==='face_base').map(row=>row.sex), ['female','male']);
});

test('declared PASS cannot hide bad partition metrics or a changed source', () => {
  const flawed = report(); flawed.foundations[0].partition.gap_pixels = 1;
  assert.throws(() => foundationClaims(flawed, 'work/receipt.json', hash), /verified/);
  const drift = report(); drift.foundations[0].source.actual_sha256 = 'b'.repeat(64);
  assert.throws(() => foundationClaims(drift, 'work/receipt.json', hash), /verified/);
  const incomplete = report(); incomplete.foundations[0].partition.slots.pop();
  assert.throws(() => foundationClaims(incomplete, 'work/receipt.json', hash), /verified/);
});
