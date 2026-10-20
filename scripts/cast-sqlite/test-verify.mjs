import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildCastDatabase, DEFAULT_SOURCE_ROOT } from './build.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { EXCLUDED_SOURCE_PATHS } from './excluded-sources.mjs';
import { REFERENCE_TARGET_PATHS } from './source-closure.mjs';
import { REQUIRED_SOURCE_PATHS, RETIRED_HISTORICAL_REFERENCE_PATHS } from './sources.mjs';
import { verifyCastDatabase } from './verify.mjs';

const git = (root, ...args) => execFileSync('git', ['-C', root, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8', windowsHide: true, shell: false }).trim();
const INPUT_PATHS = [...new Set([...REQUIRED_SOURCE_PATHS, ...REFERENCE_TARGET_PATHS, ...ENGINE_PRIVATE_SOURCE_PATHS, ...EXCLUDED_SOURCE_PATHS])].sort();

/** Exact-byte copy of the real inputs inside a fresh temporary Git repository; nothing in the wiki checkout is touched. */
async function committedCorpus(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(join(temp, 'cast-verify-provenance-'));
  t.after(async () => {
    assert.ok(relative(temp, resolve(root)).startsWith('cast-verify-provenance-'));
    await rm(root, { recursive: true, force: true });
  });
  const sourceRoot = join(root, 'WIKI');
  const evidencePaths = new Set(INPUT_PATHS);
  const gurps = JSON.parse(await readFile(join(DEFAULT_SOURCE_ROOT, 'lore/name-pools/gurps-cast.json'), 'utf8'));
  const collect = value => {
    if (value === null || typeof value !== 'object') return;
    if (Object.hasOwn(value, 'path')) {
      assert.equal(typeof value.path, 'string');
      assert.ok(!value.path.startsWith('/') && !value.path.split('/').includes('..'));
      if (!RETIRED_HISTORICAL_REFERENCE_PATHS.includes(value.path)) evidencePaths.add(value.path);
    }
    Object.values(value).forEach(collect);
  };
  collect(gurps);
  for (const logicalPath of evidencePaths) {
    await mkdir(dirname(join(sourceRoot, logicalPath)), { recursive: true });
    await copyFile(join(DEFAULT_SOURCE_ROOT, logicalPath), join(sourceRoot, logicalPath));
  }
  execFileSync('git', ['init', '--quiet', sourceRoot], { windowsHide: true, shell: false });
  git(sourceRoot, 'add', '--', ...evidencePaths);
  git(sourceRoot, 'commit', '--quiet', '-m', 'source inputs');
  return { root, sourceRoot, head: () => git(sourceRoot, 'rev-parse', 'HEAD') };
}

async function withSourceRevision(root, dbPath, name, revision) {
  const copy = join(root, `${name}.sqlite`);
  await copyFile(dbPath, copy);
  const db = new DatabaseSync(copy);
  try { db.prepare("UPDATE build_metadata SET value=? WHERE key='source_git_commit'").run(revision); } finally { db.close(); }
  return copy;
}

test('verify API rejects missing or invalid database arguments', async () => {
  await assert.rejects(verifyCastDatabase(), { code: 'E_VERIFY_USAGE' });
  await assert.rejects(verifyCastDatabase({ dbPath: '', sourceRoot: null }), { code: 'E_VERIFY_USAGE' });
  await assert.rejects(verifyCastDatabase({ dbPath: 'missing.sqlite', receiptPath: '' }), { code: 'E_VERIFY_USAGE' });
  await assert.rejects(verifyCastDatabase({ dbPath: 'missing.sqlite', requireClean: 'yes' }), { code: 'E_VERIFY_USAGE' });
});

test('verify CLI rejects force, missing database and duplicate options', () => {
  const cli = fileURLToPath(new URL('./verify.mjs', import.meta.url));
  for (const args of [[], ['--force'], ['--db'], ['--db', 'missing.sqlite', '--db', 'missing.sqlite'],
    ['--db', 'missing.sqlite', '--check-raw', '--check-raw']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stdout}`);
    assert.match(result.stderr, /E_VERIFY_USAGE/);
  }
});

test('full verify binds the stored source commit to the current inputs instead of the current HEAD', { timeout: 600_000 }, async (t) => {
  const { root, sourceRoot, head } = await committedCorpus(t);
  const driftedPath = 'WORLD_BUILDING_GUIDE.md';
  const original = await readFile(join(sourceRoot, driftedPath));
  await writeFile(join(sourceRoot, driftedPath), Buffer.concat([original, Buffer.from('\nolder input revision\n')]));
  git(sourceRoot, 'commit', '--quiet', '-a', '-m', 'older inputs');
  const olderInputs = head();
  await writeFile(join(sourceRoot, driftedPath), original);
  git(sourceRoot, 'commit', '--quiet', '-a', '-m', 'current inputs');
  const built = head();
  const dbPath = join(root, 'artifact.sqlite');
  const receipt = await buildCastDatabase({ sourceRoot, outputPath: dbPath });
  assert.equal(receipt.source_git_commit, built);

  await t.test('the build commit itself and an offline verify report provenance explicitly', async () => {
    const full = await verifyCastDatabase({ dbPath, sourceRoot });
    assert.deepEqual([full.source_git_commit, full.source_git_head, full.source_freshness], [built, built, 'current']);
    const offline = await verifyCastDatabase({ dbPath });
    assert.deepEqual([offline.source_git_commit, offline.source_git_head, offline.source_freshness], [built, null, 'unchecked']);
  });

  await mkdir(join(sourceRoot, 'data/canonical'), { recursive: true });
  await copyFile(dbPath, join(sourceRoot, 'data/canonical/wiki-cast.sqlite'));
  git(sourceRoot, 'add', '--', 'data/canonical/wiki-cast.sqlite');
  git(sourceRoot, 'commit', '--quiet', '-m', 'track the artifact only');
  const artifactOnly = head();
  assert.notEqual(artifactOnly, built);

  await t.test('an artifact-only descendant commit keeps the committed database verifiable', async () => {
    const full = await verifyCastDatabase({ dbPath, sourceRoot });
    assert.equal(full.complete_verification, true);
    assert.deepEqual([full.source_git_commit, full.source_git_head, full.source_freshness], [built, artifactOnly, 'current']);
  });

  const detached = git(sourceRoot, 'commit-tree', `${built}^{tree}`, '-p', olderInputs, '-m', 'outside the HEAD history');
  const treeObject = git(sourceRoot, 'rev-parse', `${built}^{tree}`);
  const missing = 'f'.repeat(built.length);
  assert.notEqual(spawnSync('git', ['-C', sourceRoot, 'cat-file', '-e', missing], { windowsHide: true }).status, 0);
  await t.test('ancestor with different input blobs, foreign commit, non-commit object and unknown object are rejected', async () => {
    for (const [name, revision] of [['older-inputs', olderInputs], ['outside-history', detached], ['tree-object', treeObject], ['unknown-object', missing]]) {
      const tampered = await withSourceRevision(root, dbPath, name, revision);
      await assert.rejects(verifyCastDatabase({ dbPath: tampered, sourceRoot }), { code: 'E_SOURCE_REVISION' }, name);
    }
  });

  await t.test('a replacement ref cannot make the older ancestor look like the build commit', async () => {
    git(sourceRoot, 'replace', olderInputs, built);
    const tampered = await withSourceRevision(root, dbPath, 'replaced-ancestor', olderInputs);
    await assert.rejects(verifyCastDatabase({ dbPath: tampered, sourceRoot }), { code: 'E_SOURCE_REVISION' });
    git(sourceRoot, 'replace', '-d', olderInputs);
  });

  await t.test('a later commit that changes an input makes the committed database stale', async () => {
    await writeFile(join(sourceRoot, driftedPath), Buffer.concat([original, Buffer.from('\nsource drift after the artifact commit\n')]));
    git(sourceRoot, 'commit', '--quiet', '-a', '-m', 'source drift');
    assert.equal(git(sourceRoot, 'merge-base', '--is-ancestor', built, 'HEAD'), '');
    await assert.rejects(verifyCastDatabase({ dbPath, sourceRoot }), { code: 'E_SOURCE_STALE' });
  });
});
