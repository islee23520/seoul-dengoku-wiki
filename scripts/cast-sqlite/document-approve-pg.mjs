import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createReader } from './db-pg.mjs';
import { readDocumentAsync } from './document-read.mjs';
import { recordRevision, documentDigest } from './document-edit-pg.mjs';

// Owner approval is granted only through a committed approval file (schema approved-gdd-canon.v1).
// Every listed document is approved in one PostgreSQL transaction; any failure rolls the whole batch back.
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const HEX = /^[a-f0-9]{64}$/;
const DRY_RUN = Symbol('dry-run');

export async function readApprovalFile(path, { root = process.cwd() } = {}) {
  const approval = JSON.parse(await readFile(path, 'utf8'));
  if (approval?.schema !== 'approved-gdd-canon.v1') fail('E_APPROVAL_FILE', 'schema approved-gdd-canon.v1 required');
  if (typeof approval.approvalRef !== 'string' || !approval.approvalRef.startsWith('owner:')) fail('E_APPROVAL_FILE', 'owner approvalRef required');
  if (typeof approval.receiptPath !== 'string' || !HEX.test(approval.approvalReceiptSha256 ?? '')) fail('E_APPROVAL_FILE', 'receipt path and SHA-256 required');
  const receipt = await readFile(new URL(approval.receiptPath, `file://${root.replace(/\/?$/, '/')}`));
  if (sha256(receipt) !== approval.approvalReceiptSha256) fail('E_APPROVAL_RECEIPT', 'receipt bytes differ from approvalReceiptSha256');
  if (!Array.isArray(approval.documents) || !approval.documents.length) fail('E_APPROVAL_FILE', 'nonempty documents required');
  for (const d of approval.documents) {
    if (typeof d.documentId !== 'string' || typeof d.domain !== 'string' || !HEX.test(d.draftRevision ?? '') || !HEX.test(d.draftSemanticSha256 ?? '')
      || (d.approvedSemanticSha256 !== null && !HEX.test(d.approvedSemanticSha256 ?? ''))) fail('E_APPROVAL_FILE', `invalid document entry ${d.documentId}`);
  }
  return approval;
}

/** Approves every document of the approval file inside the caller's transaction. */
export async function approveDocumentsPgInTransaction(tx, approval, { recordedAt = new Date().toISOString(), allowUnknownApprovedHash = false } = {}) {
  if (!tx.isTransaction) fail('E_DOCUMENT_DATABASE', 'leased PostgreSQL transaction required');
  const authority = await tx.get('SELECT version,sequence FROM wiki.document_authority WHERE singleton=1 FOR UPDATE');
  if (!authority || authority.version !== 2) fail('E_DOCUMENT_DATABASE', 'structural authority version 2 required');
  let sequence = authority.sequence;
  const reason = `approve:${approval.approvalRef}`;
  const results = [];
  for (const entry of approval.documents) {
    const selection = { documentId: entry.documentId, corpusKind: 'current', domain: entry.domain, visibility: 'internal' };
    const document = await readDocumentAsync(tx, selection);
    if (!document) fail('E_DOCUMENT_NOT_FOUND', entry.documentId);
    const sourceId = document.readMetadata.source_id;
    const head = await tx.get(`SELECT h.revision_id,r.semantic_sha256 FROM wiki.document_head h
      JOIN wiki.document_revision r USING(source_id,revision_id)
      JOIN wiki.document_revision_seal z USING(revision_id) WHERE h.source_id=$1 FOR UPDATE OF h`, [sourceId]);
    const current = documentDigest(document);
    if (!head || head.revision_id !== entry.draftRevision || current !== entry.draftSemanticSha256) fail('E_REVISION_CONFLICT', `${entry.documentId} head differs from the approval file`);
    if (current !== head.semantic_sha256) fail('E_DOCUMENT_INTEGRITY', `${entry.documentId} typed rows have drifted from their sealed head`);
    await tx.query("UPDATE wiki.text_document SET status='approved' WHERE source_id=$1", [sourceId]);
    const approvedSemanticSha256 = documentDigest(await readDocumentAsync(tx, selection));
    if (entry.approvedSemanticSha256 !== approvedSemanticSha256 && !(allowUnknownApprovedHash && entry.approvedSemanticSha256 === null)) {
      fail('E_DOCUMENT_EXPECTED_BODY', `${entry.documentId} approved digest differs from the approval file`);
    }
    sequence += 1;
    const revision = sha256(JSON.stringify(['typed-envelope-v1', sourceId, head.revision_id, approvedSemanticSha256, approval.approvalRef, reason]));
    await recordRevision(tx, { sourceId, revision, parent: head.revision_id, semanticSha256: approvedSemanticSha256, actor: approval.approvalRef, reason, sequence });
    // The head CHECK constraint admits only 'unrecorded'; publication admission is the immutable admission row below.
    const swapped = await tx.query(`UPDATE wiki.document_head SET revision_id=$1,public_admission='unrecorded'
      WHERE source_id=$2 AND revision_id=$3`, [revision, sourceId, head.revision_id]);
    if (swapped.rowCount !== 1) fail('E_REVISION_CONFLICT', `${entry.documentId} head compare-and-swap failed`);
    const source = await tx.get('SELECT logical_path,sha256 FROM wiki.source_file WHERE source_id=$1', [sourceId]);
    await tx.query(`INSERT INTO wiki.document_publication_admission
      (source_id,revision_id,source_path,source_sha256,semantic_sha256,classification,reason,receipt_path,receipt_sha256,approval_ref,recorded_at)
      VALUES($1,$2,$3,$4,$5,'current-reviewed','approved-exact-review',$6,$7,$8,$9)`,
      [sourceId, revision, source.logical_path, source.sha256, approvedSemanticSha256, approval.receiptPath, approval.approvalReceiptSha256, approval.approvalRef, recordedAt]);
    results.push({ documentId: entry.documentId, sourceId, draftRevision: head.revision_id, revision, approvedSemanticSha256,
      sourcePath: source.logical_path, sourceSha256: source.sha256 });
  }
  await tx.query('UPDATE wiki.document_authority SET sequence=$1 WHERE singleton=1', [sequence]);
  return results;
}

export async function approveDocumentsPgOnConnection(reader, approval, { dryRun = false, ...options } = {}) {
  let results;
  try {
    await reader.transaction(async tx => {
      results = await approveDocumentsPgInTransaction(tx, approval, { ...options, allowUnknownApprovedHash: dryRun });
      if (dryRun) throw DRY_RUN;
    });
  } catch (error) {
    if (error !== DRY_RUN) {
      if (error.code === '40001' || error.code === '40P01') fail('E_REVISION_CONFLICT', 'concurrent authoring transaction; refresh the heads');
      throw error;
    }
  }
  return { dryRun, approvalRef: approval.approvalRef, documents: results };
}

export async function approveDocumentsPg({ connectionString = process.env.WIKI_AUTHORING_PG ?? process.env.WIKI_DOCUMENT_PG, approvalPath, dryRun = false }) {
  if (!connectionString) fail('E_ARGUMENTS', 'explicit PostgreSQL connection required');
  const approval = await readApprovalFile(approvalPath);
  // Publication admission is an owner act: only wiki_owner may insert admission rows.
  const reader = createReader({ connectionString, role: 'wiki_owner' });
  try { return await approveDocumentsPgOnConnection(reader, approval, { dryRun }); }
  finally { await reader.close(); }
}
