import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildSourceFingerprint } from './build-task02-source-fingerprint.mjs';
import { verifyTask02Evidence } from './verify-task02-evidence.mjs';

const repoRoot = new URL('../../..', import.meta.url).pathname;
const implementationCommit = process.env.TASK02_IMPLEMENTATION_COMMIT;
const evidenceDir = process.env.TASK02_EVIDENCE_DIR;

const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), 'task02-evidence-'));
  const manifestPath = join(dir, 'source-fingerprint.json');
  const manualPath = join(dir, 'manual-place-id.json');
  writeFileSync(manifestPath, readFileSync(join(evidenceDir, 'source-fingerprint.json')));
  writeFileSync(manualPath, readFileSync(join(evidenceDir, 'manual-place-id.json')));
  return { dir, manifestPath, manualPath };
};

test('accepts evidence bound to frozen sources and implementation commit', () => {
  const result = verifyTask02Evidence(
    repoRoot,
    join(evidenceDir, 'source-fingerprint.json'),
    join(evidenceDir, 'manual-place-id.json'),
  );
  assert.equal(result.implementation_commit, implementationCommit);
  assert.equal(result.verified, true);
});

for (const [name, mutate] of [
  ['flipped boolean', (manifest, manual) => { manual.identity_equal = false; }],
  ['added source path', (manifest) => { manifest.files.push({ path: 'extra', sha256: '0'.repeat(64) }); }],
  ['dropped source path', (manifest) => { manifest.files.pop(); }],
  ['wrong commit', (manifest) => { manifest.implementation_commit = '0'.repeat(40); }],
  ['nonhex commit', (manifest) => { manifest.implementation_commit = 'z'.repeat(40); }],
  ['mismatched manifest hash', (manifest) => { manifest.manifest_sha256 = 'f'.repeat(64); }],
]) {
  test(`rejects ${name}`, () => {
    const current = fixture();
    try {
      const manifest = JSON.parse(readFileSync(current.manifestPath, 'utf8'));
      const manual = JSON.parse(readFileSync(current.manualPath, 'utf8'));
      mutate(manifest, manual);
      writeFileSync(current.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      writeFileSync(current.manualPath, `${JSON.stringify(manual, null, 2)}\n`);
      assert.throws(() => verifyTask02Evidence(repoRoot, current.manifestPath, current.manualPath));
    } finally {
      rmSync(current.dir, { recursive: true, force: true });
    }
  });
}

test('builder freezes the exact required source set', () => {
  const manifest = buildSourceFingerprint(repoRoot, implementationCommit);
  assert.deepEqual(manifest.files.map(({ path }) => path), [
    'GAME/Assets/Janseon/Core/PlaceId.cs',
    'GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs',
  ]);
});
