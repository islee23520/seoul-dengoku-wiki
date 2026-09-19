import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

export const requiredSourcePaths = Object.freeze([
  'GAME/Assets/Janseon/Core/PlaceId.cs',
  'GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs',
]);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const git = (repoRoot, args, encoding = null) => execFileSync('git', ['-C', repoRoot, ...args], {
  encoding,
  stdio: ['ignore', 'pipe', 'ignore'],
});

export const buildSourceFingerprint = (repoRoot, implementationCommit) => {
  if (!/^[0-9a-f]{40}$/.test(implementationCommit)) {
    throw new TypeError('implementation commit must be a lowercase 40-character SHA-1');
  }
  const resolvedCommit = git(repoRoot, ['rev-parse', '--verify', `${implementationCommit}^{commit}`], 'utf8').trim();
  if (resolvedCommit !== implementationCommit) {
    throw new TypeError('implementation commit must be the exact resolved commit SHA');
  }
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', implementationCommit, 'HEAD']);
  } catch {
    throw new TypeError('implementation commit must be an ancestor of current HEAD');
  }
  const implementationTree = git(repoRoot, ['rev-parse', '--verify', `${implementationCommit}^{tree}`], 'utf8').trim();
  const files = requiredSourcePaths.map((path) => {
    const content = git(repoRoot, ['show', `${implementationCommit}:${path}`]);
    return Object.freeze({ path, sha256: sha256(content) });
  });
  const manifestMaterial = files.map(({ path, sha256: digest }) => `${path}\0${digest}\n`).join('');
  return Object.freeze({
    schema_version: 'task02-source-fingerprint.v2',
    implementation_commit: implementationCommit,
    implementation_tree: implementationTree,
    files,
    manifest_sha256: sha256(manifestMaterial),
  });
};

const main = () => {
  const args = process.argv.slice(2);
  const commitIndex = args.indexOf('--implementation-commit');
  const outputIndex = args.indexOf('--output');
  const repoIndex = args.indexOf('--repo-root');
  const implementationCommit = commitIndex >= 0 ? args[commitIndex + 1] : null;
  const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
  const repoRoot = repoIndex >= 0 ? args[repoIndex + 1] : null;
  if (!repoRoot || !implementationCommit || !outputPath) {
    throw new TypeError('usage: build-task02-source-fingerprint.mjs --repo-root <path> --implementation-commit <sha> --output <path>');
  }
  const manifest = buildSourceFingerprint(repoRoot, implementationCommit);
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
