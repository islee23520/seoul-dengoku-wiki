import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { evidenceReader } from './evidence-reader.mjs';
import { scopeDirectoryReader } from './scope-directory-inventory.mjs';
import { loadScopeInput } from '../check-seoul-scope.mjs';
import { requireGenerationPublication } from '../generate-release.mjs';
import { validateSeoulScope } from '../seoul-scope.mjs';
import { scopeAuthenticationReader } from './scope-authentication-reader.mjs';
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs';
import '../cast-sqlite/person-detail-inputs.mjs';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES } from './soul-candidate-documents.mjs';
import { openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES } from './soul-review-documents.mjs';
import { openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES } from './soul-batch-documents.mjs';
import { openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES } from './opening-sample-documents.mjs';
import { openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_SOURCE_HASHES } from './editorial-envelope-documents.mjs';

// Diagnostic replay of captured readBytes requests. This is NOT typed-current
// approval replay: direct Git calls and the separately pinned backups remain.
const [rootArgument, dbPath, bootstrapReceiptPath, captureReceiptPath, privateConfigPath] = process.argv.slice(2);
const root = resolve(rootArgument);
const bootstrap = JSON.parse(await readFile(bootstrapReceiptPath));
const capture = JSON.parse(await readFile(captureReceiptPath));
const store = openEvidenceStore(capture.databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
const db = new DatabaseSync(dbPath, { readOnly: true });
const privateStores = {};
const readBackupFile = readFile;
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
    ]) {
      if (!config[key]) throw Error(`E_SCOPE_REPLAY_PRIVATE_REQUIRED:${key}`);
      privateStores[key] = open(config[key], { capability, scope: 'internal', expectedSourceHashes: pins });
    }
    if (!config.soulAssignments) throw Error('E_SCOPE_REPLAY_PRIVATE_REQUIRED:soulAssignments');
    privateStores.soulAssignments = openSoulAssignments(config.soulAssignments, {
      capability: INTERNAL_SOUL_CAPABILITY, scope: 'internal', expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256 });
  }
  const bindings = new Map(), externalBindings = new Map();
  for (const row of capture.bindings) {
    const binding = { identity: row.identity, sha256: row.sha256 };
    if (row.logicalPath.startsWith('baseline-census:'))
      externalBindings.set(row.logicalPath.slice('baseline-census:'.length), binding);
    else bindings.set(row.logicalPath, binding);
  }
  const historicalBindings = new Map((capture.historicalBindings ?? []).map(row =>
    [JSON.stringify([resolve(row.repositoryRoot), row.revision, row.logicalPath]), { identity: row.identity, sha256: row.sha256 }]));
  const readerOptions = { root, bindings, externalBindings, historicalBindings, missingPaths: new Set(capture.missingPaths) };
  const currentSourceHashes = new Map();
  if (privateConfigPath) for (const row of readScopeContract(db).documents.filter(row => row.status !== 'preserved')) {
    const binding = bindings.get(row.sourcePath);
    if (!binding) throw Error(`E_SCOPE_REPLAY_CURRENT_BINDING:${row.sourcePath}`);
    currentSourceHashes.set(row.sourcePath, binding.sha256);
  }
  const sealed = privateConfigPath
    ? scopeAuthenticationReader({ db, evidenceStore: store, ...readerOptions, currentSourceHashes, ...privateStores })
    : evidenceReader(store, readerOptions);
  const archives = new Map(capture.externalArchives.map(row => [resolve(row.path), row]));
  const readBytes = async path => {
    const archive = archives.get(resolve(path));
    if (!archive) return sealed(path);
    const bytes = await readBackupFile(path);
    if (bytes.length !== archive.bytes || createHash('sha256').update(bytes).digest('hex') !== archive.sha256)
      throw Error('E_SCOPE_REPLAY_ARCHIVE');
    return bytes;
  };
  if (historicalBindings.size) readBytes.readHistorical = sealed.readHistorical;
  const originalExecFile = childProcess.execFile;
  const originalFilesystem = [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fs.createReadStream, fsp.readFile, fsp.readdir];
  if (process.env.SCOPE_REPLAY_DENY_GIT === '1') {
    if (!historicalBindings.size) throw Error('E_SCOPE_REPLAY_HISTORY_REQUIRED');
    childProcess.execFile = () => { throw Error('E_SCOPE_REPLAY_GIT_FORBIDDEN'); };
    syncBuiltinESMExports();
  }
  if (process.env.SCOPE_REPLAY_DENY_SOURCE_FS === '1') {
    const deny = path => { throw Error(`E_SCOPE_REPLAY_SOURCE_FS_FORBIDDEN:${String(path)}`); };
    fs.readFileSync = fs.readFile = fs.readdirSync = fs.readdir = fs.createReadStream = fsp.readFile = fsp.readdir = deny;
    syncBuiltinESMExports();
  }
  let input;
  const productionGate = process.env.SCOPE_REPLAY_PRODUCTION_GATE === '1';
  try {
    const databaseInputs = { baselinePath: resolve(root, '.omo/private/seoul-migration/baseline.json'), db, readBytes,
      readDirectory: scopeDirectoryReader(db, { root, expectedSha256: bootstrap.directoryInventory.sha256 }) };
    if (productionGate) {
      const publicationReview = await requireGenerationPublication(root, databaseInputs);
      input = { current: { publicationReview } };
    } else input = await loadScopeInput({ root, ...databaseInputs, mode: 'inspection' });
  }
  finally {
    childProcess.execFile = originalExecFile;
    [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fs.createReadStream, fsp.readFile, fsp.readdir] = originalFilesystem;
    syncBuiltinESMExports();
  }
  const { dependencyReport, dependencies, ...scopeInput } = input;
  const result = productionGate ? { ok: true, errors: [] }
    : input.error ?? validateSeoulScope(scopeInput, { mode: 'inspection' });
  console.log(JSON.stringify({ result, reviewComplete: input.current?.publicationReview?.complete,
    reviewDocuments: input.current?.publicationReview?.documents.length, capturedInputs: bindings.size + externalBindings.size,
    typedCurrentReplay: Boolean(privateConfigPath), currentTypedSourceCount: currentSourceHashes.size,
    historicalEvidenceBindings: historicalBindings.size,
    subprocessDenied: process.env.SCOPE_REPLAY_DENY_GIT === '1',
    sourceFilesystemDenied: process.env.SCOPE_REPLAY_DENY_SOURCE_FS === '1',
    productionGate,
    completeDatabaseOnlyClosure: false }));
  if (!result.ok) process.exitCode = 1;
} finally { Object.values(privateStores).forEach(handle => handle.close()); store.close(); db.close(); }
