import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

// Offline snapshots for a pinned technical receipt, never current data reads.
const [root, mappingPath, outputPath] = process.argv.slice(2);
if (!root || !mappingPath || !outputPath) throw new Error('E_MAPPING_SOURCE_ARGUMENTS');
const options = { capability: INTERNAL_EVIDENCE_CAPABILITY };
const mapping = openEvidenceStore(mappingPath, options);
let sourceHashes;
try {
  const receipt = JSON.parse(mapping.getEvidence('person-detail-mapping:final:20261020',
    '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96'));
  sourceHashes = receipt.sourceHashes;
  if (Object.keys(sourceHashes).length !== 44) throw new Error('E_MAPPING_SOURCE_COVERAGE');
} finally { mapping.close(); }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const entries = [];
for (const [path, sha256] of Object.entries(sourceHashes)) {
  if (!/^(?:lore\/|vendor\/issued-history\/|person-rights-permissions\.json$)/u.test(path)
    || path.split('/').includes('..')) throw new Error('E_MAPPING_SOURCE_PATH');
  const bytes = await readFile(resolve(root, path));
  if (hash(bytes) !== sha256) throw new Error(`E_MAPPING_SOURCE_HASH:${path}`);
  entries.push({ identity: `mapping-source:${path}`, logicalPath: path, sha256, bytes,
    revision: 'final-mapping-source-snapshot-20261020', kind: 'archive', references: [] });
}
const store = openEvidenceStore(outputPath, { ...options, create: true, readOnly: false });
try {
  store.importBatch(entries);
  for (const entry of entries) if (!store.getEvidence(entry.identity, entry.sha256).equals(entry.bytes)) throw new Error('E_MAPPING_SOURCE_READBACK');
} finally { store.close(); }
console.log(JSON.stringify({ sourceCount: entries.length, completeAuthenticationClosure: false,
  typedCurrentCorrespondenceVerified: false,
  bindings: entries.map(({ identity, logicalPath, sha256 }) => ({ identity, logicalPath, sha256 })) }));
