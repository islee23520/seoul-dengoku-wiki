import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { attachKnownReferences, captureInputs, importPrivateEvidence, selectInputs, sha256 } from './import-evidence.mjs';
import { INTERNAL_EVIDENCE_CAPABILITY, openEvidenceStore } from './evidence.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'private-evidence-import-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bytes = Buffer.from([0, 255, 13, 10, 128]);
  const source = join(directory, 'source.bin');
  writeFileSync(source, bytes);
  const row = { logicalIdentity: 'private/binary', physicalPath: source, sha256: sha256(bytes), size: bytes.length,
    privateStorage: true, revision: 'retained-revision', gitRevision: 'fixed-commit', gitBlob: 'fixed-blob' };
  const manifest = { schema: 'private-hydration-edge-resolution.v3', runtimeRequiredFiles: [row,
    { ...row, logicalIdentity: 'absolute-alias' }, { privateStorage: false, physicalPath: '/must-not-read' }],
    privateHydrationAllowlist: ['private/binary', 'absolute-alias'], registryRoots: [] };
  const manifestPath = join(directory, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const seals = { manifest: sha256(readFileSync(manifestPath)) };
  const delta = { schema: 'wiki-hydration-private-delta.v2', baseManifestSHA: seals.manifest, files: [] };
  const deltaPath = join(directory, 'delta.json');
  writeFileSync(deltaPath, JSON.stringify(delta));
  seals.delta = sha256(readFileSync(deltaPath));
  return { directory, bytes, row, manifest, delta, seals, source, manifestPath, deltaPath,
    databasePath: join(directory, 'evidence.sqlite') };
}

test('sealed private aliases retain exact binary bytes and revision metadata with readonly no-filesystem replay', (t) => {
  const f = fixture(t);
  const receipt = importPrivateEvidence(f);
  assert.equal(receipt.logicalIdentities, 2);
  assert.equal(receipt.physicalInputs, 1);
  assert.equal(receipt.checks.filesystemReadsDeniedDuringReplay, true);
  assert.equal(receipt.checks.allInputHashesUnchanged, true);
  assert.equal(statSync(f.databasePath).mode & 0o777, 0o600);
  const store = openEvidenceStore(f.databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
  try {
    for (const identity of ['private/binary', 'absolute-alias']) {
      assert.deepEqual(store.getEvidence(identity, f.row.sha256), f.bytes);
      const metadata = store.describeEvidence(identity, f.row.sha256);
      assert.equal(metadata.revision, 'retained-revision');
      assert.equal(metadata.gitRevision, 'fixed-commit');
      assert.equal(metadata.gitBlob, 'fixed-blob');
    }
  } finally { store.close(); }
  assert.throws(() => importPrivateEvidence(f), { code: 'EEXIST' });
});

test('manifest, delta, input and alias pin drift fail before database creation', (t) => {
  const f = fixture(t);
  assert.throws(() => importPrivateEvidence({ ...f, seals: { ...f.seals, manifest: '0'.repeat(64) } }), /Manifest seal mismatch/);
  assert.throws(() => importPrivateEvidence({ ...f, seals: { ...f.seals, delta: '0'.repeat(64) } }), /Manifest seal mismatch/);
  writeFileSync(f.source, Buffer.from([1, 255, 13, 10, 128]));
  assert.throws(() => importPrivateEvidence(f), /Input drift/);
  assert.throws(() => statSync(f.databasePath), { code: 'ENOENT' });
  const rows = selectInputs(f.manifest, f.delta, f.seals);
  rows[1].sha256 = '0'.repeat(64);
  assert.throws(() => captureInputs(rows, () => f.bytes), /Input drift/);
  assert.throws(() => selectInputs({ ...f.manifest, privateHydrationAllowlist: [] }, f.delta, f.seals));
});

test('only declared private inputs are read once per physical path; unrelated ordinary rows are inert', (t) => {
  const f = fixture(t);
  const reads = [];
  const rows = selectInputs(f.manifest, f.delta, f.seals);
  const entries = captureInputs(rows, (path) => { reads.push(path); return f.bytes; });
  assert.deepEqual(reads, [f.source]);
  assert.deepEqual(entries.map((entry) => entry.identity), ['private/binary', 'absolute-alias']);
});

test('known-schema references use exact coordinates and seals without recursive private discovery', () => {
  const packet = { approval: { path: 'approval', sha256: sha256('approval') },
    unknown: { path: 'not-admitted', sha256: sha256('unread') }, sourcePath: '/ordinary/not-admitted' };
  const entries = [
    { identity: 'packet.json', bytes: Buffer.from(JSON.stringify(packet)), sha256: sha256(JSON.stringify(packet)), references: [] },
    { identity: 'approval', bytes: Buffer.from('approval'), sha256: sha256('approval'), references: [] },
  ];
  const manifest = { registryRoots: [{ packetPath: 'packet.json', referenceResolutions: [
    { pointer: '/approval/path', identity: 'approval', disposition: 'runtime-required' },
    { pointer: '/unknown/path', identity: 'not-admitted', disposition: 'documentary' },
  ] }] };
  const omitted = attachKnownReferences(entries, manifest, { files: [] });
  assert.deepEqual(entries[0].references, [{ type: 'manifest-runtime-required', pointer: '/approval/path',
    targetIdentity: 'approval', expectedSha256: sha256('approval') }]);
  assert.deepEqual(omitted, [{ source: 'packet.json', pointer: '/unknown/path', identity: 'not-admitted' }]);
  const successor = { schema: 'seoul-timeline-event-review.v2', approvalReceipt: { path: 'approval', sha256: '0'.repeat(64) } };
  entries[0].bytes = Buffer.from(JSON.stringify(successor));
  assert.throws(() => attachKnownReferences(entries, { registryRoots: [] }, { files: [{ logicalIdentity: 'packet.json' }] }), /Reference pin mismatch/);
});
