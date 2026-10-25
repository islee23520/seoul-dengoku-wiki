import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INTERNAL_EVIDENCE_CAPABILITY, openEvidenceStore } from './evidence.mjs';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const pin = (entry) => ({ identity: entry.identity, expectedSha256: entry.sha256 });
const options = { capability: INTERNAL_EVIDENCE_CAPABILITY };
export const SEALED_INPUTS = Object.freeze({
  manifest: '3bb97b7f3500758404cfecced9f03b3f363a8aec4897a43a250094c2c9ddf311',
  delta: 'c6617ed9d9f58effffa4a8f27d5d5644ae3b2c1f4b1e0e36bef2a247ec9246f6',
});

function sealedJSON(path, expected) {
  const bytes = fs.readFileSync(path);
  assert.equal(sha256(bytes), expected, `Manifest seal mismatch: ${path}`);
  return JSON.parse(bytes);
}

// These are selection fields, not a recursive path/string crawler. Ordinary
// sources and Git tuples remain outside this private-input archive.
export function selectInputs(manifest, delta, seals) {
  assert.equal(manifest.schema, 'private-hydration-edge-resolution.v3');
  assert.equal(delta.schema, 'wiki-hydration-private-delta.v2');
  assert.equal(delta.baseManifestSHA, seals.manifest);
  const base = manifest.runtimeRequiredFiles.filter((row) => row.privateStorage === true);
  assert.deepEqual(base.map((row) => row.logicalIdentity).sort(), [...manifest.privateHydrationAllowlist].sort());
  const rows = [...base.map((row) => ({ ...row, seal: seals.manifest })),
    ...delta.files.map((row) => ({ ...row, seal: seals.delta }))];
  assert.equal(new Set(rows.map((row) => row.logicalIdentity)).size, rows.length, 'Duplicate logical identity');
  for (const row of rows) {
    assert.equal(row.privateStorage, true);
    assert.match(row.sha256, /^[0-9a-f]{64}$/);
    assert.ok(Number.isSafeInteger(row.size) && row.size >= 0);
    assert.equal(typeof row.physicalPath, 'string');
    assert.ok(row.physicalPath.startsWith('/'));
  }
  return rows;
}

export function captureInputs(rows, read = (path) => fs.readFileSync(path)) {
  const physical = new Map();
  return rows.map((row) => {
    let bytes = physical.get(row.physicalPath);
    if (!bytes) {
      bytes = read(row.physicalPath);
      physical.set(row.physicalPath, bytes);
    }
    assert.equal(bytes.length, row.size, `Size mismatch: ${row.logicalIdentity}`);
    assert.equal(sha256(bytes), row.sha256, `Input drift: ${row.logicalIdentity}`);
    return { identity: row.logicalIdentity, logicalPath: row.logicalIdentity, kind: 'archive',
      revision: row.revision ?? `sealed-manifest-sha256:${row.seal}`,
      gitRevision: row.gitRevision ?? null, gitBlob: row.gitBlob ?? null,
      sha256: row.sha256, bytes, references: [] };
  });
}

export function attachKnownReferences(entries, manifest, delta) {
  const byIdentity = new Map(entries.map((entry) => [entry.identity, entry]));
  const omitted = [];
  const at = (value, pointer) => pointer.split('/').slice(1).reduce((part, key) => part?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], value);
  const add = (source, pointer, identity, expected, type) => {
    const target = byIdentity.get(identity);
    if (!target) { omitted.push({ source: source.identity, pointer, identity }); return; }
    if (expected !== undefined) assert.equal(target.sha256, expected, `Reference pin mismatch: ${source.identity}${pointer}`);
    const ref = { type, pointer, targetIdentity: identity, expectedSha256: target.sha256 };
    if (!source.references.some((old) => old.type === type && old.pointer === pointer && old.targetIdentity === identity)) source.references.push(ref);
  };
  for (const root of manifest.registryRoots) {
    const source = byIdentity.get(root.packetPath);
    if (!source) continue;
    const packet = JSON.parse(source.bytes);
    for (const ref of root.referenceResolutions ?? []) {
      // Only exact manifest-declared JSON coordinates are interpreted.
      if (at(packet, ref.pointer) !== ref.identity) continue;
      add(source, ref.pointer, ref.identity, undefined, `manifest-${ref.disposition}`);
    }
  }
  const fields = {
    'timeline-wharf-successor.v1': ['approval', 'candidate', 'historicalReceipts'],
    'seoul-timeline-event-review.v2': ['approvalReceipt', 'candidateSpecification'],
    'main-doc-excluded-registration.v1': ['predecessor', 'overlay'],
    'main-doc-census-overlay.v1': ['predecessor'],
  };
  for (const row of delta.files) {
    if (!row.logicalIdentity.endsWith('.json')) continue;
    const source = byIdentity.get(row.logicalIdentity);
    const value = JSON.parse(source.bytes);
    for (const field of fields[value.schema] ?? []) {
      const values = Array.isArray(value[field]) ? value[field] : [value[field]];
      values.forEach((ref, index) => {
        if (ref?.path) add(source, `/${field}${Array.isArray(value[field]) ? `/${index}` : ''}/path`, ref.path, ref.sha256, `schema-${field}`);
      });
    }
    if (value.schema === 'timeline-wharf-successor.v1') {
      add(source, '/beforeSha256', source.identity.replace(/source-before-after\.json$/, 'before.json'), value.beforeSha256, 'schema-preimage');
    }
  }
  return omitted;
}

// Deny JS filesystem reads, including captured builtin ESM bindings. SQLite's
// native reads still work. No source JSON parsing or filesystem fallback occurs
// in this phase; pins and byte expectations are already held in memory.
export function verifyWithoutFilesystem(path, entries) {
  const names = ['readFileSync', 'readFile', 'openSync', 'open', 'readSync', 'read', 'createReadStream', 'readdirSync', 'readdir'];
  const originals = new Map(names.map((name) => [name, fs[name]]));
  const promiseNames = ['readFile', 'open', 'readdir'];
  const promises = new Map(promiseNames.map((name) => [name, fs.promises[name]]));
  const deny = () => { throw Object.assign(new Error('Filesystem reads disabled during evidence replay'), { code: 'E_FS_DISABLED' }); };
  let store;
  try {
    for (const name of names) fs[name] = deny;
    for (const name of promiseNames) fs.promises[name] = deny;
    syncBuiltinESMExports();
    assert.throws(() => fs.readFileSync('/private/source.json'), { code: 'E_FS_DISABLED' });
    store = openEvidenceStore(path, options);
    assert.equal(store.verifyClosure(entries.map(pin)).length, entries.length);
    for (const entry of entries) {
      assert.deepEqual(store.getEvidence(entry.identity, entry.sha256), entry.bytes);
      const { bytes, references, ...expected } = entry;
      assert.deepEqual(store.describeEvidence(entry.identity, entry.sha256), { ...expected, byteLength: bytes.length });
      assert.equal(store.listReferences(entry.identity, entry.sha256).length, references.length);
    }
  } finally {
    store?.close();
    for (const [name, value] of originals) fs[name] = value;
    for (const [name, value] of promises) fs.promises[name] = value;
    syncBuiltinESMExports();
  }
}

export function importPrivateEvidence({ manifestPath, deltaPath, databasePath, seals = SEALED_INPUTS }) {
  const manifest = sealedJSON(manifestPath, seals.manifest);
  const delta = sealedJSON(deltaPath, seals.delta);
  const rows = selectInputs(manifest, delta, seals);
  const entries = captureInputs(rows);
  const omittedReferences = attachKnownReferences(entries, manifest, delta);
  const before = rows.map((row) => ({ identity: row.logicalIdentity, physicalPath: row.physicalPath, sha256: row.sha256, size: row.size }));
  const store = openEvidenceStore(databasePath, { ...options, create: true, readOnly: false });
  try {
    assert.equal(store.importBatch(entries).length, entries.length);
    assert.equal(store.verifyClosure(entries.map(pin)).length, entries.length);
    for (const entry of entries) assert.deepEqual(store.getEvidence(entry.identity, entry.sha256), entry.bytes);
  } finally { store.close(); }
  verifyWithoutFilesystem(databasePath, entries);
  // Fresh read of the entire selected hashset, not just roots or JSON files.
  const after = captureInputs(rows);
  assert.deepEqual(after.map((entry) => entry.sha256), before.map((row) => row.sha256));
  assert.equal(sha256(fs.readFileSync(manifestPath)), seals.manifest);
  assert.equal(sha256(fs.readFileSync(deltaPath)), seals.delta);
  assert.equal(fs.statSync(databasePath).mode & 0o777, 0o600);
  return { schema: 'private-evidence-import-receipt.v1', databasePath, manifestPath, deltaPath, seals,
    logicalIdentities: rows.length, physicalInputs: new Set(rows.map((row) => row.physicalPath)).size,
    logicalBytes: entries.reduce((total, entry) => total + entry.bytes.length, 0),
    references: entries.reduce((total, entry) => total + entry.references.length, 0), omittedReferences,
    inputHashsetSha256: sha256(JSON.stringify(before)), inputs: before,
    databaseSha256: sha256(fs.readFileSync(databasePath)),
    checks: { singleBatch: true, exactBytes: true, closure: true, readOnlyReopen: true,
      filesystemReadsDeniedDuringReplay: true, allInputHashesUnchanged: true, manifestSealsUnchanged: true },
    scope: 'Only sealed private inputs and known-schema references. Not full closure outside known inputs; no approval evaluation or current-document admission. Executable inputs are archival references, not code authority.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [manifestPath, deltaPath, databasePath] = process.argv.slice(2);
  assert.ok(manifestPath && deltaPath && databasePath && process.argv.length === 5,
    'Usage: node import-evidence.mjs <sealed-v3-manifest> <sealed-delta> <new-private.sqlite>');
  assert.match(databasePath, /^\/tmp\/seoul-document-authority-20261020\/evidence-[a-zA-Z0-9-]+\.sqlite$/);
  const receipt = importPrivateEvidence({ manifestPath, deltaPath, databasePath });
  fs.writeFileSync(`${databasePath}.receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  console.log('PRIVATE_EVIDENCE_IMPORT_PASS', JSON.stringify({ databasePath, logicalIdentities: receipt.logicalIdentities,
    physicalInputs: receipt.physicalInputs, references: receipt.references, inputHashsetSha256: receipt.inputHashsetSha256 }));
}
