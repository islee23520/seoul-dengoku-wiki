import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const requiredSourcePaths = Object.freeze([
  'GAME/Assets/Janseon/Core/PlaceId.cs',
  'GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs',
]);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export const buildSourceFingerprint = (repoRoot, implementationCommit) => {
  if (!/^[0-9a-f]{40}$/.test(implementationCommit)) {
    throw new TypeError('implementation commit must be a lowercase 40-character SHA-1');
  }
  execFileSync('git', ['-C', repoRoot, 'cat-file', '-e', `${implementationCommit}^{commit}`]);
  const files = requiredSourcePaths.map((path) => {
    const content = readFileSync(resolve(repoRoot, path));
    return Object.freeze({ path, sha256: sha256(content) });
  });
  const manifestMaterial = files.map(({ path, sha256: digest }) => `${path}\0${digest}\n`).join('');
  return Object.freeze({
    schema: 'task02-source-fingerprint.v1',
    implementation_commit: implementationCommit,
    files,
    manifest_sha256: sha256(manifestMaterial),
  });
};

const main = () => {
  const [repoRoot, implementationCommit, outputPath] = process.argv.slice(2);
  if (!repoRoot || !implementationCommit || !outputPath) {
    throw new TypeError('usage: build-task02-source-fingerprint.mjs <repo-root> <implementation-commit> <output>');
  }
  const manifest = buildSourceFingerprint(repoRoot, implementationCommit);
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
