import { resolve, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { evidenceReader } from './evidence-reader.mjs';
import { readScopeCurrentSource, PUBLICATION_SUCCESSOR_HEADS, authenticatePublicationDataSuccessor } from './scope-current-source.mjs';

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
    const logicalPath = relative(base, resolve(path)).split('\\').join('/');
    const bytes = await evidence(path);
    const snapshot = db.isTransaction && db.prepare('PRAGMA query_only').get().query_only === 1;
    if (currentSourceHashes.has(logicalPath) && !(snapshot && verified.has(logicalPath))) {
      const expectedSha256 = currentSourceHashes.get(logicalPath);
      if (createHash('sha256').update(bytes).digest('hex') !== expectedSha256) throw Error('E_SCOPE_AUTHENTICATION_SOURCE_PIN');
      const actual = readScopeCurrentSource({ db, logicalPath, expectedSha256, ...privateStores, predecessor: true,
        ...(snapshot ? { snapshotDocuments } : {}) });
      const original = logicalPath.endsWith('.json') ? JSON.parse(bytes) : Buffer.from(bytes).toString('utf8');
      const approved = PUBLICATION_SUCCESSOR_HEADS[logicalPath];
      const head = approved && db.prepare(`SELECT h.revision_id FROM document_head h
        JOIN source_file s USING(source_id) WHERE s.logical_path=?`).get(logicalPath);
      const successor = head?.revision_id === approved?.revision ? approved : undefined;
      const dataSuccessor = authenticatePublicationDataSuccessor(db, logicalPath, expectedSha256, actual, original);
      // The exact archive/current pair is independently pinned. The current head
      // was reconstructed and integrity-checked above; old bytes remain evidence
      // for the legacy review, never a replacement for the current authored body.
      if (dataSuccessor ? false : successor ? expectedSha256 !== successor.sourceSha256
        : !isDeepStrictEqual(actual, original) || JSON.stringify(actual) !== JSON.stringify(original))
        throw Object.assign(Error('E_SCOPE_AUTHENTICATION_TYPED_MISMATCH'), { logicalPath });
      if (snapshot) verified.add(logicalPath);
    }
    return bytes;
  };
  reader.readHistorical = evidence.readHistorical;
  return reader;
}
