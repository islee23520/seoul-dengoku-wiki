import { readFile } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { scopeAuthenticationReader } from './scope-authentication-reader.mjs';
import { scopeDirectoryReader } from './scope-directory-inventory.mjs';
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES } from './soul-candidate-documents.mjs';
import { openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES } from './soul-review-documents.mjs';
import { openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES } from './soul-batch-documents.mjs';
import { openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES } from './opening-sample-documents.mjs';
import { openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_SOURCE_HASHES } from './editorial-envelope-documents.mjs';

// Explicit machine-local inputs. No document source path is opened here.
// Receipt files select evidence identities; existing authenticators still decide
// approval. Backup archives remain separately hash-verified immutable inputs.
export async function openPublicationDatabaseInputs(root, config) {
  const fields = ['databasePath', 'bootstrapReceiptPath', 'captureReceiptPath', 'privateStores'];
  if (!config || Object.keys(config).some(key => ![...fields, 'editorialDatabasePath'].includes(key)) || fields.some(key => !Object.hasOwn(config, key))
    || fields.slice(0, 3).some(key => typeof config[key] !== 'string' || !isAbsolute(config[key])))
    throw Error('E_PUBLICATION_DATABASE_CONFIG');
  if (config.editorialDatabasePath !== undefined
    && (typeof config.editorialDatabasePath !== 'string' || !isAbsolute(config.editorialDatabasePath)))
    throw Error('E_PUBLICATION_DATABASE_CONFIG');
  const handles = [];
  const close = () => { for (const handle of handles.reverse()) handle.close(); handles.length = 0; };
  try {
    const bootstrap = JSON.parse(await readFile(config.bootstrapReceiptPath));
    const capture = JSON.parse(await readFile(config.captureReceiptPath));
    if (resolve(bootstrap.output) !== resolve(config.databasePath)) throw Error('E_PUBLICATION_DATABASE_IDENTITY');
    const db = new DatabaseSync(config.databasePath, { readOnly: true }); handles.push(db);
    if (config.editorialDatabasePath) db.prepare('ATTACH DATABASE ? AS editorial')
      .run(`file:${config.editorialDatabasePath}?mode=ro`);
    // One immutable read snapshot per publication authentication. This keeps
    // repeated source requests consistent without reconstructing typed rows again.
    db.exec('PRAGMA query_only=ON; BEGIN');
    const evidenceStore = openEvidenceStore(capture.databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY }); handles.push(evidenceStore);
    const privateStores = {};
    for (const [key, open, capability, pins] of [
      ['editorialProfiles', openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES],
      ['soulCandidates', openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES],
      ['soulReview', openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES],
      ['soulBatches', openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES],
      ['openingSample', openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES],
      ['editorialEnvelopes', openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_SOURCE_HASHES],
    ]) {
      if (typeof config.privateStores?.[key] !== 'string' || !isAbsolute(config.privateStores[key])) throw Error('E_PUBLICATION_PRIVATE_DATABASE');
      privateStores[key] = open(config.privateStores[key], { capability, scope: 'internal', expectedSourceHashes: pins });
      handles.push(privateStores[key]);
    }
    if (typeof config.privateStores.soulAssignments !== 'string' || !isAbsolute(config.privateStores.soulAssignments)) throw Error('E_PUBLICATION_PRIVATE_DATABASE');
    privateStores.soulAssignments = openSoulAssignments(config.privateStores.soulAssignments, {
      capability: INTERNAL_SOUL_CAPABILITY, scope: 'internal', expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256, view: 'approved' });
    handles.push(privateStores.soulAssignments);
    const bindings = new Map(), externalBindings = new Map();
    for (const row of capture.bindings) {
      const binding = { identity: row.identity, sha256: row.sha256 };
      if (row.logicalPath.startsWith('baseline-census:')) externalBindings.set(row.logicalPath.slice('baseline-census:'.length), binding);
      else bindings.set(row.logicalPath, binding);
    }
    const historicalBindings = new Map(capture.historicalBindings.map(row =>
      [JSON.stringify([resolve(row.repositoryRoot), row.revision, row.logicalPath]), { identity: row.identity, sha256: row.sha256 }]));
    const currentSourceHashes = new Map();
    for (const row of readScopeContract(db).documents.filter(row => row.status !== 'preserved')) {
      const binding = bindings.get(row.sourcePath);
      if (!binding) throw Error(`E_PUBLICATION_CURRENT_BINDING:${row.sourcePath}`);
      currentSourceHashes.set(row.sourcePath, binding.sha256);
    }
    const sealed = scopeAuthenticationReader({ db, evidenceStore, root, bindings, externalBindings, historicalBindings,
      missingPaths: new Set(capture.missingPaths), currentSourceHashes, ...privateStores });
    const archives = new Map(capture.externalArchives.map(row => [resolve(row.path), row]));
    const readBytes = async path => {
      path = path instanceof URL ? fileURLToPath(path) : path;
      const archive = archives.get(resolve(path));
      if (!archive) return sealed(path);
      const bytes = await readFile(path);
      if (bytes.length !== archive.bytes || createHash('sha256').update(bytes).digest('hex') !== archive.sha256)
        throw Error('E_PUBLICATION_BACKUP_HASH');
      return bytes;
    };
    readBytes.readHistorical = sealed.readHistorical;
    return { inputs: { db, baselinePath: resolve(root, '.omo/private/seoul-migration/baseline.json'), readBytes,
      readDirectory: scopeDirectoryReader(db, { root, expectedSha256: bootstrap.directoryInventory.sha256 }) }, close };
  } catch (error) { close(); throw error; }
}
