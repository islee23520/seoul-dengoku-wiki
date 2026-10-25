import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
import { readDocumentRevision } from '../cast-sqlite/document-edit.mjs';
import { orderDocumentKeys, preserveReceiptOrder } from '../cast-sqlite/document-key-order.mjs';
import { PUBLICATION_EXACT_BODIES, PUBLICATION_SUCCESSOR_HEADS, ATLAS_DRAFT_APPROVAL,
  authenticateExactBodyApproval, authenticateAtlasDraftApproval, authenticateFactionSuccessorApproval } from './reference-successor-approval.mjs';

const canonicalBody = value => Array.isArray(value) ? `[${value.map(canonicalBody).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalBody(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const bodyDigest = value => createHash('sha256').update(canonicalBody(value)).digest('hex');

export function verifyReferenceSuccessorChain(db, reference, pin) {
  const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(reference.sourceId);
  const parent = head && db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
    WHERE r.revision_id=?`).get(head.parent_revision);
  if (reference.revision !== pin.revision || reference.semanticSha256 !== pin.semanticSha256
    || reference.sourceSha256 !== pin.sourceSha256 || !head || head.revision_id !== pin.revision
    || head.algorithm !== 'typed-envelope-v1' || head.semantic_sha256 !== pin.semanticSha256
    || parent?.source_id !== reference.sourceId || parent.algorithm !== 'typed-envelope-v1'
    || parent.sequence >= head.sequence
    || (pin.predecessor !== undefined && head.parent_revision !== pin.predecessor)
    || (pin.predecessorSemantic !== undefined && parent.semantic_sha256 !== pin.predecessorSemantic)
    || bodyDigest(['typed-envelope-v1', reference.sourceId, head.parent_revision, head.semantic_sha256, head.actor, head.reason]) !== pin.revision)
    throw Error('E_REFERENCE_SUCCESSOR_CHAIN');
}

export function verifyReferenceSuccessorDelta({ predecessor, current, changes }) {
  const expected = structuredClone(predecessor);
  if (changes === undefined) {
    expected.data.atlas.additional_people.K1003.national_state_id = 'S02';
    expected.data.atlas.additional_people.K1008.national_state_id = 'S02';
    expected.status = 'draft';
  } else {
    for (const change of changes) {
      const locale = change.slot.slice('text/'.length);
      const text = expected.content.find(node => node.anchor === change.nodeId)?.text;
      if (!text || typeof text[locale] !== 'string' || text[locale].split(change.before).length !== 2)
        throw Error('E_REFERENCE_SUCCESSOR_DELTA');
      text[locale] = text[locale].replace(change.before, change.after);
    }
  }
  if (!isDeepStrictEqual(expected, current)) throw Error('E_REFERENCE_SUCCESSOR_DELTA');
}

export const S08_WORDING_REVISION = 'e6068bd3321de8b142db54adb8f92501296cf269b75682191596aa8c349faa4b';

function readApprovedS08Wording(db, expectedSha256) {
  const bytes = readFileSync(new URL('../approved-s08-article-wording-20261024.json', import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== '80d131f88ce5b5441afc22912d7607fec2a5a92aec387e598fb208e733a22040')
    throw Error('E_S08_WORDING_APPROVAL');
  const approval = JSON.parse(bytes);
  const pin = PUBLICATION_SUCCESSOR_HEADS['lore/factions/Sixteen-States.json'];
  if (approval.kind !== 'owner-exact-s08-article-draft-approval' || approval.status !== 'approved-for-typed-draft-application'
    || approval.actualAnswer !== '기사 S08 문장: 시설 한정으로 수정 (Recommended)'
    || approval.predecessor !== pin.revision || approval.revision !== S08_WORDING_REVISION || expectedSha256 !== pin.sourceSha256)
    throw Error('E_S08_WORDING_APPROVAL');
  const reference = readEvidenceDocumentReference(db, { logicalPath: 'lore/factions/Sixteen-States.json', expectedSha256,
    expectedSemanticSha256: approval.semanticSha256 });
  verifyReferenceSuccessorChain(db, reference, { ...pin, revision: approval.revision,
    semanticSha256: approval.semanticSha256, predecessor: pin.revision, predecessorSemantic: pin.semanticSha256 });
  const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(reference.sourceId);
  const parent = db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
    WHERE r.revision_id=?`).get(pin.revision);
  if (reference.sourceId !== 84 || reference.revision !== approval.revision || head?.parent_revision !== pin.revision
    || parent?.source_id !== reference.sourceId || parent.semantic_sha256 !== pin.semanticSha256
    || parent.algorithm !== 'typed-envelope-v1' || parent.sequence >= head.sequence
    || bodyDigest(['typed-envelope-v1', reference.sourceId, head.parent_revision, head.semantic_sha256, head.actor, head.reason]) !== approval.revision)
    throw Error('E_S08_WORDING_CHAIN');
  const predecessor = readDocumentRevision(db, { revision: pin.revision, documentId: approval.documentId,
    domain: 'factions', corpusKind: 'current' });
  if (bodyDigest(predecessor) !== pin.semanticSha256) throw Error('E_S08_WORDING_CHAIN');
  verifyReferenceSuccessorDelta({ predecessor, current: reference.document, changes: approval.changes });
  return orderDocumentKeys(db, reference.sourceId, reference.document);
}


function readApprovedAtlasDraft(db, expectedSha256) {
  const pin = ATLAS_DRAFT_APPROVAL;
  authenticateAtlasDraftApproval();
  if (expectedSha256 !== pin.sourceSha256) throw Error('E_ATLAS_DRAFT_SOURCE_PIN');
  const reference = readEvidenceDocumentReference(db, { logicalPath: pin.logicalPath, expectedSha256,
    expectedSemanticSha256: pin.semanticSha256 });
  verifyReferenceSuccessorChain(db, reference, pin);
  const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(reference.sourceId);
  const parent = db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
    WHERE r.revision_id=?`).get(pin.predecessor);
  if (reference.sourceId !== 8 || reference.revision !== pin.revision || head?.parent_revision !== pin.predecessor
    || parent?.source_id !== reference.sourceId || parent.semantic_sha256 !== pin.predecessorSemantic
    || parent.algorithm !== 'typed-envelope-v1' || parent.sequence >= head.sequence
    || bodyDigest(['typed-envelope-v1', reference.sourceId, head.parent_revision, head.semantic_sha256, head.actor, head.reason]) !== pin.revision)
    throw Error('E_ATLAS_DRAFT_CHAIN');
  const predecessor = readDocumentRevision(db, { revision: pin.predecessor, documentId: 'WNA-001', domain: 'root', corpusKind: 'current' });
  if (bodyDigest(predecessor) !== pin.predecessorSemantic) throw Error('E_ATLAS_DRAFT_CHAIN');
  // Reconstruct the entire expected delta from sealed typed history, not a body oracle.
  verifyReferenceSuccessorDelta({ predecessor, current: reference.document });
  const document = orderDocumentKeys(db, reference.sourceId, reference.document);
  if (createHash('sha256').update(JSON.stringify(document, null, 2) + '\n').digest('hex') !== pin.byteSha256)
    throw Error('E_ATLAS_DRAFT_BODY');
  return document;
}

function readExactApprovedBody(db, logicalPath, expectedSha256, approvedBodies) {
  const pin = PUBLICATION_EXACT_BODIES[logicalPath];
  approvedBodies ??= authenticateExactBodyApproval(process.env.PUBLICATION_NEW_BODY_ROOT
    ?? fileURLToPath(new URL('../../', import.meta.url)));
  const approved = approvedBodies.get(logicalPath);
  if (!approved || bodyDigest(approved) !== pin.semanticSha256) throw Error('E_PUBLICATION_EXACT_BODY_REQUIRED');
  const reference = readEvidenceDocumentReference(db, { logicalPath, expectedSha256, expectedSemanticSha256: pin.semanticSha256 });
  verifyReferenceSuccessorChain(db, reference, pin);
  const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(reference.sourceId);
  const parent = db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
    WHERE r.revision_id=?`).get(pin.predecessor);
  if (expectedSha256 !== pin.sourceSha256 || reference.revision !== pin.revision
    || head?.parent_revision !== pin.predecessor || parent?.source_id !== reference.sourceId
    || parent.semantic_sha256 !== pin.predecessorSemantic || parent.algorithm !== 'typed-envelope-v1'
    || parent.sequence >= head.sequence
    || bodyDigest(['typed-envelope-v1', reference.sourceId, head.parent_revision, head.semantic_sha256, head.actor, head.reason]) !== pin.revision)
    throw Error('E_PUBLICATION_EXACT_BODY_CHAIN');
  const predecessor = readDocumentRevision(db, { revision: pin.predecessor, documentId: pin.documentId,
    domain: pin.domain, corpusKind: 'current' });
  if (bodyDigest(predecessor) !== pin.predecessorSemantic) throw Error('E_PUBLICATION_EXACT_BODY_CHAIN');
  // approvedStructure contributes order only after complete typed equality.
  return preserveReceiptOrder(reference.document, approved);
}

// Only these independently authored successors can differ from legacy review
// bytes. Unchanged imports and unrecognized paths retain the original reader.
export function readReferenceSuccessor(db, { logicalPath, expectedSha256 }) {
  if (logicalPath !== ATLAS_DRAFT_APPROVAL.logicalPath
    && !Object.hasOwn(PUBLICATION_EXACT_BODIES, logicalPath)
    && !Object.hasOwn(PUBLICATION_SUCCESSOR_HEADS, logicalPath)) return null;
  const rows = db.prepare(`SELECT r.* FROM source_file s JOIN document_head h USING(source_id)
    JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id) WHERE s.logical_path=?`).all(logicalPath);
  if (rows.length !== 1) throw Error('E_REFERENCE_AUTHORITY');
  const [head] = rows;
  if (head.parent_revision === null) return null;
  if (logicalPath === ATLAS_DRAFT_APPROVAL.logicalPath) return readApprovedAtlasDraft(db, expectedSha256);
  const exact = PUBLICATION_EXACT_BODIES[logicalPath];
  if (exact) return readExactApprovedBody(db, logicalPath, expectedSha256);
  if (logicalPath === 'lore/factions/Sixteen-States.json') return readApprovedS08Wording(db, expectedSha256);
  const pin = PUBLICATION_SUCCESSOR_HEADS[logicalPath];
  authenticateFactionSuccessorApproval(logicalPath);
  const reference = readEvidenceDocumentReference(db, { logicalPath, expectedSha256, expectedSemanticSha256: pin.semanticSha256 });
  verifyReferenceSuccessorChain(db, reference, pin);
  const parent = db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
    WHERE r.revision_id=?`).get(head.parent_revision);
  if (expectedSha256 !== pin.sourceSha256 || reference.revision !== pin.revision
    || parent?.source_id !== reference.sourceId || parent.algorithm !== 'typed-envelope-v1'
    || parent.sequence >= head.sequence
    || bodyDigest(['typed-envelope-v1', reference.sourceId, head.parent_revision, head.semantic_sha256, head.actor, head.reason]) !== pin.revision)
    throw Error('E_REFERENCE_SUCCESSOR_CHAIN');
  return orderDocumentKeys(db, reference.sourceId, reference.document);
}
