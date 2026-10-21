import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { openReadOnly } from './db.mjs';
import { readEvidenceDocumentReference } from './evidence-document-reference.mjs';

test('reference arguments reject before touching storage', () => {
  const db = { prepare() { throw new Error('unexpected storage access'); } };
  for (const value of [undefined, {}, { logicalPath: 'source', expectedSha256: 'bad' }]) {
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
