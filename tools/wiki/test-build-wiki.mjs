import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildWiki } from './build-wiki.mjs';

const root = await mkdtemp(join(tmpdir(), 'janseon-wiki-test-'));
const source = join(root, 'docs');
const assets = join(root, 'assets');
const output = join(root, 'wiki');
await mkdir(source, { recursive: true });
await mkdir(assets, { recursive: true });
await writeFile(join(source, 'Home.md'), '# 홈\n\n![그림](../assets/wiki/figure.svg)\n');
await writeFile(join(source, '_Sidebar.md'), '* [홈](Home)\n');
await writeFile(join(assets, 'figure.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');

await buildWiki({ sourceDir: source, assetDir: assets, outputDir: output, commitSha: 'abc1234' });

const home = await readFile(join(output, 'Home.md'), 'utf8');
const sidebar = await readFile(join(output, '_Sidebar.md'), 'utf8');
const figure = await readFile(join(output, 'assets', 'figure.svg'), 'utf8');

assert.match(home, /자동 생성 문서/);
assert.match(home, /원본: `docs\/game-logic\/Home\.md`/);
assert.match(home, /커밋: `abc1234`/);
assert.match(home, /\]\(assets\/figure\.svg\)/);
assert.doesNotMatch(sidebar, /자동 생성 문서/);
assert.match(figure, /<svg/);

for (const banned of ['Kenshi', 'Underrail', 'Gunner']) {
  assert.equal(home.includes(banned), false);
  assert.equal(sidebar.includes(banned), false);
}

console.log('wiki build contract passed');
