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
import { INTERNAL_EVIDENCE_CAPABILITY, openEvidenceStore } from './evidence.mjs';
import {
  INTERNAL_CANDIDATES_CAPABILITY,
  SOUL_CANDIDATE_SOURCE_HASHES,
  initializeSoulCandidateDocuments,
  openSoulCandidateDocuments,
} from './soul-candidate-documents.mjs';

const LOGICAL_PATH = 'lore/editorial/Soul-Candidates.json';
const SOURCE_HASH = SOUL_CANDIDATE_SOURCE_HASHES[LOGICAL_PATH];
const DOCUMENT_HASH = '930210e8b4e1caabbff8d4d0dbd2c4ae21200dc01c660793e6fbb1ad6e292f93';
const evidencePath = join(import.meta.dirname, '../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite');
assert.equal(fs.statSync(evidencePath).mode & 0o777, 0o600);
const evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
let sourceBytes;
try { sourceBytes = evidence.getEvidence(`scope-read:${LOGICAL_PATH}`, SOURCE_HASH); }
finally { evidence.close(); }
const original = JSON.parse(sourceBytes.toString('utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = { [LOGICAL_PATH]: { bytes: sourceBytes, expectedSourceHash: SOURCE_HASH } };
const options = { capability: INTERNAL_CANDIDATES_CAPABILITY, scope: 'internal', expectedSourceHashes: SOUL_CANDIDATE_SOURCE_HASHES };
const init = { ...options, sources, actor: 'soul-candidate-snapshot-test', reason: 'explicit private typed snapshot' };
const counts = {
  soul_candidate_documents_import: 1,
  soul_candidate_documents_source: 1,
  soul_candidate_documents_archive: 1,
  soul_candidate_documents_document: 1,
  soul_candidate_documents_period: 8,
  soul_candidate_documents_research: 1,
  soul_candidate_documents_coverage: 8,
  soul_candidate_documents_research_limitation: 5,
  soul_candidate_documents_candidate: 173,
  soul_candidate_documents_related_period: 1,
  soul_candidate_documents_source_record: 173,
  soul_candidate_documents_role_tag: 80,
  soul_candidate_documents_limitation: 287,
};

function fixture(t) {
  const dir = fs.mkdtempSync(join(tmpdir(), 'soul-candidates-'));
  fs.chmodSync(dir, 0o700);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'private.sqlite');
}

test('complete actual document round-trips in exact JSON order from typed rows', t => {
  const path = fixture(t);
  assert.equal(sourceBytes.length, 192079);
  assert.equal(sha(sourceBytes), SOURCE_HASH);
  assert.equal(sha(JSON.stringify(original)), DOCUMENT_HASH);
  initializeSoulCandidateDocuments(path, init);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  const store = openSoulCandidateDocuments(path, options);
  const documents = store.readDocuments();
  assert.deepEqual(documents, new Map([[LOGICAL_PATH, original]]));
  assert.equal(JSON.stringify(documents.get(LOGICAL_PATH)), JSON.stringify(original));
  store.close();

  const read = fs.readFileSync;
  const list = fs.readdirSync;
  const open = fs.openSync;
  const readPromise = fsp.readFile;
  const parse = JSON.parse;
  const fetchImpl = globalThis.fetch;
  let reopened;
  try {
    fs.readFileSync = () => { throw new Error('source reads forbidden'); };
    fs.readdirSync = () => { throw new Error('source scans forbidden'); };
    fs.openSync = () => { throw new Error('source opens forbidden'); };
    fsp.readFile = async () => { throw new Error('promise source reads forbidden'); };
    syncBuiltinESMExports();
    JSON.parse = () => { throw new Error('JSON parsing forbidden'); };
    globalThis.fetch = () => { throw new Error('fetch forbidden'); };
    reopened = openSoulCandidateDocuments(path, options);
    assert.equal(JSON.stringify(reopened.readDocuments().get(LOGICAL_PATH)), JSON.stringify(original));
  } finally {
    reopened?.close();
    fs.readFileSync = read;
    fs.readdirSync = list;
    fs.openSync = open;
    fsp.readFile = readPromise;
    syncBuiltinESMExports();
    JSON.parse = parse;
    globalThis.fetch = fetchImpl;
  }

  const db = new DatabaseSync(path, { readOnly: true });
  assert.equal(db.prepare('PRAGMA application_id').get().application_id, 0x57534344);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  const receipt = db.prepare('SELECT actor, reason FROM soul_candidate_documents_import').get();
  assert.equal(receipt.actor, init.actor);
  assert.equal(receipt.reason, init.reason);
  for (const [table, count] of Object.entries(counts)) {
    assert.equal(db.prepare('SELECT count(*) AS n FROM ' + table).get().n, count, table);
  }
  db.close();

  const writable = new DatabaseSync(path);
  const archive = writable.prepare('SELECT raw_bytes, source_sha256 FROM soul_candidate_documents_archive').get();
  assert.deepEqual(Buffer.from(archive.raw_bytes), sourceBytes);
  assert.equal(archive.source_sha256, SOURCE_HASH);
  assert.throws(() => writable.exec("UPDATE soul_candidate_documents_archive SET raw_bytes=x'00'"), /immutable soul candidate evidence/);
  assert.throws(() => writable.exec('DELETE FROM soul_candidate_documents_archive'), /immutable soul candidate evidence/);
  writable.exec('DROP TRIGGER soul_candidate_documents_archive_no_delete; DELETE FROM soul_candidate_documents_archive');
  writable.close();
  const typed = openSoulCandidateDocuments(path, options);
  assert.equal(JSON.stringify(typed.readDocuments().get(LOGICAL_PATH)), JSON.stringify(original));
  typed.close();
  assert.throws(() => openDocumentStore(path), { code: 'E_SCHEMA' });
  assert.throws(() => openEvidenceStore(path, { capability: INTERNAL_EVIDENCE_CAPABILITY }), { code: 'E_SCHEMA' });
});

test('private capability, scope, mode, pins and audit fail closed before a database remains', t => {
  const path = fixture(t);
  for (const patch of [{ capability: undefined }, { capability: Symbol('internal Soul-Candidates') }, { scope: 'public' }]) {
    assert.throws(() => initializeSoulCandidateDocuments(path, { ...init, ...patch }), { code: 'E_PRIVATE' });
    assert.throws(() => openSoulCandidateDocuments(path, { ...options, ...patch }), { code: 'E_PRIVATE' });
    assert.equal(fs.existsSync(path), false);
  }
  for (const patch of [{ actor: '' }, { reason: ' ' }]) {
    assert.throws(() => initializeSoulCandidateDocuments(path, { ...init, ...patch }), { code: 'E_CANDIDATE_AUDIT' });
    assert.equal(fs.existsSync(path), false);
  }
  assert.throws(() => initializeSoulCandidateDocuments(path, { ...init, sources: { [LOGICAL_PATH]: { bytes: 'text', expectedSourceHash: SOURCE_HASH } } }), { code: 'E_CANDIDATE_BYTES' });
  assert.throws(() => initializeSoulCandidateDocuments(path, { ...init, sources: { [LOGICAL_PATH]: { bytes: Buffer.from(sourceBytes), expectedSourceHash: '0'.repeat(64) } } }), { code: 'E_CANDIDATE_PINS' });
  assert.throws(() => initializeSoulCandidateDocuments(path, { ...init, sources: { 'lore/editorial/extra.json': sources[LOGICAL_PATH] } }), { code: 'E_CANDIDATE_PINS' });
  assert.equal(fs.existsSync(path), false);
  initializeSoulCandidateDocuments(path, init);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  assert.throws(() => initializeSoulCandidateDocuments(path, init), { code: 'EEXIST' });
  assert.throws(() => openSoulCandidateDocuments(path, { ...options, expectedSourceHashes: { [LOGICAL_PATH]: '0'.repeat(64) } }), { code: 'E_CANDIDATE_PINS' });
  assert.throws(() => openSoulCandidateDocuments(path, { capability: INTERNAL_CANDIDATES_CAPABILITY, scope: 'internal' }), { code: 'E_CANDIDATE_PINS' });
  fs.chmodSync(path, 0o644);
  assert.throws(() => openSoulCandidateDocuments(path, options), { code: 'E_PRIVATE_MODE' });
  fs.chmodSync(path, 0o600);
  const reopened = openSoulCandidateDocuments(path, options);
  assert.equal(reopened.readDocuments().size, 1);
  reopened.close();
});

test('unknown, missing and reordered fields roll the new file back', t => {
  const path = fixture(t);
  const targets = [
    document => document,
    document => document.research,
    document => document.research.coverageByPeriod,
    document => document.candidates.at(-1),
    document => document.candidates.at(-1).sources[0],
    document => document.candidates.find(candidate => candidate.relatedPeriods),
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
    const bytes = Buffer.from(JSON.stringify(changed));
    const code = mode === 'unknown' && locate !== targets[0] && locate !== targets[1] && locate !== targets[2] ? 'E_CANDIDATE_UNKNOWN_FIELD' : 'E_CANDIDATE_SHAPE';
    const { expectedSourceHashes: _pins, ...withoutPins } = init;
    assert.throws(() => initializeSoulCandidateDocuments(path, {
      ...withoutPins,
      sources: { [LOGICAL_PATH]: { bytes, expectedSourceHash: sha(bytes) } },
    }), { code });
    assert.equal(fs.existsSync(path), false);
    assert.equal(fs.existsSync(path + '-journal'), false);
  }
});

test('missing, changed and extra rows fail the SELECT-only reader', t => {
  const tables = Object.keys(counts).filter(table => table !== 'soul_candidate_documents_import' && table !== 'soul_candidate_documents_archive');
  for (const table of tables) for (const mode of ['missing', 'changed', 'extra']) {
    const path = fixture(t);
    initializeSoulCandidateDocuments(path, init);
    const db = new DatabaseSync(path);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    const columns = db.prepare('PRAGMA table_info(' + table + ')').all();
    if (mode === 'missing') db.exec('DELETE FROM ' + table + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
    if (mode === 'changed') {
      const column = columns.find(row => !['logical_path', 'ordinal', 'candidate_ordinal', 'source_sha256', 'document_sha256'].includes(row.name));
      const replacement = column.type === 'INTEGER' ? '1000000' : column.name + " || '-changed'";
      db.exec('UPDATE ' + table + ' SET ' + column.name + '=' + replacement + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
    }
    if (mode === 'extra') {
      const values = columns.map(column => {
        if (['ordinal', 'candidate_ordinal'].includes(column.name)) return '1000000';
        if (column.name === 'logical_path') return "'lore/editorial/extra.json'";
        if (column.name === 'id') return "id || '-extra'";
        if (column.name === 'source_sha256' || column.name === 'document_sha256') return "'" + '0'.repeat(64) + "'";
        return column.name;
      });
      db.exec('INSERT INTO ' + table + ' SELECT ' + values.join(',') + ' FROM ' + table + ' LIMIT 1');
    }
    db.close();
    const reader = openSoulCandidateDocuments(path, options);
    assert.throws(() => reader.readDocuments(), { code: 'E_CANDIDATE_INTEGRITY' });
    reader.close();
  }
});

test('failed initialization rolls back and deletes the new database', t => {
  const path = fixture(t);
  const changed = structuredClone(original);
  changed.candidates.push({ ...changed.candidates[0], id: 'duplicate-after-create' });
  changed.research.totalCandidates += 1;
  const bytes = Buffer.from(JSON.stringify(changed));
  const { expectedSourceHashes: _pins, ...withoutPins } = init;
  assert.throws(() => initializeSoulCandidateDocuments(path, {
    ...withoutPins,
    sources: { [LOGICAL_PATH]: { bytes, expectedSourceHash: sha(bytes) } },
  }), { code: 'E_CANDIDATE_SHAPE' });
  assert.equal(fs.existsSync(path), false);
  assert.equal(fs.existsSync(path + '-journal'), false);
  assert.equal(fs.existsSync(path + '-wal'), false);
});

test('reader stays SELECT-only and does not reopen archives or parse source JSON', t => {
  const path = fixture(t);
  initializeSoulCandidateDocuments(path, init);
  const read = fs.readFileSync;
  const list = fs.readdirSync;
  const open = fs.openSync;
  const readPromise = fsp.readFile;
  const parse = JSON.parse;
  const fetchImpl = globalThis.fetch;
  let store;
  const queries = [];
  const prepare = DatabaseSync.prototype.prepare;
  try {
    fs.readFileSync = () => { throw new Error('filesystem reader disabled'); };
    fs.readdirSync = () => { throw new Error('directory scanner disabled'); };
    fs.openSync = () => { throw new Error('archive open disabled'); };
    fsp.readFile = async () => { throw new Error('promise reader disabled'); };
    syncBuiltinESMExports();
    JSON.parse = () => { throw new Error('JSON parse disabled'); };
    globalThis.fetch = () => { throw new Error('fetch disabled'); };
    store = openSoulCandidateDocuments(path, options);
    DatabaseSync.prototype.prepare = function(sql) {
      queries.push(sql);
      assert.match(sql, /^SELECT /);
      assert.doesNotMatch(sql, /soul_candidate_documents_archive|json_|source_file/i);
      return prepare.call(this, sql);
    };
    assert.equal(JSON.stringify(store.readDocuments().get(LOGICAL_PATH)), JSON.stringify(original));
    assert.ok(queries.length > 0);
    assert.deepEqual(Object.keys(store).sort(), ['close', 'readDocuments']);
  } finally {
    DatabaseSync.prototype.prepare = prepare;
    store?.close();
    fs.readFileSync = read;
    fs.readdirSync = list;
    fs.openSync = open;
    fsp.readFile = readPromise;
    syncBuiltinESMExports();
    JSON.parse = parse;
    globalThis.fetch = fetchImpl;
  }
});
