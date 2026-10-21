import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { openDocumentStore } from './store.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import {
  initializeSoulBatchDocuments,
  openSoulBatchDocuments,
  INTERNAL_BATCHES_CAPABILITY,
  SOUL_BATCH_DOCUMENT_HASHES,
  SOUL_BATCH_SOURCE_HASHES,
} from './soul-batch-documents.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const logicalPaths = Object.keys(SOUL_BATCH_SOURCE_HASHES);
const evidencePath = join(import.meta.dirname, '../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite');
assert.equal(fs.statSync(evidencePath).mode & 0o777, 0o600);
const evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
let loaded;
try {
  loaded = new Map(logicalPaths.map(logicalPath => {
    const bytes = evidence.getEvidence(`scope-read:${logicalPath}`, SOUL_BATCH_SOURCE_HASHES[logicalPath]);
    return [logicalPath, { bytes, document: JSON.parse(bytes.toString('utf8')) }];
  }));
} finally { evidence.close(); }
const sources = Object.fromEntries(logicalPaths.map(logicalPath => [logicalPath, {
  bytes: loaded.get(logicalPath).bytes,
  expectedSourceHash: SOUL_BATCH_SOURCE_HASHES[logicalPath],
}]));
const options = { capability: INTERNAL_BATCHES_CAPABILITY, scope: 'internal', expectedSourceHashes: SOUL_BATCH_SOURCE_HASHES };
const init = { ...options, sources, actor: 'soul-batch-snapshot-test', reason: 'explicit private typed snapshot of nine soul batches' };

function fixture(t) {
  const dir = fs.mkdtempSync(join(tmpdir(), 'soul-batch-documents-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'private.sqlite');
  t.after(() => { if (fs.existsSync(path)) fs.chmodSync(path, 0o600); });
  return path;
}

function withSources(patch) {
  return { ...init, sources: { ...sources, ...patch } };
}

test('nine actual soul batches round-trip in exact key order from typed rows after source and JSON access are disabled', t => {
  const path = fixture(t);
  for (const logicalPath of logicalPaths) {
    assert.equal(sha(loaded.get(logicalPath).bytes), SOUL_BATCH_SOURCE_HASHES[logicalPath]);
  }
  assert.equal([...loaded.values()].reduce((sum, item) => sum + item.document.assignments.length, 0), 1022);
  initializeSoulBatchDocuments(path, init);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  const store = openSoulBatchDocuments(path, options);
  const first = store.readDocuments();
  assert.deepEqual([...first.keys()], logicalPaths);
  for (const logicalPath of logicalPaths) assert.deepEqual(first.get(logicalPath), loaded.get(logicalPath).document);
  store.close();

  const readFile = fs.readFileSync;
  const readdir = fs.readdirSync;
  const parse = JSON.parse;
  let reopened;
  try {
    fs.readFileSync = () => { throw new Error('filesystem reader disabled'); };
    fs.readdirSync = () => { throw new Error('directory scanner disabled'); };
    syncBuiltinESMExports();
    JSON.parse = () => { throw new Error('JSON parse disabled'); };
    reopened = openSoulBatchDocuments(path, options);
    const documents = reopened.readDocuments();
    assert.equal(documents.size, 9);
    for (const logicalPath of logicalPaths) {
      assert.equal(JSON.stringify(documents.get(logicalPath)), JSON.stringify(loaded.get(logicalPath).document));
    }
    assert.equal(JSON.stringify([...documents]), JSON.stringify(logicalPaths.map(logicalPath => [logicalPath, loaded.get(logicalPath).document])));
  } finally {
    reopened?.close();
    fs.readFileSync = readFile;
    fs.readdirSync = readdir;
    syncBuiltinESMExports();
    JSON.parse = parse;
  }

  const db = new DatabaseSync(path);
  assert.equal(db.prepare('PRAGMA application_id').get().application_id, 0x57534242);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  const imported = db.prepare('SELECT * FROM soul_batch_documents_import').get();
  assert.equal(imported.actor, init.actor);
  assert.equal(imported.reason, init.reason);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name LIKE 'soul_batch_documents_%' AND type='table'").get().n, 15);
  for (const logicalPath of logicalPaths) {
    const archive = db.prepare('SELECT raw_bytes,sha256 FROM soul_batch_documents_archive WHERE logical_path=?').get(logicalPath);
    assert.deepEqual(Buffer.from(archive.raw_bytes), loaded.get(logicalPath).bytes);
    assert.equal(archive.sha256, SOUL_BATCH_SOURCE_HASHES[logicalPath]);
    const source = db.prepare('SELECT * FROM soul_batch_documents_source WHERE logical_path=?').get(logicalPath);
    assert.equal(source.byte_length, loaded.get(logicalPath).bytes.length);
    assert.equal(source.document_sha256, SOUL_BATCH_DOCUMENT_HASHES[logicalPath]);
    assert.equal(SOUL_BATCH_DOCUMENT_HASHES[logicalPath], sha(JSON.stringify(loaded.get(logicalPath).document)));
    assert.equal(source.assignment_count, loaded.get(logicalPath).document.assignments.length);
  }
  assert.throws(() => db.exec("UPDATE soul_batch_documents_archive SET raw_bytes=x'00'"), /immutable soul-batch evidence/);
  assert.throws(() => db.exec('DELETE FROM soul_batch_documents_archive'), /immutable soul-batch evidence/);
  // Dropping the sealed bytes must not make the reader fall back to JSON or the working tree.
  db.exec('DROP TRIGGER soul_batch_documents_archive_no_delete; DELETE FROM soul_batch_documents_archive');
  db.close();
  const typed = openSoulBatchDocuments(path, options);
  const withoutArchive = typed.readDocuments();
  for (const logicalPath of logicalPaths) assert.deepEqual(withoutArchive.get(logicalPath), loaded.get(logicalPath).document);
  typed.close();
  assert.throws(() => openDocumentStore(path), { code: 'E_SCHEMA' });
  assert.throws(() => openEvidenceStore(path, { capability: INTERNAL_EVIDENCE_CAPABILITY }), { code: 'E_SCHEMA' });
});

test('private capability, scope, mode, audit, and exact source pins fail closed', t => {
  const path = fixture(t);
  for (const patch of [{ capability: undefined }, { capability: Symbol('internal soul-batch documents') }, { scope: 'public' }]) {
    assert.throws(() => initializeSoulBatchDocuments(path, { ...init, ...patch }), { code: 'E_PRIVATE' });
    assert.throws(() => openSoulBatchDocuments(path, { ...options, ...patch }), { code: 'E_PRIVATE' });
  }
  assert.equal(fs.existsSync(path), false);
  for (const patch of [{ actor: '' }, { actor: '   ' }, { reason: '' }]) {
    assert.throws(() => initializeSoulBatchDocuments(path, { ...init, ...patch }), { code: 'E_BATCH_AUDIT' });
  }
  const first = logicalPaths[0];
  const stale = { ...SOUL_BATCH_SOURCE_HASHES, [first]: '0'.repeat(64) };
  assert.throws(() => initializeSoulBatchDocuments(path, { ...init, expectedSourceHashes: stale }), { code: 'E_BATCH_PINS' });
  assert.throws(() => initializeSoulBatchDocuments(path, withSources({ extra: { bytes: Buffer.from('{}'), expectedSourceHash: sha(Buffer.from('{}')) } })), { code: 'E_BATCH_PINS' });
  const missing = { ...sources };
  delete missing[logicalPaths[8]];
  assert.throws(() => initializeSoulBatchDocuments(path, { ...init, sources: missing }), { code: 'E_BATCH_PINS' });
  assert.throws(() => initializeSoulBatchDocuments(path, withSources({ [first]: { bytes: loaded.get(first).bytes, expectedSourceHash: '0'.repeat(64) } })), { code: 'E_BATCH_PINS' });
  const changed = Buffer.from(loaded.get(first).bytes);
  changed[changed.length - 2] ^= 1;
  assert.throws(() => initializeSoulBatchDocuments(path, withSources({ [first]: { bytes: changed, expectedSourceHash: SOUL_BATCH_SOURCE_HASHES[first] } })), { code: 'E_BATCH_PINS' });
  assert.throws(() => initializeSoulBatchDocuments(path, withSources({ [first]: { bytes: 'not-bytes', expectedSourceHash: SOUL_BATCH_SOURCE_HASHES[first] } })), { code: 'E_BATCH_BYTES' });
  assert.equal(fs.existsSync(path), false);
  assert.equal(fs.existsSync(path + '-journal'), false);

  initializeSoulBatchDocuments(path, init);
  assert.throws(() => initializeSoulBatchDocuments(path, init), { code: 'EEXIST' });
  assert.throws(() => openSoulBatchDocuments(path, { ...options, expectedSourceHashes: stale }), { code: 'E_BATCH_PINS' });
  assert.throws(() => openSoulBatchDocuments(path, { capability: INTERNAL_BATCHES_CAPABILITY, scope: 'internal' }), { code: 'E_BATCH_PINS' });
  assert.throws(() => openSoulBatchDocuments(path, { ...options, expectedSourceHashes: { ...SOUL_BATCH_SOURCE_HASHES, unexpected: SOUL_BATCH_SOURCE_HASHES[first] } }), { code: 'E_BATCH_PINS' });
  fs.chmodSync(path, 0o644);
  assert.throws(() => openSoulBatchDocuments(path, options), { code: 'E_PRIVATE_MODE' });
  fs.chmodSync(path, 0o600);
  const reader = new DatabaseSync(path, { readOnly: true });
  assert.throws(() => reader.exec("UPDATE soul_batch_documents_assignment SET name='rewritten'"), /readonly/);
  reader.close();
});

test('unknown fields at every actual domain and invalid values roll the new file back', t => {
  const path = fixture(t);
  const target = logicalPaths[0];
  const changes = [
    document => { document.extra = 'unknown'; },
    document => { document.assignments.at(-1).extra = 'unknown'; },
    document => { document.assignments.at(-1).souls[0].extra = 'unknown'; },
    document => { document.assignments.at(-1).evidence[0].extra = 'unknown'; },
    document => { document.assignments.find(item => item.historicalComparisons).historicalComparisons[0].extra = 'unknown'; },
    document => { document.assignments.find(item => item.historicalComparisons).historicalComparisons[0].sources[0].extra = 'unknown'; },
    document => { document.scope = { extra: 'unknown' }; },
  ];
  const otherTargets = [
    [logicalPaths[1], document => { document.exclusions = { extra: true, excludedFromTheseCards: [] }; }],
    [logicalPaths[3], document => { document.excluded[0].extra = 'unknown'; }],
    [logicalPaths[3], document => { document.duplicateSummary[0].extra = 'unknown'; }],
    [logicalPaths[4], document => { document.exclusions.extra = 'unknown'; }],
    [logicalPaths[4], document => { document.exclusions.excludedFromTheseCards[0].extra = 'unknown'; }],
    [logicalPaths[5], document => { document.assignments[0].historicalComparison.extra = 'unknown'; }],
    [logicalPaths[6], document => { document.scope.extra = 'unknown'; }],
    [logicalPaths[7], document => { document.excludedLanePersons[0].extra = 'unknown'; }],
  ];
  function reject(logicalPath, change, code) {
    const changed = structuredClone(loaded.get(logicalPath).document);
    change(changed);
    const bytes = Buffer.from(JSON.stringify(changed));
    assert.throws(() => initializeSoulBatchDocuments(path, {
      ...init,
      expectedSourceHashes: { ...SOUL_BATCH_SOURCE_HASHES, [logicalPath]: sha(bytes) },
      sources: { ...sources, [logicalPath]: { bytes, expectedSourceHash: sha(bytes) } },
    }), { code });
    assert.equal(fs.existsSync(path), false);
    assert.equal(fs.existsSync(path + '-journal'), false);
  }
  for (const change of changes) reject(target, change, 'E_BATCH_UNKNOWN_FIELD');
  for (const [logicalPath, change] of otherTargets) reject(logicalPath, change, 'E_BATCH_UNKNOWN_FIELD');
  reject(logicalPaths[1], document => { document.assignments[0].souls[0].id = 3; }, 'E_BATCH_SHAPE');
  reject(logicalPaths[1], document => { document.assignments[0].counterEvidence = [false]; }, 'E_BATCH_SHAPE');
  reject(logicalPaths[4], document => { document.exclusions = 4; }, 'E_BATCH_SHAPE');
  reject(logicalPaths[6], document => { document.assignments[0].historicalSources = [false]; }, 'E_BATCH_SHAPE');
  reject(logicalPaths[1], document => { document.assignments.pop(); }, 'E_BATCH_INTEGRITY');
});

test('changing typed content and its stored digest cannot replace the independent document pin', t => {
  const path = fixture(t);
  initializeSoulBatchDocuments(path, init);
  const logicalPath = logicalPaths[0];
  const changed = structuredClone(loaded.get(logicalPath).document);
  changed.assignments[0].name += ' changed';
  const db = new DatabaseSync(path);
  try {
    db.prepare('UPDATE soul_batch_documents_assignment SET name=? WHERE row_key=?')
      .run(changed.assignments[0].name, logicalPath+'/assignments/0');
    db.prepare('UPDATE soul_batch_documents_source SET document_sha256=? WHERE logical_path=?')
      .run(sha(JSON.stringify(changed)), logicalPath);
    assert.equal(db.prepare('SELECT source_sha256 FROM soul_batch_documents_source WHERE logical_path=?')
      .get(logicalPath).source_sha256, SOUL_BATCH_SOURCE_HASHES[logicalPath]);
  } finally { db.close(); }
  const reader = openSoulBatchDocuments(path, options);
  try { assert.throws(() => reader.readDocuments(), { code:'E_BATCH_INTEGRITY' }); }
  finally { reader.close(); }
});

test('missing, changed, extra, and reordered rows fail the read-only reopen', t => {
  const mutations = [
    "DELETE FROM soul_batch_documents_evidence WHERE row_key=(SELECT row_key FROM soul_batch_documents_evidence ORDER BY row_key DESC LIMIT 1)",
    "DELETE FROM soul_batch_documents_scope WHERE row_key='lore/editorial/soul-batches/state-11-12.json/scope'",
    "UPDATE soul_batch_documents_soul SET name='changed' WHERE row_key='lore/editorial/soul-batches/special.json/assignments/0/souls/0'",
    "UPDATE soul_batch_documents_assignment SET field_order='duplicateRationale|personId|name|status|souls|evidence|narrativeRationale|counterEvidence|evidenceStrength' WHERE row_key='lore/editorial/soul-batches/state-01-02.json/assignments/0'",
    "UPDATE soul_batch_documents_document SET exclusions_kind=NULL WHERE row_key='lore/editorial/soul-batches/state-01-02.json'",
    "UPDATE soul_batch_documents_assignment SET counter_kind='text' WHERE row_key='lore/editorial/soul-batches/state-03-04.json/assignments/0'",
    "INSERT INTO soul_batch_documents_text_item VALUES ('lore/editorial/soul-batches/special.json/limitations/99','lore/editorial/soul-batches/special.json/limitations',99,'value','orphan')",
    "UPDATE soul_batch_documents_source SET document_sha256='0' || substr(document_sha256,2) WHERE ordinal=0",
    // Rewritten receipt matches the changed document and the source byte pin is untouched.
    "UPDATE soul_batch_documents_soul SET name='changed' WHERE row_key='lore/editorial/soul-batches/state-09-10.json/assignments/0/souls/0'; UPDATE soul_batch_documents_source SET document_sha256='f758760ca4fda71250f8db4367131afc3b914ac0ea0835918db28112f7a5427c' WHERE logical_path='lore/editorial/soul-batches/state-09-10.json'",
    "UPDATE soul_batch_documents_source SET assignment_count=assignment_count+1 WHERE ordinal=1",
    "DELETE FROM soul_batch_documents_source WHERE ordinal=8",
  ];
  for (const mutation of mutations) {
    const path = fixture(t);
    initializeSoulBatchDocuments(path, init);
    const db = new DatabaseSync(path);
    db.exec(mutation);
    const changed = db.prepare('SELECT changes() AS n').get().n;
    db.close();
    assert.ok(changed > 0, mutation);
    if (mutation.startsWith('DELETE FROM soul_batch_documents_source')) {
      assert.throws(() => openSoulBatchDocuments(path, options), { code: 'E_BATCH_PINS' });
      continue;
    }
    const reader = openSoulBatchDocuments(path, options);
    assert.throws(() => reader.readDocuments(), { code: 'E_BATCH_INTEGRITY' });
    reader.close();
  }
});
