import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { applySchema, openReadOnly } from './db.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { mapTextData } from './text-data.mjs';
import { readDocument, listDocuments } from './document-read.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';

const leaf = (ko, en = ko) => ({ ko, en });
function document(slug = 'Page') {
  return { version: 1, domain: 'technology', id: `id-${slug}`, slug, status: 'approved', categories: ['fixture'],
    tense: { ko: 'past', en: 'present' }, source: { kind: 'observed', refs: ['fixture-ref'], hash: 'a'.repeat(64) },
    provenance: { original_anchor: 'fixture', original_hash: null, history: ['one', 'one'] },
    locales: { ko: { title: 'Fixture KO', summary: 'KO summary', tense: 'past' }, en: { title: 'Fixture EN', summary: 'EN summary', tense: 'present' } },
    content: [
      { kind: 'heading', anchor: 'heading', publicAnchors: ['public'], depth: 2, text: leaf('Natural KO', 'Natural EN') },
      { kind: 'paragraph', anchor: 'visible-tech', publicAnchors: ['paragraph-public'], text: leaf(' A\n<a id="inline"></a> ', ' B\n<a id="inline-en"></a> ') },
      { kind: 'quote', anchor: 'quote', text: leaf([{ text: 'bold', strong: true }, { text: 'target', link: { domain: 'technology', slug, anchor: 'public' } }, { text: 'web', href: 'https://example.org' }, { text: 'page', link: { domain: 'technology', slug } }]) },
      { kind: 'rule', anchor: 'rule', publicAnchors: ['rule-public'] },
      { kind: 'code', anchor: 'code', language: 'json', info: 'fixture', text: leaf('{"ko":1}\n', '{"en":1}\n') },
      { kind: 'list', anchor: 'list', ordered: true, start: 0, items: [leaf('first'), leaf([{ text: 'second', strong: true }])] },
      { kind: 'table', anchor: 'table', columns: [leaf('one'), leaf('two')], rows: [[leaf(''), leaf('x|y')], [leaf('ragged')]] },
    ], data: { constraint: 'fixture only', sequence: [{ id: 'event', anchor: 'event', order: 0, date: { status: 'unknown', reason: 'fixture' } }], primary_detail_names: [] } };
}
const file = (source_id, d, corpus_kind = 'current') => ({ source_id, document: d, corpus_kind,
  logical_path: `/nonexistent/database-only-${source_id}.json`, content_policy: 'local-corpus' });

function fixture(t, files) {
  const directory = mkdtempSync(join(tmpdir(), 'sqlite-document-read-'));
  const db = new DatabaseSync(join(directory, 'fixture.sqlite'));
  t.after(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
  applySchema(db);
  const insert = (table, mapped) => {
    if (!mapped.length) return;
    const columns = Object.keys(mapped[0]);
    const statement = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`);
    for (const row of mapped) statement.run(...columns.map((column) => row[column]));
  };
  for (const f of files) {
    // The DB contains deliberately non-JSON bytes. Reader success cannot come from parsing them.
    const bytes = Buffer.from('not JSON');
    db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(f.source_id, f.logical_path, 'application/json', sha256(bytes), bytes.length, bytes);
    insert('source_record', flattenJson(f.document).map((row) => ({ source_id: f.source_id, ...row })));
  }
  for (const [table, mapped] of Object.entries(mapTextCorpusDocuments({ files }))) insert(table, mapped);
  const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: { persons: [] } }, ...files] };
  for (const [table, mapped] of Object.entries(mapTextData({ files, bundle }))) insert(table, mapped);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  return db;
}
const internal = (documentId, corpusKind = 'current', domain) => ({ documentId, corpusKind, visibility: 'internal', ...(domain ? { domain } : {}) });
// Disallow even preparing a query that tries to recover the generic tree or original bytes.
const typedOnly = (db) => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b/iu);
  return db.prepare(sql);
} });

test('typed SQLite reconstructs all seven kinds and exact KO/EN renderer envelopes without files or raw bytes', (t) => {
  const expected = document();
  const db = fixture(t, [file(1, expected)]);
  const result = readDocument(typedOnly(db), internal(expected.id));
  assert.deepEqual(result, expected);
  for (const locale of ['ko', 'en']) assert.equal(renderLoreMarkdown(result, locale), renderLoreMarkdown(expected, locale));
  assert.equal(result.readMetadata.corpus_kind, 'current');
  assert.equal(result.readMetadata.logical_path, '/nonexistent/database-only-1.json');
  assert.equal(Object.keys(result).includes('readMetadata'), false);
  assert.deepEqual(result.readMetadata.schemaGaps.map((gap) => gap.code), ['publication-admission-unrecorded', 'unmapped-data-undetectable']);
});

test('optional fields, corpus separation, domains and database-only listing retain identity', (t) => {
  const minimal = document('Minimal');
  delete minimal.categories; delete minimal.source.hash; delete minimal.content[4].info;
  delete minimal.content[5].ordered; delete minimal.content[5].start;
  minimal.data = { sequence: [] };
  const old = { ...document('Minimal'), status: 'excluded' };
  const other = { ...document('Other'), domain: 'culture', id: minimal.id, data: { transmission: 'fixture' } };
  const db = typedOnly(fixture(t, [file(1, minimal), file(2, old, 'historical'), file(3, other), file(4, document('Example'), 'example')]));
  assert.deepEqual(readDocument(db, internal(minimal.id, 'current', 'technology')), minimal);
  assert.deepEqual(readDocument(db, internal(old.id, 'historical')), old);
  assert.deepEqual(readDocument(db, internal(other.id, 'current', 'culture')), other);
  assert.throws(() => readDocument(db, internal(minimal.id)), { code: 'E_DOCUMENT_AMBIGUOUS' });
  assert.equal(listDocuments(db, { corpusKind: 'current', domain: 'culture', visibility: 'internal' }).length, 1);
  assert.equal(listDocuments(db, { corpusKind: 'example', visibility: 'internal' }).length, 1);
  assert.equal(readDocument(db, internal('missing')), null);
  assert.throws(() => listDocuments(db, {}), { code: 'E_ARGUMENTS' });
});

test('public reads exclude draft/excluded/private identities and fail closed without DB publication admission', (t) => {
  const draft = { ...document('Draft'), status: 'draft' };
  const excluded = { ...document('Excluded'), status: 'excluded' };
  const privateDoc = document('Private');
  const db = fixture(t, [file(1, draft), file(2, excluded), file(3, privateDoc)]);
  db.prepare('INSERT INTO excluded_source VALUES (?,?,?,?)').run('/nonexistent/database-only-3.json', 'b'.repeat(64), 0, 'private-soul-historical-motif');
  assert.deepEqual(listDocuments(db, { corpusKind: 'current' }), []);
  for (const d of [draft, excluded, privateDoc]) assert.equal(readDocument(db, { documentId: d.id, corpusKind: 'current' }), null);
  assert.deepEqual(readDocument(db, internal(privateDoc.id)), privateDoc);
  db.exec('DELETE FROM excluded_source');
  assert.throws(() => listDocuments(db, { corpusKind: 'current' }), (error) => error.code === 'E_DOCUMENT_SCHEMA_GAP' && error.schemaGaps[0].code === 'publication-admission-unrecorded');
  assert.throws(() => readDocument(db, { documentId: privateDoc.id, corpusKind: 'current' }), { code: 'E_DOCUMENT_SCHEMA_GAP' });
});

test('missing typed tables and inconsistent runs report a schema gap instead of a partial envelope', (t) => {
  const db = fixture(t, [file(1, document())]);
  db.exec("UPDATE text_document_slot SET text='wrong' WHERE representation='runs'");
  assert.throws(() => readDocument(db, internal('id-Page')), { code: 'E_DOCUMENT_SCHEMA_GAP' });
  const empty = new DatabaseSync(':memory:');
  try { assert.throws(() => listDocuments(empty, { corpusKind: 'current' }), (error) => error.code === 'E_DOCUMENT_SCHEMA_GAP' && error.schemaGaps[0].code === 'missing-typed-schema'); }
  finally { empty.close(); }
});

test('optional canonical DB readback uses typed tables only and never source JSON', { skip: !process.env.DOCUMENT_READ_DB }, () => {
  const db = openReadOnly(process.env.DOCUMENT_READ_DB);
  try {
    const safe = typedOnly(db);
    const identities = ['current', 'historical', 'example'].flatMap((corpusKind) => listDocuments(safe, { corpusKind, visibility: 'internal' }));
    assert.equal(identities.length, 98);
    for (const identity of identities) {
      const d = readDocument(safe, internal(identity.document_id, identity.corpus_kind, identity.domain));
      assert.equal(d.id, identity.document_id);
      for (const locale of ['ko', 'en']) assert.equal(typeof renderLoreMarkdown(d, locale), 'string');
    }
  } finally { db.close(); }
});
