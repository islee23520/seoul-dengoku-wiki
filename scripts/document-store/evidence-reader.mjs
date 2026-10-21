import { resolve, relative } from 'node:path';

// Adapter for existing evidence authenticators, not a current-document reader.
// Every permitted logical path has an explicit identity and independent hash.
export function evidenceReader(store, { root, bindings, historicalBindings = new Map(), externalBindings = new Map(), missingPaths = new Set() }) {
  const base = resolve(root);
  const reader = async path => {
    const absolutePath = resolve(path);
    const external = externalBindings.get(absolutePath);
    if (external) return store.getEvidence(external.identity, external.sha256);
    const logicalPath = relative(base, resolve(path));
    if (!logicalPath || logicalPath.startsWith('../')) throw new Error('E_EVIDENCE_READER_PATH');
    const binding = bindings.get(logicalPath);
    if (!binding && missingPaths.has(logicalPath)) throw Object.assign(new Error(`Missing captured input: ${logicalPath}`), { code: 'ENOENT' });
    if (!binding) throw new Error(`E_EVIDENCE_READER_MISSING:${logicalPath}`);
    return store.getEvidence(binding.identity, binding.sha256);
  };
  reader.readHistorical = async (revision, logicalPath, repositoryRoot = base) => {
    const repository = resolve(repositoryRoot);
    const qualified = historicalBindings.get(JSON.stringify([repository, revision, logicalPath]));
    if (repository !== base && !qualified) throw new Error('E_EVIDENCE_READER_REPOSITORY');
    const binding = qualified ?? historicalBindings.get(`${revision}:${logicalPath}`);
    if (!binding) throw new Error(`E_EVIDENCE_READER_MISSING:${revision}:${logicalPath}`);
    return store.getEvidence(binding.identity, binding.sha256);
  };
  return reader;
}
