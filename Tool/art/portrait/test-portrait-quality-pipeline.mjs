import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import {
  applySequencing,
  evaluateGate4,
  evaluatePortraitQualityPipeline,
  runPortraitQualityPipeline,
  verifyPortraitQualityReceipts,
} from './portrait-quality-pipeline.mjs';

const repo = resolve(import.meta.dirname, '../../..');
const contract = JSON.parse(readFileSync(join(repo, 'Tool/art/portrait/portrait-quality-contract.json')));
function put(root, path, body) {
  const full = join(root, path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, body); return full;
}

let evaluated;
test('current gates execute with Gate 1/2/3 PASS and Gate 4 honestly PENDING', async () => {
  evaluated = await evaluatePortraitQualityPipeline({ repoRoot: repo });
  assert.deepEqual(evaluated.receipts.map(({ gate_id, status }) => [gate_id, status]), [
    ['gate1', 'PASS'], ['gate2', 'PASS'], ['gate3', 'PASS'], ['gate4', 'PENDING'],
  ]);
  const parity = evaluated.receipts[1].checks.find((row) => row.id === 'eligible_catalog_parity');
  assert.equal(parity.status, 'PASS');
  assert.equal(parity.metrics.production_keys, parity.metrics.eligible_unique_catalog_keys);
  const gate3 = evaluated.receipts[2];
  assert.equal(gate3.checks.find((row) => row.id === 'browser_offline_rgba_parity').status, 'PASS');
  // Attachment rigs are informational per the contract policy: metrics recorded, no thresholds enforced.
  assert.equal(gate3.checks.find((row) => row.id === 'attachment_graph').status, 'PASS');
  assert.equal(gate3.checks.find((row) => row.id === 'attachment_graph').metrics.policy, 'informational');
  assert.equal(gate3.checks.find((row) => row.id === 'visual_combination_verdicts').status, 'PASS');
});

test('each gate result supports PASS, PENDING, and FAIL and sequencing blocks later PASS', () => {
  const make = (gate_id, status) => ({ version: 1, gate_id, status, input_bindings: [], checks: [], blockers: [] });
  for (const status of ['PASS', 'PENDING', 'FAIL']) assert.equal(make('gate1', status).status, status);
  const sequenced = applySequencing([make('gate1', 'PENDING'), make('gate2', 'PASS'), make('gate3', 'PASS'), make('gate4', 'PASS')]);
  assert.deepEqual(sequenced.map((row) => row.status), ['PENDING', 'PENDING', 'PENDING', 'PENDING']);
  assert.ok(sequenced.slice(1).every((row) => row.blockers.some((blocker) => blocker.code === 'prior_gate_not_pass')));
});

test('Gate 4 stays PENDING without a user packet and fails an incomplete packet', () => {
  const missing = evaluateGate4({ repoRoot: repo, contract });
  assert.equal(missing.status, 'PENDING');
  assert.ok(missing.blockers.some((row) => row.code === 'user_curation_packet_required'));
});

test('receipt verifier accepts generated receipts and refuses stale or arbitrary hand-written PASS', async (t) => {
  const output = `.omo/evidence/portrait-stage23/quality-pipeline-test-${process.pid}`;
  const receipts = join(repo, output);
  t.after(() => rmSync(receipts, { recursive: true, force: true }));
  const generated = await runPortraitQualityPipeline({ repoRoot: repo, output });
  assert.equal(generated.gates.gate1, 'PASS');
  assert.equal((await verifyPortraitQualityReceipts({ repoRoot: repo, receiptsDir: output })).status, 'PASS');

  const gate1Path = join(receipts, 'gate1.json');
  const gate1 = JSON.parse(readFileSync(gate1Path));
  gate1.status = 'PASS';
  gate1.checks = [];
  gate1.blockers = [];
  writeFileSync(gate1Path, JSON.stringify(gate1));
  let report = await verifyPortraitQualityReceipts({ repoRoot: repo, receiptsDir: output });
  assert.equal(report.status, 'FAIL');
  assert.ok(report.errors.some((row) => row.code === 'receipt_not_reproducible'));

  await runPortraitQualityPipeline({ repoRoot: repo, output });
  const gate3Path = join(receipts, 'gate3.json');
  const gate3 = JSON.parse(readFileSync(gate3Path));
  gate3.input_bindings[0].sha256 = '0'.repeat(64);
  gate3.checks.find((row) => row.id === 'current_combination_matrix').artifacts[0].sha256 = '0'.repeat(64);
  writeFileSync(gate3Path, JSON.stringify(gate3));
  report = await verifyPortraitQualityReceipts({ repoRoot: repo, receiptsDir: output });
  assert.equal(report.status, 'FAIL');
  assert.ok(report.errors.filter((row) => row.code === 'hash_mismatch').length >= 2);
});

test('Gate 4 invokes curation verifier and refuses missing decisions/feedback binding', () => {
  const packetPath = '.omo/evidence/portrait-stage23/quality-pipeline-test-incomplete-curation.json';
  const catalog = JSON.parse(readFileSync(join(repo, contract.gate4.catalog)));
  const packet = {
    schema: 'janseon.portrait-curation.v1',
    catalog: { path: contract.gate4.catalog, sha256: catalog.sha256 },
    decisions: [], validation_receipts: [], feedback_sha256: '0'.repeat(64),
  };
  put(repo, packetPath, `${JSON.stringify(packet)}\n`);
  try {
    const result = evaluateGate4({ repoRoot: repo, contract, curationPacket: packetPath });
    assert.equal(result.status, 'FAIL');
    assert.equal(result.checks.find((row) => row.id === 'all_records_decided').metrics.required, 259);
    assert.equal(result.checks.find((row) => row.id === 'feedback_bound_checkpoint').status, 'FAIL');
  } finally { rmSync(join(repo, packetPath), { force: true }); }
});
