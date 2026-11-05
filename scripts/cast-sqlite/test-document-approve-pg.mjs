import test from 'node:test';
import assert from 'node:assert/strict';
import { createReader } from './db-pg.mjs';
import { readDocumentAsync } from './document-read.mjs';
import { approveDocumentsPgInTransaction } from './document-approve-pg.mjs';
import { editDocumentPgInTransaction, documentDigest } from './document-edit-pg.mjs';

// Runs against WIKI_APPROVE_TEST_PG (a wiki_owner-capable PostgreSQL with the wiki schema).
// Every case runs inside one transaction that is always rolled back, so no row survives.
const connectionString = process.env.WIKI_APPROVE_TEST_PG;
const ROLLBACK = Symbol('rollback');
const receipt = { receiptPath: 'scripts/approval-receipts/test.md', approvalReceiptSha256: 'a'.repeat(64), approvalRef: 'owner:test' };

async function inRollback(fn) {
  const reader = createReader({ connectionString, role: 'wiki_owner' });
  try { await reader.transaction(async tx => { await fn(tx); throw ROLLBACK; }); }
  catch (error) { if (error !== ROLLBACK) throw error; }
  finally { await reader.close(); }
}

async function draftOf(tx) {
  const row = await tx.get(`SELECT d.document_id,d.domain FROM wiki.text_document d JOIN wiki.document_node_identity i USING(source_id)
    JOIN wiki.text_document_slot s ON s.source_id=d.source_id AND s.node_pointer=i.node_pointer AND s.representation='string' AND s.json_pointer LIKE '%/text/ko'
    JOIN wiki.text_document_node n ON n.source_id=d.source_id AND n.json_pointer=i.node_pointer AND n.kind='paragraph'
    WHERE d.corpus_kind='current' ORDER BY d.source_id LIMIT 1`);
  const selection = { documentId: row.document_id, corpusKind: 'current', domain: row.domain, visibility: 'internal' };
  const node = await tx.get(`SELECT i.node_id,s.text FROM wiki.text_document d JOIN wiki.document_node_identity i USING(source_id)
    JOIN wiki.text_document_slot s ON s.source_id=d.source_id AND s.node_pointer=i.node_pointer AND s.json_pointer=i.node_pointer||'/text/ko'
    JOIN wiki.text_document_node n ON n.source_id=d.source_id AND n.json_pointer=i.node_pointer AND n.kind='paragraph'
    WHERE d.document_id=$1 AND d.corpus_kind='current' AND s.representation='string' AND s.text NOT LIKE '%<a id=%' LIMIT 1`, [row.document_id]);
  const head = await tx.get('SELECT h.revision_id FROM wiki.document_head h JOIN wiki.text_document d USING(source_id) WHERE d.document_id=$1 AND d.corpus_kind=\'current\'', [row.document_id]);
  const edit = await editDocumentPgInTransaction(tx, { ...selection, expectedRevision: head.revision_id, actor: 'test', reason: 'test-draft',
    changes: [{ type: 'setText', nodeId: node.node_id, slot: 'text/ko', value: node.text + ' 시험 문장.' }] });
  return { selection, edit, node };
}

test('approve seals a new revision over the draft, records admission, and a later edit still works', { skip: !connectionString }, async () => {
  await inRollback(async tx => {
    const { selection, edit, node } = await draftOf(tx);
    const entry = { documentId: selection.documentId, domain: selection.domain, draftRevision: edit.revision, draftSemanticSha256: edit.semanticSha256, approvedSemanticSha256: null };
    const [dry] = await approveDocumentsPgInTransaction(tx, { ...receipt, documents: [entry] }, { allowUnknownApprovedHash: true });
    assert.equal(dry.draftRevision, edit.revision);
    const head = await tx.get('SELECT h.revision_id,h.public_admission,r.parent_revision,r.semantic_sha256 FROM wiki.document_head h JOIN wiki.document_revision r USING(source_id,revision_id) JOIN wiki.document_revision_seal z USING(revision_id) WHERE h.source_id=$1', [dry.sourceId]);
    assert.equal(head.revision_id, dry.revision);
    assert.equal(head.parent_revision, edit.revision);
    assert.equal(head.public_admission, 'unrecorded');
    assert.equal(head.semantic_sha256, dry.approvedSemanticSha256);
    const document = await readDocumentAsync(tx, selection);
    assert.equal(document.status, 'approved');
    assert.equal(documentDigest(document), dry.approvedSemanticSha256);
    const admission = await tx.get('SELECT * FROM wiki.document_publication_admission WHERE source_id=$1 AND revision_id=$2', [dry.sourceId, dry.revision]);
    assert.equal(admission.semantic_sha256, dry.approvedSemanticSha256);
    assert.equal(admission.source_sha256, dry.sourceSha256);
    assert.equal(admission.approval_ref, 'owner:test');
    const later = await editDocumentPgInTransaction(tx, { ...selection, expectedRevision: dry.revision, actor: 'test', reason: 'test-after-approve',
      changes: [{ type: 'setText', nodeId: node.node_id, slot: 'text/ko', value: node.text + ' 후속 문장.' }] });
    assert.equal(later.previousRevision, dry.revision);
  });
});

test('a head changed after the approval file was written approves nothing and records no admission', { skip: !connectionString }, async () => {
  await inRollback(async tx => {
    const { selection, edit, node } = await draftOf(tx);
    const stale = { documentId: selection.documentId, domain: selection.domain, draftRevision: edit.revision, draftSemanticSha256: edit.semanticSha256, approvedSemanticSha256: null };
    const moved = await editDocumentPgInTransaction(tx, { ...selection, expectedRevision: edit.revision, actor: 'test', reason: 'test-move',
      changes: [{ type: 'setText', nodeId: node.node_id, slot: 'text/ko', value: node.text + ' 이동 문장.' }] });
    const count = async () => (await tx.get('SELECT count(*)::int n FROM wiki.document_publication_admission')).n;
    const before = await count();
    await tx.query('SAVEPOINT attempt');
    await assert.rejects(approveDocumentsPgInTransaction(tx, { ...receipt, documents: [stale] }, { allowUnknownApprovedHash: true }), { code: 'E_REVISION_CONFLICT' });
    await tx.query('ROLLBACK TO SAVEPOINT attempt');
    assert.equal(await count(), before);
    const head = await tx.get('SELECT h.revision_id FROM wiki.document_head h JOIN wiki.text_document d USING(source_id) WHERE d.document_id=$1 AND d.corpus_kind=\'current\'', [selection.documentId]);
    assert.equal(head.revision_id, moved.revision);
    assert.equal((await readDocumentAsync(tx, selection)).status, 'draft');
  });
});
