import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { PERSON_TIER_EVIDENCE_BINDINGS } from './person-tier-evidence-bindings.mjs';
import { authenticatePersonalTierProvenance } from '../personal-tier-provenance.mjs';
import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
import { orderDocumentKeys } from '../cast-sqlite/document-key-order.mjs';
import { isDeepStrictEqual } from 'node:util';

// Bounded replay: selected stores are not approval authority. Existing checks
// mint the original brand only after typed current documents match evidence.
export async function replayDatabasePersonalTiers({ db, evidenceStore, historyStore }) {
  const root = '/sealed-person-tier-replay';
  const bindings = new Map(PERSON_TIER_EVIDENCE_BINDINGS.map(row => [resolve(root, row.logicalPath), row]));
  const snapshots = new Map();
  for (const binding of PERSON_TIER_EVIDENCE_BINDINGS) {
    const bytes = evidenceStore.getEvidence(binding.identity, binding.sha256);
    if (binding.logicalPath.startsWith('lore/')) {
      const reference = readEvidenceDocumentReference(db, { logicalPath: binding.logicalPath, expectedSha256: binding.sha256 });
      const current = orderDocumentKeys(db, reference.sourceId, reference.document);
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
