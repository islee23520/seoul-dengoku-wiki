import { createHash } from 'node:crypto';
import { readDocumentAsync } from './document-read.mjs';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
 : value !== null && typeof value === 'object'
  ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
const fail = code => { throw Object.assign(new Error(code), { code }); };

/** Async PostgreSQL twin of readEvidenceDocumentReference: identical identity
 * join, algorithm check, internal read and canonical semantic digest. Reads
 * run inside the caller-owned read-only transaction (wiki.* tables). */
export async function readEvidenceDocumentReferenceAsync(tx, sourceId) {
 const identities = await tx.all(`SELECT s.source_id,s.sha256,d.document_id,d.domain,d.corpus_kind,
    r.revision_id,r.parent_revision,r.semantic_sha256,r.algorithm
    FROM wiki.source_file s JOIN wiki.text_document d ON d.source_id = s.source_id
    JOIN wiki.document_head h ON h.source_id = s.source_id
    JOIN wiki.document_revision r ON r.source_id = h.source_id AND r.revision_id = h.revision_id
    JOIN wiki.document_revision_seal z ON z.revision_id = r.revision_id
    WHERE s.source_id = ?`, [sourceId]);
 if (identities.length !== 1) fail('E_REFERENCE_AUTHORITY');
 const identity = identities[0];
 if (identity.algorithm !== 'typed-envelope-v1') fail('E_REFERENCE_ALGORITHM');
 const document = await readDocumentAsync(tx, {
  documentId: identity.document_id, domain: identity.domain,
  corpusKind: identity.corpus_kind, visibility: 'internal'
 });
 const digest = createHash('sha256').update(canonical(document)).digest('hex');
 if (digest !== identity.semantic_sha256) fail('E_REFERENCE_INTEGRITY');
 return {
  sourceId: identity.source_id, revision: identity.revision_id,
  sourceSha256: identity.sha256, semanticSha256: digest, document
 };
}
