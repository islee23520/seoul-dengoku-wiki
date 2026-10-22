import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { applySchema, openReadOnly } from './db.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { mapTextData } from './text-data.mjs';
import { readDocument } from './document-read.mjs';
import { flattenJson } from './sources.mjs';
import { readEvidenceDocumentReference } from './evidence-document-reference.mjs';

test('reference arguments reject before touching storage', () => {
  const db = { prepare() { throw new Error('unexpected storage access'); } };
  for (const value of [undefined, {}, { logicalPath: 'source', expectedSha256: 'bad' },
    ...[null, '', 'A'.repeat(64), 'a'.repeat(63), 123, {}].map(expectedSemanticSha256 => ({
      logicalPath: 'source', expectedSha256: 'a'.repeat(64), expectedSemanticSha256,
    }))]) {
    assert.throws(() => readEvidenceDocumentReference(db, value), { code: 'E_REFERENCE_ARGUMENT' });
  }
});

test('a sealed successor cannot inherit the original byte-hash approval', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE source_file(source_id INTEGER,logical_path TEXT,sha256 TEXT);
      CREATE TABLE text_document(source_id INTEGER,document_id TEXT,domain TEXT,corpus_kind TEXT);
      CREATE TABLE document_head(source_id INTEGER,revision_id TEXT);
      CREATE TABLE document_revision(source_id INTEGER,revision_id TEXT,parent_revision TEXT,semantic_sha256 TEXT,algorithm TEXT);
      CREATE TABLE document_revision_seal(revision_id TEXT);`);
    db.prepare('INSERT INTO source_file VALUES(1,?,?)').run('source', 'a'.repeat(64));
    db.exec(`INSERT INTO text_document VALUES(1,'document','world','current');
      INSERT INTO document_head VALUES(1,'successor');
      INSERT INTO document_revision VALUES(1,'successor','original','semantic','typed-envelope-v1');
      INSERT INTO document_revision_seal VALUES('successor');`);
    const pin = { logicalPath: 'source', expectedSha256: 'a'.repeat(64) };
    assert.throws(() => readEvidenceDocumentReference(db, pin), { code: 'E_REFERENCE_STALE' });
    db.exec('DELETE FROM document_revision_seal');
    assert.throws(() => readEvidenceDocumentReference(db, pin), { code: 'E_REFERENCE_AUTHORITY' });
  } finally { db.close(); }
});

test('only an independently pinned sealed successor resolves, with typed integrity and admission intact', () => {
  const db = new DatabaseSync(':memory:');
  try {
    applySchema(db);
    const document = { version: 1, domain: 'technology', id: 'fixture', slug: 'Fixture', status: 'draft',
      tense: { ko: 'past', en: 'present' }, source: { kind: 'observed', refs: ['fixture'] },
      provenance: { original_anchor: 'fixture', original_hash: null, history: [] },
      locales: { ko: { title: 'Fixture', summary: 'Fixture', tense: 'past' },
        en: { title: 'Fixture', summary: 'Fixture', tense: 'present' } },
      content: [{ kind: 'paragraph', anchor: 'fixture', text: { ko: 'fixture', en: 'fixture' } }], data: {} };
    const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
      : value !== null && typeof value === 'object'
        ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
        : JSON.stringify(value);
    // This approval comes from the authored fixture, never a runtime head query.
    const expectedSemanticSha256 = createHash('sha256').update(canonical(document)).digest('hex');
    const bytes = Buffer.from('archive bytes, not the current document');
    const expectedSha256 = createHash('sha256').update(bytes).digest('hex');
    db.prepare('INSERT INTO source_file VALUES(?,?,?,?,?,?)').run(1, 'source', 'application/json', expectedSha256, bytes.length, bytes);
    const files = [{ source_id: 1, logical_path: 'source', corpus_kind: 'current', content_policy: 'local-corpus', document }];
    const insert = tables => {
      for (const [table, rows] of Object.entries(tables)) for (const row of rows) {
        const columns = Object.keys(row);
        db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`).run(...columns.map(key => row[key]));
      }
    };
    insert({ source_record: flattenJson(document).map(row => ({ source_id: 1, ...row })) });
    insert(mapTextCorpusDocuments({ files }));
    insert(mapTextData({ files, bundle: { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: { persons: [] } }, ...files] } }));
    db.exec(`CREATE TABLE document_head(source_id INTEGER,revision_id TEXT);
      CREATE TABLE document_revision(source_id INTEGER,revision_id TEXT,parent_revision TEXT,semantic_sha256 TEXT,algorithm TEXT);
      CREATE TABLE document_revision_seal(revision_id TEXT);
      INSERT INTO document_head VALUES(1,'successor');
      INSERT INTO document_revision_seal VALUES('successor');`);
    db.prepare('INSERT INTO document_revision VALUES(1,?,?,?,?)').run('successor', 'original', expectedSemanticSha256, 'typed-envelope-v1');
    const pin = { logicalPath: 'source', expectedSha256, expectedSemanticSha256 };
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu);
      return db.prepare(sql);
    } };
    assert.deepEqual(readEvidenceDocumentReference(guarded, pin).document, document);
    assert.equal(readEvidenceDocumentReference(guarded, pin).sourceSha256, expectedSha256);
    assert.equal(readDocument(db, { documentId: document.id, corpusKind: 'current' }), null);
    for (const semantic of [undefined, '0'.repeat(64)]) {
      assert.throws(() => readEvidenceDocumentReference(guarded, { ...pin, expectedSemanticSha256: semantic }), { code: 'E_REFERENCE_STALE' });
    }
    assert.throws(() => readEvidenceDocumentReference(guarded, { ...pin, expectedSha256: '0'.repeat(64) }), { code: 'E_REFERENCE_SOURCE_HASH' });
    db.exec("UPDATE document_revision SET algorithm='unknown'");
    assert.throws(() => readEvidenceDocumentReference(guarded, pin), { code: 'E_REFERENCE_STALE' });
    db.exec("UPDATE document_revision SET algorithm='typed-envelope-v1'; BEGIN; UPDATE text_document_slot SET text='uncommitted drift'");
    assert.throws(() => readEvidenceDocumentReference(guarded, pin), { code: 'E_REFERENCE_INTEGRITY' });
    db.exec('ROLLBACK; DELETE FROM document_revision_seal');
    assert.throws(() => readEvidenceDocumentReference(guarded, pin), { code: 'E_REFERENCE_AUTHORITY' });
  } finally { db.close(); }
});

test('actual unchanged typed documents resolve source pins without archive reads', {
  skip: !process.env.EVIDENCE_DOCUMENT_DB,
}, () => {
  const db = openReadOnly(process.env.EVIDENCE_DOCUMENT_DB);
  try {
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu);
      return db.prepare(sql);
    } };
    const sources = db.prepare(`SELECT s.logical_path,s.sha256 FROM source_file s
      JOIN document_head h USING(source_id) ORDER BY s.source_id`).all();
    assert.equal(sources.length, 99);
    for (const source of sources) {
      const pin = { logicalPath: source.logical_path, expectedSha256: source.sha256 };
      const result = readEvidenceDocumentReference(guarded, pin);
      assert.ok(result.document.id);
      assert.equal(result.sourceSha256, source.sha256);
      assert.throws(() => readEvidenceDocumentReference(guarded, { ...pin, expectedSha256: '0'.repeat(64) }),
        { code: 'E_REFERENCE_SOURCE_HASH' });
    }
    assert.throws(() => readEvidenceDocumentReference(guarded, {
      logicalPath: 'missing', expectedSha256: '0'.repeat(64),
    }), { code: 'E_REFERENCE_AUTHORITY' });
  } finally { db.close(); }
});
