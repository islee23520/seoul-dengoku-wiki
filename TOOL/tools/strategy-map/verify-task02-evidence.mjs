import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildSourceFingerprint, requiredSourcePaths } from './build-task02-source-fingerprint.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fail = (message) => { throw new TypeError(message); };

export const verifyTask02Evidence = (repoRoot, manifestPath, manualPath) => {
  const manifest = readJson(manifestPath);
  const manual = readJson(manualPath);
  const expected = buildSourceFingerprint(repoRoot, manifest.implementation_commit);
  if (manifest.schema !== expected.schema) fail('manifest schema mismatch');
  if (JSON.stringify(manifest.files) !== JSON.stringify(expected.files)) fail('manifest source paths or hashes mismatch');
  if (manifest.files.length !== requiredSourcePaths.length) fail('manifest required path count mismatch');
  if (manifest.manifest_sha256 !== expected.manifest_sha256) fail('manifest hash mismatch');
  if (manual.implementation_commit !== manifest.implementation_commit) fail('manual implementation commit mismatch');
  if (manual.source_manifest_sha256 !== manifest.manifest_sha256) fail('manual source manifest mismatch');
  if (manual.unknown_observed_level !== null || manual.observed_level !== 3) fail('manual observed levels mismatch');
  if (manual.identity_equal !== true || manual.hash_equal !== true) fail('manual identity observation mismatch');
  if (manual.different_platform_unequal !== true) fail('manual platform inequality mismatch');
  if (manual.conflict_error !== 'PlaceDefinitionConflictException') fail('manual conflict error mismatch');
  if (manual.catalog_unchanged !== true) fail('manual catalog mutation mismatch');
  if (manual.catalog_fingerprint_before !== manual.catalog_fingerprint_after) fail('manual catalog fingerprints differ');
  if (!/^[0-9a-f]{64}$/.test(manual.catalog_fingerprint_before)) fail('manual catalog fingerprint is not sha256');
  return Object.freeze({
    schema: 'task02-evidence-verification.v1',
    implementation_commit: manifest.implementation_commit,
    source_manifest_sha256: manifest.manifest_sha256,
    manual_sha256: sha256(readFileSync(manualPath)),
    verified: true,
  });
};

const main = () => {
  const [repoRoot, manifestPath, manualPath] = process.argv.slice(2);
  if (!repoRoot || !manifestPath || !manualPath) {
    throw new TypeError('usage: verify-task02-evidence.mjs <repo-root> <manifest> <manual>');
  }
  process.stdout.write(`${JSON.stringify(verifyTask02Evidence(repoRoot, manifestPath, manualPath), null, 2)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
