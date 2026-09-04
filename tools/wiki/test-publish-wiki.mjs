import assert from 'node:assert/strict';
import { access, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { buildWiki } from './build-wiki.mjs';
import {
  REQUIRED_PAGES,
  assertInstalledParsers,
  assertPublishableBuild,
  publishWiki,
} from './publish-wiki.mjs';

const SENTINEL = '.janseon-wiki-generated';
const SENTINEL_BODY = [
  '# janseon wiki generated output',
  '# Everything in this directory except .git is rebuilt by tools/wiki/build-wiki.mjs.',
  '# Deleting this file makes the next build refuse to clean the directory.',
  '',
].join('\n');
const LIVE_MARKER = 'LIVE-WIKI-SENTINEL-MUST-SURVIVE';
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const publisher = fileURLToPath(new URL('./publish-wiki.mjs', import.meta.url));

const root = await (await import('node:fs/promises')).mkdtemp(join(tmpdir(), 'janseon-wiki-publish-'));
const passed = [];
const failed = [];

async function testCase(name, run) {
  try {
    await run();
    passed.push(name);
  } catch (error) {
    failed.push({ name, error });
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function makeRepo({ pages, assets = { 'figure.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>' }, extra = {} } = {}) {
  const repo = join(root, `repo-${Math.random().toString(16).slice(2)}`);
  const sourceDir = join(repo, 'docs', 'game-logic');
  const assetDir = join(repo, 'docs', 'assets', 'wiki');
  await mkdir(sourceDir, { recursive: true });
  await mkdir(assetDir, { recursive: true });
  await mkdir(join(repo, 'node_modules', 'entities'), { recursive: true });
  await mkdir(join(repo, 'node_modules', 'mdast-util-from-markdown'), { recursive: true });
  await mkdir(join(repo, 'node_modules', 'parse5'), { recursive: true });
  await writeFile(join(repo, 'package.json'), JSON.stringify({
    name: 'janseon-wiki-publisher-fixture',
    private: true,
    type: 'module',
    engines: { node: '>=22 <27', npm: '>=12 <13' },
    packageManager: 'npm@12.0.2',
    dependencies: {
      entities: '8.0.0',
      'mdast-util-from-markdown': '2.0.3',
      parse5: '8.0.1',
    },
  }, null, 2));
  for (const [name, body] of Object.entries(pages)) {
    await writeFile(join(sourceDir, name), body);
  }
  for (const [name, body] of Object.entries(assets)) {
    await mkdir(join(assetDir, dirname(name)), { recursive: true });
    await writeFile(join(assetDir, name), body);
  }
  for (const [name, body] of Object.entries(extra)) {
    await mkdir(join(repo, dirname(name)), { recursive: true });
    await writeFile(join(repo, name), body);
  }
  return { repo, sourceDir, assetDir };
}

function requiredPages(extra = {}) {
  const pages = {
    'Home.md': '# 홈\n\n![그림](../assets/wiki/figure.svg)\n\n![배너](janseon-seoul-cover.png)\n\n[출격하고 돌아오는 흐름](Campaign-Loop)\n',
    'Cast-Index.md': '# 인물 색인\n',
    'Cast-Relations.md': '# 관계\n',
    'Cast-State-01.md': '# 1국\n',
    'Cast-State-16.md': '# 16국\n',
    'Campaign-Loop.md': '# 출격하고 돌아오는 흐름\n\n![흐름 SVG](isometric-grammar.svg)\n\n준비, 원정, 복귀 흐름.\n',
  };
  return { ...pages, ...extra };
}

async function makeLiveWiki(label, { marker = LIVE_MARKER } = {}) {
  const dir = join(root, `live-${label}`);
  await mkdir(join(dir, '.git'), { recursive: true });
  await writeFile(join(dir, '.git', 'HEAD'), 'ref: refs/heads/master\n');
  await writeFile(join(dir, SENTINEL), SENTINEL_BODY);
  await writeFile(join(dir, 'Live.md'), `${marker}\n`);
  return dir;
}

async function assertLiveUnchanged(live, marker = LIVE_MARKER) {
  assert.equal(await readFile(join(live, 'Live.md'), 'utf8'), `${marker}\n`, 'live wiki page must be unchanged');
  assert.equal(await readFile(join(live, SENTINEL), 'utf8'), SENTINEL_BODY, 'live wiki sentinel must be unchanged');
  assert.equal(await readFile(join(live, '.git', 'HEAD'), 'utf8'), 'ref: refs/heads/master\n', 'live wiki git must be unchanged');
}

function fakeInstall() {
  return async () => {};
}

function fakeTests() {
  return async () => {};
}

async function successfulBuild({ sourceDir, assetDir, outputDir, commitSha }) {
  await buildWiki({ sourceDir, assetDir, outputDir, commitSha });
}

await testCase('happy path replaces a sentinel wiki checkout without pushing', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('happy');
  let pushed = false;

  await publishWiki({
    repositoryRoot: repo,
    wikiDir: live,
    sourceDir,
    assetDir,
    commitSha: 'abc1234',
    runInstall: true,
    runTests: true,
    push: false,
    npmCi: fakeInstall(),
    runNodeTests: fakeTests(),
    gitPush: async () => {
      pushed = true;
    },
    buildWiki: successfulBuild,
  });

  assert.equal(pushed, false, 'publish must not push unless --push is set');
  assert.equal(await exists(join(live, 'Live.md')), false, 'stale live page must be replaced');
  for (const page of REQUIRED_PAGES) {
    assert.ok(await exists(join(live, page)), `published ${page}`);
  }
  assert.ok(await exists(join(live, 'assets', 'figure.svg')), 'published assets');
  assert.ok(await exists(join(live, SENTINEL)), 'generated sentinel must exist after replace');
  assert.equal(await readFile(join(live, '.git', 'HEAD'), 'utf8'), 'ref: refs/heads/master\n');
});

await testCase('missing entities exits nonzero before mutating the live wiki', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  await rm(join(repo, 'node_modules', 'entities'), { recursive: true, force: true });
  const live = await makeLiveWiki('missing-entities');
  let built = false;

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: async () => {
        built = true;
      },
    }),
    /missing dependency entities/,
  );
  assert.equal(built, false, 'builder must not run when a parser is missing');
  await assertLiveUnchanged(live);
});

await testCase('zero-output builder exits nonzero before mutating the live wiki', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('zero-output');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: async ({ outputDir }) => {
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, SENTINEL), SENTINEL_BODY);
      },
    }),
    /zero wiki pages/,
  );
  await assertLiveUnchanged(live);
});

await testCase('missing Cast-Index exits nonzero before mutating the live wiki', async () => {
  const pages = requiredPages();
  delete pages['Cast-Index.md'];
  const { repo, sourceDir, assetDir } = await makeRepo({ pages });
  const live = await makeLiveWiki('missing-cast-index');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: successfulBuild,
    }),
    /Cast-Index/,
  );
  await assertLiveUnchanged(live);
});

await testCase('missing Unofficial-Fan-AU-Notice is required only when the source page exists', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({
    pages: requiredPages({ 'Unofficial-Fan-AU-Notice.md': '# 비공식 팬 AU\n' }),
  });
  const live = await makeLiveWiki('missing-au');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: async ({ outputDir }) => {
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, SENTINEL), SENTINEL_BODY);
        const validPages = requiredPages();
        for (const page of REQUIRED_PAGES) {
          await writeFile(join(outputDir, page), validPages[page] ?? '# page\n');
        }
        await mkdir(join(outputDir, 'assets'), { recursive: true });
        await writeFile(join(outputDir, 'assets', 'figure.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
      },
    }),
    /Unofficial-Fan-AU-Notice/,
  );
  await assertLiveUnchanged(live);
});

await testCase('missing published asset exits nonzero before mutating the live wiki', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('missing-asset');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: async ({ outputDir }) => {
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, SENTINEL), SENTINEL_BODY);
        const validPages = requiredPages();
        for (const page of REQUIRED_PAGES) {
          await writeFile(join(outputDir, page), validPages[page] ?? '# page\n');
        }
      },
    }),
    /asset/i,
  );
  await assertLiveUnchanged(live);
});

await testCase('a path-escaping output file is refused before mutating the live wiki', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('path-escape');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: async ({ outputDir }) => {
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, SENTINEL), SENTINEL_BODY);
        for (const page of REQUIRED_PAGES) {
          await writeFile(join(outputDir, page), '# page\n');
        }
        await mkdir(join(outputDir, 'assets'), { recursive: true });
        await writeFile(join(outputDir, 'assets', 'figure.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
        await symlink(join(outputDir, 'Home.md'), join(outputDir, 'escape.md'), 'file');
      },
    }),
    /symlink|path escape/i,
  );
  await assertLiveUnchanged(live);
});

await testCase('a failed npm ci leaves the live wiki unchanged', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('npm-ci-fail');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: async () => {
        throw new Error('npm ci failed');
      },
      runNodeTests: fakeTests(),
      buildWiki: successfulBuild,
    }),
    /npm ci failed/,
  );
  await assertLiveUnchanged(live);
});

await testCase('a failed node test suite leaves the live wiki unchanged', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('tests-fail');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: live,
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: async () => {
        throw new Error('wiki tests failed');
      },
      buildWiki: successfulBuild,
    }),
    /wiki tests failed/,
  );
  await assertLiveUnchanged(live);
});

await testCase('a dangerous output root is refused without touching the live wiki', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('bad-output');

  await assert.rejects(
    publishWiki({
      repositoryRoot: repo,
      wikiDir: '/',
      sourceDir,
      assetDir,
      commitSha: 'abc1234',
      npmCi: fakeInstall(),
      runNodeTests: fakeTests(),
      buildWiki: successfulBuild,
    }),
    /refus|danger|unsafe/i,
  );
  await assertLiveUnchanged(live);
});

await testCase('assertPublishableBuild requires a nonzero page count and required pages', async () => {
  const empty = join(root, 'empty-build');
  await mkdir(empty, { recursive: true });
  await writeFile(join(empty, SENTINEL), SENTINEL_BODY);
  await assert.rejects(assertPublishableBuild(empty), /zero wiki pages/);

  const partial = join(root, 'partial-build');
  await mkdir(partial, { recursive: true });
  await writeFile(join(partial, SENTINEL), SENTINEL_BODY);
  await writeFile(join(partial, 'Home.md'), '# 홈\n');
  await assert.rejects(assertPublishableBuild(partial), /Cast-Index/);
});

await testCase('assertInstalledParsers fails closed on a missing entities install', async () => {
  const { repo } = await makeRepo({ pages: requiredPages() });
  await rm(join(repo, 'node_modules', 'entities'), { recursive: true, force: true });
  await assert.rejects(assertInstalledParsers(repo), /missing dependency entities/);
});

await testCase('CLI --no-push never invokes git push', async () => {
  const { repo, sourceDir, assetDir } = await makeRepo({ pages: requiredPages() });
  const live = await makeLiveWiki('cli-no-push');
  const result = spawnSync(process.execPath, [
    publisher,
    '--repo-root', repo,
    '--source-dir', sourceDir,
    '--asset-dir', assetDir,
    '--wiki-dir', live,
    '--commit-sha', 'abc1234',
    '--skip-npm-ci',
    '--skip-tests',
    '--no-push',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /published wiki checkout/);
  assert.ok(await exists(join(live, 'Home.md')));
});

await testCase('CLI invoked through a same-file path alias still runs and rejects unexpected arguments', async () => {
  const aliasDir = join(root, 'cli-path-alias');
  await mkdir(aliasDir, { recursive: true });
  const alias = join(aliasDir, 'publish-wiki.mjs');
  await symlink(publisher, alias);

  const result = spawnSync(process.execPath, [alias, 'not-a-flag'], { encoding: 'utf8' });

  assert.notEqual(result.status, 0, 'path-alias CLI must not exit 0 without running main');
  assert.match(`${result.stdout}${result.stderr}`, /unexpected argument not-a-flag/);
});

await testCase('CLI missing Cast-Index exits nonzero and leaves the live wiki unchanged', async () => {
  const pages = requiredPages();
  delete pages['Cast-Index.md'];
  const { repo, sourceDir, assetDir } = await makeRepo({ pages });
  const live = await makeLiveWiki('cli-missing-index');
  const result = spawnSync(process.execPath, [
    publisher,
    '--repo-root', repo,
    '--source-dir', sourceDir,
    '--asset-dir', assetDir,
    '--wiki-dir', live,
    '--commit-sha', 'abc1234',
    '--skip-npm-ci',
    '--skip-tests',
    '--no-push',
  ], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /Cast-Index/);
  await assertLiveUnchanged(live);
});

for (const name of passed) console.log(`PASS  ${name}`);
for (const { name, error } of failed) {
  console.error(`FAIL  ${name}`);
  console.error(`      ${(error.message ?? String(error)).split('\n').join('\n      ')}`);
}
console.log(`\n${passed.length} passed, ${failed.length} failed`);

if (failed.length > 0) {
  process.exitCode = 1;
  console.error(`fixtures kept for inspection: ${root}`);
} else {
  await rm(root, { recursive: true, force: true });
  console.log(`temp fixtures removed: ${root}`);
  console.log('wiki publisher contract passed');
}
