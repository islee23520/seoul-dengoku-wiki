import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { readSourceArchive } from './source-archive.mjs';
import { PERSON_CONTACT_INPUT_SOURCE_HASHES, PERSON_CONTACT_INPUT_SEMANTIC_HASHES, readPersonContactInputs } from './person-contact-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const databasePath = process.env.PERSON_CONTACT_INPUT_DB ?? '/tmp/seoul-document-authority-20261020/bootstrap-issued-sheets-20261020.sqlite';
process.chdir(repoRoot);
// Historical import parity uses original bytes, independently of current roster projection.
const archived = path => JSON.parse(readSourceArchive(path, PERSON_CONTACT_INPUT_SOURCE_HASHES[path]));
const registry = archived('lore/name-pools/person-id-registry.json');
const people = new Map(registry.persons.map(person => [person.id, person]));
const parentStatusById = new Map(archived('lore/name-pools/cast-family-parent-status.json').records.map(row => [row.personId, row.status]));
const proseContactsById = new Map();
for (const row of archived('lore/name-pools/cast-prose-contacts.json').records) {
  const source = archived(row.sourceRef.path).content.find(block => block.anchor === row.sourceRef.anchor);
  const value = source?.kind === 'list' ? source.items.find(item => typeof item.ko === 'string' && item.ko.startsWith('주요 관계:'))?.ko : source?.text?.ko;
  const basis = typeof value === 'string' ? value : Array.isArray(value) ? value.filter(part => !part.strong).map(part => part.text).join('') : '';
  for (const [id, recipientId] of [[row.personId, row.recipientId], [row.recipientId, row.personId]]) {
    const contacts = proseContactsById.get(id) ?? [];
    contacts.push({ recipientId, recipientName: people.get(recipientId).name, basis: basis.trim(), sourceRef: row.sourceRef });
    proseContactsById.set(id, contacts);
  }
}
const legacy = { issuedById: people };
const expected = { parentStatusById, proseContactsById };

function guarded(db, mutate = (sql, rows) => rows) {
  return { prepare(sql) {
    assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
    const statement = db.prepare(sql);
    return { all: (...args) => mutate(sql, statement.all(...args).map(row => ({ ...row })), args) };
  } };
}

function open(t) {
  const db = new DatabaseSync(databasePath, { readOnly: true });
  t.after(() => db.close());
  return db;
}

test('actual production Maps match exactly for all 1022 IDs, including insertion order and incoming contacts', async t => {
  for (let reopen = 0; reopen < 2; reopen++) {
    const db = open(t);
    const actual = readPersonContactInputs(guarded(db));
    assert.deepEqual(await loadDbInputs({ db: guarded(db), inputSubset: 'contacts' }), actual);
    assert.deepEqual(actual, expected);
    assert.equal(legacy.issuedById.size, 1022);
    for (const id of legacy.issuedById.keys()) {
      assert.deepEqual(actual.parentStatusById.get(id), expected.parentStatusById.get(id));
      assert.deepEqual(actual.proseContactsById.get(id), expected.proseContactsById.get(id));
    }
    for (const key of Object.keys(expected)) assert.equal(JSON.stringify([...actual[key]]), JSON.stringify([...expected[key]]));
    assert.equal(actual.parentStatusById.size, 2);
    assert.equal([...actual.proseContactsById.values()].flat().length, 30);
    assert.throws(() => db.exec('DELETE FROM context_prose_contact'), /readonly|read-only/iu);
  }
});

test('actual reader works with source filesystem and JSON.parse denied', t => {
  const db = open(t);
  const originals = [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fsp.readFile, fsp.readdir, JSON.parse];
  const denied = () => { throw new Error('E_SOURCE_IO_DENIED'); };
  try {
    fs.readFileSync = fs.readFile = fs.readdirSync = fs.readdir = fsp.readFile = fsp.readdir = JSON.parse = denied;
    syncBuiltinESMExports();
    assert.deepEqual(readPersonContactInputs(guarded(db)), expected);
  } finally {
    [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fsp.readFile, fsp.readdir, JSON.parse] = originals;
    syncBuiltinESMExports();
  }
});

test('missing sources and unsupported or changed hashes reject', t => {
  const db = open(t);
  assert.throws(() => readPersonContactInputs(guarded(db), { expectedSourceHashes: {} }), { code: 'E_PERSON_CONTACT_STALE' });
  for (const path of Object.keys(PERSON_CONTACT_INPUT_SOURCE_HASHES)) {
    assert.throws(() => readPersonContactInputs(guarded(db, (sql, rows, args) => /SELECT source_id,sha256 FROM source_file/u.test(sql) && args[0] === path ? [] : rows)), { code: 'E_PERSON_CONTACT_MISSING' });
    assert.throws(() => readPersonContactInputs(guarded(db, (sql, rows, args) => /SELECT source_id,sha256 FROM source_file/u.test(sql) && args[0] === path ? rows.map(row => ({ ...row, sha256: '0'.repeat(64) })) : rows)), { code: 'E_PERSON_CONTACT_STALE' });
  }
});

test('current contact prose requires its separately fixed semantic approval', t => {
  const db = open(t);
  const corePath = 'lore/characters/Core-Characters.json';
  const connection = guarded(db, (sql, rows, args) => {
    if (sql.includes('r.parent_revision,r.semantic_sha256,r.algorithm') && args[0] === corePath) {
      return rows.map(row => ({ ...row, parent_revision: 'successor-parent',
        semantic_sha256: PERSON_CONTACT_INPUT_SEMANTIC_HASHES[corePath] }));
    }
    return rows;
  });
  for (const expectedSemanticHashes of [{}, { [corePath]: '0'.repeat(64) }]) {
    assert.throws(() => readPersonContactInputs(connection, { expectedSemanticHashes }), { code: 'E_REFERENCE_STALE' });
  }
  assert.throws(() => readPersonContactInputs(connection, { expectedSemanticHashes: { [corePath]: 'malformed' } }),
    { code: 'E_REFERENCE_ARGUMENT' });
});

for (const table of ['family_parent_status', 'context_prose_contact']) {
  for (const change of ['missing-terminal', 'wrong-source', 'wrong-pointer']) test(`${table}: ${change} rejects`, t => {
    const db = open(t);
    const connection = guarded(db, (sql, rows) => {
      if (!sql.includes(`FROM ${table} ORDER BY`)) return rows;
      if (change === 'missing-terminal') return rows.slice(0, -1);
      rows[0][change === 'wrong-source' ? 'source_id' : 'json_pointer'] = change === 'wrong-source' ? -1 : '/records/99';
      return rows;
    });
    assert.throws(() => readPersonContactInputs(connection), { code: 'E_PERSON_CONTACT_COVERAGE' });
  });
}

for (const [table, field, value, code] of [
  ['family_parent_status', 'known_parent_id', 'K001', 'E_PARENT_STATUS'],
  ['family_parent_status', 'person_id', 'missing', 'E_PARENT_STATUS'],
  ['family_parent_status', 'status', 'invented', 'E_PARENT_STATUS'],
  ['family_parent_status', 'source_ref_path', 'lore/characters/Cast-State-03.json', 'E_PARENT_STATUS_SOURCE'],
  ['family_parent_status', 'source_ref_anchor', 'missing', 'E_PARENT_STATUS_SOURCE'],
  ['context_prose_contact', 'person_id', 'missing', 'E_PROSE_CONTACT_ID'],
  ['context_prose_contact', 'recipient_person_id', 'K001', 'E_PROSE_CONTACT_SOURCE'],
  ['context_prose_contact', 'source_ref_anchor', 'missing', 'E_PROSE_CONTACT_SOURCE'],
  ['context_prose_contact', 'source_ref_path', '../../escape.json', 'E_PROSE_CONTACT_ID'],
  ['context_prose_contact', 'source_ref_path', 'lore/characters/Cast-State-05.json', 'E_PROSE_CONTACT_SOURCE'],
]) test(`${table}: wrong ${field} rejects`, t => {
  const db = open(t);
  assert.throws(() => readPersonContactInputs(guarded(db, (sql, rows) => {
    if (sql.includes(`FROM ${table} ORDER BY`)) rows[0][field] = value;
    return rows;
  })), { code });
});

test('missing envelope nodes and changed typed prose reject sealed-source integrity', t => {
  const db = open(t);
  for (const change of ['node', 'text']) {
    assert.throws(() => readPersonContactInputs(guarded(db, (sql, rows) => {
      if (change === 'node' && /FROM text_document_node WHERE/u.test(sql)) return rows.slice(0, -1);
      if (change === 'text' && /FROM text_document_slot WHERE/u.test(sql)) for (const row of rows) if (row.representation === 'string') row.text += ' changed';
      return rows;
    })), /E_REFERENCE_INTEGRITY/u);
  }
});
