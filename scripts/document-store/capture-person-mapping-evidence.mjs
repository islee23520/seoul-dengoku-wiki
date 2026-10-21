import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { materializePublicLegacyProjectionMapping, PUBLIC_LEGACY_RECEIPT,
  PUBLIC_LEGACY_RECEIPT_SHA256 } from '../public-legacy-projection-successor.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

// Offline capture only. This never grants publication or supplies current data.
export async function capturePersonMappingEvidence({ root, databasePath, actor, reason }) {
  if (!root || !databasePath || !actor?.trim() || !reason?.trim()) throw new Error('E_MAPPING_CAPTURE_ARGUMENTS');
  const omission = await readFile(resolve(root, PUBLIC_LEGACY_RECEIPT));
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  if (hash(omission) !== PUBLIC_LEGACY_RECEIPT_SHA256) throw new Error('E_MAPPING_CAPTURE_HASH');
  const final = await materializePublicLegacyProjectionMapping(root);
  const finalHash = '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96';
  if (final.sha256 !== finalHash || hash(final.bytes) !== finalHash) throw new Error('E_MAPPING_CAPTURE_HASH');
  const entries = [
    { identity: PUBLIC_LEGACY_RECEIPT, bytes: omission, sha256: PUBLIC_LEGACY_RECEIPT_SHA256 },
    { identity: 'person-detail-mapping:final:20261020', bytes: Buffer.from(final.bytes), sha256: finalHash },
  ].map(entry => ({ ...entry, logicalPath: entry.identity, kind: 'review',
    revision: `${actor}: ${reason}`, references: [] }));
  const store = openEvidenceStore(databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false });
  try {
    store.importBatch(entries);
    for (const entry of entries) if (!store.getEvidence(entry.identity, entry.sha256).equals(entry.bytes)) throw new Error('E_MAPPING_CAPTURE_READBACK');
  } finally { store.close(); }
  return { identities: entries.map(({ identity, sha256 }) => ({ identity, sha256 })),
    completeAuthenticationClosure: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [root, databasePath, actor, reason] = process.argv.slice(2);
  console.log(JSON.stringify(await capturePersonMappingEvidence({ root, databasePath, actor, reason })));
}
