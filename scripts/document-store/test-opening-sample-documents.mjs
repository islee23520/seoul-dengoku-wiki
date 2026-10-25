import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES, initializeOpeningSampleDocuments, openOpeningSampleDocuments } from './opening-sample-documents.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

const LOGICAL_PATH = 'lore/editorial/Opening-Profile-Sample.json';
const SOURCE_HASH = OPENING_SAMPLE_SOURCE_HASHES[LOGICAL_PATH];
const DOCUMENT_HASH = '07cc6eed0cbae2937361ce4ab046e6da8674262be80fbefde858c97a844f5112';
const evidencePath = join(import.meta.dirname, '../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite');
assert.equal(fs.statSync(evidencePath).mode & 0o777, 0o600);
const evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
let sourceBytes;
try { sourceBytes = evidence.getEvidence(`scope-read:${LOGICAL_PATH}`, SOURCE_HASH); }
finally { evidence.close(); }
const original = JSON.parse(sourceBytes.toString('utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = { [LOGICAL_PATH]: { bytes: sourceBytes, expectedSourceHash: SOURCE_HASH } };
const options = { capability: INTERNAL_OPENING_SAMPLE_CAPABILITY, scope: 'internal', expectedSourceHashes: OPENING_SAMPLE_SOURCE_HASHES };
const init = { ...options, sources, actor: 'opening-sample-snapshot-test', reason: 'explicit private typed snapshot' };
const counts = {
  opening_sample_documents_import: 1,
  opening_sample_documents_source: 1,
  opening_sample_documents_archive: 1,
  opening_sample_documents_document: 1,
  opening_sample_documents_ability: 8,
  opening_sample_documents_review_question: 2,
  opening_sample_documents_person: 6,
  opening_sample_documents_skill: 17,
  opening_sample_documents_trait: 13,
};

function fixture(t) {
  const dir = fs.mkdtempSync(join(tmpdir(), 'opening-sample-'));
  fs.chmodSync(dir, 0o700);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'private.sqlite');
}

test('complete actual document round-trips in exact JSON order from typed rows', t => {
  const path = fixture(t);
  assert.equal(sourceBytes.length, 3819);
  assert.equal(sha(sourceBytes), SOURCE_HASH);
  assert.equal(sha(JSON.stringify(original)), DOCUMENT_HASH);
  initializeOpeningSampleDocuments(path, init);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  const store = openOpeningSampleDocuments(path, options);
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
    reopened = openOpeningSampleDocuments(path, options);
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
  assert.equal(db.prepare('PRAGMA application_id').get().application_id, 0x4f504e53);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  const receipt = db.prepare('SELECT actor, reason FROM opening_sample_documents_import').get();
  assert.equal(receipt.actor, init.actor);
  assert.equal(receipt.reason, init.reason);
  for (const [table, count] of Object.entries(counts)) {
    assert.equal(db.prepare('SELECT count(*) AS n FROM ' + table).get().n, count, table);
  }
});

test('capability, explicit scope, absolute path and pins fail before filesystem access', t => {
  const path = fixture(t);
  const marker = path + '.touched';
  const stat = fs.statSync;
  const open = fs.openSync;
  const exists = fs.existsSync;
  fs.statSync = (...args) => { fs.writeFileSync(marker, 'stat'); return stat(...args); };
  fs.openSync = (...args) => { fs.writeFileSync(marker, 'open'); return open(...args); };
  fs.existsSync = (...args) => { if (args[0] === path) { fs.writeFileSync(marker, 'exists'); return false; } return exists(...args); };
  try {
    const withoutCapability = { ...init }; delete withoutCapability.capability;
    const omittedScope = { ...init }; delete omittedScope.scope;
    const publicScope = { ...init, scope: 'public' };
    const relative = 'private.sqlite';
    assert.equal(isAbsolute(relative), false);
    for (const call of [
      () => initializeOpeningSampleDocuments(path, withoutCapability),
      () => initializeOpeningSampleDocuments(path, { ...init, capability: Symbol('wrong') }),
      () => initializeOpeningSampleDocuments(path, publicScope),
      () => initializeOpeningSampleDocuments(path, omittedScope),
      () => initializeOpeningSampleDocuments(relative, init),
      () => initializeOpeningSampleDocuments(path, { ...init, expectedSourceHashes: { 'wrong.json': SOURCE_HASH } }),
      () => openOpeningSampleDocuments(path, { capability: INTERNAL_OPENING_SAMPLE_CAPABILITY, scope: 'internal' }),
      () => openOpeningSampleDocuments(path, { ...options, expectedSourceHashes: { [LOGICAL_PATH]: '0'.repeat(64) } }),
      () => openOpeningSampleDocuments(relative, options),
    ]) {
      fs.rmSync(marker, { force: true });
      assert.throws(call);
      assert.equal(fs.existsSync(marker), false, call.toString());
    }
    assert.throws(() => initializeOpeningSampleDocuments(path, omittedScope), { code: 'E_PRIVATE' });
    assert.throws(() => initializeOpeningSampleDocuments(relative, init), { code: 'E_OPENING_SAMPLE_PATH' });
    assert.throws(() => openOpeningSampleDocuments(relative, options), { code: 'E_OPENING_SAMPLE_PATH' });
    assert.throws(() => openOpeningSampleDocuments(path, { capability: INTERNAL_OPENING_SAMPLE_CAPABILITY, scope: 'internal' }), { code: 'E_OPENING_SAMPLE_PINS' });
  } finally {
    fs.statSync = stat;
    fs.openSync = open;
    fs.existsSync = exists;
    fs.rmSync(marker, { force: true });
  }
  assert.equal(exists(path), false);
});

test('mode rejection and exclusive creation leave an existing database untouched', t => {
  const path = fixture(t);
  initializeOpeningSampleDocuments(path, init);
  const before = fs.readFileSync(path);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  assert.throws(() => initializeOpeningSampleDocuments(path, init), { code: 'EEXIST' });
  assert.deepEqual(fs.readFileSync(path), before);
  fs.chmodSync(path, 0o644);
  const stat = fs.statSync;
  let opened = false;
  const open = fs.openSync;
  fs.openSync = (...args) => { opened = true; return open(...args); };
  try {
    assert.throws(() => openOpeningSampleDocuments(path, options), { code: 'E_PRIVATE_MODE' });
    assert.equal(opened, false);
  } finally {
    fs.openSync = open;
    fs.statSync = stat;
  }
  assert.deepEqual(fs.readFileSync(path), before);
  fs.chmodSync(path, 0o600);
  const store = openOpeningSampleDocuments(path, options);
  assert.equal(JSON.stringify(store.readDocuments().get(LOGICAL_PATH)), JSON.stringify(original));
  store.close();
});

test('wrong and missing fields, extra keys, bad types, duplicate ids, wrong counts fail shape check on init', t => {
  const path = fixture(t);
  const bads = [
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { delete d.schema; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.schema = 'bad.v2'; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.visibility = 'public'; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.people = d.people.slice(0, 5); } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.abilityOrder = ['wrong']; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.people[0].base = [1,2,3]; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.people[0].skills[0].rating = '85'; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.people[0].traits[0].delta = '4'; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.people.push({ ...d.people[0], personId: 'dup' }); } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.extra = 'key'; } },
    { code: 'E_OPENING_SAMPLE_SHAPE', mutate: d => { d.people[0].extraField = 'bad'; } },
  ];
  for (const { code, mutate } of bads) {
    const changed = structuredClone(original);
    mutate(changed);
    const bytes = Buffer.from(JSON.stringify(changed));
    const { expectedSourceHashes: _pins, ...withoutPins } = init;
    assert.throws(() => initializeOpeningSampleDocuments(path, {
      ...withoutPins,
      sources: { [LOGICAL_PATH]: { bytes, expectedSourceHash: sha(bytes) } },
    }), { code });
    assert.equal(fs.existsSync(path), false);
    assert.equal(fs.existsSync(path + '-journal'), false);
  }
});

test('changed typed data with the stored digest still fails reconstruction', t => {
  const path = fixture(t);
  initializeOpeningSampleDocuments(path, init);
  const db = new DatabaseSync(path);
  const stored = db.prepare('SELECT document_sha256, source_sha256 FROM opening_sample_documents_source').get();
  assert.equal(stored.document_sha256, DOCUMENT_HASH);
  assert.equal(stored.source_sha256, SOURCE_HASH);
  db.exec('BEGIN IMMEDIATE');
  db.prepare('UPDATE opening_sample_documents_person SET base_strategy=base_strategy+1 WHERE person_id=?').run('K1007');
  db.exec('COMMIT');
  db.close();
  const reader = openOpeningSampleDocuments(path, options);
  assert.throws(() => reader.readDocuments(), { code: 'E_OPENING_SAMPLE_INTEGRITY' });
  reader.close();
  const after = new DatabaseSync(path, { readOnly: true });
  assert.equal(after.prepare('SELECT document_sha256 FROM opening_sample_documents_source').get().document_sha256, DOCUMENT_HASH);
  assert.equal(after.prepare("SELECT base_strategy FROM opening_sample_documents_person WHERE person_id='K1007'").get().base_strategy, 18);
  after.close();
});

test('ordinal gaps, malformed optional trait fields and count metadata fail closed', t => {
  const path = fixture(t);
  const cases = [
    {
      name: 'ability ordinal gap',
      sql: "DELETE FROM opening_sample_documents_ability WHERE ordinal=3; UPDATE opening_sample_documents_ability SET ordinal=ordinal-1 WHERE ordinal>3",
    },
    {
      name: 'skill ordinal gap',
      sql: "DELETE FROM opening_sample_documents_skill WHERE person_ordinal=0 AND ordinal=0; UPDATE opening_sample_documents_skill SET ordinal=ordinal-1 WHERE person_ordinal=0 AND ordinal>0",
    },
    {
      name: 'trait ordinal gap',
      sql: "DELETE FROM opening_sample_documents_trait WHERE person_ordinal=5 AND ordinal=2",
    },
    {
      name: 'malformed optional ability',
      sql: "UPDATE opening_sample_documents_trait SET ability='' WHERE person_ordinal=0 AND ordinal=0",
    },
    {
      name: 'malformed optional effect',
      sql: "UPDATE opening_sample_documents_trait SET effect_proposal='' WHERE person_ordinal=5 AND ordinal=2",
    },
    {
      name: 'presence flag disagrees',
      sql: 'UPDATE opening_sample_documents_person SET effect_proposal_present=0 WHERE ordinal=5',
    },
    {
      name: 'skill count disagrees',
      sql: 'UPDATE opening_sample_documents_person SET skill_count=skill_count-1 WHERE ordinal=0',
    },
    {
      name: 'review count disagrees',
      sql: 'UPDATE opening_sample_documents_document SET review_question_count=review_question_count+1',
    },
  ];
  for (const item of cases) {
    const dbPath = path + '-' + item.name.replaceAll(' ', '-');
    initializeOpeningSampleDocuments(dbPath, init);
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON; ' + item.sql);
    db.close();
    const reader = openOpeningSampleDocuments(dbPath, options);
    assert.throws(() => reader.readDocuments(), { code: 'E_OPENING_SAMPLE_INTEGRITY' }, item.name);
    reader.close();
  }
  const malformed = structuredClone(original);
  malformed.people[5].traits[2].effectProposal = '';
  const bytes = Buffer.from(JSON.stringify(malformed));
  const { expectedSourceHashes: _pins, ...withoutPins } = init;
  assert.throws(() => initializeOpeningSampleDocuments(path, {
    ...withoutPins,
    sources: { [LOGICAL_PATH]: { bytes, expectedSourceHash: sha(bytes) } },
  }), { code: 'E_OPENING_SAMPLE_SHAPE' });
  assert.equal(fs.existsSync(path), false);
});

test('missing, changed and extra rows fail the SELECT-only reader', t => {
  const tables = Object.keys(counts).filter(table => table !== 'opening_sample_documents_import' && table !== 'opening_sample_documents_archive');
  for (const table of tables) for (const mode of ['missing', 'changed', 'extra']) {
    const path = fixture(t);
    initializeOpeningSampleDocuments(path, init);
    const db = new DatabaseSync(path);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    const columns = db.prepare('PRAGMA table_info(' + table + ')').all();
    if (mode === 'missing') db.exec('DELETE FROM ' + table + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
    if (mode === 'changed') {
      const column = columns.find(row => !['logical_path', 'ordinal', 'person_ordinal', 'source_sha256', 'document_sha256'].includes(row.name));
      if (column) {
        const replacement = column.type.includes('INTEGER') ? '1000000' : column.name + " || '-changed'";
        db.exec('UPDATE ' + table + ' SET ' + column.name + '=' + replacement + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
      }
    }
    if (mode === 'extra') {
      const values = columns.map(column => {
        if (['ordinal', 'person_ordinal'].includes(column.name)) return '1000000';
        if (column.name === 'logical_path') return "'lore/editorial/extra.json'";
        if (column.name === 'person_id') return "'K999-extra'";
        if (column.name === 'source_sha256' || column.name === 'document_sha256') return "'" + '0'.repeat(64) + "'";
        return column.name;
      });
      db.exec('INSERT INTO ' + table + ' SELECT ' + values.join(',') + ' FROM ' + table + ' LIMIT 1');
    }
    db.close();
    const reader = openOpeningSampleDocuments(path, options);
    assert.throws(() => reader.readDocuments(), { code: 'E_OPENING_SAMPLE_INTEGRITY' });
    reader.close();
  }
});

test('failed initialization rolls back and deletes the new database', t => {
  const path = fixture(t);
  const changed = structuredClone(original);
  changed.people.push({ ...changed.people[0], personId: 'duplicate-after-create' });
  const bytes = Buffer.from(JSON.stringify(changed));
  const { expectedSourceHashes: _pins, ...withoutPins } = init;
  assert.throws(() => initializeOpeningSampleDocuments(path, {
    ...withoutPins,
    sources: { [LOGICAL_PATH]: { bytes, expectedSourceHash: sha(bytes) } },
  }), { code: 'E_OPENING_SAMPLE_SHAPE' });
  assert.equal(fs.existsSync(path), false);
  assert.equal(fs.existsSync(path + '-journal'), false);
  assert.equal(fs.existsSync(path + '-wal'), false);
});

test('reader stays SELECT-only and does not reopen archives or parse source JSON', t => {
  const path = fixture(t);
  initializeOpeningSampleDocuments(path, init);
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
    store = openOpeningSampleDocuments(path, options);
    DatabaseSync.prototype.prepare = function(sql) {
      queries.push(sql);
      assert.match(sql, /^SELECT /);
      assert.doesNotMatch(sql, /opening_sample_documents_archive|json_|source_file/i);
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
