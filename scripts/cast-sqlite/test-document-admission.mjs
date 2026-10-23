import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { applySchema } from './db.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { mapTextData } from './text-data.mjs';
import { initializeDocumentAuthority, editDocumentOnConnection } from './document-edit.mjs';
import { readDocument, listDocuments } from './document-read.mjs';
import { recordPublicationReview } from './document-admission.mjs';
import { openReadOnly } from './db.mjs';

const selection = { documentId: 'fixture', corpusKind: 'current', domain: 'technology' };

test('actual authority public document set exactly matches all stored admission identities', {
  skip: !process.env.EVIDENCE_DOCUMENT_DB,
}, () => {
  const db = openReadOnly(process.env.EVIDENCE_DOCUMENT_DB);
  try {
    const admitted = db.prepare(`SELECT a.source_id
      FROM document_publication_admission a JOIN document_head h USING(source_id,revision_id)
      ORDER BY a.source_id`).all();
    const published = listDocuments(db, { corpusKind: 'current' });
    assert.equal(admitted.length, 80);
    assert.deepEqual(published.map(row => row.source_id).sort((a, b) => a - b), admitted.map(row => row.source_id));
    for (const row of published) {
      const document = readDocument(db, { documentId: row.document_id, domain: row.domain, corpusKind: 'current' });
      const expected = JSON.parse(readFileSync(new URL('../../' + row.logical_path, import.meta.url)));
      assert.deepEqual(document, expected, row.logical_path);
    }
    const publicIds = new Set(admitted.map(row => row.source_id));
    const internal = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
    assert.ok(internal.length > published.length);
    for (const row of internal.filter(row => !publicIds.has(row.source_id))) {
      assert.equal(readDocument(db, { documentId: row.document_id, domain: row.domain,
        corpusKind: 'current' }), null, row.logical_path);
    }
  } finally { db.close(); }
});
function fixture(t, status = 'approved', actual) {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  t.after(() => db.close());
  applySchema(db);
  const document = actual?.document ?? { version: 1, domain: 'technology', id: 'fixture', slug: 'Fixture', status,
    tense: { ko: 'present', en: 'present' }, source: { kind: 'observed', refs: ['fixture'] },
    provenance: { original_anchor: 'fixture', original_hash: null, history: [] },
    locales: { ko: { title: 'Title', summary: 'Summary', tense: 'present' }, en: { title: 'Title', summary: 'Summary', tense: 'present' } },
    content: [{ kind: 'paragraph', anchor: 'stable', text: { ko: 'before', en: 'before' } }], data: { constraint: 'fixture' } };
  const bytes = actual?.bytes ?? Buffer.from('not JSON');
  const path = actual?.path ?? 'lore/nonexistent.json';
  db.prepare('INSERT INTO source_file VALUES(?,?,?,?,?,?)').run(1, path, 'application/json', sha256(bytes), bytes.length, bytes);
  const insert = (table, rows) => {
    if (!rows.length) return;
    const fields = Object.keys(rows[0]);
    const statement = db.prepare(`INSERT INTO ${table}(${fields}) VALUES(${fields.map(() => '?')})`);
    for (const row of rows) statement.run(...fields.map((field) => row[field]));
  };
  insert('source_record', flattenJson(document).map((row) => ({ source_id: 1, ...row })));
  const files = [{ source_id: 1, document, logical_path: path, corpus_kind: 'current', content_policy: 'local-corpus' }];
  for (const [table, rows] of Object.entries(mapTextCorpusDocuments({ files }))) insert(table, rows);
  const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: { persons: [] } }, ...files] };
  for (const [table, rows] of Object.entries(mapTextData({ files, bundle }))) insert(table, rows);
  const [{ revision }] = initializeDocumentAuthority(db, { actor: 'test', reason: 'validated import', validatedSourceIds: [1] });
  return { db, revision, path, bytes, document };
}

// SQL fixtures exercise storage/read invariants, NOT the production authority boundary.
function sqlAdmission(f, receipt = ['receipt-reference', 'b'.repeat(64), 'owner-reference']) {
  f.db.exec(readFileSync(new URL('./document-admission.sql', import.meta.url), 'utf8'));
  const { semantic_sha256 } = f.db.prepare('SELECT semantic_sha256 FROM document_revision WHERE revision_id=?').get(f.revision);
  const values = [1, f.revision, f.path, sha256(f.bytes), semantic_sha256, 'current-reviewed', 'approved-exact-review', ...receipt, '2026-10-20T00:00:00Z'];
  f.db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(...values);
  return values;
}
const safe = (db) => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu);
  return db.prepare(sql);
} });

test('synthetic and cloned reviews cannot cross production authentication boundary', async (t) => {
  const f = fixture(t);
  const fake = { schema: 'seoul-document-publication-eligibility.v1', complete: true, semanticReview: 'reviewed',
    documents: [{ sourcePath: f.path, currentSha256: sha256(f.bytes), eligible: true, classification: 'current-reviewed',
      reason: 'approved-exact-review', receipt: { path: 'reference', sha256: 'b'.repeat(64), approvalRef: 'owner' } }] };
  for (const review of [null, fake, structuredClone(fake), Object.freeze(fake)]) {
    await assert.rejects(recordPublicationReview(f.db, review), { code: 'E_PUBLICATION_REVIEW_AUTHORITY' });
  }
  assert.equal(f.db.prepare("SELECT 1 FROM sqlite_schema WHERE name='document_publication_admission'").get(), undefined);
  assert.throws(() => readDocument(f.db, selection), { code: 'E_DOCUMENT_SCHEMA_GAP' });
});

test('SQL fixture: exact revision and receipt immutable; reader never parses bytes or files', (t) => {
  const f = fixture(t);
  const values = sqlAdmission(f);
  assert.deepEqual(readDocument(safe(f.db), selection), f.document);
  assert.equal(listDocuments(safe(f.db), { corpusKind: 'current' }).length, 1);
  assert.equal(f.db.prepare('SELECT public_admission FROM document_head').get().public_admission, 'unrecorded');
  assert.equal(f.db.prepare('SELECT receipt_sha256 FROM document_publication_admission').get().receipt_sha256, values[8]);
  assert.throws(() => f.db.exec("UPDATE document_publication_admission SET receipt_path='forged'"), /immutable publication admission/u);
  assert.throws(() => f.db.exec('DELETE FROM document_publication_admission'), /immutable publication admission/u);
  assert.throws(() => f.db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(...values), /UNIQUE/u);
  f.db.exec("UPDATE text_document_locale SET summary='drift' WHERE locale='ko'");
  assert.equal(readDocument(safe(f.db), selection), null);
  assert.deepEqual(listDocuments(safe(f.db), { corpusKind: 'current' }), []);
});

test('SQL fixture: authenticated draft admission is distinct from private/excluded/noncurrent', (t) => {
  const f = fixture(t, 'draft');
  sqlAdmission(f);
  assert.equal(readDocument(safe(f.db), selection).status, 'draft');
  f.db.prepare('INSERT INTO excluded_source VALUES(?,?,?,?)').run(f.path, 'c'.repeat(64), 0, 'private-soul-historical-motif');
  assert.equal(readDocument(safe(f.db), selection), null);
  assert.deepEqual(listDocuments(safe(f.db), { corpusKind: 'current' }), []);
  f.db.exec('DELETE FROM excluded_source');
  f.db.exec("UPDATE text_document SET status='excluded'");
  assert.equal(readDocument(safe(f.db), selection), null);
  assert.deepEqual(listDocuments(safe(f.db), { corpusKind: 'historical' }), []);
});

test('SQL fixture: each edited head needs its own exact admission and a later edit invalidates it', (t) => {
  const f = fixture(t);
  const values = sqlAdmission(f);
  const edited = editDocumentOnConnection(f.db, { ...selection, expectedRevision: f.revision, actor: 'author', reason: 'edit',
    changes: [{ type: 'setText', nodeId: 'stable', slot: 'text/ko', value: 'after' }] });
  assert.equal(readDocument(safe(f.db), selection), null);
  const { semantic_sha256 } = f.db.prepare('SELECT semantic_sha256 FROM document_revision WHERE revision_id=?').get(edited.revision);
  values[1] = edited.revision;
  assert.throws(() => f.db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(...values), /publication snapshot mismatch/u);
  values[4] = semantic_sha256;
  // This explicit SQL fixture establishes storage/read behavior only. The
  // production import-review recorder still cannot authorize an edited head.
  values[7] = 'exact-successor-fixture'; values[8] = 'd'.repeat(64);
  f.db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(...values);
  assert.equal(readDocument(safe(f.db), selection).content[0].text.ko, 'after');
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_publication_admission').get().n, 2);
  editDocumentOnConnection(f.db, { ...selection, expectedRevision: edited.revision, actor: 'author', reason: 'later edit',
    changes: [{ type: 'setText', nodeId: 'stable', slot: 'text/ko', value: 'later' }] });
  assert.equal(readDocument(safe(f.db), selection), null);
  assert.deepEqual(listDocuments(safe(f.db), { corpusKind: 'current' }), []);
});

test('production authenticated review integration (explicit expensive opt-in)', { skip: process.env.DOCUMENT_ADMISSION_AUTHENTICATED !== '1' }, async (t) => {
  const { loadScopeInput } = await import('../check-seoul-scope.mjs');
  const { isAuthenticatedPublicationReview } = await import('../seoul-census.mjs');
  const { loadCategoryRegistry, registrationErrors } = await import('../category-registration.mjs');
  const root = new URL('../../', import.meta.url);
  const input = await loadScopeInput({ root: root.pathname, baselinePath: new URL('.omo/private/seoul-migration/baseline.json', root).pathname, mode: 'inspection' });
  const review = input.current.publicationReview;
  assert.equal(isAuthenticatedPublicationReview(review), true);
  assert.equal(review.complete, true);
  const registry = await loadCategoryRegistry(new URL('../category-registry.json', import.meta.url));
  let checked = 0;
  for (const decision of review.documents.filter((row) => row.eligible && row.classification === 'current-reviewed' && row.sourcePath.endsWith('.json'))) {
    const bytes = readFileSync(new URL(decision.sourcePath, root));
    const document = JSON.parse(bytes);
    if (document.domain !== 'technology' || !Array.isArray(document.content) || !document.id || registrationErrors(document, registry).length) continue;
    const f = fixture(t, document.status, { document, bytes, path: decision.sourcePath });
    assert.deepEqual(readDocument(f.db, { documentId: document.id, corpusKind: 'current', domain: document.domain, visibility: 'internal' }), document);
    await assert.rejects(recordPublicationReview(f.db, structuredClone(review)), { code: 'E_PUBLICATION_REVIEW_AUTHORITY' });
    assert.equal((await recordPublicationReview(f.db, review)).length, 1);
    assert.equal((await recordPublicationReview(f.db, review)).length, 1);
    assert.deepEqual(readDocument(safe(f.db), { documentId: document.id, corpusKind: 'current', domain: document.domain }), document);
    checked += 1;
    break;
  }
  assert.equal(checked, 1, 'at least one actual supported authenticated source must exercise recording');
});
