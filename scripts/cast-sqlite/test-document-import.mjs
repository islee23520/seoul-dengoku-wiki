import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { applySchema, openReadOnly } from './db.mjs';
import { importDocuments } from './document-import.mjs';
import { listDocuments, readDocument } from './document-read.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { TEXT_DOCUMENT_MANIFEST } from './text-corpus-manifest.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { auditTextData, mapTextData } from './text-data.mjs';
import { readCanonicalAuthoringSchemas } from './authoring-schema-documents.mjs';

const leaf = (text) => ({ ko: text, en: text });
const document = (slug = 'Page', status = 'approved') => ({ version: 1, domain: 'technology', id: `id-${slug}`, slug, status,
  tense: { ko: 'past', en: 'present' }, source: { kind: 'observed', refs: ['fixture'] },
  provenance: { original_anchor: 'fixture', original_hash: null, history: ['a', 'a'] },
  locales: { ko: { title: 'KO', summary: 'KO summary', tense: 'past' }, en: { title: 'EN', summary: 'EN summary', tense: 'present' } },
  content: [
    { kind: 'heading', anchor: 'heading', publicAnchors: ['public'], depth: 2, text: leaf('Title') },
    { kind: 'paragraph', anchor: 'paragraph', text: leaf(' space\n ') },
    { kind: 'quote', anchor: 'quote', text: leaf([{ text: 'bold', strong: true }, { text: 'web', href: 'https://example.org' }]) },
    { kind: 'rule', anchor: 'rule' },
    { kind: 'code', anchor: 'code', language: 'json', text: leaf('{}\n') },
    { kind: 'list', anchor: 'list', ordered: true, start: 0, items: [leaf('one'), leaf('two')] },
    { kind: 'table', anchor: 'table', columns: [leaf('column')], rows: [[leaf('')], [leaf('pipe|cell')]] },
  ], data: { constraint: 'fixture', sequence: [] } });
const entry = (d = document(), corpus_kind = 'current', source_id) => ({
  ...(source_id === undefined ? {} : { source_id }), logical_path: `opaque/${corpus_kind}/${d.domain}/${d.slug}.json`, privacy: 'public',
  corpus_kind, identity: { domain: d.domain, document_id: d.id, slug: d.slug }, raw_bytes: Buffer.from(`\n${JSON.stringify(d, null, 2)}\n`),
});
const selector = (e) => ({ documentId: e.identity.document_id, domain: e.identity.domain, corpusKind: e.corpus_kind, visibility: 'internal' });
const typedOnly = (db) => ({ prepare(sql) { assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b/iu); return db.prepare(sql); } });
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'document-import-'));
  const db = new DatabaseSync(join(dir, 'existing.sqlite')); applySchema(db);
  t.after(() => { if (db.isOpen) db.close(); rmSync(dir, { recursive: true, force: true }); });
  return { db, dir };
}
const snapshot = (db) => db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all()
  .map(({ name }) => [name, db.prepare(`SELECT * FROM ${name}`).all()]);

test('explicit schema definitions import complete typed documents with schema file reads forbidden', t => {
  const { db } = fixture(t);
  const definitions = readCanonicalAuthoringSchemas()['lore/authoring.shared.schema.json'].$defs;
  const input = entry();
  const read = fs.readFileSync;
  try {
    fs.readFileSync = () => { throw new Error('schema filesystem fallback forbidden'); };
    syncBuiltinESMExports();
    assert.equal(importDocuments({ db, entries: [input], store: 'public', definitions }).imported.length, 1);
    assert.deepEqual(readDocument(typedOnly(db), selector(input)), document());
    const invalid = document('Invalid'); invalid.content[0].depth = 99;
    assert.throws(() => importDocuments({ db, entries: [entry(invalid)], store: 'public', definitions }), { code: 'E_TEXT_DOCUMENT_SHAPE' });
  } finally { fs.readFileSync = read; syncBuiltinESMExports(); }
});

test('new output preserves exact bytes; delete JSON and reopen typed-only readers and both render locales', (t) => {
  const { dir } = fixture(t), outputPath = join(dir, 'new.sqlite');
  const entries = [entry(document(), 'current', 40), entry(document('Draft', 'draft')), entry(document('Old', 'excluded'), 'historical'), entry(document('Example'), 'example')];
  const jsonPath = join(dir, 'source.json'); writeFileSync(jsonPath, entries[0].raw_bytes); entries[0].logical_path = jsonPath;
  const result = importDocuments({ outputPath, entries, store: 'public' });
  assert.deepEqual(result.imported.map((r) => r.source_id), [40, 41, 42, 43]);
  assert.equal(result.domain_sidecar_normalization, 'complete'); assert.equal(result.publication_admission, 'unrecorded');
  rmSync(jsonPath);
  const db = openReadOnly(outputPath);
  try {
    for (const e of entries) {
      const expected = JSON.parse(Buffer.from(e.raw_bytes).toString('utf8'));
      const actual = readDocument(typedOnly(db), selector(e)); assert.deepEqual(actual, expected);
      for (const locale of ['ko', 'en']) assert.equal(renderLoreMarkdown(actual, locale), renderLoreMarkdown(expected, locale));
      const archive = db.prepare('SELECT * FROM source_file WHERE source_id=?').get(actual.readMetadata.source_id);
      assert.deepEqual(Buffer.from(archive.raw_bytes), e.raw_bytes); assert.equal(archive.sha256, sha256(e.raw_bytes));
    }
    assert.equal(listDocuments(typedOnly(db), { corpusKind: 'current', visibility: 'internal' }).length, 2);
    assert.throws(() => readDocument(db, { ...selector(entries[0]), visibility: 'public' }), { code: 'E_DOCUMENT_SCHEMA_GAP' });
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});

test('existing IDs and archive coordinates stay stable; omitted IDs append and links use typed existing targets', (t) => {
  const { db } = fixture(t), first = entry(document('Target'), 'current', 50);
  importDocuments({ db, entries: [first], store: 'public' });
  const before = db.prepare('SELECT * FROM source_file WHERE source_id=50').get();
  const nextDoc = document('Next');
  nextDoc.content[1].text = leaf([{ text: 'target', link: { domain: 'technology', slug: 'Target', anchor: 'public' } }]);
  importDocuments({ db, entries: [entry(nextDoc)], store: 'public' });
  assert.deepEqual(db.prepare('SELECT * FROM source_file WHERE source_id=50').get(), before);
  assert.equal(db.prepare('SELECT max(source_id) AS id FROM source_file').get().id, 51);
  assert.equal(db.prepare("SELECT target_source_id FROM text_document_link WHERE source_id=51 AND locale='ko'").get().target_source_id, 50);
});

test('prearchived bytes are reused without renumbering or overwriting and conflicts reject atomically', (t) => {
  const { db } = fixture(t), e = entry(document(), 'current', 9);
  db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(9, e.logical_path, 'application/json', sha256(e.raw_bytes), e.raw_bytes.length, e.raw_bytes);
  for (const row of flattenJson(document())) db.prepare(`INSERT INTO source_record VALUES (?,?,?,?,?,?,?,?,?,?)`).run(9, ...Object.values(row));
  importDocuments({ db, entries: [e], store: 'public' });
  assert.equal(readDocument(db, selector(e)).readMetadata.source_id, 9);
  const before = snapshot(db), conflict = entry(document('Conflict'), 'current', 10); conflict.logical_path = e.logical_path;
  assert.throws(() => importDocuments({ db, entries: [conflict], store: 'public' }), { code: 'E_DOCUMENT_IMPORT_ARCHIVE' });
  assert.deepEqual(snapshot(db), before);
});

test('unknown data including glossary is rejected with an inventory, never rescued from generic records', (t) => {
  const { db, dir } = fixture(t), d = document('Glossary'); d.data = { glossary: [{ term: 'unsupported' }] };
  const e = entry(d), before = snapshot(db);
  assert.throws(() => importDocuments({ db, entries: [entry(), e], store: 'public' }),
    (error) => error.code === 'E_DOCUMENT_IMPORT_UNMAPPED_DATA' && error.unsupported[0] === e.logical_path);
  assert.deepEqual(snapshot(db), before);
  const outputPath = join(dir, 'failed.sqlite');
  assert.throws(() => importDocuments({ outputPath, entries: [e], store: 'public' }), { code: 'E_DOCUMENT_IMPORT_UNMAPPED_DATA' });
  assert.equal(existsSync(outputPath), false);
});

test('duplicates, identity mismatch, private entries and excluded provenance reject without mutation', (t) => {
  const { db } = fixture(t), e = entry(), before = snapshot(db);
  for (const entries of [[e, { ...e, logical_path: 'other' }], [e, { ...entry(document('Other')), identity: e.identity }]]) {
    assert.throws(() => importDocuments({ db, entries, store: 'public' })); assert.deepEqual(snapshot(db), before);
  }
  for (const privacy of ['private', undefined]) {
    assert.throws(() => importDocuments({ db, entries: [{ ...e, privacy }], store: 'public' }), { code: 'E_DOCUMENT_IMPORT_PRIVACY' });
  }
  assert.throws(() => importDocuments({ db, entries: [e] }), { code: 'E_DOCUMENT_IMPORT_PRIVACY' });
  db.prepare('INSERT INTO excluded_source VALUES (?,?,?,?)').run(e.logical_path, 'a'.repeat(64), 0, 'private-soul-historical-motif');
  assert.throws(() => importDocuments({ db, entries: [e], store: 'public' }), { code: 'E_DOCUMENT_IMPORT_PRIVACY' });
  db.exec('DELETE FROM excluded_source');
  importDocuments({ db, entries: [e], store: 'public' });
  const imported = snapshot(db);
  assert.throws(() => importDocuments({ db, entries: [e], store: 'public' }), { code: 'E_DOCUMENT_IMPORT_DUPLICATE' });
  const sameId = document('Other'); sameId.id = document().id;
  assert.throws(() => importDocuments({ db, entries: [entry(sameId)], store: 'public' }), { code: 'E_DOCUMENT_IMPORT_DUPLICATE' });
  assert.deepEqual(snapshot(db), imported);
});

test('failure after archive and typed insertion rolls back every imported family', (t) => {
  const { db } = fixture(t);
  db.exec("CREATE TRIGGER fail_import BEFORE INSERT ON text_technology_example BEGIN SELECT RAISE(ABORT,'injected typed failure'); END");
  const before = snapshot(db);
  assert.throws(() => importDocuments({ db, entries: [entry(), entry(document('Second'))], store: 'public' }), /injected typed failure/u);
  assert.deepEqual(snapshot(db), before); assert.equal(db.isTransaction, false);
});

test('100 inspected inputs report glossary separately and all supported envelopes import atomically', (t) => {
  const read = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
  const bundle = { files: ['lore/name-pools/person-id-registry.json', 'lore/name-pools/values-cast.json'].map((logical_path) => ({ logical_path, document: read(logical_path) })) };
  const { db } = fixture(t);
  const persons = bundle.files[0].document.persons;
  persons.forEach((p, i) => db.prepare('INSERT INTO person(person_id,name,publication_ordinal,public_key,public_route,minors,values_source_ordinal) VALUES (?,?,?,?,?,0,?)')
    .run(p.id, p.name, i + 1, p.id, `/${p.id}`, i));
  const states = [...new Set(bundle.files[1].document.people.map((p) => p.state))];
  for (const id of states) db.prepare('INSERT INTO state(state_id) VALUES (?)').run(id);
  const example = { source_id: 1000, logical_path: 'lore/characters/authoring.example.json',
    document: read('lore/characters/authoring.example.json'), sha256: 'a'.repeat(64) };
  const exampleRows = mapTextData({ files: [example], bundle });
  exampleRows.text_character_example_value.forEach((row, i) => db.prepare('INSERT INTO value_axis VALUES (?,?)').run(row.axis_name, i));
  exampleRows.text_character_example_desire.forEach((row, i) => db.prepare('INSERT INTO desire_axis VALUES (?,?,?)').run(row.axis_name, i, row.value_kind));
  const unsupported = [], supported = [], entries = [];
  const inventory = [...TEXT_DOCUMENT_MANIFEST, { logical_path: 'lore/glossary.json', corpus_kind: 'current' }];
  for (const [index, m] of inventory.entries()) {
    const raw_bytes = readFileSync(new URL(`../../${m.logical_path}`, import.meta.url));
    const file = { ...m, source_id: index + 1, document: JSON.parse(raw_bytes), sha256: sha256(raw_bytes), content_policy: 'local-corpus' };
    try {
      mapTextCorpusDocuments({ files: [file] });
      const audit = auditTextData({ files: [file], tables: mapTextData({ files: [file], bundle }) });
      if (audit.domain_sidecar_normalization === 'complete') {
        supported.push(m.logical_path);
        entries.push({ ...entry(file.document, m.corpus_kind, file.source_id), logical_path: m.logical_path, raw_bytes });
      }
      else unsupported.push({ path: m.logical_path, code: 'E_DOCUMENT_IMPORT_UNMAPPED_DATA' });
    } catch (error) { unsupported.push({ path: m.logical_path, code: error.code ?? error.name }); }
  }
  assert.equal(supported.length + unsupported.length, inventory.length);
  assert.ok(unsupported.some((item) => item.path === 'lore/glossary.json'));
  const result = importDocuments({ db, entries, store: 'public', registryFacts: { persons, states: states.map((state_id) => ({ state_id })) } });
  assert.equal(result.imported.length, supported.length);
  for (const e of entries) {
    const actual = readDocument(typedOnly(db), selector(e));
    const expected = JSON.parse(e.raw_bytes);
    assert.deepEqual(actual, expected);
    for (const locale of ['ko', 'en']) assert.equal(renderLoreMarkdown(actual, locale), renderLoreMarkdown(expected, locale));
  }
  console.log(JSON.stringify({ inspected_input_count: inventory.length, manifest_count: TEXT_DOCUMENT_MANIFEST.length, imported_count: result.imported.length, unsupported }));
});
