import { resolve, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { evidenceReader } from './evidence-reader.mjs';
import { readScopeCurrentSource, authenticatePublicationDataSuccessor } from './scope-current-source.mjs';
import { readReferenceSuccessor } from './reference-successor-reader.mjs';
import { RELATION_SUCCESSOR, verifyRelationHistoricalProjection } from '../cast-sqlite/relation-successor.mjs';
import { VALUES_SUCCESSOR, readApprovedValuesSuccessor, verifyValuesHistoricalProjection } from '../cast-sqlite/values-successor.mjs';

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
      const successor = readReferenceSuccessor(db, { logicalPath, expectedSha256 });
      const actual = successor ?? readScopeCurrentSource({ db, logicalPath, expectedSha256, ...privateStores, predecessor: true,
        ...(snapshot ? { snapshotDocuments } : {}) });
      const original = logicalPath.endsWith('.json') ? JSON.parse(bytes) : Buffer.from(bytes).toString('utf8');
      const relationSuccessor = logicalPath === RELATION_SUCCESSOR.logicalPath && successor === null
        && db.prepare("SELECT 1 FROM sqlite_schema WHERE name='data_source_head'").get()
        && db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(logicalPath);
      // PR606 data successors (values-cast, office, feudal, holdings) keep their own pinned delta proof.
      const dataSuccessor = successor === null && !relationSuccessor && logicalPath !== VALUES_SUCCESSOR.logicalPath
        && authenticatePublicationDataSuccessor(db, logicalPath, expectedSha256, actual, original);
      if (relationSuccessor) verifyRelationHistoricalProjection(actual, original);
      else if (logicalPath === VALUES_SUCCESSOR.logicalPath
        && readApprovedValuesSuccessor(db, { projection: actual, sourceSha256: expectedSha256 }) !== null)
        verifyValuesHistoricalProjection(actual, original);
      else if (successor === null && !dataSuccessor && (!isDeepStrictEqual(actual, original) || JSON.stringify(actual) !== JSON.stringify(original)))
        throw Error('E_SCOPE_AUTHENTICATION_TYPED_MISMATCH');
      if (snapshot) verified.add(logicalPath);
    }
    return bytes;
  };
  reader.readHistorical = evidence.readHistorical;
  return reader;
}
