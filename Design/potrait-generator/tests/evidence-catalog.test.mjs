import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { openAssetDatabase } from '../src/database.mjs';
import { scanEvidence } from '../src/scanner.mjs';
import { exportViews } from '../src/views.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function pngHeader(width = 1145, height = 1374) {
  const bytes = Buffer.alloc(26);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  bytes[24] = 8;
  bytes[25] = 6;
  return bytes;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'potrait-generator-'));
  const evidence = join(root, '.omo/evidence');
  mkdirSync(join(evidence, 'raw/female'), { recursive: true });
  mkdirSync(join(evidence, 'work/female'), { recursive: true });
  mkdirSync(join(evidence, 'review/female'), { recursive: true });
  const bytes = pngHeader();
  const target = '.omo/evidence/work/female/face-base-candidate.png';
  const targetSha = digest(bytes);
  writeFileSync(join(evidence, 'raw/female/face_base.png'), bytes);
  writeFileSync(join(root, target), bytes);
  writeFileSync(join(evidence, 'review/female/face-base-contact.png'), pngHeader(320, 240));
  const receipt = '.omo/evidence/work/female/acceptance.json';
  writeFileSync(join(root, receipt), JSON.stringify({
    status: 'PENDING', scope: 'package',
    subject: { path: '.omo/evidence/work/female/unbuilt.png', sha256: '0'.repeat(64) },
    evaluations: [{ status: 'PASS', scope: 'visual_review', subject: { path: target, sha256: targetSha } }],
  }));
  return { root, evidence, target, targetSha, receipt, dbPath: join(root, 'assets.sqlite'), views: join(root, 'views') };
}

async function scan(f, db, decisionsPath = join(f.root, 'missing-decisions.json')) {
  return scanEvidence({ db, repoRoot: f.root, evidenceRoot: f.evidence, decisionsPath });
}

test('additional work roots are scanned in the same catalog without widening or duplicating evidence', async () => {
  const f = fixture();
  const workRoot = join(f.root, 'Design/potrait-generator/work');
  const generated = 'Design/potrait-generator/work/verify-foundations';
  const generatedTarget = `${generated}/foundation.png`;
  const generatedReceipt = `${generated}/receipt.json`;
  const generatedBytes = Buffer.from('generated-foundation');
  mkdirSync(join(f.root, generated), { recursive: true });
  mkdirSync(join(f.root, 'Design/potrait-generator/data'), { recursive: true });
  writeFileSync(join(f.root, generatedTarget), generatedBytes);
  writeFileSync(join(f.root, generatedReceipt), JSON.stringify({
    status: 'PASS', scope: 'foundation_registration',
    subject: { path: generatedTarget, sha256: digest(generatedBytes) },
  }));
  writeFileSync(join(f.root, 'Design/potrait-generator/data/not-scanned.png'), Buffer.from('vault'));

  const db = openAssetDatabase(f.dbPath);
  const result = await scanEvidence({
    db, repoRoot: f.root, evidenceRoot: f.evidence,
    additionalRoots: [workRoot, join(workRoot, 'verify-foundations')],
    decisionsPath: join(f.root, 'missing-decisions.json'),
  });
  assert.equal(result.filesScanned, 6);
  assert.equal(result.receipts, 2);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM asset_paths').get().count, 6);
  assert.equal(db.prepare('SELECT stage FROM asset_paths WHERE path = ?').get(generatedReceipt).stage, 'receipt');
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(generatedTarget).decision, 'PASS');
  assert.equal(db.prepare("SELECT COUNT(*) count FROM asset_paths WHERE path LIKE 'Design/potrait-generator/data/%'").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM asset_paths WHERE path LIKE '.omo/evidence/%'").get().count, 4);
  db.close();
});

test('additional roots outside the repository are rejected before catalog mutation', async () => {
  const f = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'potrait-generator-outside-'));
  writeFileSync(join(outside, 'receipt.json'), '{}');
  const escapedRoot = join(f.root, 'Design/potrait-generator/work-link');
  mkdirSync(join(f.root, 'Design/potrait-generator'), { recursive: true });
  symlinkSync(outside, escapedRoot);
  const db = openAssetDatabase(f.dbPath);
  await assert.rejects(scanEvidence({
    db, repoRoot: f.root, evidenceRoot: f.evidence, additionalRoots: [escapedRoot],
    decisionsPath: join(f.root, 'missing-decisions.json'),
  }), /additional scan root must be inside the repository/);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM asset_paths').get().count, 0);
  db.close();
});

test('explicit child decision binds exact path and SHA without inheriting root status', async () => {
  const f = fixture();
  const db = openAssetDatabase(f.dbPath);
  const first = await scan(f, db);
  assert.equal(first.filesScanned, 4);
  assert.equal(first.contentObjects, 3);
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'PASS');
  const claims = db.prepare('SELECT decision, dimension, target_path FROM evaluation_observations ORDER BY decision').all();
  assert.deepEqual(claims.map(({ decision }) => decision), ['PASS', 'PENDING']);
  assert.equal(claims.find(claim => claim.decision === 'PASS').dimension, 'visual_review');
  db.close();
});

test('prose input references in failed output documents stay informational', async () => {
  const f = fixture();
  const input = '.omo/evidence/raw/female/face_base.png';
  writeFileSync(join(f.evidence, 'work/female/OWNER-REJECTION.md'), [
    '# Failed output', 'Status: **REJECTED**', `Input: ${input}`, `Output: ${f.target}`,
  ].join('\n'));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db);
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(input).decision, 'UNREVIEWED');
  assert.equal(db.prepare("SELECT COUNT(*) count FROM evaluation_observations WHERE receipt_path LIKE '%OWNER-REJECTION.md' AND decision != 'UNREVIEWED'").get().count, 0);
  db.close();
});

test('changed asset SHA invalidates an otherwise current decision', async () => {
  const f = fixture();
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db);
  writeFileSync(join(f.root, f.target), Buffer.from('changed-pixels'));
  await scan(f, db);
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'UNREVIEWED');
  assert.equal(db.prepare('SELECT COUNT(*) count FROM evaluation_observations WHERE target_path = ?').get(f.target).count, 1);
  db.close();
});

test('changed receipt invalidates old binding and retains both receipt observations', async () => {
  const f = fixture();
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db);
  writeFileSync(join(f.root, f.receipt), JSON.stringify({
    status: 'PENDING', scope: 'visual_review', subject: { path: f.target, sha256: f.targetSha }, note: 'review changed',
  }));
  await scan(f, db);
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'PENDING');
  assert.equal(db.prepare('SELECT COUNT(DISTINCT receipt_sha256) count FROM evaluation_observations WHERE receipt_path = ?').get(f.receipt).count, 2);
  db.close();
});

test('owner rejection is not overridden by curator PASS at the same scope', async () => {
  const f = fixture();
  const ownerReceipt = '.omo/evidence/work/female/owner-decision.json';
  writeFileSync(join(f.root, ownerReceipt), JSON.stringify({
    status: 'REJECTED', scope: 'visual_review', authority: 'owner', subject: { path: f.target, sha256: f.targetSha },
  }));
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ version: 1, decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PASS', authority: 'curator', receipt: f.receipt,
    dimension: 'visual_review', summary: 'curator pass',
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db, decisionsPath);
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'REJECTED');
  assert.equal(db.prepare('SELECT COUNT(*) count FROM v_curated_passed_assets WHERE best_path = ?').get(f.target).count, 0);
  assert.deepEqual(db.prepare("SELECT authority, decision FROM evaluation_observations WHERE target_path = ? AND dimension = 'visual_review' AND decision != 'UNREVIEWED' ORDER BY authority").all(f.target).map(row => ({ ...row })), [
    { authority: 'curator', decision: 'PASS' }, { authority: 'owner', decision: 'REJECTED' }, { authority: 'producer', decision: 'PASS' },
  ]);
  db.close();
});

test('legacy observations remain historical and cannot approve or override current exact claims', async () => {
  const f = fixture();
  const ownerReceipt = '.omo/evidence/work/female/owner-decision.json';
  writeFileSync(join(f.root, ownerReceipt), JSON.stringify({
    status: 'REJECTED', scope: 'acceptance', authority: 'owner', subject: { path: f.target, sha256: f.targetSha },
  }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db);
  const receiptSha = db.prepare('SELECT sha256 FROM asset_paths WHERE path = ?').get(f.receipt).sha256;
  db.prepare(`INSERT INTO evaluation_observations(receipt_path,receipt_sha256,target_path,target_sha256,decision,authority,dimension,raw_status,summary,source_kind)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).run(f.receipt, receiptSha, f.target, f.targetSha, 'PASS', 'curator', 'acceptance', 'PASS', 'old parser approval', 'legacy');
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'REJECTED');
  assert.equal(db.prepare('SELECT COUNT(*) count FROM v_curated_passed_assets WHERE best_path = ?').get(f.target).count, 0);

  db.prepare("DELETE FROM evaluation_observations WHERE source_kind != 'legacy'").run();
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'UNREVIEWED');
  db.close();
});

test('repeat scans preserve history without creating duplicate observations', async () => {
  const f = fixture();
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db);
  const before = db.prepare('SELECT COUNT(*) count FROM evaluation_observations').get().count;
  const second = await scan(f, db);
  assert.equal(second.cacheHits, second.filesScanned);
  assert.equal(second.headersRead, 0);
  assert.equal(second.metadataCacheHits, 3);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM evaluation_observations').get().count, before);
  const counts = exportViews({ db, outputRoot: f.views });
  assert.ok(counts.work > 0);
  assert.ok(counts.passed > 0);
  assert.equal(JSON.parse(readFileSync(join(f.views, 'passed-assets.json'), 'utf8')).assets[0].decision, 'PASS');
  db.close();
});

test('curated passed view requires exact current target and receipt with no same-scope conflict', async () => {
  const f = fixture();
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PASS', authority: 'curator', receipt: f.receipt,
    dimension: 'acceptance',
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db, decisionsPath);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM v_curated_passed_assets WHERE best_path = ?').get(f.target).count, 1);
  writeFileSync(join(f.root, f.receipt), JSON.stringify({
    status: 'PENDING', scope: 'acceptance', subject: { path: f.target, sha256: f.targetSha },
  }));
  await scan(f, db, decisionsPath);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM v_curated_passed_assets WHERE best_path = ?').get(f.target).count, 0);
  db.close();
});

test('lead approval documents are receipts and cached hashes do not freeze old classification', async () => {
  const f = fixture();
  const leadReceipt = '.omo/evidence/work/female/LEAD-APPROVAL.md';
  writeFileSync(join(f.root, leadReceipt), '# Lead approval\n');
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PASS', authority: 'curator', receipt: leadReceipt,
    dimension: 'acceptance',
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db, decisionsPath);
  assert.equal(db.prepare('SELECT stage FROM asset_paths WHERE path = ?').get(leadReceipt).stage, 'receipt');

  db.prepare("UPDATE file_cache SET stage = 'runtime', asset_class = 'other' WHERE path = ?").run(leadReceipt);
  const second = await scan(f, db, decisionsPath);
  assert.equal(second.cacheHits, second.filesScanned);
  assert.equal(db.prepare('SELECT stage FROM asset_paths WHERE path = ?').get(leadReceipt).stage, 'receipt');
  assert.equal(db.prepare('SELECT asset_class FROM asset_paths WHERE path = ?').get(leadReceipt).asset_class, 'document');
  db.close();
});

test('curated decisions accept exact scanned regular receipt documents regardless of filename classification', async () => {
  const f = fixture();
  const receipt = '.omo/evidence/portrait-retouch-20260914/registered/retouch.json';
  mkdirSync(join(f.root, '.omo/evidence/portrait-retouch-20260914/registered'), { recursive: true });
  writeFileSync(join(f.root, receipt), JSON.stringify({ ownerReview: 'pending' }));
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PENDING', authority: 'curator', receipt,
    dimension: 'acceptance',
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db, decisionsPath);
  const bound = db.prepare('SELECT receipt_sha256 FROM evaluation_observations WHERE receipt_path = ? AND source_kind = ?').get(receipt, 'curated');
  assert.equal(bound.receipt_sha256, digest(readFileSync(join(f.root, receipt))));
  assert.equal(db.prepare('SELECT stage FROM asset_paths WHERE path = ?').get(receipt).stage, 'work');
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'PENDING');
  db.close();
});

test('pinned curated receipt SHA rejects receipt drift before catalog mutation', async () => {
  const f = fixture();
  const receiptSha = digest(readFileSync(join(f.root, f.receipt)));
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PASS', authority: 'curator', receipt: f.receipt,
    receipt_sha256: receiptSha, dimension: 'acceptance',
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db, decisionsPath);
  writeFileSync(join(f.root, f.receipt), JSON.stringify({ changed: true, status: 'PENDING' }));
  await assert.rejects(scan(f, db, decisionsPath), /decision receipt SHA mismatch/);
  assert.equal(db.prepare('SELECT sha256 FROM asset_paths WHERE path = ?').get(f.receipt).sha256, receiptSha);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM evaluation_observations WHERE receipt_path = ? AND source_kind = 'curated'").get(f.receipt).count, 1);
  db.close();
});

test('unpinned curated decisions bind once and do not refresh after receipt drift', async () => {
  const f = fixture();
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PASS', authority: 'curator', receipt: f.receipt,
    dimension: 'acceptance',
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await scan(f, db, decisionsPath);
  const originalReceiptSha = db.prepare("SELECT receipt_sha256 FROM evaluation_observations WHERE receipt_path = ? AND source_kind = 'curated'").get(f.receipt).receipt_sha256;
  writeFileSync(join(f.root, f.receipt), JSON.stringify({ changed: true, status: 'PENDING' }));
  await scan(f, db, decisionsPath);
  const observations = db.prepare("SELECT receipt_sha256 FROM evaluation_observations WHERE receipt_path = ? AND source_kind = 'curated'").all(f.receipt);
  assert.deepEqual(observations.map(row => row.receipt_sha256), [originalReceiptSha]);
  assert.equal(db.prepare('SELECT decision FROM asset_state WHERE best_path = ?').get(f.target).decision, 'UNREVIEWED');
  db.close();
});

test('curated decisions validate current target SHA and repository receipt path', async () => {
  const f = fixture();
  const decisionsPath = join(f.root, 'asset-decisions.json');
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: 'f'.repeat(64), decision: 'PASS', authority: 'curator', receipt: f.receipt,
  }] }));
  const db = openAssetDatabase(f.dbPath);
  await assert.rejects(scan(f, db, decisionsPath), /decision target SHA mismatch/);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM asset_paths').get().count, 0);
  writeFileSync(decisionsPath, JSON.stringify({ decisions: [{
    path: f.target, sha256: f.targetSha, decision: 'PASS', authority: 'curator', receipt: '../outside.json',
  }] }));
  await assert.rejects(scan(f, db, decisionsPath), /decision receipt must be a repository-relative path/);
  db.close();
});

test('opening a version-1 database migrates without deleting existing catalog rows', () => {
  const f = fixture();
  const db = openAssetDatabase(f.dbPath);
  db.exec("INSERT INTO content_objects VALUES ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',1,'.png','image/png',CURRENT_TIMESTAMP); PRAGMA user_version=1;");
  db.close();
  const reopened = openAssetDatabase(f.dbPath);
  assert.equal(reopened.prepare("SELECT COUNT(*) count FROM content_objects WHERE sha256 = ?").get('a'.repeat(64)).count, 1);
  assert.equal(reopened.prepare('PRAGMA user_version').get().user_version, 4);
  reopened.close();
});

test('version-4 second handle opens read-only during an uncommitted writer transaction', () => {
  const f = fixture();
  const writer = openAssetDatabase(f.dbPath);
  writer.exec("INSERT INTO content_objects VALUES ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',1,'.png','image/png',CURRENT_TIMESTAMP); BEGIN IMMEDIATE; INSERT INTO content_objects VALUES ('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',1,'.png','image/png',CURRENT_TIMESTAMP);");
  const reader = openAssetDatabase(f.dbPath);
  assert.equal(reader.prepare('PRAGMA busy_timeout').get().timeout, 5000);
  assert.equal(reader.prepare('PRAGMA user_version').get().user_version, 4);
  assert.equal(reader.prepare('SELECT COUNT(*) count FROM content_objects').get().count, 1);
  reader.close();
  writer.exec('ROLLBACK;');
  writer.close();
});

test('database schema newer than supported version is rejected', () => {
  const f = fixture();
  const db = openAssetDatabase(f.dbPath);
  db.exec('PRAGMA user_version=5;');
  db.close();
  assert.throws(() => openAssetDatabase(f.dbPath), /database schema version 5 is newer than supported version 4/);
});
