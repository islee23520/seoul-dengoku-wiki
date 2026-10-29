import { createHash } from 'node:crypto';
import { readDocument } from './document-read.mjs';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const fail = code => { throw Object.assign(new Error(code), { code }); };

/** Resolve a logical path to its current (head) typed revision.
 * Logical paths are exact database identities, never filesystem paths.
 */
export function readEvidenceDocumentReference(db, { logicalPath } = {}) {
  if (typeof logicalPath !== 'string' || !logicalPath) fail('E_REFERENCE_ARGUMENT');
  const identities = db.prepare(`SELECT s.source_id,s.sha256,d.document_id,d.domain,d.corpus_kind,
    r.revision_id,r.parent_revision,r.semantic_sha256,r.algorithm
    FROM source_file s JOIN text_document d USING(source_id)
    JOIN document_head h USING(source_id)
    JOIN document_revision r ON r.source_id=h.source_id AND r.revision_id=h.revision_id
    JOIN document_revision_seal z ON z.revision_id=r.revision_id
    WHERE s.logical_path=?`).all(logicalPath);
  if (identities.length !== 1) fail('E_REFERENCE_AUTHORITY');
  const identity = identities[0];
  if (identity.algorithm !== 'typed-envelope-v1') fail('E_REFERENCE_ALGORITHM');
  const document = readDocument(db, { documentId: identity.document_id, domain: identity.domain,
    corpusKind: identity.corpus_kind, visibility: 'internal' });
  const digest = createHash('sha256').update(canonical(document)).digest('hex');
  if (digest !== identity.semantic_sha256) fail('E_REFERENCE_INTEGRITY');
  return { sourceId: identity.source_id, revision: identity.revision_id,
    sourceSha256: identity.sha256, semanticSha256: digest, document };
}
