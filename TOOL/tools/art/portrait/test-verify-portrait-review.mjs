import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import {
  CHECKPOINTS,
  NUMERIC_GATES,
  QUALITY_ROWS,
  REFERENCE_SHA256,
  verifyPortraitReview,
} from './verify-portrait-review.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), 'portrait-review-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (rel, body) => {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return { path: rel, sha256: sha256(Buffer.from(body)) };
  };
  return { root, put };
}

/** A complete, admissible, fully passing GQ2 variant review. */
function goodRecord(put) {
  const reference = put('Tool/art/portrait/original/target.png', 'reference-bytes');
  const candidate = put('evidence/hair-03.png', 'candidate-bytes');
  const crops = Object.fromEntries(
    QUALITY_ROWS.map((row) => [row, put(`evidence/crops/${row}.png`, `crop-${row}`)]),
  );
  return {
    schema_version: 1,
    checkpoint: 'GQ2',
    reviewer: { name: 'owner', role: 'owner' },
    reviewed_at: '2026-09-15T04:30:00Z',
    subject: {
      kind: 'variant',
      id: 'female/hair/hair-03',
      sex: 'female',
      slot: 'hair',
      candidate,
      contributing: [{ slot: 'hair', ...candidate }],
    },
    reference: { ...reference, sha256: REFERENCE_SHA256 },
    inspection: {
      native_crops: Object.values(crops),
      full_50pct: put('evidence/full-50pct.png', '50pct'),
      demo_scale: put('evidence/demo-scale.png', 'demo'),
      isolated_backdrops: ['black', 'gray', 'white'],
    },
    rows: QUALITY_ROWS.map((row) => ({
      id: row,
      verdict: 'PASS',
      crop: crops[row].path,
      observation: `${row} matches the reference at native scale.`,
    })),
    numeric_gates: Object.fromEntries(NUMERIC_GATES.map((gate) => [gate, 'PASS'])),
  };
}

test('exports the frozen reference hash and the full checkpoint vocabulary', () => {
  assert.equal(REFERENCE_SHA256, 'c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9');
  assert.deepEqual(QUALITY_ROWS, ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q09', 'Q10']);
  assert.deepEqual(CHECKPOINTS, ['GQ1', 'GQ2', 'GQ3', 'GQ4']);
  assert.deepEqual(NUMERIC_GATES, [
    'dimensions', 'anchors', 'alpha', 'coverage', 'slot_counts',
    'distinct_content', 'common_shoulders', 'preservation', 'source_over_order',
  ]);
});

test('a complete owner-reviewed record with every row PASS is accepted', (t) => {
  const { root, put } = workspace(t);
  const report = verifyPortraitReview(goodRecord(put), { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, true);
  assert.deepEqual(report.blocking, []);
  assert.equal(report.checkpoint, 'GQ2');
});

test('a reference hash other than the frozen target is rejected', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.reference.sha256 = 'f'.repeat(64);
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'reference_not_frozen'));
  assert.equal(report.accepted, false);
});

test('a missing or duplicated quality row is rejected', (t) => {
  const { root, put } = workspace(t);
  const short = goodRecord(put);
  short.rows = short.rows.filter((row) => row.id !== 'Q07');
  assert.ok(verifyPortraitReview(short, { repoRoot: root }).errors.some((e) => e.code === 'rows_incomplete'));

  const doubled = goodRecord(put);
  doubled.rows.push({ ...doubled.rows[0] });
  assert.ok(verifyPortraitReview(doubled, { repoRoot: root }).errors.some((e) => e.code === 'rows_duplicated'));
});

test('one FAIL row blocks acceptance and no other PASS compensates', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.rows.find((row) => row.id === 'Q08').verdict = 'FAIL';
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, false);
  assert.deepEqual(report.blocking, [{ row: 'Q08', verdict: 'FAIL' }]);
});

test('NOT_VERIFIED blocks acceptance without being a schema error', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  const row = record.rows.find((r) => r.id === 'Q03');
  row.verdict = 'NOT_VERIFIED';
  delete row.crop;
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, false);
  assert.deepEqual(report.blocking, [{ row: 'Q03', verdict: 'NOT_VERIFIED' }]);
});

test('a PASS row without a bound native crop is downgraded to NOT_VERIFIED', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  const row = record.rows.find((r) => r.id === 'Q05');
  delete row.crop;
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.equal(report.accepted, false);
  assert.deepEqual(report.blocking, [{ row: 'Q05', verdict: 'NOT_VERIFIED', downgraded_from: 'PASS', reason: 'crop_missing' }]);
});

test('a PASS crop that is not in the recorded native crop set is downgraded', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  put('evidence/crops/stray.png', 'stray');
  record.rows.find((r) => r.id === 'Q06').crop = 'evidence/crops/stray.png';
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.deepEqual(report.blocking, [{ row: 'Q06', verdict: 'NOT_VERIFIED', downgraded_from: 'PASS', reason: 'crop_unbound' }]);
});

test('a PASS crop whose file is absent or altered is downgraded', (t) => {
  const { root, put } = workspace(t);
  const missing = goodRecord(put);
  missing.inspection.native_crops.push({ path: 'evidence/crops/ghost.png', sha256: 'a'.repeat(64) });
  missing.rows.find((r) => r.id === 'Q02').crop = 'evidence/crops/ghost.png';
  assert.deepEqual(verifyPortraitReview(missing, { repoRoot: root }).blocking,
    [{ row: 'Q02', verdict: 'NOT_VERIFIED', downgraded_from: 'PASS', reason: 'crop_file_mismatch' }]);

  const altered = goodRecord(put);
  altered.inspection.native_crops.find((c) => c.path.endsWith('Q04.png')).sha256 = 'b'.repeat(64);
  assert.deepEqual(verifyPortraitReview(altered, { repoRoot: root }).blocking,
    [{ row: 'Q04', verdict: 'NOT_VERIFIED', downgraded_from: 'PASS', reason: 'crop_file_mismatch' }]);
});

test('a worker reviewer can never produce PASS', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.reviewer = { name: 'st_01a0a3c5', role: 'worker' };
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, false);
  assert.equal(report.blocking.length, QUALITY_ROWS.length);
  assert.ok(report.blocking.every((b) => b.verdict === 'NOT_VERIFIED' && b.reason === 'reviewer_not_lead'));
});

test('N/A needs a reason and is refused on a composite or delivery subject', (t) => {
  const { root, put } = workspace(t);
  const noReason = goodRecord(put);
  const row = noReason.rows.find((r) => r.id === 'Q09');
  row.verdict = 'N/A';
  delete row.crop;
  assert.ok(verifyPortraitReview(noReason, { repoRoot: root }).errors.some((e) => e.code === 'na_without_reason'));

  const isolated = goodRecord(put);
  const ok = isolated.rows.find((r) => r.id === 'Q09');
  ok.verdict = 'N/A';
  delete ok.crop;
  ok.reason = 'An isolated hair plate carries no garment construction.';
  const isolatedReport = verifyPortraitReview(isolated, { repoRoot: root });
  assert.deepEqual(isolatedReport.errors, []);
  assert.equal(isolatedReport.accepted, true);

  const composite = goodRecord(put);
  composite.checkpoint = 'GQ3';
  composite.subject.kind = 'composite';
  composite.subject.variant_ids = { hair: 'hair-03', clothes: 'clothes-01' };
  composite.subject.crosses = ['h1-r1', 'h1-r2', 'h2-r1', 'h2-r2'];
  const naRow = composite.rows.find((r) => r.id === 'Q09');
  naRow.verdict = 'N/A';
  naRow.reason = 'not applicable';
  delete naRow.crop;
  assert.ok(verifyPortraitReview(composite, { repoRoot: root }).errors.some((e) => e.code === 'na_on_composite'));
});

test('every numeric gate must be recorded and PASS separately from the art verdict', (t) => {
  const { root, put } = workspace(t);
  const partial = goodRecord(put);
  delete partial.numeric_gates.anchors;
  assert.ok(verifyPortraitReview(partial, { repoRoot: root }).errors.some((e) => e.code === 'numeric_gates_incomplete'));

  const failed = goodRecord(put);
  failed.numeric_gates.common_shoulders = 'FAIL';
  const report = verifyPortraitReview(failed, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, false);
  assert.deepEqual(report.blocking, [{ gate: 'common_shoulders', verdict: 'FAIL' }]);
});

test('an aggregate score field is refused outright', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.score = 9.1;
  assert.ok(verifyPortraitReview(record, { repoRoot: root }).errors.some((e) => e.code === 'aggregate_score_forbidden'));
});

test('an isolated variant must be inspected on black, gray and white', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.inspection.isolated_backdrops = ['black', 'white'];
  assert.ok(verifyPortraitReview(record, { repoRoot: root }).errors.some((e) => e.code === 'backdrops_incomplete'));
});

test('GQ3 requires the four recorded two-front/two-rear crosses', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.checkpoint = 'GQ3';
  record.subject.kind = 'composite';
  record.subject.variant_ids = { hair: 'hair-03', hair_back: 'hair_back-01' };
  record.subject.crosses = ['h1-r1', 'h1-r2', 'h2-r1'];
  assert.ok(verifyPortraitReview(record, { repoRoot: root }).errors.some((e) => e.code === 'crosses_incomplete'));
});

test('GQ4 requires a registered character id and a bound export', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.checkpoint = 'GQ4';
  record.subject.kind = 'delivery';
  assert.ok(verifyPortraitReview(record, { repoRoot: root }).errors.some((e) => e.code === 'character_id_required'));

  record.subject.character_id = 'K001';
  record.subject.export = put('evidence/K001.png', 'export-bytes');
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, true);
});

test('an unknown checkpoint, verdict or timestamp is refused', (t) => {
  const { root, put } = workspace(t);
  const checkpoint = goodRecord(put);
  checkpoint.checkpoint = 'GQ9';
  assert.ok(verifyPortraitReview(checkpoint, { repoRoot: root }).errors.some((e) => e.code === 'unknown_checkpoint'));

  const verdict = goodRecord(put);
  verdict.rows[0].verdict = 'OK';
  assert.ok(verifyPortraitReview(verdict, { repoRoot: root }).errors.some((e) => e.code === 'unknown_verdict'));

  const stamp = goodRecord(put);
  stamp.reviewed_at = '2026-09-15';
  assert.ok(verifyPortraitReview(stamp, { repoRoot: root }).errors.some((e) => e.code === 'reviewed_at_not_utc'));
});

test('ledger prose verdicts normalize conservatively instead of being refused', async () => {
  const { normalizeVerdict } = await import('./verify-portrait-review.mjs');
  // A bare PASS is the only pass.
  assert.deepEqual(normalizeVerdict('PASS'), { verdict: 'PASS', qualifier: null, raw: 'PASS' });
  // A qualified pass is not a pass of the whole row.
  for (const raw of ['PASS limited garment-only', 'PASS local', 'PASS targeted']) {
    const normalized = normalizeVerdict(raw);
    assert.equal(normalized.verdict, 'NOT_VERIFIED', raw);
    assert.ok(normalized.qualifier, raw);
  }
  // Deferring a failure does not clear it.
  assert.equal(normalizeVerdict('FAIL').verdict, 'FAIL');
  assert.equal(normalizeVerdict('FAIL DEFERRED').verdict, 'FAIL');
  assert.equal(normalizeVerdict('FAIL in foundation03 review').verdict, 'FAIL');
  // Nothing else is a recorded pass.
  for (const raw of ['NOT VERIFIED', 'NOT VERIFIED DEFERRED', 'NOT CLAIMED', 'BLOCKED',
    'PENDING lead image channel', 'IMPROVED_NOT_ACCEPTED', 'NOT ACCEPTED by this promotion',
    'APPROVED', 'FAIL/NOT VERIFIED by lineage']) {
    assert.ok(['NOT_VERIFIED', 'FAIL'].includes(normalizeVerdict(raw).verdict), raw);
  }
  assert.equal(normalizeVerdict('PASS').qualifier, null);
});

test('a record written in ledger prose is graded, not rejected', (t) => {
  const { root, put } = workspace(t);
  const record = goodRecord(put);
  record.rows.find((r) => r.id === 'Q05').verdict = 'PASS limited garment-only';
  record.rows.find((r) => r.id === 'Q02').verdict = 'FAIL DEFERRED';
  const report = verifyPortraitReview(record, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.accepted, false);
  assert.deepEqual(report.blocking.map((b) => [b.row, b.verdict]).sort(), [
    ['Q02', 'FAIL'],
    ['Q05', 'NOT_VERIFIED'],
  ]);
  assert.equal(report.blocking.find((b) => b.row === 'Q05').reason, 'qualified_pass');
});

test('every verdict token observed in the Stage-2/3 ledger is admissible', async () => {
  const { normalizeVerdict, VERDICT_NORMALIZATION } = await import('./verify-portrait-review.mjs');
  for (const raw of VERDICT_NORMALIZATION.observed_tokens) {
    assert.ok(['PASS', 'FAIL', 'NOT_VERIFIED'].includes(normalizeVerdict(raw).verdict), raw);
  }
  assert.equal(normalizeVerdict('definitely not a verdict'), null);
});
