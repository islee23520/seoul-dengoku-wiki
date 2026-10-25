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
import { recordPublicationReview, loadExactSuccessorApproval, recordExactSuccessorAdmissions,
  migrateExactSuccessorAdmission } from './document-admission.mjs';
import { reviewCurrentAuthority } from './current-authority.mjs';
import { initializeCatalogMetadata } from './catalog-metadata.mjs';
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
    assert.deepEqual(published.map(row => row.source_id).sort((a, b) => a - b), admitted.map(row => row.source_id));
    for (const row of published) {
      const document = readDocument(db, { documentId: row.document_id, domain: row.domain, corpusKind: 'current' });
      assert.ok(document, row.logical_path);
    }
    const publicIds = new Set(admitted.map(row => row.source_id));
    const internal = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
    assert.ok(internal.length >= published.length);
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
  initializeCatalogMetadata(db, { schemaSql: readFileSync(new URL('./catalog-metadata.sql', import.meta.url), 'utf8'),
    actor: 'fixture', reason: 'synthetic registry', documents: [
      { logicalPath: 'scripts/category-registry.json', sourceSha256: 'a'.repeat(64), document: { categories: [
        { id: 'technology', label: 'fixture', summary: '', requiredKinds: ['paragraph'] }] } },
      { logicalPath: 'scripts/official-seoul-lines.json', sourceSha256: 'b'.repeat(64), document: {
        schema: 'seoul-official-line-style.v1', source: '', capturedAt: '', note: '', lines: {}, stations: {} } },
      { logicalPath: 'data/update-history.json', sourceSha256: 'c'.repeat(64), document: { schema: 'seoul-wiki-update-history.v1', updates: [] } },
    ] });
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

// A separate module instance with a synthetic, closed byte pin exercises the trusted
// loader without exporting a production authority-minting seam or editing real approval.
async function syntheticApproval(documents, status = 'approved-for-public-document-api', legacyReview) {
  const bytes = Buffer.from(JSON.stringify({ kind: 'owner-exact-public-article-admission', status,
    session: 'synthetic', questionCall: 'synthetic-question', actualAnswer: 'synthetic-public-answer', documents }));
  const url = new URL('./document-admission.mjs', import.meta.url);
  const code = readFileSync(url, 'utf8')
    .replace(/from '(\.[^']+)'/gu, (_, path) => `from '${new URL(path, url).href}'`)
    .replace("import('../seoul-census.mjs')", legacyReview
      ? "Promise.resolve({ isAuthenticatedPublicationReview: review => review.syntheticLegacy === true })"
      : `import('${new URL('../seoul-census.mjs', url).href}')`)
    .replace("await loadCategoryRegistry(new URL('../category-registry.json', import.meta.url))",
      legacyReview ? 'readCatalogMetadataDocument(db, CATEGORY_REGISTRY_PATH)' : "await loadCategoryRegistry(new URL('../category-registry.json', import.meta.url))")
    .replace("'b7ec1c7f306b6aa3f2297d028d89628cb619781d412299a356e5be0060b5768e'", JSON.stringify(sha256(bytes)))
    .replace('readFileSync(new URL(`../../${approvalPath}`, import.meta.url))', `Buffer.from('${bytes.toString('base64')}', 'base64')`)
    .replaceAll("new URL('./document-admission.sql', import.meta.url)", JSON.stringify(new URL('./document-admission.sql', url).pathname))
    .replaceAll("new URL('../category-registry.json', import.meta.url)", `new URL('${new URL('../category-registry.json', url).href}')`);
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return { module, decision: module.loadExactSuccessorApproval() };
}

function successor(f) {
  sqlAdmission(f);
  const edited = editDocumentOnConnection(f.db, { ...selection, expectedRevision: f.revision, actor: 'author', reason: 'edit',
    changes: [{ type: 'setText', nodeId: 'stable', slot: 'text/ko', value: 'successor' }] });
  f.db.exec(`CREATE TABLE article_route(route TEXT PRIMARY KEY,source_id INTEGER,source_path TEXT,
    derivation TEXT,derivation_json TEXT) STRICT`);
  f.db.prepare('INSERT INTO article_route VALUES(?,?,?,?,?)').run('/world/Fixture', 1, f.path, 'typed-envelope',
    JSON.stringify({ documentId: selection.documentId, domain: selection.domain, envelopeSlug: f.document.slug }));
  return { sourcePath: f.path, ...selection, route: '/world/Fixture', revisionId: edited.revision,
    parentRevision: f.revision, sourceSha256: sha256(f.bytes), locales: ['ko', 'en'],
    semanticSha256: f.db.prepare('SELECT semantic_sha256 FROM document_revision WHERE revision_id=?').get(edited.revision).semantic_sha256 };
}

test('fixed production loader brands only its frozen decision; caller copies and draft decisions fail', async t => {
  const f = fixture(t);
  const decision = loadExactSuccessorApproval();
  assert.ok(Object.isFrozen(decision.documents[0].locales));
  for (const forged of [null, {}, structuredClone(decision), Object.freeze({ ...decision })]) {
    await assert.rejects(recordExactSuccessorAdmissions(f.db, forged), { code: 'E_DOCUMENT_ADMISSION_AUTHORITY' });
  }
  await assert.rejects(syntheticApproval([], 'approved-for-typed-draft-application'), { code: 'E_DOCUMENT_ADMISSION_AUTHORITY' });
});

test('authenticated synthetic successor preserves history, is idempotent and expires on the next edit', async t => {
  const f = fixture(t, 'draft');
  const target = successor(f);
  const { module, decision } = await syntheticApproval([target]);
  const history = f.db.prepare('SELECT * FROM document_revision ORDER BY revision_id').all();
  assert.equal((await module.recordExactSuccessorAdmissions(f.db, decision))[0].result, 'inserted');
  assert.equal((await module.recordExactSuccessorAdmissions(f.db, decision))[0].result, 'idempotent');
  assert.equal(readDocument(f.db, selection).content[0].text.ko, 'successor');
  assert.deepEqual(f.db.prepare('SELECT * FROM document_revision ORDER BY revision_id').all(), history);
  f.db.exec('PRAGMA query_only=ON');
  assert.equal(reviewCurrentAuthority(f.db).stored_current_publication_admissions, 1);
  f.db.exec('PRAGMA query_only=OFF');
  f.db.exec("UPDATE text_document_locale SET summary='drift' WHERE locale='ko'; PRAGMA query_only=ON");
  assert.throws(() => reviewCurrentAuthority(f.db), { code: 'E_AUTHORITY_HEAD' });
  f.db.exec("PRAGMA query_only=OFF; UPDATE text_document_locale SET summary='Summary' WHERE locale='ko'");
  const authoritySql = { prepare(sql) {
    const statement = f.db.prepare(sql);
    if (!sql.includes('r.semantic_sha256 AS revision_sha256')) return statement;
    return { all: () => statement.all().map(row => ({ ...row, source_sha256: 'f'.repeat(64) })) };
  } };
  f.db.exec('PRAGMA query_only=ON');
  assert.throws(() => reviewCurrentAuthority(authoritySql), { code: 'E_AUTHORITY_ADMISSION' });
  f.db.exec('PRAGMA query_only=OFF');
  const conflict = await syntheticApproval([{ ...target, extraReceiptEvidence: true }]);
  const values = f.db.prepare('SELECT * FROM document_publication_admission WHERE revision_id=?').get(target.revisionId);
  assert.equal(values.receipt_sha256, decision.receiptSha256);
  await assert.rejects(conflict.module.recordExactSuccessorAdmissions(f.db, conflict.decision), { code: 'E_DOCUMENT_ADMISSION_CONFLICT' });
  editDocumentOnConnection(f.db, { ...selection, expectedRevision: target.revisionId, actor: 'author', reason: 'later',
    changes: [{ type: 'setText', nodeId: 'stable', slot: 'text/ko', value: 'later' }] });
  assert.equal(readDocument(f.db, selection), null);
  await assert.rejects(conflict.module.recordExactSuccessorAdmissions(f.db, conflict.decision), { code: 'E_DOCUMENT_ADMISSION_SNAPSHOT' });
});

test('authenticated synthetic target and mixed-batch failures roll back every admission', async t => {
  const mutations = [
    row => ({ ...row, revisionId: 'f'.repeat(64) }), row => ({ ...row, parentRevision: 'f'.repeat(64) }),
    row => ({ ...row, semanticSha256: 'f'.repeat(64) }), row => ({ ...row, sourceSha256: 'f'.repeat(64) }),
    row => ({ ...row, sourcePath: '.omo/private/fixture.json' }), row => ({ ...row, corpusKind: 'historical' }),
    row => ({ ...row, route: '/world/Other' }), row => ({ ...row, locales: ['ko'] }),
  ];
  for (const mutate of mutations) {
    const f = fixture(t);
    const target = successor(f);
    const { module, decision } = await syntheticApproval([mutate(target)]);
    await assert.rejects(module.recordExactSuccessorAdmissions(f.db, decision), /E_DOCUMENT_ADMISSION_/u);
    assert.equal(f.db.prepare('SELECT count(*) n FROM document_publication_admission').get().n, 1);
  }
  const f = fixture(t);
  const target = successor(f);
  const { module, decision } = await syntheticApproval([target, { ...target, sourcePath: 'missing.json' }]);
  await assert.rejects(module.recordExactSuccessorAdmissions(f.db, decision), { code: 'E_DOCUMENT_ADMISSION_TARGET' });
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_publication_admission').get().n, 1);
});

test('authenticated synthetic recorder rejects excluded, missing-seal, duplicate-route and typed drift targets', async t => {
  for (const damage of [
    f => f.db.prepare('INSERT INTO excluded_source VALUES(?,?,?,?)').run(f.path, 'a'.repeat(64), 0, 'private-soul-historical-motif'),
    f => { f.db.exec('DROP TRIGGER document_revision_seal_no_delete'); f.db.exec('DELETE FROM document_revision_seal'); },
    f => f.db.exec("INSERT INTO article_route SELECT '/world/Other',source_id,source_path,derivation,derivation_json FROM article_route"),
    f => f.db.exec("UPDATE text_document_locale SET summary='drift' WHERE locale='ko'"),
  ]) {
    const f = fixture(t);
    const target = successor(f);
    damage(f);
    const { module, decision } = await syntheticApproval([target]);
    await assert.rejects(module.recordExactSuccessorAdmissions(f.db, decision), /E_DOCUMENT_ADMISSION_/u);
    assert.equal(f.db.prepare('SELECT count(*) n FROM document_publication_admission').get().n, 1);
  }
});

test('migration replaces only a known legacy insert trigger and rejects unexpected schema', t => {
  const f = fixture(t);
  sqlAdmission(f);
  const triggers = f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='trigger' ORDER BY name").all();
  const current = triggers.find(row => row.name === 'document_publication_admission_insert').sql;
  f.db.exec('DROP TRIGGER document_publication_admission_insert');
  f.db.exec(current.replace("AND r.algorithm=", "AND r.parent_revision IS NULL AND r.algorithm="));
  assert.equal(migrateExactSuccessorAdmission(f.db), true);
  assert.equal(migrateExactSuccessorAdmission(f.db), false);
  assert.deepEqual(f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='trigger' ORDER BY name").all(), triggers);
  f.db.exec('DROP TRIGGER document_publication_admission_insert');
  f.db.exec(current.replace("AND r.algorithm='typed-envelope-v1'", 'AND 1=1'));
  assert.throws(() => migrateExactSuccessorAdmission(f.db), { code: 'E_DOCUMENT_ADMISSION_SCHEMA' });
});

test('legacy import review still cannot authorize a sealed successor', async t => {
  const f = fixture(t);
  const target = successor(f);
  const { module } = await syntheticApproval([target], 'approved-for-public-document-api', true);
  const review = { syntheticLegacy: true, complete: true, semanticReview: 'reviewed', documents: [{
    sourcePath: f.path, currentSha256: sha256(f.bytes), eligible: true, classification: 'current-reviewed',
    reason: 'approved-exact-review', receipt: { path: 'legacy', sha256: 'b'.repeat(64), approvalRef: 'fixture' } }] };
  await assert.rejects(module.recordPublicationReview(f.db, review), { code: 'E_DOCUMENT_REVIEW_SNAPSHOT' });
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_publication_admission').get().n, 1);
});

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
