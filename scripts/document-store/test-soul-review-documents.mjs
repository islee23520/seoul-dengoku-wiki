import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { openDocumentStore } from './store.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import {
  INTERNAL_REVIEW_CAPABILITY,
  SOUL_REVIEW_DOCUMENT_HASHES,
  SOUL_REVIEW_SOURCE_HASHES,
  initializeSoulReviewDocuments,
  openSoulReviewDocuments,
} from './soul-review-documents.mjs';

const LOGICAL_PATH = 'lore/editorial/Soul-Duplicate-Review.json';
const SOURCE_HASH = SOUL_REVIEW_SOURCE_HASHES[LOGICAL_PATH];
const DOCUMENT_HASH = SOUL_REVIEW_DOCUMENT_HASHES[LOGICAL_PATH];
const evidencePath = join(import.meta.dirname, '../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite');
assert.equal(fs.statSync(evidencePath).mode & 0o777, 0o600);
const evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
let sourceBytes;
try { sourceBytes = evidence.getEvidence(`scope-read:${LOGICAL_PATH}`, SOURCE_HASH); }
finally { evidence.close(); }
const original = JSON.parse(sourceBytes.toString('utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = { [LOGICAL_PATH]: { bytes: sourceBytes, expectedSourceHash: SOURCE_HASH } };
const options = { capability: INTERNAL_REVIEW_CAPABILITY, scope: 'internal', expectedSourceHashes: SOUL_REVIEW_SOURCE_HASHES };
const init = { ...options, sources, actor: 'soul-review-snapshot-test', reason: 'explicit private typed snapshot' };
const counts = {
  soul_review_documents_import: 1,
  soul_review_documents_source: 1,
  soul_review_documents_archive: 1,
  soul_review_documents_document: 1,
  soul_review_documents_coverage: 1,
  soul_review_documents_range_review: 4,
  soul_review_documents_pool_metrics: 2,
  soul_review_documents_histogram_entry: 172,
  soul_review_documents_change: 3,
  soul_review_documents_soul: 17,
  soul_review_documents_evidence: 29,
  soul_review_documents_candidate_comparison: 3,
  soul_review_documents_source_record: 6,
  soul_review_documents_unused_review: 7,
  soul_review_documents_retained_duplicate: 76,
  soul_review_documents_fingerprint: 19,
  soul_review_documents_frequency_review: 16,
  soul_review_documents_judgment: 1,
  soul_review_documents_original_evidence: 1,
  soul_review_documents_changed_node: 15,
  soul_review_documents_baseline_assignment: 3,
  soul_review_documents_ledger_comparison: 1,
  soul_review_documents_path_comparison: 1,
  soul_review_documents_locked_assignment: 6,
  soul_review_documents_source_comparison: 1,
  soul_review_documents_verification: 1,
  soul_review_documents_structural_audit: 1,
  soul_review_documents_quote_audit: 1,
  soul_review_documents_validator_run: 1,
  soul_review_documents_text_item: 1125,
};

function fixture(t) {
  const dir = fs.mkdtempSync(join(tmpdir(), 'soul-review-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'private.sqlite');
}
function withBytes(document) {
  const bytes = Buffer.from(JSON.stringify(document));
  return { bytes, expectedSourceHash: sha(bytes) };
}
function disableSourceReaders() {
  const saved = {
    readFileSync: fs.readFileSync,
    readdirSync: fs.readdirSync,
    openSync: fs.openSync,
    readFile: fsp.readFile,
    parse: JSON.parse,
    fetch: globalThis.fetch,
  };
  fs.readFileSync = () => { throw new Error('source reads forbidden'); };
  fs.readdirSync = () => { throw new Error('source scans forbidden'); };
  fs.openSync = () => { throw new Error('source opens forbidden'); };
  fsp.readFile = async () => { throw new Error('promise source reads forbidden'); };
  syncBuiltinESMExports();
  JSON.parse = () => { throw new Error('JSON parsing forbidden'); };
  globalThis.fetch = () => { throw new Error('fetch forbidden'); };
  return () => {
    fs.readFileSync = saved.readFileSync;
    fs.readdirSync = saved.readdirSync;
    fs.openSync = saved.openSync;
    fsp.readFile = saved.readFile;
    syncBuiltinESMExports();
    JSON.parse = saved.parse;
    globalThis.fetch = saved.fetch;
  };
}

test('complete actual document round-trips in exact JSON order from typed rows', t => {
  const path = fixture(t);
  assert.equal(sourceBytes.length, 129188);
  assert.equal(sha(sourceBytes), SOURCE_HASH);
  assert.equal(sha(JSON.stringify(original)), DOCUMENT_HASH);
  initializeSoulReviewDocuments(path, init);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  const store = openSoulReviewDocuments(path, options);
  const documents = store.readDocuments();
  assert.deepEqual(documents, new Map([[LOGICAL_PATH, original]]));
  assert.equal(JSON.stringify(documents.get(LOGICAL_PATH)), JSON.stringify(original));
  store.close();

  const restore = disableSourceReaders();
  let reopened;
  try {
    reopened = openSoulReviewDocuments(path, options);
    const again = reopened.readDocuments();
    assert.equal(JSON.stringify(again.get(LOGICAL_PATH)), JSON.stringify(original));
    assert.equal(again.size, 1);
    assert.deepEqual([...again.keys()], [LOGICAL_PATH]);
  } finally {
    reopened?.close();
    restore();
  }

  const db = new DatabaseSync(path, { readOnly: true });
  assert.equal(db.prepare('PRAGMA application_id').get().application_id, 0x57535256);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  const receipt = db.prepare('SELECT * FROM soul_review_documents_import').get();
  assert.equal(receipt.actor, init.actor);
  assert.equal(receipt.reason, init.reason);
  const pinned = db.prepare('SELECT source_sha256, document_sha256, byte_length FROM soul_review_documents_source').get();
  assert.equal(pinned.source_sha256, SOURCE_HASH);
  assert.equal(pinned.document_sha256, DOCUMENT_HASH);
  assert.equal(pinned.byte_length, 129188);
  for (const [table, count] of Object.entries(counts)) {
    assert.equal(db.prepare('SELECT count(*) AS n FROM ' + table).get().n, count, table);
  }
  assert.equal(db.prepare("SELECT count(*) AS n FROM soul_review_documents_change WHERE counter_kind='array'").get().n, 2);
  assert.equal(db.prepare("SELECT count(*) AS n FROM soul_review_documents_baseline_assignment WHERE counter_kind='text'").get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM soul_review_documents_range_review WHERE "weakEvidenceRows" IS NOT NULL').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM soul_review_documents_soul WHERE "interpretation" IS NOT NULL').get().n, 5);
  db.close();

  const writable = new DatabaseSync(path);
  const archive = writable.prepare('SELECT raw_bytes, sha256 FROM soul_review_documents_archive').get();
  assert.deepEqual(Buffer.from(archive.raw_bytes), sourceBytes);
  assert.equal(archive.sha256, SOURCE_HASH);
  assert.throws(() => writable.exec("UPDATE soul_review_documents_archive SET raw_bytes=x'00'"), /immutable soul-review evidence/);
  assert.throws(() => writable.exec('DELETE FROM soul_review_documents_archive'), /immutable soul-review evidence/);
  writable.exec('DROP TRIGGER soul_review_documents_archive_no_delete; DELETE FROM soul_review_documents_archive');
  writable.close();
  const typed = openSoulReviewDocuments(path, options);
  assert.equal(JSON.stringify(typed.readDocuments().get(LOGICAL_PATH)), JSON.stringify(original));
  typed.close();
  assert.throws(() => openDocumentStore(path), { code: 'E_SCHEMA' });
  assert.throws(() => openEvidenceStore(path, { capability: INTERNAL_EVIDENCE_CAPABILITY }), { code: 'E_SCHEMA' });
});

test('private capability, scope, mode, pins and audit fail closed before a database remains', t => {
  const path = fixture(t);
  for (const patch of [{ capability: undefined }, { capability: Symbol('internal soul-review documents') }, { scope: 'public' }]) {
    assert.throws(() => initializeSoulReviewDocuments(path, { ...init, ...patch }), { code: 'E_PRIVATE' });
    assert.throws(() => openSoulReviewDocuments(path, { ...options, ...patch }), { code: 'E_PRIVATE' });
    assert.equal(fs.existsSync(path), false);
  }
  for (const patch of [{ actor: '' }, { reason: ' ' }]) {
    assert.throws(() => initializeSoulReviewDocuments(path, { ...init, ...patch }), { code: 'E_REVIEW_AUDIT' });
    assert.equal(fs.existsSync(path), false);
  }
  assert.throws(() => initializeSoulReviewDocuments(path, { ...init, sources: { [LOGICAL_PATH]: { bytes: 'text', expectedSourceHash: SOURCE_HASH } } }), { code: 'E_REVIEW_BYTES' });
  assert.throws(() => initializeSoulReviewDocuments(path, { ...init, sources: { [LOGICAL_PATH]: { bytes: Buffer.from(sourceBytes), expectedSourceHash: '0'.repeat(64) } } }), { code: 'E_REVIEW_PINS' });
  assert.throws(() => initializeSoulReviewDocuments(path, { ...init, sources: { 'lore/editorial/extra.json': sources[LOGICAL_PATH], [LOGICAL_PATH]: sources[LOGICAL_PATH] } }), { code: 'E_REVIEW_PINS' });
  assert.throws(() => initializeSoulReviewDocuments(path, { ...init, sources: {} }), { code: 'E_REVIEW_PINS' });
  assert.equal(fs.existsSync(path), false);
  initializeSoulReviewDocuments(path, init);
  assert.throws(() => initializeSoulReviewDocuments(path, init), { code: 'EEXIST' });
  assert.throws(() => openSoulReviewDocuments(path, { ...options, expectedSourceHashes: { [LOGICAL_PATH]: '0'.repeat(64) } }), { code: 'E_REVIEW_PINS' });
  assert.throws(() => openSoulReviewDocuments(path, { capability: INTERNAL_REVIEW_CAPABILITY, scope: 'internal' }), { code: 'E_REVIEW_PINS' });
  fs.chmodSync(path, 0o644);
  assert.throws(() => openSoulReviewDocuments(path, options), { code: 'E_PRIVATE_MODE' });
  fs.chmodSync(path, 0o600);
  const reopened = openSoulReviewDocuments(path, options);
  assert.equal(reopened.readDocuments().size, 1);
  reopened.close();
});

test('unknown, missing and reordered fields roll the new file back', t => {
  const path = fixture(t);
  const targets = [
    document => document,
    document => document.coverage,
    document => document.coverage.rangeReviews.at(-1),
    document => document.before,
    document => document.histogram[0],
    document => document.changes[0],
    document => document.changes[0].beforeSouls[0],
    document => document.changes[0].evidence[0],
    document => document.changes[0].candidateComparison,
    document => document.changes[0].candidateComparison.sources[0],
    document => document.unusedCandidateReview[0],
    document => document.retainedDuplicates[0],
    document => document.sourceFingerprints[0],
    document => document.highFrequencyReview[0],
    document => document.judgmentBoundary,
    document => document.originalEvidence,
    document => document.originalEvidence.changedSourceNodes[0],
    document => document.baselineAssignments[0],
    document => document.baselineAssignments.find(row => row.historicalComparison).historicalComparison,
    document => document.baselineAssignments.find(row => row.historicalSources).historicalSources[0],
    document => document.lockedAssignmentSnapshot[0],
    document => document.lockedAssignmentSnapshot.find(row => row.souls.some(soul => soul.interpretation)).souls.find(soul => soul.interpretation),
    document => document.currentSourceComparison,
    document => document.verification,
    document => document.verification.structuralAudit,
    document => document.verification.baselineAllEvidenceQuotes,
    document => document.verification.completeValidator,
  ];
  for (const locate of targets) for (const mode of ['unknown', 'missing', 'order']) {
    const changed = structuredClone(original);
    const target = locate(changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') {
      const key = Object.keys(target)[0];
      const value = target[key];
      delete target[key];
      target[key] = value;
    }
    const replacement = withBytes(changed);
    const code = mode === 'unknown' ? 'E_REVIEW_UNKNOWN_FIELD' : 'E_REVIEW_SHAPE';
    assert.throws(() => initializeSoulReviewDocuments(path, {
      ...init,
      sources: { [LOGICAL_PATH]: { bytes: replacement.bytes, expectedSourceHash: replacement.expectedSourceHash } },
    }), { code });
    assert.equal(fs.existsSync(path), false);
    assert.equal(fs.existsSync(path + '-journal'), false);
    assert.equal(fs.existsSync(path + '-wal'), false);
  }
});

test('missing, changed and extra rows fail the SELECT-only reader', t => {
  const tables = Object.keys(counts).filter(table => table !== 'soul_review_documents_import' && table !== 'soul_review_documents_archive');
  for (const table of tables) for (const mode of ['missing', 'changed', 'extra']) {
    const path = fixture(t);
    initializeSoulReviewDocuments(path, init);
    const db = new DatabaseSync(path);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    const columns = db.prepare('PRAGMA table_info(' + table + ')').all();
    if (mode === 'missing') db.exec('DELETE FROM ' + table + ' WHERE rowid=(SELECT max(rowid) FROM ' + table + ')');
    if (mode === 'changed') {
      const column = columns.find(row => !['row_key', 'parent_key', 'ordinal', 'field_order', 'logical_path', 'source_sha256', 'sha256', 'byte_length', 'counter_kind'].includes(row.name));
      const replacement = column.type === 'INTEGER' ? '1000000' : '"' + column.name + '" || \'-changed\'';
      db.exec('UPDATE ' + table + ' SET "' + column.name + '"=' + replacement + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
    }
    if (mode === 'extra') {
      const values = columns.map(column => {
        if (column.name === 'row_key') return "row_key || '/extra'";
        if (column.name === 'parent_key') return "'orphan'";
        if (column.name === 'ordinal') return '1000000';
        if (column.name === 'logical_path') return "'lore/editorial/extra.json'";
        if (column.name === 'source_sha256' || column.name === 'document_sha256') return "'" + '0'.repeat(64) + "'";
        if (column.name === 'byte_length') return '0';
        return '"' + column.name + '"';
      });
      db.exec('INSERT INTO ' + table + ' SELECT ' + values.join(',') + ' FROM ' + table + ' LIMIT 1');
    }
    db.close();
    const reader = openSoulReviewDocuments(path, options);
    assert.throws(() => reader.readDocuments(), error => error.code === 'E_REVIEW_INTEGRITY', table + ' ' + mode);
    reader.close();
  }
});

test('failed initialization rolls back and deletes the new database', t => {
  const path = fixture(t);
  const changed = structuredClone(original);
  changed.changes.push({ ...changed.changes[0], personId: 'K-extra' });
  const bytes = Buffer.from(JSON.stringify(changed));
  assert.throws(() => initializeSoulReviewDocuments(path, {
    ...init,
    sources: { [LOGICAL_PATH]: { bytes, expectedSourceHash: sha(bytes) } },
  }), error => error.code === 'E_REVIEW_INTEGRITY' || error.code === 'E_REVIEW_PINS');
  assert.equal(fs.existsSync(path), false);
  const broken = structuredClone(original);
  broken.changes[0].counterEvidence = [false];
  const invalid = Buffer.from(JSON.stringify(broken));
  assert.throws(() => initializeSoulReviewDocuments(path, {
    ...init,
    sources: { [LOGICAL_PATH]: { bytes: invalid, expectedSourceHash: sha(invalid) } },
  }), { code: 'E_REVIEW_SHAPE' });
  assert.equal(fs.existsSync(path), false);
  assert.equal(fs.existsSync(path + '-journal'), false);
  assert.equal(fs.existsSync(path + '-wal'), false);
});

test('a rewritten document receipt cannot bless a changed typed scalar', t => {
  const path = fixture(t);
  initializeSoulReviewDocuments(path, init);
  const db = new DatabaseSync(path);
  const before = db.prepare('SELECT "schema" AS schema_value FROM soul_review_documents_document').get().schema_value;
  db.exec('UPDATE soul_review_documents_document SET "schema" = "schema" || \'-rewritten\'');
  const reader = openSoulReviewDocuments(path, options);
  const changed = reader.readDocuments;
  // The receipt still names the fixed digest, so the reconstructed document must disagree with it.
  assert.throws(() => changed(), { code: 'E_REVIEW_INTEGRITY' });
  reader.close();
  const rewritten = structuredClone(original);
  rewritten.schema = before + '-rewritten';
  const forged = sha(JSON.stringify(rewritten));
  assert.notEqual(forged, DOCUMENT_HASH);
  db.exec("UPDATE soul_review_documents_source SET document_sha256='" + forged + "'");
  const pinned = db.prepare('SELECT source_sha256, document_sha256 FROM soul_review_documents_source').get();
  assert.equal(pinned.source_sha256, SOURCE_HASH);
  assert.equal(pinned.document_sha256, forged);
  db.close();
  const reopened = openSoulReviewDocuments(path, options);
  assert.throws(() => reopened.readDocuments(), { code: 'E_REVIEW_INTEGRITY' });
  reopened.close();
});

test('reader stays SELECT-only and does not reopen archives or parse source JSON', t => {
  const path = fixture(t);
  initializeSoulReviewDocuments(path, init);
  const restore = disableSourceReaders();
  let store;
  try {
    const queries = [];
    store = openSoulReviewDocuments(path, { ...options, observeSql: queries });
    assert.equal(JSON.stringify(store.readDocuments().get(LOGICAL_PATH)), JSON.stringify(original));
    assert.ok(queries.length > 0);
    for (const sql of queries) {
      assert.match(sql, /^SELECT /);
      assert.doesNotMatch(sql, /soul_review_documents_archive|json_|json_extract|source_file/i);
    }
    assert.equal(Object.keys(store).sort().join(','), 'close,readDocuments');
    assert.equal(typeof store.readDocuments, 'function');
  } finally {
    store?.close();
    restore();
  }
});
