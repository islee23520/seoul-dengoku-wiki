import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, lstat, mkdir, readFile, readdir, realpath, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { assertSafeOutputRoot, buildWiki as defaultBuildWiki } from './build-wiki.mjs';
import assert from 'node:assert/strict';

export const PINNED_DEPENDENCIES = {
  entities: '8.0.0',
  'mdast-util-from-markdown': '2.0.3',
  parse5: '8.0.1',
};

export const REQUIRED_PAGES = [
  'Home.md',
  'Cast-Index.md',
  'Cast-Relations.md',
  'Cast-State-01.md',
  'Cast-State-16.md',
  'Campaign-Loop.md',
];

export const CONDITIONAL_PAGES = [];

const GENERATED_SENTINEL = '.janseon-wiki-generated';
const VCS_DIRECTORY = '.git';
const PUBLISHED_ASSET_DIRECTORY = 'assets';
const repositoryRootFromScript = resolve(fileURLToPath(new URL('../../..', import.meta.url)));

export async function assertPinnedManifest(repositoryRoot) {
  const manifestPath = join(repositoryRoot, 'package.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`root package.json is required: ${error.message}`);
  }

  if (JSON.stringify(manifest.dependencies) !== JSON.stringify(PINNED_DEPENDENCIES)) {
    throw new Error('root package.json dependencies are not the pinned wiki parser set');
  }
  if (manifest.engines?.node !== '>=22 <27') {
    throw new Error('root package.json engines.node must be ">=22 <27"');
  }
  if (!String(manifest.engines?.npm ?? '').includes('12')) {
    throw new Error('root package.json engines.npm must pin npm 12');
  }
  if (!String(manifest.packageManager ?? '').startsWith('npm@12')) {
    throw new Error('root package.json packageManager must pin npm@12');
  }
}

export async function assertInstalledParsers(repositoryRoot) {
  await assertPinnedManifest(repositoryRoot);
  for (const name of Object.keys(PINNED_DEPENDENCIES)) {
    const dir = join(repositoryRoot, 'node_modules', name);
    const stats = await lstatOrNull(dir);
    if (!stats || stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new Error(`missing dependency ${name}`);
    }
  }
}

export async function assertPublishableBuild(outputDir, { sourceDirs, assetDir } = {}) {
  if (typeof outputDir !== 'string' || outputDir.trim() === '') {
    throw new Error('refusing an empty wiki output root');
  }
  const resolved = assertSafeOutputRoot(outputDir);
  const stats = await lstatOrNull(resolved);
  if (!stats) throw new Error(`wiki build output does not exist: ${resolved}`);
  if (stats.isSymbolicLink()) {
    throw new Error(`refusing a symlinked wiki build output: ${resolved}`);
  }
  if (!stats.isDirectory()) throw new Error(`wiki build output is not a directory: ${resolved}`);

  const canonical = await realpath(resolved);
  const pages = [];
  await assertTreeSafe(canonical, canonical, pages);

  if (pages.length === 0) {
    throw new Error('refusing to publish zero wiki pages');
  }

  for (const page of REQUIRED_PAGES) {
    await assertRegularContainedFile(canonical, page, `required page ${page}`);
  }

  // p1P completeness hard gate (independent of mocks): missing required page/section/H1-H3/Korean nav/link/SVG/banner/asset => nonzero before mutation
  const home = await readFile(join(canonical, 'Home.md'), 'utf8');
  assert.match(home, /출격하고 돌아오는 흐름/, 'Home.md must contain Korean campaign flow navigation label');
  assert.match(home, /Campaign-Loop/, 'Home.md must link to Campaign-Loop');
  assert.match(home, /!\[[^\]]+\]\([^)]+\)/, 'Home must have a visible image label');
  const loop = await readFile(join(canonical, 'Campaign-Loop.md'), 'utf8');
  assert.match(loop, /^# 출격하고 돌아오는 흐름$/m, 'Campaign-Loop.md must have exact Korean H1');
  assert.match(loop, /!\[[^\]]+\]\([^)]+\.svg(?:\?[^)]*)?\)/, 'Campaign-Loop must have a visible SVG label');
  // p1P: '한 판' allowed only in tactical/SRPG pages; banned in Home/Sidebar/campaign/world/overview/non-tactical. Campaign-Loop is the canonical '출격하고 돌아오는 흐름' page.

  if (sourceDirs) {
    for (const page of CONDITIONAL_PAGES) {
      const sourcePage = sourceDirs.map((dir) => join(dir, page)).find((p) => existsSync(p));
      if (!sourcePage) continue;
      const sourceStats = await lstatOrNull(sourcePage);
      if (sourceStats && sourceStats.isFile() && !sourceStats.isSymbolicLink()) {
        await assertRegularContainedFile(canonical, page, `required page ${page}`);
      }
    }
  }

  if (assetDir) {
    const assetStats = await lstatOrNull(assetDir);
    if (assetStats && assetStats.isDirectory() && !assetStats.isSymbolicLink()) {
      const assetFiles = await collectRegularFiles(assetDir);
      if (assetFiles.length > 0) {
        const publishedRoot = join(canonical, PUBLISHED_ASSET_DIRECTORY);
        const publishedStats = await lstatOrNull(publishedRoot);
        if (!publishedStats || publishedStats.isSymbolicLink() || !publishedStats.isDirectory()) {
          throw new Error('refusing to publish without assets');
        }
        for (const rel of assetFiles) {
          await assertRegularContainedFile(
            canonical,
            join(PUBLISHED_ASSET_DIRECTORY, rel),
            `published asset ${rel}`,
          );
        }
      }
    }
  }

  return { pageCount: pages.length, pages };
}

export const GITHUB_WIKI_RETIRED =
  'GitHub Wiki is retired; serve GAME-LOGIC/site locally and publish https://seoul-kenshi.vercel.app';

export async function publishWiki({
  repositoryRoot,
  wikiDir,
  sourceDir,
  assetDir,
  commitSha,
  runInstall = true,
  runTests = true,
  push = false,
  buildWiki = defaultBuildWiki,
  npmCi,
  runNodeTests,
  gitPush,
} = {}) {
  if (push) throw new Error(GITHUB_WIKI_RETIRED);
  if (!commitSha) throw new Error('commitSha is required');
  if (typeof repositoryRoot !== 'string' || repositoryRoot.trim() === '') {
    throw new Error('repositoryRoot is required');
  }
  if (typeof wikiDir !== 'string' || wikiDir.trim() === '') {
    throw new Error('wikiDir is required');
  }

  const repo = resolve(repositoryRoot);
  const live = assertSafeOutputRoot(wikiDir);
  const sources = sourceDir ? [resolve(sourceDir)] : ['LORE', 'GAME-LOGIC', 'GDD'].map((dir) => resolve(join(repo, dir)));
  const assets = resolve(assetDir ?? join(repo, 'GAME-REFERENCE', 'assets', 'wiki'));

  if (live === repo || sources.includes(live) || live === assets) {
    throw new Error('refusing to use the repository, source, or asset directory as the live wiki checkout');
  }

  await assertReplaceableWikiCheckout(live);
  const before = await snapshotDirectory(live);

  try {
    if (runInstall) {
      await (npmCi ?? defaultNpmCi)(repo);
    }
    await assertInstalledParsers(repo);

    if (runTests) {
      await (runNodeTests ?? defaultRunTests)(repo);
    }

    const staging = join(tmpdir(), `janseon-wiki-staging-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    try {
      await buildWiki({ sourceDirs: sources, assetDir: assets, outputDir: staging, commitSha });
      await assertPublishableBuild(staging, { sourceDirs: sources, assetDir: assets });
      await replaceWikiCheckout(live, staging);
    } finally {
      await rm(staging, { recursive: true, force: true });
    }

    if (push) {
      await (gitPush ?? defaultGitPush)(live);
    }
  } catch (error) {
    const after = await snapshotDirectory(live);
    if (after !== before) {
      error.message = `${error.message} (live wiki checkout changed during a failed publish)`;
    }
    throw error;
  }
}

async function assertReplaceableWikiCheckout(live) {
  const stats = await lstatOrNull(live);
  if (!stats) return;
  if (stats.isSymbolicLink()) {
    throw new Error(`refusing to replace a symlinked wiki checkout: ${live}`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`refusing to replace a non-directory wiki checkout: ${live}`);
  }

  const canonical = await realpath(live);
  const entries = await readdir(canonical);
  const sentinelPath = join(canonical, GENERATED_SENTINEL);
  const sentinelStats = await lstatOrNull(sentinelPath);
  const hasSentinel = Boolean(sentinelStats && sentinelStats.isFile() && !sentinelStats.isSymbolicLink());
  const isFreshClone = entries.length === 1 && entries[0] === VCS_DIRECTORY;
  if (!hasSentinel && !isFreshClone) {
    throw new Error(
      `refusing to replace ${canonical}: the ${GENERATED_SENTINEL} sentinel is missing, `
      + 'so this directory is not a generated wiki checkout',
    );
  }
}

async function replaceWikiCheckout(live, staging) {
  const parent = dirname(live);
  const next = join(parent, `.janseon-wiki-next-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const prev = join(parent, `.janseon-wiki-prev-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  await cp(staging, next, { recursive: true });

  const liveStats = await lstatOrNull(live);
  if (liveStats) {
    const gitPath = join(live, VCS_DIRECTORY);
    const gitStats = await lstatOrNull(gitPath);
    if (gitStats) {
      const destGit = join(next, VCS_DIRECTORY);
      if (gitStats.isDirectory()) await cp(gitPath, destGit, { recursive: true });
      else await cp(gitPath, destGit);
    }
    await rename(live, prev);
  } else {
    await mkdir(parent, { recursive: true });
  }

  try {
    await rename(next, live);
  } catch (error) {
    if (await lstatOrNull(prev)) {
      await rename(prev, live);
    }
    await rm(next, { recursive: true, force: true });
    throw error;
  }

  await rm(prev, { recursive: true, force: true });
}

async function assertTreeSafe(root, dir, pages) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === VCS_DIRECTORY) continue;
    const path = join(dir, entry.name);
    const rel = relative(root, path);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) {
      throw new Error(`path escape: ${path}`);
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`refusing to publish symlink ${rel}`);
    }
    if (entry.isDirectory()) {
      await assertTreeSafe(root, path, pages);
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`refusing to publish non-file ${rel}`);
    }
    if (entry.name.endsWith('.md')) pages.push(rel);
  }
}

async function assertRegularContainedFile(root, relativePath, what) {
  const destination = join(root, relativePath);
  const rel = relative(root, destination);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) {
    throw new Error(`path escape: ${what}`);
  }
  const stats = await lstatOrNull(destination);
  if (!stats) throw new Error(`missing ${what}`);
  if (stats.isSymbolicLink()) throw new Error(`refusing to publish symlink ${what}`);
  if (!stats.isFile()) throw new Error(`${what} is not a regular file`);
}

async function collectRegularFiles(root, prefix = '') {
  const files = [];
  for (const entry of (await readdir(join(root, prefix), { withFileTypes: true })).sort()) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = join(root, prefix, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`refusing to publish the symlinked asset ${rel}`);
    }
    if (entry.isDirectory()) {
      files.push(...await collectRegularFiles(root, rel));
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`refusing to publish the non-file asset ${rel}: ${path}`);
    }
    files.push(rel);
  }
  return files;
}

async function snapshotDirectory(dir) {
  const stats = await lstatOrNull(dir);
  if (!stats) return 'missing';
  if (stats.isSymbolicLink()) return `symlink:${dir}`;
  if (!stats.isDirectory()) return `other:${stats.mode}`;
  const lines = [];
  await walkSnapshot(dir, dir, lines);
  return lines.sort().join('\n');
}

async function walkSnapshot(root, dir, lines) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(root, path) || '.';
    if (entry.isSymbolicLink()) {
      lines.push(`link ${rel}`);
      continue;
    }
    if (entry.isDirectory()) {
      lines.push(`dir ${rel}`);
      await walkSnapshot(root, path, lines);
      continue;
    }
    if (entry.isFile()) {
      const body = await readFile(path);
      lines.push(`file ${rel} ${body.length} ${body.toString('hex').slice(0, 32)}`);
    }
  }
}

async function lstatOrNull(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function defaultNpmCi(repositoryRoot) {
  return runCommand('npm', ['ci'], repositoryRoot);
}

async function defaultRunTests(repositoryRoot) {
  await runCommand(process.execPath, ['Tool/tools/wiki/test-build-wiki.mjs'], repositoryRoot);
  await runCommand(process.execPath, ['Tool/tools/wiki/test-core-isometric-diagrams.mjs'], repositoryRoot);
  await runCommand(process.execPath, ['Tool/tools/wiki/test-publish-wiki.mjs'], repositoryRoot);
}

function defaultGitPush(wikiDir) {
  return runCommand('git', ['-C', wikiDir, 'push']);
}

function runCommand(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed (${code}): ${stderr || stdout}`));
    });
  });
}

export function parsePublishArgs(argv) {
  const out = {
    push: false,
    runInstall: true,
    runTests: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--skip-npm-ci') {
      out.runInstall = false;
      continue;
    }
    if (arg === '--skip-tests') {
      out.runTests = false;
      continue;
    }
    if (arg === '--push') {
      throw new Error(GITHUB_WIKI_RETIRED);
    }
    if (arg === '--no-push') {
      out.push = false;
      continue;
    }
    if (!arg.startsWith('--')) {
      throw new Error(`unexpected argument ${arg}`);
    }
    const name = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`missing value for --${name}`);
    }
    out[name] = value;
    i += 1;
  }
  return out;
}

export async function publishWikiFromArgs(argv, overrides = {}) {
  const args = parsePublishArgs(argv);
  const repositoryRoot = resolve(args['repo-root'] ?? repositoryRootFromScript);
  if (!args['wiki-dir']) throw new Error('usage: node publish-wiki.mjs --wiki-dir <checkout> [--commit-sha <sha>]');

  let commitSha = args['commit-sha'];
  if (!commitSha) {
    const result = await runCommand('git', ['-C', repositoryRoot, 'rev-parse', 'HEAD'], repositoryRoot);
    commitSha = result.stdout.trim();
  }

  let buildWiki = overrides.buildWiki ?? defaultBuildWiki;
  if (args.builder) {
    const imported = await import(pathToFileURL(resolve(args.builder)).href);
    buildWiki = imported.buildWiki;
  }

  await publishWiki({
    repositoryRoot,
    wikiDir: args['wiki-dir'],
    sourceDir: args['source-dir'],
    assetDir: args['asset-dir'],
    commitSha,
    runInstall: args.runInstall,
    runTests: args.runTests,
    push: args.push,
    buildWiki,
    npmCi: overrides.npmCi,
    runNodeTests: overrides.runNodeTests,
    gitPush: overrides.gitPush,
  });
}

async function main() {
  await publishWikiFromArgs(process.argv.slice(2));
  console.log('published wiki checkout');
}

if (process.argv[1] && await realpath(process.argv[1]) === await realpath(fileURLToPath(import.meta.url))) {
  await main();
}
