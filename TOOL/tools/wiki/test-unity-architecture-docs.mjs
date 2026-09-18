import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildWiki } from './build-wiki.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const sourceDirs = [
  join(repositoryRoot, 'LORE'),
  join(repositoryRoot, 'GAME-LOGIC'),
  join(repositoryRoot, 'GDD'),
];
const assetDir = join(repositoryRoot, 'GAME-REFERENCE', 'assets', 'wiki');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'janseon-unity-architecture-wiki-'));
const outputDir = join(temporaryRoot, 'wiki');

const architecturePages = [
  'Unity-System-Design.md',
  'Unity-Architecture-Implementation-Plan.md',
];
const architectureContracts = [
  'FSM',
  'VContainer',
  'Singleton',
  'Repository',
  '저장과 결정성',
  '실패와 취소',
  '품질 게이트',
];

try {
  // buildWiki must create and claim the output root itself: a pre-existing
  // directory without the generated sentinel is refused by design.
  await buildWiki({
    sourceDirs,
    assetDir,
    outputDir,
    commitSha: 'architecture-contract',
  });

  const sidebar = await readFile(join(outputDir, '_Sidebar.md'), 'utf8');
  const home = await readFile(join(outputDir, 'Home.md'), 'utf8');

  for (const page of architecturePages) {
    const wikiName = page.replace(/\.md$/, '');
    const markdown = await readFile(join(outputDir, page), 'utf8');

    assert.match(sidebar, new RegExp(`\\(${wikiName}\\)`), `${page}: missing sidebar link`);
    assert.match(home, new RegExp(`\\(${wikiName}\\)`), `${page}: missing home link`);
    assert.match(markdown, /자동 생성 문서/, `${page}: missing generated banner`);

    for (const contract of architectureContracts) {
      assert.match(markdown, new RegExp(contract), `${page}: missing ${contract} contract`);
    }
  }

  console.log('unity architecture wiki contract passed');
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
