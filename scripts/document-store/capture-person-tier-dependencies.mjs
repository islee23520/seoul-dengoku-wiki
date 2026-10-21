import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { authenticatePersonalTierProvenance } from '../personal-tier-provenance.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

// Capture only requests made by the unchanged bounded authenticator, after it
// succeeds. Snapshots authenticate history; they are not editable domain data.
const [root, databasePath] = process.argv.slice(2);
if (!root || !databasePath) throw new Error('E_TIER_DEPENDENCY_ARGUMENTS');
const base = resolve(root), captured = new Map();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const reader = async path => {
  const logicalPath = relative(base, resolve(path));
  if (logicalPath.startsWith('../') || !logicalPath) throw new Error('E_TIER_DEPENDENCY_PATH');
  const bytes = await readFile(path);
  const previous = captured.get(logicalPath);
  if (previous && !previous.equals(bytes)) throw new Error('E_TIER_DEPENDENCY_DRIFT');
  captured.set(logicalPath, bytes);
  return bytes;
};
const tiers = await authenticatePersonalTierProvenance(base, reader);
if (tiers.size !== 83) throw new Error('E_TIER_DEPENDENCY_COVERAGE');
const entries = [...captured].map(([logicalPath, bytes]) => ({ identity: `tier-proof:${logicalPath}`,
  logicalPath, bytes, sha256: hash(bytes), revision: 'authenticated-tier-capture-20261020',
  kind: 'archive', references: [] }));
const inventorySha256 = hash(JSON.stringify(entries.map(({ identity, sha256 }) => ({ identity, sha256 }))));
const store = openEvidenceStore(databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false });
try {
  store.importBatch(entries);
  for (const entry of entries) if (!store.getEvidence(entry.identity, entry.sha256).equals(entry.bytes)) throw new Error('E_TIER_DEPENDENCY_READBACK');
} finally { store.close(); }
console.log(JSON.stringify({ records: entries.length, tiers: tiers.size, inventorySha256,
  bindings: entries.map(({ identity, logicalPath, sha256 }) => ({ identity, logicalPath, sha256 })),
  completeAuthenticationClosure: false }));
