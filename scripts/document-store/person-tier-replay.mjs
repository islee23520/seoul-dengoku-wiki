import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { PERSON_TIER_EVIDENCE_BINDINGS } from './person-tier-evidence-bindings.mjs';
import { authenticatePersonalTierProvenance } from '../personal-tier-provenance.mjs';
import { readDocumentRevision } from '../cast-sqlite/document-edit.mjs';
import { orderDocumentKeys } from '../cast-sqlite/document-key-order.mjs';
import { isDeepStrictEqual } from 'node:util';

// Bounded replay: selected stores are not approval authority. Existing checks
// mint the original brand only after exact sealed predecessor documents match evidence.
export async function replayDatabasePersonalTiers({ db, evidenceStore, historyStore }) {
  const root = '/sealed-person-tier-replay';
  const bindings = new Map(PERSON_TIER_EVIDENCE_BINDINGS.map(row => [resolve(root, row.logicalPath), row]));
  const snapshots = new Map();
  for (const binding of PERSON_TIER_EVIDENCE_BINDINGS) {
    const bytes = evidenceStore.getEvidence(binding.identity, binding.sha256);
    if (binding.logicalPath.startsWith('lore/')) {
      const references = db.prepare(`SELECT s.source_id,s.sha256,s.raw_bytes,d.document_id,d.domain,d.corpus_kind,
        r.revision_id,r.semantic_sha256 FROM source_file s JOIN text_document d USING(source_id)
        JOIN document_revision r USING(source_id) JOIN document_revision_seal z USING(revision_id)
        WHERE s.logical_path=? AND r.parent_revision IS NULL AND r.algorithm='typed-envelope-v1'`).all(binding.logicalPath);
      if (references.length !== 1 || references[0].sha256 !== binding.sha256
        || createHash('sha256').update(references[0].raw_bytes).digest('hex') !== binding.sha256) throw new Error('E_PERSON_TIER_HISTORY_REFERENCE');
      const reference = references[0];
      const document = readDocumentRevision(db, { revision: reference.revision_id,
        documentId: reference.document_id, domain: reference.domain, corpusKind: reference.corpus_kind });
      const canonical = value => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
      if (createHash('sha256').update(JSON.stringify(canonical(document))).digest('hex') !== reference.semantic_sha256) throw new Error('E_PERSON_TIER_HISTORY_INTEGRITY');
      const current = orderDocumentKeys(db, reference.source_id, document);
      const snapshot = JSON.parse(bytes);
      if (!isDeepStrictEqual(current, snapshot) || JSON.stringify(current) !== JSON.stringify(snapshot)) {
        throw new Error('E_PERSON_TIER_TYPED_MISMATCH');
      }
      snapshots.set(binding.logicalPath, current);
    }
  }
  const baselineBinding = PERSON_TIER_EVIDENCE_BINDINGS.find(row => row.logicalPath === '.omo/private/seoul-migration/baseline.json');
  const baseline = JSON.parse(evidenceStore.getEvidence(baselineBinding.identity, baselineBinding.sha256));
  const reader = async path => {
    const binding = bindings.get(resolve(path));
    if (!binding) throw new Error('E_PERSON_TIER_EVIDENCE_MISSING');
    return evidenceStore.getEvidence(binding.identity, binding.sha256);
  };
  const blobReader = async (_root, revision, path) => {
    if (revision !== baseline.baseCommit) throw new Error('E_PERSON_TIER_EVIDENCE_REVISION');
    const rows = baseline.files.filter(row => row.path === path);
    if (rows.length !== 1) throw new Error('E_PERSON_TIER_EVIDENCE_MISSING');
    return historyStore.getEvidence(`git:${revision}:${path}`, rows[0].sha256);
  };
  const tiers = await authenticatePersonalTierProvenance(root, reader, blobReader);
  for (const row of tiers.values()) {
    const document = snapshots.get(`lore/characters/${row.source}.json`);
    for (const binding of row.provenance.currentRoleBlocks) {
      const blocks = document.content.filter(block => block.anchor === binding.anchor);
      if (blocks.length !== 1 || createHash('sha256').update(JSON.stringify(blocks[0])).digest('hex') !== binding.sha256) {
        throw new Error('E_PERSON_TIER_TYPED_MISMATCH');
      }
    }
  }
  return tiers;
}
