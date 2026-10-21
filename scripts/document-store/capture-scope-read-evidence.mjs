import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadScopeInput } from '../check-seoul-scope.mjs';
import { validateSeoulScope } from '../seoul-scope.mjs';
import { MARKDOWN_SPANS_SHA256 } from '../seoul-census.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

// Offline diagnostic capture, not a current-document authority or approval.
// It captures only requests made through the supplied reader. Direct Git and
// filesystem calls elsewhere remain explicitly outside this evidence closure.
const [rootArgument, databasePath, receiptPath] = process.argv.slice(2);
if (![rootArgument, databasePath, receiptPath].every(value => typeof value === 'string' && isAbsolute(value)))
  throw Error('E_SCOPE_CAPTURE_ARGUMENTS');
const root = resolve(rootArgument);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const captured = new Map();
const historical = new Map();
const missing = new Set();
const baselineBytes = await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json'));
if (sha256(baselineBytes) !== '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223')
  throw Error('E_SCOPE_CAPTURE_BASELINE');
const baseline = JSON.parse(baselineBytes);
const archives = new Map(Object.entries(baseline.archives).map(([name, entry]) =>
  [resolve(entry.path), { name, ...entry }]));
const externalCensus = new Map([...baseline.occurrences.chunks,
  ...['cardBodies', 'cardSupplement', 'issuedIdentityMap'].map(key => baseline.occurrences[key])]
  .map(entry => [resolve(entry.path), entry.sha256]));
externalCensus.set(resolve(dirname(baseline.occurrences.cardBodies.path), 'markdown-byte-spans.json'), MARKDOWN_SPANS_SHA256);
const provenanceBytes = await readFile(resolve(root, '.omo/private/seoul-migration/required-provenance-bindings-20261015.json'));
if (sha256(provenanceBytes) !== 'd7fe15a49a0d2b4ee2d2b58e58f51877aad332dea6547d15529ef99562b1ca7c')
  throw Error('E_SCOPE_CAPTURE_PROVENANCE');
const provenance = JSON.parse(provenanceBytes);
const auditBytes = await readFile(resolve(root, provenance.audit.path));
if (sha256(auditBytes) !== provenance.audit.sha256) throw Error('E_SCOPE_CAPTURE_PROVENANCE_AUDIT');
const externalProvenance = new Map(JSON.parse(auditBytes).entries
  .filter(entry => entry.binding?.absolutePath)
  .map(entry => [resolve(entry.binding.absolutePath), entry.binding.fileSha256]));
const externalArchives = [];
const readBytes = async path => {
  const archive = archives.get(resolve(path));
  if (archive) {
    const bytes = await readFile(path);
    if (bytes.length !== archive.bytes || sha256(bytes) !== archive.sha256) throw Error('E_SCOPE_CAPTURE_ARCHIVE');
    // Immutable gigabyte-scale backup archives are already separately pinned.
    // Record their boundary, not a second raw copy in this reader-input DB.
    if (!externalArchives.some(row => row.name === archive.name)) externalArchives.push({
      name: archive.name, path: resolve(path), sha256: archive.sha256, bytes: archive.bytes,
    });
    return bytes;
  }
  const logicalPath = relative(root, resolve(path));
  const censusPin = externalCensus.get(resolve(path)) ?? externalProvenance.get(resolve(path));
  if ((!logicalPath || logicalPath.startsWith('../')) && !censusPin) throw Error(`E_SCOPE_CAPTURE_PATH:${resolve(path)}`);
  const identityPath = censusPin ? `baseline-census:${resolve(path)}` : logicalPath;
  try {
    const bytes = await readFile(path);
    if (censusPin && sha256(bytes) !== censusPin) throw Error('E_SCOPE_CAPTURE_CENSUS');
    const previous = captured.get(identityPath);
    if (previous && !previous.equals(bytes)) throw Error(`E_SCOPE_CAPTURE_DRIFT:${logicalPath}`);
    captured.set(identityPath, bytes);
    return bytes;
  } catch (error) { if (error.code === 'ENOENT') missing.add(logicalPath); throw error; }
};
readBytes.readHistorical = async (revision, logicalPath, repositoryRoot = root) => {
  if (!/^[a-f0-9]{40}$/u.test(revision) || !logicalPath || logicalPath.startsWith('/')
    || logicalPath.split('/').some(part => !part || part === '..' || part === '.')) throw Error('E_SCOPE_CAPTURE_HISTORY_PATH');
  const repository = resolve(repositoryRoot);
  // External repositories are selected only by the existing pinned audit.
  const allowed = repository === root || JSON.parse(auditBytes).entries.some(entry =>
    entry.binding?.repositoryRoot && resolve(entry.binding.repositoryRoot) === repository
      && entry.binding.revision === revision
      && (entry.binding.files ?? [entry.binding]).some(file => file.path === logicalPath));
  if (!allowed) throw Error('E_SCOPE_CAPTURE_HISTORY_REPOSITORY');
  const key = JSON.stringify([repository, revision, logicalPath]);
  const { stdout } = await promisify(execFile)('git', ['--no-replace-objects', '-C', repository, 'show', `${revision}:${logicalPath}`],
    { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  const prior = historical.get(key);
  if (prior && !prior.bytes.equals(stdout)) throw Error('E_SCOPE_CAPTURE_HISTORY_DRIFT');
  historical.set(key, { repositoryRoot: repository, revision, logicalPath, bytes: stdout });
  return stdout;
};
const input = await loadScopeInput({ root, baselinePath: resolve(root, '.omo/private/seoul-migration/baseline.json'),
  mode: 'inspection', readBytes });
const { dependencyReport, dependencies, ...scopeInput } = input;
const result = input.error ?? validateSeoulScope(scopeInput, { mode: 'inspection' });
if (!result.ok || input.current?.publicationReview?.complete !== true) throw Error('E_SCOPE_CAPTURE_AUTHENTICATION');
const store = openEvidenceStore(databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false });
try {
  const bindings = [];
  for (const [logicalPath, bytes] of captured) {
    const identity = `scope-read:${logicalPath}`;
    const pin = sha256(bytes);
    store.importBatch([{ identity, logicalPath, kind: 'archive', revision: 'scope-reader-capture',
      sha256: pin, bytes, references: [] }]);
    if (!store.getEvidence(identity, pin).equals(bytes)) throw Error('E_SCOPE_CAPTURE_READBACK');
    bindings.push({ logicalPath, identity, sha256: pin });
  }
  const historicalBindings = [];
  for (const [key, row] of historical) {
    const identity = `scope-history:${key}`;
    const pin = sha256(row.bytes);
    store.importBatch([{ identity, logicalPath: row.logicalPath, kind: 'archive', revision: row.revision,
      gitRevision: row.revision, sha256: pin, bytes: row.bytes, references: [] }]);
    if (!store.getEvidence(identity, pin).equals(row.bytes)) throw Error('E_SCOPE_CAPTURE_HISTORY_READBACK');
    historicalBindings.push({ repositoryRoot: row.repositoryRoot, revision: row.revision,
      logicalPath: row.logicalPath, identity, sha256: pin });
  }
  const receipt = { schema: 'scope-reader-evidence-capture.v1', databasePath, bindings,
    missingPaths: [...missing].sort(), externalArchives, historicalBindings, reviewDocuments: input.current.publicationReview.documents.length,
    completeDatabaseOnlyClosure: false };
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ captured: bindings.length, historical: historicalBindings.length, missing: missing.size,
    reviewDocuments: receipt.reviewDocuments, completeDatabaseOnlyClosure: false }));
} finally { store.close(); }
