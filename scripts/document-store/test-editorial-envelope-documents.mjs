import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { EDITORIAL_ENVELOPE_SOURCE_HASHES, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, initializeEditorialEnvelopeDocuments, openEditorialEnvelopeDocuments } from './editorial-envelope-documents.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

const PATHS = Object.freeze(Object.keys(EDITORIAL_ENVELOPE_SOURCE_HASHES));
const DOCUMENT_HASHES = Object.freeze({
  'lore/editorial/Martial-Concept-Design.json': 'a457ae637320b5b25095796a4097d720f2e3d00c578710eb9f9f78efd978d720',
  'lore/editorial/Tripothon-Return-Relay-Proposal.json': '1f55454718753def28e8b1e5ceac47fb7a8b7bc7931efed61bd980516da18715',
});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const evidencePath = join(import.meta.dirname, '../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite');
assert.equal(fs.statSync(evidencePath).mode & 0o777, 0o600);
const evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
let originals;
try {
  originals = new Map(PATHS.map(logicalPath => {
    const bytes = evidence.getEvidence(`scope-read:${logicalPath}`, EDITORIAL_ENVELOPE_SOURCE_HASHES[logicalPath]);
    return [logicalPath, { bytes, document: JSON.parse(bytes.toString('utf8')) }];
  }));
} finally { evidence.close(); }
const sources = Object.fromEntries(PATHS.map(logicalPath => [logicalPath, {
  bytes: originals.get(logicalPath).bytes,
  expectedSourceHash: EDITORIAL_ENVELOPE_SOURCE_HASHES[logicalPath],
}]));
const options = { capability: INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, scope: 'internal', expectedSourceHashes: EDITORIAL_ENVELOPE_SOURCE_HASHES };
const init = { ...options, sources, actor: 'editorial-envelope-snapshot-test', reason: 'explicit private typed snapshot' };

function fixture(t) {
  const dir = fs.mkdtempSync(join(tmpdir(), 'editorial-envelope-'));
  fs.chmodSync(dir, 0o700);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'private.sqlite');
}

function withSources(documents) {
  return Object.fromEntries(PATHS.map(logicalPath => {
    const bytes = Buffer.from(JSON.stringify(documents.get(logicalPath)));
    return [logicalPath, { bytes, expectedSourceHash: sha(bytes) }];
  }));
}

test('both original serializations round-trip in exact JSON order from typed rows', t => {
  const path = fixture(t);
  for (const logicalPath of PATHS) {
    const { bytes, document } = originals.get(logicalPath);
    assert.equal(sha(bytes), EDITORIAL_ENVELOPE_SOURCE_HASHES[logicalPath]);
    assert.equal(sha(JSON.stringify(document)), DOCUMENT_HASHES[logicalPath]);
    assert.deepEqual(document.data, {});
    assert.equal(Object.keys(document.data).length, 0);
  }
  initializeEditorialEnvelopeDocuments(path, init);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  const store = openEditorialEnvelopeDocuments(path, options);
  const documents = store.readDocuments();
  assert.deepEqual([...documents.keys()], [...PATHS]);
  for (const logicalPath of PATHS) {
    assert.equal(JSON.stringify(documents.get(logicalPath)), JSON.stringify(originals.get(logicalPath).document));
    assert.deepEqual(documents.get(logicalPath).data, {});
  }
  const seenKinds = [...new Set(PATHS.flatMap(logicalPath => documents.get(logicalPath).content.map(node => node.kind)))].sort();
  assert.deepEqual(seenKinds, ['heading', 'paragraph', 'table']);
  const hrefs = [];
  for (const logicalPath of PATHS) {
    documents.get(logicalPath).content.forEach((node, index) => {
      const visit = (cell, pointer) => {
        for (const locale of Object.keys(cell)) {
          const leaf = cell[locale];
          if (!Array.isArray(leaf)) continue;
          leaf.forEach((run, runIndex) => {
            const keys = Object.keys(run);
            assert.ok(keys.join(',') === 'text' || keys.join(',') === 'text,href');
            if (run.href) hrefs.push([logicalPath, pointer + '/' + locale + '/' + runIndex, locale, run.text, run.href]);
          });
        }
      };
      if (node.text) visit(node.text, '/content/' + index + '/text');
      node.columns?.forEach((cell, cellIndex) => visit(cell, '/content/' + index + '/columns/' + cellIndex));
      node.rows?.forEach((row, rowIndex) => row.forEach((cell, cellIndex) => visit(cell, '/content/' + index + '/rows/' + rowIndex + '/' + cellIndex)));
    });
  }
  assert.equal(hrefs.length, 14);
  assert.equal(hrefs.every(row => row[0] === PATHS[1]), true);
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
    reopened = openEditorialEnvelopeDocuments(path, options);
    const again = reopened.readDocuments();
    for (const logicalPath of PATHS) {
      assert.equal(JSON.stringify(again.get(logicalPath)), JSON.stringify(originals.get(logicalPath).document));
    }
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
  assert.equal(db.prepare('PRAGMA application_id').get().application_id, 0x45454e56);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  const receipt = db.prepare('SELECT actor, reason FROM editorial_envelope_import').get();
  assert.equal(receipt.actor, init.actor);
  assert.equal(receipt.reason, init.reason);
  assert.equal(db.prepare('SELECT count(*) AS n FROM text_document').get().n, 2);
  assert.equal(db.prepare("SELECT count(*) AS n FROM text_document WHERE status!='draft' OR corpus_kind!='historical'").get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM text_document_node').get().n, 53);
  assert.deepEqual(db.prepare('SELECT kind, count(*) AS n FROM text_document_node GROUP BY kind ORDER BY n').all().map(row => ({ kind: row.kind, n: row.n })), [
    { kind: 'table', n: 6 }, { kind: 'heading', n: 7 }, { kind: 'paragraph', n: 40 },
  ]);
  assert.equal(db.prepare("SELECT count(*) AS n FROM text_document WHERE data_empty!=1").get().n, 0);
  db.close();
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
      () => initializeEditorialEnvelopeDocuments(path, withoutCapability),
      () => initializeEditorialEnvelopeDocuments(path, { ...init, capability: Symbol('wrong') }),
      () => initializeEditorialEnvelopeDocuments(path, publicScope),
      () => initializeEditorialEnvelopeDocuments(path, omittedScope),
      () => initializeEditorialEnvelopeDocuments(relative, init),
      () => initializeEditorialEnvelopeDocuments(path, { ...init, expectedSourceHashes: { 'wrong.json': '0'.repeat(64) } }),
      () => openEditorialEnvelopeDocuments(path, { capability: INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, scope: 'internal' }),
      () => openEditorialEnvelopeDocuments(path, { ...options, expectedSourceHashes: { [PATHS[0]]: '0'.repeat(64) } }),
      () => openEditorialEnvelopeDocuments(relative, options),
    ]) {
      fs.rmSync(marker, { force: true });
      assert.throws(call);
      assert.equal(fs.existsSync(marker), false, call.toString());
    }
    assert.throws(() => initializeEditorialEnvelopeDocuments(path, omittedScope), { code: 'E_PRIVATE' });
    assert.throws(() => initializeEditorialEnvelopeDocuments(relative, init), { code: 'E_EDITORIAL_ENVELOPE_PATH' });
    assert.throws(() => openEditorialEnvelopeDocuments(relative, options), { code: 'E_EDITORIAL_ENVELOPE_PATH' });
    assert.throws(() => openEditorialEnvelopeDocuments(path, { capability: INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, scope: 'internal' }), { code: 'E_EDITORIAL_ENVELOPE_PINS' });
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
  initializeEditorialEnvelopeDocuments(path, init);
  const before = fs.readFileSync(path);
  assert.equal(fs.statSync(path).mode & 0o777, 0o600);
  assert.throws(() => initializeEditorialEnvelopeDocuments(path, init), { code: 'EEXIST' });
  assert.deepEqual(fs.readFileSync(path), before);
  fs.chmodSync(path, 0o644);
  let opened = false;
  const open = fs.openSync;
  fs.openSync = (...args) => { opened = true; return open(...args); };
  try {
    assert.throws(() => openEditorialEnvelopeDocuments(path, options), { code: 'E_PRIVATE_MODE' });
    assert.equal(opened, false);
  } finally {
    fs.openSync = open;
  }
  assert.deepEqual(fs.readFileSync(path), before);
  fs.chmodSync(path, 0o600);
  const store = openEditorialEnvelopeDocuments(path, options);
  assert.equal(JSON.stringify(store.readDocuments().get(PATHS[0])), JSON.stringify(originals.get(PATHS[0]).document));
  store.close();
});

test('a typed title change plus a matching forged whole-document digest still fails the fixed pin', t => {
  const path = fixture(t);
  initializeEditorialEnvelopeDocuments(path, init);
  const db = new DatabaseSync(path);
  const stored = db.prepare('SELECT document_sha256, sha256 FROM source_file WHERE logical_path=?').get(PATHS[0]);
  assert.equal(stored.document_sha256, DOCUMENT_HASHES[PATHS[0]]);
  assert.equal(stored.sha256, EDITORIAL_ENVELOPE_SOURCE_HASHES[PATHS[0]]);
  const forged = structuredClone(originals.get(PATHS[0]).document);
  forged.locales.ko.title += ' changed';
  const forgedDigest = sha(JSON.stringify(forged));
  assert.notEqual(forgedDigest, DOCUMENT_HASHES[PATHS[0]]);
  db.exec('BEGIN IMMEDIATE');
  db.prepare("UPDATE text_document_locale SET title=title || ' changed' WHERE source_id=1 AND locale='ko'").run();
  db.prepare('UPDATE source_file SET document_sha256=? WHERE source_id=1').run(forgedDigest);
  db.exec('COMMIT');
  db.close();
  const reader = openEditorialEnvelopeDocuments(path, options);
  assert.throws(() => reader.readDocuments(), { code: 'E_EDITORIAL_ENVELOPE_INTEGRITY' });
  reader.close();
  const after = new DatabaseSync(path, { readOnly: true });
  assert.equal(after.prepare('SELECT document_sha256 FROM source_file WHERE source_id=1').get().document_sha256, forgedDigest);
  assert.match(after.prepare("SELECT title FROM text_document_locale WHERE source_id=1 AND locale='ko'").get().title, / changed$/);
  after.close();
});

test('missing, changed and extra rows and digest replacement fail the SELECT-only reader', t => {
  const tables = ['source_file', 'text_document', 'text_document_locale', 'text_document_category', 'text_document_source_ref', 'text_document_history', 'text_document_node', 'text_document_slot', 'text_document_table_cell', 'text_document_table_row', 'text_document_run', 'text_document_anchor', 'text_document_link'];
  for (const table of tables) for (const mode of ['missing', 'changed', 'extra']) {
    const path = fixture(t);
    initializeEditorialEnvelopeDocuments(path, init);
    const db = new DatabaseSync(path);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    const columns = db.prepare('PRAGMA table_info(' + table + ')').all();
    if (mode === 'missing') db.exec('DELETE FROM ' + table + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
    if (mode === 'changed') {
      const preferred = table === 'text_document_anchor' ? ['anchor']
        : table === 'text_document_link' ? ['resolution', 'locale', 'json_pointer']
        : ['title', 'summary', 'category', 'reference', 'entry', 'anchor', 'text', 'href', 'slug', 'document_id', 'logical_path', 'key_order', 'cell_sha256', 'slot_sha256', 'run_sha256', 'row_sha256', 'sha256', 'document_sha256'];
      const column = columns.find(row => preferred.includes(row.name));
      if (!column) throw new Error('no mutable text column on ' + table);
      db.exec('UPDATE ' + table + ' SET ' + column.name + '=' + column.name + " || '-changed' WHERE rowid=(SELECT min(rowid) FROM " + table + ')');
    }
    if (mode === 'extra') {
      const names = columns.map(column => column.name);
      const values = columns.map(column => {
        if (column.pk && column.type.includes('INTEGER') && column.name !== 'ordinal') return String(900000 + column.cid);
        if (['ordinal', 'key_ordinal', 'source_id', 'target_source_id'].includes(column.name)) return '900000';
        if (column.name === 'logical_path') return "'lore/editorial/extra.json'";
        if (column.name === 'sha256' || column.name === 'document_sha256') return "'" + '0'.repeat(64) + "'";
        if (column.name === 'json_pointer' || column.name === 'node_pointer' || column.name === 'slot_pointer' || column.name === 'row_pointer') return "'/extra'";
        if (column.name === 'locale') return "'ko'";
        if (column.name === 'resolution') return "'external'";
        if (column.name === 'corpus_kind') return "'historical'";
        if (column.name === 'href') return "'https://example.invalid/extra'";
        if (column.name === 'slug') return "'extra-slug'";
        if (column.name === 'document_id') return "'DOC:extra'";
        if (column.name === 'anchor') return "'extra-anchor'";
        return column.name;
      });
      db.exec('INSERT INTO ' + table + ' (' + names.map(name => '"' + name + '"').join(',') + ') SELECT ' + values.join(',') + ' FROM ' + table + ' LIMIT 1');
    }
    db.close();
    const reader = openEditorialEnvelopeDocuments(path, options);
    assert.throws(() => reader.readDocuments(), { code: 'E_EDITORIAL_ENVELOPE_INTEGRITY' }, table + ' ' + mode);
    reader.close();
  }
  const path = fixture(t);
  initializeEditorialEnvelopeDocuments(path, init);
  const db = new DatabaseSync(path);
  db.prepare('UPDATE source_file SET document_sha256=? WHERE source_id=1').run('ab'.repeat(32));
  db.close();
  const reader = openEditorialEnvelopeDocuments(path, options);
  assert.throws(() => reader.readDocuments(), { code: 'E_EDITORIAL_ENVELOPE_INTEGRITY' });
  reader.close();
});

test('failed initialization rolls back and deletes the new database', t => {
  const path = fixture(t);
  const changed = new Map(PATHS.map(logicalPath => [logicalPath, structuredClone(originals.get(logicalPath).document)]));
  changed.get(PATHS[0]).data = { activated: true };
  assert.throws(() => initializeEditorialEnvelopeDocuments(path, { ...init, sources: withSources(changed) }), { code: 'E_EDITORIAL_ENVELOPE_SHAPE' });
  assert.equal(fs.existsSync(path), false);
  assert.equal(fs.existsSync(path + '-journal'), false);
  assert.equal(fs.existsSync(path + '-wal'), false);
});

test('reader stays SELECT-only and does not reopen archives or parse source JSON', t => {
  const path = fixture(t);
  initializeEditorialEnvelopeDocuments(path, init);
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
    store = openEditorialEnvelopeDocuments(path, options);
    DatabaseSync.prototype.prepare = function(sql) {
      queries.push(sql);
      assert.match(sql, /^(SELECT |PRAGMA )/i);
      assert.doesNotMatch(sql, /editorial_envelope_archive|json_extract|source_record|\braw_bytes\b/i);
      return prepare.call(this, sql);
    };
    const documents = store.readDocuments();
    for (const logicalPath of PATHS) {
      assert.equal(JSON.stringify(documents.get(logicalPath)), JSON.stringify(originals.get(logicalPath).document));
    }
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

test('historical proposal storage does not approve or activate rules', t => {
  const path = fixture(t);
  initializeEditorialEnvelopeDocuments(path, init);
  const documents = openEditorialEnvelopeDocuments(path, options);
  try {
    for (const logicalPath of PATHS) {
      const document = documents.readDocuments().get(logicalPath);
      assert.equal(document.status, 'draft');
      assert.equal(document.status === 'approved', false);
      assert.deepEqual(document.data, {});
    }
  } finally {
    documents.close();
  }
  const db = new DatabaseSync(path, { readOnly: true });
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE '%publication%' OR name LIKE '%admission%' OR name LIKE '%rule%'").get().n, 0);
  db.close();
});

test('missing, changed and extra external link rows fail exact href coverage', t => {
  const tripothon = 2;
  const modes = ['missing', 'changed-href', 'changed-locale', 'changed-resolution', 'changed-target', 'extra'];
  for (const mode of modes) {
    const path = fixture(t);
    initializeEditorialEnvelopeDocuments(path, init);
    const db = new DatabaseSync(path);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    const before = db.prepare('SELECT json_pointer, locale, resolution, target_source_id, target_anchor_ordinal, href FROM text_document_link l JOIN text_document_run r USING(source_id, json_pointer) WHERE l.source_id=? ORDER BY json_pointer').all(tripothon);
    assert.equal(before.length, 14);
    assert.equal(before.every(row => row.resolution === 'external' && row.target_source_id === null && row.target_anchor_ordinal === null && row.href.startsWith('https://')), true);
    if (mode === 'missing') db.prepare('DELETE FROM text_document_link WHERE source_id=? AND json_pointer=?').run(tripothon, before[0].json_pointer);
    if (mode === 'changed-href') db.prepare('UPDATE text_document_run SET href=? WHERE source_id=? AND json_pointer=?').run('https://example.invalid/forged', tripothon, before[0].json_pointer);
    if (mode === 'changed-locale') db.prepare('UPDATE text_document_link SET locale=? WHERE source_id=? AND json_pointer=?').run(before[0].locale === 'ko' ? 'en' : 'ko', tripothon, before[0].json_pointer);
    if (mode === 'changed-resolution') db.prepare("UPDATE text_document_link SET resolution='document' WHERE source_id=? AND json_pointer=?").run(tripothon, before[0].json_pointer);
    if (mode === 'changed-target') db.prepare('UPDATE text_document_link SET target_source_id=1, target_anchor_ordinal=0 WHERE source_id=? AND json_pointer=?').run(tripothon, before[0].json_pointer);
    if (mode === 'extra') db.prepare("INSERT INTO text_document_link (source_id, json_pointer, corpus_kind, locale, resolution, target_source_id, target_anchor_ordinal) VALUES (?,?,?,?,?,?,?)").run(tripothon, '/content/1/text/ko/0', 'historical', 'ko', 'external', null, null);
    db.close();
    const reader = openEditorialEnvelopeDocuments(path, options);
    assert.throws(() => reader.readDocuments(), { code: 'E_EDITORIAL_ENVELOPE_INTEGRITY' }, mode);
    reader.close();
  }
});
