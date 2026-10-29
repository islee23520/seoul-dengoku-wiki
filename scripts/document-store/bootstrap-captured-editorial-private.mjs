import { readFile } from 'node:fs/promises';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { OPENING_SAMPLE_PATHS, INTERNAL_OPENING_SAMPLE_CAPABILITY,
  initializeOpeningSampleDocuments, openOpeningSampleDocuments } from './opening-sample-documents.mjs';
import { EDITORIAL_ENVELOPE_PATHS, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY,
  initializeEditorialEnvelopeDocuments, openEditorialEnvelopeDocuments } from './editorial-envelope-documents.mjs';

// Explicit offline bootstrap from sealed captured evidence, never source paths.
// Existing private initializers require new files, internal capability and 0600.
const [receiptPath, samplePath, envelopePath] = process.argv.slice(2);
const receipt = JSON.parse(await readFile(receiptPath));
const evidence = openEvidenceStore(receipt.databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
try {
  const bindings = new Map(receipt.bindings.map(row => [row.logicalPath, row]));
  const results = [];
  for (const [path, pins, capability, initialize, open] of [
    [samplePath, OPENING_SAMPLE_PATHS, INTERNAL_OPENING_SAMPLE_CAPABILITY, initializeOpeningSampleDocuments, openOpeningSampleDocuments],
    [envelopePath, EDITORIAL_ENVELOPE_PATHS, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, initializeEditorialEnvelopeDocuments, openEditorialEnvelopeDocuments],
  ]) {
    const sources = Object.fromEntries(Object.entries(pins).map(([logicalPath, expectedSourceHash]) => {
      const binding = bindings.get(logicalPath);
      if (binding?.sha256 !== expectedSourceHash) throw Error('E_CAPTURED_EDITORIAL_PIN');
      return [logicalPath, { bytes: evidence.getEvidence(binding.identity, expectedSourceHash), expectedSourceHash }];
    }));
    const options = { capability, scope: 'internal', expectedSourceHashes: pins };
    initialize(path, { ...options, sources, actor: 'scope-cutover', reason: 'exact captured private source preservation' });
    const store = open(path, options);
    try {
      const documents = store.readDocuments();
      for (const [logicalPath, source] of Object.entries(sources)) {
        if (JSON.stringify(documents.get(logicalPath)) !== JSON.stringify(JSON.parse(source.bytes)))
          throw Error('E_CAPTURED_EDITORIAL_PARITY');
      }
      results.push({ documents: documents.size, parity: true });
    } finally { store.close(); }
  }
  console.log(JSON.stringify({ privateStores: results, publicationAuthority: false }));
} finally { evidence.close(); }
