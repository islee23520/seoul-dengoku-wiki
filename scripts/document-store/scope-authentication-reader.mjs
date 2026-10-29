import { resolve } from 'node:path';
import { evidenceReader } from './evidence-reader.mjs';

// Immutable capture receipts select exact evidence bytes, including original
// whitespace. Current document values are read from typed authority separately.
export function scopeAuthenticationReader({ evidenceStore, root, bindings, historicalBindings, externalBindings, missingPaths }) {
  const evidence = evidenceReader(evidenceStore, { root: resolve(root), bindings, historicalBindings, externalBindings, missingPaths });
  const reader = async path => evidence(path);
  reader.readHistorical = evidence.readHistorical;
  return reader;
}
