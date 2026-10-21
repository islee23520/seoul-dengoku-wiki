import { resolve, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { evidenceReader } from './evidence-reader.mjs';
import { readScopeCurrentSource } from './scope-current-source.mjs';

// Immutable receipts authenticate exact bytes, including original whitespace.
// Current document values MUST independently reconstruct from typed authority;
// evidence bytes cannot rescue a missing, unsupported or changed current source.
export function scopeAuthenticationReader({ db, evidenceStore, root, bindings, historicalBindings, externalBindings, missingPaths,
  currentSourceHashes, ...privateStores }) {
  const base = resolve(root);
  const evidence = evidenceReader(evidenceStore, { root: base, bindings, historicalBindings, externalBindings, missingPaths });
  const verified = new Set();
  const snapshotDocuments = new Map();
  const reader = async path => {
    const logicalPath = relative(base, resolve(path));
    const bytes = await evidence(path);
    const snapshot = db.isTransaction && db.prepare('PRAGMA query_only').get().query_only === 1;
    if (currentSourceHashes.has(logicalPath) && !(snapshot && verified.has(logicalPath))) {
      const expectedSha256 = currentSourceHashes.get(logicalPath);
      if (createHash('sha256').update(bytes).digest('hex') !== expectedSha256) throw Error('E_SCOPE_AUTHENTICATION_SOURCE_PIN');
      const actual = readScopeCurrentSource({ db, logicalPath, expectedSha256, ...privateStores,
        ...(snapshot ? { snapshotDocuments } : {}) });
      const original = logicalPath.endsWith('.json') ? JSON.parse(bytes) : Buffer.from(bytes).toString('utf8');
      if (!isDeepStrictEqual(actual, original) || JSON.stringify(actual) !== JSON.stringify(original))
        throw Error('E_SCOPE_AUTHENTICATION_TYPED_MISMATCH');
      if (snapshot) verified.add(logicalPath);
    }
    return bytes;
  };
  reader.readHistorical = evidence.readHistorical;
  return reader;
}
