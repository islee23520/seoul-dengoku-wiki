import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAuthenticatedPublicationReview } from '../seoul-census.mjs';
import { loadCategoryRegistry, registrationErrors } from '../category-registration.mjs';
import { withTransaction } from './db.mjs';
import { listDocuments, readDocument } from './document-read.mjs';

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);
const digest = (document) => createHash('sha256').update(canonical(document)).digest('hex');

/** Only the production closed-pin loader can mint review authority. No receipt bodies
 * are copied. Initial imports rely on the authority bootstrap's completeness attestation;
 * source_file SHA cannot authenticate a later typed edit, even when it has a new head. */
export async function recordPublicationReview(db, review) {
  if (!isAuthenticatedPublicationReview(review)) fail('E_PUBLICATION_REVIEW_AUTHORITY', 'authenticated review required');
  if (review.complete !== true || review.semanticReview !== 'reviewed') fail('E_PUBLICATION_REVIEW_PENDING', 'complete reviewed result required');
  const registry = await loadCategoryRegistry(new URL('../category-registry.json', import.meta.url));
  return withTransaction(db, () => {
    const candidates = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
    const records = [];
    for (const identity of candidates) {
      if (identity.excluded || identity.status === 'excluded') continue;
      const decisions = review.documents.filter((row) => row.sourcePath === identity.logical_path);
      if (decisions.length !== 1) fail('E_REVIEW_COVERAGE', identity.logical_path);
      const [decision] = decisions;
      if (decision.currentSha256 !== identity.sha256) fail('E_REVIEW_HASH', identity.logical_path);
      if (decision.eligible !== true || decision.classification !== 'current-reviewed'
        || decision.reason !== 'approved-exact-review' || !decision.receipt) continue;
      const document = readDocument(db, { documentId: identity.document_id, corpusKind: 'current', domain: identity.domain, visibility: 'internal' });
      if (document.status !== 'approved' && registrationErrors(document, registry).length) continue;
      const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
        JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(identity.source_id);
      if (!head || head.parent_revision !== null || head.algorithm !== 'typed-envelope-v1'
        || head.semantic_sha256 !== digest(document)) fail('E_DOCUMENT_REVIEW_SNAPSHOT', identity.logical_path);
      records.push([identity.source_id, head.revision_id, identity.logical_path, identity.sha256, head.semantic_sha256,
        decision.classification, decision.reason, decision.receipt.path, decision.receipt.sha256, decision.receipt.approvalRef]);
    }
    if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='document_publication_admission'").get()) {
      db.exec(readFileSync(new URL('./document-admission.sql', import.meta.url), 'utf8'));
    }
    for (const record of records) {
      const existing = db.prepare('SELECT * FROM document_publication_admission WHERE source_id=? AND revision_id=?').get(record[0], record[1]);
      if (existing) {
        const fields = ['source_id', 'revision_id', 'source_path', 'source_sha256', 'semantic_sha256', 'classification', 'reason', 'receipt_path', 'receipt_sha256', 'approval_ref'];
        if (fields.some((field, i) => existing[field] !== record[i])) fail('E_DOCUMENT_ADMISSION_CONFLICT', record[2]);
      } else db.prepare('INSERT INTO document_publication_admission VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...record, new Date().toISOString());
    }
    return records.map(([sourceId, revision]) => ({ sourceId, revision }));
  });
}
