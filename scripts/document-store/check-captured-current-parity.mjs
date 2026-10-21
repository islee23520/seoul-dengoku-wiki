import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs';
import { readScopeCurrentSource } from './scope-current-source.mjs';
import { isDeepStrictEqual } from 'node:util';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES } from './soul-candidate-documents.mjs';
import { openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES } from './soul-review-documents.mjs';
import { openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES } from './soul-batch-documents.mjs';
import { openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES } from './opening-sample-documents.mjs';
import { openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_SOURCE_HASHES } from './editorial-envelope-documents.mjs';

// Preflight only. Private handles and missing captured sources remain explicit
// gaps, not approval exclusions and never source-JSON fallback opportunities.
const [dbPath, capturePath, privateConfigPath] = process.argv.slice(2);
const capture = JSON.parse(await readFile(capturePath));
const db = new DatabaseSync(dbPath, { readOnly: true });
const store = openEvidenceStore(capture.databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
const privateStores = {};
try {
  if (privateConfigPath) {
    const config = JSON.parse(await readFile(privateConfigPath));
    for (const [key, open, capability, pins] of [
      ['editorialProfiles', openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES],
      ['soulCandidates', openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES],
      ['soulReview', openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES],
      ['soulBatches', openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES],
      ['openingSample', openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES],
      ['editorialEnvelopes', openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_SOURCE_HASHES],
    ]) if (config[key]) privateStores[key] = open(config[key], { capability, scope: 'internal', expectedSourceHashes: pins });
    if (config.soulAssignments) privateStores.soulAssignments = openSoulAssignments(config.soulAssignments, {
      capability: INTERNAL_SOUL_CAPABILITY, scope: 'internal', expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256 });
  }
  const bindings = new Map(capture.bindings.map(row => [row.logicalPath, row]));
  const matched = [], privateRequired = [], missing = [], failed = [];
  for (const row of readScopeContract(db).documents.filter(row => row.status !== 'preserved')) {
    const logicalPath = row.sourcePath;
    const binding = bindings.get(logicalPath);
    if (!binding) { missing.push(logicalPath); continue; }
    try {
      const actual = readScopeCurrentSource({ db, logicalPath, expectedSha256: binding.sha256, ...privateStores });
      const bytes = store.getEvidence(binding.identity, binding.sha256);
      const expected = logicalPath.endsWith('.json') ? JSON.parse(bytes) : bytes.toString();
      if (!isDeepStrictEqual(actual, expected) || JSON.stringify(actual) !== JSON.stringify(expected))
        throw Error('E_CAPTURED_CURRENT_PARITY');
      matched.push(logicalPath);
    } catch (error) {
      if (/^E_(?:SCOPE_PRIVATE_SOUL(?:_SOURCE)?_REQUIRED|MAPPING_PRIVATE_PROFILE_REQUIRED)$/u.test(error.message))
        privateRequired.push(logicalPath);
      else failed.push({ path: logicalPath, error: error.message });
    }
  }
  console.log(JSON.stringify({ matched: matched.length, privateRequired, missing, failed, completeTypedReplay: false }, null, 2));
  // A supplied complete private configuration makes this a completeness gate,
  // not merely an inventory. Missing evidence/handles must not exit green.
  if (failed.length || privateConfigPath && (privateRequired.length || missing.length)) process.exitCode = 1;
} finally { Object.values(privateStores).forEach(handle => handle.close()); store.close(); db.close(); }
