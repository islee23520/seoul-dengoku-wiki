import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { openAssetDatabase } from '../src/database.mjs';
import {
  GATE_REQUIREMENTS,
  getGateAuditReport,
  getGateStatus,
  installGateEvaluationSchema,
  registerGateEvaluation,
  seedGateEvaluationsFromConfig,
} from '../src/gate-evaluations.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'gate-evaluations-'));
  const db = openAssetDatabase(join(root, 'assets.sqlite'));
  installGateEvaluationSchema(db);
  t.after(() => db.close());

  function asset(path, bytes, { sex = 'female', slot = null, stage = 'work' } = {}) {
    const absolute = join(root, path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, bytes);
    const sha256 = digest(bytes);
    db.prepare('INSERT OR IGNORE INTO content_objects(sha256,byte_size,extension,media_type) VALUES(?,?,?,?)')
      .run(sha256, Buffer.byteLength(bytes), path.endsWith('.json') ? '.json' : '.png', path.endsWith('.json') ? 'application/json' : 'image/png');
    db.prepare(`INSERT INTO asset_paths(path,sha256,byte_size,mtime_ms,stage,asset_class,lifecycle,failure_related,sex,slot,logical_id)
      VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET sha256=excluded.sha256,byte_size=excluded.byte_size,mtime_ms=excluded.mtime_ms`)
      .run(path, sha256, Buffer.byteLength(bytes), Date.now(), stage, stage === 'receipt' ? 'document' : 'image', 'current', 0, sex, slot, null);
    return sha256;
  }

  const sourcePath = '.omo/evidence/source.png';
  const subjectPath = '.omo/evidence/subject.png';
  const sourceSha256 = asset(sourcePath, 'source-v1');
  const subjectSha256 = asset(subjectPath, 'subject-v1', { slot: 'hair' });
  let receiptSequence = 0;

  async function claim({ gate, check, decision = 'PASS', subject = subjectPath, subjectSha = subjectSha256, source = sourcePath, sourceSha = sourceSha256, sex = 'female', slot = 'hair', scope = 'test' }) {
    receiptSequence += 1;
    const receiptPath = `.omo/evidence/receipt-${receiptSequence}.json`;
    const receiptSha256 = asset(receiptPath, JSON.stringify({ gate, check, decision, receiptSequence }), { sex: null, stage: 'receipt' });
    return registerGateEvaluation({
      db, repoRoot: root, subjectPath: subject, subjectSha256: subjectSha,
      sourcePath: source, sourceSha256: sourceSha, receiptPath, receiptSha256,
      sex, slot, gate, check, decision, scope, authority: 'test', summary: `${gate}/${check}/${decision}`,
    });
  }

  return { root, db, asset, claim, sourcePath, subjectPath, sourceSha256, subjectSha256 };
}

async function passChecks(f, gate) {
  for (const check of GATE_REQUIREMENTS[gate]) await f.claim({ gate, check });
}

test('gates pass only in order and complete later evidence remains blocked', async t => {
  const f = fixture(t);
  await passChecks(f, 'gate2');
  let status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'NOT_VERIFIED');
  assert.equal(status.gates.gate2.status, 'BLOCKED');
  assert.deepEqual(status.gates.gate2.blockers.map(item => item.code), ['PREREQUISITE_NOT_PASS']);

  await passChecks(f, 'gate1');
  status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'PASS');
  assert.equal(status.gates.gate2.status, 'PASS');
  assert.equal(status.gates.gate3.status, 'NOT_VERIFIED');

  await passChecks(f, 'gate3');
  status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.deepEqual(Object.values(status.gates).map(gate => gate.status), ['PASS', 'PASS', 'PASS']);
  assert.equal(status.eligible, true);
});

test('source approval, visible ownership, and zero-diff carrier facts cannot complete gates', async t => {
  const f = fixture(t);
  await f.claim({ gate: 'gate1', check: 'source_quality', scope: 'gate1_source' });
  await f.claim({ gate: 'gate1', check: 'visible_ownership', scope: 'gate1_visible_ownership' });
  await f.claim({ gate: 'gate2', check: 'zero_diff_carrier', scope: 'carrier' });
  const status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'NOT_VERIFIED');
  assert.equal(status.gates.gate2.status, 'NOT_VERIFIED');
  assert.equal(status.gates.gate3.status, 'NOT_VERIFIED');
  assert.ok(status.gates.gate1.blockers.some(item => item.check === 'reconstruction'));
});

test('changed source bytes invalidate eligibility without deleting historical claims', async t => {
  const f = fixture(t);
  await passChecks(f, 'gate1'); await passChecks(f, 'gate2'); await passChecks(f, 'gate3');
  assert.equal(getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath }).eligible, true);
  const oldCount = f.db.prepare('SELECT COUNT(*) count FROM gate_evaluation_claims').get().count;
  f.db.exec('DELETE FROM asset_paths;');
  assert.equal(f.db.prepare('SELECT COUNT(*) count FROM gate_evaluation_claims').get().count, oldCount);
  for (const claim of f.db.prepare('SELECT DISTINCT subject_path,subject_sha256,source_path,source_sha256,receipt_path,receipt_sha256 FROM gate_evaluation_claims').all()) {
    for (const [path, sha256] of [[claim.subject_path, claim.subject_sha256], [claim.source_path, claim.source_sha256], [claim.receipt_path, claim.receipt_sha256]]) {
      const bytes = Buffer.from(path === f.sourcePath ? 'source-v1' : path === f.subjectPath ? 'subject-v1' : JSON.stringify({}));
      f.db.prepare(`INSERT OR IGNORE INTO asset_paths(path,sha256,byte_size,mtime_ms,stage,asset_class,lifecycle,failure_related,sex,slot,logical_id)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(path, sha256, bytes.length, Date.now(), path.includes('receipt-') ? 'receipt' : 'work', 'image', 'current', 0, null, null, null);
    }
  }
  assert.equal(getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath }).eligible, true);

  const newSourceSha = digest('source-v2');
  writeFileSync(join(f.root, f.sourcePath), 'source-v2');
  f.db.prepare('INSERT OR IGNORE INTO content_objects(sha256,byte_size,extension,media_type) VALUES(?,?,?,?)').run(newSourceSha, 9, '.png', 'image/png');
  f.db.prepare('UPDATE asset_paths SET sha256 = ?, byte_size = ? WHERE path = ?').run(newSourceSha, 9, f.sourcePath);
  const status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.eligible, false);
  assert.equal(status.gates.gate1.status, 'NOT_VERIFIED');
  assert.ok(status.gates.gate1.blockers.some(item => item.code === 'STALE_SOURCE_HASH'));
  assert.equal(f.db.prepare('SELECT COUNT(*) count FROM gate_evaluation_claims').get().count, oldCount);
  assert.ok(status.history.every(claim => claim.source_sha256 === f.sourceSha256));
});

test('changed or deleted receipt invalidates PASS while preserving claim history', async t => {
  const f = fixture(t);
  await f.claim({ gate: 'gate1', check: 'reconstruction' });
  let status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'PASS');
  const claim = f.db.prepare('SELECT receipt_path,receipt_sha256 FROM gate_evaluation_claims').get();

  const changedSha = f.asset(claim.receipt_path, '{"changed":true}', { sex: null, stage: 'receipt' });
  assert.notEqual(changedSha, claim.receipt_sha256);
  status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'NOT_VERIFIED');
  assert.ok(status.gates.gate1.blockers.some(item => item.code === 'STALE_RECEIPT_HASH'));
  assert.equal(status.gates.gate1.evidence.length, 0);
  assert.equal(status.history.length, 1);

  f.db.prepare('DELETE FROM asset_paths WHERE path = ?').run(claim.receipt_path);
  unlinkSync(join(f.root, claim.receipt_path));
  status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'NOT_VERIFIED');
  assert.ok(status.gates.gate1.blockers.some(item => item.code === 'STALE_RECEIPT_HASH'));
  assert.equal(status.history.length, 1);
});

test('conflicting claims fail closed while pending and missing checks remain distinct', async t => {
  const f = fixture(t);
  await f.claim({ gate: 'gate1', check: 'reconstruction', decision: 'PASS' });
  await f.claim({ gate: 'gate1', check: 'reconstruction', decision: 'FAIL' });
  await f.claim({ gate: 'gate2', check: 'part_ownership', decision: 'PASS' });
  await f.claim({ gate: 'gate2', check: 'hidden_surfaces', decision: 'PENDING' });
  const status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.equal(status.gates.gate1.status, 'FAIL');
  assert.ok(status.gates.gate1.blockers.some(item => item.code === 'CONFLICTING_CLAIMS'));
  assert.equal(status.gates.gate2.intrinsic_status, 'PENDING');
  assert.ok(status.gates.gate2.blockers.some(item => item.code === 'PENDING_CHECK'));
  assert.ok(status.gates.gate2.blockers.some(item => item.code === 'MISSING_CHECK' && item.check === 'sex'));
});

test('registration verifies subject and receipt bytes and rejects a stale claimed hash', async t => {
  const f = fixture(t);
  await assert.rejects(f.claim({ gate: 'gate1', check: 'reconstruction', subjectSha: '0'.repeat(64) }), /subject.*SHA|SHA.*subject/i);
  const receiptPath = '.omo/evidence/manual-receipt.json';
  f.asset(receiptPath, '{}', { sex: null, stage: 'receipt' });
  await assert.rejects(registerGateEvaluation({
    db: f.db, repoRoot: f.root, subjectPath: f.subjectPath, subjectSha256: f.subjectSha256,
    sourcePath: f.sourcePath, sourceSha256: f.sourceSha256, receiptPath, receiptSha256: 'f'.repeat(64),
    sex: 'female', slot: 'hair', gate: 'gate1', check: 'reconstruction', decision: 'PASS', scope: 'test',
  }), /receipt.*SHA|SHA.*receipt/i);
});

test('registration rejects repository escapes and symlinks', async t => {
  const f = fixture(t);
  const outsideRoot = mkdtempSync(join(tmpdir(), 'gate-outside-'));
  const outsidePath = join(outsideRoot, 'outside.png');
  writeFileSync(outsidePath, 'outside');
  const outsideSha = digest('outside');
  await assert.rejects(f.claim({ gate: 'gate1', check: 'reconstruction', subject: '../outside.png', subjectSha: outsideSha }), /repository-relative|escape/i);
  await assert.rejects(f.claim({ gate: 'gate1', check: 'reconstruction', subject: outsidePath, subjectSha: outsideSha }), /repository-relative/i);

  const linkPath = '.omo/evidence/linked-subject.png';
  symlinkSync(outsidePath, join(f.root, linkPath));
  f.db.prepare('INSERT OR IGNORE INTO content_objects(sha256,byte_size,extension,media_type) VALUES(?,?,?,?)').run(outsideSha, 7, '.png', 'image/png');
  f.db.prepare(`INSERT INTO asset_paths(path,sha256,byte_size,mtime_ms,stage,asset_class,lifecycle,failure_related,sex,slot,logical_id)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(linkPath, outsideSha, 7, Date.now(), 'work', 'image', 'current', 0, 'female', 'hair', null);
  await assert.rejects(f.claim({ gate: 'gate1', check: 'reconstruction', subject: linkPath, subjectSha: outsideSha }), /symbolic links/i);
});

test('config seeding preserves named scopes but reports Gate2 and Gate3 NOT_VERIFIED', async t => {
  const f = fixture(t);
  const sourceReceipt = '.omo/evidence/source-verdict.json';
  const ownerReceipt = '.omo/evidence/owner-verdict.json';
  f.asset(sourceReceipt, '{"status":"PASS"}', { sex: null, stage: 'receipt' });
  f.asset(ownerReceipt, '{"status":"PASS"}', { sex: null, stage: 'receipt' });
  const configPath = 'config/asset-decisions.json';
  f.asset(configPath, JSON.stringify({ version: 1, decisions: [
    { path: f.sourcePath, sha256: f.sourceSha256, decision: 'PASS', authority: 'curator', receipt: sourceReceipt, properties: { role: 'foundation_body', gate_scope: 'gate1_source' } },
    { path: f.subjectPath, sha256: f.subjectSha256, decision: 'PASS', authority: 'curator', receipt: ownerReceipt, properties: { role: 'hair', gate_scope: 'gate1_visible_ownership' } },
  ] }), { sex: null, stage: 'receipt' });

  const result = await seedGateEvaluationsFromConfig({ db: f.db, repoRoot: f.root, configPath });
  assert.equal(result.registered, 2);
  const scopes = f.db.prepare('SELECT scope FROM gate_evaluation_claims ORDER BY scope').all().map(row => row.scope);
  assert.deepEqual(scopes, ['gate1_source', 'gate1_visible_ownership']);
  const status = getGateStatus({ db: f.db, sex: 'female', slot: 'hair', sourcePath: f.sourcePath });
  assert.deepEqual(Object.values(status.gates).map(gate => gate.status), ['NOT_VERIFIED', 'NOT_VERIFIED', 'NOT_VERIFIED']);
});

test('audit report is grouped per sex, slot, source and includes blockers and history', async t => {
  const f = fixture(t);
  await f.claim({ gate: 'gate1', check: 'reconstruction' });
  const report = getGateAuditReport({ db: f.db });
  assert.equal(report.entries.length, 1);
  assert.deepEqual({ sex: report.entries[0].sex, slot: report.entries[0].slot, source_path: report.entries[0].source.path },
    { sex: 'female', slot: 'hair', source_path: f.sourcePath });
  assert.equal(report.entries[0].gates.gate1.status, 'PASS');
  assert.ok(report.entries[0].gates.gate2.blockers.length > 0);
  assert.equal(report.entries[0].history.length, 1);
});
